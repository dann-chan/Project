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
  const [isLoading, setIsLoading] = useState(false); // ⏳ Track loading state
  const [showPassword, setShowPassword] = useState(false); // 👁️ Track visibility toggle

  // Automatically check for a valid session token on load/refresh
  useEffect(() => {
    if (token) {
      fetch('https://onrender.com', { 
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

  // Handle the visual lockout countdown timer
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
    if (!passcode.trim()) return; // Don't submit blank text
    
    setError('');
    setIsLoading(true); // Start loading indicator

    try {
      const response = await fetch('https://onrender.com', {
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
    } finally {
      setIsLoading(false); // Stop loading indicator no matter what
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

  // Determine button text contextually
  const getButtonText = () => {
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
          {/* Input container wrapped for positioning the toggle icon */}
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
            {!isLockedOut && passcode && (
              <button
                type="button"
                className="lock-toggle-visible"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide passcode" : "Show passcode"}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            )}
          </div>

          <button 
            type="submit" 
            className="lock-button"
            disabled={isLockedOut || isLoading} 
          >
            {isLoading && <span className="lock-spinner"></span>}
            {getButtonText()}
          </button>
        </form>
        
        {error && <p className="lock-error">{error}</p>}
      </div>
    </div>
  );
}
