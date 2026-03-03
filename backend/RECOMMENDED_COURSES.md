# Course recommendations (daily updates)

Recommended courses are shown on the **Recommended** page. The API returns **up to 30 courses**: first the curated recommended list, then (if fewer than 30) extra courses from the catalog so the page always shows nearly 30 when available. You can change the curated list in two ways.

## 1. API (admin only)

Send a **PUT** request with the list of course IDs you want to feature:

```http
PUT /api/recommended-courses
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "courseIds": ["course_id_1", "course_id_2", "course_id_3"]
}
```

Order in the array is the display order (first = first card). Max 30 IDs.

## 2. Scripts

From the `backend` folder:

```bash
# If you have fewer than 30 courses, seed enough to reach 30 (uses an existing instructor/admin)
node scripts/seedCourses.js

# Use first 30 courses in DB as recommended
node scripts/setRecommendedCourses.js

# Or set specific IDs (comma-separated, up to 30)
RECOMMENDED_IDS=id1,id2,id3 node scripts/setRecommendedCourses.js
```

The recommendation API returns up to 30 courses (curated list first, then filled from the catalog). If you only see 4, you likely have only 4 courses in the database—run `seedCourses.js` to add more, then reload the Recommended page.

## Course cover image and classification

- **Cover image**: Set `coverImage` on the course when creating or updating (PUT `/api/courses/:id`). Use a URL (e.g. `https://...`) or a path like `/uploads/cover.jpg` if you serve files from the backend.
- **Classification**: Set `category` on the course (e.g. `"Programming"`, `"Design"`, `"Web Development"`). It appears as a label on the recommendation card.

Example update body for a course:

```json
{
  "coverImage": "https://example.com/cover.jpg",
  "category": "Programming"
}
```

Or with a local upload path (if you store covers in `backend/uploads`):

```json
{
  "coverImage": "/uploads/course-cover-1.jpg",
  "category": "Web Development"
}
```
