// frontend/src/pages/LockedPage/LockedPage.jsx
import React, { useState, useEffect } from 'react';
import ProfilePage from '../Profile/Profile'; // <-- Imports your Profile component
import './LockedPage.css'; // <-- Imports the layout styles below

export default function LockedPage() {
  const [passcode, setPasscode] = useState('');
  const [token, setToken] = useState(sessionStorage.getItem('page_token') || '');
  const [secretData, setSecretData] = useState('');
  const [error, setError] = useState('');
  const [isLockedOut, setIsLockedOut] = useState(false); // Tracks lockout UI state

  // Automatically check for a valid session token on load/refresh
  useEffect(() => {
    if (token) {
      fetch('https://project-pvnd.onrender.com/api/protected-data', { //http://localhost:5000/api/protected-data
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Expired');
        return res.json();
      })
      .then(data => setSecretData(data.secretContent))
      .catch(() => {
        // Clear token if it is expired or invalid
        sessionStorage.removeItem('page_token');
        setToken('');
      });
    }
  }, [token]);

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
        sessionStorage.setItem('page_token', data.token);
        setToken(data.token);
      } else {
        setError(data.message);
        if (data.isLockedOut) {
          setIsLockedOut(true); // Disables inputs if server signals a lockout
        }
      }
    } catch (err) {
      setError('Server unreachable. Is your Node.js backend running?');
    }
  };

  // Safe logout function passed down to the Profile page
  const handleLogout = () => {
    sessionStorage.removeItem('page_token');
    setToken('');
    setSecretData('');
    setPasscode('');
  };

  // 🔓 VIEW 1: IF UNLOCKED -> Swap out lock screen and show the profile
  if (token && secretData) {
    return <ProfilePage secretData={secretData} onLogout={handleLogout} />;
  }

  // 🔒 VIEW 2: IF LOCKED -> Render the lock screen UI
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
            disabled={isLockedOut} // Disables input during lockout
          />
          <button 
            type="submit" 
            className="lock-button"
            disabled={isLockedOut} // Disables button during lockout
            style={isLockedOut ? { backgroundColor: '#9ca3af', cursor: 'not-allowed' } : {}}
          >
            {isLockedOut ? 'Locked Out' : 'Authenticate'}
          </button>
        </form>
        
        {error && <p className="lock-error">{error}</p>}
      </div>
    </div>
  );
}
