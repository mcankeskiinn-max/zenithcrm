import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createReadStream } from 'fs';
import path from 'path';

const accountId = process.env.R2_ACCOUNT_ID || '';
const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
const bucket = process.env.R2_BUCKET || '';
const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL || '';

let client: S3Client | null = null;
const getClient = () => {
    if (client) return client;
    if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
        throw new Error('R2 config missing: R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/R2_BUCKET');
    }
    client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId,
            secretAccessKey
        }
    });
    return client;
};

const buildKey = (tenantId: string, originalName: string) => {
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const stamp = Date.now();
    const ext = path.extname(safeName);
    const base = safeName.replace(ext, '');
    return `${tenantId}/${base}-${stamp}${ext}`;
};

export const uploadToR2 = async (filePath: string, mimetype: string, tenantId: string, originalName: string) => {
    const s3 = getClient();
    const key = buildKey(tenantId, originalName);
    const body = createReadStream(filePath);

    await s3.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: mimetype
        })
    );

    const url = publicBaseUrl
        ? `${publicBaseUrl.replace(/\/$/, '')}/${key}`
        : '';

    return { key, url };
};

export const getSignedDownloadUrl = async (key: string, expiresInSeconds = 300) => {
    const s3 = getClient();
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key
    });
    return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
};

export const deleteFromR2 = async (key: string) => {
    const s3 = getClient();
    await s3.send(
        new DeleteObjectCommand({
            Bucket: bucket,
            Key: key
        })
    );
};
