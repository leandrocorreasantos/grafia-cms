export interface StoredFilePayload {
  buffer: Buffer;
  relativePath: string;
  mimeType: string;
}

export interface StoredFileResult {
  relativePath: string;
  absolutePath: string;
}

export abstract class StorageAdapter {
  abstract upload(file: StoredFilePayload): Promise<StoredFileResult>;
  abstract delete(relativePath: string): Promise<void>;
  abstract getUrl(relativePath: string): Promise<string>;
  abstract move(source: string, destination: string): Promise<void>;
  abstract ensureDirectory(relativeDirectory: string): Promise<void>;
}