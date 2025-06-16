# Email Configuration

This project supports email functionality for authentication (email verification and password reset) using either [Resend](https://resend.com) or [AWS SES](https://aws.amazon.com/ses/).

## Environment Variables

Add these environment variables to configure email functionality:

### Required Variables

```bash
# Choose your email provider: 'resend' or 'ses' (defaults to 'resend')
EMAIL_PROVIDER=resend

# The 'from' email address for all outgoing emails
EMAIL_FROM=noreply@yourdomain.com
```

### Resend Configuration (if EMAIL_PROVIDER=resend)

```bash
# Get your API key from https://resend.com/api-keys
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### AWS SES Configuration (if EMAIL_PROVIDER=ses)

```bash
# Required: AWS region where SES is configured
AWS_REGION=us-east-1

# Optional: AWS credentials (if not using IAM roles/instance profiles)
# If not provided, will use default AWS credential chain
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
```

## Setup Instructions

### Option 1: Using Resend (Recommended for simplicity)

1. Sign up at [Resend](https://resend.com)
2. Create a new API key in your dashboard
3. Add your domain and verify it (or use their sandbox domain for testing)
4. Set environment variables:
   ```bash
   EMAIL_PROVIDER=resend
   EMAIL_FROM=noreply@yourdomain.com
   RESEND_API_KEY=re_your_api_key_here
   ```

### Option 2: Using AWS SES

1. Set up AWS SES in your AWS account
2. Verify your sending domain or email address
3. If using IAM credentials, create a user with SES permissions
4. Set environment variables:
   ```bash
   EMAIL_PROVIDER=ses
   EMAIL_FROM=noreply@yourdomain.com
   AWS_REGION=us-east-1
   # Optional if using IAM roles:
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   ```

## Email Templates

The project includes two email templates:

- **Email Verification**: Sent when users sign up and need to verify their email
- **Password Reset**: Sent when users request a password reset

Both templates are built with [React Email](https://react.email/) and render as clean, responsive HTML emails with plain text fallbacks.

## Testing

To test email functionality:

1. Set up your environment variables
2. Run the application in development mode
3. Try signing up with a new account or requesting a password reset
4. Check your email service's logs/dashboard to confirm emails are being sent

## Troubleshooting

### Common Issues

- **"RESEND_API_KEY is required"**: Make sure you've set the `RESEND_API_KEY` environment variable
- **"AWS_REGION is required"**: Make sure you've set the `AWS_REGION` environment variable when using SES
- **Email not sending**: Check your email service dashboard/logs for delivery status
- **Domain verification**: Ensure your domain is verified in Resend or AWS SES

### Environment Variable Priority

The email service uses the following priority for configuration:

1. `EMAIL_PROVIDER` determines which service to use (defaults to 'resend')
2. `EMAIL_FROM` sets the sender address (defaults to 'noreply@intern3.chat')
3. Provider-specific variables are required based on the chosen provider 