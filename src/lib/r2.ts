import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID!;
const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME || "nano-gcc";

export async function uploadToR2(key: string, body: Buffer, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await r2Client.send(command);
  // Construct the public URL (Assuming the bucket is configured for public access or we just store the key)
  // For R2 public buckets, it's usually https://pub-<something>.r2.dev/key or custom domain.
  // If no public domain is set, we might have to use presigned URLs or just return the key to fetch later.
  // For now, let's return a simulated public URL or just the key.
  return `https://${accountId}.r2.cloudflarestorage.com/${R2_BUCKET}/${key}`;
}

export async function getPresignedUrl(fullUrl: string) {
  // Extract key from the full URL. It looks like https://<account_id>.r2.cloudflarestorage.com/<bucket>/<key>
  const urlParts = fullUrl.split('/');
  const key = urlParts.slice(4).join('/');
  
  if (!key) throw new Error("Invalid R2 URL");

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  return await getSignedUrl(r2Client, command, { expiresIn: 3600 });
}
