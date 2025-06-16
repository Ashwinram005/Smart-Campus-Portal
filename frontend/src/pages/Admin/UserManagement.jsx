// src/components/UserManagement.jsx
import React, { useState, useEffect, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Calendar,
  Building,
  GraduationCap,
  Shield,
  MoreVertical,
  Phone,
  Download as DownloadIcon,
  X, // Renamed to avoid conflict with `Download` type from lucide-react
} from "lucide-react";
import { jwtDecode } from "jwt-decode";

/**
 * @typedef {Object} User
 * @property {string} _id
 * @property {string} name
 * @property {string} email
 * @property {'student' | 'faculty' | 'admin'} role
 * @property {string} [department]
 * @property {string} [studentId]
 * @property {string} [facultyId]
 * @property {string} [year]
 * @property {string} [phone]
 * @property {'active' | 'inactive'} status
 * @property {string} createdAt
 * @property {string} [password]
 */

/**
 * @typedef {Object} UserManagementProps
 * @property {User[]} users
 * @property {(users: User[]) => void} onUserUpdate
 */

/**
 * @param {UserManagementProps} props
 */
const UserManagement = ({ users: initialUsers, onUserUpdate }) => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const getCurrentYear = () => new Date().getFullYear().toString();

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "student",
    department: "",
    year: getCurrentYear(),
    studentId: "",
    facultyId: "",
    phone: "",
    status: "active",
    password: "",
  });

  const token = localStorage.getItem("token");
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

  // State to hold the ID of the logged-in user
  const [loggedInUserId, setLoggedInUserId] = useState(null);

  // Effect to extract loggedInUserId from token when component mounts or token changes
  useEffect(() => {
    if (token) {
      try {
        // Basic JWT decoding - consider a library like 'jwt-decode' for production
        // Using jwt-decode for robustness
        const decodedToken = jwtDecode(token);
        setLoggedInUserId(decodedToken._id || decodedToken.id); // Use _id or id based on your token structure
      } catch (e) {
        console.error("Error decoding token:", e);
        // Handle invalid token scenario, e.g., redirect to login
        setLoggedInUserId(null); // Clear ID if token is invalid
      }
    } else {
      setLoggedInUserId(null); // Clear ID if no token
    }
    fetchUsers(); // Fetch users when token/loggedInUserId might have changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // Re-
  // run when 'token' changes, but fetchUsers is also a dep.

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        const errorData = await response.json();
        toast.error(
          `Failed to fetch users: ${errorData.message || response.statusText}`
        );
        console.error(
          "Failed to fetch users:",
          errorData.message || response.statusText
        );
      }
    } catch (error) {
      toast.error(`Error fetching users: ${error.message}`);
      console.error("Error fetching users:", error);
    }
  }, [token]); // Add token to useCallback dependencies

  const isIdTaken = (id, type) => {
    // Check against existing users in the list AND the logged-in user's ID
    if (loggedInUserId && id === loggedInUserId) {
      return true; // The generated ID clashes with the logged-in user's primary ID
    }
    if (type === "student") {
      return users.some((user) => user.studentId === id);
    } else if (type === "faculty") {
      return users.some((user) => user.facultyId === id);
    }
    return false;
  };

  const generateStudentId = () => {
    const { department, year } = newUser;
    if (!department || !year) {
      toast.error("Please enter Department and Year to generate Student ID.");
      return;
    }

    const departmentCode = department.toUpperCase().substring(0, 3);
    const yearLastTwoDigits = String(year).slice(-2);
    let generatedId = "";
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    do {
      const randomRollNo = Math.floor(1000 + Math.random() * 9000);
      generatedId = `${departmentCode}-${yearLastTwoDigits}-${randomRollNo}`;
      attempts++;
      if (attempts > MAX_ATTEMPTS) {
        toast.error(
          "Could not generate a unique Student ID after several attempts. Please try again or adjust input."
        );
        return;
      }
    } while (isIdTaken(generatedId, "student"));

    setNewUser((prev) => ({ ...prev, studentId: generatedId }));
    toast.success("Student ID generated!");
  };

  const generateFacultyId = () => {
    const { department } = newUser;
    if (!department) {
      toast.error("Please enter Department to generate Faculty ID.");
      return;
    }

    const departmentCode = department.toUpperCase().substring(0, 3);
    let generatedId = "";
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    do {
      const randomFacultyNum = Math.floor(100 + Math.random() * 900);
      generatedId = `${departmentCode}-FAC-${randomFacultyNum}`;
      attempts++;
      if (attempts > MAX_ATTEMPTS) {
        toast.error(
          "Could not generate a unique Faculty ID after several attempts. Please try again or adjust input."
        );
        return;
      }
    } while (isIdTaken(generatedId, "faculty"));

    setNewUser((prev) => ({ ...prev, facultyId: generatedId }));
    toast.success("Faculty ID generated!");
  };

  const getAcademicYearDisplay = (admissionYear) => {
    if (!admissionYear) return "N/A";
    const currentYear = new Date().getFullYear();
    const admittedYear = parseInt(admissionYear, 10);
    if (isNaN(admittedYear)) return "N/A";

    const academicYear = currentYear - admittedYear + 1;

    switch (academicYear) {
      case 1:
        return "I Year";
      case 2:
        return "II Year";
      case 3:
        return "III Year";
      case 4:
        return "IV Year";
      case 5:
        return "V Year";
      default:
        return academicYear > 0 ? `${academicYear} Year` : "Graduated";
    }
  };

  const filteredUsers = users
    .filter((user) => {
      // Exclude the currently logged-in user
      if (loggedInUserId && user._id === loggedInUserId) {
        return false;
      }

      const userName = user.name || "";
      const userEmail = user.email || "";
      const userStudentId = user.studentId || "";
      const userFacultyId = user.facultyId || "";

      const matchesSearch =
        userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userStudentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userFacultyId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      let aValue = null;
      let bValue = null;

      switch (sortBy) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "email":
          aValue = a.email;
          bValue = b.email;
          break;
        case "role":
          aValue = a.role;
          bValue = b.role;
          break;
        case "createdAt":
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        default:
          break;
      }

      const compareA =
        aValue !== null && typeof aValue === "string" ? aValue : "";
      const compareB =
        bValue !== null && typeof bValue === "string" ? bValue : "";

      if (sortOrder === "asc") {
        return compareA.localeCompare(compareB);
      } else {
        return compareB.localeCompare(compareA);
      }
    });

  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (newUser.role === "student" && !newUser.studentId) {
      toast.error("Please generate a Student ID.");
      return;
    }
    if (newUser.role === "faculty" && !newUser.facultyId) {
      toast.error("Please generate a Faculty ID.");
      return;
    }

    let passwordToUse = "";
    if (newUser.role === "student") {
      passwordToUse = newUser.studentId;
    } else if (newUser.role === "faculty") {
      passwordToUse = newUser.facultyId;
    } else if (newUser.role === "admin") {
      passwordToUse = prompt("Enter initial password for admin:") || "";
      if (!passwordToUse) {
        toast.error("Admin password is required.");
        return;
      }
    }

    const userToCreate = {
      ...newUser,
      password: passwordToUse,
      createdAt: new Date().toISOString(),
    };

    // Clean up unnecessary fields based on role before sending to backend
    if (userToCreate.role === "student") {
      delete userToCreate.facultyId;
    } else if (userToCreate.role === "faculty") {
      delete userToCreate.studentId;
      delete userToCreate.year;
    } else if (userToCreate.role === "admin") {
      delete userToCreate.studentId;
      delete userToCreate.facultyId;
      delete userToCreate.year;
      delete userToCreate.department; // Admins typically don't have a department
    }

    try {
      const res = await toast.promise(
        fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(userToCreate),
        }),
        {
          loading: "Creating user...",
          success: (response) => {
            if (!response.ok) {
              // Extract error message from response if available
              return response.json().then((errData) => {
                throw new Error(errData.message || response.statusText);
              });
            }
            return "User created successfully!";
          },
          error: (error) =>
            `Failed to create user: ${error.message || "Unknown error"}`,
        }
      );

      if (res.ok) {
        // Only parse JSON if the response is successful
        const createdUser = await res.json();
        setUsers((prevUsers) => [...prevUsers, createdUser.user]); // Assuming backend returns { user: ... }
        setNewUser({
          name: "",
          email: "",
          role: "student",
          department: "",
          year: getCurrentYear(),
          studentId: "",
          facultyId: "",
          phone: "",
          status: "active",
          password: "",
        });
        setShowCreateModal(false);
      } else {
        // Error handling already done by toast.promise, but log for debugging
        const errorData = await res.json(); // Need to await json() here if not using .then() in toast.promise
        console.error("Failed to create user:", errorData.message);
      }
    } catch (error) {
      console.error("Error during user creation:", error);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    const userToUpdate = {
      name: selectedUser.name,
      phone: selectedUser.phone,
      status: selectedUser.status,
    };

    try {
      const res = await toast.promise(
        fetch(`${API_BASE_URL}/users/${selectedUser._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(userToUpdate),
        }),
        {
          loading: "Updating user...",
          success: (response) => {
            if (!response.ok) {
              return response.json().then((errData) => {
                throw new Error(errData.message || response.statusText);
              });
            }
            return "User updated successfully!";
          },
          error: (error) =>
            `Failed to update user: ${error.message || "Unknown error"}`,
        }
      );

      if (res.ok) {
        const updatedUser = await res.json();
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === updatedUser._id ? updatedUser : user
          )
        );
        setShowEditModal(false);
        setSelectedUser(null);
      } else {
        const errorData = await res.json();
        console.error("Failed to update user:", errorData.message);
      }
    } catch (error) {
      console.error("Error during user update:", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const res = await toast.promise(
          fetch(`${API_BASE_URL}/users/${userId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          {
            loading: "Deleting user...",
            success: (response) => {
              if (!response.ok) {
                return response.json().then((errData) => {
                  throw new Error(errData.message || response.statusText);
                });
              }
              return "User deleted successfully!";
            },
            error: (error) =>
              `Failed to delete user: ${error.message || "Unknown error"}`,
          }
        );

        if (res.ok) {
          setUsers((prevUsers) =>
            prevUsers.filter((user) => user._id !== userId)
          );
        } else {
          const errorData = await res.json();
          console.error("Failed to delete user:", errorData.message);
        }
      } catch (error) {
        console.error("Error during user deletion:", error);
      }
    }
  };

  const handleToggleStatus = async (userId) => {
    const userToToggle = users.find((user) => user._id === userId);
    if (!userToToggle) {
      toast.error(`User with ID ${userId} not found.`);
      console.warn(`User with ID ${userId} not found for status toggle.`);
      return;
    }

    const newStatus = userToToggle.status === "active" ? "inactive" : "active";

    try {
      const res = await toast.promise(
        fetch(`${API_BASE_URL}/users/${userId}/toggle-status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }),
        {
          loading: "Updating status...",
          success: (response) => {
            if (!response.ok) {
              return response.json().then((errData) => {
                throw new Error(errData.message || response.statusText);
              });
            }
            return `User status changed to ${newStatus}.`;
          },
          error: (error) =>
            `Failed to update status: ${error.message || "Unknown error"}`,
        }
      );

      if (res.ok) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userId ? { ...user, status: newStatus } : user
          )
        );
      } else {
        const errorData = await res.json();
        console.error("Failed to update user status:", errorData.message);
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
    }
  };

  // --- CSV Export Logic ---
  const exportUsersToCsv = () => {
    if (!users.length) {
      toast.error("No users to export.");
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Role",
      "Department",
      "Student ID",
      "Faculty ID",
      "Admission Year",
      "Academic Year",
      "Phone",
      "Status",
      "Created At",
    ];

    // Map user data to CSV rows
    const rows = users.map((user) => {
      const rowData = [
        user.name || "",
        user.email || "",
        user.role || "",
        user.department || "",
        user.studentId || "",
        user.facultyId || "",
        user.year || "",
        getAcademicYearDisplay(user.year),
        user.phone || "",
        user.status || "",
        user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "", // Format date
      ];
      // Escape commas and wrap in quotes if necessary for CSV format
      return rowData
        .map((field) => {
          if (
            typeof field === "string" &&
            (field.includes(",") || field.includes("\n"))
          ) {
            return `"${field.replace(/"/g, '""')}"`; // Escape double quotes
          }
          return field;
        })
        .join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `users_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up the URL object
    toast.success("Users exported successfully to CSV!");
  };
  // --- End CSV Export Logic ---

  const getRoleIcon = (role) => {
    switch (role) {
      case "student":
        return <GraduationCap className="w-4 h-4" />;
      case "faculty":
        return <Users className="w-4 h-4" />;
      case "admin":
        return <Shield className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "student":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "faculty":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "admin":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status) => {
    return status === "active"
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-red-100 text-red-800 border-red-200";
  };

  const stats = {
    total: users.length,
    students: users.filter((u) => u.role === "student").length,
    faculty: users.filter((u) => u.role === "faculty").length,
    admins: users.filter((u) => u.role === "admin").length,
    active: users.filter((u) => u.status === "active").length,
    inactive: users.filter((u) => u.status === "inactive").length,
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" reverseOrder={false} />{" "}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="mt-2 text-gray-400">
            Manage system users, roles, and permissions.
          </p>
        </div>
        <div className="flex space-x-3">
          {" "}
          {/* Container for buttons */}
          <button
            onClick={exportUsersToCsv}
            className="flex items-center space-x-2 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-2 font-medium text-white shadow-lg transition-all duration-200 hover:from-teal-700 hover:to-cyan-700"
          >
            <DownloadIcon className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 px-4 py-2 font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-emerald-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
        <div className="rounded-xl border border-[#1f2d23] bg-[#101b14] p-4 shadow-lg backdrop-blur-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700/30">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#1f2d23] bg-[#101b14] p-4 shadow-lg backdrop-blur-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Students</p>
              <p className="text-2xl font-bold text-white">{stats.students}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700/30">
              <GraduationCap className="h-5 w-5 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#1f2d23] bg-[#101b14] p-4 shadow-lg backdrop-blur-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Faculty</p>
              <p className="text-2xl font-bold text-white">{stats.faculty}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-700/30">
              <Users className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#1f2d23] bg-[#101b14] p-4 shadow-lg backdrop-blur-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Admins</p>
              <p className="text-2xl font-bold text-white">{stats.admins}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-700/30">
              <Shield className="h-5 w-5 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#1f2d23] bg-[#101b14] p-4 shadow-lg backdrop-blur-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Active</p>
              <p className="text-2xl font-bold text-white">{stats.active}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-700/30">
              <UserCheck className="h-5 w-5 text-green-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#1f2d23] bg-[#101b14] p-4 shadow-lg backdrop-blur-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Inactive</p>
              <p className="text-2xl font-bold text-white">{stats.inactive}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-700/30">
              <UserX className="h-5 w-5 text-red-400" />
            </div>
          </div>
        </div>
      </div>
      {/* Search and Filters */}
      <div className="rounded-xl border border-[#1f2d23] bg-[#101b14] p-6 shadow-lg backdrop-blur-lg sm:space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or ID..."
              className="w-full rounded-lg border border-[#1f2d23] bg-transparent px-4 py-3 pl-10 text-white transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-lg border border-[#1f2d23] bg-transparent px-3 py-2 text-white transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split("-");
                setSortBy(field);
                setSortOrder(order);
              }}
              className="rounded-lg border border-[#1f2d23] bg-transparent px-3 py-2 text-white transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="email-asc">Email A-Z</option>
              <option value="role-asc">Role A-Z</option>
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>
      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-[#1f2d23] bg-[#101b14] shadow-lg backdrop-blur-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1f2d23]/80">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                  Department
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2d23]">
              {filteredUsers.map((user) => (
                <tr
                  key={user._id}
                  className="transition-colors hover:bg-[#1f2d23]/50"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-emerald-600">
                        <span className="text-sm font-medium text-white">
                          {(user.name || "N/A")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {user.email}
                        </div>
                        {user.studentId && (
                          <div className="text-xs text-gray-500">
                            Student ID: {user.studentId}
                          </div>
                        )}
                        {user.facultyId && (
                          <div className="text-xs text-gray-500">
                            Faculty ID: {user.facultyId}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getRoleColor(
                        user.role
                      )}`}
                    >
                      {getRoleIcon(user.role)}
                      <span className="ml-1 capitalize">{user.role}</span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-white">
                    {user.department || "N/A"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                        user.status || "active"
                      )}`}
                    >
                      {user.status === "active" ? (
                        <UserCheck className="mr-1 h-3 w-3" />
                      ) : (
                        <UserX className="mr-1 h-3 w-3" />
                      )}
                      {user.status || "Active"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowViewModal(true);
                        }}
                        className="rounded p-1 text-blue-400 transition-colors hover:bg-blue-900/30 hover:text-blue-300"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowEditModal(true);
                        }}
                        className="rounded p-1 text-emerald-400 transition-colors hover:bg-emerald-900/30 hover:text-emerald-300"
                        title="Edit User"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user._id)}
                        className={`rounded p-1 transition-colors ${
                          user.status === "active"
                            ? "text-orange-400 hover:bg-orange-900/30 hover:text-orange-300"
                            : "text-green-400 hover:bg-green-900/30 hover:text-green-300"
                        }`}
                        title={
                          user.status === "active" ? "Deactivate" : "Activate"
                        }
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="rounded p-1 text-red-400 transition-colors hover:bg-red-900/30 hover:text-red-300"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <Users className="mx-auto mb-4 h-16 w-16 text-gray-500" />
            <h3 className="mb-2 text-lg font-medium text-white">
              No users found
            </h3>
            <p className="text-gray-400">
              No users match your current search and filter criteria.
            </p>
          </div>
        )}
      </div>
      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#1f2d23] bg-[#101b14] p-6 text-white">
            <h2 className="mb-6 text-2xl font-bold text-white">
              Create New User
            </h2>
            <form onSubmit={handleCreateUser} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                    className="w-full rounded-lg border border-[#1f2d23] bg-transparent px-4 py-3 text-white transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    className="w-full rounded-lg border border-[#1f2d23] bg-transparent px-4 py-3 text-white transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Role *
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => {
                      setNewUser((prev) => {
                        const newRole = e.target.value;
                        const updatedUser = { ...prev, role: newRole };

                        // Clear ID/Year fields based on new role
                        if (newRole !== "student") {
                          updatedUser.studentId = "";
                          updatedUser.year = ""; // Clear year if not student
                        } else {
                          // If becoming a student, set year to current year
                          updatedUser.year = getCurrentYear();
                        }

                        if (newRole !== "faculty") {
                          updatedUser.facultyId = "";
                        }
                        if (newRole !== "admin") {
                          updatedUser.department = ""; // Clear department if not admin for new user
                        }
                        return updatedUser;
                      });
                    }}
                    className="w-full rounded-lg border border-[#1f2d23] bg-transparent px-4 py-3 text-white transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                {newUser.role !== "admin" && ( // Department input only for student/faculty
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Department
                    </label>
                    <input
                      type="text"
                      value={newUser.department}
                      onChange={(e) =>
                        setNewUser({ ...newUser, department: e.target.value })
                      }
                      className="w-full rounded-lg border border-[#1f2d23] bg-transparent px-4 py-3 text-white transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter department"
                    />
                  </div>
                )}

                {newUser.role === "student" && (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        Admission Year
                      </label>
                      <input
                        type="number"
                        value={newUser.year}
                        onChange={(e) =>
                          setNewUser({
                            ...newUser,
                            year: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-[#1f2d23] bg-transparent px-4 py-3 text-white transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 2023"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        Student ID
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={newUser.studentId}
                          onChange={(e) =>
                            setNewUser({
                              ...newUser,
                              studentId: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-[#1f2d23] bg-transparent px-4 py-3 text-white transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                          placeholder="Auto-generated or enter manually"
                          readOnly
                        />
                        <button
                          type="button"
                          onClick={generateStudentId}
                          disabled={!!newUser.studentId}
                          className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 ${
                            !!newUser.studentId
                              ? "cursor-not-allowed bg-gray-600"
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          {newUser.studentId
                            ? "ID Generated"
                            : "Generate Student ID"}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {newUser.role === "faculty" && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Faculty ID
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newUser.facultyId}
                        onChange={(e) =>
                          setNewUser({ ...newUser, facultyId: e.target.value })
                        }
                        className="w-full rounded-lg border border-[#1f2d23] bg-transparent px-4 py-3 text-white transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-ring-blue-500"
                        placeholder="Auto-generated or enter manually"
                        readOnly
                      />
                      <button
                        type="button"
                        onClick={generateFacultyId}
                        disabled={!!newUser.facultyId}
                        className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 ${
                          !!newUser.facultyId
                            ? "cursor-not-allowed bg-gray-600"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        {newUser.facultyId
                          ? "ID Generated"
                          : "Generate Faculty ID"}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) =>
                      setNewUser({ ...newUser, phone: e.target.value })
                    }
                    className="w-full rounded-lg border border-[#1f2d23] bg-transparent px-4 py-3 text-white transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 border-t border-[#1f2d23] pt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-gray-600 px-6 py-3 font-medium text-gray-300 transition-colors hover:bg-[#1f2d23]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 px-6 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-emerald-700"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#1f2d23] bg-[#101b14] p-6 text-white">
            <h2 className="mb-6 text-2xl font-bold text-white">Edit User</h2>
            <form onSubmit={handleEditUser} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={selectedUser.name}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        name: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-[#1f2d23] bg-transparent px-4 py-3 text-white transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={selectedUser.email}
                    disabled
                    className="w-full cursor-not-allowed rounded-lg border border-[#1f2d23] bg-transparent px-4 py-3 text-gray-400"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Role *
                  </label>
                  <select
                    disabled
                    value={selectedUser.role}
                    className="w-full cursor-not-allowed rounded-lg border border-[#1f2d23] bg-transparent px-4 py-3 text-gray-400"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Department
                  </label>
                  <input
                    disabled
                    type="text"
                    value={selectedUser.department || ""}
                    className="w-full cursor-not-allowed rounded-lg border border-[#1f2d23] bg-transparent px-4 py-3 text-gray-400"
                  />
                </div>

                {selectedUser.role === "student" && (
                  <div className="md:col-span-2">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                          Admission Year
                        </label>
                        <input
                          type="text"
                          value={selectedUser.year || ""}
                          className="w-full cursor-not-allowed rounded-lg border border-[#1f2d23] bg-transparent px-4 py-3 text-gray-400"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                          Student ID
                        </label>
                        <input
                          type="text"
                          value={selectedUser.studentId || ""}
                          className="w-full cursor-not-allowed rounded-lg border border-[#1f2d23] bg-transparent px-4 py-3 text-gray-400"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                )}
                {selectedUser.role === "faculty" && (
                  <div className="md:col-span-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        Faculty ID
                      </label>
                      <input
                        type="text"
                        value={selectedUser.facultyId || ""}
                        className="w-full cursor-not-allowed rounded-lg border border-[#1f2d23] bg-transparent px-4 py-3 text-gray-400"
                        readOnly
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={selectedUser.phone || ""}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        phone: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-[#1f2d23] bg-transparent px-4 py-3 text-white transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Status
                  </label>
                  <select
                    value={selectedUser.status || "active"}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        status: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-[#1f2d23] bg-transparent px-4 py-3 text-white transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-4 border-t border-[#1f2d23] pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="rounded-lg border border-gray-600 px-6 py-3 font-medium text-gray-300 transition-colors hover:bg-[#1f2d23]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 px-6 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-emerald-700"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#1f2d23] bg-[#101b14] p-6 text-white">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">User Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 transition-colors hover:text-gray-200"
              >
                <X className="h-6 w-6" /> {/* Changed to X for close button */}
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-emerald-600">
                  <span className="text-xl font-bold text-white">
                    {(selectedUser.name || "N/A")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedUser.name}
                  </h3>
                  <p className="text-gray-400">{selectedUser.email}</p>
                  <div className="mt-2 flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getRoleColor(
                        selectedUser.role
                      )}`}
                    >
                      {getRoleIcon(selectedUser.role)}
                      <span className="ml-1 capitalize">
                        {selectedUser.role}
                      </span>
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                        selectedUser.status || "active"
                      )}`}
                    >
                      {selectedUser.status === "active" ? (
                        <UserCheck className="mr-1 h-3 w-3" />
                      ) : (
                        <UserX className="mr-1 h-3 w-3" />
                      )}
                      {selectedUser.status || "Active"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-400">
                      Department
                    </label>
                    <div className="flex items-center text-white">
                      <Building className="mr-2 h-4 w-4 text-gray-500" />
                      {selectedUser.department || "Not specified"}
                    </div>
                  </div>

                  {selectedUser.role === "student" && (
                    <>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-400">
                          Admission Year
                        </label>
                        <div className="flex items-center text-white">
                          <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                          {selectedUser.year || "N/A"}
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-400">
                          Academic Year
                        </label>
                        <div className="flex items-center text-white">
                          <GraduationCap className="mr-2 h-4 w-4 text-gray-500" />
                          {getAcademicYearDisplay(selectedUser.year)}
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-400">
                          Student ID
                        </label>
                        <div className="flex items-center text-white">
                          <GraduationCap className="mr-2 h-4 w-4 text-gray-500" />
                          {selectedUser.studentId || "N/A"}
                        </div>
                      </div>
                    </>
                  )}

                  {selectedUser.role === "faculty" && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-400">
                        Faculty ID
                      </label>
                      <div className="flex items-center text-white">
                        <Users className="mr-2 h-4 w-4 text-gray-500" />
                        {selectedUser.facultyId || "N/A"}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-400">
                      Phone
                    </label>
                    <div className="flex items-center text-white">
                      <Phone className="mr-2 h-4 w-4 text-gray-500" />
                      {selectedUser.phone || "Not specified"}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-400">
                      Created At
                    </label>
                    <div className="flex items-center text-white">
                      <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                      {selectedUser.createdAt
                        ? new Date(selectedUser.createdAt).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-4 border-t border-[#1f2d23] pt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="rounded-lg border border-gray-600 px-6 py-3 font-medium text-gray-300 transition-colors hover:bg-[#1f2d23]"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setShowEditModal(true);
                }}
                className="rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 px-6 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-emerald-700"
              >
                Edit User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
