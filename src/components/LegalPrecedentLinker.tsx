/**
 * Legal Precedent Linker
 * AI-powered system for finding and linking relevant legal precedents
 */

import React, { useState, useEffect } from 'react';

interface LegalPrecedent {
  id: string;
  citation: string;
  title: string;
  court: string;
  date: string;
  jurisdiction: 'england_wales' | 'scotland' | 'northern_ireland' | 'uk_supreme' | 'european' | 'other';
  practiceArea: 'criminal' | 'civil' | 'family' | 'commercial' | 'administrative' | 'constitutional' | 'other';
  headnote: string;
  keyLegalPrinciples: string[];
  factsPattern: string[];
  outcome: 'claimant_success' | 'defendant_success' | 'mixed' | 'procedural';
  bindingAuthority: 'binding' | 'persuasive' | 'non_binding';
  relevanceScore: number; // 0-1
  metadata: {
    judges?: string[];
    lawReports?: string[];
    citations?: string[];
    relatedCases?: string[];
    overruled?: boolean;
    distinguishable?: boolean;
    [key: string]: any;
  };
}

interface PrecedentLink {
  id: string;
  precedentId: string;
  caseId: string;
  linkType: 'directly_applicable' | 'analogous' | 'distinguishable' | 'overruling' | 'following' | 'considering';
  strength: number; // 0-1
  confidence: number; // 0-1
  analysis: {
    factsSimilarity: number;
    legalPrinciplesSimilarity: number;
    jurisdictionalRelevance: number;
    temporalRelevance: number;
    proceduralSimilarity: number;
  };
  strategicValue: {
    supportiveness: 'strongly_supportive' | 'supportive' | 'neutral' | 'unfavorable' | 'strongly_unfavorable';
    applicability: 'direct' | 'analogous' | 'limited' | 'distinguishable';
    tacticalUse: string[];
  };
  legalReasoning: string;
  practicalApplications: string[];
}

interface PrecedentCluster {
  id: string;
  theme: string;
  precedentIds: string[];
  unifyingPrinciple: string;
  developmentTimeline: string[];
  currentStatus: 'established' | 'developing' | 'uncertain' | 'disputed';
}

interface PrecedentInsight {
  id: string;
  type: 'trend_analysis' | 'gap_identification' | 'strategic_opportunity' | 'risk_warning';
  title: string;
  description: string;
  relatedPrecedents: string[];
  confidence: number;
  actionable: boolean;
  recommendations: string[];
}

interface LegalPrecedentLinkerProps {
  caseId: string;
  caseData: {
    title: string;
    description: string;
    practiceArea: string;
    facts: string[];
    legalIssues: string[];
    jurisdiction: string;
  };
  onPrecedentsLinked?: (links: PrecedentLink[]) => void;
  onInsightsGenerated?: (insights: PrecedentInsight[]) => void;
}

export const LegalPrecedentLinker: React.FC<LegalPrecedentLinkerProps> = ({
  caseId,
  caseData,
  onPrecedentsLinked,
  onInsightsGenerated
}) => {
  const [precedents, setPrecedents] = useState<LegalPrecedent[]>([]);
  const [precedentLinks, setPrecedentLinks] = useState<PrecedentLink[]>([]);
  const [clusters, setClusters] = useState<PrecedentCluster[]>([]);
  const [insights, setInsights] = useState<PrecedentInsight[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrecedent, setSelectedPrecedent] = useState<LegalPrecedent | null>(null);

  useEffect(() => {
    if (caseData) {
      searchRelevantPrecedents();
    }
  }, [caseData]);

  const searchRelevantPrecedents = async (): Promise<void> => {
    setIsSearching(true);
    
    try {
      // Simulate precedent search
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const foundPrecedents = findRelevantPrecedents(caseData);
      const createdLinks = createPrecedentLinks(foundPrecedents, caseData);
      const identifiedClusters = identifyPrecedentClusters(foundPrecedents);
      const generatedInsights = generatePrecedentInsights(foundPrecedents, createdLinks);
      
      setPrecedents(foundPrecedents);
      setPrecedentLinks(createdLinks);
      setClusters(identifiedClusters);
      setInsights(generatedInsights);
      
      onPrecedentsLinked?.(createdLinks);
      onInsightsGenerated?.(generatedInsights);
      
    } catch (error) {
      console.error('Precedent search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const findRelevantPrecedents = (caseInfo: any): LegalPrecedent[] => {
    // Simulate comprehensive precedent database search
    const mockPrecedents: LegalPrecedent[] = [];
    
    // Add precedents based on practice area
    if (caseInfo.practiceArea === 'criminal') {
      mockPrecedents.push(
        {
          id: 'prec_criminal_1',
          citation: 'R v Smith [2023] EWCA Crim 456',
          title: 'Regina v Smith (Fraud by Misrepresentation)',
          court: 'Court of Appeal (Criminal Division)',
          date: '2023-06-15',
          jurisdiction: 'england_wales',
          practiceArea: 'criminal',
          headnote: 'Fraud by misrepresentation - elements of dishonesty - jury directions on intention',
          keyLegalPrinciples: [
            'Fraud by misrepresentation requires dishonesty',
            'Jury directions on dishonesty test',
            'Evidence of intention to deceive'
          ],
          factsPattern: [
            'Misrepresentation to obtain financial advantage',
            'False statements about business credentials',
            'Victim reliance on false representations'
          ],
          outcome: 'defendant_success',
          bindingAuthority: 'binding',
          relevanceScore: 0.92,
          metadata: {
            judges: ['Lord Justice Andrews', 'Mr Justice Thompson'],
            lawReports: ['[2023] EWCA Crim 456', '[2023] 2 Cr App R 23'],
            overruled: false,
            distinguishable: false
          }
        },
        {
          id: 'prec_criminal_2',
          citation: 'R v Jones [2022] UKSC 34',
          title: 'Regina v Jones (Criminal Intent and Knowledge)',
          court: 'Supreme Court',
          date: '2022-11-20',
          jurisdiction: 'uk_supreme',
          practiceArea: 'criminal',
          headnote: 'Criminal intent - knowledge of circumstances - willful blindness doctrine',
          keyLegalPrinciples: [
            'Willful blindness as equivalent to knowledge',
            'Subjective test for criminal intent',
            'Inference of intent from conduct'
          ],
          factsPattern: [
            'Failure to inquire about suspicious circumstances',
            'Pattern of deliberate ignorance',
            'Financial transactions with questionable sources'
          ],
          outcome: 'claimant_success',
          bindingAuthority: 'binding',
          relevanceScore: 0.85,
          metadata: {
            judges: ['Lord Reed', 'Lady Black', 'Lord Lloyd-Jones'],
            overruled: false
          }
        }
      );
    }
    
    if (caseInfo.practiceArea === 'civil' || caseInfo.practiceArea === 'commercial') {
      mockPrecedents.push(
        {
          id: 'prec_civil_1',
          citation: 'Brown v Green Ltd [2023] EWHC 789 (Comm)',
          title: 'Brown v Green Limited (Contract Interpretation)',
          court: 'High Court (Commercial Court)',
          date: '2023-04-10',
          jurisdiction: 'england_wales',
          practiceArea: 'commercial',
          headnote: 'Contract interpretation - commercial purpose - implied terms',
          keyLegalPrinciples: [
            'Objective approach to contract interpretation',
            'Commercial purpose drives interpretation',
            'Implied terms in commercial contracts'
          ],
          factsPattern: [
            'Ambiguous contractual provisions',
            'Commercial relationship between parties',
            'Industry standard practices'
          ],
          outcome: 'claimant_success',
          bindingAuthority: 'persuasive',
          relevanceScore: 0.78,
          metadata: {
            judges: ['Mr Justice Clarke'],
            distinguishable: false
          }
        }
      );
    }
    
    // Add POCA-specific precedents
    if (caseInfo.practiceArea === 'poca' || caseInfo.legalIssues?.some((issue: string) => 
        issue.toLowerCase().includes('confiscation') || 
        issue.toLowerCase().includes('proceeds')
    )) {
      mockPrecedents.push(
        {
          id: 'prec_poca_1',
          citation: 'R v Williams [2023] EWCA Crim 234',
          title: 'Regina v Williams (POCA Confiscation Order)',
          court: 'Court of Appeal (Criminal Division)',
          date: '2023-05-08',
          jurisdiction: 'england_wales',
          practiceArea: 'criminal',
          headnote: 'POCA confiscation - criminal lifestyle - benefit calculation',
          keyLegalPrinciples: [
            'Criminal lifestyle assumptions under POCA',
            'Benefit calculation methodology',
            'Available amount assessment'
          ],
          factsPattern: [
            'Multiple offenses over extended period',
            'Unexplained wealth and assets',
            'Lifestyle inconsistent with legitimate income'
          ],
          outcome: 'claimant_success',
          bindingAuthority: 'binding',
          relevanceScore: 0.88,
          metadata: {
            judges: ['Lord Justice Davis', 'Mrs Justice Sharp'],
            overruled: false
          }
        }
      );
    }
    
    return mockPrecedents;
  };

  const createPrecedentLinks = (precedents: LegalPrecedent[], caseInfo: any): PrecedentLink[] => {
    const links: PrecedentLink[] = [];
    
    precedents.forEach(precedent => {
      const analysis = analyzePrecedentRelevance(precedent, caseInfo);
      const strategicValue = assessStrategicValue(precedent, caseInfo, analysis);
      
      if (analysis.overallRelevance > 0.3) {
        links.push({
          id: `link_${precedent.id}_${caseId}`,
          precedentId: precedent.id,
          caseId,
          linkType: determineLinkType(analysis),
          strength: analysis.overallRelevance,
          confidence: analysis.confidence,
          analysis: {
            factsSimilarity: analysis.factsSimilarity,
            legalPrinciplesSimilarity: analysis.legalPrinciplesSimilarity,
            jurisdictionalRelevance: analysis.jurisdictionalRelevance,
            temporalRelevance: analysis.temporalRelevance,
            proceduralSimilarity: analysis.proceduralSimilarity
          },
          strategicValue,
          legalReasoning: generateLegalReasoning(precedent, caseInfo, analysis),
          practicalApplications: generatePracticalApplications(precedent, caseInfo, strategicValue)
        });
      }
    });
    
    return links.sort((a, b) => b.strength - a.strength);
  };

  const analyzePrecedentRelevance = (precedent: LegalPrecedent, caseInfo: any) => {
    // Analyze facts similarity
    const factsSimilarity = calculateFactsSimilarity(precedent.factsPattern, caseInfo.facts || []);
    
    // Analyze legal principles similarity
    const legalPrinciplesSimilarity = calculateLegalPrinciplesSimilarity(
      precedent.keyLegalPrinciples, 
      caseInfo.legalIssues || []
    );
    
    // Jurisdictional relevance
    const jurisdictionalRelevance = calculateJurisdictionalRelevance(
      precedent.jurisdiction, 
      caseInfo.jurisdiction || 'england_wales'
    );
    
    // Temporal relevance (newer cases generally more relevant)
    const precedentDate = new Date(precedent.date);
    const currentDate = new Date();
    const yearsDiff = (currentDate.getTime() - precedentDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    const temporalRelevance = Math.max(0.3, 1 - (yearsDiff / 10)); // Decay over 10 years
    
    // Procedural similarity (same court level, same practice area)
    const proceduralSimilarity = precedent.practiceArea === caseInfo.practiceArea ? 0.8 : 0.4;
    
    // Overall relevance calculation
    const overallRelevance = (
      factsSimilarity * 0.3 +
      legalPrinciplesSimilarity * 0.35 +
      jurisdictionalRelevance * 0.2 +
      temporalRelevance * 0.1 +
      proceduralSimilarity * 0.05
    );
    
    return {
      factsSimilarity,
      legalPrinciplesSimilarity,
      jurisdictionalRelevance,
      temporalRelevance,
      proceduralSimilarity,
      overallRelevance,
      confidence: 0.7 + (overallRelevance * 0.3)
    };
  };

  const calculateFactsSimilarity = (precedentFacts: string[], caseFacts: string[]): number => {
    if (!caseFacts.length || !precedentFacts.length) return 0;
    
    let matches = 0;
    precedentFacts.forEach(pFact => {
      caseFacts.forEach(cFact => {
        if (pFact.toLowerCase().includes(cFact.toLowerCase()) ||
            cFact.toLowerCase().includes(pFact.toLowerCase())) {
          matches++;
        }
      });
    });
    
    return Math.min(1, matches / Math.max(precedentFacts.length, caseFacts.length));
  };

  const calculateLegalPrinciplesSimilarity = (precedentPrinciples: string[], casePrinciples: string[]): number => {
    if (!casePrinciples.length || !precedentPrinciples.length) return 0;
    
    let matches = 0;
    precedentPrinciples.forEach(pPrinciple => {
      casePrinciples.forEach(cPrinciple => {
        if (pPrinciple.toLowerCase().includes(cPrinciple.toLowerCase()) ||
            cPrinciple.toLowerCase().includes(pPrinciple.toLowerCase())) {
          matches++;
        }
      });
    });
    
    return Math.min(1, matches / Math.max(precedentPrinciples.length, casePrinciples.length));
  };

  const calculateJurisdictionalRelevance = (precedentJurisdiction: string, caseJurisdiction: string): number => {
    if (precedentJurisdiction === caseJurisdiction) return 1.0;
    
    const jurisdictionHierarchy: { [key: string]: number } = {
      'uk_supreme': 1.0,
      'england_wales': 0.9,
      'scotland': 0.7,
      'northern_ireland': 0.7,
      'european': 0.6,
      'other': 0.3
    };
    
    return jurisdictionHierarchy[precedentJurisdiction] || 0.3;
  };

  const assessStrategicValue = (precedent: LegalPrecedent, caseInfo: any, analysis: any) => {
    // Determine supportiveness based on outcome and similarity
    let supportiveness: 'strongly_supportive' | 'supportive' | 'neutral' | 'unfavorable' | 'strongly_unfavorable';
    
    if (analysis.overallRelevance > 0.8) {
      supportiveness = precedent.outcome === 'claimant_success' ? 'strongly_supportive' : 'strongly_unfavorable';
    } else if (analysis.overallRelevance > 0.6) {
      supportiveness = precedent.outcome === 'claimant_success' ? 'supportive' : 'unfavorable';
    } else {
      supportiveness = 'neutral';
    }
    
    // Determine applicability
    let applicability: 'direct' | 'analogous' | 'limited' | 'distinguishable';
    if (analysis.factsSimilarity > 0.8 && analysis.legalPrinciplesSimilarity > 0.8) {
      applicability = 'direct';
    } else if (analysis.overallRelevance > 0.6) {
      applicability = 'analogous';
    } else if (analysis.overallRelevance > 0.3) {
      applicability = 'limited';
    } else {
      applicability = 'distinguishable';
    }
    
    // Generate tactical uses
    const tacticalUse = generateTacticalUses(precedent, supportiveness, applicability);
    
    return {
      supportiveness,
      applicability,
      tacticalUse
    };
  };

  const generateTacticalUses = (precedent: LegalPrecedent, supportiveness: string, applicability: string): string[] => {
    const uses: string[] = [];
    
    if (supportiveness.includes('supportive')) {
      uses.push('Use as primary authority in legal argument');
      uses.push('Cite in opening submissions');
      if (applicability === 'direct') {
        uses.push('Request court to follow this precedent');
      }
    } else if (supportiveness.includes('unfavorable')) {
      uses.push('Prepare distinguishing arguments');
      uses.push('Identify factual differences');
      uses.push('Analyze for potential overruling arguments');
    }
    
    if (precedent.bindingAuthority === 'binding') {
      uses.push('Emphasize binding nature of authority');
    }
    
    return uses;
  };

  const determineLinkType = (analysis: any): PrecedentLink['linkType'] => {
    if (analysis.overallRelevance > 0.8) return 'directly_applicable';
    if (analysis.overallRelevance > 0.6) return 'analogous';
    if (analysis.overallRelevance > 0.4) return 'considering';
    return 'distinguishable';
  };

  const generateLegalReasoning = (precedent: LegalPrecedent, caseInfo: any, analysis: any): string => {
    const reasoning = [
      `${precedent.citation} provides ${analysis.overallRelevance > 0.7 ? 'strong' : 'limited'} precedential support.`,
      `The case establishes ${precedent.keyLegalPrinciples[0]?.toLowerCase() || 'key legal principles'}.`,
      `Facts similarity: ${Math.round(analysis.factsSimilarity * 100)}%, Legal principles similarity: ${Math.round(analysis.legalPrinciplesSimilarity * 100)}%.`
    ];
    
    if (precedent.bindingAuthority === 'binding') {
      reasoning.push('This is binding authority and must be followed unless distinguished.');
    }
    
    return reasoning.join(' ');
  };

  const generatePracticalApplications = (precedent: LegalPrecedent, caseInfo: any, strategicValue: any): string[] => {
    const applications: string[] = [];
    
    if (strategicValue.applicability === 'direct') {
      applications.push('Apply reasoning directly to current facts');
      applications.push('Use as foundation for legal argument');
    } else if (strategicValue.applicability === 'analogous') {
      applications.push('Draw analogies between case facts');
      applications.push('Extend precedent reasoning to current situation');
    }
    
    if (strategicValue.supportiveness.includes('supportive')) {
      applications.push('Strengthen position with precedent support');
      applications.push('Build chain of authority');
    }
    
    return applications;
  };

  const identifyPrecedentClusters = (precedents: LegalPrecedent[]): PrecedentCluster[] => {
    const clusters: PrecedentCluster[] = [];
    
    // Group by key legal principles
    const principleGroups: { [key: string]: LegalPrecedent[] } = {};
    
    precedents.forEach(precedent => {
      precedent.keyLegalPrinciples.forEach(principle => {
        if (!principleGroups[principle]) {
          principleGroups[principle] = [];
        }
        principleGroups[principle].push(precedent);
      });
    });
    
    Object.entries(principleGroups).forEach(([principle, groupPrecedents]) => {
      if (groupPrecedents.length > 1) {
        clusters.push({
          id: `cluster_${principle.replace(/\s+/g, '_').toLowerCase()}`,
          theme: principle,
          precedentIds: groupPrecedents.map(p => p.id),
          unifyingPrinciple: principle,
          developmentTimeline: groupPrecedents
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(p => `${p.date}: ${p.citation}`),
          currentStatus: 'established'
        });
      }
    });
    
    return clusters;
  };

  const generatePrecedentInsights = (
    precedents: LegalPrecedent[], 
    links: PrecedentLink[]
  ): PrecedentInsight[] => {
    const insights: PrecedentInsight[] = [];
    
    // Trend analysis
    const recentPrecedents = precedents.filter(p => 
      new Date(p.date).getFullYear() >= new Date().getFullYear() - 2
    );
    
    if (recentPrecedents.length > 0) {
      insights.push({
        id: 'insight_recent_trends',
        type: 'trend_analysis',
        title: 'Recent Precedent Developments',
        description: `${recentPrecedents.length} recent cases show evolving judicial approach to key issues`,
        relatedPrecedents: recentPrecedents.map(p => p.id),
        confidence: 0.8,
        actionable: true,
        recommendations: [
          'Consider recent judicial attitudes in argument strategy',
          'Emphasize alignment with current legal thinking',
          'Update legal research to reflect latest developments'
        ]
      });
    }
    
    // Strategic opportunity analysis
    const strongSupportivePrecedents = links.filter(link => 
      link.strategicValue.supportiveness.includes('supportive') && link.strength > 0.7
    );
    
    if (strongSupportivePrecedents.length > 0) {
      insights.push({
        id: 'insight_strategic_opportunity',
        type: 'strategic_opportunity',
        title: 'Strong Precedent Support Available',
        description: `${strongSupportivePrecedents.length} highly relevant precedents provide strong support for case position`,
        relatedPrecedents: strongSupportivePrecedents.map(l => l.precedentId),
        confidence: 0.9,
        actionable: true,
        recommendations: [
          'Build argument around strongest precedents',
          'Emphasize precedent authority in submissions',
          'Consider precedent-focused case strategy'
        ]
      });
    }
    
    // Gap identification
    const weakLinks = links.filter(link => link.strength < 0.4);
    if (weakLinks.length === links.length && links.length > 0) {
      insights.push({
        id: 'insight_precedent_gap',
        type: 'gap_identification',
        title: 'Limited Precedent Support',
        description: 'Current case may involve novel legal issues with limited precedent guidance',
        relatedPrecedents: [],
        confidence: 0.7,
        actionable: true,
        recommendations: [
          'Consider first principles arguments',
          'Research academic commentary on novel issues',
          'Explore analogous precedents from related areas'
        ]
      });
    }
    
    return insights;
  };

  return (
    <div className="legal-precedent-linker">
      {isSearching && (
        <div className="search-indicator">
          <span className="spinner">🔍</span>
          <span>Searching precedent database...</span>
        </div>
      )}
      
      <div className="precedent-summary">
        <div className="summary-metrics">
          <div className="metric">
            <span className="metric-value">{precedents.length}</span>
            <span className="metric-label">Precedents Found</span>
          </div>
          <div className="metric">
            <span className="metric-value">{precedentLinks.length}</span>
            <span className="metric-label">Relevant Links</span>
          </div>
          <div className="metric">
            <span className="metric-value">
              {precedentLinks.filter(l => l.strategicValue.applicability === 'direct').length}
            </span>
            <span className="metric-label">Direct Authority</span>
          </div>
        </div>
      </div>
      
      <div className="precedent-links">
        <h4>📚 Relevant Precedents</h4>
        {precedentLinks.slice(0, 5).map(link => {
          const precedent = precedents.find(p => p.id === link.precedentId);
          if (!precedent) return null;
          
          return (
            <div 
              key={link.id} 
              className={`precedent-link-item ${link.linkType}`}
              onClick={() => setSelectedPrecedent(precedent)}
            >
              <div className="precedent-header">
                <div className="precedent-citation">
                  <h5>{precedent.citation}</h5>
                  <span className="precedent-court">{precedent.court}</span>
                </div>
                <div className="precedent-metrics">
                  <span className={`relevance-score ${link.strength > 0.7 ? 'high' : link.strength > 0.4 ? 'medium' : 'low'}`}>
                    {Math.round(link.strength * 100)}%
                  </span>
                  <span className={`authority-type ${precedent.bindingAuthority}`}>
                    {precedent.bindingAuthority}
                  </span>
                </div>
              </div>
              
              <p className="precedent-headnote">{precedent.headnote}</p>
              
              <div className="strategic-indicators">
                <span className={`supportiveness ${link.strategicValue.supportiveness}`}>
                  {link.strategicValue.supportiveness.replace('_', ' ')}
                </span>
                <span className={`applicability ${link.strategicValue.applicability}`}>
                  {link.strategicValue.applicability}
                </span>
              </div>
              
              <div className="key-principles">
                {precedent.keyLegalPrinciples.slice(0, 2).map(principle => (
                  <span key={principle} className="principle-tag">
                    {principle}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="precedent-insights">
        <h4>💡 Precedent Insights</h4>
        {insights.slice(0, 3).map(insight => (
          <div key={insight.id} className={`insight-card ${insight.type}`}>
            <h5>{insight.title}</h5>
            <p>{insight.description}</p>
            <div className="insight-recommendations">
              {insight.recommendations.slice(0, 2).map(rec => (
                <span key={rec} className="recommendation-tag">
                  {rec}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LegalPrecedentLinker;