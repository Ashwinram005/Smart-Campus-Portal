# 🎓 Smart Campus Portal

Smart Campus Portal is a full-stack web application developed as part of the **"MERN Mavericks – Code, Create & Conquer"** Hackathon. It acts as a centralized digital platform to manage academic workflows, announcements, placements, and student-faculty interactions within a campus ecosystem.

## 🧰 Tech Stack

- **Frontend**: React.js, Tailwind CSS, Cloudinary (for media uploads)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (with Mongoose ODM)
- **Authentication**: JWT (JSON Web Token)
- **Security**: Bcrypt (password hashing)

## 👤 User Roles & Features

### 🧑‍🎓 Student
- 📘 View enrolled **Courses**
- 📝 Submit **Assignments**
- 🎯 Track **Placement** eligibility and status
- 📢 Receive **Announcements** and notices

### 👨‍🏫 Faculty
- 📘 Manage their assigned **Courses**
- 📝 Create & evaluate **Assignments**
- 📢 Post academic **Announcements**
- 📤 Upload materials via Cloudinary

### 👨‍💼 Admin
- 👥 Full **User Management** (Students & Faculty)
- 📢 Create and manage **Announcements**
- 🎯 Manage **Placement Records**
- 📘 Add / Edit **Courses**

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Ashwinram005/Smart-Campus-Portal.git
cd Smart-Campus-Portal
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
```

Start the backend server:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file inside the `frontend/` directory:

```env
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

Start the frontend development server:

```bash
npm run dev
```

## 🔐 Default Admin Credentials (for Initial Login)

To log in as an Admin for the first time, use the credentials below:

📧 **Email**: `admin@example.com`  
🔑 **Password**: `admin123`  
⚠️ This Admin account is pre-inserted into the MongoDB database during initial setup using a securely hashed password.  
✅ After logging in, the Admin can create additional Admin, Faculty, or Student accounts through the web interface.  

## 📁 Project Structure

```
Smart-Campus-Portal/
├── backend/
│   ├── models/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   └── index.js
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
```

## 📌 Notes

- Passwords are securely hashed using `bcrypt`.
- File uploads (e.g., assignments, materials) are stored in `Cloudinary`.
- Role-based access is enforced using JWT authentication and middleware.
- Faculty can access only their assigned courses and students.
- Students can view and interact only with content relevant to their enrollment.

## 💡 Future Enhancements

- 🕒 Attendance Management
- 📊 Gradebook / Internal Marks
- 💬 Real-time Chat or Discussion Board
- 🔔 Notification System (Email / In-App)

## 👥 Authors

Developed by:

- **ASHWINRAM M**
