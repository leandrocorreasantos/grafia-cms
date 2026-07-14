import { NotFoundError } from '../../domain/errors/DomainError';
import { IMediaRepository } from '../../domain/media/IMediaRepository';
import { Media } from '../../domain/media/Media';

export class GetMediaByIdUseCase {
  constructor(private readonly mediaRepository: IMediaRepository) {}

  async execute(id: string): Promise<Media> {
    const media = await this.mediaRepository.findById(id);
    if (!media) {
      throw new NotFoundError('Media', id);
    }

    return media;
  }
}