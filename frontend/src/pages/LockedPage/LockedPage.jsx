// frontend/src/pages/LockedPage/LockedPage.jsx
import React, { useState, useEffect } from 'react';
import ProfilePage from '../Profile/Profile'; 
import './LockedPage.css'; 

export default function LockedPage() {
  const [passcode, setPasscode] = useState('');
  const [token, setToken] = useState(sessionStorage.getItem('page_token') || '');
  const [secretData, setSecretData] = useState('');
  const [error, setError] = useState('');
  const [isLockedOut, setIsLockedOut] = useState(false); 
  const [countdown, setCountdown] = useState(0); // Tracks remaining lockout seconds

  // Automatically check for a valid session token on load/refresh
  useEffect(() => {
    if (token) {
      fetch('https://project-pvnd.onrender.com/api/protected-data', { 
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Expired');
        return res.json();
      })
      .then(data => setSecretData(data.secretContent))
      .catch(() => {
        sessionStorage.removeItem('page_token');
        setToken('');
      });
    }
  }, [token]);

  // ⏱️ Handle the visual lockout countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setIsLockedOut(false);
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setIsLockedOut(false);
          setError(''); // Clear the lockout error message when time expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // Handle the form submission when user enters a passcode
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('https://project-pvnd.onrender.com/api/verify-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });
      const data = await response.json();

      if (data.success) {
        setIsLockedOut(false);
        setCountdown(0);
        sessionStorage.setItem('page_token', data.token);
        setToken(data.token);
      } else {
        setError(data.message);
        
        if (data.isLockedOut) {
          setIsLockedOut(true);
          const secondsLeft = data.message.match(/\d+/) 
            ? parseInt(data.message.match(/\d+/)[0], 10) 
            : 300;
          setCountdown(secondsLeft);
        }
      }
    } catch (err) {
      setError('Server unreachable. Is your Node.js backend running?');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('page_token');
    setToken('');
    setSecretData('');
    setPasscode('');
  };

  // 🔓 VIEW 1: IF UNLOCKED
  if (token && secretData) {
    return <ProfilePage secretData={secretData} onLogout={handleLogout} />;
  }

  // 🔒 VIEW 2: IF LOCKED
  return (
    <div className="lock-container">
      <div className="lock-card">
        <div className="lock-icon">{isLockedOut ? '⏳' : '🔒'}</div>
        <h1 className="lock-title">Profile Locked</h1>
        <p className="lock-subtitle">Please enter the passcode to unlock Danny's profile.</p>
        <p className="lock-note">(May take up to 30 seconds if the server fell asleep)</p>
        
        <form onSubmit={handleSubmit} className="lock-form">
          <input 
            type="password" 
            placeholder="•••••" 
            value={passcode} 
            onChange={(e) => setPasscode(e.target.value)} 
            className="lock-input"
            maxLength={12}
            disabled={isLockedOut} 
          />
          <button 
            type="submit" 
            className="lock-button"
            disabled={isLockedOut} 
          >
            {isLockedOut ? `Locked (${countdown}s)` : 'Authenticate'}
          </button>
        </form>
        
        {error && <p className="lock-error">{error}</p>}
      </div>
    </div>
  );
}
