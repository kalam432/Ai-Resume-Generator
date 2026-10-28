import { useState } from 'react';
import Layout from './components/Layout';
import ResumeGenerator from './components/ResumeGenerator';
import JobGenerator from './components/JobGenerator';
import Matcher from './components/Matcher';

/**
 * Main App component for AI Resume Generator.
 * Phase 5: Frontend integration with Layout, Navigation, and Feature Components
 * 
 * Routes between three main features:
 * - Resume Generator
 * - Job Description Generator
 * - Resume-Job Matcher
 */
function App() {
  const [activeTab, setActiveTab] = useState('resume');

  const renderContent = () => {
    switch (activeTab) {
      case 'resume':
        return <ResumeGenerator />;
      case 'job':
        return <JobGenerator />;
      case 'matcher':
        return <Matcher />;
      default:
        return <ResumeGenerator />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default App;
