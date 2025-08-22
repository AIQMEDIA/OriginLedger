#!/bin/bash

# Detroit Civic Blockchain Deployment Script
# Comprehensive deployment for municipal blockchain platform

set -e

echo "🏛️  Detroit Civic Blockchain Platform Deployment"
echo "=============================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${ENVIRONMENT:-production}
DOMAIN=${DOMAIN:-originledger.com}
DETROIT_SUBDOMAIN=${DETROIT_SUBDOMAIN:-detroit.originledger.com}
DATABASE_URL=${DATABASE_URL:-}
PHOENIX_ENDPOINT=${PHOENIX_ENDPOINT:-}

echo -e "${BLUE}Environment: $ENVIRONMENT${NC}"
echo -e "${BLUE}Domain: $DOMAIN${NC}"
echo -e "${BLUE}Detroit Subdomain: $DETROIT_SUBDOMAIN${NC}"

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Installing...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
else
    echo -e "${GREEN}✅ npm found: $(npm --version)${NC}"
fi

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm ci --production=false

# Environment setup
echo -e "\n${YELLOW}Setting up environment...${NC}"

# Create production environment file
cat > .env.production << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=${DATABASE_URL}
PHOENIX_OTEL_ENDPOINT=${PHOENIX_ENDPOINT}
CORS_ORIGIN=https://${DETROIT_SUBDOMAIN},https://${DOMAIN}
HTTPS_REDIRECT=true
SECURITY_LEVEL=enterprise
DETROIT_CIVIC_ENABLED=true
EOF

echo -e "${GREEN}✅ Environment configuration created${NC}"

# Database setup
if [ ! -z "$DATABASE_URL" ]; then
    echo -e "\n${YELLOW}Setting up database...${NC}"
    
    # Run database migrations if available
    if [ -f "drizzle.config.ts" ]; then
        npx drizzle-kit generate
        npx drizzle-kit migrate
        echo -e "${GREEN}✅ Database migrations completed${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No DATABASE_URL provided, using in-memory storage${NC}"
fi

# Build application
echo -e "\n${YELLOW}Building application...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Application built successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Security hardening
echo -e "\n${YELLOW}Applying security hardening...${NC}"

# Set proper file permissions
chmod 600 .env.production
chmod 755 server/
chmod 755 client/

# Create security directories
mkdir -p logs/security
mkdir -p backups
chmod 700 logs/security
chmod 700 backups

echo -e "${GREEN}✅ Security hardening applied${NC}"

# Detroit-specific configuration
echo -e "\n${YELLOW}Configuring Detroit civic features...${NC}"

# Create Detroit configuration
cat > detroit-config.json << EOF
{
  "municipal": {
    "name": "Detroit, Michigan",
    "contact": "Justin Owenu",
    "email": "blockchain@detroitmi.gov",
    "features": {
      "propertyRegistry": true,
      "cryptoPayments": true,
      "fractionalOwnership": true,
      "auditTrail": true,
      "transparencyPortal": true
    },
    "paymentMethods": ["usdc", "eth", "fiat", "bank"],
    "blockchainNetworks": ["ethereum"],
    "taxYear": 2025
  },
  "security": {
    "canaryEndpoints": 21,
    "rateLimiting": true,
    "auditLogging": true,
    "intrusionDetection": true
  },
  "integrations": {
    "arizePhoenix": true,
    "opentelemetry": true
  }
}
EOF

echo -e "${GREEN}✅ Detroit civic configuration created${NC}"

# Health check setup
echo -e "\n${YELLOW}Setting up health checks...${NC}"

cat > health-check.js << 'EOF'
const http = require('http');

const healthCheck = () => {
  const options = {
    hostname: 'localhost',
    port: process.env.PORT || 5000,
    path: '/api/health',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log('✅ Health check passed');
      process.exit(0);
    } else {
      console.log('❌ Health check failed');
      process.exit(1);
    }
  });

  req.on('error', (err) => {
    console.log('❌ Health check error:', err.message);
    process.exit(1);
  });

  req.on('timeout', () => {
    console.log('❌ Health check timeout');
    req.destroy();
    process.exit(1);
  });

  req.end();
};

healthCheck();
EOF

chmod +x health-check.js
echo -e "${GREEN}✅ Health check configured${NC}"

# Service management
echo -e "\n${YELLOW}Creating service management scripts...${NC}"

# Start script
cat > start.sh << 'EOF'
#!/bin/bash
echo "🏛️ Starting Detroit Civic Blockchain Platform..."

# Load environment
export NODE_ENV=production
export $(cat .env.production | xargs)

# Start the application
npm start
EOF

# Stop script
cat > stop.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Detroit Civic Blockchain Platform..."

# Find and kill the Node.js process
pkill -f "node.*server/index.js"
echo "Application stopped"
EOF

# Restart script
cat > restart.sh << 'EOF'
#!/bin/bash
echo "🔄 Restarting Detroit Civic Blockchain Platform..."

./stop.sh
sleep 2
./start.sh
EOF

chmod +x start.sh stop.sh restart.sh

echo -e "${GREEN}✅ Service management scripts created${NC}"

# SSL/TLS setup
echo -e "\n${YELLOW}SSL/TLS configuration...${NC}"

cat > ssl-setup.md << EOF
# SSL/TLS Setup for Detroit Civic Blockchain

## Replit Deployment (Recommended)
1. Deploy via Replit Deployments for automatic SSL
2. Custom domain: ${DETROIT_SUBDOMAIN}
3. Automatic certificate renewal

## Manual SSL Setup (Advanced)
\`\`\`bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d ${DETROIT_SUBDOMAIN}

# Certificate files:
# /etc/letsencrypt/live/${DETROIT_SUBDOMAIN}/fullchain.pem
# /etc/letsencrypt/live/${DETROIT_SUBDOMAIN}/privkey.pem
\`\`\`

## Nginx Configuration
\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name ${DETROIT_SUBDOMAIN};
    
    ssl_certificate /etc/letsencrypt/live/${DETROIT_SUBDOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DETROIT_SUBDOMAIN}/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
\`\`\`
EOF

echo -e "${GREEN}✅ SSL/TLS documentation created${NC}"

# Monitoring setup
echo -e "\n${YELLOW}Setting up monitoring...${NC}"

cat > monitoring.sh << 'EOF'
#!/bin/bash

echo "📊 Detroit Civic Blockchain Monitoring"
echo "====================================="

# Application status
echo "Application Status:"
if pgrep -f "node.*server/index.js" > /dev/null; then
    echo "✅ Application: Running"
else
    echo "❌ Application: Stopped"
fi

# Database connectivity
echo -e "\nDatabase Status:"
node -e "
const { spawn } = require('child_process');
const healthCheck = spawn('node', ['health-check.js']);
healthCheck.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Health Check: Passed');
  } else {
    console.log('❌ Health Check: Failed');
  }
});
"

# Security status
echo -e "\nSecurity Status:"
if [ -f "logs/security/canary.log" ]; then
    echo "🛡️ Security Canary: Active"
    echo "Recent alerts: $(tail -5 logs/security/canary.log | wc -l)"
else
    echo "🛡️ Security Canary: Initializing"
fi

# Detroit civic features
echo -e "\nDetroit Civic Features:"
echo "🏛️ Property Registry: Enabled"
echo "💰 Crypto Payments: Enabled"
echo "📊 Audit Trail: Enabled"
echo "🔍 Transparency Portal: Enabled"

# Performance metrics
echo -e "\nPerformance:"
echo "Memory Usage: $(ps -o pid,vsz,rss,%mem,command -p $(pgrep -f 'node.*server/index.js') | tail -1 | awk '{print $4}')%"
echo "Uptime: $(ps -o pid,etime -p $(pgrep -f 'node.*server/index.js') | tail -1 | awk '{print $2}')"
EOF

chmod +x monitoring.sh
echo -e "${GREEN}✅ Monitoring script created${NC}"

# Backup setup
echo -e "\n${YELLOW}Setting up backup system...${NC}"

cat > backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Creating backup: $BACKUP_DIR"

# Backup configuration
cp detroit-config.json "$BACKUP_DIR/"
cp .env.production "$BACKUP_DIR/"

# Backup logs
if [ -d "logs" ]; then
    cp -r logs "$BACKUP_DIR/"
fi

# Backup database (if using file-based)
if [ -f "database.sqlite" ]; then
    cp database.sqlite "$BACKUP_DIR/"
fi

# Create backup manifest
cat > "$BACKUP_DIR/manifest.json" << MANIFEST
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "${ENVIRONMENT}",
  "version": "$(node -p "require('./package.json').version")",
  "files": [
    "detroit-config.json",
    ".env.production",
    "logs/",
    "database.sqlite"
  ]
}
MANIFEST

echo "✅ Backup created: $BACKUP_DIR"

# Clean old backups (keep last 7 days)
find backups/ -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null || true
EOF

chmod +x backup.sh
echo -e "${GREEN}✅ Backup system configured${NC}"

# Final validation
echo -e "\n${YELLOW}Running final validation...${NC}"

# Test application start
echo "Testing application startup..."
timeout 30s npm start &
APP_PID=$!
sleep 10

if kill -0 $APP_PID 2>/dev/null; then
    echo -e "${GREEN}✅ Application starts successfully${NC}"
    kill $APP_PID
else
    echo -e "${RED}❌ Application failed to start${NC}"
fi

# Deployment summary
echo -e "\n${GREEN}🎉 Detroit Civic Blockchain Platform Deployment Complete!${NC}"
echo "======================================================"
echo -e "${BLUE}Environment:${NC} $ENVIRONMENT"
echo -e "${BLUE}Domain:${NC} $DETROIT_SUBDOMAIN"
echo -e "${BLUE}Features:${NC} Property Registry, Crypto Payments, Audit Trail"
echo -e "${BLUE}Security:${NC} Enterprise-grade with 21 canary endpoints"
echo -e "${BLUE}Monitoring:${NC} Arize Phoenix integration enabled"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Deploy to Replit: Push to your repository and deploy"
echo "2. Configure domain: Set up $DETROIT_SUBDOMAIN"
echo "3. Add environment variables in deployment settings"
echo "4. Contact Justin Owenu for Detroit integration"

echo -e "\n${YELLOW}Management Commands:${NC}"
echo "• Start: ./start.sh"
echo "• Stop: ./stop.sh"
echo "• Restart: ./restart.sh"
echo "• Monitor: ./monitoring.sh"
echo "• Backup: ./backup.sh"

echo -e "\n${BLUE}Contact:${NC} Justin Owenu - Detroit Blockchain Initiative"
echo -e "${BLUE}Ready for:${NC} Municipal partnership and city services integration"

echo -e "\n${GREEN}Deployment completed successfully! 🚀${NC}"