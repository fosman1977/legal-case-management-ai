/**
 * Date Extraction - Week 8 Day 1-2
 * Advanced temporal data extraction and normalization
 */

class DateExtractor {
  constructor() {
    this.datePatterns = [
      // ISO formats
      /\b\d{4}-\d{2}-\d{2}\b/g,
      /\b\d{4}\/\d{2}\/\d{2}\b/g,
      
      // Standard formats
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
      /\b\d{1,2}-\d{1,2}-\d{2,4}\b/g,
      /\b\d{1,2}\.\d{1,2}\.\d{2,4}\b/g,
      
      // Written formats
      /\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{2,4}\b/gi,
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{2,4}\b/gi,
      
      // Ordinal dates
      /\b\d{1,2}(st|nd|rd|th)\s+(of\s+)?(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{2,4}\b/gi,
      
      // Partial dates
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{2,4}\b/gi,
      /\b\d{2,4}\b/g // Years only (with context validation)
    ]
    
    this.timePatterns = [
      /\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\b/g,
      /\b(?:at\s+)?\d{1,2}(?:\.\d{2})?\s*(?:o'clock|oclock)\b/gi,
      /\b(?:at\s+)?(?:noon|midnight|morning|afternoon|evening|night)\b/gi
    ]
    
    this.relativePatterns = [
      /\b(?:yesterday|today|tomorrow)\b/gi,
      /\b(?:last|next|this)\s+(?:week|month|year|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/gi,
      /\b(?:before|after|during|since|until|by)\b/gi,
      /\b(?:\d+\s+(?:days?|weeks?|months?|years?)\s+(?:ago|later|before|after))\b/gi
    ]
  }

  async extractExplicitDates(content) {
    const dates = []
    let matchId = 0

    // Extract absolute dates
    this.datePatterns.forEach((pattern, patternIndex) => {
      const matches = content.match(pattern) || []
      matches.forEach(match => {
        const normalizedDate = this.normalizeDate(match)
        if (normalizedDate) {
          dates.push({
            id: `date_${matchId++}`,
            raw_text: match,
            normalized_date: normalizedDate,
            confidence: this.calculateDateConfidence(match, patternIndex),
            type: 'explicit_date',
            position: content.indexOf(match),
            context: this.extractDateContext(content, match)
          })
        }
      })
    })

    // Extract times
    this.timePatterns.forEach(pattern => {
      const matches = content.match(pattern) || []
      matches.forEach(match => {
        dates.push({
          id: `time_${matchId++}`,
          raw_text: match,
          normalized_time: this.normalizeTime(match),
          confidence: this.calculateTimeConfidence(match),
          type: 'explicit_time',
          position: content.indexOf(match),
          context: this.extractDateContext(content, match)
        })
      })
    })

    return dates.sort((a, b) => a.position - b.position)
  }

  normalizeDate(dateStr) {
    try {
      // Handle various date formats
      const cleanDate = dateStr.trim().replace(/(\d+)(st|nd|rd|th)/gi, '$1')
      const date = new Date(cleanDate)
      
      if (isNaN(date.getTime())) {
        // Try alternative parsing for ambiguous formats
        return this.parseAmbiguousDate(dateStr)
      }
      
      return {
        iso_date: date.toISOString().split('T')[0],
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        confidence: this.assessDateParsingConfidence(dateStr, date)
      }
    } catch (error) {
      return null
    }
  }

  parseAmbiguousDate(dateStr) {
    // Handle ambiguous date formats like DD/MM/YYYY vs MM/DD/YYYY
    const parts = dateStr.split(/[\/\-\.]/)
    
    if (parts.length === 3) {
      const [first, second, third] = parts.map(p => parseInt(p))
      
      // Determine most likely interpretation
      let year, month, day
      
      if (third > 31) {
        year = third
        if (first > 12) {
          day = first
          month = second
        } else if (second > 12) {
          month = first
          day = second
        } else {
          // Ambiguous - default to DD/MM/YYYY for legal documents
          day = first
          month = second
        }
      } else if (first > 31) {
        year = first
        month = second
        day = third
      } else {
        // All values could be valid - use context or default
        year = third < 100 ? 2000 + third : third
        day = first
        month = second
      }
      
      try {
        const date = new Date(year, month - 1, day)
        if (!isNaN(date.getTime()) && date.getFullYear() === year) {
          return {
            iso_date: date.toISOString().split('T')[0],
            year: year,
            month: month,
            day: day,
            confidence: 0.7, // Lower confidence for ambiguous dates
            ambiguous: true
          }
        }
      } catch (error) {
        return null
      }
    }
    
    return null
  }

  normalizeTime(timeStr) {
    try {
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?/)
      
      if (timeMatch) {
        let [, hours, minutes, seconds, period] = timeMatch
        hours = parseInt(hours)
        minutes = parseInt(minutes)
        seconds = seconds ? parseInt(seconds) : 0
        
        if (period && period.toLowerCase() === 'pm' && hours !== 12) {
          hours += 12
        } else if (period && period.toLowerCase() === 'am' && hours === 12) {
          hours = 0
        }
        
        return {
          hours,
          minutes,
          seconds,
          formatted: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
          period: period || null
        }
      }
      
      // Handle written times
      if (timeStr.toLowerCase().includes('noon')) {
        return { hours: 12, minutes: 0, seconds: 0, formatted: '12:00:00', period: null }
      }
      if (timeStr.toLowerCase().includes('midnight')) {
        return { hours: 0, minutes: 0, seconds: 0, formatted: '00:00:00', period: null }
      }
      
    } catch (error) {
      return null
    }
    
    return null
  }

  calculateDateConfidence(dateStr, patternIndex) {
    let confidence = 0.8 // Base confidence
    
    // ISO format gets highest confidence
    if (patternIndex === 0 || patternIndex === 1) {
      confidence = 0.95
    }
    
    // Standard numeric formats
    if (patternIndex >= 2 && patternIndex <= 4) {
      confidence = 0.85
    }
    
    // Written formats are more reliable
    if (patternIndex >= 5 && patternIndex <= 7) {
      confidence = 0.9
    }
    
    // Partial dates have lower confidence
    if (patternIndex >= 8) {
      confidence = 0.6
    }
    
    // Adjust based on date validity
    const normalized = this.normalizeDate(dateStr)
    if (normalized && normalized.ambiguous) {
      confidence *= 0.8
    }
    
    return Math.min(Math.max(confidence, 0.1), 1.0)
  }

  calculateTimeConfidence(timeStr) {
    let confidence = 0.8
    
    // 24-hour format is more reliable
    if (/\d{1,2}:\d{2}:\d{2}/.test(timeStr)) {
      confidence = 0.9
    }
    
    // AM/PM indicators increase confidence
    if (/AM|PM|am|pm/.test(timeStr)) {
      confidence += 0.05
    }
    
    // Written times have lower confidence
    if (/(noon|midnight|morning|afternoon|evening|night)/.test(timeStr.toLowerCase())) {
      confidence = 0.7
    }
    
    return Math.min(Math.max(confidence, 0.1), 1.0)
  }

  extractDateContext(content, dateStr) {
    const position = content.indexOf(dateStr)
    if (position === -1) return ''
    
    const contextStart = Math.max(0, position - 50)
    const contextEnd = Math.min(content.length, position + dateStr.length + 50)
    
    return content.substring(contextStart, contextEnd).trim()
  }

  assessDateParsingConfidence(original, parsed) {
    // Check if parsed date makes sense
    const year = parsed.getFullYear()
    const currentYear = new Date().getFullYear()
    
    // Legal documents typically reference past 50 years or future 10 years
    if (year < currentYear - 50 || year > currentYear + 10) {
      return 0.5
    }
    
    return 0.9
  }

  extractRelativeTimeReferences(content) {
    const relatives = []
    let matchId = 0

    this.relativePatterns.forEach(pattern => {
      const matches = content.match(pattern) || []
      matches.forEach(match => {
        relatives.push({
          id: `relative_${matchId++}`,
          raw_text: match,
          type: 'relative_time',
          reference_type: this.classifyRelativeReference(match),
          position: content.indexOf(match),
          context: this.extractDateContext(content, match),
          resolution_confidence: this.calculateRelativeConfidence(match)
        })
      })
    })

    return relatives.sort((a, b) => a.position - b.position)
  }

  classifyRelativeReference(reference) {
    const ref = reference.toLowerCase()
    
    if (/yesterday|today|tomorrow/.test(ref)) {
      return 'day_relative'
    }
    if (/last|next|this.*(?:week|month|year)/.test(ref)) {
      return 'period_relative'
    }
    if (/before|after|during|since|until|by/.test(ref)) {
      return 'sequence_relative'
    }
    if (/\d+.*(?:days?|weeks?|months?|years?).*(?:ago|later|before|after)/.test(ref)) {
      return 'duration_relative'
    }
    
    return 'general_relative'
  }

  calculateRelativeConfidence(reference) {
    const ref = reference.toLowerCase()
    
    // Specific day references are most reliable
    if (/yesterday|today|tomorrow/.test(ref)) {
      return 0.9
    }
    
    // Duration references with numbers are reliable
    if (/\d+.*(?:days?|weeks?|months?|years?)/.test(ref)) {
      return 0.8
    }
    
    // Period references are moderately reliable
    if (/last|next|this/.test(ref)) {
      return 0.7
    }
    
    // Sequence indicators need context
    if (/before|after|during|since|until|by/.test(ref)) {
      return 0.6
    }
    
    return 0.5
  }

  // Utility methods for timeline building
  getExtractionStats() {
    return {
      extractor_type: 'DateExtractor',
      supported_patterns: {
        date_patterns: this.datePatterns.length,
        time_patterns: this.timePatterns.length,
        relative_patterns: this.relativePatterns.length
      },
      capabilities: [
        'Explicit date extraction',
        'Time extraction',
        'Relative time reference extraction',
        'Date normalization',
        'Ambiguous date resolution',
        'Context extraction'
      ]
    }
  }
}

export default DateExtractor