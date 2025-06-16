import React, { useState, useEffect } from "react";
import {
  LogOut,
  Home,
  Users,
  CalendarDays,
  BriefcaseBusiness,
  BookOpen,
  MessageSquareHeart,
  Award,
  BarChart2,
  Menu,
  X, // Make sure X is imported for modal close button
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import MenuIcon from "../assets/Dashboard/MenuIcon.png";
import logoIcon from "../assets/react.svg"; // Assuming you have a proper logo

const ROLES = {
  ADMIN: "admin",
  FACULTY: "faculty",
  STUDENT: "student",
  GUEST: "guest",
};

const sideMenu = [
  {
    icon: Home,
    label: "Dashboard",
    path: "/dashboard",
    roles: [ROLES.ADMIN, ROLES.FACULTY, ROLES.STUDENT],
  },
  {
    icon: Users,
    label: "Users",
    path: "/user",
    roles: [ROLES.ADMIN],
  },
  {
    icon: CalendarDays,
    label: "All Events",
    path: "/events",
    roles: [ROLES.ADMIN],
  },
  {
    icon: BriefcaseBusiness,
    label: "All Placements",
    path: "/placements",
    roles: [ROLES.ADMIN],
  },
  {
    icon: BookOpen,
    label: "Courses ",
    path: "/courses",
    roles: [ROLES.FACULTY],
  },
  {
    icon: MessageSquareHeart,
    label: "My Events ",
    path: "/faculty/events",
    roles: [ROLES.FACULTY],
  },
  {
    icon: Award,
    label: "My Courses",
    path: "/students/courses",
    roles: [ROLES.STUDENT],
  },
  {
    icon: BarChart2,
    label: "My Placements",
    path: "/students/placements",
    roles: [ROLES.STUDENT],
  },
  {
    icon: CalendarDays,
    label: "My Events",
    path: "/students/events",
    roles: [ROLES.STUDENT],
  },
];

const getUserRoleFromToken = () => {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const decodedToken = jwtDecode(token);
      if (decodedToken.exp * 1000 < Date.now()) {
        console.warn("Token expired. Logging out user.");
        localStorage.removeItem("token");
        return ROLES.GUEST;
      }
      if (decodedToken.role) {
        return decodedToken.role.toLowerCase();
      } else {
        console.warn("JWT token does not contain a 'role' field.");
      }
    } catch (error) {
      console.error("Error decoding JWT token:", error);
      localStorage.removeItem("token");
    }
  }
  return ROLES.GUEST;
};

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content of the current page.
 * @param {string} props.currentPageTitle - The title for the main content area.
 */
const Layout = ({ children, currentPageTitle = "Dashboard" }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userRole, setUserRole] = useState(ROLES.GUEST);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const role = getUserRoleFromToken();
    setUserRole(role);
  }, []);

  const filteredSideMenu = sideMenu.filter((item) => {
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    return item.roles.includes(userRole);
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
    setShowLogoutModal(false);
    // Consider a toast instead for better UX
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      <div className="flex flex-1">
        <aside className="fixed bottom-0 left-0 top-0 z-20 flex w-[70px] flex-col items-center space-y-6 overflow-y-auto bg-gradient-to-b from-black to-[#0a130f] p-4 shadow-xl shadow-[#00FFA5]/10 transition-all duration-300 md:w-[250px] md:items-start md:p-6">
          <div className="mb-8 flex w-full items-center justify-center pt-4 md:justify-start md:pt-0">
            <img
              src={logoIcon}
              alt="Logo"
              className="mr-3 h-9 w-9 text-[#00FFA5] filter drop-shadow-[0_0_8px_rgba(0,255,165,0.4)] md:h-10 md:w-10"
            />
            <h1 className="hidden text-2xl font-bold text-white md:block">
              Smart
            </h1>
            <Menu className="block h-7 w-7 cursor-pointer text-gray-400 md:hidden" />
          </div>
          <nav className="flex w-full flex-col items-center space-y-2 md:items-start md:space-y-3">
            {filteredSideMenu.map((item, idx) => {
              const isActive = location.pathname === item.path;
              return (
                <a
                  key={idx}
                  href={item.path}
                  className={`flex w-full items-center justify-center rounded-lg py-3 transition-all duration-200 md:justify-start md:px-4 md:py-2 group
                  ${
                    isActive
                      ? "bg-[#0c4511] text-[#00FFA5] shadow-lg shadow-[#00FFA5]/20 border border-[#00FFA5]/50"
                      : "text-gray-300 hover:bg-[#1a2e20] hover:text-[#00FFA5] hover:shadow-md hover:shadow-[#00FFA5]/10"
                  }
                  ${isActive && "transform scale-[1.02]"}
                  `}
                >
                  {React.isValidElement(item.icon) ? (
                    item.icon
                  ) : (
                    <item.icon
                      className={`h-6 w-6 shrink-0 ${
                        isActive
                          ? "text-[#00FFA5]"
                          : "text-gray-400 group-hover:text-[#00FFA5]"
                      }`}
                    />
                  )}
                  <span className="ml-3 hidden text-lg font-[500] md:inline">
                    {item.label}
                  </span>
                </a>
              );
            })}
          </nav>
          <div className="mt-auto w-full pt-8">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="relative flex w-full items-center justify-center p-0.5 overflow-hidden text-lg font-medium rounded-full bg-gradient-to-br hover:text-white focus:ring-4 focus:outline-none shadow-xl  transition-all duration-300 md:justify-start md:px-0 md:py-0 group"
              title="Logout"
            >
              <span className="relative flex items-center justify-center px-6 py-3 transition-all ease-in duration-75 bg-black rounded-full group-hover:bg-opacity-0 text-white md:py-2.5 md:pl-4">
                <LogOut className="h-6 w-6 shrink-0 md:mr-3" />
                <span className="hidden md:inline">Logout</span>
              </span>
            </button>
          </div>
        </aside>
        <main className="min-h-screen w-full bg-gradient-to-b from-black to-[#0a130f] px-4 py-8 pl-[70px] md:px-10 md:py-10 md:pl-[250px] font-sans">
          {children}
        </main>
      </div>
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-xs sm:max-w-sm rounded-xl border border-[#0c4511] bg-[#0a130f] p-8 text-white shadow-2xl shadow-green-500/10 relative animate-scale-in">
            {" "}
            {/* Added subtle glow shadow */}
            <button
              onClick={() => setShowLogoutModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full hover:bg-[#1a2e20] transition-colors"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="mb-5 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-500 text-center">
              Confirm Log Out
            </h3>
            <p className="mb-7 text-gray-300 text-lg text-center">
              Are you sure you want to end your current session?
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-5 py-2.5 border border-[#0c4511] text-gray-300 rounded-lg font-medium hover:bg-[#1a2e20] hover:text-white transition-colors shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-gradient-to-r from-red-600 to-rose-500 text-white px-5 py-2.5 rounded-lg font-medium hover:from-red-700 hover:to-rose-600 transition-all duration-200 shadow-lg"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        /* Shared Animations */
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }
        /* Logo Glow */
        .filter.drop-shadow-\[0_0_8px_rgba\(0,255,165,0.4\)\] {
          filter: drop-shadow(0 0 8px rgba(0,255,165,0.4));
        }
      `}</style>
    </div>
  );
};

export default Layout;
