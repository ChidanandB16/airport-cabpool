import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// Theme preview: ?theme=navy | sage | signal (default amethyst)
const t = new URLSearchParams(location.search).get('theme');
if (t) document.documentElement.dataset.theme = t;

createRoot(document.getElementById('root')).render(<App />);
