import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async event => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Login failed');
        return;
      }      

      localStorage.setItem('userId', data.userId);
      localStorage.setItem('email', email);
      localStorage.setItem('method', data.method);

      const otpResponse = await fetch('http://localhost:3001/api/request-mfa-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.userId })
      });
      const otpData = await otpResponse.json();

      if (!otpData.success) {
        setError(otpData.error || 'Failed to send code');
        return;
      }

      navigate('/verify-mfa', { state: { userId: data.userId } });
    } catch (error) {
      console.error('Login error:', error);
      setError('Server error, please try again later');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='login-box'>
      <button className='back-top' onClick={() => navigate('/')}>← Back</button>
      <h2>Log In</h2>

      {error && <div className='error-message'>{error}</div>}

      <form onSubmit={handleLogin}>
        <label htmlFor='email'>Email address</label>
        <input
          type='email'
          id='email'
          required
          placeholder='you@example.com'
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <label htmlFor='password'>Password</label>
        <div className='password-wrapper'>
          <input
            type='password'
            id='password'
            required
            placeholder='Enter password'
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <button className='button' type='submit' disabled={isLoading}>
          {isLoading ? 'Sending code…' : 'Send Code'}
        </button>
      </form>

      <div className='info-link'>
        Don't have an account? <a href='/register'>Sign up</a>
      </div>
    </div>
  );
};

export default Login;