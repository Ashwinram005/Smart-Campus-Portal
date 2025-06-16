# Smart Campus Portal

## 🧠 Overview

Smart Campus Portal is a full-stack web application built during the "MERN Mavericks" Hackathon. It serves as a centralized platform for students, faculty, and admins to manage academic activities, communicate important announcements, and track placement records.

## 🧩 Tech Stack

* **Frontend**: React.js, JavaScript, Tailwind CSS
* **Backend**: Node.js, Express.js
* **Database**: MongoDB (Mongoose ODM)
* **Authentication**: JWT-based with role-based access control
* **Cloudinary**: Used for managing uploaded media (assignments, materials)

## 🔐 Roles Supported

* **Admin**: Full access to manage users, announcements, placements, and oversee platform-wide data.
* **Faculty**: Manage announcements, courses, upload materials, post assignments, and view student submissions.
* **Student**: View enrolled courses, get announcements, and submit assignments.

---

## 🛠️ Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/Ashwinram005/Smart-Campus-Portal.git
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

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=1d
```

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

## 📝 Additional Notes

* Faculty can only manage their own courses, materials, and assignments.
* Students can submit assignments only for their enrolled courses.
* Admin can view and manage all records across users, placements, and announcements.
* Cloudinary is used to handle file storage for assignments and course materials.

---

## 📌 Authors

Built by:

* **ASHWINRAM M**

---

## 🏁 Final Words

This project was developed in a limited time during the MERN Mavericks Hackathon. Future improvements can include:

* Attendance Tracking
* Grade Management
* Real-time Messaging
* Notifications / Email Alerts
