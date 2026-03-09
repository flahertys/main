/**
 * Massive.com S3 Storage Service
 * File upload and download management for TradeHax
 * Bucket: flatfiles
 * Endpoint: https://files.massive.com
 */

import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

let massiveClient = null;

/**
 * Initialize Massive S3 client
 */
export async function initMassiveClient() {
  if (massiveClient) return massiveClient;

  const accessKey = import.meta.env.VITE_MASSIVE_ACCESS_KEY;
  const endpoint = import.meta.env.VITE_MASSIVE_S3_ENDPOINT || "https://files.massive.com";
  const bucket = import.meta.env.VITE_MASSIVE_BUCKET || "flatfiles";

  if (!accessKey) {
    console.warn("⚠️ Massive access key not configured - file storage disabled");
    return null;
  }

  try {
    massiveClient = new S3Client({
      endpoint,
      region: "us-east-1",
      forcePathStyle: true,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: import.meta.env.VITE_MASSIVE_SECRET_KEY || accessKey,
      },
    });

    console.log("✅ Massive S3 client initialized");
    return massiveClient;
  } catch (error) {
    console.error("❌ Failed to initialize Massive client:", error);
    return null;
  }
}

/**
 * Upload file to Massive S3
 * @param {File} file - File to upload
 * @param {string} folder - Folder path (e.g., "trading-data/2026-03")
 * @returns {Promise<string>} - File URL on Massive
 */
export async function uploadToMassive(file, folder = "uploads") {
  const client = await initMassiveClient();
  if (!client) {
    throw new Error("Massive storage not configured");
  }

  try {
    const bucket = import.meta.env.VITE_MASSIVE_BUCKET || "flatfiles";
    const timestamp = Date.now();
    const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `${folder}/${timestamp}-${sanitized}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: file.type,
    });

    await client.send(command);
    const fileUrl = `${import.meta.env.VITE_MASSIVE_S3_ENDPOINT}/${bucket}/${key}`;

    console.log(`✅ File uploaded: ${fileUrl}`);
    return fileUrl;
  } catch (error) {
    console.error("❌ Upload failed:", error);
    throw error;
  }
}

/**
 * List files in Massive S3 folder
 * @param {string} folder - Folder path
 * @returns {Promise<Array>} - List of files
 */
export async function listFilesInMassive(folder = "uploads") {
  const client = await initMassiveClient();
  if (!client) {
    throw new Error("Massive storage not configured");
  }

  try {
    const bucket = import.meta.env.VITE_MASSIVE_BUCKET || "flatfiles";

    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: `${folder}/`,
    });

    const response = await client.send(command);
    return response.Contents || [];
  } catch (error) {
    console.error("❌ List files failed:", error);
    return [];
  }
}

/**
 * Delete file from Massive S3
 * @param {string} key - File key/path
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteFromMassive(key) {
  const client = await initMassiveClient();
  if (!client) {
    throw new Error("Massive storage not configured");
  }

  try {
    const bucket = import.meta.env.VITE_MASSIVE_BUCKET || "flatfiles";

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await client.send(command);
    console.log(`✅ File deleted: ${key}`);
    return true;
  } catch (error) {
    console.error("❌ Delete failed:", error);
    return false;
  }
}

/**
 * Export trading data to CSV and upload to Massive
 * @param {Array} data - Trading data array
 * @param {string} filename - Output filename
 * @returns {Promise<string>} - File URL
 */
export async function exportTradingDataToMassive(data, filename = "trading-export.csv") {
  try {
    // Convert to CSV
    const headers = Object.keys(data[0] || {});
    const csv = [
      headers.join(","),
      ...data.map((row) => headers.map((h) => JSON.stringify(row[h])).join(",")),
    ].join("\n");

    // Create blob and upload
    const blob = new Blob([csv], { type: "text/csv" });
    const file = new File([blob], filename, { type: "text/csv" });

    return await uploadToMassive(file, "trading-exports");
  } catch (error) {
    console.error("❌ Export failed:", error);
    throw error;
  }
}

/**
 * Upload trading bot state snapshot
 * @param {Object} state - Trading bot state
 * @returns {Promise<string>} - File URL
 */
export async function backupTradingState(state) {
  try {
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const timestamp = new Date().toISOString().split("T")[0];
    const file = new File([blob], `trading-state-${timestamp}.json`, {
      type: "application/json",
    });

    return await uploadToMassive(file, "backups/trading-state");
  } catch (error) {
    console.error("❌ Backup failed:", error);
    throw error;
  }
}

export default {
  initMassiveClient,
  uploadToMassive,
  listFilesInMassive,
  deleteFromMassive,
  exportTradingDataToMassive,
  backupTradingState,
};
