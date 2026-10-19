import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { MemoryStoredFile } from 'nestjs-form-data';

import { config } from '@on/config';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: config.cloudinary.cloudName,
      api_key: config.cloudinary.appKey,
      api_secret: config.cloudinary.apiSecret,
    });
  }

  /**
   * Uploads a single image, using a custom filename (e.g. abc123.webp)
   * Returns only the stored filename (not the full URL)
   */
  async uploadImage(image: MemoryStoredFile): Promise<string> {
    try {
      const res = await this.uploadToCloudinary(image);

      return res.secure_url;
    } catch (error) {
      console.log('This is the error', error);
      throw error;
    }
  }

  async uploadBuffer(buffer: Buffer): Promise<string> {
    try {
      const res = await this.uploadBufferToCloudinary(buffer);

      return res.secure_url;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * Upload multiple files, each using your predetermined filenames
   * Returns only the filenames
   */
  async uploadImages(images: MemoryStoredFile[]): Promise<string[]> {
    try {
      const urls: string[] = [];

      console.log('Starting upload of images:', images.length);

      for (let i = 0; i < images.length; i++) {
        console.log('Uploading image:', images[i]);

        const res = await this.uploadToCloudinary(images[i]);
        urls.push(res.secure_url);
      }

      console.log(urls);

      return urls;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * Helper to upload with a custom public_id (filename without extension)
   */
  private uploadToCloudinary(image: MemoryStoredFile): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result: any) => {
        if (error) return reject(error);
        resolve(result);
      });

      const buffer = image.buffer instanceof Buffer ? image.buffer : Buffer.from(new Uint8Array(image.buffer));

      stream.end(buffer);
    });
  }

  private uploadBufferToCloudinary(buffer: Buffer): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result: any) => {
        if (error) return reject(error);
        resolve(result);
      });

      stream.end(buffer);
    });
  }

  /**
   * Fetch a file from Cloudinary by filename, return Base64
   * Example filename: "abc123.webp"
   */
  async getImageBase64(fileName: string): Promise<{ filename: string; image: string }> {
    try {
      const base64Str = await this.fetchAsBase64(fileName);

      return { filename: fileName, image: base64Str };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * You can fetch the resource via the public URL (if you know the extension),
   * or you can use the Admin API if needed. Here is a simple URL-based approach:
   */
  private async fetchAsBase64(fileName: string): Promise<string> {
    const cloudName = config.cloudinary.cloudName;
    const url = `https://res.cloudinary.com/${cloudName}/image/upload/${fileName}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${fileName} from Cloudinary`);

    const buffer = Buffer.from(await response.arrayBuffer());

    return buffer.toString('base64');
  }
}
