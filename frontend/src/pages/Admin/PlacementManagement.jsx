import React, { useState, useEffect, useCallback } from "react";
import {
  PlusCircle, // Nicer Plus icon
  Edit,
  Trash2,
  X, // Close icon for modals
  FileText, // General document/record icon
  Briefcase, // Role icon
  CalendarDays, // Date icon
  DollarSign, // Package icon
  MapPin, // Location icon
  Building2, // Company icon
  GraduationCap, // Department / Batch Year icon
  Mail, // Email icon
  Download, // Download icon
  Eye, // For filters if needed, similar to EventManagement
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
  const [filterType, setFilterType] = useState("all");
  const [filterBatchYear, setFilterBatchYear] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlacement, setEditingPlacement] = useState(null);
  const [userRole, setUserRole] = useState("student");
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

  const [formPlacement, setFormPlacement] = useState({
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

  const [uniqueDepartments, setUniqueDepartments] = useState([]);
  const [uniqueBatchYears, setUniqueBatchYears] = useState([]);

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

  const fetchPlacements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = `${API_BASE_URL}/placements`;
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      const processedData = data.map((item) => ({
        ...item,
        driveDate: item.driveDate ? item.driveDate.split("T")[0] : "",
      }));

      const sortedData = processedData.sort(
        (a, b) => new Date(b.driveDate) - new Date(a.driveDate)
      );

      setPlacements(sortedData);

      const departments = [
        ...new Set(sortedData.map((p) => p.department).filter(Boolean)),
      ].sort();
      const batchYears = [
        ...new Set(sortedData.map((p) => p.batchYear).filter(Boolean)),
      ].sort((a, b) => b - a);

      setUniqueDepartments(departments);
      setUniqueBatchYears(batchYears);
    } catch (err) {
      console.error("Failed to fetch placements:", err);
      setError(
        err.message || "Failed to load placements. Please try again later."
      );
      toast.error(err.message || "Failed to load placements.");
    } finally {
      setLoading(false);
    }
  }, [token, API_BASE_URL]);

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
      package: parseFloat(formPlacement.package),
      batchYear: parseInt(formPlacement.batchYear),
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

      await fetchPlacements();
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
              Are you sure you want to delete this record? This action cannot be
              undone.
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
      toast.loading("Generating data stream...", { id: "excelExport" }); // Updated text
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

      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "placements_data.csv";
      if (contentDisposition) {
        const matches = /filename="([^"]*)"/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1].split(".")[0] + ".csv";
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

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

  const displayedPlacements = placements
    .filter((placement) => {
      if (filterType !== "all" && placement.type !== filterType) {
        return false;
      }
      if (
        filterBatchYear !== "all" &&
        placement.batchYear !== parseInt(filterBatchYear)
      ) {
        return false;
      }
      if (
        filterDepartment !== "all" &&
        placement.department !== filterDepartment
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.driveDate) - new Date(a.driveDate));

  const getPlacementTypeColor = (type) => {
    switch (type) {
      case "internship":
        return {
          bg: "bg-[#0a130f]",
          border: "border-blue-700",
          iconColor: "text-blue-400",
          textColor: "text-blue-300",
        };
      case "fulltime":
        return {
          bg: "bg-[#0a130f]",
          border: "border-emerald-700",
          iconColor: "text-emerald-400",
          textColor: "text-emerald-300",
        };
      default:
        return {
          bg: "bg-[#0a130f]",
          border: "border-gray-700",
          iconColor: "text-gray-400",
          textColor: "text-gray-300",
        };
    }
  };

  const getDepartmentColor = (department) => {
    let hash = 0;
    for (let i = 0; i < department.length; i++) {
      hash = department.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      "text-purple-300 border-purple-700",
      "text-pink-300 border-pink-700",
      "text-yellow-300 border-yellow-700",
      "text-indigo-300 border-indigo-700",
      "text-teal-300 border-teal-700",
      "text-orange-300 border-orange-700",
    ];
    return colors[Math.abs(hash % colors.length)];
  };

  return (
    <div className="space-y-10 text-white font-sans overflow-hidden">
      <Toaster position="top-right" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-[#0c4511] gap-6">
        <div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-[#00FFA5] animate-gradient-shift">
            Placement Matrix
          </h1>
          <p className="text-gray-400 mt-3 text-lg sm:text-xl max-w-2xl">
            Centralized management for student placement records.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          {(userRole === "admin" || userRole === "faculty") && (
            <button
              onClick={() => {
                resetForm();
                setShowCreateForm(true);
              }}
              className="group relative inline-flex items-center justify-center p-0.5 overflow-hidden text-lg font-medium rounded-full bg-gradient-to-br from-[#00FFA5] to-blue-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-[#00FFA5]/30 shadow-xl hover:shadow-[#00FFA5]/50 transition-all duration-300 w-full sm:w-auto transform hover:scale-105"
            >
              <span className="relative flex items-center justify-center px-8 py-3 transition-all ease-in duration-75 bg-[#0a130f] rounded-full group-hover:bg-opacity-0 text-white">
                <PlusCircle className="w-6 h-6 mr-3 -ml-1" />
                Add New Record
              </span>
            </button>
          )}
          {(userRole === "admin" || userRole === "faculty") && (
            <button
              onClick={handleExportExcel}
              className="group relative inline-flex items-center justify-center p-0.5 overflow-hidden text-lg font-medium rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-purple-300 shadow-xl hover:shadow-purple-500/50 transition-all duration-300 w-full sm:w-auto transform hover:scale-105"
            >
              <span className="relative flex items-center justify-center px-8 py-3 transition-all ease-in duration-75 bg-[#0a130f] rounded-full group-hover:bg-opacity-0 text-white">
                <Download className="w-6 h-6 mr-3 -ml-1" />
                Download Report
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#0a130f] rounded-2xl p-6 border border-[#0c4511] shadow-xl shadow-[#00FFA5]/10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <span className="text-gray-300 text-lg font-semibold mr-3 hidden sm:block">
            Filter Data:
          </span>
          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full sm:w-auto px-5 py-3 border border-[#0c4511] rounded-xl bg-black text-white appearance-none pr-10 focus:ring-2 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors"
          >
            <option value="all">All Types</option>
            <option value="internship">Internship</option>
            <option value="fulltime">Full-time</option>
          </select>

          {/* Batch Year Filter */}
          <select
            value={filterBatchYear}
            onChange={(e) => setFilterBatchYear(e.target.value)}
            className="w-full sm:w-auto px-5 py-3 border border-[#0c4511] rounded-xl bg-black text-white appearance-none pr-10 focus:ring-2 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors"
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
            className="w-full sm:w-auto px-5 py-3 border border-[#0c4511] rounded-xl bg-black text-white appearance-none pr-10 focus:ring-2 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors"
          >
            <option value="all">All Departments</option>
            {uniqueDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      <div
        className="text-center py-20 bg-[#0a130f] rounded-2xl shadow-xl shadow-[#00FFA5]/10 p-6 border border-[#0c4511]"
        style={{ display: loading ? "block" : "none" }}
      >
        <svg
          className="animate-spin h-16 w-16 text-[#00FFA5] mx-auto mb-6 filter drop-shadow-[0_0_8px_rgba(0,255,165,0.4)]"
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
        <p className="mt-4 text-2xl font-bold text-gray-300">
          Compiling placement data...
        </p>
        <p className="text-gray-400 mt-2 text-lg">
          Please wait while we load the latest records.
        </p>
      </div>

      {/* Error State */}
      <div
        className="text-center py-20 bg-red-950 rounded-2xl border border-red-700 shadow-xl p-6"
        style={{ display: !loading && error ? "block" : "none" }}
      >
        <p className="text-red-400 text-xl font-medium mb-4">
          Data Stream Error! Connection Lost.
        </p>
        <p className="text-red-300 text-lg">{error}</p>
        <button
          onClick={fetchPlacements}
          className="mt-8 bg-gradient-to-r from-red-600 to-rose-500 text-white px-8 py-3 rounded-full font-medium hover:from-red-700 hover:to-rose-600 transition-all duration-300 shadow-lg transform hover:scale-105"
        >
          Retry Data Fetch
        </button>
      </div>

      {/* Placements Grid */}
      <div
        style={{ display: !loading && !error ? "grid" : "none" }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
      >
        {displayedPlacements.length > 0 ? (
          displayedPlacements.map((placement) => {
            const { iconColor, textColor } = getPlacementTypeColor(
              placement.type
            );
            const departmentBadgeClasses = getDepartmentColor(
              placement.department
            );
            return (
              <div
                key={placement._id}
                className="bg-[#0a130f] rounded-3xl p-6 border border-[#0c4511] shadow-2xl hover:shadow-[#00FFA5]/30 transition-all duration-300 relative group transform hover:-translate-y-2 overflow-hidden"
              >
                {/* Edit/Delete Buttons for authorized users */}
                {(userRole === "admin" ||
                  (userRole === "faculty" &&
                    placement.createdBy === userId)) && (
                  <div className="absolute top-5 right-5 flex space-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <button
                      onClick={() => handleEditClick(placement)}
                      className="text-gray-400 hover:text-[#00FFA5] bg-[#1a2e20] hover:bg-[#1f2d23] p-3 rounded-full transition-colors duration-200 shadow-md"
                      title="Edit Record"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeletePlacement(placement._id)}
                      className="text-gray-400 hover:text-red-400 bg-[#1a2e20] hover:bg-red-900 p-3 rounded-full transition-colors duration-200 shadow-md"
                      title="Delete Record"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}

                <div className="flex items-start justify-between mb-5">
                  <h3 className="text-2xl font-extrabold text-white line-clamp-2 pr-10">
                    {placement.name}
                    <span className="block text-base font-medium text-gray-400 mt-1">
                      ({placement.studentId})
                    </span>
                  </h3>
                  <span
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border border-[#0c4511] ${
                      getPlacementTypeColor(placement.type).bg
                    } ${
                      getPlacementTypeColor(placement.type).textColor
                    } whitespace-nowrap`}
                  >
                    {/* Icon for Placement Type */}
                    {placement.type === "internship" ? (
                      <FileText
                        className={`w-4 h-4 ${
                          getPlacementTypeColor(placement.type).iconColor
                        }`}
                      />
                    ) : (
                      <Briefcase
                        className={`w-4 h-4 ${
                          getPlacementTypeColor(placement.type).iconColor
                        }`}
                      />
                    )}
                    {placement.type.charAt(0).toUpperCase() +
                      placement.type.slice(1)}
                  </span>
                </div>

                <div className="space-y-4 text-gray-400 text-sm">
                  <div className="flex items-center">
                    <Building2 className="w-4 h-4 mr-3 text-indigo-400" />
                    <span>
                      <span className="font-semibold text-gray-300">
                        Company:
                      </span>{" "}
                      {placement.company}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Briefcase className="w-4 h-4 mr-3 text-blue-400" />
                    <span>
                      <span className="font-semibold text-gray-300">Role:</span>{" "}
                      {placement.role}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-3 text-[#00FFA5]" />{" "}
                    {/* Green Accent */}
                    <span>
                      <span className="font-semibold text-gray-300">
                        Package:
                      </span>{" "}
                      ₹{placement.package} LPA
                    </span>
                  </div>
                  <div className="flex items-center">
                    <CalendarDays className="w-4 h-4 mr-3 text-purple-400" />
                    <span>
                      <span className="font-semibold text-gray-300">
                        Drive Date:
                      </span>{" "}
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
                    <MapPin className="w-4 h-4 mr-3 text-orange-400" />
                    <span>
                      <span className="font-semibold text-gray-300">
                        Location:
                      </span>{" "}
                      {placement.location}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <GraduationCap className="w-4 h-4 mr-3 text-teal-400" />
                    <span>
                      <span className="font-semibold text-gray-300">
                        Batch Year:
                      </span>{" "}
                      {placement.batchYear}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-3 text-pink-400" />
                    <span>
                      <span className="font-semibold text-gray-300">
                        Department:
                      </span>{" "}
                      <span
                        className={twMerge(
                          `px-2 py-0.5 rounded-full text-xs font-medium border border-current bg-[#0a130f]`, // Consistent badge background, use border-current to match text color
                          departmentBadgeClasses
                        )}
                      >
                        {placement.department}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-3 text-red-400" />
                    <span>
                      <span className="font-semibold text-gray-300">
                        Email:
                      </span>{" "}
                      {placement.email}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-20 bg-[#0a130f] rounded-2xl shadow-xl shadow-[#00FFA5]/10 p-6 border border-[#0c4511]">
            <FileText className="w-28 h-28 text-gray-600 mx-auto mb-8 filter drop-shadow-[0_0_8px_rgba(0,255,165,0.2)]" />
            <h3 className="text-3xl font-bold text-gray-300 mb-4">
              No Records Found
            </h3>
            <p className="text-gray-400 text-xl">
              No placement records match your current filters. Adjust your
              selection or add a new record.
            </p>
            {(filterType !== "all" ||
              filterBatchYear !== "all" ||
              filterDepartment !== "all") && (
              <button
                onClick={() => {
                  setFilterType("all");
                  setFilterBatchYear("all");
                  setFilterDepartment("all");
                }}
                className="mt-8 text-[#00FFA5] hover:text-cyan-300 font-semibold text-lg transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Placement Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-[100] animate-fade-in">
          <div className="w-full max-w-xl rounded-3xl p-6 sm:p-10 shadow-2xl shadow-[#00FFA5]/10 relative animate-scale-in border border-[#0c4511] bg-[#0a130f] overflow-y-auto max-h-[90vh]">
            <button
              onClick={handleCloseForm}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-3 rounded-full hover:bg-[#1a2e20] transition-colors shadow-lg"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-[#00FFA5] mb-8 text-center">
              {editingPlacement
                ? "Recalibrate Record"
                : "New Placement Protocol"}
            </h2>
            <form className="space-y-6" onSubmit={handleCreateOrUpdateSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold text-gray-300 mb-1"
                  >
                    Student Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-5 py-3 border border-[#0c4511] rounded-xl bg-black text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors disabled:bg-gray-950 disabled:cursor-not-allowed"
                    placeholder="e.g., Jane Doe"
                    value={formPlacement.name}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="studentId"
                    className="block text-sm font-semibold text-gray-300 mb-1"
                  >
                    Student ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="studentId"
                    className="w-full px-5 py-3 border border-[#0c4511] rounded-xl bg-black text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors disabled:bg-gray-950 disabled:cursor-not-allowed"
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
                  className="block text-sm font-semibold text-gray-300 mb-1"
                >
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-5 py-3 border border-[#0c4511] rounded-xl bg-black text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors disabled:bg-gray-950 disabled:cursor-not-allowed"
                  placeholder="e.g., student@example.com"
                  value={formPlacement.email}
                  onChange={handleFormChange}
                  required
                />
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
                    placeholder="e.g., CSE, ECE, ME"
                    value={formPlacement.department}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="batchYear"
                    className="block text-sm font-semibold text-gray-300 mb-1"
                  >
                    Batch Year <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    id="batchYear"
                    className="w-full px-5 py-3 border border-[#0c4511] rounded-xl bg-black text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors disabled:bg-gray-950 disabled:cursor-not-allowed"
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
                  className="block text-sm font-semibold text-gray-300 mb-1"
                >
                  Company <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="company"
                  className="w-full px-5 py-3 border border-[#0c4511] rounded-xl bg-black text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors disabled:bg-gray-950 disabled:cursor-not-allowed"
                  placeholder="e.g., Quantum Solutions, Nebula Corp."
                  value={formPlacement.company}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-semibold text-gray-300 mb-1"
                  >
                    Role <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="role"
                    className="w-full px-5 py-3 border border-[#0c4511] rounded-xl bg-black text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors disabled:bg-gray-950 disabled:cursor-not-allowed"
                    placeholder="e.g., AI Engineer, Cyber Analyst"
                    value={formPlacement.role}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="package"
                    className="block text-sm font-semibold text-gray-300 mb-1"
                  >
                    Package (LPA) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    id="package"
                    step="0.1"
                    className="w-full px-5 py-3 border border-[#0c4511] rounded-xl bg-black text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors disabled:bg-gray-950 disabled:cursor-not-allowed"
                    placeholder="e.g., 12.5"
                    value={formPlacement.package}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="type"
                    className="block text-sm font-semibold text-gray-300 mb-1"
                  >
                    Placement Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="type"
                    className="w-full px-5 py-3 border border-[#0c4511] rounded-xl bg-black text-white appearance-none pr-10 focus:ring-2 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors disabled:bg-gray-950 disabled:cursor-not-allowed"
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
                    className="block text-sm font-semibold text-gray-300 mb-1"
                  >
                    Drive Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    id="driveDate"
                    className="w-full px-5 py-3 border border-[#0c4511] rounded-xl bg-black text-white focus:ring-2 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors disabled:bg-gray-950 disabled:cursor-not-allowed"
                    value={formPlacement.driveDate}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-semibold text-gray-300 mb-1"
                >
                  Location <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="location"
                  className="w-full px-5 py-3 border border-[#0c4511] rounded-xl bg-black text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors disabled:bg-gray-950 disabled:cursor-not-allowed"
                  placeholder="e.g., Cyber City, Remote"
                  value={formPlacement.location}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 pt-6">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-8 py-3 border border-[#0c4511] text-gray-300 rounded-xl font-medium hover:bg-[#1a2e20] transition-colors duration-200 shadow-md transform hover:scale-105"
                >
                  Cancel Protocol
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-[#00FFA5] text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-[#00FFA5] transition-all duration-300 shadow-lg transform hover:scale-105"
                >
                  {editingPlacement ? "Update Record" : "Log New Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global CSS for animations and custom selects - Put this in your main CSS file (e.g., index.css) */}
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

export default PlacementManagement;
