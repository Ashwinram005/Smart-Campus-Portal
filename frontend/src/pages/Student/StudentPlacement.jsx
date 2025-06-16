import React, { useState, useEffect, useCallback } from "react";
import {
  Briefcase, // For placements / general record icon
  CalendarDays, // For drive date
  MapPin, // For location
  Tag, // For type (internship/full-time)
  DollarSign, // For package
  UserRound, // For student name (more specific than User)
  Hash, // For batch year
  Loader2, // For loading spinner
  AlertCircle, // For error state
  Building2, // For company
  Code, // For role
  X, // For Access Denied
} from "lucide-react"; // Import all Lucide icons needed
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
 * @property {string} type - Type of placement (e.g., "internship", "fulltime")
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
        setLoading(false); // Stop loading if token is invalid
      }
    } else {
      toast.error("You must be logged in to view placement records.");
      setLoading(false); // Stop loading if no token
    }
  }, [token]);

  const fetchPlacementRecords = useCallback(async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      // Endpoint to fetch student-relevant placements
      const response = await fetch(`${API_BASE_URL}/placements/student`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError(
            "Access Denied: Please ensure you are logged in as a student."
          );
          toast.error(
            "Access Denied: Please ensure you are logged in as a student."
          );
          setPlacementRecords([]); // Clear records on auth error
          return;
        }
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
      setPlacementRecords([]); // Clear records on any fetch error
    } finally {
      setLoading(false);
    }
  }, [token, API_BASE_URL]);

  useEffect(() => {
    // Only fetch if userRole is student and we have a token (or it's being evaluated)
    // Avoid double fetching or fetching for non-students immediately.
    if (userRole === "student" && token) {
      fetchPlacementRecords();
    } else if (!token && !error) {
      // If no token and no prior error, set specific auth error
      setError("Authentication required. Please log in as a student.");
      setLoading(false);
    }
  }, [userRole, token, fetchPlacementRecords, error]);

  // Access Denied message for non-students (or if authentication failed)
  // This renders if userRole is definitively NOT 'student' OR if a fatal auth error occurred.
  if (userRole !== "student" && !loading && !error) {
    return (
      <div className="text-center py-20 bg-black text-white min-h-screen flex flex-col items-center justify-center">
        <Toaster position="top-right" />
        <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-4 filter drop-shadow-[0_0_8px_rgba(255,0,0,0.4)]" />
        <h2 className="text-3xl font-bold text-gray-300 mb-3">
          Unauthorized Access
        </h2>
        <p className="text-gray-400 text-lg">
          You must be logged in as a student to view this page.
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Please log in with appropriate credentials.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 text-white font-sans overflow-hidden">
      <Toaster position="top-right" />

      {/* Header Section */}
      <div className="pb-8 border-b border-[#0c4511]">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-[#00FFA5] animate-gradient-shift">
          Placement Insights
        </h1>
        <p className="text-gray-400 mt-3 text-lg sm:text-xl max-w-2xl">
          Explore the latest placement achievements and opportunities.
        </p>
      </div>

      {loading && (
        <div className="text-center py-20 bg-[#0a130f] rounded-2xl shadow-xl shadow-[#00FFA5]/10 p-6 border border-[#0c4511]">
          <Loader2 className="animate-spin h-16 w-16 text-[#00FFA5] mx-auto mb-6 filter drop-shadow-[0_0_8px_rgba(0,255,165,0.4)]" />
          <p className="mt-4 text-2xl font-bold text-gray-300">
            Scanning for placement data...
          </p>
          <p className="text-gray-400 mt-2 text-lg">
            Please wait while we load the latest records.
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-20 bg-red-950 rounded-2xl border border-red-700 shadow-xl p-6">
          <AlertCircle className="w-20 h-20 text-red-400 mx-auto mb-6 filter drop-shadow-[0_0_8px_rgba(255,0,0,0.4)]" />
          <h3 className="text-3xl font-bold text-red-700 mb-3">
            Data Retrieval Error!
          </h3>
          <p className="text-red-400 text-xl">{error}</p>
          <button
            onClick={fetchPlacementRecords}
            className="mt-8 bg-gradient-to-r from-red-600 to-rose-500 text-white px-8 py-3 rounded-full font-medium hover:from-red-700 hover:to-rose-600 transition-all duration-300 shadow-lg transform hover:scale-105"
          >
            Re-initiate Query
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {placementRecords.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {placementRecords.map((record) => (
                <div
                  key={record._id || `${record.studentId}-${record.company}`} // Robust key
                  className="bg-[#0a130f] rounded-3xl p-6 border border-[#0c4511] shadow-2xl hover:shadow-[#00FFA5]/30 transition-all duration-300 transform hover:-translate-y-2 group" // Added group for combined hover
                >
                  <div className="flex items-center mb-4">
                    <Briefcase className="w-6 h-6 text-[#00FFA5] mr-3 filter drop-shadow-[0_0_8px_rgba(0,255,165,0.3)] group-hover:drop-shadow-[0_0_12px_rgba(0,255,165,0.6)] transition-all duration-300" />{" "}
                    {/* Glow on hover */}
                    <h3 className="text-2xl font-extrabold text-white flex-1 pr-4">
                      {record.company}
                    </h3>
                  </div>
                  <p className="text-gray-400 text-base mb-4 leading-tight">
                    <span className="font-semibold text-gray-300">Name:</span>{" "}
                    {record.name}
                    <span className="ml-2 text-sm text-gray-500">
                      ({record.studentId})
                    </span>
                  </p>
                  <div className="text-gray-400 text-sm space-y-3">
                    <div className="flex items-center">
                      <Code className="w-4 h-4 mr-2 text-purple-400" />
                      <span className="font-semibold text-gray-300">
                        Role:
                      </span>{" "}
                      {record.role}
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-2 text-green-400" />
                      <span className="font-semibold text-gray-300">
                        Package:
                      </span>{" "}
                      ₹{record.package} LPA
                    </div>
                    <div className="flex items-center">
                      <Tag className="w-4 h-4 mr-2 text-orange-400" />
                      <span className="font-semibold text-gray-300">
                        Type:
                      </span>{" "}
                      <span
                        className={twMerge(
                          "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                          record.type === "internship"
                            ? "text-blue-300 border-blue-700 bg-blue-950"
                            : "text-emerald-300 border-emerald-700 bg-emerald-950"
                        )}
                      >
                        {record.type.charAt(0).toUpperCase() +
                          record.type.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <CalendarDays className="w-4 h-4 mr-2 text-blue-400" />
                      <span className="font-semibold text-gray-300">
                        Drive Date:
                      </span>{" "}
                      {new Date(record.driveDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-red-400" />
                      <span className="font-semibold text-gray-300">
                        Location:
                      </span>{" "}
                      {record.location}
                    </div>
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 mr-2 text-cyan-400" />
                      <span className="font-semibold text-gray-300">
                        Department:
                      </span>{" "}
                      {record.department}
                    </div>
                    <div className="flex items-center">
                      <Hash className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="font-semibold text-gray-300">
                        Batch:
                      </span>{" "}
                      {record.batchYear}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="col-span-full text-center py-20 bg-[#0a130f] rounded-2xl shadow-xl shadow-[#00FFA5]/10 p-6 border border-[#0c4511]">
              <Briefcase className="w-28 h-28 text-gray-600 mx-auto mb-8 filter drop-shadow-[0_0_8px_rgba(0,255,165,0.2)]" />
              <h3 className="text-3xl font-bold text-gray-300 mb-4">
                No Placement Records Found
              </h3>
              <p className="text-gray-400 text-xl">
                There are currently no placement records available to display.
              </p>
            </div>
          )}
        </>
      )}

      {/* Global CSS for animations and custom selects (place this in your main CSS file) */}
      <style>{`
        /* General Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }

        /* Gradient Text Animation */
        @keyframes gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .animate-gradient-shift {
            background-size: 200% auto;
            animation: gradient-shift 5s ease-in-out infinite;
        }

        /* Custom Select Arrow Styling (for dark theme) */
        select.appearance-none {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='%239CA3AF' class='w-6 h-6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M8.25 4.5l7.5 7.5-7.5 7.5' /%3E%3C/svg%3E"); /* Light gray arrow for dark bg */
          background-repeat: no-repeat;
          background-position: right 1rem center;
          background-size: 1.25rem 1.25rem;
        }
        /* Specific drop shadow for glow */
        .filter.drop-shadow-\[0_0_8px_rgba\(0,255,165,0.4\)\] {
          filter: drop-shadow(0 0 8px rgba(0,255,165,0.4));
        }
      `}</style>
    </div>
  );
};

export default StudentPlacement;
