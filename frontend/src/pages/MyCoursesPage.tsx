import React, { useEffect, useState, useMemo } from 'react';
import { Loader } from '../components/Loader';
import { Link } from 'react-router-dom';
import { getCourseCoverUrl } from '../utils/courseCover';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface EnrolledCourse {
  _id: string;
  title: string;
  description: string;
  coverImage?: string;
  category?: string;
  instructor?: { name?: string; email?: string };
}

interface TeachingCourse {
  _id: string;
  title: string;
  description: string;
  coverImage?: string;
  category?: string;
  studentCount: number;
  instructor?: { firstName?: string; lastName?: string; name?: string };
}

export const MyCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<(EnrolledCourse | TeachingCourse)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string>('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const isInstructor = role === 'instructor' || role === 'admin';

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setRole(user.role || 'student');
      } catch {
        setRole('student');
      }
    } else {
      setRole('student');
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login to view your courses.');
      setLoading(false);
      return;
    }
    if (!role) return;

    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        if (isInstructor) {
          const res = await fetch(`${API_BASE_URL}/api/courses/teaching`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Failed to fetch courses');
          setCourses(data.data || []);
        } else {
          const res = await fetch(`${API_BASE_URL}/api/courses/enrolled`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Failed to fetch courses');
          setCourses(data.data || []);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [role, isInstructor]);

  const categories = useMemo(() => {
    if (!isInstructor || courses.length === 0) return ['All'];
    const cats = Array.from(
      new Set(
        (courses as TeachingCourse[])
          .map((c) => (c.category || '').trim())
          .filter(Boolean)
      )
    ).sort();
    return ['All', ...cats];
  }, [isInstructor, courses]);

  const filteredCourses = useMemo(() => {
    let list = courses;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q)) ||
          (c.category && c.category.toLowerCase().includes(q))
      );
    }
    if (isInstructor && categoryFilter !== 'All') {
      list = list.filter((c) => (c.category || '').trim() === categoryFilter);
    }
    return list;
  }, [courses, search, categoryFilter, isInstructor]);

  function getCoverUrl(course: EnrolledCourse | TeachingCourse): string {
    return getCourseCoverUrl(API_BASE_URL, course);
  }

  if (loading) return <Loader message={isInstructor ? 'Loading your courses...' : 'Loading your courses...'} />;

  if (isInstructor) {
    return (
      <div className="catalog-page">
        <header className="catalog-page__header">
          <h1 className="catalog-page__title">Course Catalog</h1>
          <p className="catalog-page__subtitle">Courses you&apos;re teaching. View and manage enrollments.</p>
        </header>

        {error && (
          <div className="recommended-page__error" role="alert">
            {error}
          </div>
        )}

        {!error && (
          <>
            <input
              type="text"
              className="catalog-page__search"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search courses"
            />
            <div className="catalog-page__filters">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`catalog-page__filter-btn ${categoryFilter === cat ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat || 'Uncategorized'}
                </button>
              ))}
            </div>

            {filteredCourses.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '100px 0' }}>
                <p className="text-secondary opacity-50">
                  {courses.length === 0
                    ? "You aren't teaching any courses yet."
                    : 'No courses match your search or filter.'}
                </p>
              </div>
            ) : (
              <div className="catalog-page__grid">
                {filteredCourses.map((course) => {
                  const teachingCourse = course as TeachingCourse;
                  const studentCount = teachingCourse.studentCount ?? 0;
                  return (
                    <Link
                      key={course._id}
                      to={`/dashboard/courses/${course._id}/learn`}
                      className="catalog-page__card"
                    >
                      <div className="catalog-page__card-cover">
                        <img
                          src={getCoverUrl(course)}
                          alt=""
                          className="catalog-page__card-img"
                        />
                        {course.category && (
                          <span className="catalog-page__card-category">
                            {course.category.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="catalog-page__card-body">
                        <h3 className="catalog-page__card-title">{course.title}</h3>
                        <p className="catalog-page__card-desc">
                          {course.description
                            ? course.description.length > 120
                              ? course.description.slice(0, 120) + '…'
                              : course.description
                            : '—'}
                        </p>
                        <div className="catalog-page__card-meta">
                          <span className="catalog-page__card-students">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            {studentCount} {studentCount === 1 ? 'Student' : 'Students'}
                          </span>
                          <span className="catalog-page__card-arrow" aria-hidden>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="my-courses-page">
      <header className="recommended-page__header">
        <h1 className="recommended-page__title">My Courses</h1>
        <p className="recommended-page__subtitle">Manage and view your enrolled courses here.</p>
      </header>

      {error && (
        <div className="recommended-page__error" role="alert">
          {error}
        </div>
      )}

      {courses.length === 0 && !error ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '100px 0' }}>
          <p className="text-secondary opacity-50">You haven&apos;t enrolled in any courses yet.</p>
          <Link to="/dashboard/recommended" className="auth-submit" style={{ display: 'inline-block', textDecoration: 'none', marginTop: '20px', padding: '12px 24px' }}>
            Browse Recommendations
          </Link>
        </div>
      ) : (
        <div className="recommended-page__grid">
          {courses.map((course) => (
            <Link
              key={course._id}
              to={`/dashboard/courses/${course._id}/learn`}
              className="recommended-page__card"
            >
              <div className="recommended-page__card-cover">
                <img
                  src={getCoverUrl(course)}
                  alt={course.title}
                  className="recommended-page__card-img"
                />
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
                    {course.instructor.name}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
