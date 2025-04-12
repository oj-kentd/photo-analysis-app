# Photo Analysis Webapp - Implementation Guide

## Overview

This document provides a comprehensive guide to the Photo Analysis Webapp we've built. The application connects to Google Photos, analyzes photos based on technical quality, aesthetics, and facial expressions, and allows you to create albums with selected photos.

## Features

- **Google Photos Integration**: Connect to your Google Photos account to select photos for analysis
- **Technical Quality Analysis**: Evaluate photos for blur, noise, and exposure
- **Aesthetic Evaluation**: Score photos based on composition, color harmony, and contrast
- **Facial Expression Analysis**: Detect faces and evaluate expressions
- **Album Creation**: Create new albums with your selected photos

## Setup Instructions

### Prerequisites

1. A Google account with Google Photos
2. Google Cloud Platform account to create OAuth credentials

### Google OAuth Credentials

Follow these steps to set up your Google OAuth credentials:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google Photos Library API
4. Configure the OAuth consent screen
5. Create OAuth 2.0 credentials
6. Add authorized JavaScript origins and redirect URIs

Detailed instructions are available in the `src/app/api/auth/google-credentials-guide.md` file.

### Local Development

1. Clone the repository
2. Create a `.env.local` file with your Google credentials:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_random_secret_key
   ```
3. Install dependencies: `pnpm install`
4. Start the development server: `pnpm dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

### Authentication Flow

The application uses NextAuth.js to handle Google OAuth authentication. When you sign in, the app requests the necessary scopes to access your Google Photos library.

### Photo Selection

The Google Photos Picker API is used to allow you to select photos from your library. This provides a secure way to grant access to specific content without giving the app access to your entire library.

### Photo Analysis

Selected photos are analyzed using three main components:

1. **Technical Quality Analysis**:
   - Blur detection using Laplacian variance
   - Noise detection in uniform areas
   - Exposure analysis using histogram evaluation

2. **Aesthetic Evaluation**:
   - Color harmony analysis
   - Composition evaluation using rule of thirds
   - Contrast assessment

3. **Facial Expression Analysis**:
   - Face detection using face-api.js
   - Expression evaluation (happy, sad, neutral, etc.)
   - Scoring based on expression quality

### Album Creation

After analysis, you can select photos based on their scores and create a new album in Google Photos using the Library API.

## Technical Implementation

### Frontend

- Next.js for the React framework
- TailwindCSS for styling
- face-api.js for facial expression analysis
- TensorFlow.js for machine learning models

### Backend

- Next.js API routes for server-side logic
- NextAuth.js for authentication
- Google Photos API for photo access and album creation

### Analysis Algorithms

The application implements custom algorithms for:
- Blur detection using Laplacian filters
- Noise estimation in uniform areas
- Color harmony based on color theory
- Composition analysis using rule of thirds
- Face expression evaluation

## Limitations and Future Enhancements

### Current Limitations

- Face expression analysis requires clear, front-facing portraits
- Technical quality assessment works best on well-lit photos
- Google Photos API changes in March 2025 will affect functionality

### Planned Enhancements

- Batch processing for analyzing large numbers of photos
- Custom aesthetic models that can be trained on your preferences
- More sophisticated filtering based on analysis results
- Export options for analysis data

## Troubleshooting

### Common Issues

- **Authentication errors**: Ensure your Google OAuth credentials are correctly configured
- **Photo selection issues**: Check that you've granted the necessary permissions
- **Analysis errors**: Verify that the face-api.js models are properly loaded

### Support

For additional support or to report issues, please contact the development team.

## Conclusion

The Photo Analysis Webapp provides a powerful way to find your best photos based on technical quality, aesthetics, and facial expressions. By leveraging Google Photos integration, you can easily select photos for analysis and create albums with your top selections.
