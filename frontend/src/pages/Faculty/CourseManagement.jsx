import React, { useState, useEffect, useCallback } from "react";
import {
  PlusCircle, // Nicer Plus icon for buttons
  X, // For the form close button
  BookOpen, // For "No Courses Found" icon
  Loader2, // For loading spinner
  // Removed other unused icons as per previous instructions
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import toast, { Toaster } from "react-hot-toast";
import { twMerge } from "tailwind-merge";
import { useNavigate } from "react-router-dom";
import CourseCard from "./CourseCard"; // Correct import for CourseCard

// --- Main CourseManagement Component ---
const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [userRole, setUserRole] = useState("student");
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

  const navigate = useNavigate();

  const [formCourse, setFormCourse] = useState({
    courseCode: "",
    courseName: "",
    department: "",
    year: "",
    description: "",
  });

  const [uniqueDepartments, setUniqueDepartments] = useState([]);
  const [uniqueYears, setUniqueYears] = useState([]);

  const resetForm = useCallback(() => {
    setFormCourse({
      courseCode: "",
      courseName: "",
      department: "",
      year: "",
      description: "",
    });
    setEditingCourse(null);
  }, []);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null); // Clear previous errors on new fetch attempt
    try {
      const response = await fetch(`${API_BASE_URL}/courses/faculty`, {
        method: "GET",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        // Handle specific unauthorized error without global toast if it's a known non-faculty access
        if (response.status === 403 || response.status === 401) {
          const errorMsg = "Access Denied: Only faculty can manage courses.";
          setError(errorMsg);
          toast.error(errorMsg);
          setCourses([]); // Clear courses if unauthorized
          return;
        }
        // For other HTTP errors, throw a generic error
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      const sortedData = data.sort((a, b) =>
        a.courseCode.localeCompare(b.courseCode)
      );

      setCourses(sortedData);

      const departments = [
        ...new Set(sortedData.map((c) => c.department).filter(Boolean)),
      ].sort();
      const years = [
        ...new Set(sortedData.map((c) => c.year).filter(Boolean)),
      ].sort((a, b) => a - b);

      setUniqueDepartments(departments);
      setUniqueYears(years);
    } catch (err) {
      console.error("Failed to fetch courses:", err);
      // Only set generic error if it's not already handled (e.g., 403)
      if (!error || !error.includes("Access Denied")) {
        setError(
          err.message || "Failed to load courses. Please try again later."
        );
        toast.error(err.message || "Failed to load courses.");
      }
      setCourses([]); // Clear courses on any fetch error
    } finally {
      setLoading(false);
    }
  }, [token, API_BASE_URL, error]); // Add error to dependency array if you conditionally set it within the callback

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
        console.error("Failed to decode JWT token:", error);
        localStorage.removeItem("token");
        setUserRole("student");
        toast.error("Authentication error. Please log in again.");
      }
    } else {
      setUserRole("student");
    }
  }, [token]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setFormCourse((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleCreateOrUpdateSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (userRole !== "faculty") {
      toast.error(
        "Permission Denied: Only faculty can create or update courses."
      );
      return;
    }

    const requiredFields = ["courseCode", "courseName", "department", "year"];
    for (const field of requiredFields) {
      if (!formCourse[field]) {
        toast.error(`Please fill in the '${field}' field.`);
        return;
      }
    }

    if (!token) {
      toast.error(
        "Authentication required to perform this action. Please log in."
      );
      return;
    }

    const payload = {
      ...formCourse,
      year: parseInt(formCourse.year),
    };

    try {
      let response;
      if (editingCourse) {
        response = await fetch(`${API_BASE_URL}/courses/${editingCourse._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`${API_BASE_URL}/courses`, {
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
            `Failed to ${editingCourse ? "update" : "create"} course: ${
              response.status
            }`
        );
      }

      await fetchCourses();
      resetForm();
      setShowCreateForm(false);
      toast.success(
        `Course ${editingCourse ? "updated" : "created"} successfully!`
      );
    } catch (err) {
      console.error(
        `Error ${editingCourse ? "updating" : "creating"} course:`,
        err
      );
      setError(err.message || "An error occurred.");
      toast.error(
        err.message ||
          `Failed to ${
            editingCourse ? "update" : "create"
          } course. Please try again.`
      );
    }
  };

  const handleEditCourseName = async (courseId) => {
    if (userRole !== "faculty") {
      toast.error("Permission Denied: Only faculty can edit course names.");
      return;
    }

    const courseToEdit = courses.find((c) => c._id === courseId);
    if (!courseToEdit) {
      toast.error("Course not found for editing.");
      return;
    }

    const newName = prompt("Enter new course name:", courseToEdit.courseName);
    if (!newName || newName === courseToEdit.courseName) {
      toast("No change made or cancelled.", { icon: "ℹ️" });
      return;
    }

    if (!token) {
      toast.error(
        "Authentication required to perform this action. Please log in."
      );
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseName: newName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to update course name: ${response.status}`
        );
      }
      await fetchCourses();
      toast.success("Course name updated successfully!");
    } catch (err) {
      console.error("Error updating course name:", err);
      setError(err.message || "An error occurred.");
      toast.error(err.message || "Failed to update course name.");
    }
  };

  const handleDeleteCourse = async (id) => {
    if (userRole !== "faculty") {
      toast.error("Permission Denied: Only faculty can delete courses.");
      return;
    }

    toast.custom(
      (t) => (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-xs sm:max-w-sm rounded-xl border border-[#0c4511] bg-[#0a130f] p-8 text-white shadow-2xl shadow-[#00FFA5]/10 relative animate-scale-in">
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
              Are you sure you want to delete this course?
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
                        `${API_BASE_URL}/courses/${id}`,
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
                            `Failed to delete course: ${response.status}`
                        );
                      }

                      setCourses((prevCourses) =>
                        prevCourses.filter((course) => course._id !== id)
                      );
                      toast.success("Course deleted successfully!");
                    } catch (err) {
                      console.error("Error deleting course:", err);
                      setError(err.message || "An error occurred.");
                      toast.error(
                        err.message ||
                          "Failed to delete course. Please try again."
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

  const handleSyncCourse = async (courseId) => {
    if (userRole !== "faculty") {
      toast.error("Permission Denied: Only faculty can sync courses.");
      return;
    }

    if (!token) {
      toast.error(
        "Authentication required to perform this action. Please log in."
      );
      return;
    }
    try {
      toast.loading("Syncing course data...", { id: "sync-course" });
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/sync`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to sync course: ${response.status}`
        );
      }
      await fetchCourses();
      toast.success("Course synced successfully!", { id: "sync-course" });
    } catch (err) {
      console.error("Error syncing course:", err);
      setError(err.message || "An error occurred.");
      toast.error(err.message || "Failed to sync course. Please try again.");
      toast.dismiss("sync-course");
    }
  };

  const handleFullEditClick = (course) => {
    if (userRole !== "faculty") {
      toast.error(
        "Permission Denied: Only faculty can edit full course details."
      );
      return;
    }
    setEditingCourse(course);
    setFormCourse({
      courseCode: course.courseCode,
      courseName: course.courseName,
      department: course.department,
      year: course.year,
      description: course.description || "",
    });
    setShowCreateForm(true);
  };

  const handleCloseForm = () => {
    resetForm();
    setShowCreateForm(false);
  };

  const handleViewCourseDetails = (courseId) => {
    const selectedCourse = courses.find((c) => c._id === courseId);
    if (selectedCourse) {
      navigate(`/courses/${courseId}`, { state: { course: selectedCourse } });
    } else {
      toast.error("Course details not found in current list.");
      console.error(
        "Attempted to navigate to course details for an unknown ID:",
        courseId
      );
      // Optional: Re-fetch the specific course here if it might not be in the current `courses` array
    }
  };

  const displayedCourses = courses
    .filter((course) => {
      if (
        filterDepartment !== "all" &&
        course.department !== filterDepartment
      ) {
        return false;
      }
      if (filterYear !== "all" && course.year !== parseInt(filterYear)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.department !== b.department) {
        return a.department.localeCompare(b.department);
      }
      if (a.year !== b.year) {
        return a.year - b.year;
      }
      return a.courseCode.localeCompare(b.courseCode);
    });

  const getDepartmentColor = (department) => {
    let hash = 0;
    for (let i = 0; i < department.length; i++) {
      hash = department.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Using colors consistent with the overall theme (dark background, bright text)
    const colors = [
      "text-purple-300 border-purple-700",
      "text-pink-300 border-pink-700",
      "text-yellow-300 border-yellow-700",
      "text-indigo-300 border-indigo-700",
      "text-teal-300 border-teal-700",
      "text-orange-300 border-orange-700",
      "text-red-300 border-red-700",
      "text-green-300 border-green-700",
      "text-cyan-300 border-cyan-700",
      "text-rose-300 border-rose-700",
    ];
    return colors[Math.abs(hash % colors.length)];
  };

  // Only show the main content once loading is done AND there's no fatal error
  const showContent = !loading && !error;
  const showErrorMessage = !loading && error;

  return (
    <div className="space-y-10 text-white font-sans overflow-hidden">
      <Toaster position="top-right" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-[#0c4511] gap-6">
        <div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-[#00FFA5] animate-gradient-shift">
            Course Catalog
          </h1>
          <p className="text-gray-400 mt-3 text-lg sm:text-xl max-w-2xl">
            Manage and view academic courses.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          {userRole === "faculty" && (
            <button
              onClick={() => {
                resetForm();
                setShowCreateForm(true);
              }}
              className="group relative inline-flex items-center justify-center p-0.5 overflow-hidden text-lg font-medium rounded-full bg-gradient-to-br from-[#00FFA5] to-blue-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-[#00FFA5]/30 shadow-xl hover:shadow-[#00FFA5]/50 transition-all duration-300 w-full sm:w-auto"
            >
              <span className="relative flex items-center justify-center px-8 py-3 transition-all ease-in duration-75 bg-[#0a130f] rounded-full group-hover:bg-opacity-0 text-white">
                <PlusCircle className="w-6 h-6 mr-3 -ml-1" />
                Add New Course
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#0a130f] rounded-2xl p-6 border border-[#0c4511] shadow-xl shadow-[#00FFA5]/10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <span className="text-gray-300 text-lg font-semibold mr-3 hidden sm:block">
            Filter Courses:
          </span>

          {/* Department Filter */}
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="w-full sm:w-auto px-5 py-3 border border-[#0c4511] rounded-xl bg-black text-white appearance-none pr-10 focus:ring-2 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors"
          >
            <option value="all">All Departments</option>
            {uniqueDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Year Filter */}
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="w-full sm:w-auto px-5 py-3 border border-[#0c4511] rounded-xl bg-black text-white appearance-none pr-10 focus:ring-2 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors"
          >
            <option value="all">All Years</option>
            {uniqueYears.map((year) => (
              <option key={year} value={year}>
                Year {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Conditional Rendering for Loading, Error, and Content */}
      {loading && (
        <div className="text-center py-20 bg-[#0a130f] rounded-2xl shadow-xl shadow-[#00FFA5]/10 p-6 border border-[#0c4511]">
          <Loader2 className="animate-spin h-16 w-16 text-[#00FFA5] mx-auto mb-6 filter drop-shadow-[0_0_8px_rgba(0,255,165,0.4)]" />
          <p className="mt-4 text-2xl font-bold text-gray-300">
            Scanning course database...
          </p>
          <p className="text-gray-400 mt-2 text-lg">
            Please wait while we compile the course catalog.
          </p>
        </div>
      )}

      {showErrorMessage && (
        <div className="text-center py-20 bg-red-950 rounded-2xl border border-red-700 shadow-xl p-6">
          <X className="w-20 h-20 text-red-400 mx-auto mb-6 filter drop-shadow-[0_0_8px_rgba(255,0,0,0.4)]" />
          <h3 className="text-3xl font-bold text-red-700 mb-3">
            System Alert! Access Interrupted.
          </h3>
          <p className="text-red-400 text-xl">
            {error}. Verify your credentials or contact support.
          </p>
        </div>
      )}

      {showContent && !showErrorMessage && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {displayedCourses.length > 0 ? (
              displayedCourses.map((course) => (
                <CourseCard
                  key={course._id}
                  course={course}
                  userRole={userRole}
                  userId={userId}
                  handleFullEditClick={handleFullEditClick}
                  handleEditCourseName={handleEditCourseName}
                  handleSyncCourse={handleSyncCourse}
                  handleDeleteCourse={handleDeleteCourse}
                  getDepartmentColor={getDepartmentColor} // Pass the same function to CourseCard
                  onViewDetails={handleViewCourseDetails}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-[#0a130f] rounded-2xl shadow-xl shadow-[#00FFA5]/10 p-6 border border-[#0c4511]">
                <BookOpen className="w-28 h-28 text-gray-600 mx-auto mb-8 filter drop-shadow-[0_0_8px_rgba(0,255,165,0.2)]" />
                <h3 className="text-3xl font-bold text-gray-300 mb-4">
                  No Courses Found
                </h3>
                <p className="text-gray-400 text-xl">
                  No courses match your current filters. Adjust your parameters
                  or initialize a new course record.
                </p>
                {(filterDepartment !== "all" || filterYear !== "all") && (
                  <button
                    onClick={() => {
                      setFilterDepartment("all");
                      setFilterYear("all");
                    }}
                    className="mt-8 text-[#00FFA5] hover:text-cyan-300 font-semibold text-lg transition-colors"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {showCreateForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-[100] animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl p-6 sm:p-10 shadow-2xl shadow-[#00FFA5]/10 relative animate-scale-in border border-[#0c4511] bg-[#0a130f] overflow-y-auto max-h-[90vh]">
            <button
              onClick={handleCloseForm}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-3 rounded-full hover:bg-[#1a2e20] transition-colors shadow-lg"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-[#00FFA5] mb-8 text-center">
              {editingCourse
                ? "Recalibrate Course Data"
                : "Initialize New Course"}
            </h2>
            <form className="space-y-6" onSubmit={handleCreateOrUpdateSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="courseCode"
                    className="block text-sm font-semibold text-gray-300 mb-1"
                  >
                    Course Code <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="courseCode"
                    className="w-full px-5 py-3 border border-[#0c4511] rounded-xl bg-black text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors disabled:bg-gray-950 disabled:cursor-not-allowed"
                    placeholder="e.g., QNTM404"
                    value={formCourse.courseCode}
                    onChange={handleFormChange}
                    required
                    disabled={!!editingCourse} // Disable editing course code if updating
                  />
                </div>
                <div>
                  <label
                    htmlFor="courseName"
                    className="block text-sm font-semibold text-gray-300 mb-1"
                  >
                    Course Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="courseName"
                    className="w-full px-5 py-3 border border-[#0c4511] rounded-xl bg-black text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors disabled:bg-gray-950 disabled:cursor-not-allowed"
                    placeholder="e.g., Advanced Quantum Algorithms"
                    value={formCourse.courseName}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="department"
                    className="block text-sm font-semibold text-gray-300 mb-1"
                  >
                    Department <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="department"
                    className="w-full px-5 py-3 border border-[#0c4511] rounded-xl bg-black text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors disabled:bg-gray-950 disabled:cursor-not-allowed"
                    placeholder="e.g., Quantum Computing"
                    value={formCourse.department}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="year"
                    className="block text-sm font-semibold text-gray-300 mb-1"
                  >
                    Year <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    id="year"
                    className="w-full px-5 py-3 border border-[#0c4511] rounded-xl bg-black text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors disabled:bg-gray-950 disabled:cursor-not-allowed"
                    placeholder="e.g., 4"
                    value={formCourse.year}
                    onChange={handleFormChange}
                    required
                    min="1"
                    max="4"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold text-gray-300 mb-1"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  rows="3"
                  className="w-full px-5 py-3 border border-[#0c4511] rounded-xl bg-black text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors resize-y disabled:bg-gray-950 disabled:cursor-not-allowed"
                  placeholder="e.g., This course explores the foundational principles of quantum computing..."
                  value={formCourse.description}
                  onChange={handleFormChange}
                ></textarea>
              </div>

              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 pt-6">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-8 py-3 border border-[#0c4511] text-gray-300 rounded-xl font-medium hover:bg-[#1a2e20] transition-colors duration-200 shadow-md transform hover:scale-105"
                >
                  Cancel Operation
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-[#00FFA5] text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-[#00FFA5] transition-all duration-300 shadow-lg transform hover:scale-105"
                >
                  {editingCourse ? "Update Course Data" : "Deploy New Course"}
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

export default CourseManagement;
