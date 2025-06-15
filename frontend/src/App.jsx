import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import Login from "./pages/Login";
import { Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Admin/Dashboard";
import UserManagement from "./pages/Admin/UserManagement";
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";
import EventManagement from "./pages/Admin/EventManagement";
import PlacementManagement from "./pages/Admin/PlacementManagement";

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
      <Route path="/events" element={
        <PrivateRoute>
          <Layout currentPageTitle="Event Management">
            <EventManagement/>
          </Layout>
        </PrivateRoute>
      }></Route>
      <Route path="/placements" element={
        <PrivateRoute>
          <Layout currentPageTitle="Placement Management">
            <PlacementManagement/>
          </Layout>
        </PrivateRoute>
      }></Route>

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
