import { IMediaRepository } from '../../domain/media/IMediaRepository';
import { Media } from '../../domain/media/Media';
import { MediaService } from './MediaService';
import { MediaUploadInput } from './MediaTypes';

export class UploadMediaUseCase {
  constructor(
    private readonly mediaRepository: IMediaRepository,
    private readonly mediaService: MediaService,
  ) {}

  async execute(input: MediaUploadInput): Promise<Media[]> {
    const uploaded: Media[] = [];

    for (const file of input.files) {
      const processed = await this.mediaService.processUpload(file, input.uploadedBy, input.folder);
      await this.mediaRepository.save(processed.media);
      uploaded.push(processed.media);
    }

    return uploaded;
  }
}