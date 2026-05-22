import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import axios from 'axios';

// Direct connection to your server.js fallback port
axios.defaults.baseURL = 'https://smmb.vercel.app/api/socials/callback/handle';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
