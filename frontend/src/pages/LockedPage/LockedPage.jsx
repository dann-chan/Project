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
  const [countdown, setCountdown] = useState(0); 
  const [isLoading, setIsLoading] = useState(false); // ⏳ Tracks active server checking state
  const [showPassword, setShowPassword] = useState(false); // 👁️ Tracks show/hide visibility toggle

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
          setError(''); 
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
    if (!passcode.trim()) return; // Prevent empty submissions

    setError('');
    setIsLoading(true); // Toggle loading spinner active

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
          
          // 🛡️ Safe match processing to prevent null pointer index crashes
          const matchResult = data.message ? data.message.match(/\d+/) : null;
          const secondsLeft = matchResult ? parseInt(matchResult[0], 10) : 300;
          setCountdown(secondsLeft);
        }
      }
    } catch (err) {
      console.error("Authentication submission error details:", err);
      setError('Server unreachable. Is your Node.js backend running?');
    } finally {
      setIsLoading(false); // Toggle loading spinner inactive
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('page_token');
    setToken('');
    setSecretData('');
    setPasscode('');
    setShowPassword(false);
  };

  // 🔓 VIEW 1: IF UNLOCKED
  if (token && secretData) {
    return <ProfilePage secretData={secretData} onLogout={handleLogout} />;
  }

  // Helper handling of dynamic button label variants
  const renderButtonContent = () => {
    if (isLockedOut) return `Locked (${countdown}s)`;
    if (isLoading) return 'Verifying...';
    return 'Authenticate';
  };

  // 🔒 VIEW 2: IF LOCKED
  return (
    <div className="lock-container">
      <div className="lock-card">
        <div className="lock-icon">{isLockedOut ? '⏳' : '🔒'}</div>
        <h1 className="lock-title">Profile Locked</h1>
        <p className="lock-subtitle">Please enter the passcode to unlock Danny's profile.</p>
        <p className="lock-note">(May take up to 30 seconds if the server fell asleep)</p>
        
        <form onSubmit={handleSubmit} className="lock-form">
          <div className="lock-input-wrapper">
            <input 
              type={showPassword ? 'text' : 'password'} 
              placeholder={showPassword ? 'passcode' : '•••••'} 
              value={passcode} 
              onChange={(e) => setPasscode(e.target.value)} 
              className="lock-input"
              maxLength={12}
              disabled={isLockedOut || isLoading} 
            />
          {/* Display professional visibility toggle only when characters are present and app isn't locked */}
          {!isLockedOut && passcode && (
            <button
              type="button"
              className="lock-toggle-visible"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide passcode" : "Show passcode"}
            >
              {showPassword ? (
                /* 🙈 PROFESSIONAL HIDE ICON (Eye with Slash) */
                <svg xmlns="http://w3.org" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                  <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                  <line x1="2" y1="2" x2="22" y2="22"></line>
                </svg>
              ) : (
                /* 👁️ PROFESSIONAL SHOW ICON (Open Eye) */
                <svg xmlns="http://w3.org" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          )}
          </div>
          
          <button 
            type="submit" 
            className="lock-button"
            disabled={isLockedOut || isLoading} 
          >
            {isLoading && <span className="lock-spinner"></span>}
            {renderButtonContent()}
          </button>
        </form>
        
        {error && <p className="lock-error">{error}</p>}
      </div>
    </div>
  );
}
