/**
 * COMPLIANCE RELEVANCE FILTER
 * 
 * Identifies which regulations apply to specific legal activities
 * Filters out non-applicable requirements and explains reasoning
 */

class ComplianceRelevanceFilter {
  
  /**
   * Identify which regulations apply to document analysis activities
   */
  static getApplicableRegulations(activityType = 'documentAnalysis', systemCapabilities = {}) {
    const activities = {
      documentAnalysis: {
        description: 'Analysis of legal documents using AI assistance',
        bsbApplicable: {
          coreDuties: {
            CD1: { 
              applicable: true, 
              reason: 'Court submissions may result from analysis - duty to court applies',
              relevance: 'High'
            },
            CD2: { 
              applicable: true, 
              reason: 'Analysis directly serves client interests',
              relevance: 'High'
            },
            CD3: { 
              applicable: true, 
              reason: 'Honesty required in all analysis outputs and representations',
              relevance: 'Critical'
            },
            CD4: { 
              applicable: true, 
              reason: 'Independent professional analysis required, free from improper influence',
              relevance: 'High'
            },
            CD5: { 
              applicable: false, 
              reason: 'Document analysis is private professional work, not public conduct',
              relevance: 'Not Applicable'
            },
            CD6: { 
              applicable: true, 
              reason: 'Client documents and analysis must remain confidential',
              relevance: 'Critical'
            },
            CD7: { 
              applicable: true, 
              reason: 'Competent analysis is core professional requirement',
              relevance: 'Critical'
            },
            CD8: { 
              applicable: false, 
              reason: 'Discrimination not relevant to document analysis technology',
              relevance: 'Not Applicable'
            },
            CD9: { 
              applicable: false, 
              reason: 'Regulatory cooperation not directly relevant to analysis activity',
              relevance: 'Not Applicable'
            },
            CD10: { 
              applicable: true, 
              reason: 'Practice management includes responsible technology use',
              relevance: 'Medium'
            }
          }
        },
        sraApplicable: {
          principles: {
            P1: { 
              applicable: true, 
              reason: 'Legal analysis supports rule of law and justice administration',
              relevance: 'High'
            },
            P2: { 
              applicable: false, 
              reason: 'Private document analysis does not directly affect public trust',
              relevance: 'Not Applicable'
            },
            P3: { 
              applicable: true, 
              reason: 'Independent professional analysis required',
              relevance: 'High'
            },
            P4: { 
              applicable: true, 
              reason: 'Honest analysis and accurate outputs required',
              relevance: 'Critical'
            },
            P5: { 
              applicable: true, 
              reason: 'Professional integrity required in all work',
              relevance: 'Critical'
            },
            P6: { 
              applicable: false, 
              reason: 'Equality/diversity not directly relevant to document analysis',
              relevance: 'Not Applicable'
            },
            P7: { 
              applicable: true, 
              reason: 'Analysis must serve client interests effectively',
              relevance: 'High'
            }
          }
        },
        aiSpecificApplicable: {
          bsbAI: {
            verification: { 
              applicable: true, 
              reason: 'AI output verification critical for professional accuracy',
              relevance: 'Critical'
            },
            confidentiality: { 
              applicable: true, 
              reason: 'Client documents must be protected from AI exposure',
              relevance: 'Critical'
            },
            understanding: { 
              applicable: true, 
              reason: 'Practitioner must understand AI capabilities and limitations',
              relevance: 'High'
            },
            responsibility: { 
              applicable: true, 
              reason: 'Full professional responsibility for all analysis outputs',
              relevance: 'Critical'
            }
          },
          sraAI: {
            governance: { 
              applicable: true, 
              reason: 'Technology governance required for professional compliance',
              relevance: 'High'
            },
            clientProtection: { 
              applicable: true, 
              reason: 'Client interests must be protected in technology use',
              relevance: 'Critical'
            },
            riskAssessment: { 
              applicable: true, 
              reason: 'AI technology risks must be professionally assessed',
              relevance: 'High'
            },
            dataProtection: { 
              applicable: true, 
              reason: 'Client data protection essential in AI systems',
              relevance: 'Critical'
            },
            accessibility: { 
              applicable: false, 
              reason: 'Internal analysis tool, not client-facing service delivery',
              relevance: 'Not Applicable'
            }
          },
          judicial: {
            confidentialityProtection: { 
              applicable: true, 
              reason: 'Case information must be protected from public AI systems',
              relevance: 'Critical'
            },
            riskAwareness: { 
              applicable: true, 
              reason: 'AI limitations must be understood for court readiness',
              relevance: 'High'
            },
            practitionerAccountability: { 
              applicable: true, 
              reason: 'Practitioner remains responsible for court submissions',
              relevance: 'Critical'
            },
            forgeryDetection: { 
              applicable: false, 
              reason: 'Forgery detection not relevant to document analysis workflow',
              relevance: 'Not Applicable'
            }
          }
        }
      }
    };
    
    return activities[activityType] || activities.documentAnalysis;
  }
}

module.exports = { ComplianceRelevanceFilter };