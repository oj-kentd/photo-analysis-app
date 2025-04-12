# Setting Up Google OAuth Credentials

To connect your webapp to Google Photos API, you'll need to create OAuth 2.0 credentials in the Google Cloud Console. Follow these steps:

## 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter a name for your project (e.g., "Photo Analysis App")
5. Click "Create"

## 2. Enable the Required APIs

1. In your new project, go to "APIs & Services" > "Library"
2. Search for and enable the following APIs:
   - Google Photos Library API
   - Google People API (for user profile information)

## 3. Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (unless you have a Google Workspace account)
3. Click "Create"
4. Fill in the required information:
   - App name: "Photo Analysis App"
   - User support email: Your email address
   - Developer contact information: Your email address
5. Click "Save and Continue"
6. Add the following scopes:
   - `https://www.googleapis.com/auth/photoslibrary.readonly` (for Picker API)
   - `https://www.googleapis.com/auth/photoslibrary.appendonly` (for creating albums)
   - `https://www.googleapis.com/auth/photoslibrary.edit.appcreateddata` (for managing app-created albums)
7. Click "Save and Continue"
8. Add test users if you're still in testing mode
9. Click "Save and Continue"
10. Review your settings and click "Back to Dashboard"

## 4. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Enter a name for your OAuth client (e.g., "Photo Analysis Web Client")
5. Add authorized JavaScript origins:
   - For development: `http://localhost:3000`
   - For production: Your deployed app URL
6. Add authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://your-deployed-app.com/api/auth/callback/google`
7. Click "Create"
8. Note your Client ID and Client Secret (you'll need these for your app)

## 5. Configure Your Application

In your Next.js application, create a `.env.local` file with the following variables:

```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_key
```

For production, you'll need to set these environment variables in your hosting platform.

## 6. Important Notes

- Keep your Client Secret secure and never commit it to version control
- The Google Photos Library API has usage limits; monitor your usage in the Google Cloud Console
- Remember that some scopes in the Library API will be removed after March 2025
- For production use, you'll need to verify your app through the Google OAuth verification process
