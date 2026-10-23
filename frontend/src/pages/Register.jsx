
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrImage, setQrImage] = useState('');
  const [manualCode, setManualCode] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Password check - professor requirement
      if (password.length < 8) {
        throw new Error('Password must be 8+ characters with symbol');
      }

      const res = await register(name, email, password);

      // This is where QR IMAGE comes from backend
      if (res.qrImage) {
        setQrImage(res.qrImage);
        setManualCode(res.manualCode);
        // Give user 10 sec to scan, then go to login
        setTimeout(() => navigate('/login'), 10000);
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'black', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h1 style={{ textAlign: 'center', fontSize: 28, fontWeight: 'bold' }}>ApexCore Bank</h1>
        <p style={{ textAlign: 'center', fontSize: 13, opacity: 0.7 }}>Week 4 - Secure Registration</p>

        {error && (
          <div role="alert" style={{ background: '#ff0000', color: 'white', padding: 10, borderRadius: 6, fontSize: 12 }}>
            {error}
          </div>
        )}

        {/* QR IMAGE SECTION - replaces long otpauth:// code */}
        {qrImage && (
          <div style={{ background: 'white', padding: 16, borderRadius: 8, textAlign: 'center', border: '2px solid #00ff00' }}>
            <p style={{ fontWeight: 'bold', fontSize: 13, color: 'black' }}>Scan this in Google Authenticator</p>
            <img src={qrImage} alt="2FA QR Code" style={{ width: 220, height: 220, margin: '10px auto', display: 'block' }} />
            <p style={{ fontSize: 10, wordBreak: 'break-all', marginTop: 8, color: 'black' }}>Manual code: {manualCode}</p>
            <p style={{ fontSize: 11, color: 'green', marginTop: 8, fontWeight: 'bold' }}>Redirecting to login in 10s...</p>
          </div>
        )}

        {!qrImage && (
          <>
            <div>
              <label htmlFor="name" style={{ fontSize: 12 }}>Full Name</label>
              <input id="name" aria-label="Full Name" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid gray', background: '#111', color: 'white' }} />
            </div>

            <div>
              <label htmlFor="email" style={{ fontSize: 12 }}>Email</label>
              <input id="email" type="email" aria-label="Email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid gray', background: '#111', color: 'white' }} />
            </div>

            <div>
              <label htmlFor="password" style={{ fontSize: 12 }}>Password (8+ chars, symbol, upper, lower, number)</label>
              <input id="password" type="password" aria-label="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid gray', background: '#111', color: 'white' }} />
            </div>

            <button type="submit" disabled={loading} style={{ background: loading ? 'gray' : 'white', color: 'black', padding: 12, borderRadius: 6, fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Creating...' : 'Create Secure Account'}
            </button>
          </>
        )}

        <Link to="/login" style={{ textAlign: 'center', fontSize: 12, color: '#888', marginTop: 8 }}>Already have account? Login</Link>
      </form>
    </div>
  );
}

export default Register;