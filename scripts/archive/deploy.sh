#!/bin/bash
# Quick deployment script for GitHub Pages

echo "🚀 Deploying AWS SAA-C03 Practice Exam to GitHub Pages..."

# Check if remote exists
if ! git remote get-url origin &>/dev/null; then
    echo "❌ No GitHub remote found!"
    echo "Please create a GitHub repository and add it as remote:"
    echo "  git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
    exit 1
fi

# Add all files
git add .

# Commit
git commit -m "Deploy AWS SAA-C03 Practice Exam website" || echo "No changes to commit"

# Push to main branch
git push origin main

# Enable GitHub Pages (if not already enabled)
echo ""
echo "✅ Code pushed to GitHub!"
echo ""
echo "📝 Next steps to enable GitHub Pages:"
echo "1. Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/pages"
echo "2. Under 'Source', select 'Deploy from a branch'"
echo "3. Select 'main' branch and '/ (root)' folder"
echo "4. Click 'Save'"
echo ""
echo "Your site will be available at:"
echo "https://YOUR_USERNAME.github.io/YOUR_REPO/"
