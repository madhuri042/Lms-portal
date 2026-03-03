import React, { useEffect, useState } from 'react';
import { Loader } from '../components/Loader';
import { CourseModal } from '../components/CourseModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Topic-specific placeholder images (Unsplash). Each course gets an image that matches its subject.
// Order of TOPIC_KEYWORDS matters: more specific (python, java, react) are checked first.
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
  default: [
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=225&fit=crop',
  ],
};

// Check most specific topics first (e.g. javascript before java so "javascript" matches correctly), then broader.
const TOPIC_KEYWORDS: { keywords: string[]; key: string }[] = [
  { keywords: ['python'], key: 'python' },
  { keywords: ['javascript', 'typescript'], key: 'javascript' },
  { keywords: ['react'], key: 'react' },
  { keywords: ['java'], key: 'java' }, // after javascript so "javascript" doesn’t match this
  { keywords: ['web', 'frontend', 'backend', 'fullstack', 'html', 'css', 'node'], key: 'web development' },
  { keywords: ['programming', 'coding', 'code', 'developer', 'software'], key: 'programming' },
  { keywords: ['design', 'ui', 'ux', 'figma', 'creative', 'graphic'], key: 'design' },
  { keywords: ['business', 'management', 'leadership', 'entrepreneur'], key: 'business' },
  { keywords: ['marketing', 'digital', 'social media', 'seo'], key: 'marketing' },
  { keywords: ['language', 'english', 'spanish', 'french', 'grammar', 'writing'], key: 'language' },
  { keywords: ['math', 'mathematics', 'algebra', 'calculus', 'statistics'], key: 'math' },
  { keywords: ['science', 'physics', 'chemistry', 'biology'], key: 'science' },
  { keywords: ['data', 'analytics', 'machine learning', 'ai', 'ml'], key: 'data' },
];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h << 5) - h + id.charCodeAt(i) | 0;
  return Math.abs(h);
}

function getTopicCoverUrl(course: { _id: string; title?: string; category?: string }): string {
  const text = [course.category, course.title].filter(Boolean).join(' ').toLowerCase();
  const poolKey = !text ? 'default' : (TOPIC_KEYWORDS.find(({ keywords }) => keywords.some((k) => text.includes(k)))?.key ?? 'default');
  const pool = TOPIC_IMAGES[poolKey];
  const index = hashId(course._id) % pool.length;
  return pool[index];
}

const FALLBACK_IMAGE = TOPIC_IMAGES.default[0];

type RecommendedCourse = {
  _id: string;
  title: string;
  description: string;
  coverImage?: string;
  category?: string;
  instructor?: { _id: string; firstName?: string; lastName?: string };
};

export const RecommendedPage: React.FC = () => {
  const [courses, setCourses] = useState<RecommendedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<RecommendedCourse | null>(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());

  const fetchEnrolled = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/courses/enrolled`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.data)) {
        setEnrolledCourseIds(new Set(data.data.map((c: any) => c._id)));
      }
    } catch (err) {
      console.error('Failed to fetch enrolled courses', err);
    }
  };

  useEffect(() => {
    fetchEnrolled();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const fetchRecommended = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE_URL}/api/recommended-courses`, { headers });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.message || 'Failed to load recommendations.');
          setCourses([]);
          return;
        }
        setCourses(Array.isArray(data?.data) ? data.data : []);
      } catch {
        setError('Could not connect to the server.');
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommended();
  }, []);

  function getCoverUrl(course: RecommendedCourse): string {
    const img = course.coverImage?.trim();
    if (!img) return getTopicCoverUrl(course);
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    return `${API_BASE_URL.replace(/\/$/, '')}${img.startsWith('/') ? '' : '/'}${img}`;
  }

  if (loading) return <Loader message="Loading recommendations..." />;

  return (
    <div className="recommended-page">
      <header className="recommended-page__header">
        <h1 className="recommended-page__title">Recommended</h1>
        <p className="recommended-page__subtitle">
          Course recommendations for your growth. Updated regularly from the catalog.
        </p>
      </header>

      {error && (
        <div className="recommended-page__error" role="alert">
          {error}
        </div>
      )}

      {courses.length === 0 && !error ? (
        <div className="recommended-page__empty">
          <p>No course recommendations right now. Check back later.</p>
        </div>
      ) : (
        <div className="recommended-page__grid">
          {courses.map((course) => {
            const coverUrl = getCoverUrl(course);
            return (
              <div
                key={course._id}
                className="recommended-page__card"
                onClick={() => setSelectedCourse(course)}
                style={{ cursor: 'pointer' }}
              >
                <div className="recommended-page__card-cover">
                  <img
                    src={coverUrl}
                    alt=""
                    className="recommended-page__card-img"
                    onError={(e) => {
                      const el = e.currentTarget;
                      if (el.dataset.fallbackUsed === '1') {
                        el.style.display = 'none';
                        const placeholder = el.nextElementSibling as HTMLElement;
                        if (placeholder) placeholder.style.display = 'flex';
                        return;
                      }
                      el.dataset.fallbackUsed = '1';
                      el.src = FALLBACK_IMAGE;
                    }}
                  />
                  <div className="recommended-page__card-placeholder" style={{ display: 'none' }} aria-hidden>
                    {course.title ? (
                      <span className="recommended-page__card-initial" aria-hidden>
                        {course.title.trim().charAt(0).toUpperCase()}
                      </span>
                    ) : null}
                  </div>
                  {course.category && (
                    <span className="recommended-page__card-category">{course.category}</span>
                  )}
                </div>
                <div className="recommended-page__card-body">
                  <h3 className="recommended-page__card-title">{course.title}</h3>
                  <p className="recommended-page__card-desc">
                    {course.description ? (course.description.length > 120 ? course.description.slice(0, 120) + '…' : course.description) : '—'}
                  </p>
                  {course.instructor && (
                    <p className="recommended-page__card-instructor">
                      {[course.instructor.firstName, course.instructor.lastName].filter(Boolean).join(' ')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedCourse && (
        <CourseModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
          onEnrollSuccess={() => {
            setEnrolledCourseIds(prev => new Set([...prev, selectedCourse._id]));
          }}
          isEnrolled={enrolledCourseIds.has(selectedCourse._id)}
          getCoverUrl={getCoverUrl}
        />
      )}
    </div>
  );
};
