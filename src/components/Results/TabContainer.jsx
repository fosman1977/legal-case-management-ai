/**
 * Tab Container Component - Week 6 Day 1-2
 * Container for tabbed interface
 */

import React from 'react';

const TabContainer = ({ children }) => {
  const tabs = React.Children.toArray(children);
  const activeTab = tabs.find(tab => tab.props.active);

  return (
    <div className="tab-container">
      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.props.id}
            className={`tab-button ${tab.props.active ? 'active' : ''}`}
            onClick={tab.props.onClick}
            aria-selected={tab.props.active}
            role="tab"
          >
            {tab.props.label}
          </button>
        ))}
      </div>
      
      <div className="tab-content" role="tabpanel">
        {activeTab && activeTab.props.children}
      </div>
    </div>
  );
};

export default TabContainer;