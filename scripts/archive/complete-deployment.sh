#!/bin/bash
# Complete deployment script

echo "🚀 Completing GitHub Pages deployment..."

# Add remote if not exists
if ! git remote get-url origin &>/dev/null; then
    git remote add origin https://github.com/lahavrud/aws-saa-c03-practice-exam.git
    echo "✅ Remote added"
else
    git remote set-url origin https://github.com/lahavrud/aws-saa-c03-practice-exam.git
    echo "✅ Remote updated"
fi

# Push to GitHub
echo "📤 Pushing code to GitHub..."
git push -u origin main

# Enable GitHub Pages
echo "🌐 Enabling GitHub Pages..."
gh api repos/lahavrud/aws-saa-c03-practice-exam/pages -X POST \
  -f 'source[branch]=main' \
  -f 'source[path]=/' || \
gh api repos/lahavrud/aws-saa-c03-practice-exam/pages -X PUT \
  -f 'source[branch]=main' \
  -f 'source[path]=/'

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your site will be available at:"
echo "   https://lahavrud.github.io/aws-saa-c03-practice-exam/"
echo ""
echo "⏱️  It may take a few minutes for GitHub Pages to build and deploy."
