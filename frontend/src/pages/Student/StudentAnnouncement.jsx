import React, { useState, useEffect, useCallback } from "react";
import {
  BellRing, // General announcements icon
  CalendarDays, // For dates, and academic/event/holiday types
  Clock, // For time
  MapPin, // For location
  UserRound, // For posted by (more specific than UserCog or Users)
  Loader2, // For loading spinner
  AlertCircle, // For error state
  GraduationCap, // For Academic filter/type
  Sparkles, // For Event filter/type
  Gift, // For Holiday filter/type
  Info, // For Notice filter/type
  ListFilter, // For an "All" filter or filter section icon
  Users, // For audience (retained from previous)
  ChevronLeft, // For "Access Denied" button if needed (optional)
} from "lucide-react"; // Import all Lucide icons needed
import { jwtDecode } from "jwt-decode";
import toast, { Toaster } from "react-hot-toast";
import { twMerge } from "tailwind-merge";

/**
 * @typedef {Object} Announcement
 * @property {Object} tags
 * @property {string} tags.audience // e.g., "all", "students", "faculty"
 * @property {string} _id
 * @property {string} title
 * @property {string} description
 * @property {string} type // e.g., "academic", "event", "holiday", "general", "notice"
 * @property {string} date // Date of the announcement's event (e.g., "2025-06-30")
 * @property {string} [time] // Optional: Time of the event
 * @property {string} [location] // Optional: Location of the event
 * @property {string} createdBy // ID of the user who created it
 * @property {string} createdByRole // Role of the user who created it (e.g., "admin", "faculty")
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {number} __v // Mongoose version key
 */

const StudentAnnouncement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState("student"); // Default to student
  const [userId, setUserId] = useState(null);

  const [filterType, setFilterType] = useState("all");

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
      toast.error("You must be logged in to view announcements.");
      setLoading(false);
    }
  }, [token]);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/announcements/feed`, {
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
          setAnnouncements([]); // Clear list on auth error
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Client-side filtering: Only show announcements targeted to 'all' or 'students'
      const studentRelevantAnnouncements = data.filter(
        (announcement) =>
          announcement.tags?.audience === "all" ||
          announcement.tags?.audience === "students"
      );

      // Sort by date, latest first now (most recent relevant events/announcements at top)
      // If you specifically want oldest first, change b - a to a - b
      studentRelevantAnnouncements.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setAnnouncements(studentRelevantAnnouncements || []);
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
      setError(
        err.message || "Failed to load announcements. Please try again later."
      );
      toast.error(err.message || "Failed to load announcements.");
      setAnnouncements([]); // Clear list on other errors too
    } finally {
      setLoading(false);
    }
  }, [token, API_BASE_URL]);

  useEffect(() => {
    if (userRole === "student" && token) {
      // Ensure user is student and token is present
      fetchAnnouncements();
    } else if (!token && !error) {
      // If no token and no prior error message, show auth error
      setError("Authentication required. Please log in as a student.");
      setLoading(false);
    }
  }, [userRole, token, fetchAnnouncements, error]);

  const getAnnouncementIcon = (type) => {
    switch (type) {
      case "academic":
        return <GraduationCap className="w-5 h-5 mr-3 text-blue-400" />;
      case "event":
        return <Sparkles className="w-5 h-5 mr-3 text-purple-400" />;
      case "holiday":
        return <Gift className="w-5 h-5 mr-3 text-green-400" />;
      case "notice":
        return <Info className="w-5 h-5 mr-3 text-yellow-400" />;
      default:
        return <BellRing className="w-5 h-5 mr-3 text-cyan-400" />; // General/other
    }
  };

  const getAnnouncementBadgeStyling = (type) => {
    switch (type) {
      case "academic":
        return {
          bg: "bg-blue-950",
          border: "border-blue-700",
          textColor: "text-blue-300",
        };
      case "event":
        return {
          bg: "bg-purple-950",
          border: "border-purple-700",
          textColor: "text-purple-300",
        };
      case "holiday":
        return {
          bg: "bg-green-950",
          border: "border-green-700",
          textColor: "text-green-300",
        };
      case "notice":
        return {
          bg: "bg-yellow-950",
          border: "border-yellow-700",
          textColor: "text-yellow-300",
        };
      default:
        return {
          bg: "bg-gray-950",
          border: "border-gray-700",
          textColor: "text-gray-300",
        };
    }
  };

  // Access Denied message for non-students
  if (userRole !== "student" && !loading && !error) {
    // Only show if loading finished and no other error and definitely not student
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
        {/* Optional: Add a button to navigate to login if you have a specific route */}
        {/* <button onClick={() => navigate('/login')} className="mt-6 text-[#00FFA5] hover:text-cyan-400 font-semibold text-lg transition-colors">Go to Login</button> */}
      </div>
    );
  }

  // Filtered announcements based on `filterType`
  const filteredAnnouncements = announcements.filter((announcement) => {
    if (filterType === "all") {
      return true;
    }
    return announcement.type.toLowerCase() === filterType; // Ensure lowercase for comparison
  });

  return (
    <div className="space-y-10 text-white font-sans overflow-hidden">
      <Toaster position="top-right" />

      {/* Page Header */}
      <div className="pb-8 border-b border-[#0c4511]">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-[#00FFA5] animate-gradient-shift">
          Campus Alerts
        </h1>
        <p className="text-gray-400 mt-3 text-lg sm:text-xl max-w-2xl">
          Stay informed with the latest updates and important notices relevant
          to students.
        </p>
      </div>

      {/* Filters Section */}
      <div className="bg-[#0a130f] rounded-2xl p-6 border border-[#0c4511] shadow-xl shadow-[#00FFA5]/10 flex flex-wrap items-center gap-x-4 gap-y-3">
        <span className="font-semibold text-gray-300 flex items-center mr-2">
          <ListFilter className="w-6 h-6 mr-2 text-gray-400" /> Filter by Type:
        </span>
        {[
          {
            label: "All",
            type: "all",
            icon: <BellRing className="w-5 h-5 mr-2" />,
          },
          {
            label: "Academic",
            type: "academic",
            icon: <GraduationCap className="w-5 h-5 mr-2" />,
          },
          {
            label: "Event",
            type: "event",
            icon: <Sparkles className="w-5 h-5 mr-2" />,
          },
          {
            label: "Holiday",
            type: "holiday",
            icon: <Gift className="w-5 h-5 mr-2" />,
          },
          {
            label: "Notice",
            type: "notice",
            icon: <Info className="w-5 h-5 mr-2" />,
          },
        ].map((filterOption) => (
          <button
            key={filterOption.type}
            onClick={() => setFilterType(filterOption.type)}
            className={twMerge(
              "px-5 py-2.5 rounded-full text-base font-medium transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a130f] relative z-10 flex items-center",
              filterType === filterOption.type
                ? "bg-gradient-to-r from-blue-500 to-[#00FFA5] text-white shadow-lg focus:ring-[#00FFA5]/50"
                : "bg-[#1a2e20] text-gray-300 hover:bg-[#1f2d23] hover:text-white ring-1 ring-[#0c4511] hover:ring-[#00FFA5]/50 focus:ring-[#00FFA5]/50"
            )}
          >
            {React.cloneElement(filterOption.icon, {
              className: twMerge(
                filterOption.icon.props.className,
                "text-inherit"
              ), // Ensure icon color inherits from button text
            })}
            {filterOption.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-20 bg-[#0a130f] rounded-2xl shadow-xl shadow-[#00FFA5]/10 p-6 border border-[#0c4511]">
          <Loader2 className="animate-spin h-16 w-16 text-[#00FFA5] mx-auto mb-6 filter drop-shadow-[0_0_8px_rgba(0,255,165,0.4)]" />
          <p className="mt-4 text-2xl font-bold text-gray-300">
            Scanning for transmissions...
          </p>
          <p className="text-gray-400 mt-2 text-lg">
            Please wait while we load the latest announcements.
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-20 bg-red-950 rounded-2xl border border-red-700 shadow-xl p-6">
          <AlertCircle className="w-20 h-20 text-red-400 mx-auto mb-6 filter drop-shadow-[0_0_8px_rgba(255,0,0,0.4)]" />
          <h3 className="text-3xl font-bold text-red-700 mb-3">
            Transmission Error!
          </h3>
          <p className="text-red-400 text-xl">{error}</p>
          <button
            onClick={fetchAnnouncements}
            className="mt-8 bg-gradient-to-r from-red-600 to-rose-500 text-white px-8 py-3 rounded-full font-medium hover:from-red-700 hover:to-rose-600 transition-all duration-300 shadow-lg transform hover:scale-105"
          >
            Re-establish Connection
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {filteredAnnouncements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredAnnouncements.map((announcement) => {
                const badgeStyling = getAnnouncementBadgeStyling(
                  announcement.type.toLowerCase()
                );
                return (
                  <div
                    key={announcement._id}
                    className="bg-[#0a130f] rounded-3xl p-6 border border-[#0c4511] shadow-2xl hover:shadow-[#00FFA5]/30 transition-all duration-300 transform hover:-translate-y-2 flex flex-col"
                  >
                    <div className="flex items-center mb-4">
                      {getAnnouncementIcon(announcement.type.toLowerCase())}
                      <h3 className="text-2xl font-extrabold text-white flex-1 pr-4">
                        {announcement.title}
                      </h3>
                      <span
                        className={twMerge(
                          "px-4 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap",
                          badgeStyling.bg,
                          badgeStyling.border,
                          badgeStyling.textColor
                        )}
                      >
                        {announcement.type}
                      </span>
                    </div>
                    <p className="text-gray-400 text-base mb-5 flex-grow line-clamp-3">
                      {announcement.description}
                    </p>
                    <div className="text-gray-400 text-sm space-y-3 mt-auto pt-4 border-t border-[#0c4511]">
                      <div className="flex items-center">
                        <CalendarDays className="w-4 h-4 mr-2 text-cyan-400" />
                        <span>
                          Date:{" "}
                          {new Date(announcement.date).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>
                      {announcement.time && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-emerald-400" />
                          <span>Time: {announcement.time}</span>
                        </div>
                      )}
                      {announcement.location && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-purple-400" />
                          <span>Location: {announcement.location}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <UserRound className="w-4 h-4 mr-2 text-orange-400" />
                        <span>Posted by: {announcement.createdByRole}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2 text-indigo-400" />
                        <span>
                          Audience: {announcement.tags?.audience || "All"}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 pt-2 border-t border-gray-800">
                        <CalendarDays className="w-3 h-3 mr-1 text-gray-600" />
                        <span>
                          Created:{" "}
                          {new Date(
                            announcement.createdAt
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="col-span-full text-center py-20 bg-[#0a130f] rounded-2xl shadow-xl shadow-[#00FFA5]/10 p-6 border border-[#0c4511]">
              <BellRing className="w-28 h-28 text-gray-600 mx-auto mb-8 filter drop-shadow-[0_0_8px_rgba(0,255,165,0.2)]" />
              <h3 className="text-3xl font-bold text-gray-300 mb-4">
                No Broadcasts Found
              </h3>
              <p className="text-gray-400 text-xl">
                There are no announcements matching your selected filter.
              </p>
              {filterType !== "all" && (
                <button
                  onClick={() => setFilterType("all")}
                  className="mt-8 text-[#00FFA5] hover:text-cyan-300 font-semibold text-lg transition-colors"
                >
                  Reset Filter
                </button>
              )}
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

export default StudentAnnouncement;
