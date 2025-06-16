import React, { useState, useEffect, useCallback } from "react";
import {
  Briefcase, // For placements
  CalendarDays,
  MapPin,
  Tag,
  DollarSign,
  User,
  Hash,
  Loader2,
  AlertCircle,
  Building2, // For company
  Code, // For role
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import toast, { Toaster } from "react-hot-toast";
import { twMerge } from "tailwind-merge";

/**
 * @typedef {Object} PlacementRecord
 * @property {string} _id - Unique ID for the record (assuming backend generates one)
 * @property {string} studentId - The student's ID (e.g., "ECE-25-1735")
 * @property {string} email - Student's email
 * @property {string} department - Student's department
 * @property {number} batchYear - Student's batch year (e.g., 2023)
 * @property {string} company - Company name (e.g., "Google")
 * @property {string} role - Role offered (e.g., "SDE Intern")
 * @property {number} package - Package in LPA (e.g., 8.5)
 * @property {string} type - Type of placement (e.g., "internship", "full-time")
 * @property {string} driveDate - Date of the drive (e.g., "2025-07-01")
 * @property {string} location - Location (e.g., "Hyderabad")
 * @property {string} name - Student's name (e.g., "Rogers")
 * @property {string} [createdAt] - Optional: Date record was created
 * @property {string} [updatedAt] - Optional: Date record was last updated
 */

const StudentPlacement = () => {
  const [placementRecords, setPlacementRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState("student"); // Default to student
  const [userId, setUserId] = useState(null); // Not strictly needed for fetching *all* records, but good for context

  const token = localStorage.getItem("token");
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const role = decodedToken.role;
        const id = decodedToken.userId;
        if (role) {
          setUserRole(role);
          setUserId(id);
        } else {
          console.warn('JWT token found but no "role" property in payload.');
        }
      } catch (error) {
        console.error("Failed to decode JWT token:", error);
        toast.error("Authentication error. Please log in again.");
        setLoading(false);
      }
    } else {
      toast.error("You must be logged in to view placement records.");
      setLoading(false);
    }
  }, [token]);

  const fetchPlacementRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Assuming an endpoint that provides all student placement records
      // You might need to adjust this endpoint based on your backend.
      // For instance, if only *the current student's* records are shown,
      // the endpoint might be `/placements/mine` or similar.
      // For displaying *all* records to a student, `/placements` might be used.
      const response = await fetch(`${API_BASE_URL}/placements/student`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPlacementRecords(data || []);
    } catch (err) {
      console.error("Failed to fetch placement records:", err);
      setError(
        err.message ||
          "Failed to load placement records. Please try again later."
      );
      toast.error(err.message || "Failed to load records.");
    } finally {
      setLoading(false);
    }
  }, [token, API_BASE_URL]);

  useEffect(() => {
    if (userRole === "student") {
      fetchPlacementRecords();
    }
  }, [userRole, fetchPlacementRecords]);

  // Access Denied message for non-students
  if (userRole !== "student") {
    return (
      <div className="p-4 sm:p-6 space-y-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <Toaster position="top-right" />
        <div className="text-center bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <User className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You must be logged in as a student to view this page.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Please log in with appropriate credentials.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-gray-50 min-h-screen font-sans">
      <Toaster position="top-right" />

      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
          Student Placement Records
        </h1>
      </div>
      <p className="text-gray-600 mt-2 text-base sm:text-lg">
        Explore the placement achievements of our students.
      </p>

      {loading && (
        <div className="text-center py-16">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="mt-4 text-xl font-medium text-gray-700">
            Loading placement records...
          </p>
        </div>
      )}

      {!loading && !error && (
        <>
          {placementRecords.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {placementRecords.map((record) => (
                <div
                  key={record._id || `${record.studentId}-${record.company}`} // Fallback key if _id is not always present immediately
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex items-center mb-3">
                    <Briefcase className="w-6 h-6 text-indigo-600 mr-3" />
                    <h3 className="text-xl font-extrabold text-gray-900">
                      {record.company}
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    <span className="font-semibold text-gray-800">
                      {record.name}
                    </span>{" "}
                    ({record.studentId})
                  </p>
                  <div className="text-gray-700 text-sm space-y-2">
                    <div className="flex items-center">
                      <Code className="w-4 h-4 mr-2 text-purple-500" />
                      <span>Role: {record.role}</span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-2 text-green-500" />
                      <span>
                        Package: {record.package}{" "}
                        {record.type === "full-time" ? "LPA" : "Stipend/Offer"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Tag className="w-4 h-4 mr-2 text-orange-500" />
                      <span>Type: {record.type}</span>
                    </div>
                    <div className="flex items-center">
                      <CalendarDays className="w-4 h-4 mr-2 text-blue-500" />
                      <span>
                        Drive Date:{" "}
                        {new Date(record.driveDate).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-red-500" />
                      <span>Location: {record.location}</span>
                    </div>
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 mr-2 text-cyan-500" />
                      <span>Department: {record.department}</span>
                    </div>
                    <div className="flex items-center">
                      <Hash className="w-4 h-4 mr-2 text-gray-500" />
                      <span>Batch: {record.batchYear}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="col-span-full text-center py-20 bg-white rounded-xl shadow-md p-6">
              <Briefcase className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-700 mb-3">
                No Placement Records Found
              </h3>
              <p className="text-gray-500 text-lg">
                There are currently no placement records available to display.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentPlacement;
