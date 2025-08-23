/**
 * Skeleton Argument Template - Week 6 Day 5
 * Generates court-ready skeleton argument structure
 */

class SkeletonArgumentTemplate {
  constructor() {
    this.documentType = 'SKELETON_ARGUMENT';
  }

  async generate(frameworkData) {
    const document = {
      format: 'skeleton_argument',
      content: this.buildSkeletonContent(frameworkData),
      metadata: frameworkData.metadata
    };

    return {
      html: this.generateHTML(document),
      pdf: await this.generatePDF(document),
      word: await this.generateWord(document),
      raw: document
    };
  }

  buildSkeletonContent(data) {
    return {
      title_page: this.generateTitlePage(data.header),
      introduction_section: this.generateIntroductionSection(data.sections.introduction),
      legal_framework_section: this.generateLegalFrameworkSection(data.sections.legal_framework),
      factual_background_section: this.generateFactualBackgroundSection(data.sections.factual_background),
      arguments_section: this.generateArgumentsSection(data.sections.arguments),
      conclusion_section: this.generateConclusionSection(data.sections.conclusion),
      authorities_section: this.generateAuthoritiesSection(data.authorities),
      metadata_section: this.generateMetadataSection(data.metadata)
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
          <h3>SKELETON ARGUMENT</h3>
          <h4>FOR THE CLAIMANT</h4>
        </div>

        <div class="document-date">
          <p>Dated: ${header.date}</p>
        </div>
      </div>
    `;
  }

  generateIntroductionSection(introduction) {
    return `
      <div class="argument-section">
        <h2>1. INTRODUCTION</h2>
        <div class="section-content">
          <p class="paragraph">1.1 ${introduction}</p>
          <p class="paragraph">1.2 This skeleton argument sets out the Claimant's primary contentions and the legal framework applicable to this case.</p>
          <p class="paragraph">1.3 For the detailed factual background, reference should be made to the accompanying chronology.</p>
        </div>
      </div>
    `;
  }

  generateLegalFrameworkSection(legalFramework) {
    const frameworkItems = Array.isArray(legalFramework) ? legalFramework : [legalFramework];
    
    const frameworkContent = frameworkItems.map((item, index) => 
      `<p class="paragraph">2.${index + 1} ${item}</p>`
    ).join('');

    return `
      <div class="argument-section">
        <h2>2. LEGAL FRAMEWORK</h2>
        <div class="section-content">
          ${frameworkContent}
          <p class="paragraph">2.${frameworkItems.length + 1} The relevant authorities are set out in the Schedule of Authorities.</p>
        </div>
      </div>
    `;
  }

  generateFactualBackgroundSection(factualBackground) {
    return `
      <div class="argument-section">
        <h2>3. FACTUAL BACKGROUND</h2>
        <div class="section-content">
          <p class="paragraph">3.1 ${factualBackground}</p>
          <p class="paragraph">3.2 The detailed chronology of events is set out in the accompanying chronology.</p>
          <p class="paragraph">3.3 The key facts relevant to the legal issues are summarized below:</p>
          <p class="paragraph">3.4 [KEY FACTS TO BE INSERTED FROM ANALYSIS]</p>
        </div>
      </div>
    `;
  }

  generateArgumentsSection(arguments) {
    const argumentItems = Array.isArray(arguments) ? arguments : [arguments];
    
    let sectionNumber = 4;
    const argumentSections = argumentItems.map(argument => {
      const content = `
        <div class="argument-section">
          <h2>${sectionNumber}. ${argument.heading?.toUpperCase() || 'ARGUMENT'}</h2>
          <div class="section-content">
            <p class="paragraph">${sectionNumber}.1 ${argument.content}</p>
            <p class="paragraph">${sectionNumber}.2 ${argument.authorities}</p>
          </div>
        </div>
      `;
      sectionNumber++;
      return content;
    }).join('');

    return argumentSections;
  }

  generateConclusionSection(conclusion) {
    return `
      <div class="argument-section">
        <h2>5. CONCLUSION</h2>
        <div class="section-content">
          <p class="paragraph">5.1 ${conclusion}</p>
          <p class="paragraph">5.2 For the reasons set out above, the Claimant respectfully invites the Court to [RELIEF SOUGHT].</p>
        </div>
      </div>
    `;
  }

  generateAuthoritiesSection(authorities) {
    const casesList = authorities.cases.map((case_, index) => 
      `<li>${case_.citation} ${case_.relevance !== 'TO BE COMPLETED' ? `- ${case_.relevance}` : ''}</li>`
    ).join('');

    const statutesList = authorities.statutes.map((statute, index) => 
      `<li>${statute.title} ${statute.section !== 'TBC' ? `s.${statute.section}` : ''}</li>`
    ).join('');

    return `
      <div class="authorities-section">
        <h2>SCHEDULE OF AUTHORITIES</h2>
        
        ${authorities.cases.length > 0 ? `
          <div class="authority-category">
            <h3>Cases</h3>
            <ol class="authority-list">
              ${casesList}
            </ol>
          </div>
        ` : ''}
        
        ${authorities.statutes.length > 0 ? `
          <div class="authority-category">
            <h3>Statutes</h3>
            <ol class="authority-list">
              ${statutesList}
            </ol>
          </div>
        ` : ''}
        
        ${authorities.secondary.length > 0 ? `
          <div class="authority-category">
            <h3>Secondary Sources</h3>
            <ol class="authority-list">
              ${authorities.secondary.map(item => `<li>${item}</li>`).join('')}
            </ol>
          </div>
        ` : ''}
      </div>
    `;
  }

  generateMetadataSection(metadata) {
    return `
      <div class="document-metadata" style="display: none;">
        <div class="metadata-item">AI Analysis Basis: ${metadata.ai_analysis_basis}</div>
        <div class="metadata-item">Human Review Required: ${metadata.human_review_required ? 'Yes' : 'No'}</div>
        <div class="metadata-item">Generated: ${metadata.generated}</div>
        <div class="metadata-warning">
          <strong>IMPORTANT:</strong> This skeleton argument is based on AI analysis of anonymous patterns.
          Professional legal review and completion is required before court submission.
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
        <title>Skeleton Argument</title>
        <style>
          ${this.getSkeletonCSS()}
        </style>
      </head>
      <body>
        ${document.content.title_page}
        ${document.content.introduction_section}
        ${document.content.legal_framework_section}
        ${document.content.factual_background_section}
        ${document.content.arguments_section}
        ${document.content.conclusion_section}
        ${document.content.authorities_section}
        ${document.content.metadata_section}
      </body>
      </html>
    `;
  }

  async generatePDF(document) {
    return {
      type: 'pdf',
      content: `PDF version of skeleton argument`,
      filename: `skeleton_argument_${Date.now()}.pdf`,
      size: '~5-15 pages',
      ready_for_court: 'requires_review'
    };
  }

  async generateWord(document) {
    return {
      type: 'docx',
      content: `Word document version of skeleton argument`,
      filename: `skeleton_argument_${Date.now()}.docx`,
      editable: true,
      ready_for_court: 'requires_completion'
    };
  }

  getSkeletonCSS() {
    return `
      body {
        font-family: 'Times New Roman', serif;
        font-size: 12pt;
        line-height: 1.8;
        margin: 2.5cm;
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

      .argument-section {
        margin: 2cm 0;
        page-break-inside: avoid;
      }

      .argument-section h2 {
        font-size: 13pt;
        font-weight: bold;
        margin-bottom: 1cm;
        text-decoration: underline;
      }

      .section-content {
        margin-left: 1cm;
      }

      .paragraph {
        margin-bottom: 0.8cm;
        text-align: justify;
        text-indent: 0;
      }

      .authorities-section {
        margin-top: 3cm;
        page-break-before: always;
      }

      .authorities-section h2 {
        font-size: 14pt;
        font-weight: bold;
        text-align: center;
        margin-bottom: 2cm;
        text-decoration: underline;
      }

      .authority-category {
        margin-bottom: 2cm;
      }

      .authority-category h3 {
        font-size: 12pt;
        font-weight: bold;
        margin-bottom: 1cm;
        text-decoration: underline;
      }

      .authority-list {
        margin-left: 1cm;
        line-height: 1.6;
      }

      .authority-list li {
        margin-bottom: 0.5cm;
      }

      .document-metadata {
        margin-top: 3cm;
        padding: 1cm;
        background-color: #f5f5f5;
        border: 1px solid #ccc;
        font-size: 10pt;
      }

      .metadata-warning {
        margin-top: 1cm;
        padding: 0.5cm;
        background-color: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 4px;
      }

      @media print {
        body {
          margin: 2.5cm;
        }
        
        .title-page {
          page-break-after: always;
        }

        .argument-section {
          page-break-inside: avoid;
        }

        .authorities-section {
          page-break-before: always;
        }

        .document-metadata {
          display: none;
        }
      }
    `;
  }

  getTemplateInfo() {
    return {
      name: 'Skeleton Argument Template',
      version: '1.0.0',
      output_formats: ['HTML', 'PDF', 'Word'],
      court_compliant: true,
      requires_completion: true,
      features: [
        'Professional court formatting',
        'Structured argument framework',
        'Authority scheduling',
        'AI-assisted content',
        'Human review prompts'
      ]
    };
  }
}

export default SkeletonArgumentTemplate;