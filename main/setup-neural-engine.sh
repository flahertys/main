#!/bin/bash

# TradeHax Neural Engine - Quick Start Setup Script
# Run this to set up the neural engine system quickly

set -e

echo "🧠 TradeHax Neural Engine - Setup Script"
echo "=========================================="
echo ""

# Check prerequisites
echo "✓ Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 16+"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL client not found (optional for local dev)"
fi

echo ""
echo "✓ Node.js: $(node --version)"
echo "✓ npm: $(npm --version)"
echo ""

# Create environment file if doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local..."
    cat > .env.local << EOF
# API Keys (required)
HUGGINGFACE_API_KEY=
OPENAI_API_KEY=

# Database (required for metrics)
DATABASE_URL=postgresql://localhost:5432/tradehax

# Admin
ADMIN_PASSWORD=admin123

# Config
METRICS_SNAPSHOT_INTERVAL=300000
REACT_APP_ADMIN_PASSWORD=admin123
EOF
    echo "✓ Created .env.local (please add your API keys)"
else
    echo "✓ .env.local already exists"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔧 Neural Engine Files Status"
echo "================================"

# Check all required files exist
declare -a files=(
    "web/api/ai/validators.ts"
    "web/api/ai/console.ts"
    "web/api/ai/prompt-engine.ts"
    "web/api/ai/chat.ts"
    "web/src/components/NeuralConsole.tsx"
    "web/src/components/AdminDashboard.tsx"
    "web/src/lib/neural-console-api.ts"
    "web/api/db/metrics-service.ts"
    "web/api/db/metrics_schema.sql"
)

missing=0
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "❌ $file"
        missing=$((missing + 1))
    fi
done

if [ $missing -gt 0 ]; then
    echo ""
    echo "❌ Missing $missing file(s). Please ensure all files are deployed."
    exit 1
fi

echo ""
echo "✓ All required files present!"

# Database setup prompt
echo ""
echo "💾 Database Setup"
echo "=================="
echo ""
read -p "Do you want to set up PostgreSQL now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Get database URL
    read -p "Enter DATABASE_URL (or press Enter for default): " db_url
    db_url=${db_url:-"postgresql://localhost:5432/tradehax"}

    # Test connection
    echo "Testing database connection..."
    if psql "$db_url" -c "SELECT 1" &> /dev/null; then
        echo "✓ Database connection successful!"

        # Run schema
        echo "Running database schema..."
        psql "$db_url" < web/api/db/metrics_schema.sql
        echo "✓ Database tables created!"

        # Update .env
        sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=$db_url|" .env.local
        echo "✓ Updated .env.local with DATABASE_URL"
    else
        echo "❌ Could not connect to database"
        echo "Create database manually with: createdb tradehax"
        echo "Then run: psql postgresql://localhost:5432/tradehax < web/api/db/metrics_schema.sql"
    fi
else
    echo "⏭️  Skipping database setup"
fi

echo ""
echo "🔑 API Keys Setup"
echo "================="
echo ""

# Check for API keys
if grep -q "HUGGINGFACE_API_KEY=$" .env.local; then
    echo "⚠️  HUGGINGFACE_API_KEY not set"
    read -p "Enter your HuggingFace API key (leave blank to skip): " hf_key
    if [ ! -z "$hf_key" ]; then
        sed -i.bak "s|HUGGINGFACE_API_KEY=.*|HUGGINGFACE_API_KEY=$hf_key|" .env.local
        echo "✓ HuggingFace API key saved"
    fi
else
    echo "✓ HUGGINGFACE_API_KEY already set"
fi

if grep -q "OPENAI_API_KEY=$" .env.local; then
    echo "⚠️  OPENAI_API_KEY not set"
    read -p "Enter your OpenAI API key (leave blank to skip): " openai_key
    if [ ! -z "$openai_key" ]; then
        sed -i.bak "s|OPENAI_API_KEY=.*|OPENAI_API_KEY=$openai_key|" .env.local
        echo "✓ OpenAI API key saved"
    fi
else
    echo "✓ OPENAI_API_KEY already set"
fi

echo ""
echo "✅ Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Review .env.local and ensure all keys are set"
echo "2. Read NEURAL_ENGINE_INTEGRATION_GUIDE.md for deployment"
echo "3. Run: npm run dev (for development)"
echo "4. Navigate to /neural-console to monitor"
echo "5. Navigate to /admin/neural-hub for configuration"
echo ""
echo "Documentation:"
echo "- NEURAL_ENGINE_FINAL_SUMMARY.md - Overview & features"
echo "- NEURAL_ENGINE_DEPLOYMENT.md - Deployment checklist"
echo "- NEURAL_ENGINE_INTEGRATION_GUIDE.md - Complete integration guide"
echo ""
echo "🚀 Ready to deploy!"

