class QualityChecker {
  async assess(result) {
    const quality = {
      overall: 0,
      textQuality: 0,
      completeness: 0,
      accuracy: 0,
      issues: []
    };
    
    try {
      // Check text quality
      if (result.text) {
        const words = result.text.split(/\s+/);
        const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
        
        if (avgWordLength < 2 || avgWordLength > 15) {
          quality.issues.push('Unusual word length distribution');
        }
        
        quality.textQuality = avgWordLength > 3 && avgWordLength < 10 ? 0.9 : 0.7;
      }
      
      // Check completeness
      const expectedPages = result.metadata?.pages || 1;
      const extractedPages = result.pages?.length || 0;
      quality.completeness = expectedPages > 0 ? extractedPages / expectedPages : 1;
      
      // Check for common extraction issues
      if (result.text && result.text.includes('�')) {
        quality.issues.push('Character encoding issues detected');
        quality.accuracy -= 0.1;
      }
      
      // Overall score
      quality.overall = Math.max(0, (quality.textQuality + quality.completeness) / 2);
      quality.accuracy = quality.overall;
      
    } catch (error) {
      console.warn('Quality assessment failed:', error);
      quality.overall = 0.5; // Default moderate quality
      quality.issues.push('Quality assessment failed');
    }
    
    return quality;
  }
}

module.exports = { QualityChecker };