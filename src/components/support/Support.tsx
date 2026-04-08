import React, { useState } from 'react';
import { Heart, HelpCircle } from 'lucide-react';
import HorizontalTabs from '../common/HorizontalTabs';
import AboutPage from './AboutPage';
import HelpPage from './HelpPage';

const Support: React.FC = () => {
  const [activeTab, setActiveTab] = useState('about');

  const tabs = [
    { id: 'about', label: '关于', icon: <Heart size={18} /> },
  ];

  return (
    <div className="feature-container">
      <h1 className="feature-title">技术支持</h1>
      <p className="feature-description">
        获取软件信息和使用帮助
      </p>

      <HorizontalTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="tab-content">
        {activeTab === 'about' && <AboutPage />}
        {activeTab === 'help' && <HelpPage />}
      </div>
    </div>
  );
};

export default Support;
