import React, { useEffect, useState } from "react";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/users/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchDashboardData();
  }, [token]);

  if (!data) return <div className="text-white">Loading...</div>;

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold text-white drop-shadow-[0_1px_4px_rgba(0,255,165,0.4)]">
        {data.role === "admin" ? "Admin Dashboard" : "Student Dashboard"}
      </h1>

      {/* === Admin Stats === */}
      {data.role === "admin" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card label="Total Students" value={data.studentCount} />
          <Card label="Total Faculty" value={data.facultyCount} />
          <Card label="Total Announcements" value={data.announcementCount} />
          <Card label="Total Placements" value={data.placementCount} />
        </div>
      )}

      {/* === Student Stats === */}
      {data.role === "student" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card label="Total Courses" value={data.totalCourses} />
          <Card label="Total Assignments" value={data.totalAssignments} />
          <Card label="Submitted" value={data.submitted} />
          <Card label="Pending" value={data.pending} />
        </div>
      )}

      {/* === Announcements (Common to both) === */}
      {/* === Announcements (Only for students) === */}
      {data.role === "student" && (
        <div className="bg-gradient-to-br from-[#0c1f16] to-[#101b14] rounded-xl p-6 border border-[#1f2d23]">
          <h2 className="text-xl font-bold text-white mb-4">Announcements</h2>
          {data.announcements?.length === 0 ? (
            <p className="text-gray-400">No announcements available.</p>
          ) : (
            <ul className="space-y-4">
              {data.announcements?.map((a) => (
                <li
                  key={a._id}
                  className="pl-4 border-l-4 border-yellow-400 bg-[#191f1a] p-3 rounded-md"
                >
                  <h3 className="text-lg font-semibold text-yellow-400">
                    {a.title}
                  </h3>
                  <p className="text-sm text-gray-300">📅 Date: {a.date}</p>
                  <p className="text-sm text-white">📣 {a.description}</p>
                  <p className="text-xs text-gray-400">Type: {a.type}</p>
                  <p className="text-xs text-gray-400">
                    Created By: {a.createdByRole} ({a.createdBy})
                  </p>
                  <p className="text-xs text-gray-500 italic">
                    Audience: {a.tags?.audience}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Created At: {new Date(a.createdAt).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Updated At: {new Date(a.updatedAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// Reusable card component
const Card = ({ label, value }) => (
  <div className="rounded-xl p-6 bg-gradient-to-br from-[#0c1f16] to-[#101b14] border border-[#1f2d23] shadow hover:shadow-lg transition-all duration-200">
    <h2 className="text-white text-lg font-semibold">{label}</h2>
    <p className="text-[#00FFA5] text-3xl mt-2 font-bold">{value}</p>
  </div>
);
