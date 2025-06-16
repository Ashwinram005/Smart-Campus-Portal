import React from "react";
import {
  Edit,
  Trash2,
  BookOpen, // For Course Name edit or general book icon
  Repeat, // For Sync Course
  Building2, // Department icon (more specific than Building)
  CalendarDays, // Year icon (more specific than Calendar)
  Layers, // Description icon
} from "lucide-react";

/**
 * @typedef {Object} Course
 * @property {string} _id - Unique identifier for the course
 * @property {string} courseCode - e.g., "CSE301"
 * @property {string} courseName - e.g., "Database Management Systems"
 * @property {string} department - e.g., "ECE", "CSE"
 * @property {number} year - e.g., 1, 2, 3, 4
 * @property {string} [description] - Optional course description
 * @property {string} createdBy - User ID who created the record
 * @property {string} createdByRole - Role of the user who created it (e.g., 'admin', 'faculty', 'student')
 * @property {string} createdAt - Timestamp of creation
 * @property {string} updatedAt - Timestamp of last update
 */

// --- CourseCard Component (Inner Component) ---
const CourseCard = ({
  onViewDetails,
  course,
  userRole,
  userId,
  handleFullEditClick,
  handleEditCourseName,
  handleSyncCourse,
  handleDeleteCourse,
  getDepartmentColor, // This function should be passed from the parent component
}) => {
  const canPerformActions = userRole === "faculty" || userRole === "admin"; // Admins can also perform actions

  return (
    <div
      onClick={() => onViewDetails(course._id)}
      className="bg-[#0a130f] rounded-3xl p-6 border border-[#0c4511] shadow-2xl hover:shadow-[#00FFA5]/30 transition-all duration-300 relative group transform hover:-translate-y-2 cursor-pointer overflow-hidden"
    >
      {/* Action Buttons Container - only visible to authorized roles on hover */}
      {canPerformActions && (
        <div className="absolute top-5 right-5 flex space-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleFullEditClick(course);
            }}
            className="text-gray-400 hover:text-[#00FFA5] bg-[#1a2e20] hover:bg-[#1f2d23] p-3 rounded-full transition-colors duration-200 shadow-md"
            title="Edit Full Course Details"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditCourseName(course._id);
            }}
            className="text-gray-400 hover:text-purple-400 bg-[#1a2e20] hover:bg-[#1f2d23] p-3 rounded-full transition-colors duration-200 shadow-md"
            title="Edit Course Name"
          >
            <BookOpen className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSyncCourse(course._id);
            }}
            className="text-gray-400 hover:text-cyan-400 bg-[#1a2e20] hover:bg-[#1f2d23] p-3 rounded-full transition-colors duration-200 shadow-md"
            title="Sync Course (If Applicable)"
          >
            <Repeat className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteCourse(course._id);
            }}
            className="text-gray-400 hover:text-red-400 bg-[#1a2e20] hover:bg-red-900 p-3 rounded-full transition-colors duration-200 shadow-md"
            title="Delete Course"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex items-start justify-between mb-5">
        <h3 className="text-2xl font-extrabold text-white line-clamp-2 pr-10">
          {course.courseName}
          <span className="block text-base font-medium text-gray-400 mt-1">
            ({course.courseCode})
          </span>
        </h3>
      </div>

      <div className="space-y-4 text-gray-400 text-sm">
        <div className="flex items-center">
          <Building2 className="w-4 h-4 mr-3 text-indigo-400" />
          <span>
            <span className="font-semibold text-gray-300">Department:</span>{" "}
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${getDepartmentColor(
                course.department
              )} bg-[#0a130f]`}
            >
              {course.department}
            </span>
          </span>
        </div>
        <div className="flex items-center">
          <CalendarDays className="w-4 h-4 mr-3 text-purple-400" />
          <span>
            <span className="font-semibold text-gray-300">Year:</span>{" "}
            {course.year}
          </span>
        </div>
        {course.description && (
          <div className="flex items-start">
            <Layers className="w-4 h-4 mr-3 mt-1 text-teal-400 flex-shrink-0" />
            <span>
              <span className="font-semibold text-gray-300">Description:</span>{" "}
              <p className="line-clamp-3">{course.description}</p>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCard;
