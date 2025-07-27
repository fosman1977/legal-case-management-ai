import React, { useState, useEffect } from 'react';
import { Case, KeyPoint, ChronologyEvent, LegalAuthority, CaseDocument } from '../types';
import { storage } from '../utils/storage';

interface PresentationPrepProps {
  caseData: Case;
}

export const PresentationPrep: React.FC<PresentationPrepProps> = ({ caseData }) => {
  const [keyPoints, setKeyPoints] = useState<KeyPoint[]>([]);
  const [chronology, setChronology] = useState<ChronologyEvent[]>([]);
  const [authorities, setAuthorities] = useState<LegalAuthority[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [selectedSection, setSelectedSection] = useState<KeyPoint['category']>('opening');
  const [showPrintView, setShowPrintView] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [caseData.id]);

  const loadAllData = () => {
    setKeyPoints(storage.getKeyPoints(caseData.id).sort((a, b) => a.order - b.order));
    setChronology(storage.getChronology(caseData.id).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ));
    setAuthorities(storage.getAuthorities(caseData.id));
    setDocuments(storage.getDocuments(caseData.id));
  };

  const getCategoryLabel = (category: KeyPoint['category']) => {
    const labels = {
      opening: 'Opening Statement',
      examination: 'Examination in Chief',
      cross_examination: 'Cross-Examination',
      closing: 'Closing Argument',
      legal_argument: 'Legal Argument'
    };
    return labels[category];
  };

  const filteredPoints = keyPoints.filter(p => p.category === selectedSection);

  const generateSpeakingNotes = () => {
    const notes = [];
    
    notes.push(`# Speaking Notes: ${caseData.title}`);
    notes.push(`## ${caseData.courtReference}`);
    notes.push(`### ${caseData.client} v ${caseData.opponent}`);
    notes.push(`Court: ${caseData.court}`);
    notes.push(`Judge: ${caseData.judge || 'TBC'}`);
    notes.push(`Date: ${new Date(caseData.hearingDate).toLocaleDateString('en-GB')}\n`);

    (['opening', 'examination', 'cross_examination', 'closing', 'legal_argument'] as const).forEach(category => {
      const categoryPoints = keyPoints.filter(p => p.category === category);
      if (categoryPoints.length > 0) {
        notes.push(`## ${getCategoryLabel(category)}`);
        categoryPoints.forEach((point, index) => {
          notes.push(`${index + 1}. ${point.point}`);
          if (point.supportingDocs.length > 0) {
            notes.push(`   Supporting: ${point.supportingDocs.join(', ')}`);
          }
        });
        notes.push('');
      }
    });

    if (authorities.length > 0) {
      notes.push('## Key Authorities');
      authorities.forEach(auth => {
        notes.push(`- ${auth.citation}${auth.paragraph ? ` at ${auth.paragraph}` : ''}`);
        notes.push(`  ${auth.principle}`);
      });
      notes.push('');
    }

    if (chronology.length > 0) {
      notes.push('## Key Dates');
      chronology.slice(0, 10).forEach(event => {
        notes.push(`- ${new Date(event.date).toLocaleDateString('en-GB')}: ${event.description}`);
      });
    }

    return notes.join('\n');
  };

  const handleExport = () => {
    const notes = generateSpeakingNotes();
    const blob = new Blob([notes], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${caseData.title.replace(/\s+/g, '_')}_speaking_notes.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="presentation-prep">
      <div className="prep-header">
        <h3>Oral Presentation Preparation</h3>
        <div className="prep-actions">
          <button className="btn btn-secondary" onClick={() => setShowPrintView(!showPrintView)}>
            {showPrintView ? 'Interactive View' : 'Print View'}
          </button>
          <button className="btn btn-secondary" onClick={handleExport}>
            Export Notes
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            Print
          </button>
        </div>
      </div>

      {!showPrintView ? (
        <>
          <div className="section-tabs">
            {(['opening', 'examination', 'cross_examination', 'closing', 'legal_argument'] as const).map(cat => (
              <button
                key={cat}
                className={`tab ${selectedSection === cat ? 'active' : ''}`}
                onClick={() => setSelectedSection(cat)}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>

          <div className="presentation-content">
            <h4>{getCategoryLabel(selectedSection)}</h4>
            
            {filteredPoints.length === 0 ? (
              <p className="empty-state">No points prepared for this section yet.</p>
            ) : (
              <div className="speaking-points">
                {filteredPoints.map((point, index) => (
                  <div key={point.id} className="speaking-point">
                    <div className="point-number">{index + 1}</div>
                    <div className="point-content">
                      <p className="point-text">{point.point}</p>
                      {point.supportingDocs.length > 0 && (
                        <div className="supporting-refs">
                          <strong>Supporting:</strong> {point.supportingDocs.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="quick-reference">
              <h4>Quick Reference</h4>
              
              <div className="ref-section">
                <h5>Key Authorities ({authorities.length})</h5>
                {authorities.slice(0, 5).map(auth => (
                  <div key={auth.id} className="ref-item">
                    <strong>{auth.citation}</strong>
                    {auth.paragraph && <span> at {auth.paragraph}</span>}
                  </div>
                ))}
              </div>

              <div className="ref-section">
                <h5>Key Documents ({documents.length})</h5>
                {documents.slice(0, 5).map(doc => (
                  <div key={doc.id} className="ref-item">
                    {doc.title}
                    {doc.pageReferences && <span> (p.{doc.pageReferences})</span>}
                  </div>
                ))}
              </div>

              <div className="ref-section">
                <h5>Key Dates</h5>
                {chronology.slice(0, 5).map(event => (
                  <div key={event.id} className="ref-item">
                    <strong>{new Date(event.date).toLocaleDateString('en-GB')}:</strong> {event.description}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="print-view">
          <pre>{generateSpeakingNotes()}</pre>
        </div>
      )}
    </div>
  );
};