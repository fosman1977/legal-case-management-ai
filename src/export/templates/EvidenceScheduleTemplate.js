/**
 * Evidence Schedule Template - Week 6 Day 5
 * Generates court-ready evidence schedules
 */

class EvidenceScheduleTemplate {
  constructor() {
    this.documentType = 'EVIDENCE_SCHEDULE';
  }

  async generate(evidenceData) {
    const document = {
      format: 'evidence_schedule',
      content: this.buildEvidenceContent(evidenceData),
      metadata: evidenceData.metadata
    };

    return {
      html: this.generateHTML(document),
      pdf: await this.generatePDF(document),
      word: await this.generateWord(document),
      raw: document
    };
  }

  buildEvidenceContent(data) {
    return {
      title_page: this.generateTitlePage(data.header),
      witness_evidence: this.generateWitnessSection(data.witness_statements || []),
      documentary_evidence: this.generateDocumentarySection(data.documentary_evidence || []),
      expert_evidence: this.generateExpertSection(data.expert_evidence || []),
      real_evidence: this.generateRealEvidenceSection(data.real_evidence || []),
      footer_section: this.generateFooterSection(data.footer)
    };
  }

  generateTitlePage(header) {
    return `
      <div class="title-page">
        <div class="court-header">
          <h1>${header.court}</h1>
          <h2>${header.division}</h2>
          <div class="case-number">Case No: ${header.case_number}</div>
        </div>
        
        <div class="parties">
          <div class="between">BETWEEN:</div>
          <div class="claimant">${header.between.claimant}</div>
          <div class="claimant-label">Claimant</div>
          <div class="and">-and-</div>
          <div class="defendant">${header.between.defendant}</div>
          <div class="defendant-label">Defendant</div>
        </div>

        <div class="document-title">
          <h3>SCHEDULE OF EVIDENCE</h3>
          <h4>FOR THE CLAIMANT</h4>
        </div>

        <div class="document-date">
          <p>Dated: ${header.date}</p>
        </div>
      </div>
    `;
  }

  generateWitnessSection(witnessStatements) {
    if (witnessStatements.length === 0) {
      witnessStatements = [{
        witness: '[WITNESS NAME TO BE INSERTED]',
        statement_date: '[DATE]',
        summary: '[SUMMARY OF EVIDENCE TO BE COMPLETED]',
        relevance: '[RELEVANCE TO CASE]'
      }];
    }

    const witnessItems = witnessStatements.map((witness, index) => `
      <tr>
        <td class="item-number">${index + 1}</td>
        <td class="witness-name">${witness.witness}</td>
        <td class="statement-date">${witness.statement_date}</td>
        <td class="evidence-summary">${witness.summary}</td>
        <td class="relevance">${witness.relevance}</td>
      </tr>
    `).join('');

    return `
      <div class="evidence-section">
        <h2>1. WITNESS EVIDENCE</h2>
        <table class="evidence-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Witness</th>
              <th>Date</th>
              <th>Summary of Evidence</th>
              <th>Relevance</th>
            </tr>
          </thead>
          <tbody>
            ${witnessItems}
          </tbody>
        </table>
      </div>
    `;
  }

  generateDocumentarySection(documents) {
    if (documents.length === 0) {
      documents = [{
        description: '[DOCUMENT DESCRIPTION TO BE COMPLETED]',
        date: '[DATE]',
        source: '[SOURCE/AUTHOR]',
        relevance: '[RELEVANCE TO CASE]',
        bundle_reference: '[BUNDLE REF]'
      }];
    }

    const documentItems = documents.map((doc, index) => `
      <tr>
        <td class="item-number">${index + 1}</td>
        <td class="document-description">${doc.description}</td>
        <td class="document-date">${doc.date}</td>
        <td class="document-source">${doc.source}</td>
        <td class="relevance">${doc.relevance}</td>
        <td class="bundle-ref">${doc.bundle_reference}</td>
      </tr>
    `).join('');

    return `
      <div class="evidence-section">
        <h2>2. DOCUMENTARY EVIDENCE</h2>
        <table class="evidence-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Description</th>
              <th>Date</th>
              <th>Source</th>
              <th>Relevance</th>
              <th>Bundle Ref</th>
            </tr>
          </thead>
          <tbody>
            ${documentItems}
          </tbody>
        </table>
      </div>
    `;
  }

  generateExpertSection(expertEvidence) {
    if (expertEvidence.length === 0) {
      expertEvidence = [{
        expert: '[EXPERT NAME TO BE INSERTED]',
        field: '[FIELD OF EXPERTISE]',
        report_date: '[REPORT DATE]',
        summary: '[SUMMARY OF OPINION]',
        relevance: '[RELEVANCE TO CASE]'
      }];
    }

    const expertItems = expertEvidence.map((expert, index) => `
      <tr>
        <td class="item-number">${index + 1}</td>
        <td class="expert-name">${expert.expert}</td>
        <td class="expert-field">${expert.field}</td>
        <td class="report-date">${expert.report_date}</td>
        <td class="expert-summary">${expert.summary}</td>
        <td class="relevance">${expert.relevance}</td>
      </tr>
    `).join('');

    return `
      <div class="evidence-section">
        <h2>3. EXPERT EVIDENCE</h2>
        <table class="evidence-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Expert</th>
              <th>Field</th>
              <th>Report Date</th>
              <th>Summary</th>
              <th>Relevance</th>
            </tr>
          </thead>
          <tbody>
            ${expertItems}
          </tbody>
        </table>
      </div>
    `;
  }

  generateRealEvidenceSection(realEvidence) {
    if (realEvidence.length === 0) {
      return `
        <div class="evidence-section">
          <h2>4. REAL EVIDENCE</h2>
          <p class="no-evidence">No real evidence identified at this time.</p>
        </div>
      `;
    }

    const realItems = realEvidence.map((item, index) => `
      <tr>
        <td class="item-number">${index + 1}</td>
        <td class="item-description">${item.description}</td>
        <td class="item-location">${item.location}</td>
        <td class="item-condition">${item.condition}</td>
        <td class="relevance">${item.relevance}</td>
      </tr>
    `).join('');

    return `
      <div class="evidence-section">
        <h2>4. REAL EVIDENCE</h2>
        <table class="evidence-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Description</th>
              <th>Location</th>
              <th>Condition</th>
              <th>Relevance</th>
            </tr>
          </thead>
          <tbody>
            ${realItems}
          </tbody>
        </table>
      </div>
    `;
  }

  generateFooterSection(footer) {
    return `
      <div class="document-footer">
        <div class="notes-section">
          <h3>NOTES</h3>
          <ol>
            <li>This schedule is based on AI analysis of available documents and requires human review.</li>
            <li>Bundle references are to be confirmed upon preparation of the hearing bundle.</li>
            <li>Additional evidence may be identified during the course of proceedings.</li>
            <li>Expert evidence is subject to court directions and the other party's right to cross-examine.</li>
            <li>All witness statements must be served in accordance with court directions.</li>
          </ol>
        </div>
        
        <div class="generation-info">
          <p><strong>${footer?.document_info || 'Generated by Legal Case Manager AI'}</strong></p>
          <p><em>This schedule requires professional legal review before court submission.</em></p>
        </div>
        
        <div class="timestamp">
          <small>Generated: ${new Date().toLocaleString()}</small>
        </div>
      </div>
    `;
  }

  generateHTML(document) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Evidence Schedule</title>
        <style>
          ${this.getEvidenceCSS()}
        </style>
      </head>
      <body>
        ${document.content.title_page}
        ${document.content.witness_evidence}
        ${document.content.documentary_evidence}
        ${document.content.expert_evidence}
        ${document.content.real_evidence}
        ${document.content.footer_section}
      </body>
      </html>
    `;
  }

  async generatePDF(document) {
    return {
      type: 'pdf',
      content: `PDF version of evidence schedule`,
      filename: `evidence_schedule_${Date.now()}.pdf`,
      size: '~3-10 pages',
      ready_for_court: 'requires_review'
    };
  }

  async generateWord(document) {
    return {
      type: 'docx',
      content: `Word document version of evidence schedule`,
      filename: `evidence_schedule_${Date.now()}.docx`,
      editable: true,
      ready_for_court: 'requires_completion'
    };
  }

  getEvidenceCSS() {
    return `
      body {
        font-family: 'Times New Roman', serif;
        font-size: 11pt;
        line-height: 1.4;
        margin: 2cm;
        color: #000;
      }

      .title-page {
        text-align: center;
        margin-bottom: 3cm;
        page-break-after: always;
      }

      .court-header h1 {
        font-size: 16pt;
        font-weight: bold;
        margin-bottom: 0.5cm;
        text-transform: uppercase;
      }

      .court-header h2 {
        font-size: 14pt;
        font-weight: bold;
        margin-bottom: 1cm;
        text-transform: uppercase;
      }

      .case-number {
        font-size: 12pt;
        font-weight: bold;
        margin-bottom: 2cm;
      }

      .parties {
        margin-bottom: 2cm;
      }

      .between {
        font-weight: bold;
        margin-bottom: 1cm;
      }

      .claimant, .defendant {
        font-size: 14pt;
        font-weight: bold;
        margin: 0.5cm 0;
        text-transform: uppercase;
      }

      .claimant-label, .defendant-label {
        font-style: italic;
        margin-bottom: 1cm;
      }

      .and {
        margin: 1cm 0;
        font-style: italic;
      }

      .document-title h3 {
        font-size: 16pt;
        font-weight: bold;
        text-decoration: underline;
        margin: 1.5cm 0 0.5cm 0;
      }

      .document-title h4 {
        font-size: 14pt;
        font-weight: bold;
        margin: 0 0 2cm 0;
      }

      .evidence-section {
        margin: 2cm 0;
        page-break-inside: avoid;
      }

      .evidence-section h2 {
        font-size: 13pt;
        font-weight: bold;
        margin-bottom: 1cm;
        text-decoration: underline;
      }

      .evidence-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 2cm;
        font-size: 10pt;
      }

      .evidence-table th {
        background-color: #f5f5f5;
        border: 1px solid #000;
        padding: 0.3cm;
        font-weight: bold;
        text-align: left;
        vertical-align: top;
      }

      .evidence-table td {
        border: 1px solid #000;
        padding: 0.3cm;
        vertical-align: top;
        text-align: left;
      }

      .item-number {
        width: 5%;
        text-align: center;
        font-weight: bold;
      }

      .witness-name, .expert-name {
        width: 15%;
        font-weight: bold;
      }

      .document-description {
        width: 25%;
      }

      .evidence-summary, .expert-summary {
        width: 30%;
      }

      .relevance {
        width: 20%;
      }

      .bundle-ref {
        width: 10%;
        text-align: center;
      }

      .no-evidence {
        font-style: italic;
        color: #666;
        text-align: center;
        padding: 2cm;
      }

      .document-footer {
        margin-top: 3cm;
        border-top: 1px solid #ccc;
        padding-top: 1cm;
      }

      .notes-section {
        margin-bottom: 2cm;
      }

      .notes-section h3 {
        font-size: 12pt;
        font-weight: bold;
        margin-bottom: 1cm;
        text-decoration: underline;
      }

      .notes-section ol {
        margin-left: 1cm;
      }

      .notes-section li {
        margin-bottom: 0.5cm;
        text-align: justify;
      }

      .generation-info {
        margin-bottom: 1cm;
      }

      .generation-info p {
        margin: 0.25cm 0;
      }

      .timestamp {
        text-align: right;
        font-size: 9pt;
        color: #666;
      }

      @media print {
        body {
          margin: 2cm;
        }
        
        .title-page {
          page-break-after: always;
        }

        .evidence-section {
          page-break-inside: avoid;
        }

        .evidence-table {
          page-break-inside: auto;
        }

        .evidence-table tr {
          page-break-inside: avoid;
        }
      }
    `;
  }

  getTemplateInfo() {
    return {
      name: 'Evidence Schedule Template',
      version: '1.0.0',
      output_formats: ['HTML', 'PDF', 'Word'],
      court_compliant: true,
      requires_completion: true,
      features: [
        'Professional tabular format',
        'Multiple evidence categories',
        'Bundle referencing system',
        'Court-ready structure',
        'Completion prompts'
      ]
    };
  }
}

export default EvidenceScheduleTemplate;