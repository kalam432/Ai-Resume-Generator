/**
 * Layout Component
 * 
 * Main layout wrapper for the application with:
 * - Header with branding
 * - Navigation
 * - Content area
 * - Footer
 * - Health status indicator
 * 
 * Provides consistent structure across all feature pages.
 */

import { useState, useEffect } from 'react';
import Navigation from './Navigation';
import './Layout.css';
import api from '../services/apiService';

function Layout({ children, activeTab, onTabChange }) {
  const [backendStatus, setBackendStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    // Check backend health on mount
    const checkHealth = async () => {
      try {
        const health = await api.checkBackendHealth();
        setBackendStatus({
          ok: true,
          message: health.message,
        });
      } catch (error) {
        setBackendStatus({
          ok: false,
          message: error.message,
        });
      } finally {
        setStatusLoading(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <div className="header-text">
            <h1>AI Resume & Job Description Generator</h1>
            <p>Powered by Google Gemini | Intelligent Career Tool</p>
          </div>
          <div className={`header-status ${statusLoading ? 'loading' : backendStatus?.ok ? 'ok' : 'error'}`}>
            {statusLoading ? (
              <span>Checking backend...</span>
            ) : backendStatus?.ok ? (
              <span>✓ Backend ready</span>
            ) : (
              <span>✗ Backend error</span>
            )}
          </div>
        </div>
      </header>

      <Navigation activeTab={activeTab} onTabChange={onTabChange} />

      <main className="main-content">
        {children}
      </main>

      <footer className="footer">
        <p>AI Resume Generator | Phase 5 - Frontend Integration</p>
        {!statusLoading && backendStatus && (
          <p className="footer-status">
            Backend status: {backendStatus.ok ? `✓ ${backendStatus.message}` : `✗ ${backendStatus.message}`}
          </p>
        )}
      </footer>
    </div>
  );
}

export default Layout;
