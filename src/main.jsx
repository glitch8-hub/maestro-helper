import React from 'react';
import ReactDOM from 'react-dom/client';
import './syncStore.js'; // installs window.storage before App mounts
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
