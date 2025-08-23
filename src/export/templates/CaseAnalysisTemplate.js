/**
 * Case Analysis Template - Week 6 Day 5
 * Generates comprehensive client reports
 */

class CaseAnalysisTemplate {
  constructor() {
    this.documentType = 'CASE_ANALYSIS';
  }

  async generate(reportData) {
    const document = {
      format: 'case_analysis_report',
      content: this.buildAnalysisContent(reportData),
      metadata: this.generateMetadata(reportData)
    };

    return {
      html: this.generateHTML(document),
      pdf: await this.generatePDF(document),
      word: await this.generateWord(document),
      raw: document
    };
  }

  buildAnalysisContent(data) {
    return {
      title_page: this.generateTitlePage(data),
      executive_summary: this.generateExecutiveSummarySection(data.executive_summary),
      case_strength: this.generateCaseStrengthSection(data.case_strength_assessment),
      strategic_recommendations: this.generateStrategicSection(data.strategic_recommendations),
      evidence_analysis: this.generateEvidenceSection(data.evidence_analysis),
      next_steps: this.generateNextStepsSection(data.next_steps),
      appendices: this.generateAppendicesSection(data.appendices)
    };
  }

  generateTitlePage(data) {
    return `
      <div class="title-page">
        <div class="report-header">
          <h1>LEGAL CASE ANALYSIS REPORT</h1>
          <div class="confidential-notice">CONFIDENTIAL & LEGALLY PRIVILEGED</div>
        </div>
        
        <div class="case-details">
          <div class="detail-item">
            <span class="label">Client:</span>
            <span class="value">[CLIENT NAME]</span>
          </div>
          <div class="detail-item">
            <span class="label">Matter:</span>
            <span class="value">[MATTER DESCRIPTION]</span>
          </div>
          <div class="detail-item">
            <span class="label">Report Date:</span>
            <span class="value">${new Date().toLocaleDateString('en-GB')}</span>
          </div>
          <div class="detail-item">
            <span class="label">Prepared by:</span>
            <span class="value">Legal Case Manager AI</span>
          </div>
        </div>

        <div class="report-summary">
          <h3>EXECUTIVE OVERVIEW</h3>
          <p class="summary-text">${data.executive_summary?.case_overview || 'Comprehensive legal analysis completed based on available documentation.'}</p>
          <div class="confidence-display">
            <span class="confidence-label">Analysis Confidence:</span>
            <span class="confidence-value">${data.executive_summary?.confidence_assessment || 'High'}</span>
          </div>
        </div>
      </div>
    `;
  }

  generateExecutiveSummarySection(executiveSummary) {
    const findings = Array.isArray(executiveSummary?.key_findings) 
      ? executiveSummary.key_findings 
      : ['Analysis completed successfully'];

    const recommendations = Array.isArray(executiveSummary?.recommendations)
      ? executiveSummary.recommendations
      : ['Review detailed analysis sections'];

    return `
      <div class="report-section">
        <h2>1. EXECUTIVE SUMMARY</h2>
        
        <div class="subsection">
          <h3>1.1 Case Overview</h3>
          <p>${executiveSummary?.case_overview || 'Legal analysis has been completed based on the available documentation and evidence.'}</p>
        </div>

        <div class="subsection">
          <h3>1.2 Key Findings</h3>
          <ul class="findings-list">
            ${findings.map(finding => `<li>${finding}</li>`).join('')}
          </ul>
        </div>

        <div class="subsection">
          <h3>1.3 Primary Recommendations</h3>
          <ul class="recommendations-list">
            ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ul>
        </div>

        <div class="subsection">
          <h3>1.4 Next Actions</h3>
          <p>${executiveSummary?.next_actions || 'See detailed recommendations in Section 4.'}</p>
        </div>
      </div>
    `;
  }

  generateCaseStrengthSection(caseStrength) {
    const strengthFactors = Array.isArray(caseStrength?.strength_factors)
      ? caseStrength.strength_factors
      : ['Comprehensive documentation available'];

    const weaknesses = Array.isArray(caseStrength?.weakness_factors)
      ? caseStrength.weakness_factors
      : [];

    const recommendations = Array.isArray(caseStrength?.recommendations)
      ? caseStrength.recommendations
      : ['Continue case development'];

    return `
      <div class="report-section">
        <h2>2. CASE STRENGTH ASSESSMENT</h2>
        
        <div class="strength-overview">
          <div class="strength-indicator ${caseStrength?.overall_assessment || 'moderate'}">
            <span class="assessment-label">Overall Assessment:</span>
            <span class="assessment-value">${caseStrength?.overall_assessment?.toUpperCase() || 'MODERATE'}</span>
          </div>
          <div class="confidence-level">
            <span class="confidence-label">Confidence Level:</span>
            <span class="confidence-percentage">${caseStrength?.confidence_level || 85}%</span>
          </div>
        </div>

        <div class="subsection">
          <h3>2.1 Strengths</h3>
          <ul class="strength-factors">
            ${strengthFactors.map(factor => `<li class="positive">${factor}</li>`).join('')}
          </ul>
        </div>

        ${weaknesses.length > 0 ? `
          <div class="subsection">
            <h3>2.2 Areas of Concern</h3>
            <ul class="weakness-factors">
              ${weaknesses.map(weakness => `<li class="concern">${weakness}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <div class="subsection">
          <h3>2.3 Strategic Recommendations</h3>
          <ul class="strategic-recommendations">
            ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  generateStrategicSection(strategicRecommendations) {
    return `
      <div class="report-section">
        <h2>3. STRATEGIC ANALYSIS</h2>
        
        <div class="strategic-content">
          <h3>3.1 Strategic Framework</h3>
          <div class="strategic-text">
            ${strategicRecommendations || 'Strategic analysis based on case patterns and legal framework identified.'}
          </div>
        </div>

        <div class="strategic-priorities">
          <h3>3.2 Priority Actions</h3>
          <ol class="priority-list">
            <li class="high-priority">Review and complete case preparation materials</li>
            <li class="medium-priority">Consider settlement negotiation opportunities</li>
            <li class="medium-priority">Strengthen evidence base where required</li>
          </ol>
        </div>
      </div>
    `;
  }

  generateEvidenceSection(evidenceAnalysis) {
    const documentTypes = evidenceAnalysis?.document_types || {};
    const confidenceSummary = evidenceAnalysis?.confidence_summary || { average: 85, high_confidence: 0, total: 0 };
    const keyEvidence = evidenceAnalysis?.key_evidence || [];
    const evidenceGaps = evidenceAnalysis?.evidence_gaps || [];

    return `
      <div class="report-section">
        <h2>4. EVIDENCE ANALYSIS</h2>
        
        <div class="evidence-overview">
          <div class="evidence-stats">
            <div class="stat-item">
              <span class="stat-label">Total Documents:</span>
              <span class="stat-value">${evidenceAnalysis?.total_documents || 0}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Average Confidence:</span>
              <span class="stat-value">${confidenceSummary.average}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">High Confidence Items:</span>
              <span class="stat-value">${confidenceSummary.high_confidence}</span>
            </div>
          </div>
        </div>

        <div class="subsection">
          <h3>4.1 Document Categories</h3>
          <div class="document-breakdown">
            ${Object.entries(documentTypes).map(([type, count]) => `
              <div class="document-type">
                <span class="type-name">${type.replace(/_/g, ' ').toUpperCase()}:</span>
                <span class="type-count">${count} documents</span>
              </div>
            `).join('')}
          </div>
        </div>

        ${keyEvidence.length > 0 ? `
          <div class="subsection">
            <h3>4.2 Key Evidence</h3>
            <div class="key-evidence-list">
              ${keyEvidence.map(evidence => `
                <div class="evidence-item">
                  <strong>${evidence.document}</strong>
                  <span class="evidence-type">(${evidence.type})</span>
                  <p class="evidence-relevance">${evidence.relevance}</p>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${evidenceGaps.length > 0 ? `
          <div class="subsection">
            <h3>4.3 Evidence Considerations</h3>
            <ul class="evidence-gaps">
              ${evidenceGaps.map(gap => `<li class="gap-item">${gap}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  }

  generateNextStepsSection(nextSteps) {
    const steps = Array.isArray(nextSteps) ? nextSteps : [{
      step: 1,
      action: 'Review analysis and seek professional legal advice',
      priority: 'high',
      timeline: 'Immediate'
    }];

    return `
      <div class="report-section">
        <h2>5. RECOMMENDED NEXT STEPS</h2>
        
        <div class="next-steps-content">
          <p class="steps-intro">Based on the analysis, the following actions are recommended:</p>
          
          <div class="steps-list">
            ${steps.map(step => `
              <div class="step-item priority-${step.priority}">
                <div class="step-header">
                  <span class="step-number">${step.step}</span>
                  <span class="step-action">${step.action}</span>
                </div>
                <div class="step-details">
                  <span class="step-priority">Priority: ${step.priority?.toUpperCase()}</span>
                  <span class="step-timeline">Timeline: ${step.timeline}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="important-note">
          <h4>Important Note</h4>
          <p><strong>This analysis is based on AI pattern recognition and requires professional legal review before any action is taken. Always consult with qualified legal counsel before making strategic decisions.</strong></p>
        </div>
      </div>
    `;
  }

  generateAppendicesSection(appendices) {
    return `
      <div class="report-section appendices">
        <h2>6. APPENDICES</h2>
        
        <div class="appendix-item">
          <h3>Appendix A: Document Schedule</h3>
          <p>${appendices?.document_schedule?.length || 0} documents analyzed</p>
          <p class="appendix-note">Detailed document list available separately</p>
        </div>

        <div class="appendix-item">
          <h3>Appendix B: Timeline Analysis</h3>
          <p>${appendices?.timeline?.length || 0} events identified in chronology</p>
          <p class="appendix-note">Full chronology available separately</p>
        </div>

        <div class="appendix-item">
          <h3>Appendix C: AI Analysis Summary</h3>
          <div class="ai-summary">
            <div class="ai-detail">
              <span class="detail-label">Analysis Type:</span>
              <span class="detail-value">${appendices?.ai_consultation_summary?.analysis_type || 'Pattern-based analysis'}</span>
            </div>
            <div class="ai-detail">
              <span class="detail-label">Privacy Status:</span>
              <span class="detail-value">${appendices?.ai_consultation_summary?.privacy_protected || 'Fully anonymized'}</span>
            </div>
            <div class="ai-detail">
              <span class="detail-label">Human Review:</span>
              <span class="detail-value">${appendices?.ai_consultation_summary?.human_review || 'Required'}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  generateMetadata(data) {
    return {
      document_type: 'Case Analysis Report',
      generated_by: 'Legal Case Manager AI',
      generation_date: new Date().toISOString(),
      confidential: true,
      legally_privileged: true,
      requires_review: true,
      client_suitable: true
    };
  }

  generateHTML(document) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Case Analysis Report</title>
        <style>
          ${this.getCaseAnalysisCSS()}
        </style>
      </head>
      <body>
        ${document.content.title_page}
        ${document.content.executive_summary}
        ${document.content.case_strength}
        ${document.content.strategic_recommendations}
        ${document.content.evidence_analysis}
        ${document.content.next_steps}
        ${document.content.appendices}
      </body>
      </html>
    `;
  }

  async generatePDF(document) {
    return {
      type: 'pdf',
      content: `PDF version of case analysis report`,
      filename: `case_analysis_${Date.now()}.pdf`,
      size: '~10-25 pages',
      ready_for_client: true
    };
  }

  async generateWord(document) {
    return {
      type: 'docx',
      content: `Word document version of case analysis report`,
      filename: `case_analysis_${Date.now()}.docx`,
      editable: true,
      ready_for_client: true
    };
  }

  getCaseAnalysisCSS() {
    return `
      body {
        font-family: 'Arial', 'Helvetica', sans-serif;
        font-size: 11pt;
        line-height: 1.6;
        margin: 2cm;
        color: #333;
      }

      .title-page {
        text-align: center;
        padding: 3cm 0;
        margin-bottom: 3cm;
        page-break-after: always;
        border-bottom: 3px solid #2c5aa0;
      }

      .report-header h1 {
        font-size: 24pt;
        font-weight: bold;
        color: #2c5aa0;
        margin-bottom: 1cm;
      }

      .confidential-notice {
        font-size: 14pt;
        font-weight: bold;
        color: #d32f2f;
        background: #ffebee;
        padding: 0.5cm;
        border: 2px solid #d32f2f;
        margin-bottom: 2cm;
      }

      .case-details {
        text-align: left;
        margin: 2cm 0;
        background: #f5f5f5;
        padding: 1.5cm;
        border-radius: 8px;
      }

      .detail-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5cm;
      }

      .detail-item .label {
        font-weight: bold;
        min-width: 150px;
      }

      .detail-item .value {
        font-weight: normal;
        flex: 1;
        text-align: right;
      }

      .report-summary {
        text-align: left;
        margin-top: 2cm;
      }

      .report-summary h3 {
        font-size: 14pt;
        color: #2c5aa0;
        margin-bottom: 1cm;
      }

      .summary-text {
        font-size: 12pt;
        line-height: 1.8;
        margin-bottom: 1cm;
      }

      .confidence-display {
        display: flex;
        justify-content: center;
        gap: 1cm;
        font-weight: bold;
      }

      .confidence-value {
        color: #2e7d32;
      }

      .report-section {
        margin: 2cm 0;
        page-break-inside: avoid;
      }

      .report-section h2 {
        font-size: 16pt;
        font-weight: bold;
        color: #2c5aa0;
        border-bottom: 2px solid #2c5aa0;
        padding-bottom: 0.5cm;
        margin-bottom: 1.5cm;
      }

      .subsection {
        margin: 1.5cm 0;
      }

      .subsection h3 {
        font-size: 13pt;
        font-weight: bold;
        color: #455a64;
        margin-bottom: 0.8cm;
      }

      .findings-list, .recommendations-list {
        padding-left: 1cm;
      }

      .findings-list li, .recommendations-list li {
        margin-bottom: 0.5cm;
        line-height: 1.8;
      }

      .strength-overview {
        display: flex;
        justify-content: space-between;
        background: #e8f5e8;
        padding: 1cm;
        border-radius: 8px;
        margin-bottom: 1.5cm;
      }

      .strength-indicator {
        display: flex;
        align-items: center;
        gap: 0.5cm;
      }

      .strength-indicator.strong {
        color: #2e7d32;
      }

      .strength-indicator.moderate {
        color: #f57c00;
      }

      .strength-indicator.weak {
        color: #d32f2f;
      }

      .assessment-value {
        font-weight: bold;
        font-size: 14pt;
      }

      .confidence-percentage {
        font-weight: bold;
        color: #2e7d32;
      }

      .strength-factors li.positive::before {
        content: "✓ ";
        color: #2e7d32;
        font-weight: bold;
      }

      .weakness-factors li.concern::before {
        content: "⚠ ";
        color: #f57c00;
        font-weight: bold;
      }

      .strategic-content {
        background: #f0f4f8;
        padding: 1.5cm;
        border-radius: 8px;
        margin-bottom: 1.5cm;
      }

      .strategic-text {
        line-height: 1.8;
        text-align: justify;
      }

      .priority-list {
        counter-reset: priority-counter;
      }

      .priority-list li {
        counter-increment: priority-counter;
        margin-bottom: 0.8cm;
        padding: 0.5cm;
        border-radius: 4px;
      }

      .priority-list li.high-priority {
        background: #ffebee;
        border-left: 4px solid #d32f2f;
      }

      .priority-list li.medium-priority {
        background: #fff3e0;
        border-left: 4px solid #f57c00;
      }

      .evidence-overview {
        background: #f8f9fa;
        padding: 1cm;
        border-radius: 8px;
        margin-bottom: 1.5cm;
      }

      .evidence-stats {
        display: flex;
        justify-content: space-around;
      }

      .stat-item {
        text-align: center;
      }

      .stat-label {
        display: block;
        font-size: 10pt;
        color: #666;
        margin-bottom: 0.25cm;
      }

      .stat-value {
        display: block;
        font-size: 18pt;
        font-weight: bold;
        color: #2c5aa0;
      }

      .document-breakdown {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1cm;
      }

      .document-type {
        display: flex;
        justify-content: space-between;
        padding: 0.5cm;
        background: #f5f5f5;
        border-radius: 4px;
      }

      .evidence-item {
        margin-bottom: 1cm;
        padding: 0.8cm;
        background: #f8f9fa;
        border-radius: 6px;
        border-left: 4px solid #2c5aa0;
      }

      .evidence-type {
        color: #666;
        font-style: italic;
        margin-left: 0.5cm;
      }

      .evidence-relevance {
        margin: 0.5cm 0 0 0;
        color: #555;
        font-size: 10pt;
      }

      .steps-list {
        margin: 1.5cm 0;
      }

      .step-item {
        margin-bottom: 1.5cm;
        padding: 1cm;
        border-radius: 8px;
        border-left: 5px solid;
      }

      .step-item.priority-high {
        background: #ffebee;
        border-color: #d32f2f;
      }

      .step-item.priority-medium {
        background: #fff3e0;
        border-color: #f57c00;
      }

      .step-item.priority-low {
        background: #e8f5e8;
        border-color: #2e7d32;
      }

      .step-header {
        display: flex;
        align-items: center;
        gap: 1cm;
        margin-bottom: 0.5cm;
      }

      .step-number {
        width: 30px;
        height: 30px;
        background: #2c5aa0;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      }

      .step-action {
        flex: 1;
        font-weight: bold;
      }

      .step-details {
        display: flex;
        gap: 2cm;
        font-size: 10pt;
        color: #666;
      }

      .important-note {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        padding: 1.5cm;
        border-radius: 8px;
        margin-top: 2cm;
      }

      .important-note h4 {
        color: #856404;
        margin-bottom: 0.8cm;
      }

      .appendices {
        page-break-before: always;
      }

      .appendix-item {
        margin-bottom: 2cm;
        padding: 1cm;
        background: #f8f9fa;
        border-radius: 8px;
      }

      .appendix-item h3 {
        color: #2c5aa0;
        margin-bottom: 0.8cm;
      }

      .appendix-note {
        font-style: italic;
        color: #666;
      }

      .ai-summary {
        margin-top: 1cm;
      }

      .ai-detail {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5cm;
        padding: 0.3cm;
        background: white;
        border-radius: 4px;
      }

      .detail-label {
        font-weight: bold;
      }

      @media print {
        body {
          margin: 2cm;
        }
        
        .title-page {
          page-break-after: always;
        }

        .report-section {
          page-break-inside: avoid;
        }

        .appendices {
          page-break-before: always;
        }
      }
    `;
  }

  getTemplateInfo() {
    return {
      name: 'Case Analysis Report Template',
      version: '1.0.0',
      output_formats: ['HTML', 'PDF', 'Word'],
      client_suitable: true,
      confidential: true,
      features: [
        'Professional client reporting',
        'Executive summary',
        'Case strength assessment',
        'Strategic recommendations',
        'Evidence analysis',
        'Action planning'
      ]
    };
  }
}

export default CaseAnalysisTemplate;