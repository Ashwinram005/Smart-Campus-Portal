import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  // No need for Edit, Trash2, X, BookOpen, Building, Calendar, Layers, Repeat, Download here
  // as they are used only in CourseCard (now a separate component)
  // and in the form (where X is used).
  // Keep only the icons specifically used directly within CourseManagement, like Plus for "Add New Course".
  X, // Keep X for the form close button
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import toast, { Toaster } from "react-hot-toast";
import { twMerge } from "tailwind-merge";
import { useNavigate } from "react-router-dom";
import CourseCard from "./CourseCard"; // <--- Correct import for CourseCard

// Removed the Course typedef and CourseCard definition from here.
// They are now in CourseCard.js

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
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/courses/faculty`, {
        method: "GET",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          setError("Access Denied: Only faculty can view these records.");
          setCourses([]);
          toast.error(
            "Access Denied: You do not have permission to view faculty courses."
          );
          return;
        }
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
      if (!error) {
        setError(
          err.message || "Failed to load courses. Please try again later."
        );
        toast.error(err.message || "Failed to load courses.");
      }
    } finally {
      setLoading(false);
    }
  }, [token, API_BASE_URL, error]);

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
          setUserRole("student");
        }
      } catch (error) {
        console.error("Failed to decode JWT token:", error);
        localStorage.removeItem("token");
        setUserRole("student");
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
        <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center border border-gray-200">
          <p className="text-gray-800 text-lg mb-4">
            Are you sure you want to delete this course?
          </p>
          <div className="flex space-x-4">
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
      toast.success("Course synced successfully!");
    } catch (err) {
      console.error("Error syncing course:", err);
      setError(err.message || "An error occurred.");
      toast.error(err.message || "Failed to sync course. Please try again.");
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
    // Find the full course object from your current 'courses' state
    const selectedCourse = courses.find((c) => c._id === courseId);

    if (selectedCourse) {
      navigate(`/courses/${courseId}`, { state: { course: selectedCourse } });
    } else {
      toast.error("Course details not found in current list.");
      console.error(
        "Attempted to navigate to course details for an unknown ID:",
        courseId
      );
      // You might still want to try fetching it if it's not in the list (e.g., filtered out)
      // but for now, we'll assume it's always in 'courses' if displayed.
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
    const colors = [
      "bg-purple-100 text-purple-800",
      "bg-pink-100 text-pink-800",
      "bg-yellow-100 text-yellow-800",
      "bg-indigo-100 text-indigo-800",
      "bg-teal-100 text-teal-800",
      "bg-orange-100 text-orange-800",
      "bg-red-100 text-red-800",
      "bg-green-100 text-green-800",
    ];
    return colors[Math.abs(hash % colors.length)];
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-gray-50 min-h-screen font-sans">
      <Toaster position="top-right" />
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
            Course Catalog
          </h1>
          <p className="text-gray-600 mt-2 text-base sm:text-lg">
            Manage and view academic courses.
          </p>
          {!loading && error && (
            <p className="text-red-600 mt-2 text-base font-semibold">{error}</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {userRole === "faculty" && (
            <button
              onClick={() => {
                resetForm();
                setShowCreateForm(true);
              }}
              className="group relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-gray-900 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 group-hover:from-purple-600 group-hover:to-blue-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 w-full sm:w-auto"
            >
              <span className="relative flex items-center justify-center px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0 text-lg">
                <Plus className="w-5 h-5 mr-2" />
                Add New Course
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-gray-600 text-lg font-semibold">Filters:</span>

          {/* Department Filter */}
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900 shadow-sm"
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
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900 shadow-sm"
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

      {loading && (
        <div className="text-center py-16">
          <svg
            className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4"
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
            Loading course catalog...
          </p>
        </div>
      )}

      {!loading && !error ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                  getDepartmentColor={getDepartmentColor}
                  onViewDetails={handleViewCourseDetails}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-white rounded-xl shadow-md p-6">
                <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-700 mb-3">
                  No Courses Found
                </h3>
                <p className="text-gray-500 text-lg">
                  There are no courses matching your current filters. Try
                  adjusting your selection or adding a new course.
                </p>
              </div>
            )}
          </div>
        </>
      ) : !loading && error ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-md p-6">
          <X className="w-20 h-20 text-red-400 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-red-700 mb-3">
            Error Loading Courses
          </h3>
          <p className="text-gray-500 text-lg">
            {error}. Please ensure you have the correct permissions and are
            logged in.
          </p>
        </div>
      ) : null}

      {showCreateForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-[100]">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative animate-fade-in-up overflow-y-auto max-h-[90vh]">
            <button
              onClick={handleCloseForm}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">
              {editingCourse ? "Edit Course Details" : "Add New Course"}
            </h2>
            <form className="space-y-5" onSubmit={handleCreateOrUpdateSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="courseCode"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Course Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="courseCode"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400"
                    placeholder="e.g., CSE301"
                    value={formCourse.courseCode}
                    onChange={handleFormChange}
                    required
                    disabled={!!editingCourse}
                  />
                </div>
                <div>
                  <label
                    htmlFor="courseName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Course Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="courseName"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400"
                    placeholder="e.g., Database Management Systems"
                    value={formCourse.courseName}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="department"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="department"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400"
                    placeholder="e.g., CSE, ECE"
                    value={formCourse.department}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="year"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="year"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400"
                    placeholder="e.g., 3"
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
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400 resize-y"
                  placeholder="e.g., This course covers relational database theory, SQL, and database design..."
                  value={formCourse.description}
                  onChange={handleFormChange}
                ></textarea>
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 shadow-sm transform hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:from-blue-700 hover:to-emerald-700 transition-all duration-300 shadow-md transform hover:scale-105"
                >
                  {editingCourse ? "Update Course" : "Add Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;
