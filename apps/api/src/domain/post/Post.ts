import { PostStatus } from './PostStatus';

export interface PostProps {
    id: string;
    title: string;
    cover?: string;
    type: string;
    content: string;
    excerpt: string;
    slug: string;
    status: PostStatus;
    authorId: string;
    mediaIds: string[];
    categoryIds: string[];
    tagIds: string[];
    wordCount: number;
    imageCount: number;
    linkCount: number;
    autosaveAt?: Date;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
    scheduledAt?: Date;
}

export class Post {
    private props: PostProps;

    constructor(props: Omit<PostProps, 'updatedAt'>) {
        this.props = {
            ...props,
            updatedAt: new Date(),
            excerpt: props.excerpt || this.generateExcerpt(props.content),
            slug: props.slug || this.generateSlug(props.title),
            status: props.status || PostStatus.DRAFT,
            type: props.type || 'post',
            mediaIds: props.mediaIds || [],
            categoryIds: props.categoryIds || [],
            tagIds: props.tagIds || [],
            wordCount: props.wordCount || 0,
            imageCount: props.imageCount || 0,
            linkCount: props.linkCount || 0,
        };
        this.syncStatsFromContent();
        this.validate();
    }

    /**
     * Restaura um Post a partir de dados persistidos no banco.
     * Difere do construtor pois preserva updatedAt original e não recalcula
     * excerpt/slug se já existirem.
     */
    static restore(props: PostProps): Post {
        const post = new Post(props);
        post.props.updatedAt = props.updatedAt;
        return post;
    }

    private validate(): void {
        if (!this.props.title || this.props.title.length < 3) {
            throw new Error('Title must have at least 3 characters');
        }
        if (!this.props.content || this.props.content.length < 10) {
            throw new Error('Content must have at least 10 characters');
        }
    }

    private generateExcerpt(content: string): string {
        return content.replace(/[#*`]/g, '').slice(0, 160) + '...';
    }

    private generateSlug(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    public publish(): void {
        if (this.props.status === PostStatus.DRAFT) {
            this.props.status = PostStatus.PUBLISHED;
            this.props.publishedAt = new Date();
            this.props.updatedAt = new Date();
        }
    }

    public update(title: string, content: string, cover?: string): void {
        this.props.title = title;
        this.props.content = content;
        if (cover !== undefined) {
            this.props.cover = cover;
        }
        this.props.excerpt = this.generateExcerpt(content);
        this.props.slug = this.generateSlug(title);
        this.syncStatsFromContent();
        this.props.updatedAt = new Date();
        this.validate();
    }

    public updateAdvanced(input: {
        title?: string;
        content?: string;
        cover?: string;
        excerpt?: string;
        slug?: string;
        status?: PostStatus;
        type?: string;
        mediaIds?: string[];
        scheduledAt?: Date;
        autosaveAt?: Date;
        deletedAt?: Date;
        categoryIds?: string[];
        tagIds?: string[];
    }): void {
        if (input.title !== undefined) this.props.title = input.title;
        if (input.content !== undefined) this.props.content = input.content;
        if (input.cover !== undefined) this.props.cover = input.cover;
        if (input.excerpt !== undefined) this.props.excerpt = input.excerpt;
        if (input.slug !== undefined) this.props.slug = input.slug;
        if (input.status !== undefined) this.props.status = input.status;
        if (input.type !== undefined) this.props.type = input.type;
        if (input.mediaIds !== undefined) this.props.mediaIds = [...new Set(input.mediaIds)];
        if (input.scheduledAt !== undefined) this.props.scheduledAt = input.scheduledAt;
        if (input.autosaveAt !== undefined) this.props.autosaveAt = input.autosaveAt;
        if (input.deletedAt !== undefined) this.props.deletedAt = input.deletedAt;
        if (input.categoryIds !== undefined) this.props.categoryIds = [...new Set(input.categoryIds)];
        if (input.tagIds !== undefined) this.props.tagIds = [...new Set(input.tagIds)];

        if (input.content !== undefined) {
            if (input.excerpt === undefined) {
                this.props.excerpt = this.generateExcerpt(this.props.content);
            }
            if (input.title === undefined && input.slug === undefined) {
                this.props.slug = this.generateSlug(this.props.title);
            }
            this.syncStatsFromContent();
        }

        this.props.updatedAt = new Date();
        this.validate();
    }

    public markTrash(): void {
        this.props.status = PostStatus.TRASH;
        this.props.deletedAt = new Date();
        this.props.updatedAt = new Date();
    }

    public restoreFromTrash(): void {
        this.props.status = PostStatus.DRAFT;
        this.props.deletedAt = undefined;
        this.props.updatedAt = new Date();
    }

    public touchAutosave(): void {
        this.props.autosaveAt = new Date();
        this.props.updatedAt = new Date();
    }

    private syncStatsFromContent(): void {
        const text = this.props.content
            .replace(/<style[^>]*>.*?<\/style>/gis, ' ')
            .replace(/<script[^>]*>.*?<\/script>/gis, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        this.props.wordCount = text ? text.split(' ').length : 0;
        this.props.imageCount = (this.props.content.match(/<img\b/gi) || []).length;
        this.props.linkCount = (this.props.content.match(/<a\b/gi) || []).length;
    }

    get id(): string { return this.props.id; }
    get title(): string { return this.props.title; }
    get cover(): string | undefined { return this.props.cover; }
    get type(): string { return this.props.type; }
    get content(): string { return this.props.content; }
    get excerpt(): string { return this.props.excerpt; }
    get slug(): string { return this.props.slug; }
    get status(): PostStatus { return this.props.status; }
    get authorId(): string { return this.props.authorId; }
    get mediaIds(): string[] { return this.props.mediaIds; }
    get wordCount(): number { return this.props.wordCount; }
    get imageCount(): number { return this.props.imageCount; }
    get linkCount(): number { return this.props.linkCount; }
    get autosaveAt(): Date | undefined { return this.props.autosaveAt; }
    get deletedAt(): Date | undefined { return this.props.deletedAt; }
    get createdAt(): Date { return this.props.createdAt; }
    get updatedAt(): Date { return this.props.updatedAt; }
    get publishedAt(): Date | undefined { return this.props.publishedAt; }
    get scheduledAt(): Date | undefined { return this.props.scheduledAt; }

    toJSON(): PostProps {
        return { ...this.props };
    }
}