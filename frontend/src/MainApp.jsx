// frontend/src/MainApp.jsx
import React from 'react';
import LockedPage from './pages/LockedPage/LockedPage'; // <-- Imports the passcode gatekeeper folder

export default function MainApp() {
  return (
    <div className="MainApp-Wrapper">
      {/* 
        The app renders the lock screen component right away.
        Once the correct passcode is confirmed, LockedPage handles swapping out 
        the interface to show the Profile page.
      */}
      <LockedPage />
    </div>
  );
}
