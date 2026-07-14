import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { UpdateMediaUseCase } from '../../../src/application/media/UpdateMediaUseCase';
import { IMediaRepository } from '../../../src/domain/media/IMediaRepository';
import { Media } from '../../../src/domain/media/Media';
import { NotFoundError } from '../../../src/domain/errors/DomainError';

const existingMedia = new Media({
  id: 'media-1',
  fileName: 'arquivo.png',
  originalName: 'arquivo.png',
  filePath: 'images/arquivo.png',
  fileUrl: 'http://localhost:3001/uploads/images/arquivo.png',
  fileSize: 1000n,
  mimeType: 'image/png',
  fileExtension: 'png',
  width: 100,
  height: 100,
  uploadedBy: 'user-1',
  folder: '/images',
  status: 'active',
  kind: 'image',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

const mockRepository: jest.Mocked<IMediaRepository> = {
  save: jest.fn(),
  findById: jest.fn(),
  list: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('UpdateMediaUseCase', () => {
  let useCase: UpdateMediaUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository.findById.mockResolvedValue(Media.restore(existingMedia.toJSON()));
    useCase = new UpdateMediaUseCase(mockRepository);
  });

  it('atualiza metadados e persiste no repositorio', async () => {
    const updated = await useCase.execute('media-1', {
      title: 'Nova capa',
      altText: 'Imagem destacada',
      caption: 'Legenda curta',
      description: 'Descrição expandida',
    });

    expect(updated.toJSON().title).toBe('Nova capa');
    expect(updated.toJSON().altText).toBe('Imagem destacada');
    expect(mockRepository.update).toHaveBeenCalledTimes(1);
    expect(mockRepository.update).toHaveBeenCalledWith(updated);
  });

  it('deve lancar NotFoundError quando midia nao existe', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('id-inexistente', {
      title: 'Qualquer',
    })).rejects.toThrow(NotFoundError);

    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it('deve atualizar apenas titulo (atualizacao parcial)', async () => {
    const updated = await useCase.execute('media-1', {
      title: 'Apenas titulo novo',
    });

    expect(updated.toJSON().title).toBe('Apenas titulo novo');
    // Campos nao enviados devem permanecer com os valores originais
    expect(updated.toJSON().altText).toBeUndefined();
    expect(updated.toJSON().caption).toBeUndefined();
    expect(updated.toJSON().description).toBeUndefined();
  });

  it('deve propagar erro quando repository.update falha', async () => {
    mockRepository.update.mockRejectedValue(new Error('Erro no banco'));

    await expect(useCase.execute('media-1', {
      title: 'Falha ao salvar',
    })).rejects.toThrow('Erro no banco');
  });
});