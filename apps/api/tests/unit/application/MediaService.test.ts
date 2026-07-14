import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { MediaService } from '../../../src/application/media/MediaService';
import { LocalStorageAdapter } from '../../../src/infrastructure/storage/LocalStorageAdapter';

const tinyPngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO1mN6kAAAAASUVORK5CYII=',
  'base64',
);

describe('MediaService', () => {
  let uploadRoot: string;
  let service: MediaService;

  beforeEach(async () => {
    uploadRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'grafia-media-'));
    const storage = new LocalStorageAdapter(uploadRoot, 'http://localhost:3001');
    service = new MediaService(storage, {
      maxFileSize: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/png', 'application/pdf'],
    });
  });

  afterEach(async () => {
    await fs.rm(uploadRoot, { recursive: true, force: true });
  });

  it('processa upload de imagem, sanitiza nome e gera thumbnails', async () => {
    const result = await service.processUpload({
      buffer: tinyPngBuffer,
      originalName: 'Foto de Perfil!.png',
      mimeType: 'image/png',
      size: tinyPngBuffer.length,
    }, 'user-1');

    const media = result.media.toJSON();

    expect(media.originalName).toBe('Foto de Perfil!.png');
    expect(media.fileName).toContain('foto-de-perfil');
    expect(media.kind).toBe('image');
    expect(media.width).toBe(1);
    expect(media.height).toBe(1);
    expect(media.thumbnails?.thumbnail).toContain('/uploads/images/thumbnails/');

    await expect(fs.stat(path.join(uploadRoot, media.filePath))).resolves.toBeDefined();
  });

  it('rejeita mime type fora da allowlist', async () => {
    await expect(service.processUpload({
      buffer: Buffer.from('arquivo'),
      originalName: 'malicioso.exe',
      mimeType: 'application/x-msdownload',
      size: 7,
    })).rejects.toThrow('Tipo de arquivo nao permitido');
  });

  it('rejeita arquivo maior que o limite maxFileSize', async () => {
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024);

    await expect(service.processUpload({
      buffer: bigBuffer,
      originalName: 'grande.png',
      mimeType: 'image/png',
      size: bigBuffer.length,
    }, 'user-1')).rejects.toThrow('5MB');
  });

  it('formata tamanho de arquivo em unidade legivel', () => {
    expect(service.formatFileSize(2048n)).toBe('2.0 KB');
    expect(service.formatFileSize(5_242_880n)).toBe('5.0 MB');
  });
});