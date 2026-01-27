# Deployment Guide

## GitHub Pages Deployment

This application is fully configured for GitHub Pages deployment. Follow these steps:

### Initial Setup

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Navigate to Settings → Pages
   - Under "Source", select:
     - Branch: `main` (or `master`)
     - Folder: `/` (root)
   - Click Save

3. **Wait for deployment**
   - GitHub Pages will build and deploy your site
   - Usually takes 1-2 minutes
   - You'll see a green checkmark when deployment is complete

4. **Access your site**
   - Your site will be available at:
     - `https://<username>.github.io/<repository-name>/`
   - Example: `https://lahavrud.github.io/AWS-SAA-C03/`

### Automatic Deployment

GitHub Pages automatically deploys on every push to the `main` branch. Just push your changes:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

The site will automatically update within 1-2 minutes.

### Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file in the root directory with your domain:
   ```
   example.com
   ```

2. Configure DNS:
   - Add a CNAME record pointing to `<username>.github.io`
   - Or add A records for GitHub Pages IPs

3. Update GitHub Pages settings:
   - Settings → Pages → Custom domain
   - Enter your domain

## Project Structure for GitHub Pages

The project is organized to work seamlessly with GitHub Pages:

```
AWS-SAA-C03/
├── index.html          # Entry point (served at root)
├── app.js              # Core application
├── styles.css          # Styling
├── question-loader.js  # Question loading
├── questions.js        # Generated questions
├── questions/          # JSON question files
├── scripts/            # Development scripts (not deployed)
├── docs/               # Documentation
└── .vscode/           # VS Code settings (not deployed)
```

**Important:** All paths are relative, so the app works whether deployed to:
- Root domain: `https://username.github.io/repo/`
- Custom domain: `https://example.com/`

## Verification Checklist

Before deploying, ensure:

- [ ] `index.html` exists in root directory
- [ ] All JavaScript files use relative paths (no absolute paths)
- [ ] JSON files are in `questions/` directory
- [ ] `.gitignore` excludes unnecessary files (venv, backups, etc.)
- [ ] No hardcoded localhost URLs in code
- [ ] All assets (CSS, JS) use relative paths

## Troubleshooting Deployment

### Site shows 404
- Check that `index.html` is in the root directory
- Verify the branch name matches your GitHub Pages source branch
- Wait a few minutes for initial deployment

### Questions not loading
- Check browser console for errors
- Verify JSON files are committed to repository
- Ensure paths are relative (not absolute)

### Styling broken
- Check that `styles.css` is in root directory
- Verify CSS file path in `index.html` is correct
- Clear browser cache

### Changes not appearing
- Wait 1-2 minutes for GitHub Pages to rebuild
- Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)
- Check GitHub Actions tab for deployment status

## Alternative Hosting Options

### Netlify
1. Connect your GitHub repository
2. Build command: (leave empty)
3. Publish directory: `/`
4. Deploy!

### Vercel
1. Import GitHub repository
2. Framework preset: Other
3. Deploy!

### AWS S3 + CloudFront
1. Create S3 bucket
2. Enable static website hosting
3. Upload all files
4. Configure CloudFront distribution
5. Point domain to CloudFront

## Environment-Specific Configuration

The app automatically detects the environment:
- **Local development**: Requires HTTP server (Live Server, Python, etc.)
- **GitHub Pages**: Works automatically with relative paths
- **Custom domain**: Works automatically with relative paths

No configuration changes needed between environments!
