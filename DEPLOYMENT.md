# GitHub Pages Deployment Guide

This guide will walk you through the process of deploying your Photo Analysis Webapp to GitHub Pages.

## Prerequisites

1. A GitHub account
2. Git installed on your local machine
3. Your Google OAuth credentials

## Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in to your account
2. Click on the "+" icon in the top-right corner and select "New repository"
3. Name your repository `photo-analysis-app`
4. Choose whether to make it public or private
5. Click "Create repository"

## Step 2: Push Your Code to GitHub

1. Initialize a Git repository in your project folder (if not already done):
   ```bash
   cd photo-analysis-app
   git init
   ```

2. Add all files to the repository:
   ```bash
   git add .
   ```

3. Commit the changes:
   ```bash
   git commit -m "Initial commit"
   ```

4. Add your GitHub repository as the remote origin:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/photo-analysis-app.git
   ```

5. Push your code to GitHub:
   ```bash
   git push -u origin main
   ```

## Step 3: Set Up GitHub Secrets

You need to add your Google OAuth credentials as secrets in your GitHub repository:

1. Go to your repository on GitHub
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret"
4. Add the following secrets:
   - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
   - `NEXTAUTH_URL`: The URL where your app will be deployed (e.g., `https://YOUR_USERNAME.github.io/photo-analysis-app`)
   - `NEXTAUTH_SECRET`: A random string for NextAuth.js encryption

## Step 4: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on "Settings" > "Pages"
3. Under "Source", select "GitHub Actions"
4. The workflow we've set up will automatically deploy your app when you push to the main branch

## Step 5: Trigger the Deployment

The deployment workflow will automatically run when you push to the main branch. If you want to manually trigger it:

1. Go to your repository on GitHub
2. Click on "Actions"
3. Select the "Deploy to GitHub Pages" workflow
4. Click "Run workflow" > "Run workflow"

## Step 6: Access Your Deployed App

After the workflow completes successfully:

1. Go to `https://YOUR_USERNAME.github.io/photo-analysis-app`
2. Your Photo Analysis Webapp should now be live!

## Important Notes

1. **OAuth Redirect URI**: Make sure to add `https://YOUR_USERNAME.github.io/photo-analysis-app/api/auth/callback/google` as an authorized redirect URI in your Google Cloud Console.

2. **First Deployment**: The first deployment might take a few minutes to become available.

3. **Updating Your App**: Any changes pushed to the main branch will automatically trigger a new deployment.

4. **Troubleshooting**: If you encounter any issues, check the Actions tab in your GitHub repository for error logs.

## Next Steps

Once your app is deployed, you can:

1. Share the URL with others
2. Continue to enhance the app with new features
3. Monitor usage and gather feedback for improvements

Congratulations on deploying your Photo Analysis Webapp to GitHub Pages!
