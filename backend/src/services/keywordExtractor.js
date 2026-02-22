import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const natural = require('natural');

class KeywordExtractor {
  constructor() {
    this.tfidf = new natural.TfIdf();
    this.commonSkills = [
      'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node.js',
      'express', 'mongodb', 'sql', 'postgresql', 'mysql', 'aws', 'azure',
      'docker', 'kubernetes', 'git', 'agile', 'scrum', 'rest api', 'graphql',
      'typescript', 'html', 'css', 'sass', 'webpack', 'ci/cd', 'devops',
      'machine learning', 'data analysis', 'pandas', 'tensorflow', 'pytorch',
      'leadership', 'management', 'communication', 'teamwork', 'problem solving',
      'spring boot', 'django', 'flask', 'redis', 'elasticsearch', 'jenkins',
      'terraform', 'ansible', 'microservices', 'api design', 'rest', 'oauth',
      'c', 'c++', 'c#', '.net', 'dotnet', 'go', 'golang', 'rust', 'php', 'ruby',
      'swift', 'kotlin', 'scala', 'objective-c', 'typescript', 'next.js', 'nuxt',
      'svelte', 'sveltekit', 'redux', 'zustand', 'mobx', 'tailwind', 'bootstrap',
      'material ui', 'chakra ui', 'jest', 'vitest', 'cypress', 'playwright',
      'selenium', 'storybook', 'vite', 'babel', 'rollup', 'parcel',
      'linux', 'bash', 'shell', 'powershell', 'gitlab', 'github', 'gitlab ci',
      'github actions', 'bitbucket', 'jira', 'confluence', 'notion',
      'aws lambda', 'ec2', 's3', 'rds', 'cloudfront', 'api gateway',
      'gcp', 'google cloud', 'bigquery', 'firebase', 'cloud functions',
      'azure devops', 'azure functions',
      'kafka', 'rabbitmq', 'sqs', 'sns', 'redis', 'memcached',
      'postgres', 'sql server', 'oracle', 'sqlite', 'dynamodb', 'cassandra',
      'neo4j', 'graphql', 'rest', 'grpc', 'openapi', 'swagger',
      'terraform', 'pulumi', 'cloudformation', 'helm', 'istio',
      'prometheus', 'grafana', 'datadog', 'new relic', 'splunk',
      'nginx', 'apache', 'docker compose', 'k8s', 'microservices',
      'ai', 'nlp', 'computer vision', 'llm', 'bert', 'transformers',
      'pytorch', 'tensorflow', 'keras', 'scikit-learn', 'numpy',
      'pandas', 'airflow', 'spark', 'hadoop', 'dbt', 'snowflake',
      'tableau', 'power bi', 'looker', 'etl', 'data warehouse',
      'agile', 'scrum', 'kanban', 'leadership', 'mentoring'
    ];
  }

  extractKeywords(text) {
    const textLower = text.toLowerCase();
    const foundKeywords = [];

    this.commonSkills.forEach(skill => {
      if (textLower.includes(skill.toLowerCase())) {
        foundKeywords.push(skill);
      }
    });

    return [...new Set(foundKeywords)];
  }

  compareWithJobDescription(resumeText, jobDescription) {
    if (!jobDescription) {
      return { matchedKeywords: [], missingKeywords: [], matchPercentage: 0 };
    }

    const resumeKeywords = this.extractKeywords(resumeText);
    const jobKeywords = this.extractKeywords(jobDescription);

    const matchedKeywords = resumeKeywords.filter(keyword => 
      jobKeywords.includes(keyword)
    );

    const missingKeywords = jobKeywords.filter(keyword => 
      !resumeKeywords.includes(keyword)
    );

    const matchPercentage = jobKeywords.length > 0 
      ? Math.round((matchedKeywords.length / jobKeywords.length) * 100)
      : 0;

    return {
      matchedKeywords,
      missingKeywords,
      matchPercentage,
      totalJobKeywords: jobKeywords.length,
      totalResumeKeywords: resumeKeywords.length
    };
  }
}

export default new KeywordExtractor();
