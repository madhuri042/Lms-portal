import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { Loader } from '../components/Loader';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const InstructorCreateCoursePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    videoUrl: '',
    videoType: 'youtube', // youtube, vimeo, other
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and Description are required.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category.trim(),
          videos: [{ title: 'Intro Video', videoUrl: form.videoUrl.trim() }],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create course');

      showToast('Course created successfully!');
      navigate('/dashboard/courses');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader message="Creating your course..." />;

  return (
    <div className="catalog-page">
      <header className="catalog-page__header">
        <h1 className="catalog-page__title">Create New Course</h1>
        <p className="catalog-page__subtitle">Share your knowledge with the world by creating a high-quality course.</p>
      </header>

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '32px' }}>
        <form onSubmit={handleSubmit} className="manage-students-modal-form" style={{ padding: 0 }}>
          {error && <div className="manage-students-form-error">{error}</div>}
          
          <div className="manage-students-form-row">
            <label className="manage-students-label">Course Title *</label>
            <input
              type="text"
              className="manage-students-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Advanced React Patterns"
              required
            />
          </div>

          <div className="manage-students-form-row">
            <label className="manage-students-label">Description *</label>
            <textarea
              className="manage-students-input"
              style={{ minHeight: '120px', resize: 'vertical' }}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What will students learn in this course?"
              required
            />
          </div>

          <div className="manage-students-form-row">
            <label className="manage-students-label">Category</label>
            <input
              type="text"
              className="manage-students-input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. Programming, Design, Business"
            />
          </div>

          <div className="manage-students-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
            <div>
              <label className="manage-students-label">Source Type</label>
              <select
                className="manage-students-input"
                value={form.videoType}
                onChange={(e) => setForm({ ...form, videoType: e.target.value })}
              >
                <option value="youtube">YouTube</option>
                <option value="vimeo">Vimeo</option>
                <option value="other">Other Link / File</option>
              </select>
            </div>
            <div>
              <label className="manage-students-label">Intro Video URL</label>
              <input
                type="url"
                className="manage-students-input"
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                placeholder={form.videoType === 'youtube' ? 'https://youtube.com/watch?v=...' : 'https://...'}
              />
            </div>
          </div>

          <div className="manage-students-modal-actions" style={{ marginTop: '24px' }}>
            <button
              type="button"
              className="manage-students-btn-cancel"
              onClick={() => navigate('/dashboard/courses')}
            >
              Cancel
            </button>
            <button type="submit" className="manage-students-btn-submit">
              Publish Course
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
