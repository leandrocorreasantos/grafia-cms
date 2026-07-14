import { IMediaRepository } from '../../domain/media/IMediaRepository';
import { DeleteMediaUseCase } from './DeleteMediaUseCase';
import { MediaBulkActionInput, MediaBulkRestoreInput } from './MediaTypes';
import { RestoreMediaUseCase } from './RestoreMediaUseCase';
import { TrashMediaUseCase } from './TrashMediaUseCase';

export class BulkMediaActionUseCase {
  constructor(
    private readonly mediaRepository: IMediaRepository,
    private readonly trashMediaUseCase: TrashMediaUseCase,
    private readonly deleteMediaUseCase: DeleteMediaUseCase,
    private readonly restoreMediaUseCase: RestoreMediaUseCase,
  ) {}

  async execute(input: MediaBulkActionInput): Promise<number> {
    if (input.action === 'trash') {
      await Promise.all(input.ids.map((id) => this.trashMediaUseCase.execute(id)));
      return input.ids.length;
    }

    await Promise.all(input.ids.map((id) => this.deleteMediaUseCase.execute(id)));
    return input.ids.length;
  }

  async restore(input: MediaBulkRestoreInput): Promise<number> {
    await Promise.all(input.ids.map((id) => this.restoreMediaUseCase.execute(id)));
    return input.ids.length;
  }
}