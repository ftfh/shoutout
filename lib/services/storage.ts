import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

interface StorageConfig {
  provider: 'digitalocean' | 'backblaze';
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  region: string;
  bucket: string;
}

export class StorageService {
  private s3Client: S3Client;
  private bucket: string;

  constructor(config: StorageConfig) {
    this.s3Client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.provider === 'digitalocean',
    });
    this.bucket = config.bucket;
  }

  async uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'private',
      });

      await this.s3Client.send(command);
      return key;
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error('Failed to upload file');
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      console.error('File deletion error:', error);
      throw new Error('Failed to delete file');
    }
  }

  async getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
      throw new Error('Failed to generate download URL');
    }
  }

  async getSignedUploadUrl(key: string, contentType: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        ACL: 'private',
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Failed to generate signed upload URL:', error);
      throw new Error('Failed to generate upload URL');
    }
  }
}

export async function getStorageService(): Promise<StorageService> {
  // Get storage configuration from site settings or environment
  const storageProvider = process.env.STORAGE_PROVIDER || 'digitalocean';
  
  if (storageProvider === 'digitalocean') {
    return new StorageService({
      provider: 'digitalocean',
      accessKeyId: process.env.DO_SPACES_ACCESS_KEY!,
      secretAccessKey: process.env.DO_SPACES_SECRET_KEY!,
      endpoint: process.env.DO_SPACES_ENDPOINT!,
      region: process.env.DO_SPACES_REGION || 'nyc3',
      bucket: process.env.DO_SPACES_BUCKET!,
    });
  } else if (storageProvider === 'backblaze') {
    return new StorageService({
      provider: 'backblaze',
      accessKeyId: process.env.B2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.B2_SECRET_ACCESS_KEY!,
      endpoint: process.env.B2_ENDPOINT!,
      region: process.env.B2_REGION || 'us-west-002',
      bucket: process.env.B2_BUCKET!,
    });
  }
  
  throw new Error('Invalid storage provider configuration');
}