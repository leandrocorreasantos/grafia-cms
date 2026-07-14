export type MediaStatus = 'active' | 'trash' | 'unattached';
export type MediaKind = 'image' | 'document' | 'video' | 'audio' | 'other';

export interface MediaThumbnailSet {
  thumbnail?: string;
  medium?: string;
  large?: string;
}

export interface MediaMetadata {
  exif?: Record<string, unknown>;
  blurDataUrl?: string;
  [key: string]: unknown;
}

export interface MediaProps {
  id: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileUrl: string;
  fileSize: bigint;
  mimeType: string;
  fileExtension: string;
  width?: number;
  height?: number;
  duration?: number;
  altText?: string;
  title?: string;
  caption?: string;
  description?: string;
  uploadedBy?: string;
  folder: string;
  status: MediaStatus;
  kind: MediaKind;
  thumbnails?: MediaThumbnailSet;
  metadata?: MediaMetadata;
  shortcode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class InvalidMediaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMediaError';
  }
}

export class Media {
  private props: MediaProps;

  constructor(props: MediaProps) {
    this.props = props;
    this.validate();
  }

  static restore(props: MediaProps): Media {
    return new Media(props);
  }

  private validate(): void {
    if (!this.props.fileName.trim()) {
      throw new InvalidMediaError('Nome interno do arquivo e obrigatorio');
    }

    if (!this.props.originalName.trim()) {
      throw new InvalidMediaError('Nome original do arquivo e obrigatorio');
    }

    if (!this.props.filePath.trim()) {
      throw new InvalidMediaError('Caminho do arquivo e obrigatorio');
    }

    if (!this.props.fileUrl.trim()) {
      throw new InvalidMediaError('URL publica do arquivo e obrigatoria');
    }

    if (this.props.fileSize <= 0n) {
      throw new InvalidMediaError('Arquivo precisa ter tamanho maior que zero');
    }
  }

  updateMetadata(input: {
    title?: string;
    altText?: string;
    caption?: string;
    description?: string;
  }): void {
    this.props = {
      ...this.props,
      title: input.title ?? this.props.title,
      altText: input.altText ?? this.props.altText,
      caption: input.caption ?? this.props.caption,
      description: input.description ?? this.props.description,
      updatedAt: new Date(),
    };
  }

  moveToTrash(): void {
    this.props = { ...this.props, status: 'trash', updatedAt: new Date() };
  }

  restoreFromTrash(): void {
    this.props = { ...this.props, status: 'active', updatedAt: new Date() };
  }

  markUnattached(): void {
    this.props = { ...this.props, status: 'unattached', updatedAt: new Date() };
  }

  get id(): string {
    return this.props.id;
  }

  get status(): MediaStatus {
    return this.props.status;
  }

  get kind(): MediaKind {
    return this.props.kind;
  }

  get filePath(): string {
    return this.props.filePath;
  }

  get thumbnails(): MediaThumbnailSet | undefined {
    return this.props.thumbnails;
  }

  toJSON(): MediaProps {
    return { ...this.props };
  }
}