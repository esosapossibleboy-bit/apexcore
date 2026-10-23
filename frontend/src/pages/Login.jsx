import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [tokenError, setTokenError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const validateToken = (value) => {
    if (!/^\d{6}$/.test(value)) {
      setTokenError('Token must be 6 digits');
      return false;
    }
    setTokenError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateToken(token)) return;
    try {
      await login(email, password, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e1f', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
      <form onSubmit={handleSubmit} style={{ background: 'white', padding: 32, borderRadius: 24, width: 400, display: 'flex', flexDirection: 'column', gap: 12 }}>
        
        {/* NEW CODE - Registration style Bank Name */}
        <h1 style={{ textAlign: 'center', fontSize: '36px', fontWeight: 'bold', lineHeight: '1.1', color: 'black', margin: 0, fontFamily: 'serif' }}>
          ApexCore<br/>Bank<sup style={{ fontSize: '18px' }}>TM</sup>
        </h1>
        <h3 style={{ textAlign: 'center', margin: '12px 0 16px 0', fontSize: '20px', fontWeight: 'bold', color: 'black', fontFamily: 'serif' }}>
          Secure Login
        </h3>
        
        <label htmlFor="email" style={{ fontSize: '14px' }}>Email</label>
        <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} aria-label="Email address" style={{ padding: 12, borderRadius: 12, border: '1px solid #ccc' }} />
        
        <label htmlFor="password" style={{ fontSize: '14px' }}>Password</label>
        <input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} aria-label="Password" style={{ padding: 12, borderRadius: 12, border: '1px solid #ccc' }} />
        
        <label htmlFor="mfa" style={{ fontSize: '14px' }}>MFA Token (6 digits)</label>
        <input id="mfa" type="text" inputMode="numeric" maxLength={6} required value={token} onChange={e => { setToken(e.target.value); validateToken(e.target.value); }} aria-label="Multi-factor token" aria-invalid={!!tokenError} style={{ padding: 12, borderRadius: 12, border: tokenError ? '1px solid red' : '1px solid #ccc' }} />
        {tokenError && <span role="alert" style={{ color: 'red', fontSize: 12 }}>{tokenError}</span>}
        
        {error && <p role="alert" style={{ color: 'red', fontSize: 13, textAlign: 'center' }}>{error}</p>}
        
        <button type="submit" style={{ padding: 12, background: 'black', color: 'white', borderRadius: 12, fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: 8 }}>Login with MFA</button>
        <p style={{ textAlign: 'center', fontSize: 13 }}>No account? <Link to="/register">Register</Link></p>
      </form>
    </div>
  );
}