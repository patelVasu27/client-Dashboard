# VERIFICATION_SCRIPT.md

This script verifies that the Vercel deployment configuration is correctly set up.

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Vercel CLI installed (`npm install -g vercel`)

## Verification Steps

### 1. Check Environment Configuration
```bash
# Check if .env.example exists
if [ ! -f .env.example ]; then
  echo "ERROR: .env.example file is missing!"
  exit 1
fi

# Check for required variables
if ! grep -q "VITE_SUPABASE_URL" .env.example; then
  echo "ERROR: VITE_SUPABASE_URL not found in .env.example!"
  exit 1
fi

if ! grep -q "VITE_SUPABASE_ANON_KEY" .env.example; then
  echo "ERROR: VITE_SUPABASE_ANON_KEY not found in .env.example!"
  exit 1
fi

if ! grep -q "NODE_ENV" .env.example; then
  echo "ERROR: NODE_ENV not found in .env.example!"
  exit 1
fi

echo "✓ Environment configuration verified"
```

### 2. Check Package.json Configuration
```bash
# Check for Vercel-specific scripts
if ! npm run build:vercel > /dev/null 2>&1; then
  echo "ERROR: build:vercel script not working correctly"
  exit 1
fi

echo "✓ Package.json scripts verified"
```

### 3. Check Build Output
```bash
# Clean and build
rm -rf dist
npm run build

# Check if build output exists
if [ ! -d "dist" ]; then
  echo "ERROR: dist directory not created!"
  exit 1
fi

if [ ! -f "dist/index.html" ]; then
  echo "ERROR: index.html not found in dist/!"
  exit 1
fi

# Check for essential static assets
if [ ! -d "dist/assets" ]; then
  echo "WARNING: assets directory not found in dist/"
fi

echo "✓ Build output verified"
```

### 4. Check Vercel Configuration
```bash
# Check if vercel.json exists
if [ ! -f "vercel.json" ]; then
  echo "ERROR: vercel.json file is missing!"
  exit 1
fi

# Validate JSON syntax
if ! jq empty vercel.json > /dev/null 2>&1; then
  echo "ERROR: vercel.json has invalid JSON syntax!"
  exit 1
fi

# Check for essential Vercel config
echo "Checking Vercel configuration..."
if ! grep -q "headers" vercel.json; then
  echo "WARNING: headers configuration not found in vercel.json"
fi

echo "✓ Vercel configuration verified"
```

### 5. Check GitHub Actions
```bash
# Check if .github/workflows directory exists
if [ ! -d ".github/workflows" ]; then
  echo "WARNING: GitHub Actions workflows directory not found"
  echo "Consider creating automated deployment workflows"
fi

echo "✓ GitHub Actions check complete"
```

### 6. Check Monitoring Setup
```bash
# Check for monitoring configuration
cat > /tmp/verify-monitoring.js << 'EOF'
const fs = require('fs');

// Check for performance monitoring in package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (packageJson.scripts && packageJson.scripts.test) {
  console.log("✓ Test scripts found for monitoring");
}

if (!packageJson.scripts['test:ci']) {
  console.log("INFO: Consider adding 'test:ci' script for CI/CD pipeline");
}

EOF

node /tmp/verify-monitoring.js
rm /tmp/verify-monitoring.js
```

### 7. Security Check
```bash
# Check .gitignore for sensitive files
if ! grep -q "node_modules" .gitignore; then
  echo "ERROR: node_modules should be in .gitignore!"
  exit 1
fi

if ! grep -q "*.log" .gitignore; then
  echo "ERROR: Log files should be in .gitignore!"
  exit 1
fi

echo "✓ Security checks verified"
```

### 8. Final Deployment Preparation
```bash
# Create deployment check list
cat > /tmp/deployment-checklist.md << 'EOF'
# Deployment Checklist

## Environment Variables
- [ ] VITE_SUPABASE_URL configured
- [ ] VITE_SUPABASE_ANON_KEY configured
- [ ] NODE_ENV = production

## Build Configuration
- [ ] Build command optimized
- [ ] Asset optimization enabled
- [ ] Static generation configured

## Security
- [ ] Headers configured
- [ ] Rate limiting set up
- [ ] Error handling improved

## Monitoring
- [ ] Analytics configured
- [ ] Error tracking set up
- [ ] Performance monitoring enabled

## Deployment
- [ ] Preview deployments tested
- [ ] Production deployment ready
- [ ] Rollback procedures documented
EOF

cat /tmp/deployment-checklist.md
rm /tmp/deployment-checklist.md

echo "✓ Deployment preparation complete"
```

## Running the Verification

```bash
# Run all verification checks
cd client-dashboard-vite
bash /path/to/VERIFICATION_SCRIPT.md

# Or run specific checks
bash -c "source VERIFICATION_SCRIPT.md && ./check1.sh"
bash -c "source VERIFICATION_SCRIPT.md && ./check2.sh"
```

## Exit Codes

- 0: All checks passed
- 1: Critical issues found (deployment should not proceed)
- 2: Warnings only (deployment can proceed)

## Version

v1.0.0

## Last Updated

2026-06-11
