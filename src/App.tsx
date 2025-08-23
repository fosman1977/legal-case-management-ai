import React from 'react';

// PHASE 1 SIMPLIFICATION: Replace complex app with simplified workflow
import { SimplifiedBarristerApp } from './SimplifiedBarristerApp';

// Week 17 Accessibility Integration
import '../src/accessibility/accessibility.css';

/**
 * PHASE 1 SIMPLIFICATION COMPLETE
 * 
 * This replaces the complex 50+ feature app with a focused 4-section workflow:
 * Cases → Analyze → Insights → Privacy
 * 
 * Following Development Strategy Guide:
 * - Removed feature creep (Calendar, Authorities, Pleadings, etc.)
 * - Focus on core document analysis workflow  
 * - "Friday brief to Monday court preparation" user journey
 */
export default function App() {
  return <SimplifiedBarristerApp />;
}