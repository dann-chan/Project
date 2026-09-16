import React, { useState } from 'react';
import './LockedPage.css';
import Profile from '../Profile/Profile';

const LockedPage = () => {
  const [passcode, setPasscode] = useState('');
  const [token, setToken] = useState(() => sessionStorage.getItem('page_token'));
  const [error, setError] = useState('');
  const [isLockedOut, setIsLockedOut] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/verify-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setIsLockedOut(false);
        sessionStorage.setItem('page_token', data.token);
        setToken(data.token);
        return;
      }

      setError(data.message || 'Incorrect passcode. Try again.');
      if (response.status === 429 || data.isLockedOut) {
        setIsLockedOut(true);
      }
    } catch (requestError) {
      setError('Server unreachable. Is your Node.js backend running?');
    }
  };

  if (token) {
    return <Profile />;
  }

  return (
    <div className="lock-container">
      <div className="lock-card">
        <div className="lock-icon">{isLockedOut ? '⏳' : '🔒'}</div>
        <h1 className="lock-title">Restricted Access</h1>
        <p className="lock-subtitle">Please enter your authentication credentials to unlock this portal.</p>

        <form onSubmit={handleSubmit} className="lock-form">
          <input
            type="password"
            placeholder="•••••"
            value={passcode}
            onChange={(event) => setPasscode(event.target.value)}
            className="lock-input"
            maxLength={12}
            disabled={isLockedOut}
          />
          <button
            type="submit"
            className="lock-button"
            disabled={isLockedOut}
            style={isLockedOut ? { backgroundColor: '#9ca3af', cursor: 'not-allowed' } : {}}
          >
            {isLockedOut ? 'Locked Out' : 'Authenticate'}
          </button>
        </form>

        {error && <p className="lock-error">{error}</p>}
      </div>
    </div>
  );
};

export default LockedPage;
