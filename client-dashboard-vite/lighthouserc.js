module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:4173',
        'http://localhost:4173/login',
        'http://localhost:4173/dashboard'
      ],
      numberOfRuns: 3,
      startServerCommand: 'npx vite preview --port 4173',
      settings: {
        preset: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        throttling: {
          cpuSlowdownMultiplier: 1
        }
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'speed-index': ['warn', { maxNumericValue: 4000 }]
      }
    },
    upload: {
      target: 'temporary-public-storage',
      githubToken: process.env.GITHUB_TOKEN,
      githubStatusContextSuffix: '-client-dashboard'
    }
  }
}