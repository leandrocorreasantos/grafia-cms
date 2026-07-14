import { NotFoundError } from '../../domain/errors/DomainError';
import { IMediaRepository } from '../../domain/media/IMediaRepository';
import { StorageAdapter } from '../../infrastructure/storage/StorageAdapter';

export class DeleteMediaUseCase {
  constructor(
    private readonly mediaRepository: IMediaRepository,
    private readonly storageAdapter: StorageAdapter,
  ) {}

  async execute(id: string): Promise<void> {
    const media = await this.mediaRepository.findById(id);
    if (!media) {
      throw new NotFoundError('Media', id);
    }

    await this.storageAdapter.delete(media.filePath);
    const thumbnails = media.thumbnails;
    if (thumbnails) {
      await Promise.all(
        Object.values(thumbnails)
          .filter((value): value is string => !!value)
          .map(async (thumbnailUrl) => {
            const relativePath = thumbnailUrl.split('/uploads/')[1];
            if (relativePath) {
              await this.storageAdapter.delete(relativePath);
            }
          }),
      );
    }

    await this.mediaRepository.delete(id);
  }
}