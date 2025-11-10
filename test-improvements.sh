#!/bin/bash
# Quick test script for improved Fusion 360 code generation

set -e

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  🧪 Testing Improved Fusion 360 Code Generation"
echo "═══════════════════════════════════════════════════════"
echo ""

# Check if we're in the right directory
if [ ! -f "README.md" ]; then
    echo "❌ Error: Run this from the project root directory"
    exit 1
fi

# Check for backend
if [ ! -f "backend/backend-fusion.js" ]; then
    echo "❌ Error: backend/backend-fusion.js not found"
    exit 1
fi

# Check for test script
if [ ! -f "backend/test-generation.js" ]; then
    echo "❌ Error: backend/test-generation.js not found"
    exit 1
fi

# Check for .env file
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Warning: backend/.env not found"
    echo ""
    echo "You need to create backend/.env with your Anthropic API key:"
    echo ""
    echo "    cd backend"
    echo "    echo 'ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE' > .env"
    echo ""
    echo "Get your API key at: https://console.anthropic.com/settings/keys"
    echo ""
    read -p "Do you want to continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "Step 1: Checking if backend is already running..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend is already running on port 3001"
    BACKEND_RUNNING=true
else
    echo "❌ Backend not running"
    BACKEND_RUNNING=false
fi

if [ "$BACKEND_RUNNING" = false ]; then
    echo ""
    echo "Step 2: Starting backend..."
    echo ""

    cd backend

    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install express cors dotenv @anthropic-ai/sdk
    fi

    # Start backend in background
    echo "Starting backend-fusion.js in background..."
    node backend-fusion.js > backend.log 2>&1 &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"

    # Wait for backend to start
    echo "Waiting for backend to start..."
    for i in {1..10}; do
        if curl -s http://localhost:3001/health > /dev/null 2>&1; then
            echo "✅ Backend started successfully!"
            break
        fi
        if [ $i -eq 10 ]; then
            echo "❌ Backend failed to start. Check backend/backend.log"
            cat backend.log
            exit 1
        fi
        sleep 1
        echo -n "."
    done
    echo ""

    cd ..

    SHOULD_KILL_BACKEND=true
else
    SHOULD_KILL_BACKEND=false
fi

echo ""
echo "Step 3: Running API tests..."
echo ""

cd backend
node test-generation.js

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅ Testing Complete!"
echo "═══════════════════════════════════════════════════════"
echo ""

if [ "$SHOULD_KILL_BACKEND" = true ]; then
    echo "Stopping test backend (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null || true
    echo ""
fi

echo "Next steps:"
echo ""
echo "1. If tests passed, try in Fusion 360:"
echo "   - Start backend: cd backend && node backend-fusion.js"
echo "   - Open Fusion 360"
echo "   - Load FusionCADCopilot add-in"
echo "   - Test with: 'Create a 50mm cube'"
echo ""
echo "2. If tests failed:"
echo "   - Check backend/.env has correct API key"
echo "   - Check backend/backend.log for errors"
echo "   - Read backend/TESTING.md for troubleshooting"
echo ""
echo "3. See IMPROVEMENT_SUMMARY.md for full details"
echo ""
