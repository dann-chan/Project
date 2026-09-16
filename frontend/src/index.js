// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Global global styles if you have any
import MainApp from './MainApp'; // <-- Imports your actual React workspace root

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* This boots up your main workspace layer */}
    <MainApp /> 
  </React.StrictMode>
);
