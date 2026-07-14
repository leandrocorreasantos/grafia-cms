import { IMediaRepository, MediaListResult } from '../../domain/media/IMediaRepository';
import { MediaListInput } from './MediaTypes';

export class ListMediaUseCase {
  constructor(private readonly mediaRepository: IMediaRepository) {}

  async execute(input: MediaListInput): Promise<MediaListResult> {
    return this.mediaRepository.list(input);
  }
}