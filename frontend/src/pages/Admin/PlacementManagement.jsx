import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  X,
  FileText,
  Briefcase,
  Calendar,
  DollarSign,
  MapPin,
  Building2,
  GraduationCap,
  Mail,
  Download,
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import toast, { Toaster } from "react-hot-toast";
import { twMerge } from "tailwind-merge";

/**
 * @typedef {Object} Placement
 * @property {string} _id - Unique identifier for the placement record
 * @property {string} studentId - e.g., "ECE-25-1735"
 * @property {string} email - Student's email
 * @property {string} name - Student's name
 * @property {string} department - e.g., "ECE", "CSE"
 * @property {number} batchYear - e.g., 2023, 2024
 * @property {string} company - Company name
 * @property {string} role - Role offered, e.g., "SDE Intern", "Data Analyst"
 * @property {number} package - Package in LPA (Lakhs Per Annum)
 * @property {string} type - 'internship' | 'fulltime'
 * @property {string} driveDate - Date of the drive (YYYY-MM-DD format)
 * @property {string} location - Job location
 * @property {string} createdBy - User ID who created the record
 * @property {string} createdByRole - Role of the user who created it (e.g., 'admin', 'faculty')
 * @property {string} createdAt - Timestamp of creation
 * @property {string} updatedAt - Timestamp of last update
 */

const PlacementManagement = () => {
  const [placements, setPlacements] = useState([]);
  const [filterType, setFilterType] = useState("all"); // 'all', 'internship', 'fulltime'
  const [filterBatchYear, setFilterBatchYear] = useState("all"); // 'all' or a specific year
  const [filterDepartment, setFilterDepartment] = useState("all"); // 'all' or a specific department
  // Removed: [showMyPlacements, setShowMyPlacements] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlacement, setEditingPlacement] = useState(null);
  const [userRole, setUserRole] = useState("student");
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");
  const API_BASE_URL = "http://localhost:5000/api";

  const [formPlacement, setFormPlacement] = useState({
    studentId: "",
    email: "",
    name: "",
    department: "", // Default to empty or a common one
    batchYear: "",
    company: "",
    role: "",
    package: "", // Number input
    type: "fulltime", // Default to 'fulltime'
    driveDate: "",
    location: "",
  });

  // Unique values for filters (for dropdowns)
  const [uniqueDepartments, setUniqueDepartments] = useState([]);
  const [uniqueBatchYears, setUniqueBatchYears] = useState([]);

  // Function to reset the form
  const resetForm = useCallback(() => {
    setFormPlacement({
      studentId: "",
      email: "",
      name: "",
      department: "",
      batchYear: "",
      company: "",
      role: "",
      package: "",
      type: "fulltime",
      driveDate: "",
      location: "",
    });
    setEditingPlacement(null);
  }, []);

  // Function to fetch placement records - MODIFIED
  const fetchPlacements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Always fetch all placements
      const endpoint = `${API_BASE_URL}/placements`;

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        // Removed specific 401/403 message for 'my' placements
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      const processedData = data.map((item) => ({
        ...item,
        driveDate: item.driveDate ? item.driveDate.split("T")[0] : "", // Format date for input
      }));

      // Sort by driveDate (latest first)
      const sortedData = processedData.sort(
        (a, b) => new Date(b.driveDate) - new Date(a.driveDate)
      );

      setPlacements(sortedData);

      // Extract unique departments and batch years for filters
      const departments = [
        ...new Set(sortedData.map((p) => p.department).filter(Boolean)),
      ].sort();
      const batchYears = [
        ...new Set(sortedData.map((p) => p.batchYear).filter(Boolean)),
      ].sort((a, b) => b - a); // Sort descending

      setUniqueDepartments(departments);
      setUniqueBatchYears(batchYears);
    } catch (err) {
      console.error("Failed to fetch placements:", err);
      setError(
        err.message || "Failed to load placements. Please try again later."
      );
      toast.error(err.message || "Failed to load placements.");
      // No need to clear placements based on showMyPlacements anymore
    } finally {
      setLoading(false);
    }
  }, [token, API_BASE_URL]); // showMyPlacements is removed from dependencies

  // Effect to decode token and set user role/ID
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
      }
    }
  }, [token]);

  // Effect to trigger initial fetch
  useEffect(() => {
    fetchPlacements();
  }, [fetchPlacements]);

  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setFormPlacement((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleCreateOrUpdateSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    const requiredFields = [
      "studentId",
      "email",
      "name",
      "department",
      "batchYear",
      "company",
      "role",
      "package",
      "type",
      "driveDate",
      "location",
    ];
    for (const field of requiredFields) {
      if (!formPlacement[field]) {
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
      ...formPlacement,
      package: parseFloat(formPlacement.package), // Ensure package is a number
      batchYear: parseInt(formPlacement.batchYear), // Ensure batchYear is a number
    };

    try {
      let response;
      if (editingPlacement) {
        response = await fetch(
          `${API_BASE_URL}/placements/${editingPlacement._id}`,
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
        response = await fetch(`${API_BASE_URL}/placements`, {
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
              editingPlacement ? "update" : "create"
            } placement record: ${response.status}`
        );
      }

      await fetchPlacements(); // Re-fetch all records
      resetForm();
      setShowCreateForm(false);
      toast.success(
        `Placement record ${
          editingPlacement ? "updated" : "created"
        } successfully!`
      );
    } catch (err) {
      console.error(
        `Error ${editingPlacement ? "updating" : "creating"} placement record:`,
        err
      );
      setError(err.message || "An error occurred.");
      toast.error(
        err.message ||
          `Failed to ${
            editingPlacement ? "update" : "create"
          } placement record. Please try again.`
      );
    }
  };

  const handleDeletePlacement = async (id) => {
    toast.custom(
      (t) => (
        <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center border border-gray-200">
          <p className="text-gray-800 text-lg mb-4">
            Are you sure you want to delete this placement record?
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
                      `${API_BASE_URL}/placements/${id}`,
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
                          `Failed to delete placement: ${response.status}`
                      );
                    }

                    await fetchPlacements();
                    toast.success("Placement record deleted successfully!");
                  } catch (err) {
                    console.error("Error deleting placement:", err);
                    setError(err.message || "An error occurred.");
                    toast.error(
                      err.message ||
                        "Failed to delete placement. Please try again."
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

  const handleEditClick = (placement) => {
    setEditingPlacement(placement);
    setFormPlacement({
      studentId: placement.studentId,
      email: placement.email,
      name: placement.name,
      department: placement.department,
      batchYear: placement.batchYear,
      company: placement.company,
      role: placement.role,
      package: placement.package,
      type: placement.type,
      driveDate: placement.driveDate,
      location: placement.location,
    });
    setShowCreateForm(true);
  };

  const handleCloseForm = () => {
    resetForm();
    setShowCreateForm(false);
  };

  const handleExportExcel = async () => {
    try {
      toast.loading("Generating file...", { id: "excelExport" });
      const response = await fetch(`${API_BASE_URL}/placements/export`, {
        method: "GET",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to export: ${response.status} - ${errorText}`);
      }

      // Get filename from Content-Disposition header if available, but force .csv
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "placements_data.csv"; // Default to .csv
      if (contentDisposition) {
        const matches = /filename="([^"]*)"/.exec(contentDisposition);
        if (matches && matches[1]) {
          // Keep the base name but ensure .csv extension
          filename = matches[1].split(".")[0] + ".csv";
        }
      }

      // Create a Blob from the response and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url); // Clean up

      toast.success("CSV file downloaded successfully!", {
        id: "excelExport",
      });
    } catch (err) {
      console.error("Error exporting file:", err);
      toast.error(err.message || "Failed to export file.", {
        id: "excelExport",
      });
    }
  };

  // Filter and sort placements for display
  const displayedPlacements = placements
    .filter((placement) => {
      // Apply type filter
      if (filterType !== "all" && placement.type !== filterType) {
        return false;
      }
      // Apply batch year filter
      if (
        filterBatchYear !== "all" &&
        placement.batchYear !== parseInt(filterBatchYear)
      ) {
        return false;
      }
      // Apply department filter
      if (
        filterDepartment !== "all" &&
        placement.department !== filterDepartment
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.driveDate) - new Date(a.driveDate)); // Always sort by latest drive date

  const getPlacementTypeColor = (type) => {
    switch (type) {
      case "internship":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "fulltime":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getDepartmentColor = (department) => {
    // A simple hash-based color generator for diversity
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
    ];
    return colors[Math.abs(hash % colors.length)];
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-gray-50 min-h-screen font-sans">
      <Toaster position="top-right" />
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
            Placement Records
          </h1>
          <p className="text-gray-600 mt-2 text-base sm:text-lg">
            Manage and view student placement details.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {(userRole === "admin" || userRole === "faculty") && (
            <button
              onClick={() => {
                resetForm();
                setShowCreateForm(true);
              }}
              className="group relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-gray-900 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 group-hover:from-purple-600 group-hover:to-blue-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 w-full sm:w-auto"
            >
              <span className="relative flex items-center justify-center px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0 text-lg">
                <Plus className="w-5 h-5 mr-2" />
                Add New Record
              </span>
            </button>
          )}
          {(userRole === "admin" || userRole === "faculty") && (
            <button
              onClick={handleExportExcel}
              className="group relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-gray-900 rounded-lg bg-gradient-to-br from-green-400 to-teal-500 group-hover:from-green-400 group-hover:to-teal-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 w-full sm:w-auto"
            >
              <span className="relative flex items-center justify-center px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0 text-lg">
                <Download className="w-5 h-5 mr-2" />
                Export to Excel
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-gray-600 text-lg font-semibold">Filters:</span>
          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900 shadow-sm"
          >
            <option value="all">All Types</option>
            <option value="internship">Internship</option>
            <option value="fulltime">Full-time</option>
          </select>

          {/* Batch Year Filter */}
          <select
            value={filterBatchYear}
            onChange={(e) => setFilterBatchYear(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900 shadow-sm"
          >
            <option value="all">All Batch Years</option>
            {uniqueBatchYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

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
        </div>
        {/* Removed "My Placements" Button */}
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
            Loading placement records...
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
          {/* Placements Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedPlacements.length > 0 ? (
              displayedPlacements.map((placement) => (
                <div
                  key={placement._id}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 relative group transform hover:-translate-y-1"
                >
                  {/* Edit/Delete Buttons for authorized users */}
                  {(userRole === "admin" ||
                    (userRole === "faculty" &&
                      placement.createdBy === userId)) && (
                    <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleEditClick(placement)}
                        className="text-gray-500 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 p-2 rounded-full transition-colors duration-200 shadow-sm"
                        title="Edit Placement"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeletePlacement(placement._id)}
                        className="text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 p-2 rounded-full transition-colors duration-200 shadow-sm"
                        title="Delete Placement"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-extrabold text-gray-900 line-clamp-2 pr-10">
                      {placement.name}
                      <span className="block text-sm font-medium text-gray-500 mt-1">
                        ({placement.studentId})
                      </span>
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPlacementTypeColor(
                        placement.type
                      )}`}
                    >
                      {placement.type.charAt(0).toUpperCase() +
                        placement.type.slice(1)}
                    </span>
                  </div>

                  <div className="space-y-3 text-gray-700 text-sm">
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 mr-3 text-indigo-600" />
                      <span>
                        <span className="font-semibold">Company:</span>{" "}
                        {placement.company}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Briefcase className="w-4 h-4 mr-3 text-blue-600" />
                      <span>
                        <span className="font-semibold">Role:</span>{" "}
                        {placement.role}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-3 text-green-600" />
                      <span>
                        <span className="font-semibold">Package:</span> ₹
                        {placement.package} LPA
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-3 text-purple-600" />
                      <span>
                        <span className="font-semibold">Drive Date:</span>{" "}
                        {new Date(placement.driveDate).toLocaleDateString(
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
                      <MapPin className="w-4 h-4 mr-3 text-orange-600" />
                      <span>
                        <span className="font-semibold">Location:</span>{" "}
                        {placement.location}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <GraduationCap className="w-4 h-4 mr-3 text-teal-600" />
                      <span>
                        <span className="font-semibold">Batch Year:</span>{" "}
                        {placement.batchYear}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-3 text-pink-600" />
                      <span>
                        <span className="font-semibold">Department:</span>{" "}
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDepartmentColor(
                            placement.department
                          )}`}
                        >
                          {placement.department}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-3 text-red-600" />
                      <span>
                        <span className="font-semibold">Email:</span>{" "}
                        {placement.email}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-white rounded-xl shadow-md p-6">
                <FileText className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-700 mb-3">
                  No Placement Records Found
                </h3>
                <p className="text-gray-500 text-lg">
                  There are no placement records matching your current filters.
                  Try adjusting your selection or adding a new record.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create/Edit Placement Modal */}
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
              {editingPlacement
                ? "Edit Placement Record"
                : "Add New Placement Record"}
            </h2>
            <form className="space-y-5" onSubmit={handleCreateOrUpdateSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Student Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400"
                    placeholder="e.g., Jane Doe"
                    value={formPlacement.name}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="studentId"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Student ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="studentId"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400"
                    placeholder="e.g., ECE-25-1735"
                    value={formPlacement.studentId}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400"
                  placeholder="e.g., student@example.com"
                  value={formPlacement.email}
                  onChange={handleFormChange}
                  required
                />
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
                    placeholder="e.g., CSE, ECE, ME"
                    value={formPlacement.department}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="batchYear"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Batch Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="batchYear"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400"
                    placeholder="e.g., 2023"
                    value={formPlacement.batchYear}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="company"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Company <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="company"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400"
                  placeholder="e.g., Google, Amazon"
                  value={formPlacement.company}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Role <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="role"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400"
                    placeholder="e.g., SDE Intern, Data Analyst"
                    value={formPlacement.role}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="package"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Package (LPA) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="package"
                    step="0.1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400"
                    placeholder="e.g., 8.5"
                    value={formPlacement.package}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="type"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Placement Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="type"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900"
                    value={formPlacement.type}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="fulltime">Full-time</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="driveDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Drive Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="driveDate"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                    value={formPlacement.driveDate}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="location"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400"
                  placeholder="e.g., Hyderabad, Bangalore"
                  value={formPlacement.location}
                  onChange={handleFormChange}
                  required
                />
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
                  {editingPlacement ? "Update Record" : "Add Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementManagement;
