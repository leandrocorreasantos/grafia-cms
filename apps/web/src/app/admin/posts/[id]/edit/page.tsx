'use client';

import { useParams } from 'next/navigation';
import { PostEditor } from '@/components/posts/PostEditor';

export default function EditPostPage() {
  const params = useParams<{ id: string }>();

  return <PostEditor postId={params.id} />;
}
