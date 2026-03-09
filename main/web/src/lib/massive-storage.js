import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

let massiveClient = null;

export async function initMassiveClient() {
  if (massiveClient) return massiveClient;

  const accessKey = import.meta.env.VITE_MASSIVE_ACCESS_KEY;
  const endpoint = import.meta.env.VITE_MASSIVE_S3_ENDPOINT || "https://files.massive.com";

  if (!accessKey) return null;

  massiveClient = new S3Client({
    endpoint,
    region: "us-east-1",
    forcePathStyle: true,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: import.meta.env.VITE_MASSIVE_SECRET_KEY || accessKey,
    },
  });

  return massiveClient;
}

export async function uploadToMassive(file, folder = "uploads") {
  const client = await initMassiveClient();
  if (!client) throw new Error("Massive storage not configured");

  const bucket = import.meta.env.VITE_MASSIVE_BUCKET || "flatfiles";
  const key = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: file.type,
    }),
  );

  return `${import.meta.env.VITE_MASSIVE_S3_ENDPOINT || "https://files.massive.com"}/${bucket}/${key}`;
}

export async function listFilesInMassive(folder = "uploads") {
  const client = await initMassiveClient();
  if (!client) return [];

  const bucket = import.meta.env.VITE_MASSIVE_BUCKET || "flatfiles";
  const response = await client.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: `${folder}/` }),
  );
  return response.Contents || [];
}

export async function deleteFromMassive(key) {
  const client = await initMassiveClient();
  if (!client) return false;

  const bucket = import.meta.env.VITE_MASSIVE_BUCKET || "flatfiles";
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  return true;
}

