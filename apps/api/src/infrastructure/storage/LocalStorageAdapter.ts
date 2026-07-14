import fs from 'fs/promises';
import path from 'path';
import { StorageAdapter, StoredFilePayload, StoredFileResult } from './StorageAdapter';

export class LocalStorageAdapter extends StorageAdapter {
  constructor(
    private readonly uploadRoot: string,
    private readonly publicBaseUrl: string,
  ) {
    super();
  }

  async upload(file: StoredFilePayload): Promise<StoredFileResult> {
    const absolutePath = path.join(this.uploadRoot, file.relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, file.buffer);

    return {
      relativePath: file.relativePath,
      absolutePath,
    };
  }

  async delete(relativePath: string): Promise<void> {
    const absolutePath = path.join(this.uploadRoot, relativePath);
    await fs.rm(absolutePath, { force: true });
  }

  async getUrl(relativePath: string): Promise<string> {
    const normalizedBase = this.publicBaseUrl.replace(/\/$/, '');
    return `${normalizedBase}/uploads/${relativePath.replace(/\\/g, '/')}`;
  }

  async move(source: string, destination: string): Promise<void> {
    const sourcePath = path.join(this.uploadRoot, source);
    const destinationPath = path.join(this.uploadRoot, destination);
    await fs.mkdir(path.dirname(destinationPath), { recursive: true });
    await fs.rename(sourcePath, destinationPath);
  }

  async ensureDirectory(relativeDirectory: string): Promise<void> {
    await fs.mkdir(path.join(this.uploadRoot, relativeDirectory), { recursive: true });
  }
}