import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarDays, // For dates
  Clock, // For time
  MapPin, // For location
  Users, // For audience/posted by, and "My Announcements" toggle
  PlusCircle, // For "Create New" button
  Edit, // For edit button on cards
  Trash2, // For delete button on cards
  X, // For modal close button
  Info, // For Notice type
  GraduationCap, // For Academic type
  Megaphone, // For Event type (also general announcements)
  PartyPopper, // For Holiday type
  Eye, // For "Show All Announcements" toggle
  AlertCircle,
  Loader2, // For error state icon
} from "lucide-react"; // Import all Lucide icons needed
import { jwtDecode } from "jwt-decode";
import toast, { Toaster } from "react-hot-toast";
import { twMerge } from "tailwind-merge";

/**
 * @typedef {Object} Announcement
 * @property {string} _id - Unique identifier for the announcement (backend uses _id)
 * @property {string} title
 * @property {string} description
 * @property {string} date - Date of the announcement/event
 * @property {string} [time] - Optional time (might not be present for all announcement types)
 * @property {string} [location] - Optional location (might not be present for all announcement types)
 * @property {string} [organizer] - Optional organizer (could be user-input or derived)
 * @property {string} type - 'Academic' | 'Notice' | 'Event' | 'Holiday' | 'Other' (as stored in backend, e.g., 'academic')
 * @property {Object} [tags] - Optional tags object
 * @property {string} [tags.audience] - e.g., 'students', 'faculty', 'all'
 * @property {string} createdBy - ID of the user who created it
 * @property {string} createdByRole - Role of the user who created it (e.g., 'admin', 'faculty')
 * @property {string} createdAt - Timestamp of creation (for sorting, if applied)
 * @property {string} updatedAt - Timestamp of last update
 */

const EventManagement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showMyAnnouncements, setShowMyAnnouncements] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [userRole, setUserRole] = useState("student"); // Default role
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

  const [formAnnouncement, setFormAnnouncement] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    organizer: "",
    type: "Event", // Default for the form
    tags: { audience: "all" },
  });

  const resetForm = useCallback(() => {
    setFormAnnouncement({
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      organizer: "",
      type: "Event",
      tags: { audience: "all" },
    });
    setEditingAnnouncement(null);
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = showMyAnnouncements
        ? `${API_BASE_URL}/announcements` // Fetch only my announcements
        : `${API_BASE_URL}/announcements/my`; // Fetch all announcements (general feed)

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          if (showMyAnnouncements) {
            toast.error("You must be logged in to view your announcements.");
          }
          // If unauthorized for 'my' announcements, clear the list
          if (showMyAnnouncements) setAnnouncements([]);
          throw new Error("Authentication failed or unauthorized.");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      const processedData = data.map((item) => {
        const displayType =
          typeof item.type === "string" && item.type
            ? item.type.charAt(0).toUpperCase() + item.type.slice(1)
            : "Unknown";
        return {
          ...item,
          type: displayType,
          date: item.date ? item.date.split("T")[0] : "", // Format date for input type="date"
        };
      });

      // Sort data by createdAt (latest first)
      const sortedData = processedData.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setAnnouncements(sortedData);
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
      setError(
        err.message || "Failed to load announcements. Please try again later."
      );
      toast.error(err.message || "Failed to load announcements.");
      // If fetching 'my' events failed due to auth, clear the list
      if (showMyAnnouncements) {
        setAnnouncements([]);
      }
    } finally {
      setLoading(false);
    }
  }, [token, API_BASE_URL, showMyAnnouncements]);

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
          console.warn(
            'JWT token found but no "role" property in payload. Defaulting to student.'
          );
          setUserRole("student");
        }
      } catch (error) {
        console.error("Failed to decode JWT token from local storage:", error);
        localStorage.removeItem("token");
        setUserRole("student");
        toast.error("Authentication error. Please log in again.");
      }
    } else {
      setUserRole("student");
    }
  }, [token]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleFormChange = (e) => {
    const { id, value } = e.target;
    if (id === "type") {
      setFormAnnouncement((prev) => ({ ...prev, type: value }));
    } else if (id === "announcement-audience") {
      setFormAnnouncement((prev) => ({
        ...prev,
        tags: { ...prev.tags, audience: value },
      }));
    } else {
      setFormAnnouncement((prev) => ({
        ...prev,
        [id.replace("announcement-", "")]: value,
      }));
    }
  };

  const handleCreateOrUpdateSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (
      !formAnnouncement.title ||
      !formAnnouncement.description ||
      !formAnnouncement.date ||
      !formAnnouncement.type
    ) {
      toast.error(
        "Please fill in all required fields (Title, Description, Date, Type)."
      );
      return;
    }

    if (!token) {
      toast.error(
        "Authentication required to perform this action. Please log in."
      );
      return;
    }

    const payload = {
      title: formAnnouncement.title,
      description: formAnnouncement.description,
      type: formAnnouncement.type.toLowerCase(), // Convert to lowercase for backend
      date: formAnnouncement.date,
      ...(formAnnouncement.time && { time: formAnnouncement.time }),
      ...(formAnnouncement.location && { location: formAnnouncement.location }),
      ...(formAnnouncement.organizer && {
        organizer: formAnnouncement.organizer,
      }),
      tags: { audience: formAnnouncement.tags.audience || "all" },
    };

    try {
      let response;
      if (editingAnnouncement) {
        response = await fetch(
          `${API_BASE_URL}/announcements/${editingAnnouncement._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          }
        );
      } else {
        response = await fetch(`${API_BASE_URL}/announcements`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to ${
              editingAnnouncement ? "update" : "create"
            } announcement: ${response.status}`
        );
      }

      await fetchAnnouncements(); // Re-fetch announcements after successful operation

      resetForm();
      setShowCreateForm(false);
      toast.success(
        `Announcement ${
          editingAnnouncement ? "updated" : "created"
        } successfully!`
      );
    } catch (err) {
      console.error(
        ` Error ${editingAnnouncement ? "updating" : "creating"} announcement:,
        err`
      );
      setError(err.message || "An error occurred.");
      toast.error(
        err.message ||
          `Failed to ${
            editingAnnouncement ? "update" : "create"
          } announcement. Please try again.`
      );
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    toast.custom(
      (t) => (
        <div className="fixed inset-0 z-[100] flex items-center  justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-xs sm:max-w-sm rounded-xl border border-[#0c4511] bg-[#0a130f] p-8 text-white shadow-2xl shadow-[#00FFA5]/10 relative animate-scale-in">
            {" "}
            {/* Consistent modal styling */}
            <button
              onClick={() => toast.dismiss(t.id)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full hover:bg-[#1a2e20] transition-colors"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <p className="text-xl sm:text-2xl font-semibold mb-6 text-center text-red-400">
              Confirm Deletion
            </p>
            <p className="text-lg text-gray-300 mb-6 text-center">
              Are you sure you want to delete this announcement? This action
              cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  if (!token) {
                    toast.error(
                      "Authentication required to delete. Please log in."
                    );
                    return;
                  }
                  setError(null);
                  (async () => {
                    try {
                      const response = await fetch(
                        `${API_BASE_URL}/announcements/${id}`,
                        {
                          method: "DELETE",
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        }
                      );

                      if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(
                          `errorData.message ||
                            Failed to delete announcement: ${response.status}
                        `
                        );
                      }

                      await fetchAnnouncements(); // Re-fetch announcements after successful deletion
                      toast.success("Announcement deleted successfully!");
                    } catch (err) {
                      console.error("Error deleting announcement:", err);
                      setError(err.message || "An error occurred.");
                      toast.error(
                        err.message ||
                          "Failed to delete announcement. Please try again."
                      );
                    }
                  })();
                }}
                className="group relative inline-flex items-center justify-center p-0.5 overflow-hidden text-lg font-medium text-gray-900 rounded-full bg-gradient-to-br from-red-600 to-rose-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-red-300 w-full sm:w-auto transform hover:scale-105 transition-transform duration-200 shadow-md"
              >
                <span className="relative flex items-center justify-center px-6 py-3 transition-all ease-in duration-75 bg-[#0a130f] rounded-full group-hover:bg-opacity-0 text-white group-hover:text-white">
                  Delete Anyway
                </span>
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="px-6 py-3 rounded-full text-white font-medium bg-[#1a2e20] hover:bg-[#1f2d23] transition-colors shadow-md transform hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ),
      { duration: Infinity, style: { width: "fit-content" } }
    );
  };

  const handleEditClick = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormAnnouncement({
      title: announcement.title,
      description: announcement.description,
      date: announcement.date,
      time: announcement.time || "",
      location: announcement.location || "",
      organizer: announcement.organizer || "",
      type: announcement.type,
      tags: announcement.tags || { audience: "all" },
    });
    setShowCreateForm(true);
  };

  const handleCloseForm = () => {
    resetForm();
    setShowCreateForm(false);
  };

  const displayedAnnouncements = announcements.filter((announcement) => {
    if (filter === "all") return true;
    return announcement.type === filter;
  });

  // Re-define getEventTypeColor to match the theme
  const getEventTypeStyling = (type) => {
    switch (type) {
      case "Academic":
        return {
          bg: "bg-[#0a130f]",
          border: "border-[#0c4511]", // Changed to primary green
          icon: <GraduationCap className="w-5 h-5 text-emerald-400" />, // Adjusted color
          textColor: "text-emerald-300", // Adjusted color
        };
      case "Notice":
        return {
          bg: "bg-[#0a130f]",
          border: "border-[#0c4511]", // Changed to primary green
          icon: <Info className="w-5 h-5 text-lime-400" />, // Adjusted color
          textColor: "text-lime-300", // Adjusted color
        };
      case "Event":
        return {
          bg: "bg-[#0a130f]",
          border: "border-[#0c4511]", // Changed to primary green
          icon: <Megaphone className="w-5 h-5 text-cyan-400" />, // Adjusted color
          textColor: "text-cyan-300", // Adjusted color
        };
      case "Holiday":
        return {
          bg: "bg-[#0a130f]",
          border: "border-[#0c4511]", // Changed to primary green
          icon: <PartyPopper className="w-5 h-5 text-fuchsia-400" />, // Adjusted color
          textColor: "text-fuchsia-300", // Adjusted color
        };
      default:
        return {
          bg: "bg-[#0a130f]",
          border: "border-[#0c4511]", // Changed to primary green
          icon: <Megaphone className="w-5 h-5 text-gray-400" />,
          textColor: "text-gray-300",
        };
    }
  };

  return (
    <div className="space-y-10 text-white font-sans overflow-hidden bg-[#0a130f] min-h-screen">
      <Toaster position="top-right" />
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-[#0c4511] gap-6 px-4 sm:px-6">
        {" "}
        {/* Consistent border color */}
        <div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-[#00FFA5] animate-gradient-shift">
            Campus Broadcast
          </h1>{" "}
          {/* New title for faculty events */}
          <p className="text-gray-400 mt-3 text-lg sm:text-xl max-w-2xl">
            Manage and publish announcements, events, and notices.
          </p>
        </div>
        {(userRole === "admin" || userRole === "faculty") && (
          <button
            onClick={() => {
              resetForm();
              setShowCreateForm(true);
            }}
            className="group relative inline-flex items-center justify-center p-0.5 overflow-hidden text-lg font-medium rounded-full bg-gradient-to-br from-[#00FFA5] to-[#0c4511] hover:text-white focus:ring-4 focus:outline-none focus:ring-[#00FFA5]/30 shadow-xl hover:shadow-[#00FFA5]/50 transition-all duration-300 w-full sm:w-auto"
          >
            <span className="relative flex items-center justify-center px-8 py-3 transition-all ease-in duration-75 bg-[#0a130f] rounded-full group-hover:bg-opacity-0 text-white">
              <PlusCircle className="w-6 h-6 mr-3 -ml-1" />
              New Broadcast
            </span>
          </button>
        )}
      </div>

      {/* Filters and My Announcements Toggle */}
      <div className="bg-[#0a130f] rounded-2xl p-6 border border-[#0c4511] shadow-xl shadow-[#00FFA5]/10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
        {/* Simple Type Filters */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <span className="text-gray-300 text-lg font-semibold mr-3 hidden sm:block">
            Filter Broadcasts:
          </span>
          {["all", "Academic", "Notice", "Event", "Holiday"].map(
            (typeOption) => (
              <button
                key={typeOption}
                onClick={() => {
                  setFilter(typeOption);
                }}
                className={twMerge(
                  ` px-5 py-2.5 rounded-full text-base font-medium transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a130f] relative z-10,
                  filter === typeOption
                    ? "bg-gradient-to-r from-[#00FFA5] to-[#0c4511] text-white shadow-lg focus:ring-[#00FFA5]/50"
                    : "bg-[#1a2e20] text-gray-300 hover:bg-[#1f2d23] hover:text-white ring-1 ring-[#0c4511] hover:ring-[#00FFA5]/50 focus:ring-[#00FFA5]/50"
                `
                )}
              >
                {typeOption.charAt(0).toUpperCase() + typeOption.slice(1)}
              </button>
            )
          )}
        </div>

        {/* "My Announcements" Button - always visible */}
        <button
          onClick={() => {
            if (!token) {
              toast.error("Please log in to view your announcements.");
              return;
            }
            setShowMyAnnouncements(!showMyAnnouncements); // Toggle
          }}
          className={twMerge(`
            group relative inline-flex items-center justify-center p-0.5 overflow-hidden text-lg font-medium rounded-full bg-gradient-to-br hover:text-white focus:ring-4 focus:outline-none w-full sm:w-auto ml-auto transform hover:scale-105 transition-transform duration-200 shadow-md,
            showMyAnnouncements
              ? "from-rose-500 to-purple-500 focus:ring-rose-300 shadow-rose-500/50" // Red/Purple glow for "My Posts" active state
              : "from-transparent to-transparent text-gray-300 bg-[#1a2e20] ring-1 ring-[#0c4511] hover:bg-[#1f2d23] hover:text-white focus:ring-[#00FFA5]/50" // Dark background, green ring on hover/focus for inactive
          `)}
        >
          <span className="relative flex items-center justify-center px-6 py-3 transition-all ease-in duration-75 bg-[#0a130f] rounded-full group-hover:bg-opacity-0 text-white">
            {showMyAnnouncements ? (
              <Eye className="w-5 h-5 mr-2" />
            ) : (
              <Users className="w-5 h-5 mr-2" />
            )}
            <span>
              {showMyAnnouncements
                ? "Show All Broadcasts"
                : "Show My Broadcasts"}
            </span>
          </span>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-20 bg-[#0a130f] rounded-2xl shadow-xl shadow-[#00FFA5]/10 p-6">
          <Loader2 className="animate-spin h-16 w-16 text-[#00FFA5] mx-auto mb-6 filter drop-shadow-[0_0_8px_rgba(0,255,165,0.4)]" />
          <p className="mt-4 text-2xl font-bold text-gray-300">
            Initiating data stream...
          </p>
          <p className="text-gray-400 mt-2 text-lg">
            Please wait while we load the latest announcements.
          </p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
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

      {/* Announcements Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {displayedAnnouncements.length > 0 ? (
            displayedAnnouncements.map((announcement) => {
              const {
                bg,
                border,
                icon: TypeIcon,
                textColor,
              } = getEventTypeStyling(announcement.type);
              return (
                <div
                  key={announcement._id}
                  className="bg-[#0a130f] rounded-3xl p-6 border border-[#0c4511] shadow-2xl hover:shadow-[#00FFA5]/30 transition-all duration-300 relative group transform hover:-translate-y-2 overflow-hidden"
                >
                  {/* Edit/Delete Buttons for authorized users */}
                  {userRole === "admin" && (
                    <div className="absolute top-5 right-5 flex space-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                      <button
                        onClick={() => handleEditClick(announcement)}
                        className="text-gray-400 hover:text-[#00FFA5] bg-[#1a2e20] hover:bg-[#1f2d23] p-3 rounded-full transition-colors duration-200 shadow-md"
                        title="Edit Broadcast"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteAnnouncement(announcement._id)
                        }
                        className="text-gray-400 hover:text-red-400 bg-[#1a2e20] hover:bg-red-900 p-3 rounded-full transition-colors duration-200 shadow-md"
                        title="Delete Broadcast"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-5">
                    <h3 className="text-2xl font-extrabold text-white line-clamp-2 pr-10">
                      {announcement.title}
                    </h3>
                    <span
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border ${bg} ${border} ${textColor} whitespace-nowrap`}
                    >
                      {TypeIcon}
                      {announcement.type}
                    </span>
                  </div>

                  <p className="text-gray-400 text-base mb-5 line-clamp-3">
                    {announcement.description}
                  </p>

                  <div className="space-y-4 text-gray-400 text-sm">
                    {announcement.date && (
                      <div className="flex items-center">
                        <CalendarDays className="w-4 h-4 mr-3 text-cyan-400" />
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
                    )}

                    {announcement.time && (
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-3 text-emerald-400" />
                        <span>Time: {announcement.time}</span>
                      </div>
                    )}

                    {announcement.location && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-3 text-purple-400" />
                        <span>Location: {announcement.location}</span>
                      </div>
                    )}

                    {(announcement.organizer || announcement.createdByRole) && (
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-3 text-orange-400" />
                        <span>
                          Posted by{" "}
                          {announcement.organizer ||
                            announcement.createdByRole.charAt(0).toUpperCase() +
                              announcement.createdByRole.slice(1)}
                        </span>
                      </div>
                    )}
                    {announcement.tags?.audience && (
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-3 text-indigo-400" />
                        <span>
                          Audience:{" "}
                          {announcement.tags.audience.charAt(0).toUpperCase() +
                            announcement.tags.audience.slice(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  {userRole === "student" && announcement.type === "Event" && (
                    <div className="mt-8 pt-6 border-t border-[#0c4511]">
                      <button className="w-full bg-gradient-to-r from-[#00FFA5] to-[#0c4511] text-white py-3 rounded-xl font-semibold hover:from-[#00FFA5] hover:to-[#0a130f] transition-all duration-300 shadow-lg transform hover:scale-105">
                        Register for Event
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-20 bg-[#0a130f] rounded-2xl shadow-xl shadow-[#00FFA5]/10 p-6">
              <CalendarDays className="w-28 h-28 text-gray-600 mx-auto mb-8 filter drop-shadow-[0_0_8px_rgba(0,255,165,0.2)]" />
              <h3 className="text-3xl font-bold text-gray-300 mb-4">
                No Broadcasts Found
              </h3>
              <p className="text-gray-400 text-xl">
                {showMyAnnouncements
                  ? "You haven't initiated any broadcasts yet, or none match your filter. Create one to see it here!"
                  : "There are no broadcasts matching your current filter. Adjust your selection."}
              </p>
              {filter !== "all" && (
                <button
                  onClick={() => setFilter("all")}
                  className="mt-8 text-[#00FFA5] hover:text-cyan-300 font-semibold text-lg transition-colors"
                >
                  Reset Filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Announcement Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-[100] animate-fade-in">
          {/* Apply aggressive compactness here */}
          <div className="w-full max-w-sm rounded-2xl p-4 sm:p-5 shadow-2xl shadow-[#00FFA5]/10 relative animate-scale-in border border-[#0c4511] bg-[#0a130f] h-[580px] sm:h-[600px]">
            <button
              onClick={handleCloseForm}
              className="absolute top-3 right-3 text-gray-400 hover:text-white p-2 rounded-full hover:bg-[#1a2e20] transition-colors shadow-lg"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-[#00FFA5] mb-4 text-center">
              {editingAnnouncement
                ? "Recalibrate Transmission"
                : "New Transmission Protocol"}
            </h2>
            <form className="space-y-3" onSubmit={handleCreateOrUpdateSubmit}>
              {/* Reduced space-y for fields */}
              <div>
                <label
                  htmlFor="announcement-title"
                  className="block text-xs font-semibold text-gray-300 mb-0.5"
                >
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="announcement-title"
                  className="w-full px-3 py-1.5 border border-[#0c4511] rounded-md bg-black text-white placeholder-gray-500 focus:ring-1 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors disabled:bg-gray-950 disabled:cursor-not-allowed text-sm"
                  placeholder="Enter broadcast subject"
                  value={formAnnouncement.title}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="type"
                  className="block text-xs font-semibold text-gray-300 mb-0.5"
                >
                  Broadcast Type <span className="text-red-400">*</span>
                </label>
                <select
                  id="type"
                  className="w-full px-3 py-1.5 border border-[#0c4511] rounded-md bg-black text-white appearance-none pr-8 focus:ring-1 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors disabled:bg-gray-950 disabled:cursor-not-allowed text-sm"
                  value={formAnnouncement.type}
                  onChange={handleFormChange}
                  required
                >
                  <option value="Academic">Academic</option>
                  <option value="Notice">Notice</option>
                  <option value="Event">Event</option>
                  <option value="Holiday">Holiday</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="announcement-date"
                  className="block text-xs font-semibold text-gray-300 mb-0.5"
                >
                  Broadcast Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  id="announcement-date"
                  className="w-full px-3 py-1.5 border border-[#0c4511] rounded-md bg-black text-white focus:ring-1 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors disabled:bg-gray-950 disabled:cursor-not-allowed text-sm"
                  value={formAnnouncement.date}
                  onChange={handleFormChange}
                  required
                />
              </div>

              {formAnnouncement.type === "Event" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Now 2 columns on small screens and up */}
                  <div>
                    <label
                      htmlFor="announcement-time"
                      className="block text-xs font-semibold text-gray-300 mb-0.5"
                    >
                      Event Time
                    </label>
                    <input
                      type="time"
                      id="announcement-time"
                      className="w-full px-3 py-1.5 border border-[#0c4511] rounded-md bg-black text-white focus:ring-1 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors disabled:bg-gray-950 disabled:cursor-not-allowed text-sm"
                      value={formAnnouncement.time}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="announcement-location"
                      className="block text-xs font-semibold text-gray-300 mb-0.5"
                    >
                      Location
                    </label>
                    <input
                      type="text"
                      id="announcement-location"
                      className="w-full px-3 py-1.5 border border-[#0c4511] rounded-md bg-black text-white placeholder-gray-500 focus:ring-1 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors disabled:bg-gray-950 disabled:cursor-not-allowed text-sm"
                      placeholder="e.g., Nexus Hall"
                      value={formAnnouncement.location}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="announcement-organizer"
                  className="block text-xs font-semibold text-gray-300 mb-0.5"
                >
                  Source/Organizer (Optional)
                </label>
                <input
                  type="text"
                  id="announcement-organizer"
                  className="w-full px-3 py-1.5 border border-[#0c4511] rounded-md bg-black text-white placeholder-gray-500 focus:ring-1 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors disabled:bg-gray-950 disabled:cursor-not-allowed text-sm"
                  placeholder="e.g., Student Council"
                  value={formAnnouncement.organizer}
                  onChange={handleFormChange}
                />
              </div>

              <div>
                <label
                  htmlFor="announcement-description"
                  className="block text-xs font-semibold text-gray-300 mb-0.5"
                >
                  Transmission Details <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="announcement-description"
                  rows={2} // Reduced to 2 rows for compactness
                  className="w-full px-3 py-1.5 border border-[#0c4511] rounded-md bg-black text-white placeholder-gray-500 focus:ring-1 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors resize-y disabled:bg-gray-950 disabled:cursor-not-allowed text-sm"
                  placeholder="Elaborate on details" // Shorter placeholder
                  value={formAnnouncement.description}
                  onChange={handleFormChange}
                  required
                ></textarea>
              </div>

              <div>
                <label
                  htmlFor="announcement-audience"
                  className="block text-xs font-semibold text-gray-300 mb-0.5"
                >
                  Target Frequency
                </label>
                <select
                  id="announcement-audience"
                  className="w-full px-3 py-1.5 border border-[#0c4511] rounded-md bg-black text-white appearance-none pr-8 focus:ring-1 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors disabled:bg-gray-950 disabled:cursor-not-allowed text-sm"
                  value={formAnnouncement.tags.audience}
                  onChange={handleFormChange}
                >
                  <option value="all">All Channels</option>
                  <option value="students">Student Frequencies</option>
                  <option value="faculty">Faculty Frequencies</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-3">
                {/* Reduced button spacing */}
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-4 py-2 border border-[#0c4511] text-gray-300 rounded-md font-medium hover:bg-[#1a2e20] transition-colors duration-200 shadow-md transform hover:scale-105 text-sm"
                >
                  Abort
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#00FFA5] to-[#0c4511] text-white px-4 py-2 rounded-md font-semibold hover:from-[#00FFA5] hover:to-[#0a130f] transition-all duration-300 shadow-lg transform hover:scale-105 text-sm"
                >
                  {editingAnnouncement
                    ? "Update Transmission"
                    : "Send Transmission"}
                </button>
              </div>
            </form>
          </div>
        </div>
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
          background-position: right 0.5rem center; /* Adjusted position */
          background-size: 0.8rem 0.8rem; /* Further reduced size */
        }
        /* Specific drop shadow for glow */
        .filter.drop-shadow-\[0_0_8px_rgba\(0,255,165,0.4\)\] {
          filter: drop-shadow(0 0 8px rgba(0,255,165,0.4));
        }
      `}</style>
    </div>
  );
};

export default EventManagement;
