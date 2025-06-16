import React, { useState, useEffect, useCallback } from "react";
import {
  BellRing, // For announcements
  CalendarDays,
  Tag,
  Hash, // For ID/audience
  User,
  Loader2,
  AlertCircle,
  Clock, // For time
  MapPin, // For location
  MessageSquare, // For description
  UserCog, // For createdByRole
  GraduationCap, // For Academic filter
  Sparkles, // For Event filter
  Gift, // For Holiday filter
  Info, // For General filter
  ListFilter, // For an "All" filter or filter icon
} from "lucide-react";
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
 * @property {string} type // e.g., "academic", "event", "holiday", "general"
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

  // NEW: State for the current filter type
  const [filterType, setFilterType] = useState("all"); // 'all', 'academic', 'event', 'holiday', 'general'

  const token = localStorage.getItem("token");
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL; // Your backend API base URL
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Client-side filtering: Only show announcements targeted to 'all' or 'students'
      const studentRelevantAnnouncements = data.filter(
        (announcement) =>
          announcement.tags?.audience === "all" ||
          announcement.tags?.audience === "students"
      );

      // Sort by date, oldest first, for chronological display of events/holidays.
      studentRelevantAnnouncements.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setAnnouncements(studentRelevantAnnouncements || []);
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
      setError(
        err.message || "Failed to load announcements. Please try again later."
      );
      toast.error(err.message || "Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  }, [token, API_BASE_URL]);

  useEffect(() => {
    if (userRole === "student") {
      fetchAnnouncements();
    }
  }, [userRole, fetchAnnouncements]);

  // Derived state: Filtered announcements based on `filterType`
  const filteredAnnouncements = announcements.filter((announcement) => {
    if (filterType === "all") {
      return true; // Show all relevant announcements
    }
    return announcement.type === filterType;
  });

  const getAnnouncementIcon = (type) => {
    switch (type) {
      case "academic":
        return <Tag className="w-5 h-5 mr-3 text-blue-600" />;
      case "event":
        return <CalendarDays className="w-5 h-5 mr-3 text-purple-600" />;
      case "holiday":
        return <CalendarDays className="w-5 h-5 mr-3 text-green-600" />;
      case "notice":
        return <MessageSquare className="w-5 h-5 mr-3 text-gray-600" />;
      default:
        return <BellRing className="w-5 h-5 mr-3 text-indigo-600" />;
    }
  };

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
          Student Announcements
        </h1>
      </div>
      <p className="text-gray-600 mt-2 text-base sm:text-lg">
        Stay informed with the latest updates and important notices.
      </p>

      {loading && (
        <div className="text-center py-16">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="mt-4 text-xl font-medium text-gray-700">
            Loading announcements...
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative text-center flex items-center justify-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-1"> {error}</span>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3 mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
            <span className="font-medium text-gray-700 flex items-center mr-2">
              <ListFilter className="w-5 h-5 mr-2 text-gray-600" /> Filter by:
            </span>
            {[
              {
                label: "All",
                type: "all",
                icon: <BellRing className="w-4 h-4 mr-2" />,
              },
              {
                label: "Academic",
                type: "academic",
                icon: <GraduationCap className="w-4 h-4 mr-2" />,
              },
              {
                label: "Event",
                type: "event",
                icon: <Sparkles className="w-4 h-4 mr-2" />,
              },
              {
                label: "Holiday",
                type: "holiday",
                icon: <Gift className="w-4 h-4 mr-2" />,
              },
              {
                label: "Notice",
                type: "notice",
                icon: <Info className="w-4 h-4 mr-2" />,
              },
            ].map((filter) => (
              <button
                key={filter.type}
                onClick={() => setFilterType(filter.type)}
                className={twMerge(
                  "px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 flex items-center",
                  filterType === filter.type
                    ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {filter.icon}
                {filter.label}
              </button>
            ))}
          </div>

          {filteredAnnouncements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAnnouncements.map((announcement) => (
                <div
                  key={announcement._id}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
                >
                  <div className="flex items-center mb-3">
                    {getAnnouncementIcon(announcement.type)}
                    <h3 className="text-xl font-extrabold text-gray-900 flex-1">
                      {announcement.title}
                    </h3>
                    <span
                      className={twMerge(
                        "px-3 py-1 rounded-full text-xs font-semibold border",
                        announcement.type === "holiday"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : announcement.type === "event"
                          ? "bg-purple-100 text-purple-800 border-purple-200"
                          : announcement.type === "academic"
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : "bg-gray-100 text-gray-800 border-gray-200"
                      )}
                    >
                      {announcement.type.charAt(0).toUpperCase() +
                        announcement.type.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm mb-4 flex-grow line-clamp-3">
                    <MessageSquare className="w-4 h-4 inline-block mr-2 text-gray-500" />
                    {announcement.description}
                  </p>
                  <div className="text-gray-600 text-sm space-y-2 mt-auto pt-4 border-t border-gray-100">
                    <div className="flex items-center">
                      <CalendarDays className="w-4 h-4 mr-2 text-red-500" />
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
                        <Clock className="w-4 h-4 mr-2 text-orange-500" />
                        <span>Time: {announcement.time}</span>
                      </div>
                    )}
                    {announcement.location && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-cyan-500" />
                        <span>Location: {announcement.location}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <UserCog className="w-4 h-4 mr-2 text-indigo-500" />
                      <span>Posted by: {announcement.createdByRole}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <CalendarDays className="w-3 h-3 mr-1" />
                      <span>
                        Created:{" "}
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="col-span-full text-center py-20 bg-white rounded-xl shadow-md p-6">
              <BellRing className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-700 mb-3">
                No Announcements Found
              </h3>
              <p className="text-gray-500 text-lg">
                There are no announcements matching your selected filter.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentAnnouncement;
