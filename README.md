# Smart Campus Portal 

## 🧠 Overview

Smart Campus Portal is a full-stack web application built during the "MERN Mavericks" Hackathon. It serves as a centralized platform for students, faculty, and admins to manage academic activities, communicate important announcements, and track placement records.

## 🧩 Tech Stack

* **Frontend**: React.js, TypeScript, Tailwind CSS
* **Backend**: Node.js, Express.js
* **Database**: MongoDB (Mongoose ODM)
* **Authentication**: JWT-based with role-based access control

## 🔐 Roles Supported

* **Admin**: Full access to manage users, announcements, placements, courses.
* **Faculty**: Manage courses, assignments, materials.
* **Student**: View courses, announcements, submit assignments.

---

## 🚀 Features

### 👤 User Management (Admin Panel)

* Add/edit/delete users (students/faculty/admin)
* Role-based access
* Filters by role, status, department

### 📢 Announcements & Events (Admin/Faculty)

* Post by category: `academic`, `event`, `notice`, `holiday`
* Targeted audience (all/students/faculty)
* Tags: department, year
* Students see personalized feed

### 🎯 Placement Tracking (Admin)

* Upload student-wise placement data
* Company, role, package, location
* Validates against student records
* Downloadable CSV
* Stats: Top offers, total placed, average package

### 📚 Course Management (Faculty)

* Create courses by department & year
* Auto-enroll students
* Edit/delete/sync enrolled students

### 📁 Course Materials (Faculty)

* Upload materials (link, PDF, docs)
* Organized per course

### 📝 Assignments (Faculty → Student)

* Faculty create assignments per course
* Students submit via file URL
* Track who submitted/not submitted

---

## 📂 Folder Structure

```
backend/
  models/
  controllers/
  routes/
  middleware/
  config/
  index.js
frontend/
  components/
  pages/
  utils/
  App.tsx
  main.tsx
```

---

## 🛠️ Setup Instructions

### 1. Clone Repository

```bash
git clone (https://github.com/Ashwinram005/Smart-Campus-Portal.git)
```

### 2. Setup Backend

```bash
cd backend
npm install
# Configure `.env` file
npm run dev
```

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Environment Variables

Backend `.env`:

```
PORT=5000
MONGO_URI=your_mongo_db_url
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=1d
```

## 📝 Additional Notes

* Faculty can only manage their own courses/materials/assignments
* Students can only submit assignments for courses they’re enrolled in
* Announcement feed is automatically filtered by role, department, year

---

## 📌 Authors

Built by 

* ASHWINRAM M

---


## 🏁 Final Words

This project was created in a limited time for the hackathon, and can be scaled further to include:

* Attendance Tracking
* Grade Management
* Real-time chat between students & faculty
* Notification & Email Integration
