import { NotFoundError } from '../../domain/errors/DomainError';
import { IMediaRepository } from '../../domain/media/IMediaRepository';
import { Media } from '../../domain/media/Media';

export class RestoreMediaUseCase {
  constructor(private readonly mediaRepository: IMediaRepository) {}

  async execute(id: string): Promise<Media> {
    const media = await this.mediaRepository.findById(id);
    if (!media) {
      throw new NotFoundError('Media', id);
    }

    media.restoreFromTrash();
    await this.mediaRepository.update(media);
    return media;
  }
}