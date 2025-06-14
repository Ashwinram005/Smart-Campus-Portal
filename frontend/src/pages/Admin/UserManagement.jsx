// src/components/UserManagement.jsx
import React, { useState } from "react";
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
  Mail,
  Phone,
  Calendar,
  Building,
  GraduationCap,
  Shield,
  MoreVertical,
} from "lucide-react";

// (Keep your User type definition here if not in a global types file)
/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {'student' | 'faculty' | 'admin'} role
 * @property {string} [department]
 * @property {string} [studentId]
 * @property {string} [phone]
 * @property {'active' | 'inactive'} status
 * @property {string} createdAt
 * @property {string | null} lastLogin
 */

/**
 * @typedef {Object} UserManagementProps
 * @property {User[]} users
 * @property {(users: User[]) => void} onUserUpdate
 */

// Dummy Data (keep this within UserManagement or pass from parent)
const DUMMY_USERS = [
  // ... your dummy user data ...
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice.j@example.com",
    role: "student",
    department: "Computer Science",
    studentId: "S1001",
    phone: "555-111-2222",
    status: "active",
    createdAt: "2023-01-15T10:00:00Z",
    lastLogin: "2024-06-10T14:30:00Z",
  },
  {
    id: "2",
    name: "Bob Williams",
    email: "bob.w@example.com",
    role: "faculty",
    department: "Physics",
    phone: "555-333-4444",
    status: "active",
    createdAt: "2022-08-01T09:00:00Z",
    lastLogin: "2024-06-12T10:00:00Z",
  },
  {
    id: "3",
    name: "Charlie Brown",
    email: "charlie.b@example.com",
    role: "student",
    department: "Mathematics",
    studentId: "S1002",
    status: "inactive",
    createdAt: "2023-03-20T11:30:00Z",
    lastLogin: "2023-11-05T08:00:00Z",
  },
  {
    id: "4",
    name: "Diana Prince",
    email: "diana.p@example.com",
    role: "admin",
    department: "Administration",
    phone: "555-555-6666",
    status: "active",
    createdAt: "2021-05-10T15:00:00Z",
    lastLogin: "2024-06-14T09:15:00Z",
  },
  {
    id: "5",
    name: "Eve Adams",
    email: "eve.a@example.com",
    role: "faculty",
    department: "Chemistry",
    status: "active",
    createdAt: "2022-11-22T13:45:00Z",
    lastLogin: "2024-06-01T16:00:00Z",
  },
  {
    id: "6",
    name: "Frank Miller",
    email: "frank.m@example.com",
    role: "student",
    department: "History",
    studentId: "S1003",
    status: "active",
    createdAt: "2024-01-01T09:00:00Z",
    lastLogin: "2024-06-13T11:00:00Z",
  },
  {
    id: "7",
    name: "Grace Taylor",
    email: "grace.t@example.com",
    role: "student",
    department: "English",
    studentId: "S1004",
    status: "inactive",
    createdAt: "2023-07-07T14:00:00Z",
    lastLogin: "2024-02-20T10:30:00Z",
  },
  {
    id: "8",
    name: "Henry Wilson",
    email: "henry.w@example.com",
    role: "faculty",
    department: "Biology",
    status: "active",
    createdAt: "2022-03-01T10:00:00Z",
    lastLogin: "2024-06-08T15:00:00Z",
  },
  {
    id: "9",
    name: "Ivy Davis",
    email: "ivy.d@example.com",
    role: "admin",
    department: "IT",
    status: "active",
    createdAt: "2021-09-15T11:00:00Z",
    lastLogin: "2024-06-14T08:45:00Z",
  },
  {
    id: "10",
    name: "Jack White",
    email: "jack.w@example.com",
    role: "student",
    department: "Art",
    studentId: "S1005",
    status: "active",
    createdAt: "2023-05-25T16:00:00Z",
    lastLogin: "2024-06-11T13:00:00Z",
  },
];

/**
 * @param {UserManagementProps} props
 */
const UserManagement = ({ users: initialUsers, onUserUpdate }) => {
  const [users, setUsers] = useState( DUMMY_USERS); // Use DUMMY_USERS as default
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "student",
    department: "",
    studentId: "",
    phone: "",
    status: "active",
  });

  const filteredUsers = users
    .filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.studentId &&
          user.studentId.toLowerCase().includes(searchTerm.toLowerCase()));
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

      if (aValue === null || bValue === null) return 0; // Fallback for nulls

      if (sortOrder === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

  const handleCreateUser = (e) => {
    e.preventDefault();
    const user = {
      id: Date.now().toString(), // Simple unique ID
      ...newUser,
      createdAt: new Date().toISOString(),
      lastLogin: null,
    };

    const updatedUsers = [...users, user];
    setUsers(updatedUsers);
    onUserUpdate(updatedUsers); // Notify parent component
    setNewUser({
      name: "",
      email: "",
      role: "student",
      department: "",
      studentId: "",
      phone: "",
      status: "active",
    });
    setShowCreateModal(false);
  };

  const handleEditUser = (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    const updatedUsers = users.map((user) =>
      user.id === selectedUser.id ? { ...selectedUser } : user
    );
    setUsers(updatedUsers);
    onUserUpdate(updatedUsers); // Notify parent component
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      const updatedUsers = users.filter((user) => user.id !== userId);
      setUsers(updatedUsers);
      onUserUpdate(updatedUsers); // Notify parent component
    }
  };

  const handleToggleStatus = (userId) => {
    const updatedUsers = users.map((user) =>
      user.id === userId
        ? { ...user, status: user.status === "active" ? "inactive" : "active" }
        : user
    );
    setUsers(updatedUsers);
    onUserUpdate(updatedUsers); // Notify parent component
  };

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
    // This component now only contains the content for the User Management page.
    // The Layout component will provide the main padding (px-10 py-10 space-y-10)
    // so we don't need redundant padding on this outermost div.
    <div className="space-y-6"> {/* Removed p-6, main Layout component handles outer padding */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 mt-2">
            Manage system users, roles, and permissions.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-[#101b14] backdrop-blur-lg rounded-xl p-4 border border-[#1f2d23] shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-blue-700/30 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-[#101b14] backdrop-blur-lg rounded-xl p-4 border border-[#1f2d23] shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Students</p>
              <p className="text-2xl font-bold text-white">
                {stats.students}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-700/30 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-[#101b14] backdrop-blur-lg rounded-xl p-4 border border-[#1f2d23] shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Faculty</p>
              <p className="text-2xl font-bold text-white">
                {stats.faculty}
              </p>
            </div>
            <div className="w-10 h-10 bg-emerald-700/30 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-[#101b14] backdrop-blur-lg rounded-xl p-4 border border-[#1f2d23] shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Admins</p>
              <p className="text-2xl font-bold text-white">
                {stats.admins}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-700/30 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-[#101b14] backdrop-blur-lg rounded-xl p-4 border border-[#1f2d23] shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Active</p>
              <p className="text-2xl font-bold text-white">{stats.active}</p>
            </div>
            <div className="w-10 h-10 bg-green-700/30 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-[#101b14] backdrop-blur-lg rounded-xl p-4 border border-[#1f2d23] shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Inactive</p>
              <p className="text-2xl font-bold text-white">
                {stats.inactive}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-700/30 rounded-lg flex items-center justify-center">
              <UserX className="w-5 h-5 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#101b14] backdrop-blur-lg rounded-xl p-6 border border-[#1f2d23] shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or student ID..."
              className="w-full pl-10 pr-4 py-3 border border-[#1f2d23] bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-[#1f2d23] bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
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
              className="px-3 py-2 border border-[#1f2d23] bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
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
      <div className="bg-[#101b14] backdrop-blur-lg rounded-xl border border-[#1f2d23] shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1f2d23]/80">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2d23]">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-[#1f2d23]/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {user.name
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
                            ID: {user.studentId}
                          </div>
                        )}
                      </div>
                    </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(
                          user.role
                        )}`}
                      >
                        {getRoleIcon(user.role)}
                        <span className="ml-1 capitalize">{user.role}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {user.department || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                          user.status || "active"
                        )}`}
                      >
                        {user.status === "active" ? (
                          <UserCheck className="w-3 h-3 mr-1" />
                        ) : (
                          <UserX className="w-3 h-3 mr-1" />
                        )}
                        {user.status || "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowViewModal(true);
                          }}
                          className="text-blue-400 hover:text-blue-300 p-1 hover:bg-blue-900/30 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                          className="text-emerald-400 hover:text-emerald-300 p-1 hover:bg-emerald-900/30 rounded transition-colors"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className={`p-1 rounded transition-colors ${
                            user.status === "active"
                              ? "text-orange-400 hover:text-orange-300 hover:bg-orange-900/30"
                              : "text-green-400 hover:text-green-300 hover:bg-green-900/30"
                          }`}
                          title={
                            user.status === "active" ? "Deactivate" : "Activate"
                          }
                        >
                          {user.status === "active" ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-400 hover:text-red-300 p-1 hover:bg-red-900/30 rounded transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No users found
              </h3>
              <p className="text-gray-400">
                No users match your current search and filter criteria.
              </p>
            </div>
          )}
        </div>

        {/* Create User Button */}
        <div className="fixed bottom-5 right-9">
          <button
            className="text-white text-base bg-blue-400 rounded-xl p-3 w-40 h-12 shadow-md hover:bg-blue-500 transition-colors"
            onClick={() => setShowCreateModal(true)}
          >
            + Add New User
          </button>
        </div>

        {/* Create User Modal (remains here as it's directly related to user management logic) */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#101b14] text-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[#1f2d23]">
              <h2 className="text-2xl font-bold text-white mb-6">
                Create New User
              </h2>
              <form onSubmit={handleCreateUser} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, name: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-[#1f2d23] bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-[#1f2d23] bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                      placeholder="Enter email address"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Role *
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) =>
                        setNewUser({ ...newUser, role: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-[#1f2d23] bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                      required
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={newUser.department}
                      onChange={(e) =>
                        setNewUser({ ...newUser, department: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-[#1f2d23] bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                      placeholder="Enter department"
                    />
                  </div>

                  {newUser.role === "student" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Student ID
                      </label>
                      <input
                        type="text"
                        value={newUser.studentId}
                        onChange={(e) =>
                          setNewUser({ ...newUser, studentId: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-[#1f2d23] bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                        placeholder="Enter student ID"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={newUser.phone}
                      onChange={(e) =>
                        setNewUser({ ...newUser, phone: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-[#1f2d23] bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-[#1f2d23]">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-[#1f2d23] transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 shadow-lg"
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#101b14] text-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[#1f2d23]">
              <h2 className="text-2xl font-bold text-white mb-6">Edit User</h2>
              <form onSubmit={handleEditUser} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
                      className="w-full px-4 py-3 border border-[#1f2d23] bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={selectedUser.email}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-[#1f2d23] bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Role *
                    </label>
                    <select
                      value={selectedUser.role}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          role: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-[#1f2d23] bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={selectedUser.department || ""}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          department: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-[#1f2d23] bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                    />
                  </div>

                  {selectedUser.role === "student" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Student ID
                      </label>
                      <input
                        type="text"
                        value={selectedUser.studentId || ""}
                        onChange={(e) =>
                          setSelectedUser({
                            ...selectedUser,
                            studentId: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-[#1f2d23] bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
                      className="w-full px-4 py-3 border border-[#1f2d23] bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
                      className="w-full px-4 py-3 border border-[#1f2d23] bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-[#1f2d23]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                    }}
                    className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-[#1f2d23] transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 shadow-lg"
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#101b14] text-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[#1f2d23]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">User Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <MoreVertical className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {selectedUser.name
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
                    <div className="flex items-center space-x-2 mt-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(
                          selectedUser.role
                        )}`}
                      >
                        {getRoleIcon(selectedUser.role)}
                        <span className="ml-1 capitalize">
                          {selectedUser.role}
                        </span>
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                          selectedUser.status || "active"
                        )}`}
                      >
                        {selectedUser.status === "active" ? (
                          <UserCheck className="w-3 h-3 mr-1" />
                        ) : (
                          <UserX className="w-3 h-3 mr-1" />
                        )}
                        {selectedUser.status || "Active"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Department
                      </label>
                      <div className="flex items-center text-white">
                        <Building className="w-4 h-4 mr-2 text-gray-500" />
                        {selectedUser.department || "Not specified"}
                      </div>
                    </div>

                    {selectedUser.studentId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                          Student ID
                        </label>
                        <div className="flex items-center text-white">
                          <GraduationCap className="w-4 h-4 mr-2 text-gray-500" />
                          {selectedUser.studentId}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Phone
                      </label>
                      <div className="flex items-center text-white">
                        <Phone className="w-4 h-4 mr-2 text-gray-500" />
                        {selectedUser.phone || "Not specified"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Created At
                      </label>
                      <div className="flex items-center text-white">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                        {selectedUser.createdAt
                          ? new Date(
                              selectedUser.createdAt
                            ).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Last Login
                      </label>
                      <div className="flex items-center text-white">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                        {selectedUser.lastLogin
                          ? new Date(
                              selectedUser.lastLogin
                            ).toLocaleDateString()
                          : "Never"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-[#1f2d23] mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-[#1f2d23] transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setShowEditModal(true);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 shadow-lg"
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