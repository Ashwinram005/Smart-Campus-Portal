// App.js
import { useState } from "react";
// ... other imports ...
import { Route, Routes } from "react-router-dom"; // Keep Route, Routes
// No need for BrowserRouter in App.js if it's in index.js

import Dashboard from "./pages/Admin/Dashboard";
import UserManagement from "./pages/Admin/UserManagement";
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";
import EventManagement from "./pages/Admin/EventManagement";
import PlacementManagement from "./pages/Admin/PlacementManagement";
import CourseManagement from "./pages/Faculty/CourseManagement";
import CourseDetailsPage from "./pages/Faculty/CourseDetailsPage"; // <--- Import the CourseDetailsPage
import Login from "./pages/Login";

function App() {
  const [appUsers, setAppUsers] = useState([]); // Initialize with an empty array or fetch data

  const handleUserUpdate = (updatedUsers) => {
    setAppUsers(updatedUsers);
    // In a real app, you'd also persist this to an API/database
  };
  return (
    <Routes>
      {/* Public route */}
      <Route path="/" element={<Login />} />

      {/* Private routes */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Layout currentPageTitle="Admin Dashboard">
              <Dashboard />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/events"
        element={
          <PrivateRoute>
            <Layout currentPageTitle="Event Management">
              <EventManagement />
            </Layout>
          </PrivateRoute>
        }
      ></Route>
      <Route
        path="/placements"
        element={
          <PrivateRoute>
            <Layout currentPageTitle="Placement Management">
              <PlacementManagement />
            </Layout>
          </PrivateRoute>
        }
      ></Route>

      {/* Course Management & Details Routes */}
      {/* This route renders the main list of courses */}
      <Route
        path="/courses"
        element={
          <PrivateRoute>
            <Layout currentPageTitle="Course Management">
              <CourseManagement />
            </Layout>
          </PrivateRoute>
        }
      />
      {/* This NEW route renders the details for a specific course */}
      {/* We will pass state via the navigate function from CourseManagement */}
      <Route
        path="/courses/:courseId" // Still needs :courseId for URL structure
        element={
          <PrivateRoute>
            {/* Layout can be adjusted for a dynamic title later */}
            <Layout currentPageTitle="Course Details">
              <CourseDetailsPage /> {/* No 'course' prop here directly */}
            </Layout>
          </PrivateRoute>
        }
      />
      {/* End Course Management & Details Routes */}

      <Route
        path="/user"
        element={
          <PrivateRoute>
            <Layout currentPageTitle="User Management">
              <UserManagement
                users={appUsers}
                onUserUpdate={handleUserUpdate}
              />
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;
