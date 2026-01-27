#!/bin/bash
# Quick script to push to GitHub

echo "📦 Pushing to GitHub..."

# Check if remote exists
if ! git remote get-url origin &>/dev/null; then
    echo "⚠️  No remote found. Add your GitHub repo:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git"
    exit 1
fi

# Push to GitHub
git push -u origin main

echo ""
echo "✅ Pushed to GitHub!"
echo ""
echo "📝 Enable GitHub Pages:"
echo "   1. Go to: https://github.com/YOUR_USERNAME/REPO_NAME/settings/pages"
echo "   2. Source: Deploy from a branch"
echo "   3. Branch: main, Folder: / (root)"
echo "   4. Click Save"
echo ""
echo "🌐 Your site will be live at:"
echo "   https://YOUR_USERNAME.github.io/REPO_NAME/"
