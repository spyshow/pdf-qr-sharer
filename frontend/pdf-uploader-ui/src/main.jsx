import React from 'react'; // Changed from { StrictMode }
import ReactDOM from 'react-dom/client'; // Changed from { createRoot }
import App from './App.jsx';
import 'antd/dist/reset.css'; // Added
import './index.css'; // Kept

// The example uses ReactDOM.createRoot, my previous read_files showed createRoot directly imported.
// I will stick to the ReactDOM.createRoot pattern from the example.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode> {/* Ensured StrictMode is here as per example, was already there */}
    <App />
  </React.StrictMode>,
);
