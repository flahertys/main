# Deployment Guide for tradehax.net

This repository is configured to deploy automatically to GitHub Pages at **tradehax.net**.

## Current Status

✅ **Repository Setup Complete**
- All HTML pages are ready
- Assets (CSS, logo, PDF) are in place
- Resume images optimized and included
- CNAME file created for custom domain
- GitHub Pages workflow configured

## How to Deploy

### 1. GitHub Pages Configuration

The site will automatically deploy when changes are pushed to the `main` branch via GitHub Actions workflow (`.github/workflows/static.yml`).

**To enable GitHub Pages:**
1. Go to your repository: https://github.com/DarkModder33/main
2. Navigate to **Settings** → **Pages**
3. Under "Source", select **GitHub Actions** (this should already be configured)
4. The custom domain should be set to: `tradehax.net`

### 2. Squarespace DNS Configuration

Since you own tradehax.net through Squarespace, you need to configure DNS records to point to GitHub Pages:

**Add these DNS records in your Squarespace domain settings:**

1. **A Records** (for apex domain):
   ```
   Type: A
   Host: @
   Points to: 185.199.108.153
   
   Type: A
   Host: @
   Points to: 185.199.109.153
   
   Type: A
   Host: @
   Points to: 185.199.110.153
   
   Type: A
   Host: @
   Points to: 185.199.111.153
   ```

2. **CNAME Record** (for www subdomain):
   ```
   Type: CNAME
   Host: www
   Points to: darkmodder33.github.io
   ```

**Steps to add DNS records in Squarespace:**
1. Log into your Squarespace account
2. Go to **Settings** → **Domains** → **tradehax.net**
3. Click **DNS Settings**
4. Click **Add Record** for each DNS record above
5. Save changes

**Note:** DNS propagation can take up to 24-48 hours, but usually completes within a few hours.

### 3. Verify Deployment

After DNS propagation:
1. Visit https://tradehax.net to see your site
2. Check that the resume displays correctly
3. Test navigation links (About, Projects, Blog)
4. Verify the PDF download works

### 4. Enable HTTPS

Once your custom domain is working:
1. Go to Repository **Settings** → **Pages**
2. Check the box for **Enforce HTTPS**
3. GitHub will automatically provision an SSL certificate

## Site Structure

```
/
├── index.html              # Homepage with resume viewer
├── about.html              # About page
├── projects.html           # Projects page
├── blog/
│   └── index.html          # Blog placeholder
├── assets/
│   ├── logo.svg            # Site logo
│   └── style.css           # Styles
├── MichaelSFlahertyResume.pdf  # Resume PDF
├── resume-images/          # Optimized resume images
├── robots.txt              # Search engine directives
├── sitemap.xml             # Sitemap for SEO
└── 404.html                # Custom 404 page
```

## Making Updates

1. Make changes to your HTML/CSS/content files
2. Commit changes: `git add . && git commit -m "Your message"`
3. Push to main branch: `git push origin main`
4. GitHub Actions will automatically deploy (usually within 1-2 minutes)
5. View deployment status at: https://github.com/DarkModder33/main/actions

## Troubleshooting

### Site not loading after DNS setup
- Check DNS propagation: https://dnschecker.org (enter tradehax.net)
- Verify GitHub Pages is enabled in repository settings
- Check that CNAME file contains only: `tradehax.net`
- Review GitHub Actions for deployment errors

### 404 errors
- Ensure all asset paths use absolute paths (starting with `/`)
- Check that files are committed to the main branch
- Verify .nojekyll file exists (prevents Jekyll processing)

### HTTPS not working
- Wait for DNS to fully propagate before enabling HTTPS
- GitHub Pages SSL provisioning can take a few minutes
- Try disabling and re-enabling HTTPS in settings if needed

## Support

For issues with:
- **GitHub Pages**: Check [GitHub Pages documentation](https://docs.github.com/en/pages)
- **Squarespace DNS**: Contact [Squarespace support](https://support.squarespace.com/)
- **Repository code**: Open an issue in this repository
