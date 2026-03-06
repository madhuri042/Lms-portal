# Project Setup Guide

This document explains how to run the project and execute seed scripts.

---

## Run the Backend

```bash
cd backend
npm install
npm start
```

---

## Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Admin Login

1. Create the first admin user (run once from `backend` folder):

   ```bash
   node scripts/seedAdmin.js
   ```

   Default: `admin@lms.com` / `Admin@123`. Override with env: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FIRST_NAME`, `ADMIN_LAST_NAME`.

2. Sign in as admin: open **/admin/login** (or use "Admin sign in" on the main login page). Use the admin email and password. Only users with role `admin` can use this page; others see an error.

3. After login, admin sees the dashboard (system-wide stats), My Courses, Manage Students, Submissions, and System Reports. Admin cannot self-register via signup; use the seed script or an existing admin to create more admins.

---

## Seed Data Scripts

### Create first admin user

```bash
node scripts/seedAdmin.js
```

### Add Instructor Courses to a User

```bash
node scripts/seedInstructorCourses.js
```

### Add Courses to Students

```bash
node scripts/seedCourses.js
```

### Add Students to Instructor

```bash
node scripts/seedInstructorStudents.js
```

### Add Assignments to Students

```bash
node scripts/seedAssignments.js
```

### Add Assignment Submissions to Instructor

```bash
node scripts/seedAssignmentSubmissions.js
```

### Add Weekly Activity

```bash
node scripts/seedWeeklyActivity.js
```

### Add MCQ Assignments

```bash
node scripts/seedMcqAssignment.js
```

### Add Academic Exams

```bash
node scripts/seedAcademicExams.js
```
