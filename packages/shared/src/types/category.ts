export interface CategorySummary {
    id: string;
    name: string;
    slug: string;
    description: string;
    parentId?: string | null;
    createdAt: Date;
    updatedAt: Date;
    children?: CategorySummary[];
}

export type Category = CategorySummary;
