# OAuth Configuration

This project supports OAuth authentication with Google and GitHub providers alongside email OTP authentication.

## Environment Variables

Add these environment variables to configure OAuth functionality:

### Google OAuth

```bash
# Get these from https://console.cloud.google.com/
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### GitHub OAuth

```bash
# Get these from https://github.com/settings/developers
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

## Setup Instructions

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Configure the OAuth consent screen if prompted:
   - Choose "External" for public apps
   - Fill in the required app information
   - Add scopes: `email`, `profile`, `openid`
6. Create OAuth client ID:
   - Application type: "Web application"
   - Name: Your app name
   - Authorized redirect URIs:
     - For development: `http://localhost:3000/api/auth/callback/google`
     - For production: `https://yourdomain.com/api/auth/callback/google`
7. Copy the Client ID and Client Secret to your `.env` file

### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App" (or "Register a new application")
3. Fill in the application details:
   - Application name: Your app name
   - Homepage URL: `http://localhost:3000` (or your production URL)
   - Authorization callback URL:
     - For development: `http://localhost:3000/api/auth/callback/github`
     - For production: `https://yourdomain.com/api/auth/callback/github`
4. **Important**: After creating, go to the app settings and ensure the following:
   - The app has access to the `user:email` scope
5. Copy the Client ID and generate a Client Secret
6. Add them to your `.env` file

## Authentication Flow

The app uses a unified authentication flow:

1. **Email OTP**: Users can sign in with their email address and receive a one-time password
2. **OAuth**: Users can sign in with Google or GitHub accounts
3. **User Onboarding**: New users (regardless of auth method) will be prompted to enter their name after first sign-in

## Features

- **Unified Sign-In**: No separate sign-up/sign-in flows - users are automatically registered on first use
- **Email OTP**: Secure passwordless authentication via email
- **Social OAuth**: Quick sign-in with existing Google or GitHub accounts
- **Automatic User Creation**: New users are created automatically upon successful authentication
- **Profile Completion**: New users are prompted to complete their profile (name) after first sign-in

## Testing OAuth

To test OAuth functionality:

1. Set up your OAuth credentials in the respective platforms
2. Add the credentials to your `.env` file
3. Run the application in development mode
4. Click "Continue with Google" or "Continue with GitHub" on the auth page
5. Complete the OAuth flow in the provider's interface
6. You should be redirected back and signed in

## Troubleshooting

### Common Issues

- **"Invalid client_id"**: Ensure your OAuth credentials are correctly set in the `.env` file
- **"Redirect URI mismatch"**: Make sure the callback URLs in your OAuth app settings match exactly with your app's URLs
- **GitHub email not found**: Ensure your GitHub OAuth app has the `user:email` scope enabled
- **Google consent screen issues**: Make sure you've configured the OAuth consent screen in Google Cloud Console

### Security Notes

- Never commit OAuth credentials to version control
- Use different OAuth apps for development and production environments
- Regularly rotate your client secrets
- Monitor OAuth app usage in the respective provider dashboards 