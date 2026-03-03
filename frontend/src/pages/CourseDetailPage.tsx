import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader } from '../components/Loader';
import './CourseDetailPage.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface SyllabusModule {
    moduleTitle: string;
    lessons: string[];
}

interface CourseDetail {
    _id: string;
    title: string;
    description: string;
    coverImage?: string;
    category?: string;
    instructor?: { _id: string; name?: string; firstName?: string; lastName?: string };
    objectives?: string[];
    outcomes?: string[];
    syllabus?: SyllabusModule[];
    enrolledStudents?: string[];
}

const IconCheck = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const IconTarget = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
    </svg>
);

const IconBookOpen = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
);

const IconChevronDown = ({ isOpen }: { isOpen: boolean }) => (
    <svg
        width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
    >
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

export const CourseDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [enrolling, setEnrolling] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [openModules, setOpenModules] = useState<Record<number, boolean>>({ 0: true });

    useEffect(() => {
        const fetchCourse = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const headers: HeadersInit = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const res = await fetch(`${API_BASE_URL}/api/courses/${id}`, { headers });
                const data = await res.json();

                if (!res.ok) throw new Error(data.message || 'Failed to load course details');

                setCourse(data.data);

                const userStr = localStorage.getItem('user');
                if (userStr && data.data.enrolledStudents) {
                    const user = JSON.parse(userStr);
                    setIsEnrolled(data.data.enrolledStudents.includes(user.id));
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [id]);

    const handleEnroll = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        setEnrolling(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/courses/${id}/enroll`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to enroll');
            setIsEnrolled(true);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setEnrolling(false);
        }
    };

    const toggleModule = (index: number) => {
        setOpenModules(prev => ({ ...prev, [index]: !prev[index] }));
    };

    if (loading) return <Loader message="Designing your learning path..." />;
    if (error) return <div className="course-detail-error">{error}</div>;
    if (!course) return <div className="course-detail-error">Course not found.</div>;

    const instructorName = course.instructor
        ? (course.instructor.name || [course.instructor.firstName, course.instructor.lastName].filter(Boolean).join(' '))
        : 'Lead Instructor';

    const coverUrl = course.coverImage?.startsWith('http')
        ? course.coverImage
        : `${API_BASE_URL}${course.coverImage}`;

    return (
        <div className="course-detail-shell">
            <div className="course-detail-hero-modern">
                <div className="hero-overlay" />
                <div className="hero-background" style={{ backgroundImage: `url(${coverUrl})` }} />

                <nav className="course-detail-nav">
                    <Link to="/dashboard/recommended" className="back-btn-glass">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                        <span>Back to Explorer</span>
                    </Link>
                </nav>

                <div className="hero-content-modern">
                    <div className="hero-text-block">
                        <span className="premium-badge">{course.category || 'Specialization'}</span>
                        <h1 className="hero-title-modern">{course.title}</h1>
                        <div className="hero-meta-modern">
                            <div className="instructor-chip">
                                <div className="instructor-avatar">{instructorName.charAt(0)}</div>
                                <span>{instructorName}</span>
                            </div>
                            <div className="meta-separator" />
                            <div className="rating-pill">
                                <span className="star-icon">★</span>
                                <span>4.9 (2.4k reviews)</span>
                            </div>
                        </div>

                        <div className="hero-actions-modern">
                            {isEnrolled ? (
                                <button className="btn-modern btn-enrolled-status" disabled>
                                    <IconCheck />
                                    Already Enrolled
                                </button>
                            ) : (
                                <button className={`btn-modern btn-enroll-primary ${enrolling ? 'loading' : ''}`} onClick={handleEnroll} disabled={enrolling}>
                                    {enrolling ? 'Enrolling...' : 'Start Learning Now'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="course-detail-grid-modern">
                <div className="detail-main-flow">
                    <section className="detail-card-modern">
                        <div className="section-header-modern">
                            <IconBookOpen />
                            <h2>Strategic Overview</h2>
                        </div>
                        <p className="description-text-modern">{course.description}</p>
                    </section>

                    <div className="detail-two-col">
                        <section className="detail-card-modern">
                            <div className="section-header-modern">
                                <IconTarget />
                                <h2>Core Objectives</h2>
                            </div>
                            <ul className="modern-check-list">
                                {(course.objectives || []).map((obj, i) => (
                                    <li key={i}><div className="check-box"><IconCheck /></div>{obj}</li>
                                ))}
                            </ul>
                        </section>

                        <section className="detail-card-modern">
                            <div className="section-header-modern">
                                <IconCheck />
                                <h2>Key Outcomes</h2>
                            </div>
                            <ul className="modern-dot-list">
                                {(course.outcomes || []).map((out, i) => (
                                    <li key={i}>{out}</li>
                                ))}
                            </ul>
                        </section>
                    </div>
                </div>

                <aside className="detail-sidebar-modern">
                    <div className="syllabus-card-modern">
                        <div className="syllabus-header-modern">
                            <h3>Table of Contents</h3>
                            <span className="curriculum-count">{course.syllabus?.length || 0} Modules</span>
                        </div>

                        <div className="modern-accordion">
                            {course.syllabus && course.syllabus.length > 0 ? (
                                course.syllabus.map((module, i) => (
                                    <div key={i} className={`accordion-item ${openModules[i] ? 'open' : ''}`}>
                                        <button className="accordion-trigger" onClick={() => toggleModule(i)}>
                                            <div className="module-info">
                                                <span className="module-index">{String(i + 1).padStart(2, '0')}</span>
                                                <h4>{module.moduleTitle}</h4>
                                            </div>
                                            <IconChevronDown isOpen={openModules[i]} />
                                        </button>
                                        <div className="accordion-content">
                                            <ul>
                                                {module.lessons.map((lesson, j) => (
                                                    <li key={j}>
                                                        <div className="lesson-indicator" />
                                                        <span>{lesson}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-syllabus">Curriculum details arriving soon.</div>
                            )}
                        </div>

                        {!isEnrolled && (
                            <button className="btn-sidebar-enroll" onClick={handleEnroll} disabled={enrolling}>
                                {enrolling ? 'Enrolling...' : 'Unlock Full Curriculum'}
                            </button>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
};
