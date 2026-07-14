import { NotFoundError } from '../../domain/errors/DomainError';
import { IMediaRepository } from '../../domain/media/IMediaRepository';
import { Media } from '../../domain/media/Media';
import { MediaMetadataInput } from './MediaTypes';

export class UpdateMediaUseCase {
  constructor(private readonly mediaRepository: IMediaRepository) {}

  async execute(id: string, input: MediaMetadataInput): Promise<Media> {
    const media = await this.mediaRepository.findById(id);
    if (!media) {
      throw new NotFoundError('Media', id);
    }

    media.updateMetadata(input);
    await this.mediaRepository.update(media);
    return media;
  }
}