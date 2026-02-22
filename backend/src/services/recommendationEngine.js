class RecommendationEngine {
    generateRecommendations(analysisData, scoreBreakdown) {
      const recommendations = [];
  
      if (scoreBreakdown.contact.status !== 'good') {
        if (analysisData.contactInfo.emails.length === 0) {
          recommendations.push({
            type: 'critical',
            category: 'contact',
            message: 'Add a professional email address',
            priority: 1
          });
        }
        if (analysisData.contactInfo.phones.length === 0) {
          recommendations.push({
            type: 'warning',
            category: 'contact',
            message: 'Include a phone number for better reachability',
            priority: 2
          });
        }
        if (analysisData.contactInfo.linkedin.length === 0) {
          recommendations.push({
            type: 'info',
            category: 'contact',
            message: 'Consider adding your LinkedIn profile URL',
            priority: 3
          });
        }
      }
  
      const sections = analysisData.sections;
      if (!sections.experience) {
        recommendations.push({
          type: 'critical',
          category: 'sections',
          message: 'Add a Work Experience section with your professional history',
          priority: 1
        });
      }
      if (!sections.summary) {
        recommendations.push({
          type: 'info',
          category: 'sections',
          message: 'Add a short Summary or Objective to highlight your role and goals',
          priority: 3
        });
      }
      if (!sections.education) {
        recommendations.push({
          type: 'warning',
          category: 'sections',
          message: 'Include an Education section with your qualifications',
          priority: 2
        });
      }
      if (!sections.skills) {
        recommendations.push({
          type: 'warning',
          category: 'sections',
          message: 'Add a Skills section highlighting your technical and soft skills',
          priority: 2
        });
      }
      if (!sections.certifications) {
        recommendations.push({
          type: 'info',
          category: 'sections',
          message: 'Include Certifications if you have relevant credentials',
          priority: 3
        });
      }
  
      if (analysisData.keywords.length < 10) {
        recommendations.push({
          type: 'warning',
          category: 'keywords',
          message: `Only ${analysisData.keywords.length} relevant keywords found. Add more industry-specific skills and technologies`,
          priority: 2
        });
      }
  
      if (analysisData.jobComparison && analysisData.jobComparison.missingKeywords.length > 0) {
        const topMissing = analysisData.jobComparison.missingKeywords.slice(0, 5);
        recommendations.push({
          type: 'warning',
          category: 'job_match',
          message: `Add these keywords from the job description: ${topMissing.join(', ')}`,
          priority: 1
        });
      }

      if (analysisData.formatCheck.wordCount < 150) {
        recommendations.push({
          type: 'warning',
          category: 'format',
          message: 'Resume seems very short. Add more detail to improve ATS readability',
          priority: 2
        });
      }

      if (analysisData.formatCheck.wordCount > 1200) {
        recommendations.push({
          type: 'info',
          category: 'format',
          message: 'Resume is quite long. Consider trimming to the most relevant content',
          priority: 3
        });
      }
  
      return recommendations.sort((a, b) => a.priority - b.priority);
    }
  }
  
  export default new RecommendationEngine();
