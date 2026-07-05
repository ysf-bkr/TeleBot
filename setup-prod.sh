#!/bin/bash

# Exit on error
set -e

echo "🚀 Telegram Bot Panel - SaaS Production Setup Script"
echo "--------------------------------------------------"

# 1. Environment variables check
if [ ! -f .env ]; then
  echo "⚠️  Root .env file not found. Copying .env.example..."
  cp .env.example .env
  echo "ℹ️  Please edit the root .env file later with your production configuration."
fi

if [ ! -f backend/.env ]; then
  echo "⚠️  Backend .env file not found. Copying backend/.env.example..."
  cp backend/.env.example backend/.env
  echo "ℹ️  Please edit backend/.env with your Stripe/Telegram tokens."
fi

# 2. Install dependencies
echo "📦 Installing root dependencies..."
npm install

echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

# 3. Initialize Database
echo "🗄️  Initializing SQLite Database schema..."
cd backend && npm run db:init && cd ..

# 4. Build both frontend and backend
echo "🏗️  Building production assets..."
npm run build

echo "--------------------------------------------------"
echo "✅ Setup Completed Successfully!"
echo ""
echo "📝 Next Steps:"
echo "1. Edit 'backend/.env' to add your bot token (TELEGRAM_BOT_TOKEN) and Stripe webhook secret (STRIPE_WEBHOOK_SECRET)."
echo "2. Run 'npm start' to run both backend and frontend servers in production."
echo "3. Use a process manager like PM2 to keep the backend running forever: 'pm2 start backend/dist/index.js --name bot-panel'"
echo "--------------------------------------------------"
