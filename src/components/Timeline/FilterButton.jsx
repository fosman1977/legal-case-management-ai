/**
 * Filter Button Component - Week 6 Day 3-4
 * Filter buttons for timeline events
 */

import React from 'react';

const FilterButton = ({ filter, active, onClick, children }) => {
  return (
    <button
      className={`filter-button ${active ? 'active' : ''}`}
      onClick={onClick}
      data-filter={filter}
    >
      {children}
    </button>
  );
};

export default FilterButton;