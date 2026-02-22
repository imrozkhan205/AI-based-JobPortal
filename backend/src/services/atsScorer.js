class ATSScorer {
    calculateScore(analysisData) {
      const { sections, keywords, contactInfo, formatCheck, jobComparison } = analysisData;
      
      let score = 0;
      const breakdown = {};
  
      // Format and Parseability (20 points)
      if (formatCheck.parseable) {
        score += 20;
        breakdown.format = { score: 20, max: 20, status: 'good' };
      } else {
        breakdown.format = { score: 0, max: 20, status: 'critical' };
      }
  
      // Contact Information (15 points)
      const contactScore = this.scoreContact(contactInfo);
      score += contactScore;
      breakdown.contact = { 
        score: contactScore, 
        max: 15, 
        status: contactScore >= 10 ? 'good' : contactScore >= 5 ? 'warning' : 'critical' 
      };
  
      // Sections Presence (30 points)
      const sectionScore = this.scoreSections(sections);
      score += sectionScore;
      breakdown.sections = { 
        score: sectionScore, 
        max: 30, 
        status: sectionScore >= 25 ? 'good' : sectionScore >= 15 ? 'warning' : 'critical' 
      };
  
      // Keywords (20 points)
      const keywordScore = Math.min(30, Math.floor(keywords.length * 1.5));
      score += keywordScore;
      breakdown.keywords = { 
        score: keywordScore, 
        max: 20, 
        status: keywordScore >= 15 ? 'good' : keywordScore >= 10 ? 'warning' : 'critical' 
      };
  
      // Job Match (15 points) - if job description provided
      if (jobComparison && jobComparison.matchPercentage !== undefined) {
        const jobMatchScore = Math.floor((jobComparison.matchPercentage / 100) * 15);
        score += jobMatchScore;
        breakdown.jobMatch = { 
          score: jobMatchScore, 
          max: 15, 
          status: jobMatchScore >= 10 ? 'good' : jobMatchScore >= 5 ? 'warning' : 'critical' 
        };
      } else {
        breakdown.jobMatch = { score: 0, max: 15, status: 'not_applicable' };
        score += 15;
      }
  
      return {
        overallScore: Math.min(100, score),
        breakdown,
        grade: this.getGrade(score)
      };
    }
  
    scoreContact(contactInfo) {
      let score = 0;
      if (contactInfo.emails.length > 0) score += 7;
      if (contactInfo.phones.length > 0) score += 5;
      if (contactInfo.linkedin.length > 0) score += 3;
      return score;
    }
  
    scoreSections(sections) {
      let score = 0;
      if (sections.contact) score += 5;
      if (sections.experience) score += 8;
      if (sections.education) score += 5;
      if (sections.skills) score += 5;
      if (sections.summary) score += 2;
      return score;
    }
  
    getGrade(score) {
      if (score >= 90) return 'Excellent';
      if (score >= 75) return 'Good';
      if (score >= 60) return 'Fair';
      if (score >= 40) return 'Needs Improvement';
      return 'Poor';
    }
  }
  
  export default new ATSScorer();