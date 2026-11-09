import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App';
import './index.css';

// A11y & Form Autofill Guard: Auto-assigns id, name, and aria-label to unlabelled form controls
if (typeof window !== 'undefined') {
  let fieldSeq = 1;
  const sanitize = (str, fallback) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '') || fallback;
  const auditNode = (el) => {
    if (!el || !el.matches || !el.matches('input, select, textarea')) return;
    const base = el.placeholder || el.getAttribute('aria-label') || el.title || el.type || 'field';
    const clean = sanitize(base, 'field');
    if (!el.getAttribute('name')) el.setAttribute('name', clean);
    if (!el.id) {
      let candidate = clean;
      if (document.getElementById(candidate)) candidate = `${clean}_${fieldSeq++}`;
      el.id = candidate;
    }
    if (!el.getAttribute('aria-label') && el.placeholder) el.setAttribute('aria-label', el.placeholder);
  };

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1) {
          auditNode(node);
          node.querySelectorAll?.('input, select, textarea').forEach(auditNode);
        }
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.querySelectorAll('input, select, textarea').forEach(auditNode);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        theme="dark"
      />
    </BrowserRouter>
  </React.StrictMode>
);
