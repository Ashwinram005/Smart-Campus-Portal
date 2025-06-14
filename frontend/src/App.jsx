import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import Login from "./pages/Login";
import { Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Admin/Dashboard";
import UserManagement from "./pages/Admin/UserManagement";
import Layout from "./components/Layout";

function App() {
  const [appUsers, setAppUsers] = useState([]); // Initialize with an empty array or fetch data

  const handleUserUpdate = (updatedUsers) => {
    setAppUsers(updatedUsers);
    // In a real app, you'd also persist this to an API/database
  };
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />}></Route>
        <Route
          path="/dashboard"
          element={
            <Layout currentPageTitle="Admin Dashboard">
              {/* This is the content that was originally in your Dashboard component's main tag */}
              <Dashboard />
            </Layout>
          }
        />
        <Route
          path="/user"
          element={
            <Layout currentPageTitle="User Management">
              <UserManagement
                users={appUsers}
                onUserUpdate={handleUserUpdate}
              />
            </Layout>
          }
        />
      </Routes>
    </>
  );
}

export default App;
