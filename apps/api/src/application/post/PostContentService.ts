import sanitizeHtml from 'sanitize-html';

const MEDIA_ID_REGEX = /data-media-id=["']([a-f0-9-]{8,})["']/gi;

export interface PostContentStats {
  wordCount: number;
  imageCount: number;
  linkCount: number;
}

export class PostContentService {
  sanitize(content: string): string {
    return sanitizeHtml(content, {
      allowedTags: [
        'p', 'div', 'span', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'blockquote', 'code', 'pre',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'video', 'audio', 'source',
        'figure', 'figcaption', 'br', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      ],
      allowedAttributes: {
        '*': ['class', 'style', 'data-media-id', 'data-align', 'data-size'],
        a: ['href', 'target', 'rel'],
        img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
        video: ['src', 'controls', 'preload', 'poster'],
        audio: ['src', 'controls', 'preload'],
        source: ['src', 'type'],
      },
      allowedSchemes: ['http', 'https', 'mailto', 'tel', 'data'],
      allowedSchemesByTag: {
        img: ['http', 'https', 'data'],
      },
      transformTags: {
        a: (tagName, attribs) => ({
          tagName,
          attribs: {
            ...attribs,
            rel: attribs.rel || 'noopener noreferrer',
          },
        }),
        img: (tagName, attribs) => ({
          tagName,
          attribs: {
            ...attribs,
            loading: attribs.loading || 'lazy',
          },
        }),
      },
    });
  }

  extractMediaIds(content: string): string[] {
    const ids = new Set<string>();
    let match: RegExpExecArray | null;

    while ((match = MEDIA_ID_REGEX.exec(content)) !== null) {
      ids.add(match[1]);
    }

    return [...ids];
  }

  generateExcerpt(content: string, maxLength = 180): string {
    const text = content
      .replace(/<style[^>]*>.*?<\/style>/gis, ' ')
      .replace(/<script[^>]*>.*?<\/script>/gis, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trim()}...`;
  }

  calculateStats(content: string): PostContentStats {
    const plainText = content
      .replace(/<style[^>]*>.*?<\/style>/gis, ' ')
      .replace(/<script[^>]*>.*?<\/script>/gis, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      wordCount: plainText ? plainText.split(' ').length : 0,
      imageCount: (content.match(/<img\b/gi) || []).length,
      linkCount: (content.match(/<a\b/gi) || []).length,
    };
  }

  generateSlug(title: string): string {
    return title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }
}
