import React, { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Users, Plus, Filter } from "lucide-react";
import { jwtDecode } from "jwt-decode"; // Import the jwtDecode function

// Dummy Event type for demonstration purposes
/**
 * @typedef {Object} Event
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} date
 * @property {string} time
 * @property {string} location
 * @property {string} organizer
 * @property {'workshop' | 'seminar' | 'exam' | 'holiday' | 'placement' | 'other'} type
 */

// Dummy Data
const dummyEvents = [
  {
    id: "1",
    title: "Web Development Workshop: React Basics",
    description:
      "An introductory workshop to learn the fundamentals of React.js, including components, props, state, and hooks.",
    date: "2025-07-20",
    time: "10:00 AM",
    location: "Computer Science Lab 301",
    organizer: "Tech Club",
    type: "workshop",
  },
  {
    id: "2",
    title: "Annual Research Seminar: AI in Healthcare",
    description:
      "A seminar featuring leading researchers discussing the latest advancements and applications of Artificial Intelligence in the healthcare sector.",
    date: "2025-08-15",
    time: "02:00 PM",
    location: "Auditorium A",
    organizer: "Research Department",
    type: "seminar",
  },
  {
    id: "3",
    title: "Mid-Term Examinations: Calculus I",
    description:
      "Mandatory mid-term examination for students enrolled in Calculus I. Please bring your student ID.",
    date: "2025-07-05",
    time: "09:00 AM",
    location: "Main Exam Hall",
    organizer: "Mathematics Department",
    type: "exam",
  },
  {
    id: "4",
    title: "University Holiday: Founder's Day",
    description:
      "A university-wide holiday celebrating Founder's Day. All classes and administrative offices will be closed.",
    date: "2025-09-01",
    time: "All Day",
    location: "Campus-wide",
    organizer: "University Administration",
    type: "holiday",
  },
  {
    id: "5",
    title: "Placement Drive: Software Engineer Roles",
    description:
      "An exclusive placement drive for final-year computer science students with multiple tech companies offering software engineer positions.",
    date: "2025-10-10",
    time: "09:30 AM",
    location: "Placement Cell Office",
    organizer: "Placement Office",
    type: "placement",
  },
  {
    id: "6",
    title: "Cybersecurity Seminar: Protecting Your Digital Footprint",
    description:
      "Learn essential tips and best practices for cybersecurity in the digital age. Open to all students and faculty.",
    date: "2025-08-22",
    time: "03:30 PM",
    location: "Conference Room 1",
    organizer: "Cyber Club",
    type: "seminar",
  },
  {
    id: "7",
    title: "Physics Lab Session: Quantum Mechanics",
    description:
      "Hands-on lab session for advanced physics students focusing on experimental aspects of quantum mechanics.",
    date: "2025-07-28",
    time: "01:00 PM",
    location: "Physics Lab 204",
    organizer: "Physics Department",
    type: "workshop",
  },
  {
    id: "8",
    title: "Final Exam: Data Structures and Algorithms",
    description:
      "Comprehensive final examination for the Data Structures and Algorithms course.",
    date: "2025-12-10",
    time: "10:00 AM",
    location: "Main Exam Hall",
    organizer: "Computer Science Department",
    type: "exam",
  },
];

const EventManagement = ({
  events = dummyEvents, // Use dummyEvents as default if no events are passed
  // userRole prop is no longer strictly needed if fetching from local storage
}) => {
  const [filter, setFilter] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [userRole, setUserRole] = useState("student"); // Default to 'student' initially

  // useEffect to read the token and set the user role on component mount
  useEffect(() => {
    const token = localStorage.getItem("token"); // Replace 'authToken' with your actual token key

    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        // Assuming your token payload has a 'role' property
        // Adjust 'role' if your token uses a different property name (e.g., 'userRole', 'permissions')
        const role = decodedToken.role;

        if (role) {
          setUserRole(role);
        } else {
          console.warn('JWT token found but no "role" property in payload.');
        }
      } catch (error) {
        console.error("Failed to decode JWT token from local storage:", error);
        // Optionally, clear invalid token from local storage here
        // localStorage.removeItem('authToken');
      }
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  const filteredEvents = events.filter((event) => {
    if (filter === "all") return true;
    return event.type === filter;
  });

  const getEventTypeColor = (type) => {
    switch (type) {
      case "workshop":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "seminar":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "exam":
        return "bg-red-100 text-red-800 border-red-200";
      case "holiday":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "placement":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-2">
            Manage and view campus events and activities.
          </p>
        </div>
        {(userRole === "admin" || userRole === "faculty") && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 border border-white/20 shadow-lg">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <div className="flex space-x-2">
            {["all", "workshop", "seminar", "exam", "holiday", "placement"].map(
              (type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                    filter === type
                      ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                {event.title}
              </h3>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(
                  event.type
                )}`}
              >
                {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
              </span>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {event.description}
            </p>

            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                <span>{new Date(event.date).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2 text-emerald-600" />
                <span>{event.time}</span>
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2 text-purple-600" />
                <span>{event.location}</span>
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-2 text-orange-600" />
                <span>Organized by {event.organizer}</span>
              </div>
            </div>
            {userRole === "student" ? (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-2 rounded-lg font-medium hover:from-blue-700 hover:to-emerald-700 transition-all duration-200">
                  Register
                </button>
              </div>
            ) : (
              ""
            )}
          </div>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No events found
          </h3>
          <p className="text-gray-600">
            There are no events matching your current filter.
          </p>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Create New Event
            </h2>
            <form className="space-y-4">
              <div>
                <label
                  htmlFor="event-title"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Event Title
                </label>
                <input
                  type="text"
                  id="event-title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter event title"
                />
              </div>

              <div>
                <label
                  htmlFor="event-type"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Event Type
                </label>
                <select
                  id="event-type"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="workshop">Workshop</option>
                  <option value="seminar">Seminar</option>
                  <option value="exam">Exam</option>
                  <option value="holiday">Holiday</option>
                  <option value="placement">Placement</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="event-date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Date
                  </label>
                  <input
                    type="date"
                    id="event-date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="event-time"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Time
                  </label>
                  <input
                    type="time"
                    id="event-time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="event-location"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Location
                </label>
                <input
                  type="text"
                  id="event-location"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter location"
                />
              </div>

              <div>
                <label
                  htmlFor="event-description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="event-description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter event description"
                ></textarea>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-2 rounded-lg font-medium hover:from-blue-700 hover:to-emerald-700 transition-all duration-200"
                >
                  Create Event
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
