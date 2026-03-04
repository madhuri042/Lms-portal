import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import './CourseModal.css';

interface CourseModalProps {
    course: {
        _id: string;
        title: string;
        description: string;
        coverImage?: string;
        category?: string;
        instructor?: { _id: string; firstName?: string; lastName?: string; name?: string };
    };
    onClose: () => void;
    onEnrollSuccess: () => void;
    isEnrolled: boolean;
    getCoverUrl: (course: any) => string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const CourseModal: React.FC<CourseModalProps> = ({
    course,
    onClose,
    onEnrollSuccess,
    isEnrolled: initiallyEnrolled,
    getCoverUrl,
}) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [enrolled, setEnrolled] = useState(initiallyEnrolled);
    const [error, setError] = useState<string | null>(null);

    const handleEnroll = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Please login to enroll in this course.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE_URL}/api/courses/${course._id}/enroll`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to enroll.');
            }

            setEnrolled(true);
            onEnrollSuccess();
            showToast('Enrolled successfully.');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const instructorName = course.instructor
        ? (course.instructor.name || [course.instructor.firstName, course.instructor.lastName].filter(Boolean).join(' '))
        : 'Unknown Instructor';

    return (
        <div className="course-modal-overlay" onClick={onClose}>
            <div className="course-modal-card" onClick={(e) => e.stopPropagation()}>
                <button className="course-modal-close" onClick={onClose}>&times;</button>

                <div className="course-modal-header">
                    <img src={getCoverUrl(course)} alt={course.title} className="course-modal-cover" />
                    {course.category && <span className="course-modal-category">{course.category}</span>}
                </div>

                <div className="course-modal-body">
                    <h2 className="course-modal-title">{course.title}</h2>
                    <p className="course-modal-instructor">By {instructorName}</p>

                    <div className="course-modal-description">
                        <h3>About this course</h3>
                        <p>{course.description}</p>
                    </div>

                    {error && <div className="course-modal-error">{error}</div>}

                    <div className="course-modal-footer">
                        {!enrolled && (
                            <Link to={`/dashboard/courses/${course._id}`} className="course-modal-btn-secondary">
                                View more details
                            </Link>
                        )}
                        {enrolled ? (
                            <button className="course-modal-btn enrolled" disabled>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M16.6666 5L7.49992 14.1667L3.33325 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Already Enrolled
                            </button>
                        ) : (
                            <button
                                className={`course-modal-btn enroll ${loading ? 'loading' : ''}`}
                                onClick={handleEnroll}
                                disabled={loading}
                            >
                                {loading ? 'Enrolling...' : 'Enroll Now'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
