/**
 * Shared course cover image logic: topic-based placeholders so each course gets a different image.
 */

const TOPIC_IMAGES: Record<string, string[]> = {
  python: [
    'https://images.unsplash.com/photo-1526379095098-d400fd0bfd20?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=225&fit=crop',
  ],
  java: [
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=225&fit=crop',
  ],
  javascript: [
    'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1547658719-da2b51169166?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=225&fit=crop',
  ],
  react: [
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1547658719-da2b51169166?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=225&fit=crop',
  ],
  'web development': [
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1547658719-da2b51169166?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=225&fit=crop',
  ],
  development: [
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=225&fit=crop',
  ],
  cloud: [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&h=225&fit=crop',
  ],
  security: [
    'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop',
  ],
  programming: [
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=225&fit=crop',
  ],
  design: [
    'https://images.unsplash.com/photo-1561070791-2526d31fe5b6?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1545235617-7a424c1a60cc?w=400&h=225&fit=crop',
  ],
  business: [
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=225&fit=crop',
  ],
  marketing: [
    'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=225&fit=crop',
  ],
  language: [
    'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=225&fit=crop',
  ],
  math: [
    'https://images.unsplash.com/photo-1509228468510-0e449b0956e0?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1596495578065-2eec3a8c3e8e?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=225&fit=crop',
  ],
  science: [
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1582719478250-c89c6d9cba22?w=400&h=225&fit=crop',
  ],
  data: [
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop&sat=20',
  ],
  'ai & ml': [
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7115?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1555255707-c07966088b7b?w=400&h=225&fit=crop',
  ],
  default: [
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=225&fit=crop',
  ],
};

const TOPIC_KEYWORDS: { keywords: string[]; key: string }[] = [
  { keywords: ['python'], key: 'python' },
  { keywords: ['javascript', 'typescript'], key: 'javascript' },
  { keywords: ['react'], key: 'react' },
  { keywords: ['java'], key: 'java' },
  { keywords: ['web', 'frontend', 'backend', 'fullstack', 'html', 'css', 'node'], key: 'web development' },
  { keywords: ['development', 'developer'], key: 'development' },
  { keywords: ['cloud', 'aws', 'devops'], key: 'cloud' },
  { keywords: ['security'], key: 'security' },
  { keywords: ['ai & ml', 'ai and ml', 'machine learning', 'artificial intelligence'], key: 'ai & ml' },
  { keywords: ['programming', 'coding', 'code', 'software'], key: 'programming' },
  { keywords: ['design', 'ui', 'ux', 'figma', 'creative', 'graphic'], key: 'design' },
  { keywords: ['business', 'management', 'leadership', 'entrepreneur'], key: 'business' },
  { keywords: ['marketing', 'digital', 'social media', 'seo'], key: 'marketing' },
  { keywords: ['language', 'english', 'spanish', 'french', 'grammar', 'writing'], key: 'language' },
  { keywords: ['math', 'mathematics', 'algebra', 'calculus', 'statistics'], key: 'math' },
  { keywords: ['science', 'physics', 'chemistry', 'biology'], key: 'science' },
  { keywords: ['data', 'analytics', 'ml'], key: 'data' },
];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h << 5) - h + id.charCodeAt(i) | 0;
  return Math.abs(h);
}

export function getTopicCoverUrl(course: { _id: string; title?: string; category?: string }): string {
  const text = [course.category, course.title].filter(Boolean).join(' ').toLowerCase();
  const poolKey = !text ? 'default' : (TOPIC_KEYWORDS.find(({ keywords }) => keywords.some((k) => text.includes(k)))?.key ?? 'default');
  const pool = TOPIC_IMAGES[poolKey] || TOPIC_IMAGES.default;
  const index = hashId(course._id) % pool.length;
  return pool[index];
}

export const FALLBACK_COVER_IMAGE = TOPIC_IMAGES.default[0];

export function getCourseCoverUrl(
  apiBaseUrl: string,
  course: { _id: string; title?: string; category?: string; coverImage?: string }
): string {
  const img = course.coverImage?.trim();
  if (!img) return getTopicCoverUrl(course);
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  return `${apiBaseUrl.replace(/\/$/, '')}${img.startsWith('/') ? '' : '/'}${img}`;
}
