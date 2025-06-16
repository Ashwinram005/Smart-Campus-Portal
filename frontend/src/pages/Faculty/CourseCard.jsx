    import React from "react";
    import {
    Plus, // While Plus is not used in CourseCard, it might have been here from a previous copy-paste. Remove if not needed.
    Edit,
    Trash2,
    X, // Not used in CourseCard, remove if not needed.
    BookOpen,
    Building,
    Calendar,
    Layers,
    Repeat,
    Download, // Not used in CourseCard, remove if not needed.
    // File icons (these are for CourseDetailsPage, not CourseCard, can be removed)
    // FileText,
    // FileImage,
    // FileVideo,
    // FileAudio,
    // File,
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
    onViewDetails, // <--- This prop needs to be here!
    course,
    userRole, // User role from token
    userId, // User ID from token
    handleFullEditClick,
    handleEditCourseName,
    handleSyncCourse,
    handleDeleteCourse,
    getDepartmentColor,
    }) => {
    const canPerformActions = userRole === "faculty";

    return (
        <div
        onClick={() => onViewDetails(course._id)} // <--- Corrected onClick for navigation
        className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 relative group transform hover:-translate-y-1 cursor-pointer"
        >
        {/* Action Buttons Container - only visible to faculty on hover */}
        {canPerformActions && (
            <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            {/* Add e.stopPropagation() to prevent card click from also triggering onViewDetails */}
            <button
                onClick={(e) => {
                e.stopPropagation();
                handleFullEditClick(course);
                }}
                className="text-gray-500 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 p-2 rounded-full transition-colors duration-200 shadow-sm"
                title="Edit Full Course Details"
            >
                <Edit className="w-5 h-5" />
            </button>
            <button
                onClick={(e) => {
                e.stopPropagation();
                handleEditCourseName(course._id);
                }}
                className="text-gray-500 hover:text-purple-600 bg-gray-100 hover:bg-purple-50 p-2 rounded-full transition-colors duration-200 shadow-sm"
                title="Edit Course Name"
            >
                <BookOpen className="w-5 h-5" />
            </button>
            <button
                onClick={(e) => {
                e.stopPropagation();
                handleSyncCourse(course._id);
                }}
                className="text-gray-500 hover:text-green-600 bg-gray-100 hover:bg-green-50 p-2 rounded-full transition-colors duration-200 shadow-sm"
                title="Sync Course"
            >
                <Repeat className="w-5 h-5" />
            </button>
            <button
                onClick={(e) => {
                e.stopPropagation();
                handleDeleteCourse(course._id);
                }}
                className="text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 p-2 rounded-full transition-colors duration-200 shadow-sm"
                title="Delete Course"
            >
                <Trash2 className="w-5 h-5" />
            </button>
            </div>
        )}

        <div className="flex items-start justify-between mb-4">
            <h3 className="text-xl font-extrabold text-gray-900 line-clamp-2 pr-10">
            {course.courseName}
            <span className="block text-sm font-medium text-gray-500 mt-1">
                ({course.courseCode})
            </span>
            </h3>
        </div>

        <div className="space-y-3 text-gray-700 text-sm">
            <div className="flex items-center">
            <Building className="w-4 h-4 mr-3 text-indigo-600" />
            <span>
                <span className="font-semibold">Department:</span>{" "}
                <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDepartmentColor(
                    course.department
                )}`}
                >
                {course.department}
                </span>
            </span>
            </div>
            <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-3 text-purple-600" />
            <span>
                <span className="font-semibold">Year:</span> {course.year}
            </span>
            </div>
            {course.description && (
            <div className="flex items-start">
                <Layers className="w-4 h-4 mr-3 mt-1 text-teal-600 flex-shrink-0" />
                <span>
                <span className="font-semibold">Description:</span>{" "}
                <p className="line-clamp-3">{course.description}</p>
                </span>
            </div>
            )}
        </div>
        </div>
    );
    };

    export default CourseCard;
