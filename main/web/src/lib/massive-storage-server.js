/**
 * SECURE Massive S3 Storage Service
 * **SERVER-SIDE ONLY** - Never expose credentials to frontend
 * Credentials must be in Vercel environment variables, NOT in frontend code
 */

import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

let massiveClient = null;

/**
 * Initialize S3 client - ONLY called on backend/server
 * ⚠️ SECURITY: Never call this from frontend code
 */
export async function initMassiveClient() {
  if (massiveClient) return massiveClient;

  // SECURITY: These must be server-side only environment variables
  const accessKey = process.env.MASSIVE_ACCESS_KEY;
  const secretKey = process.env.MASSIVE_SECRET_KEY;
  const endpoint = process.env.MASSIVE_S3_ENDPOINT || "https://files.massive.com";

  // SECURITY: Validate credentials exist
  if (!accessKey || !secretKey) {
    console.error("❌ SECURITY: Massive S3 credentials not configured in server environment");
    return null;
  }

  try {
    massiveClient = new S3Client({
      endpoint,
      region: "us-east-1",
      forcePathStyle: true,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });

    console.log("✅ Massive S3 client initialized (server-side)");
    return massiveClient;
  } catch (error) {
    console.error("❌ Failed to initialize Massive client:", error);
    return null;
  }
}

/**
 * Upload file to Massive S3
 * ⚠️ SECURITY: This must be called from backend API route, never from frontend
 */
export async function uploadToMassive(file, folder = "uploads") {
  const client = await initMassiveClient();
  if (!client) throw new Error("Massive storage not configured");

  const bucket = process.env.MASSIVE_BUCKET || "flatfiles";

  // SECURITY: Sanitize filename to prevent directory traversal
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 255);
  const key = `${folder}/${Date.now()}-${sanitizedName}`;

  // SECURITY: Validate file size on server
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB server limit
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File exceeds maximum size (50 MB)");
  }

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file,
        ContentType: file.type || "application/octet-stream",
        // SECURITY: Set ACL to private
        ACL: "private",
      })
    );

    return { success: true, key, bucket };
  } catch (error) {
    console.error("❌ Upload failed:", error);
    throw new Error("Failed to upload file");
  }
}

/**
 * List files in Massive S3 (server-side only)
 */
export async function listFilesInMassive(folder = "uploads") {
  const client = await initMassiveClient();
  if (!client) return [];

  const bucket = process.env.MASSIVE_BUCKET || "flatfiles";

  try {
    const response = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: `${folder}/` })
    );
    return response.Contents || [];
  } catch (error) {
    console.error("❌ List files failed:", error);
    return [];
  }
}

/**
 * Delete file from Massive S3 (server-side only, admin only)
 */
export async function deleteFromMassive(key) {
  const client = await initMassiveClient();
  if (!client) return false;

  const bucket = process.env.MASSIVE_BUCKET || "flatfiles";

  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    console.log(`✅ File deleted: ${key}`);
    return true;
  } catch (error) {
    console.error("❌ Delete failed:", error);
    return false;
  }
}

