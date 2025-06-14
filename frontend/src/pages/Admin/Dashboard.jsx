// src/components/DashboardPageContent.jsx
import React from "react";
import { useNavigate } from "react-router-dom"; // If you need navigate within this content

// Mock data specific to the dashboard page
const mockAdminData = {
  stats: {
    totalStudents: 1250,
    totalFaculty: 85,
    totalCourses: 120,
    placementRate: 92,
  },
  users: [
    {
      id: "1",
      name: "Alex Johnson",
      email: "student@campus.edu",
      role: "student",
      status: "active",
    },
    {
      id: "2",
      name: "Dr. Sarah Wilson",
      email: "faculty@campus.edu",
      role: "faculty",
      status: "active",
    },
    {
      id: "3",
      name: "Emma Davis",
      email: "emma.davis@campus.edu",
      role: "student",
      status: "active",
    },
  ],
  events: [
    {
      id: 1,
      title: "Tech Talk: AI in Healthcare",
      date: "2024-01-30",
      attendees: 150,
      status: "upcoming",
    },
    {
      id: 2,
      title: "Career Fair 2024",
      date: "2024-02-05",
      attendees: 320,
      status: "upcoming",
    },
  ],
  systemHealth: {
    uptime: "99.9%",
    responseTime: "0.2s",
    activeUsers: 234,
    storageUsed: "68%",
  },
};

export default function Dashboard() {
  const navigate = useNavigate(); // Now use navigate here if needed for this page's content

  return (
    // This div will inherit the padding from the Layout's <main> tag
    <div className="space-y-10">
      {" "}
      {/* Removed px-10 py-10 as Layout's main provides it */}
      <h1 className="text-white text-3xl font-bold mb-4">Admin Dashboard</h1>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(mockAdminData.stats).map(([key, value]) => (
          <div
            key={key}
            className="bg-[#101b14] rounded-xl p-6 text-center shadow-md border border-[#1f2d23]"
          >
            <h2 className="text-lg font-bold capitalize">
              {key.replace(/([A-Z])/g, " $1")}
            </h2>
            <p className="text-3xl mt-2 font-semibold">{value}</p>
          </div>
        ))}
      </div>
      {/* System Health */}
      <div className="bg-[#101b14] rounded-xl p-6 shadow-md border border-[#1f2d23]">
        <h2 className="text-xl font-bold mb-4">System Health</h2>
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(mockAdminData.systemHealth).map(([key, value]) => (
            <li key={key}>
              <span className="text-sm capitalize">
                {key.replace(/([A-Z])/g, " $1")}
              </span>
              <p className="text-lg font-medium">{value}</p>
            </li>
          ))}
        </ul>
      </div>
      {/* Users (if you want to keep recent users on dashboard, otherwise remove) */}
      <div className="bg-[#101b14] rounded-xl p-6 shadow-md border border-[#1f2d23]">
        <h2 className="text-xl font-bold mb-4">Recent Users</h2>
        <table className="w-full table-auto text-left text-sm">
          <thead>
            <tr className="text-[#00FFA5]">
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {mockAdminData.users.map((user) => (
              <tr key={user.id} className="border-t border-[#1f2d23]">
                <td className="py-2">{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Events */}
      <div className="bg-[#101b14] rounded-xl p-6 shadow-md border border-[#1f2d23]">
        <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>
        <ul className="space-y-4">
          {mockAdminData.events.map((event) => (
            <li key={event.id} className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-semibold">{event.title}</h3>
              <p className="text-sm">Date: {event.date}</p>
              <p className="text-sm">Attendees: {event.attendees}</p>
              <p className="text-sm">Status: {event.status}</p>
            </li>
          ))}
        </ul>
      </div>
      {/* New Announcement */}
      <div className="fixed bottom-5 right-9">
        <button
          className="text-white text-base bg-blue-400 rounded-xl p-3 w-40 h-12 shadow-md hover:bg-blue-500 transition-colors"
          onClick={() => {
            navigate("/admin/new-announcement"); // navigate still works here
            window.scrollTo({ top: 0 });
          }}
        >
          + New Announcement
        </button>
      </div>
    </div>
  );
}
