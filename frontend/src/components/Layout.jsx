import React, { useState } from "react"; // Import useState
import {
  Menu,
  Home,
  Users,
  Settings,
  LogOut, // Keep Lucide LogOut for the button icon
  Bell,
  Search,
  DollarSign,
  Flame,
  Send,
} from "lucide-react";

// --- IMPORTANT ---
// You need to adjust these import paths to correctly point to your assets
// For example:
import bellIcon from "../assets/Dashboard/bellIcon.png";
import SearchIcon from "../assets/Dashboard/SearchIcon.png";
import CoinIcon from "../assets/Dashboard/CoinIcon.png";
import FireIcon from "../assets/Dashboard/FireIcon.png";
import SendIcon from "../assets/Dashboard/SendIcon.png";
import MenuIcon from "../assets/Dashboard/MenuIcon.png";
import DashboardIcon from "../assets/Dashboard/DashboardIcon.png";
import FeedbackIcon from "../assets/Dashboard/FeedbackIcon.png";
import JsIcon from "../assets/Dashboard/JsIcon.png";
import MyRepoIcon from "../assets/Dashboard/MyRepoIcon.png";
import MyContentIcon from "../assets/Dashboard/MyContentIcon.png";
import MyBlogsIcon from "../assets/Dashboard/MyBlogsIcon.png";
import TeamsIcon from "../assets/Dashboard/TeamsIcon.png";
import ChallengesIcon from "../assets/Dashboard/ChallengesIcon.png";
import AnalyticsIcon from "../assets/Dashboard/AnalyticsIcon.png";
import SubscriptionsIcon from "../assets/Dashboard/SubscriptionsIcon.png";
import BookmarksIcon from "../assets/Dashboard/BookmarksIcon.png";
import icon from "../assets/logo.png";
import { useNavigate } from "react-router-dom";

const sideMenu = [
  { icon: DashboardIcon, label: "Dashboard", path: "/dashboard" },
  { icon: MyRepoIcon, label: "Users", path: "/user" },
  { icon: MyContentIcon, label: "Events", path: "/events" },
  { icon: MyBlogsIcon, label: "Placements", path: "/placements" },
  { icon: TeamsIcon, label: "Courses", path: "/courses" },
  { icon: FeedbackIcon, label: "Events", path: "/faculty/events" },
  { icon: ChallengesIcon, label: "Courses", path: "/students" },
  { icon: AnalyticsIcon, label: "Placement", path: "/students/placements" },
  {
    icon: SubscriptionsIcon,
    label: "Announcements",
    path: "/students/announcements",
  },
  { icon: BookmarksIcon, label: "Bookmarks", path: "/bookmarks" },
];

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content of the current page.
 * @param {string} props.currentPageTitle - The title for the main content area.
 */
const Layout = ({ children, currentPageTitle = "Dashboard" }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navigate = useNavigate();
  const handleLogout = () => {
    // Implement your actual logout logic here:
    // 1. Clear authentication token (e.g., localStorage.removeItem('token'))
    // 2. Clear any user-related state (e.g., from Redux, Context)
    // 3. Redirect to login page (e.g., using useNavigate from react-router-dom)
    console.log("User logging out...");
    localStorage.removeItem("token");
    navigate("/");
    // Example: Clear token
    // window.location.href = '/login'; // Example: Redirect to login page
    setShowLogoutModal(false); // Close the modal
    alert("You have been logged out."); // For demonstration, replace with a toast
  };

  return (
    <div className="min-h-screen bg-[#000] text-white">
      {/* Top Bar - Now part of the Layout */}

      <div className="flex pt-[90px]">
        <aside className="fixed bottom-0 left-0 z-10 flex w-[70px] flex-col items-center space-y-10 overflow-y-auto bg-gradient-to-b from-black to-[#0c4511] p-4 md:w-[250px] md:items-start md:p-6 md:pt-0 pt-0">
          {" "}
          {/* Adjusted pt-0 for sidebar content below header */}
          <div className="mb-6 flex w-full items-center justify-center md:justify-between">
            <h1 className="hidden text-[18px] font-[700] md:block">Menu</h1>
            <img src={MenuIcon} alt="Menu" className="h-[20px] w-[20px]" />
          </div>
          <nav className="flex w-full flex-col items-center space-y-10 md:items-start">
            {sideMenu.map((item, idx) => (
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
