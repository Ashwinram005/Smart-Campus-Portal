import React, { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // Import jwtDecode

// --- IMPORTANT ---
// You need to adjust these import paths to correctly point to your assets
import MenuIcon from "../assets/Dashboard/MenuIcon.png";
import DashboardIcon from "../assets/Dashboard/DashboardIcon.png";
import FeedbackIcon from "../assets/Dashboard/FeedbackIcon.png";
import MyRepoIcon from "../assets/Dashboard/MyRepoIcon.png";
import MyContentIcon from "../assets/Dashboard/MyContentIcon.png";
import MyBlogsIcon from "../assets/Dashboard/MyBlogsIcon.png";
import TeamsIcon from "../assets/Dashboard/TeamsIcon.png";
import ChallengesIcon from "../assets/Dashboard/ChallengesIcon.png";
import AnalyticsIcon from "../assets/Dashboard/AnalyticsIcon.png";

// Define roles here (or import from a constants file)
const ROLES = {
  ADMIN: "admin",
  FACULTY: "faculty",
  STUDENT: "student",
  GUEST: "guest", // Example for users not logged in or with limited access
};

// Define your side menu with role-based access
const sideMenu = [
  {
    icon: DashboardIcon,
    label: "Dashboard",
    path: "/dashboard",
    roles: [ROLES.ADMIN, ROLES.FACULTY, ROLES.STUDENT],
  },
  {
    icon: MyRepoIcon,
    label: "Users",
    path: "/user",
    roles: [ROLES.ADMIN],
  }, // Only Admin can see
  {
    icon: MyContentIcon,
    label: "Events",
    path: "/events",
    roles: [ROLES.ADMIN],
  },
  {
    icon: MyBlogsIcon,
    label: "Placements",
    path: "/placements",
    roles: [ROLES.ADMIN],
  },
  {
    icon: TeamsIcon,
    label: "Courses",
    path: "/courses",
    roles: [ROLES.FACULTY],
  },
  {
    icon: FeedbackIcon,
    label: "Events ",
    path: "/faculty/events",
    roles: [ROLES.FACULTY],
  }, // Only Faculty can see
  {
    icon: ChallengesIcon,
    label: "My Courses ",
    path: "/students/courses", // Corrected path if needed
    roles: [ROLES.STUDENT],
  }, // Only Student can see
  {
    icon: AnalyticsIcon,
    label: "Placements ",
    path: "/students/placements",
    roles: [ROLES.STUDENT],
  }, // Only Student can see
  {
    icon: AnalyticsIcon,
    label: "Events ",
    path: "/students/events",
    roles: [ROLES.STUDENT],
  }, // Only Student can see
];

/**
 * Extracts the user role from a JWT token stored in localStorage.
 * Assumes the token's payload contains a 'role' property.
 * @returns {string} The user's role (e.g., 'admin', 'faculty', 'student'),
 *                   or ROLES.GUEST if no valid token or role found.
 */
const getUserRoleFromToken = () => {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      // Decode the token
      const decodedToken = jwtDecode(token);

      // Check for token expiration (optional but recommended)
      if (decodedToken.exp * 1000 < Date.now()) {
        console.warn("Token expired. Logging out user.");
        localStorage.removeItem("token"); // Clear expired token
        return ROLES.GUEST;
      }

      // Assuming your JWT payload has a 'role' field
      // Adjust 'role' to whatever key your backend uses (e.g., 'userRole', 'permissions')
      if (decodedToken.role) {
        return decodedToken.role.toLowerCase(); // Ensure consistency (lowercase)
      } else {
        console.warn("JWT token does not contain a 'role' field.");
      }
    } catch (error) {
      console.error("Error decoding JWT token:", error);
      // If the token is malformed, clear it to prevent infinite loops or errors
      localStorage.removeItem("token");
    }
  }
  return ROLES.GUEST; // Default to guest if no token, invalid token, or no role in token
};

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content of the current page.
 * @param {string} props.currentPageTitle - The title for the main content area.
 */
const Layout = ({ children, currentPageTitle = "Dashboard" }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userRole, setUserRole] = useState(ROLES.GUEST); // Initialize with a default role
  const navigate = useNavigate();

  // On component mount, get the user's role from the token
  useEffect(() => {
    const role = getUserRoleFromToken();
    setUserRole(role);
  }, []); // Run once on mount

  // Filter the side menu based on the user's role
  const filteredSideMenu = sideMenu.filter((item) => {
    if (!item.roles || item.roles.length === 0) {
      return true; // Item is visible to all if no specific roles are listed
    }
    return item.roles.includes(userRole);
  });

  const handleLogout = () => {
    console.log("User logging out...");
    localStorage.removeItem("token");
    // No need to remove 'userRole' if it's derived directly from the token
    navigate("/");
    setShowLogoutModal(false);
    alert("You have been logged out.");
  };

  return (
    <div className="min-h-screen bg-[#000] text-white">
      <div className="flex pt-[90px]">
        <aside className="fixed bottom-0 left-0 z-10 flex w-[70px] flex-col items-center space-y-10 overflow-y-auto bg-gradient-to-b from-black to-[#0c4511] p-4 md:w-[250px] md:items-start md:p-6 pt-0">
          <div className="mb-6 flex w-full items-center justify-center md:justify-between">
            <h1 className="hidden text-[18px] font-[700] md:block">Menu</h1>
            <img src={MenuIcon} alt="Menu" className="h-[20px] w-[20px]" />
          </div>
          <nav className="flex w-full flex-col items-center space-y-10 md:items-start">
            {filteredSideMenu.map((item, idx) => (
              <a
                key={idx}
                href={item.path}
                className="flex flex-col items-center transition-all hover:text-[#00FFA5] md:flex-row md:space-x-3"
              >
                <img src={item.icon} alt={item.label} className="h-6 w-6" />
                <span className="hidden text-[18px] font-[400] md:inline">
                  {item.label}
                </span>
              </a>
            ))}
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center space-x-2 rounded-lg bg-red-600 px-3 py-2 font-medium text-white shadow-lg transition-all duration-200 hover:bg-red-700"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </nav>
        </aside>
        <main className="min-h-screen w-full bg-gradient-to-b from-black to-[#0c4511] px-10 py-10 pl-[70px] md:pl-[250px] space-y-10">
          {children}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg border border-gray-700 bg-[#101b14] p-6 text-white shadow-lg">
            <h3 className="mb-4 text-xl font-bold">Confirm Logout</h3>
            <p className="mb-6 text-gray-300">
              Are you sure you want to log out? Your current session will be
              ended.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="rounded-lg border border-gray-600 px-4 py-2 font-medium text-gray-300 transition-colors hover:bg-[#1f2d23]"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white shadow-lg transition-all duration-200 hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
