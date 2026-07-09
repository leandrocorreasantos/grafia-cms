export interface TagSummary {
    id: string;
    name: string;
    slug: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
}

export type Tag = TagSummary;
