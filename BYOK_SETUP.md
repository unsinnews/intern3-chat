# BYOK (Bring Your Own Key) Setup

This project supports BYOK functionality, allowing users to securely store and use their own API keys for different AI providers.

## Environment Setup

You need to set up the following environment variables:

### Required for Encryption
```bash
# Generate a 32-character hex string for encryption
ENCRYPTION_KEY=your_32_character_hex_string_here
```

To generate an encryption key, run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Default API Keys (Fallback)
These are used when users don't provide their own keys:
```bash
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key
OPENAI_API_KEY=your_openai_api_key  
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## Supported Providers

The system supports the following AI providers:
- OpenAI (GPT models)
- Anthropic (Claude models)
- Google (Gemini models)

## How It Works

1. **Storage**: User API keys are encrypted using AES-256-CBC encryption before being stored in the database
2. **Usage**: When a user makes a chat request, the system:
   - Checks for user's stored API keys in order of preference (OpenAI → Anthropic → Google)
   - Uses the first available user API key
   - Falls back to default environment variables if no user keys are found
3. **Security**: API keys are never stored in plain text and are decrypted only at runtime

## Type Safety

All provider types flow from a single schema definition in `convex/schema/apikey.ts`:
- `Provider` type defines all supported providers
- `providerSchema` is the Convex schema validation
- All other files import and reuse these types to avoid duplication

## API Usage

### Store API Key
```typescript
await storeApiKey({
  provider: "openai", // or "anthropic" | "google"
  apiKey: "your-api-key",
  name: "My OpenAI Key" // optional
});
```

### Delete API Key
```typescript
await deleteApiKey({
  keyId: "key-id"
});
```

The system automatically deactivates old keys when storing new ones for the same provider. 