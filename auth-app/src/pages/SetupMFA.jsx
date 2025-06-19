import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../assets/Register.css';

const SetupMFA = () => {
  const navigate = useNavigate();
  const { userId, email } = useLocation().state;

  const [method, setMethod] = useState('email');
  const [phone, setPhone] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    setError('');
    setIsLoading(true);

    const payload = { userId, method, email };
    if (method === 'sms') {
      if (!phone) {
        setError('Please enter your phone number');
        setIsLoading(false);
        return;
      }
      payload.phone = phone;
    }

    try {
      const res = await fetch('http://localhost:3001/api/setup-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to set up MFA');
      } else {
        if (method === 'totp') {
          setQrUrl(data.qr);
        } else {
          navigate('/verify-mfa', { state: { userId, method } });
        }
      }
    } catch (err) {
      console.error('Setup MFA error:', err);
      setError('Server error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedToVerify = () => {
    navigate('/verify-mfa', { state: { userId, method } });
  };

  return (
    <div className="register_wrapper">
      <button className="back-top" onClick={() => navigate('/register')}>
        ← Back
      </button>
      <div className="step-indicator">Step 2 of 3</div>
      <h2>Set Up MFA</h2>
      <p>Choose how to receive your one-time code:</p>

      <div className="mfa-options">
        <label>
          <input
            type="radio"
            name="mfa"
            value="email"
            checked={method === 'email'}
            onChange={() => setMethod('email')}
          />{' '}
          Email
        </label>

        <label>
          <input
            type="radio"
            name="mfa"
            value="sms"
            checked={method === 'sms'}
            onChange={() => setMethod('sms')}
          />{' '}
          SMS
        </label>

        <label>
          <input
            type="radio"
            name="mfa"
            value="totp"
            checked={method === 'totp'}
            onChange={() => setMethod('totp')}
          />{' '}
          Google Authenticator
        </label>
      </div>

      {method === 'sms' && (
        <div className="field">
          <label>Phone number</label>
          <input
            type="tel"
            placeholder="+1234567890"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
        </div>
      )}

      {method === 'email' && (
        <p>We will send a verification code to <strong>{email}</strong>.</p>
      )}

      {error && <div className="error-message">{error}</div>}

      {!qrUrl && (
        <button className="button" onClick={handleNext} disabled={isLoading}>
          {isLoading ? 'Sending…' : 'Receive Code'}
        </button>
      )}

      {qrUrl && (
        <>
          <p>Scan this QR code with your Google Authenticator app:</p>
          <img src={qrUrl} alt="TOTP QR Code" style={{ width: 200, height: 200 }} />
          <button className="button" onClick={handleProceedToVerify}>
            Proceed to Verify
          </button>
        </>
      )}

      <details style={{ marginTop: '1em' }}>
        <summary>Why enable multi-factor authentication?</summary>
        <ul>
          <li>Adds extra protection to your account</li>
          <li>Prevents access even if password is compromised</li>
          <li>Helps prevent data breaches</li>
        </ul>
      </details>
    </div>
  );
};

export default SetupMFA;
