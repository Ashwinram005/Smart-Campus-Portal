import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Filter,
  Edit,
  Trash2,
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import toast, { Toaster } from "react-hot-toast";

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
  const [showMyAnnouncements, setShowMyAnnouncements] = useState(false); // Correctly a boolean
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [userRole, setUserRole] = useState("student");
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");
  const API_BASE_URL = "http://localhost:5000/api";

  const [formAnnouncement, setFormAnnouncement] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    organizer: "",
    type: "Event",
    tags: { audience: "all" },
  });

  // Function to reset the form to its initial empty state
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

  // Function to fetch announcements, now correctly dependent on `showMyAnnouncements`
  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = showMyAnnouncements
        ? `${API_BASE_URL}/announcements/my` // Fetch only my announcements
        : `${API_BASE_URL}/announcements`; // Fetch all announcements

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // If trying to fetch /my without being logged in or authorized
          if (showMyAnnouncements) {
            toast.error("You must be logged in to view your announcements.");
          }
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

      // Sort data by createdAt (latest first) - client-side sorting
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
  }, [token, API_BASE_URL, showMyAnnouncements]); // showMyAnnouncements is a dependency

  // Effect to read the token, set user role and ID on component mount
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
        console.error("Failed to decode JWT token from local storage:", error);
      }
    }
  }, [token]);

  // Effect to trigger initial fetch and re-fetch when fetchAnnouncements function changes
  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]); // fetchAnnouncements is the only dependency here

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
      type: formAnnouncement.type.toLowerCase(),
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
        `Error ${editingAnnouncement ? "updating" : "creating"} announcement:`,
        err
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
    // Using toast for confirmation instead of window.confirm
    toast.custom(
      (t) => (
        <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center border border-gray-200">
          <p className="text-gray-800 text-lg mb-4">
            Are you sure you want to delete this announcement?
          </p>
          <div className="flex space-x-4">
            <button
              onClick={() => {
                toast.dismiss(t.id); // Dismiss the toast
                // Proceed with deletion logic
                if (!token) {
                  toast.error(
                    "Authentication required to delete. Please log in."
                  );
                  return;
                }
                setError(null);
                (async () => {
                  // IIFE to use async/await within this callback
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
                        errorData.message ||
                          `Failed to delete announcement: ${response.status}`
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
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors shadow-sm"
            >
              Delete
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors shadow-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, style: { width: "fit-content" } }
    ); // Make toast persistent and fit content
  };

  const handleEditClick = (announcement) => {
    setEditingAnnouncement(announcement);
    // Populate the form with the announcement data for editing
    setFormAnnouncement({
      title: announcement.title,
      description: announcement.description,
      // Date is already in YYYY-MM-DD from fetch's processing
      date: announcement.date,
      time: announcement.time || "",
      location: announcement.location || "",
      organizer: announcement.organizer || "",
      type: announcement.type, // Use capitalized type from processed state for dropdown
      tags: announcement.tags || { audience: "all" },
    });
    setShowCreateForm(true); // Open the modal
  };

  const handleCloseForm = () => {
    resetForm();
    setShowCreateForm(false);
  };

  // Filter announcements displayed based on the selected type filter
  const displayedAnnouncements = announcements.filter((announcement) => {
    if (filter === "all") return true;
    return announcement.type === filter;
  });

  const getEventTypeColor = (type) => {
    switch (type) {
      case "Academic":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Notice":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Event":
        return "bg-red-100 text-red-800 border-red-200";
      case "Holiday":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Campus Announcements
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Stay updated with the latest campus news and activities.
          </p>
        </div>
        {(userRole === "admin" || userRole === "faculty") && (
          <button
            onClick={() => {
              resetForm();
              setShowCreateForm(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium text-lg hover:from-blue-700 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl w-full md:w-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Create New</span>
          </button>
        )}
      </div>

      {/* Filters and My Announcements Toggle */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Simple Type Filters */}
        <div className="flex-wrap flex items-center space-x-2 gap-y-2">
          <span className="text-gray-600">Filter by Type:</span>
          {["all", "Academic", "Notice", "Event", "Holiday"].map(
            (typeOption) => (
              <button
                key={typeOption}
                onClick={() => {
                  setFilter(typeOption);
                  setShowMyAnnouncements(false); // Make sure "My Announcements" is off when a type filter is active
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                  filter === typeOption && !showMyAnnouncements // Active state for type filter
                    ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                }`}
              >
                {typeOption.charAt(0).toUpperCase() + typeOption.slice(1)}
              </button>
            )
          )}
        </div>

        {/* "My Announcements" Button - always visible */}
        <button
          onClick={() => {
            if (!token || !userId) {
              toast.error("Please log in to view your announcements.");
              return;
            }
            setShowMyAnnouncements(!showMyAnnouncements); // Toggle
            setFilter("all"); // Reset type filter when toggling "My Announcements"
          }}
          className={`px-4 py-2 rounded-lg text-base font-medium transition-all duration-200 flex items-center justify-center space-x-2 w-full sm:w-auto ml-auto ${
            showMyAnnouncements // Active state for My Announcements
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900"
          }`}
        >
          <Users className="w-5 h-5" />
          <span>
            {showMyAnnouncements
              ? "Viewing My Announcements"
              : "Show My Announcements"}
          </span>
        </button>
      </div>

      {loading && (
        <div className="text-center py-16">
          <svg
            className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-xl font-medium text-gray-700">
            Loading announcements...
          </p>
        </div>
      )}

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md relative"
          role="alert"
        >
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Announcements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedAnnouncements.length > 0 ? (
              displayedAnnouncements.map((announcement) => (
                <div
                  key={announcement._id}
                  className="bg-white rounded-xl p-6 border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 relative group"
                >
                  {/* Edit/Delete Buttons for authorized users */}
                  {(userRole === "admin" ||
                    (userRole === "faculty" &&
                      announcement.createdBy === userId)) && (
                    <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleEditClick(announcement)}
                        className="text-gray-500 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 p-2 rounded-full transition-colors duration-200"
                        title="Edit Announcement"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteAnnouncement(announcement._id)
                        }
                        className="text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 p-2 rounded-full transition-colors duration-200"
                        title="Delete Announcement"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-2 pr-10">
                      {announcement.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getEventTypeColor(
                        announcement.type
                      )}`}
                    >
                      {announcement.type}
                    </span>
                  </div>

                  <p className="text-gray-700 text-base mb-4 line-clamp-3">
                    {announcement.description}
                  </p>

                  <div className="space-y-3 text-gray-600 text-sm">
                    {announcement.date && (
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-3 text-blue-600" />
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
                        <Clock className="w-4 h-4 mr-3 text-emerald-600" />
                        <span>Time: {announcement.time}</span>
                      </div>
                    )}

                    {announcement.location && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-3 text-purple-600" />
                        <span>Location: {announcement.location}</span>
                      </div>
                    )}

                    {(announcement.organizer || announcement.createdByRole) && (
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-3 text-orange-600" />
                        <span>
                          Organized by{" "}
                          {announcement.organizer || announcement.createdByRole}
                        </span>
                      </div>
                    )}
                    {announcement.tags?.audience && (
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-3 text-indigo-600" />
                        <span>Audience: {announcement.tags.audience}</span>
                      </div>
                    )}
                  </div>
                  {userRole === "student" && announcement.type === "Event" && (
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <button className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-2.5 rounded-lg font-medium hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 shadow-md">
                        Register for Event
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20">
                <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-700 mb-3">
                  No Announcements Found
                </h3>
                <p className="text-gray-500 text-lg">
                  {showMyAnnouncements
                    ? "You have not created any announcements yet. Create one to see it here!"
                    : "There are no announcements matching your current filter. Try adjusting your selection."}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create/Edit Announcement Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/60 text-black backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingAnnouncement
                ? "Edit Announcement"
                : "Create New Announcement"}
            </h2>
            <form className="space-y-5" onSubmit={handleCreateOrUpdateSubmit}>
              <div>
                <label
                  htmlFor="announcement-title"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="announcement-title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter announcement title"
                  value={formAnnouncement.title}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Announcement Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="type"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
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
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="announcement-date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={formAnnouncement.date}
                  onChange={handleFormChange}
                  required
                />
              </div>

              {formAnnouncement.type === "Event" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="announcement-time"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Time
                    </label>
                    <input
                      type="time"
                      id="announcement-time"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={formAnnouncement.time}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="announcement-location"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Location
                    </label>
                    <input
                      type="text"
                      id="announcement-location"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter location"
                      value={formAnnouncement.location}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="announcement-organizer"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Organizer (Optional)
                </label>
                <input
                  type="text"
                  id="announcement-organizer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., Tech Club, Dept. of CSE"
                  value={formAnnouncement.organizer}
                  onChange={handleFormChange}
                />
              </div>

              <div>
                <label
                  htmlFor="announcement-description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="announcement-description"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-y"
                  placeholder="Enter announcement description"
                  value={formAnnouncement.description}
                  onChange={handleFormChange}
                  required
                ></textarea>
              </div>

              <div>
                <label
                  htmlFor="announcement-audience"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Target Audience
                </label>
                <select
                  id="announcement-audience"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                  value={formAnnouncement.tags.audience}
                  onChange={handleFormChange}
                >
                  <option value="all">All</option>
                  <option value="students">Students</option>
                  <option value="faculty">Faculty</option>
                </select>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:from-blue-700 hover:to-emerald-700 transition-all duration-300 shadow-md"
                >
                  {editingAnnouncement
                    ? "Update Announcement"
                    : "Create Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventManagement;
