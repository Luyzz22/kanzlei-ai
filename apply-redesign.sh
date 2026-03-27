#!/bin/bash
# KanzleiAI Redesign — Apply Script
# Ausführen im Root des kanzlei-ai Repos auf deinem MacBook
# Usage: bash apply-redesign.sh

set -e

echo "╔══════════════════════════════════════════════════╗"
echo "║  KanzleiAI — Apple-grade UI Redesign            ║"
echo "║  SBS Deutschland GmbH & Co. KG                  ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Check we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src/app" ]; then
  echo "❌ Bitte im Root des kanzlei-ai Repos ausführen!"
  exit 1
fi

echo "📦 Backup erstellen..."
git stash push -m "pre-redesign-backup-$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true

echo "📂 Dateien kopieren..."

# 1. tailwind.config.ts
cp redesign/tailwind.config.ts ./tailwind.config.ts

# 2. globals.css
cp redesign/globals.css ./src/app/globals.css

# 3. layout.tsx
cp redesign/layout.tsx ./src/app/layout.tsx

# 4. page.tsx (Landing Page)
cp redesign/page.tsx ./src/app/page.tsx

# 5. site-header.tsx
cp redesign/components/marketing/site-header.tsx ./src/components/marketing/site-header.tsx

# 6. site-footer.tsx
cp redesign/components/marketing/site-footer.tsx ./src/components/marketing/site-footer.tsx

# 7. consent-banner.tsx
cp redesign/components/gdpr/consent-banner.tsx ./src/components/gdpr/consent-banner.tsx

echo "✅ Alle 7 Dateien übernommen!"
echo ""
echo "🔨 Build starten..."
npx next build

echo ""
echo "🚀 Deploy:"
echo "   git add -A"
echo "   git commit -m 'feat: Apple-grade UI redesign — SBS Deutschland brand system'"
echo "   git push origin main"
echo ""
echo "Vercel deployed automatisch nach Push."
