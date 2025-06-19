import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../assets/Register.css';

const VerifyMFA = () => {
  const navigate = useNavigate();
  const { userId } = useLocation().state;
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const method = localStorage.getItem('method');

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Code must be 6 digits');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/verify-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code })
      });
      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', userId);
        navigate('/profile');
      } else {
        setError(data.error || 'Invalid or expired code');
      }
    } catch (error) {
      console.error('MFA verification error:', error);
      setError('Server error, try later');
    } finally {
      setIsLoading(false);
    }
  };


  const handleResend = async () => {
    setError('');
    setResendMessage('');
    setResendLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/request-mfa-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();

      if (data.success) {
        setResendMessage('Code resent successfully');
      } else {
        setError(data.error || 'Resend failed');
      }
    } catch (error) {
      console.error('Resend MFA error:', error);
      setError('Server error, try again later');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className='register_wrapper'>
      <button className='back-top' onClick={() => navigate('/setup-mfa')}>
        ← Back
      </button>
      <div className='step-indicator'>Step 3 of 3</div>
      <h2>
        {method === 'totp'
          ? 'Enter code from Google Authenticator'
          : 'Enter verification code'}
      </h2>


      {error && <div className='error-message'>{error}</div>}
      {resendMessage && <div className='info-message'>{resendMessage}</div>}

      <label htmlFor='mfa-code'>6-digit code</label>
      <input
        id='mfa-code'
        type='text'
        maxLength={6}
        className='code-input'
        placeholder='------'
        value={code}
        onChange={e => setCode(e.target.value.replace(/\D/, ''))}
      />

      {method !== 'totp' && (
        <div className='info-link' style={{ marginBottom: '1em' }}>
          Didn't receive the code?{' '}
          <button onClick={handleResend} disabled={resendLoading}>
            {resendLoading ? 'Sending...' : 'Resend'}
          </button>
        </div>
      )}

      <button className='button' onClick={handleVerify} disabled={isLoading}>
        {isLoading ? 'Verifying...' : 'Verify Code'}
      </button>
    </div>
  );
};

export default VerifyMFA;