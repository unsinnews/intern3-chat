const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const IV_LENGTH = 16;

if (!ENCRYPTION_KEY) throw new Error("ENCRYPTION_KEY is required");

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function getCryptoKey() {
  const keyBuffer = Buffer.from(ENCRYPTION_KEY, "hex");
  return await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-CBC" },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function keyGen(): Promise<string> {
  const key = crypto.getRandomValues(new Uint8Array(32));
  return Buffer.from(key).toString("hex");
}

export async function encrypt(plainText: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await getCryptoKey();
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    key,
    encoder.encode(plainText)
  );
  return (
    Buffer.from(iv).toString("hex") +
    ":" +
    Buffer.from(encrypted).toString("hex")
  );
}

export async function decrypt(cipherText: string): Promise<string> {
  const [ivHex, encryptedHex] = cipherText.split(":");
  if (!ivHex || !encryptedHex) throw new Error("Invalid cipher format");

  const iv = Buffer.from(ivHex, "hex");
  const encryptedBuffer = Buffer.from(encryptedHex, "hex");
  const key = await getCryptoKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv },
    key,
    encryptedBuffer
  );
  return decoder.decode(decrypted);
}
