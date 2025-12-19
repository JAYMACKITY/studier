# Google Authentication Setup

To enable Google Sign-In functionality, you need to:

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google+ API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized JavaScript origins (e.g., `http://localhost:3000`, your production domain)
   - Add authorized redirect URIs
   - Copy your Client ID

4. **Update auth.js**
   - Open `auth.js`
   - Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Google Client ID in two places:
     - Line ~20: `client_id: 'YOUR_GOOGLE_CLIENT_ID'`
     - Line ~60: `client_id: 'YOUR_GOOGLE_CLIENT_ID'`

5. **Backend Integration (Recommended)**
   - The current implementation stores tokens in localStorage
   - For production, you should:
     - Send the Google credential to your backend
     - Verify the token on the server
     - Create a session
     - Return a secure session token

## Current Implementation

The Google Sign-In button is functional but requires:
- A valid Google Client ID
- Backend verification for production use

Until configured, users can still use email/password authentication.

