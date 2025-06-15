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
  { icon: TeamsIcon, label: "Teams", path: "/teams" },
  { icon: ChallengesIcon, label: "Challenges", path: "/challenges" },
  { icon: AnalyticsIcon, label: "Analytics", path: "/analytics" },
  { icon: SubscriptionsIcon, label: "Subscriptions", path: "/subscriptions" },
  { icon: FeedbackIcon, label: "Feedback", path: "/feedback" },
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
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center gap-4 bg-gradient-to-b from-[#000000] to-black px-6 py-5">
        <img src={icon} alt="Logo" className="h-10 w-10 rounded-full" />
        <div className="flex flex-1 justify-center">
          <div className="relative w-full max-w-[480px]">
            <input
              type="text"
              placeholder="Search"
              className="h-[50px] w-full rounded-[15px] border border-[#91C9A6] bg-[#0f1f14] px-[30px] pr-[60px] text-[20px] leading-[50px] placeholder:text-[20px] focus:outline-none text-[#9CBFA8]"
            />
            <img
              src={SearchIcon}
              alt="Search"
              className="absolute right-[20px] top-1/2 h-[30px] w-[30px] -translate-y-1/2"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <img src={bellIcon} alt="Bell" className="h-[37px] w-[33px]" />
          {[CoinIcon, FireIcon, SendIcon].map((iconSrc, i) => (
            <div
              key={i}
              className="flex h-[40px] w-[64px] items-center justify-around rounded-[5px] bg-[#263238] px-[9px] text-lg"
            >
              <img src={iconSrc} alt="" className="h-[16px] w-[16px]" />
              15
            </div>
          ))}
          <div className="flex h-[40px] w-[40px] items-center justify-center rounded-[14px] bg-[#263238] px-[12px] py-[9px] text-[25px] font-bold text-white">
            A
          </div>
          {/* Logout Button */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center space-x-2 rounded-lg bg-red-600 px-3 py-2 font-medium text-white shadow-lg transition-all duration-200 hover:bg-red-700"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </header>

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
