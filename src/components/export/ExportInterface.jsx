/**
 * Export Interface - Week 15 Day 5
 * Professional export functionality with templates and formats
 */

import React, { useState } from 'react';
import { useTheme } from '../../design/ThemeProvider.jsx';
import Card, { CardHeader, CardContent } from '../../design/components/Card.jsx';
import Button from '../../design/components/Button.jsx';

// Icon Components
const DocumentIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const DocumentTextIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const TableCellsIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CodeBracketIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
  </svg>
);

const CheckIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

// Template Option Component
const TemplateOption = ({ template, selected, onClick }) => {
  const { tokens } = useTheme();
  
  const optionStyles = {
    padding: tokens.spacing[4],
    border: `2px solid ${selected ? tokens.colors.primary[500] : tokens.colors.neutral[200]}`,
    borderRadius: tokens.borderRadius.lg,
    backgroundColor: selected ? tokens.colors.primary[50] : tokens.colors.neutral[50],
    cursor: 'pointer',
    transition: tokens.transitions.all
  };

  return (
    <div onClick={onClick} style={optionStyles}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{
            fontSize: tokens.typography.fontSize.sm,
            fontWeight: tokens.typography.fontWeight.medium,
            color: tokens.colors.neutral[900],
            margin: 0,
            marginBottom: tokens.spacing[1]
          }}>
            {template.name}
          </h4>
          <p style={{
            fontSize: tokens.typography.fontSize.xs,
            color: tokens.colors.neutral[600],
            margin: 0,
            marginBottom: tokens.spacing[2]
          }}>
            {template.description}
          </p>
          <span style={{
            fontSize: tokens.typography.fontSize.xs,
            color: tokens.colors.primary[600],
            fontWeight: tokens.typography.fontWeight.medium
          }}>
            {template.suitable_for}
          </span>
        </div>
        {selected && (
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: tokens.colors.primary[500],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckIcon style={{ width: '12px', height: '12px', color: 'white' }} />
          </div>
        )}
      </div>
    </div>
  );
};

// Format Option Component
const FormatOption = ({ format, selected, onChange }) => {
  const { tokens } = useTheme();
  
  const optionStyles = {
    display: 'flex',
    alignItems: 'center',
    padding: tokens.spacing[3],
    border: `1px solid ${tokens.colors.neutral[200]}`,
    borderRadius: tokens.borderRadius.md,
    backgroundColor: tokens.colors.neutral[50]
  };

  const checkboxStyles = {
    width: '20px',
    height: '20px',
    marginRight: tokens.spacing[3],
    cursor: 'pointer'
  };

  return (
    <label style={optionStyles}>
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => onChange(e.target.checked)}
        style={checkboxStyles}
      />
      <format.icon style={{ 
        width: '24px', 
        height: '24px', 
        color: tokens.colors.neutral[500],
        marginRight: tokens.spacing[3]
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[2] }}>
          <span style={{
            fontSize: tokens.typography.fontSize.sm,
            fontWeight: tokens.typography.fontWeight.medium,
            color: tokens.colors.neutral[900]
          }}>
            {format.name}
          </span>
          {format.recommended && (
            <span style={{
              fontSize: tokens.typography.fontSize.xs,
              padding: `${tokens.spacing[0.5]} ${tokens.spacing[2]}`,
              backgroundColor: tokens.colors.success[100],
              color: tokens.colors.success[700],
              borderRadius: tokens.borderRadius.full,
              fontWeight: tokens.typography.fontWeight.medium
            }}>
              Recommended
            </span>
          )}
        </div>
        <p style={{
          fontSize: tokens.typography.fontSize.xs,
          color: tokens.colors.neutral[600],
          margin: 0,
          marginTop: tokens.spacing[1]
        }}>
          {format.description}
        </p>
      </div>
    </label>
  );
};

// Option Toggle Component
const OptionToggle = ({ label, description, checked, onChange }) => {
  const { tokens } = useTheme();
  
  const toggleStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };

  const switchStyles = {
    position: 'relative',
    width: '48px',
    height: '24px',
    backgroundColor: checked ? tokens.colors.primary[500] : tokens.colors.neutral[300],
    borderRadius: tokens.borderRadius.full,
    cursor: 'pointer',
    transition: tokens.transitions.colors
  };

  const knobStyles = {
    position: 'absolute',
    top: '2px',
    left: checked ? '26px' : '2px',
    width: '20px',
    height: '20px',
    backgroundColor: 'white',
    borderRadius: '50%',
    transition: tokens.transitions.all,
    boxShadow: tokens.shadows.sm
  };

  return (
    <div style={toggleStyles}>
      <div style={{ flex: 1 }}>
        <label style={{
          fontSize: tokens.typography.fontSize.sm,
          fontWeight: tokens.typography.fontWeight.medium,
          color: tokens.colors.neutral[900],
          display: 'block',
          marginBottom: tokens.spacing[1]
        }}>
          {label}
        </label>
        <p style={{
          fontSize: tokens.typography.fontSize.xs,
          color: tokens.colors.neutral[600],
          margin: 0
        }}>
          {description}
        </p>
      </div>
      <div 
        onClick={() => onChange(!checked)}
        style={switchStyles}
      >
        <div style={knobStyles} />
      </div>
    </div>
  );
};

// Main Export Interface Component
export const ExportInterface = ({ analysis, insights, case_context }) => {
  const { tokens } = useTheme();
  const [selectedTemplate, setSelectedTemplate] = useState('client_report');
  const [selectedFormats, setSelectedFormats] = useState(['pdf']);
  const [exportOptions, setExportOptions] = useState({
    include_insights: true,
    include_timeline: true,
    include_confidence_scores: false,
    client_ready: true
  });

  const exportFormats = [
    {
      id: 'pdf',
      name: 'PDF Report',
      description: 'Professional PDF suitable for court use',
      icon: DocumentIcon,
      recommended: true
    },
    {
      id: 'word',
      name: 'Word Document',
      description: 'Editable Word document for further work',
      icon: DocumentTextIcon
    },
    {
      id: 'excel',
      name: 'Excel Spreadsheet',
      description: 'Data tables and timeline in Excel format',
      icon: TableCellsIcon
    },
    {
      id: 'json',
      name: 'JSON Data',
      description: 'Raw analysis data for technical integration',
      icon: CodeBracketIcon
    }
  ];

  const exportTemplates = [
    {
      id: 'chronology',
      name: 'Case Chronology',
      description: 'Court-ready chronology of events',
      suitable_for: 'Court submissions'
    },
    {
      id: 'skeleton',
      name: 'Skeleton Argument Framework',
      description: 'Structure for skeleton argument preparation',
      suitable_for: 'Barrister preparation'
    },
    {
      id: 'client_report',
      name: 'Client Advisory Report',
      description: 'Professional client-facing analysis',
      suitable_for: 'Client meetings'
    },
    {
      id: 'evidence_schedule',
      name: 'Evidence Schedule',
      description: 'Organized list of evidence items',
      suitable_for: 'Case management'
    }
  ];

  const handleExport = (template, formats, options) => {
    console.log('Exporting with:', {
      template,
      formats,
      options,
      analysis,
      insights,
      case_context
    });
    
    // In production, this would trigger actual export generation
    alert(`Export initiated:\n- Template: ${template}\n- Formats: ${formats.join(', ')}\n- Options: ${Object.entries(options).filter(([k,v]) => v).map(([k]) => k).join(', ')}`);
  };

  return (
    <div style={{ 
      padding: tokens.spacing[6],
      display: 'flex',
      flexDirection: 'column',
      gap: tokens.spacing[6]
    }}>
      {/* Export Templates */}
      <Card>
        <CardHeader>
          <h3 style={{
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.medium,
            margin: 0,
            marginBottom: tokens.spacing[1]
          }}>
            Export Templates
          </h3>
          <p style={{
            fontSize: tokens.typography.fontSize.sm,
            color: tokens.colors.neutral[500],
            margin: 0
          }}>
            Choose a professional template for your output
          </p>
        </CardHeader>
        <CardContent>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: tokens.spacing[4]
          }}>
            {exportTemplates.map(template => (
              <TemplateOption
                key={template.id}
                template={template}
                selected={selectedTemplate === template.id}
                onClick={() => setSelectedTemplate(template.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Formats */}
      <Card>
        <CardHeader>
          <h3 style={{
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.medium,
            margin: 0
          }}>
            Export Formats
          </h3>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[3] }}>
            {exportFormats.map(format => (
              <FormatOption
                key={format.id}
                format={format}
                selected={selectedFormats.includes(format.id)}
                onChange={(checked) => {
                  if (checked) {
                    setSelectedFormats([...selectedFormats, format.id]);
                  } else {
                    setSelectedFormats(selectedFormats.filter(f => f !== format.id));
                  }
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <h3 style={{
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.medium,
            margin: 0
          }}>
            Export Options
          </h3>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[4] }}>
            <OptionToggle
              label="Include AI Insights"
              description="Include strategic guidance from AI consultation"
              checked={exportOptions.include_insights}
              onChange={(checked) => setExportOptions({
                ...exportOptions,
                include_insights: checked
              })}
            />
            <OptionToggle
              label="Include Timeline"
              description="Include chronological analysis of events"
              checked={exportOptions.include_timeline}
              onChange={(checked) => setExportOptions({
                ...exportOptions,
                include_timeline: checked
              })}
            />
            <OptionToggle
              label="Include Confidence Scores"
              description="Show confidence levels for analysis results"
              checked={exportOptions.include_confidence_scores}
              onChange={(checked) => setExportOptions({
                ...exportOptions,
                include_confidence_scores: checked
              })}
            />
            <OptionToggle
              label="Client-Ready Format"
              description="Format suitable for client presentation"
              checked={exportOptions.client_ready}
              onChange={(checked) => setExportOptions({
                ...exportOptions,
                client_ready: checked
              })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Export Actions */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: tokens.spacing[4]
      }}>
        <Button variant="secondary">
          Preview Export
        </Button>
        <Button 
          variant="primary"
          onClick={() => handleExport(selectedTemplate, selectedFormats, exportOptions)}
        >
          Export Analysis
        </Button>
      </div>
    </div>
  );
};

export default ExportInterface;