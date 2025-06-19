import crypto from 'crypto';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import argon2 from 'argon2';
import { neon } from '@neondatabase/serverless';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { log } from 'console';

dotenv.config();

const {
  DATABASE_URL,
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_SECURE,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,
  JWT_SECRET,
  PORT = 3001
} = process.env;

const sql = neon(DATABASE_URL);
const app = express();

app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: Number(EMAIL_PORT),
  secure: EMAIL_SECURE === 'true',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));
const CODE_EXPIRY_MS = 5 * 60 * 1000;

const sendMfaCode = async (userId, email) => {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS);

  await sql`
    INSERT INTO mfa_codes (user_id, code, expires_at)
    VALUES (${userId}, ${code}, ${expiresAt})
  `;

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: email,
    subject: 'MFA Verification Code',
    text: `Your verification code is ${code}`
  });
};

const handleError = (res, error, message = 'Server error', status = 500) => {
  console.error(message, error);
  res.status(status).json({ success: false, error: message });
};

app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hash = await argon2.hash(password, { salt: crypto.randomBytes(16) });
    const [{ id: userId }] = await sql`
      INSERT INTO users (email, password_hash, created_at)
      VALUES (${email}, ${hash}, NOW())
      RETURNING id
    `;
    res.status(201).json({ success: true, userId });
  } catch (error) {
    handleError(res, error, 'Database error');
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [user] = await sql`
      SELECT id, password_hash, mfa_method FROM users WHERE email = ${email}
    `;

    if (!user || !(await argon2.verify(user.password_hash, password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    if (user.mfa_method == 'totp') {
      return res.json({
        success: true,
        userId: user.id,
        method: 'totp'
      });
    } else {
      res.json({ success: true, userId: user.id, method: user.mfa_method });
    }
  } catch (error) {
    handleError(res, error);
  }
});


app.post('/api/setup-mfa', async (req, res) => {
  const { userId, email, method, phone } = req.body;
  try {
    await sql`UPDATE users SET mfa_method = ${method} WHERE id = ${userId}`;

    if (method === 'totp') {
      const secret = speakeasy.generateSecret({ name: `OpenLesson (${email})` });
      await sql`UPDATE users SET totp_secret = ${secret.base32} WHERE id = ${userId}`;
      const qr = await qrcode.toDataURL(secret.otpauth_url);
      return res.json({ success: true, qr });
    }

    if (method === 'sms') {
      console.log(`Simulating SMS to ${phone}: code is 123456`);
      const code = '123456';
      const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS);
      await sql`
        INSERT INTO mfa_codes (user_id, code, expires_at)
        VALUES (${userId}, ${code}, ${expiresAt})
      `;
      return res.json({ success: true });
    }

    await sendMfaCode(userId, email);
    res.json({ success: true });
  } catch (error) {
    handleError(res, error, 'MFA setup failed');
  }
});


app.post('/api/request-mfa-code', async (req, res) => {
  const { userId } = req.body;
  try {
    const [user] = await sql`
      SELECT email, mfa_method FROM users WHERE id = ${userId}
    `;
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.mfa_method == 'totp') {
      return res.json({ success: true, method: 'totp' });
    } else if (user.mfa_method == 'sms') {
      const code = '123456';
      const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS);
      await sql`
        INSERT INTO mfa_codes (user_id, code, expires_at)
        VALUES (${userId}, ${code}, ${expiresAt})
      `;
      console.log(`Simulated SMS to user ${userId}: code = ${code}`);
      return res.json({ success: true, method: 'sms' });
    } else {
      await sendMfaCode(userId, user.email);
      res.json({ success: true, method: 'email' });
    }
  } catch (error) {
    handleError(res, error, 'MFA code request failed');
  }
});


app.post('/api/verify-mfa', async (req, res) => {
  const { userId, code } = req.body;
  try {
    const [user] = await sql`SELECT mfa_method, email, totp_secret FROM users WHERE id = ${userId}`;
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.mfa_method === 'totp') {
      const verified = speakeasy.totp.verify({
        secret: user.totp_secret,
        encoding: 'base32',
        token: code
      });
      if (!verified) {
        return res.status(401).json({ success: false, error: 'Invalid TOTP code' });
      }
    } else {
      const [record] = await sql`
        SELECT code, expires_at FROM mfa_codes
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 1
      `;
      if (!record || new Date() > record.expires_at || record.code !== code) {
        return res.status(401).json({ success: false, error: 'Invalid or expired code' });
      }
      await sql`DELETE FROM mfa_codes WHERE user_id = ${userId}`;
    }

    await sql`UPDATE users SET is_mfa_pending = false WHERE id = ${userId}`;
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, token });
  } catch (error) {
    handleError(res, error, 'MFA verification failed');
  }
});


app.post('/api/profile', async (req, res) => {
  const { userId, fullName, studentId, dob, mfaMethod } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, error: 'Missing userId' });
  }
  try {
    await sql`
      UPDATE users SET
        full_name     = ${fullName},
        student_id    = ${studentId},
        date_of_birth = ${dob},
        mfa_method    = ${mfaMethod}
      WHERE id = ${userId}
    `;
    res.json({ success: true });
  } catch (error) {
    handleError(res, error, 'Profile update failed');
  }
});

app.get('/api/profile/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [user] = await sql`
      SELECT full_name, student_id, date_of_birth, mfa_method
      FROM users
      WHERE id = ${userId}
    `;
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({
      success: true,
      fullName: user.full_name,
      studentId: user.student_id,
      dob: user.date_of_birth,
      mfaMethod: user.mfa_method
    });
  } catch (error) {
    handleError(res, error, 'Profile fetch failed');
  }
});

app.use((err, req, res, next) => {
  handleError(res, err);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
