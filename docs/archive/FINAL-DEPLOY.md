# Final Deployment Steps

✅ **Repository Created:** https://github.com/lahavrud/aws-saa-c03-practice-exam

## To Complete Deployment:

### Option 1: Using SSH (if you have SSH keys set up)
```bash
git remote set-url origin git@github.com:lahavrud/aws-saa-c03-practice-exam.git
git push -u origin main
```

### Option 2: Authenticate GitHub CLI first
```bash
gh auth login
# Follow the prompts to authenticate
git push -u origin main
```

### Option 3: Use Personal Access Token
```bash
# Push with token (you'll be prompted for password, use your token)
git push -u origin main
```

## Enable GitHub Pages:

After pushing, enable GitHub Pages:

```bash
gh api repos/lahavrud/aws-saa-c03-practice-exam/pages -X POST \
  -f 'source[branch]=main' \
  -f 'source[path]=/'
```

Or manually:
1. Go to: https://github.com/lahavrud/aws-saa-c03-practice-exam/settings/pages
2. Source: Deploy from a branch
3. Branch: main, Folder: / (root)
4. Click Save

## Your Site Will Be Live At:
https://lahavrud.github.io/aws-saa-c03-practice-exam/
