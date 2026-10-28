/**
 * Navigation Component
 * 
 * Provides tab-based navigation between three main features:
 * - Resume Generator
 * - Job Description Generator
 * - Resume-Job Matcher
 * 
 * Highlights the currently active tab and handles tab switching.
 */

import './Navigation.css';

function Navigation({ activeTab, onTabChange }) {
  const tabs = [
    {
      id: 'resume',
      label: 'Resume Generator',
      icon: '📄',
    },
    {
      id: 'job',
      label: 'Job Description',
      icon: '💼',
    },
    {
      id: 'matcher',
      label: 'Resume-Job Matcher',
      icon: '🎯',
    },
  ];

  return (
    <nav className="navigation">
      <div className="nav-container">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            aria-selected={activeTab === tab.id}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export default Navigation;
