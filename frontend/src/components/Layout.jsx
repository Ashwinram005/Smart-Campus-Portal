import React from "react";
import {
  Menu,
  Home,
  Users,
  Settings,
  LogOut,
  Bell, // Placeholder if you want to use Lucide Bell in header
  Search, // Placeholder if you want to use Lucide Search in header
  DollarSign, // Placeholder for CoinIcon if using Lucide
  Flame, // Placeholder for FireIcon if using Lucide
  Send, // Placeholder for SendIcon if using Lucide
} from "lucide-react";

// --- IMPORTANT ---
// You need to adjust these import paths to correctly point to your assets
// For example:
import bellIcon from "../assets/Dashboard/bellIcon.png";
import SearchIcon from "../assets/Dashboard/SearchIcon.png";
import CoinIcon from "../assets/Dashboard/CoinIcon.png";
import FireIcon from "../assets/Dashboard/FireIcon.png";
import SendIcon from "../assets/Dashboard/SendIcon.png";
import MenuIcon from "../assets/Dashboard/MenuIcon.png"; // Assuming MenuIcon is an image as in your original sidebar
import DashboardIcon from "../assets/Dashboard/DashboardIcon.png";
import FeedbackIcon from "../assets/Dashboard/FeedbackIcon.png";
import JsIcon from "../assets/Dashboard/JsIcon.png"; // Assuming this is an image for sidebar
import MyRepoIcon from "../assets/Dashboard/MyRepoIcon.png";
import MyContentIcon from "../assets/Dashboard/MyContentIcon.png";
import MyBlogsIcon from "../assets/Dashboard/MyBlogsIcon.png";
import TeamsIcon from "../assets/Dashboard/TeamsIcon.png";
import ChallengesIcon from "../assets/Dashboard/ChallengesIcon.png";
import AnalyticsIcon from "../assets/Dashboard/AnalyticsIcon.png";
import SubscriptionsIcon from "../assets/Dashboard/SubscriptionsIcon.png";
import BookmarksIcon from "../assets/Dashboard/BookmarksIcon.png";
import icon from "../assets/logo.png"; // Your main logo

// Dummy sidebar menu data (using image paths now as in your original component)
const sideMenu = [
  { icon: DashboardIcon, label: "Dashboard", path: "/dashboard" },
  { icon: MyRepoIcon, label: "My Repositories", path: "/repositories" },
  { icon: MyContentIcon, label: "My Content", path: "/content" },
  { icon: MyBlogsIcon, label: "My Blogs", path: "/blogs" },
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
  return (
    <div className="min-h-screen bg-[#000] text-white">
      {/* Top Bar - Now part of the Layout */}
      <header className="fixed top-0 left-0 right-0 bg-gradient-to-b from-[#000000] to-black z-50 px-6 py-5 flex items-center gap-4">
        <img src={icon} alt="Logo" className="w-10 h-10 rounded-full" />
        <div className="flex-1 flex justify-center">
          <div className="relative w-full max-w-[480px]">
            <input
              type="text"
              placeholder="Search"
              className="w-full h-[50px] rounded-[15px] px-[30px] pr-[60px] bg-[#0f1f14] border border-[#91C9A6] text-[#9CBFA8] placeholder:text-[20px] text-[20px] leading-[50px] focus:outline-none"
            />
            {/* Using img for SearchIcon as in your original code */}
            <img
              src={SearchIcon}
              alt="Search"
              className="absolute top-1/2 right-[20px] -translate-y-1/2 w-[30px] h-[30px]"
            />
            {/* If you wanted to use Lucide, it would look like this: */}
            {/* <Search className="absolute top-1/2 right-[20px] -translate-y-1/2 w-[30px] h-[30px] text-[#9CBFA8]" /> */}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <img src={bellIcon} alt="Bell" className="w-[33px] h-[37px]" />
          {[CoinIcon, FireIcon, SendIcon].map(
            (
              iconSrc,
              i // Renamed to iconSrc to avoid conflict with Lucide icon
            ) => (
              <div
                key={i}
                className="w-[64px] h-[40px] rounded-[5px] px-[9px] flex items-center justify-around bg-[#263238] text-lg"
              >
                <img src={iconSrc} alt="" className="w-[16px] h-[16px]" />
                15
              </div>
            )
          )}
          <div className="w-[40px] h-[40px] rounded-[14px] bg-[#263238] px-[12px] py-[9px] flex items-center justify-center font-bold text-white text-[25px]">
            A
          </div>
        </div>
      </header>

      <div className="flex pt-[90px]">
        {" "}
        {/* This padding ensures content starts below the fixed header */}
        {/* Sidebar */}
        <aside className="flex flex-col items-center md:items-start w-[70px] md:w-[250px] bg-gradient-to-b from-black to-[#0c4511] p-4 md:p-6 fixed top-[90px] bottom-0 left-0 overflow-y-auto z-10 space-y-10">
          <div className="flex items-center justify-center md:justify-between w-full mb-6">
            <h1 className="hidden md:block text-[18px] font-[700]">Menu</h1>
            {/* Using img for MenuIcon as in your original code */}
            <img src={MenuIcon} alt="Menu" className="w-[20px] h-[20px]" />
          </div>

          <nav className="flex flex-col space-y-10 w-full items-center md:items-start">
            {sideMenu.map((item, idx) => (
              <a // Using 'a' tag for navigation, replace with Link from react-router-dom if you use it
                key={idx}
                href={item.path} // Replace with to={item.path} for React Router Link
                className="flex flex-col md:flex-row items-center md:space-x-3 hover:text-[#00FFA5] cursor-pointer transition-all"
              >
                {/* Using img for item.icon as in your original sidebar */}
                <img src={item.icon} alt={item.label} className="w-6 h-6" />
                <span className="hidden md:inline font-[400] text-[18px]">
                  {item.label}
                </span>
              </a>
            ))}
          </nav>
        </aside>
        {/* Main Content Area */}
        <main className="w-full md:pl-[250px] pl-[70px] px-10 py-10 bg-gradient-to-b from-black to-[#0c4511] min-h-screen space-y-10">
          {/* The actual page content will be rendered here */}
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
