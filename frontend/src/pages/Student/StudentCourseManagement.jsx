import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  BookOpen,
  ClipboardList,
  Paperclip,
  X,
  Send,
  Loader2,
  ListOrdered,
  CalendarDays,
  FileText,
  User,
  Hash,
  FileVideo,
  FileText as FileDoc,
  Link,
  UploadCloud,
  CheckCircle,
  Eye, // For viewing my submissions
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import toast, { Toaster } from "react-hot-toast";
import { twMerge } from "tailwind-merge";

/**
 * @typedef {Object} Course
 * @property {string} _id
 * @property {string} title
 * @property {string} courseName
 * @property {string} description
 * @property {string} instructorId
 * @property {string} instructorName
 * @property {string[]} students
 * @property {Material[]} materials
 * @property {Assignment[]} assignments
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string} department
 * @property {string} year
 */

/**
 * @typedef {Object} Material
 * @property {string} _id
 * @property {string} name
 * @property {string} title
 * @property {string} description
 * @property {string} type // e.g., 'video', 'doc', 'link', 'text'
 * @property {string} fileUrl // URL for files or external links
 * @property {string} content // For direct text content (if applicable)
 * @property {string} uploadedAt
 * @property {string} uploadedBy
 */

/**
 * @typedef {Object} Assignment
 * @property {string} _id
 * @property {string} title
 * @property {string} description
 * @property {string} dueDate
 * @property {Object.<string, string>} submissions // studentId: submissionContent or fileUrl (primary source on backend)
 * @property {string} createdAt
 * @property {string} updatedAt // Used for inferring submission date if not stored per-student
 */

/**
 * @typedef {Object} CurrentUserSingleSubmission // Structure of response from fetchMySingleSubmission API
 * @property {string} _id
 * @property {string} fileUrl
 * @property {string} submittedAt
 * @property {string} student
 * @property {Object} assignment // nested assignment object as in your example
 * @property {string} assignment._id
 * @property {string} assignment.title
 * @property {string} assignment.course // Add course ID if your backend returns it in the nested assignment object
 */

// Cloudinary Configuration for Direct Unsigned Upload
const CLOUDINARY_CLOUD_NAME = "dzeweglcv"; // REPLACE WITH YOUR CLOUD NAME
const CLOUDINARY_UPLOAD_PRESET = "SmartcampusPortal"; // REPLACE WITH YOUR UNSIGNED UPLOAD PRESET NAME
// IMPORTANT: Ensure this preset is configured for "Unsigned" uploads in your Cloudinary dashboard.

const StudentCourseManagement = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCourseMaterials, setSelectedCourseMaterials] = useState([]);
  const [selectedCourseAssignments, setSelectedCourseAssignments] = useState(
    []
  );
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [showAssignmentsModal, setShowAssignmentsModal] = useState(false);
  const [showAssignmentSubmissionModal, setShowAssignmentSubmissionModal] =
    useState(false);
  const [currentAssignmentForSubmission, setCurrentAssignmentForSubmission] =
    useState(null);
  const [submissionContent, setSubmissionContent] = useState("");
  const [submittedFileUrl, setSubmittedFileUrl] = useState("");
  const [userRole, setUserRole] = useState("student");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  const [mySubmissionsMap, setMySubmissionsMap] = useState({}); // Stores submissions for the Assignments Modal
  const [showMySubmissionsModal, setShowMySubmissionsModal] = useState(false); // New state for All My Submissions modal
  const [allMySubmissions, setAllMySubmissions] = useState([]); // New state for all submissions data

  const token = localStorage.getItem("token");
  const API_BASE_URL = "http://localhost:5000/api";

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const role = decodedToken.role;

        if (role) {
          setUserRole(role);
        } else {
          console.warn('JWT token found but no "role" property in payload.');
        }
      } catch (error) {
        console.error("Failed to decode JWT token:", error);
        toast.error("Authentication error. Please log in again.");
        setLoading(false);
      }
    } else {
      toast.error("You must be logged in to view your courses.");
      setLoading(false);
    }
  }, [token]);

  const fetchEnrolledCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/courses/student`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setEnrolledCourses(data || []);
    } catch (err) {
      console.error("Failed to fetch enrolled courses:", err);
      setError(
        err.message || "Failed to load courses. Please try again later."
      );
      toast.error(err.message || "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  }, [token, API_BASE_URL]);

  useEffect(() => {
    if (userRole === "student") {
      fetchEnrolledCourses();
    }
  }, [userRole, fetchEnrolledCourses]);

  const fetchCourseMaterials = useCallback(
    async (courseId) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/materials/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setSelectedCourseMaterials(data.materials || data || []);
      } catch (err) {
        console.error("Failed to fetch course materials:", err);
        setError(err.message || "Failed to load materials.");
        toast.error(err.message || "Failed to load materials.");
        setSelectedCourseMaterials([]);
      } finally {
        setLoading(false);
      }
    },
    [token, API_BASE_URL]
  );

  // Function to fetch a single submission for the current user and assignment
  const fetchMySingleSubmission = useCallback(
    async (assignmentId) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/assignments/submissions/mine`, // Your new endpoint
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 404) {
          // No submission found for this user/assignment
          return null;
        }
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data; // Expected: CurrentUserSingleSubmission object
      } catch (err) {
        console.error(
          `Failed to fetch my submission for ${assignmentId}:`,
          err
        );
        return null;
      }
    },
    [token, API_BASE_URL]
  );

  // fetchCourseAssignments remains unchanged as per previous request
  const fetchCourseAssignments = useCallback(
    async (courseId) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_BASE_URL}/assignments/course/${courseId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setSelectedCourseAssignments(data || []);
      } catch (err) {
        console.error("Failed to fetch course assignments:", err);
        setError(err.message || "Failed to load assignments.");
        toast.error(err.message || "Failed to load assignments.");
        setSelectedCourseAssignments([]);
      } finally {
        setLoading(false);
      }
    },
    [token, API_BASE_URL]
  );

  // NEW: Function to fetch ALL submissions for the current user
  const fetchAllMySubmissions = useCallback(async () => {
    setLoading(true); // Indicate loading for this specific modal
    setError(null);
    try {
      // THIS IS YOUR NEW API ENDPOINT for all submissions by a student
      const response = await fetch(
        `${API_BASE_URL}/assignments/submissions/mine`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(data);
      setAllMySubmissions(data || []); // Set the data for the new modal
    } catch (err) {
      console.error("Failed to fetch all my submissions:", err);
      setError(err.message || "Failed to load all your submissions.");
      toast.error(err.message || "Failed to load your submissions.");
      setAllMySubmissions([]);
    } finally {
      setLoading(false); // End loading
    }
  }, [token, API_BASE_URL]);

  const handleViewMaterials = (course) => {
    setSelectedCourse(course);
    fetchCourseMaterials(course._id);
    setShowMaterialsModal(true);
  };

  const handleViewAssignments = async (course) => {
    setSelectedCourse(course);
    // Fetch base assignments
    await fetchCourseAssignments(course._id);

    // After assignments are loaded, fetch my submissions for each and populate the map
    const assignmentsToFetchSubmissionsFor = await (
      await fetch(`${API_BASE_URL}/assignments/course/${course._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).json();

    const submissionsPromises = assignmentsToFetchSubmissionsFor.map(
      async (assignment) => {
        const submission = await fetchMySingleSubmission(assignment._id);
        if (submission) {
          return { assignmentId: assignment._id, submission: submission };
        }
        return null;
      }
    );

    const results = await Promise.all(submissionsPromises);
    const newMySubmissionsMap = {};
    results.forEach((res) => {
      if (res) {
        newMySubmissionsMap[res.assignmentId] = res.submission;
      }
    });
    setMySubmissionsMap(newMySubmissionsMap); // Update the map
    setShowAssignmentsModal(true);
  };

  const handleOpenMySubmissionsModal = async () => {
    await fetchAllMySubmissions(); // Fetch all submissions when button is clicked
    setShowMySubmissionsModal(true);
  };

  const handleOpenSubmissionForm = (assignment) => {
    setCurrentAssignmentForSubmission(assignment);
    // Use data from mySubmissionsMap for pre-filling
    const existingSubmissionData = mySubmissionsMap[assignment._id];
    const existingSubmissionContent = existingSubmissionData
      ? existingSubmissionData.fileUrl
      : "";

    if (
      existingSubmissionContent &&
      (existingSubmissionContent.startsWith("http://") ||
        existingSubmissionContent.startsWith("https://"))
    ) {
      setSubmittedFileUrl(existingSubmissionContent);
      setSubmissionContent("");
    } else {
      setSubmissionContent(existingSubmissionContent || "");
      setSubmittedFileUrl("");
    }
    setShowAssignmentSubmissionModal(true);
  };

  const handleFileChange = async (file) => {
    if (!file) return;

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      toast.error(
        "Cloudinary configuration missing. Check CLOUD_NAME and UPLOAD_PRESET."
      );
      return;
    }

    const validFileTypes = [
      "image/",
      "video/",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const isFileTypeValid = validFileTypes.some(
      (type) => file.type.startsWith(type) || file.type === type
    );

    if (!isFileTypeValid) {
      toast.error(
        "Unsupported file type. Please upload an image, video, PDF, or Word document."
      );
      return;
    }

    setUploadingFile(true);
    setError(null);
    toast.loading("Uploading file to Cloudinary...", { id: "file-upload" });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error
            ? errorData.error.message
            : `Cloudinary upload failed: ${response.status}`
        );
      }

      const data = await response.json();
      const newFileUrl = data.secure_url;

      setSubmittedFileUrl(newFileUrl);
      setSubmissionContent("");
      toast.success("File uploaded successfully to Cloudinary!", {
        id: "file-upload",
      });
    } catch (err) {
      console.error("Error uploading file to Cloudinary:", err);
      setError(err.message || "An error occurred during file upload.");
      toast.error(err.message || "Failed to upload file.", {
        id: "file-upload",
      });
      setSubmittedFileUrl("");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploadingFile && !submittedFileUrl) {
      e.currentTarget.classList.add("border-blue-500", "bg-blue-50");
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("border-blue-500", "bg-blue-50");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("border-blue-500", "bg-blue-50");

    if (
      e.dataTransfer.files &&
      e.dataTransfer.files.length > 0 &&
      !uploadingFile &&
      !submittedFileUrl
    ) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileChange(droppedFile);
      e.dataTransfer.clearData();
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!currentAssignmentForSubmission || !selectedCourse) {
      toast.error("Invalid submission context or user not identified.");
      return;
    }

    const finalSubmissionContent = submittedFileUrl || submissionContent.trim();

    if (!finalSubmissionContent) {
      toast.error("Submission content or a file is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        fileUrl: finalSubmissionContent,
      };

      const response = await fetch(
        `${API_BASE_URL}/assignments/submissions/${currentAssignmentForSubmission._id}`,
        {
          method: "POST", // Or PUT if updating existing submission
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to submit assignment: ${response.status}`
        );
      }

      toast.success("Assignment submitted successfully!");
      closeModal(setShowAssignmentSubmissionModal);
      // Manually update the mySubmissionsMap for the specific assignment
      setMySubmissionsMap((prevMap) => ({
        ...prevMap,
        [currentAssignmentForSubmission._id]: {
          assignment: {
            _id: currentAssignmentForSubmission._id,
            title: currentAssignmentForSubmission.title,
            course: selectedCourse._id, // Add course ID to nested assignment for "All My Submissions" modal if needed
          },

          fileUrl: finalSubmissionContent,
          submittedAt: payload.submittedAt,
          _id: "temp_submission_id_" + Date.now(), // Give a temporary ID for client-side mapping
        },
      }));
      // Also update the allMySubmissions list for the new modal if it's open
      setAllMySubmissions((prev) => {
        const existingIndex = prev.findIndex(
          (s) => s.assignment._id === currentAssignmentForSubmission._id
        );
        const newSubmission = {
          assignment: {
            _id: currentAssignmentForSubmission._id,
            title: currentAssignmentForSubmission.title,
            course: selectedCourse._id,
          },
          fileUrl: finalSubmissionContent,
          submittedAt: payload.submittedAt,
          _id: "temp_submission_id_" + Date.now(), // Give a temporary ID for client-side mapping
        };
        if (existingIndex > -1) {
          const updated = [...prev];
          updated[existingIndex] = newSubmission;
          return updated;
        } else {
          return [...prev, newSubmission];
        }
      });
    } catch (err) {
      console.error("Error submitting assignment:", err);
      setError(err.message || "An error occurred during submission.");
      toast.error(err.message || "Failed to submit assignment.");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = (modalSetter) => {
    modalSetter(false);
    setSelectedCourse(null);
    setSelectedCourseMaterials([]);
    setSelectedCourseAssignments([]);
    setCurrentAssignmentForSubmission(null);
    setSubmissionContent("");
    setSubmittedFileUrl("");
    setUploadingFile(false);
    // Only clear mySubmissionsMap if closing Assignments modal specifically
    // If closing AllMySubmissionsModal, it handles its own state
    if (modalSetter === setShowAssignmentsModal) {
      setMySubmissionsMap({});
    } else if (modalSetter === setShowMySubmissionsModal) {
      setAllMySubmissions([]); // Clear when AllMySubmissionsModal is closed
    }
  };

  const getMaterialIcon = (type) => {
    switch (type) {
      case "video":
        return <FileVideo className="w-5 h-5 mr-4 text-purple-600" />;
      case "doc":
        return <FileDoc className="w-5 h-5 mr-4 text-blue-600" />;
      case "link":
        return <Link className="w-5 h-5 mr-4 text-green-600" />;
      default:
        return <Paperclip className="w-5 h-5 mr-4 text-gray-600" />;
    }
  };

  if (userRole !== "student") {
    return (
      <div className="p-4 sm:p-6 space-y-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <Toaster position="top-right" />
        <div className="text-center bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <User className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You must be logged in as a student to view this page.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Please log in with appropriate credentials.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-gray-50 min-h-screen font-sans">
      <Toaster position="top-right" />

      <div className="pb-4 border-b border-gray-200 flex justify-between items-center">
        {" "}
        {/* Added flex for alignment */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
          My Enrolled Courses
        </h1>
        {/* NEW: My Submissions Button */}
        <button
          onClick={handleOpenMySubmissionsModal}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200 shadow-md transform hover:scale-105"
        >
          <Eye className="w-5 h-5 mr-2" />
          My Submissions
        </button>
      </div>
      <p className="text-gray-600 mt-2 text-base sm:text-lg">
        View your courses, materials, and assignments.
      </p>

      {loading && (
        <div className="text-center py-16">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="mt-4 text-xl font-medium text-gray-700">
            Loading your courses...
          </p>
        </div>
      )}

      {!loading && !error && (
        <>
          {enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <div
                  key={course._id}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex items-center mb-3">
                    <BookOpen className="w-6 h-6 text-indigo-600 mr-3" />
                    <h3 className="text-xl font-extrabold text-gray-900">
                      {course.courseName || course.title}{" "}
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {course.department}
                  </p>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {course.courseCode}
                  </p>
                  <div className="text-gray-700 text-sm space-y-2">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-blue-500" />
                      <span>{course.year || "N/A"}</span>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleViewMaterials(course)}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-purple-500 text-white font-medium rounded-lg hover:bg-purple-600 transition-colors duration-200 shadow-md transform hover:scale-105"
                    >
                      <Paperclip className="w-5 h-5 mr-2" />
                      View Materials
                    </button>
                    <button
                      onClick={() => handleViewAssignments(course)}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-md transform hover:scale-105"
                    >
                      <ClipboardList className="w-5 h-5 mr-2" />
                      View Assignments
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="col-span-full text-center py-20 bg-white rounded-xl shadow-md p-6">
              <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-700 mb-3">
                No Courses Enrolled
              </h3>
              <p className="text-gray-500 text-lg">
                It looks like you haven't enrolled in any courses yet.
              </p>
            </div>
          )}
        </>
      )}

      {/* Materials Modal (No changes) */}
      {showMaterialsModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-[100]">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl relative animate-fade-in-up overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => closeModal(setShowMaterialsModal)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">
              Materials for "{selectedCourse.courseName || selectedCourse.title}
              "
            </h2>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-gray-600">Loading materials...</p>
              </div>
            ) : selectedCourseMaterials.length > 0 ? (
              <ul className="space-y-4">
                {selectedCourseMaterials.map((material) => (
                  <li
                    key={material._id}
                    className="flex items-start p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    {getMaterialIcon(material.type)}
                    <div className="flex-1">
                      <p className="font-semibold text-lg text-gray-800">
                        {material.title || material.name}{" "}
                      </p>
                      <p className="text-gray-600 text-sm mb-2">
                        {material.description}
                      </p>
                      {material.type === "link" || material.fileUrl ? (
                        <a
                          href={material.fileUrl || material.content}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium"
                        >
                          {material.type === "video" && "Watch Video"}
                          {material.type === "doc" && "View Document"}
                          {material.type === "link" && "Open Link"}
                          {!material.type && "Access Material"}
                          <Link className="w-3 h-3 ml-1" />
                        </a>
                      ) : (
                        <p className="text-gray-700 text-sm italic">
                          {material.content || "No direct content/file."}
                        </p>
                      )}
                      <span className="text-xs text-gray-500 mt-1 block">
                        Uploaded:{" "}
                        {new Date(material.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-10">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg text-gray-600">
                  No materials available for this course yet.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assignments Modal */}
      {showAssignmentsModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-[100]">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl relative animate-fade-in-up overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => closeModal(setShowAssignmentsModal)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">
              Assignments for "
              {selectedCourse.courseName || selectedCourse.title}"
            </h2>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-gray-600">Loading assignments...</p>
              </div>
            ) : selectedCourseAssignments.length > 0 ? (
              <ul className="space-y-4">
                {selectedCourseAssignments.map((assignment) => {
                  // Get submission data for THIS assignment from mySubmissionsMap
                  const mySubmissionData = mySubmissionsMap[assignment._id];

                  const hasSubmitted = !!mySubmissionData; // True if an entry exists in the map
                  const currentUserSubmissionContent = mySubmissionData
                    ? mySubmissionData.fileUrl // Use fileUrl from the submission object
                    : null;
                  const currentUserSubmissionDate = mySubmissionData
                    ? mySubmissionData.submittedAt
                    : null;

                  const submissionStatusClasses = twMerge(
                    "px-3 py-1 rounded-full text-xs font-semibold border inline-flex items-center",
                    hasSubmitted
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-red-100 text-red-800 border-red-200"
                  );

                  return (
                    <li
                      key={assignment._id}
                      className="p-5 bg-gray-50 rounded-lg border border-gray-200 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-extrabold text-lg text-gray-900 pr-4">
                          {assignment.title}
                        </h3>
                        <span className={submissionStatusClasses}>
                          {hasSubmitted && (
                            <CheckCircle className="w-4 h-4 mr-1" />
                          )}
                          {hasSubmitted ? "Completed" : "Pending"}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm mb-3">
                        {assignment.description}
                      </p>
                      <div className="flex items-center text-gray-600 text-sm mb-2">
                        <CalendarDays className="w-4 h-4 mr-2" />
                        <span className="font-medium">Due Date:</span>{" "}
                        {new Date(assignment.dueDate).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </div>

                      {/* My Submission block is always rendered */}

                      <div className="mt-6">
                        <button
                          onClick={() => handleOpenSubmissionForm(assignment)}
                          disabled={hasSubmitted}
                          className={twMerge(
                            "inline-flex items-center px-4 py-2 rounded-lg font-medium shadow-md transition-colors duration-200",
                            hasSubmitted
                              ? "bg-yellow-500 hover:bg-yellow-600 text-white cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          )}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {hasSubmitted ? "Submitted" : "Submit Assignment"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-center py-10">
                <ListOrdered className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg text-gray-600">
                  No assignments posted for this course yet.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEW: All My Submissions Modal */}
      {showMySubmissionsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-[100]">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-3xl shadow-2xl relative animate-fade-in-up overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => closeModal(setShowMySubmissionsModal)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">
              All My Submissions
            </h2>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-gray-600">Loading your submissions...</p>
              </div>
            ) : allMySubmissions.length > 0 ? (
              <ul className="space-y-4">
                {allMySubmissions.map((submission) => (
                  <li
                    key={submission._id}
                    className="p-5 bg-gray-50 rounded-lg border border-gray-200 shadow-sm"
                  >
                    <div className="flex items-start mb-3">
                      <ClipboardList className="w-5 h-5 mr-3 text-blue-600" />
                      <div className="flex-1">
                        <h3 className="font-extrabold text-lg text-gray-900">
                          {submission.assignment.title}{" "}
                          <span className="font-medium text-base text-gray-600">
                            (Course ID:{" "}
                            {submission.assignment.course?.substring(0, 8)}...){" "}
                            {/* Display course ID part */}
                          </span>
                        </h3>
                        {/* Check if submission content is a URL or text */}
                        {submission.fileUrl.startsWith("http://") ||
                        submission.fileUrl.startsWith("https://") ? (
                          <a
                            href={submission.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:underline text-sm font-medium mt-2"
                          >
                            <Paperclip className="w-4 h-4 mr-2" />
                            View Submitted File
                          </a>
                        ) : (
                          <p className="text-gray-700 text-sm whitespace-pre-wrap break-words mt-2">
                            {submission.fileUrl}
                          </p>
                        )}
                        {submission.submittedAt && (
                          <p className="text-xs text-gray-500 mt-2">
                            Submitted on:{" "}
                            {new Date(submission.submittedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-10">
                <ListOrdered className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg text-gray-600">
                  You haven't submitted any assignments yet.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assignment Submission Modal */}
      {showAssignmentSubmissionModal && currentAssignmentForSubmission && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-[100]">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-xl shadow-2xl relative animate-fade-in-up overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => closeModal(setShowAssignmentSubmissionModal)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 text-center">
              Submit Assignment: "{currentAssignmentForSubmission.title}"
            </h2>
            <p className="text-gray-600 text-center mb-6">
              {currentAssignmentForSubmission.description}
            </p>
            <form onSubmit={handleSubmitAssignment} className="space-y-6">
              {/* Drag and Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={twMerge(
                  "flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg text-center transition-all duration-200",
                  (uploadingFile || submittedFileUrl) &&
                    "opacity-70 cursor-not-allowed",
                  !(uploadingFile || submittedFileUrl) &&
                    "bg-gray-50 hover:bg-gray-100"
                )}
              >
                {!uploadingFile && !submittedFileUrl && (
                  <>
                    <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Drag & Drop your file here
                    </p>
                    <p className="text-sm text-gray-500 mb-3">or</p>
                    <button
                      type="button"
                      onClick={handleBrowseClick}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                      disabled={uploadingFile || !!submittedFileUrl}
                    >
                      Browse Files
                    </button>
                  </>
                )}
                {uploadingFile && (
                  <div className="flex flex-col items-center">
                    <Loader2 className="animate-spin h-8 w-8 text-blue-600 mb-3" />
                    <p className="text-gray-700 font-medium">
                      Uploading file...
                    </p>
                  </div>
                )}
                {submittedFileUrl && !uploadingFile && (
                  <div className="flex items-center space-x-3 bg-green-50 text-green-800 p-3 rounded-md w-full">
                    <Paperclip className="w-5 h-5" />
                    <span className="flex-1 text-sm truncate">
                      File uploaded:{" "}
                      <a
                        href={submittedFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        {submittedFileUrl.substring(
                          submittedFileUrl.lastIndexOf("/") + 1
                        )}
                      </a>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSubmittedFileUrl("")}
                      className="text-red-500 hover:text-red-700"
                      title="Remove uploaded file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files[0])}
                  disabled={uploadingFile || !!submittedFileUrl}
                  accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                />
              </div>

              <div className="relative text-center text-gray-500">
                <span className="inline-block px-2 bg-white z-10 relative">
                  OR
                </span>
                <div className="absolute inset-y-1/2 left-0 right-0 h-px bg-gray-200 -z-0"></div>
              </div>

              {/* Text Area Input */}
              <div>
                <label
                  htmlFor="submissionContent"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Your Text Submission
                </label>
                <textarea
                  id="submissionContent"
                  rows="6"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400"
                  placeholder="Type or paste your assignment content here..."
                  value={submissionContent}
                  onChange={(e) => {
                    setSubmissionContent(e.target.value);
                    if (e.target.value.trim() !== "") {
                      setSubmittedFileUrl("");
                    }
                  }}
                  disabled={uploadingFile || !!submittedFileUrl}
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">
                  You can submit either a file or text, but not both.
                </p>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => closeModal(setShowAssignmentSubmissionModal)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    loading ||
                    uploadingFile ||
                    (!submissionContent.trim() && !submittedFileUrl)
                  }
                  className="inline-flex items-center bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(loading || uploadingFile) && (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  )}
                  {mySubmissionsMap[currentAssignmentForSubmission?._id]
                    ? "Update Submission"
                    : "Submit Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCourseManagement;
