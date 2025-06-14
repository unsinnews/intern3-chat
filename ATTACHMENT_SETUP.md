# File Attachment System Setup

This guide explains how to set up and use the file attachment system with Cloudflare R2 and Convex.

## Prerequisites

### 1. Cloudflare R2 Setup

1. **Create a Cloudflare account** if you don't have one
2. **Create an R2 bucket**:
   - Go to R2 Object Storage in your Cloudflare dashboard
   - Click "Create bucket"
   - Choose a bucket name and region
3. **Set up CORS policy** for your bucket:
   ```json
   [
     {
       "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
       "AllowedMethods": ["GET", "PUT", "POST"],
       "AllowedHeaders": ["Content-Type", "Authorization"]
     }
   ]
   ```
4. **Create API Token**:
   - Go to R2 → Manage R2 API Tokens
   - Click "Create API Token"
   - Set permissions to "Object Read & Write"
   - Select your bucket under "Specify bucket"
   - Copy the provided credentials

### 2. Environment Variables

Set these environment variables in your Convex deployment:

```bash
npx convex env set R2_TOKEN "your-token-value"
npx convex env set R2_ACCESS_KEY_ID "your-access-key-id"
npx convex env set R2_SECRET_ACCESS_KEY "your-secret-access-key"
npx convex env set R2_ENDPOINT "your-r2-endpoint"
npx convex env set R2_BUCKET "your-bucket-name"
```

## Implementation

### 1. Backend Setup

The backend implementation includes:

- **`convex/convex.config.ts`**: Configures the R2 component
- **`convex/attachments.ts`**: Contains HTTP actions and mutations for file handling
- **`convex/http.ts`**: Registers HTTP routes for file operations

### 2. Frontend Components

#### FileAttachment Component

```tsx
import { FileAttachment } from '@/components/file-attachment';

function MyComponent() {
  const handleFilesUploaded = (files) => {
    console.log('Files uploaded:', files);
    // Handle uploaded files
  };

  return (
    <FileAttachment
      onFilesUploaded={handleFilesUploaded}
      maxFiles={5}
      maxFileSize={10 * 1024 * 1024} // 10MB
      acceptedFileTypes={['image/*', 'application/pdf', '.docx']}
      multiple={true}
    />
  );
}
```

#### useFileUpload Hook

```tsx
import { useFileUpload } from '@/hooks/use-file-upload';

function MyComponent() {
  const { uploadFile, uploading, progress, error, resetError } = useFileUpload();

  const handleUpload = async (file: File) => {
    try {
      const result = await uploadFile(file);
      console.log('Upload successful:', result);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div>
      {uploading && <div>Uploading... {progress}%</div>}
      {error && <div>Error: {error}</div>}
      {/* Your file upload UI */}
    </div>
  );
}
```

## API Endpoints

### GET /api/attachments/upload-url

Generates a signed upload URL for file upload.

**Query Parameters:**
- `fileName`: Name of the file
- `fileType`: MIME type of the file

**Response:**
```json
{
  "uploadUrl": "https://...",
  "key": "unique-file-key",
  "fileName": "example.pdf",
  "fileType": "application/pdf"
}
```

### POST /api/attachments/upload-complete

Notifies the backend that a file upload is complete.

**Request Body:**
```json
{
  "key": "unique-file-key",
  "fileName": "example.pdf",
  "fileType": "application/pdf",
  "fileSize": 12345
}
```

**Response:**
```json
{
  "success": true,
  "attachment": {
    "key": "unique-file-key",
    "fileName": "example.pdf",
    "fileType": "application/pdf",
    "fileSize": 12345,
    "uploadedAt": 1640995200000
  }
}
```

## Convex Functions

### Queries
- `getFileUrl(key)`: Get a public URL for a file
- `getFileMetadata(key)`: Get metadata for a file
- `listFiles(limit?)`: List all files with pagination

### Mutations
- `deleteFile(key)`: Delete a file from R2

### Actions
- `storeFile(fileUrl, fileName, fileType)`: Store a file from a URL

## Current Implementation Status

⚠️ **Important**: The current implementation includes placeholder code for R2 integration. To complete the setup, you need to:

1. **Update `convex/attachments.ts`**:
   - Replace placeholder URLs with actual R2 signed URL generation
   - Implement proper R2 API calls for file operations
   - Add proper error handling and validation

2. **Update `src/hooks/use-file-upload.ts`**:
   - Implement actual file upload to R2 using signed URLs
   - Add proper progress tracking
   - Handle R2-specific upload requirements

3. **Add database schema** for storing file metadata if needed
4. **Configure proper authentication** and authorization for file uploads
5. **Add file type validation** and security measures

## Security Considerations

- Validate file types and sizes on both client and server
- Implement proper authentication for upload endpoints
- Use signed URLs with expiration times
- Scan uploaded files for malware if needed
- Implement rate limiting for upload endpoints
- Store sensitive file metadata securely

## Example Usage in Chat

```tsx
// In your chat component
import { FileAttachment } from '@/components/file-attachment';

function ChatInput() {
  const [attachments, setAttachments] = useState([]);

  const handleFilesUploaded = (files) => {
    setAttachments(prev => [...prev, ...files]);
  };

  const sendMessage = () => {
    // Include attachments in your message
    const messageData = {
      text: messageText,
      attachments: attachments.map(file => ({
        key: file.key,
        fileName: file.fileName,
        fileType: file.fileType
      }))
    };
    // Send message with attachments
  };

  return (
    <div>
      <FileAttachment 
        onFilesUploaded={handleFilesUploaded}
        maxFiles={3}
        acceptedFileTypes={['image/*', 'application/pdf']}
      />
      {/* Your chat input UI */}
    </div>
  );
}
```

## Next Steps

1. Set up your Cloudflare R2 bucket and credentials
2. Update the placeholder implementations with actual R2 API calls
3. Test the file upload functionality
4. Add proper error handling and user feedback
5. Implement file display in your chat interface
6. Add security measures and validation 