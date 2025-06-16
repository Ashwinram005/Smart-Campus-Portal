// CourseDetailsPage.js
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  UploadCloud,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  File,
  X,
  Trash2,
  Building,
  Calendar,
  Layers,
  ChevronLeft,
  Loader2,
  GraduationCap, // For assignments
  Clock, // For due date
  ClipboardCheck, // For submissions
  Download, // For downloading submissions
  Link, // For link materials
  Mail, // For contacting not submitted students
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import toast, { Toaster } from "react-hot-toast";

/**
 * @typedef {Object} CourseMaterial
 * @property {string} _id - Unique identifier for the material
 * @property {string} fileName - Original file name (or title if that's what you store)
 * @property {string} fileUrl - Cloudinary URL for the file (or URL for link type)
 * @property {string} publicId - Cloudinary public ID for the file (null for link type)
 * @property {string} uploadedBy - User ID who uploaded the material
 * @property {string} uploadedByRole - Role of the user who uploaded it
 * @property {string} createdAt - Timestamp of upload
 * @property {string} title - The title of the material as entered by the user
 * @property {string} description - The description of the material as entered by the user
 * @property {string} type - The simplified type of the material (e.g., "pdf", "video", "doc", "link")
 */

/**
 * @typedef {Object} Assignment
 * @property {string} _id
 * @property {string} courseId
 * @property {string} title
 * @property {string} description
 * @property {string} dueDate - ISO date string
 * @property {string} createdBy - Faculty ID
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Submission
 * @property {string} _id
 * @property {string} assignmentId
 * @property {Object} student - Populated student object
 * @property {string} student._id
 * @property {string} student.name
 * @property {string} student.email
 * @property {string} student.studentId
 * @property {string} fileUrl
 * @property {string} publicId
 * @property {string} fileName // Original file name
 * @property {string} comments
 * @property {string} submittedAt
 * @property {number} [marks]
 * @property {string} [feedback]
 */

/**
 * @typedef {Object} NotSubmittedStudent
 * @property {string} _id - Student user ID
 * @property {string} name
 * @property {string} email
 * @property {string} studentId
 */

const API_BASE_URL = "http://localhost:5000/api";

// --- Cloudinary Configuration (Confirmed from your code) ---
const CLOUDINARY_CLOUD_NAME = "dzeweglcv";
const CLOUDINARY_UPLOAD_PRESET = "SmartcampusPortal";

// --- Helper Functions ---

/**
 * Maps MIME types to your custom file type enum.
 * @param {string} mimeType - The MIME type of the file.
 * @returns {string} One of ["pdf", "doc", "ppt", "video", "audio", "image", "other", "link"].
 * Note: 'link' type won't come from file input, but added for completeness if your enum includes it.
 */
const mapMimeTypeToCustomType = (mimeType) => {
  if (!mimeType) return "other";

  if (mimeType === "application/pdf") {
    return "pdf";
  }
  if (
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "doc";
  }
  if (
    mimeType === "application/vnd.ms-powerpoint" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return "ppt";
  }
  if (mimeType.startsWith("video/")) {
    return "video";
  }
  if (mimeType.startsWith("audio/")) {
    return "audio";
  }
  if (mimeType.startsWith("image/")) {
    return "image";
  }
  // Add more specific mappings if needed for other common document types (e.g., excel, text)
  if (
    mimeType === "application/vnd.ms-excel" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return "doc"; // Grouping excel with docs for simplicity, adjust if you need 'xls' type
  }
  if (mimeType === "text/plain") {
    return "doc"; // Grouping text with docs
  }

  return "other";
};

// Adjusted getFileIcon to use the custom type for better matching
const getFileIcon = (customType) => {
  switch (customType) {
    case "pdf":
      return <FileText className="w-8 h-8" />;
    case "image":
      return <FileImage className="w-8 h-8" />;
    case "video":
      return <FileVideo className="w-8 h-8" />;
    case "audio":
      return <FileAudio className="w-8 h-8" />;
    case "doc": // Covers Word, Excel, Text
      return <FileText className="w-8 h-8" />; // Using FileText for generic docs
    case "ppt":
      return <FileText className="w-8 h-8" />; // Using FileText, consider a specific icon if available
    case "link":
      return <Link className="w-8 h-8" />; // Specific icon for links
    default:
      return <File className="w-8 h-8" />;
  }
};

// Adjusted getFileTypeLabel to use the custom type for display
const getFileTypeLabel = (customType) => {
  switch (customType) {
    case "pdf":
      return "PDF Document";
    case "doc":
      return "Document";
    case "ppt":
      return "Presentation";
    case "video":
      return "Video File";
    case "audio":
      return "Audio File";
    case "image":
      return "Image File";
    case "link":
      return "External Link";
    case "other":
    default:
      return "Other File";
  }
};

const getDepartmentColor = (departmentName) => {
  const colors = {
    "Computer Science": "bg-indigo-100 text-indigo-800",
    "Electrical Engineering": "bg-purple-100 text-purple-800",
    "Mechanical Engineering": "bg-green-100 text-green-800",
    "Civil Engineering": "bg-yellow-100 text-yellow-800",
    Mathematics: "bg-red-100 text-red-800",
    Physics: "bg-blue-100 text-blue-800",
    Chemistry: "bg-teal-100 text-teal-800",
  };
  return colors[departmentName] || "bg-gray-100 text-gray-800";
};

// --- CourseDetailsPage Component ---
const CourseDetailsPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  const [course, setCourse] = useState(location.state?.course || null);
  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialDescription, setMaterialDescription] = useState("");
  const [materialTypeInput, setMaterialTypeInput] = useState("file"); // "file" or "link"
  const [materialLink, setMaterialLink] = useState("");

  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [showCreateAssignmentForm, setShowCreateAssignmentForm] =
    useState(false);
  const [newAssignmentTitle, setNewAssignmentTitle] = useState("");
  const [newAssignmentDescription, setNewAssignmentDescription] = useState("");
  const [newAssignmentDueDate, setNewAssignmentDueDate] = useState("");
  const [creatingAssignment, setCreatingAssignment] = useState(false);

  const [
    selectedAssignmentForSubmissions,
    setSelectedAssignmentForSubmissions,
  ] = useState(null); // To view submissions for a specific assignment
  const [facultySubmissionsList, setFacultySubmissionsList] = useState([]); // Full submitted objects for faculty
  const [notSubmittedStudents, setNotSubmittedStudents] = useState([]); // New state for not submitted students
  const [loadingSubmissions, setLoadingSubmissions] = useState(false); // Combined loading for both lists

  // Removed student submission states:
  // const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  // const [submissionFile, setSubmissionFile] = useState(null);
  // const [submissionComments, setSubmissionComments] = useState("");
  // const [submittingAssignment, setSubmittingAssignment] = useState(false);
  // const [mySubmission, setMySubmission] = useState(null);

  const [userRole, setUserRole] = useState("student");
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUserRole(decodedToken.role || "student");
        setUserId(decodedToken.userId);
      } catch (error) {
        console.error("Failed to decode JWT token:", error);
        localStorage.removeItem("token");
        setUserRole("student");
        toast.error("Invalid session. Please log in again.");
      }
    } else {
      setUserRole("student");
    }
  }, [token]);

  useEffect(() => {
    if (!course && courseId) {
      const fetchCourseDetails = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/courses/${courseId}`);
          if (!response.ok) {
            throw new Error("Failed to load course details.");
          }
          const data = await response.json();
          setCourse(data);
        } catch (err) {
          setError(err.message || "Failed to load course details.");
          toast.error(err.message || "Failed to load course details.");
        }
      };
      fetchCourseDetails();
    }
    if (!courseId) {
      toast.error("Invalid course URL.");
      navigate("/courses");
    }
  }, [course, courseId, navigate]);

  const fetchMaterials = useCallback(async () => {
    if (!courseId) {
      console.warn("Attempted to fetch materials without a courseId.");
      return;
    }
    setLoadingMaterials(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/materials/${courseId}`, {
        method: "GET",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to fetch materials: ${response.statusText}`
        );
      }
      const data = await response.json();
      setMaterials(data.sort((a, b) => a.title.localeCompare(b.title)));
    } catch (err) {
      console.error("Error fetching materials:", err);
      setError(err.message || "Failed to load materials. Please check server.");
      toast.error(err.message || "Failed to load materials.");
    } finally {
      setLoadingMaterials(false);
    }
  }, [courseId, token]);

  const fetchAssignments = useCallback(async () => {
    if (!courseId) {
      console.warn("Attempted to fetch assignments without a courseId.");
      return;
    }
    setLoadingAssignments(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/assignments/course/${courseId}`,
        {
          method: "GET",
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to fetch assignments: ${response.statusText}`
        );
      }
      const data = await response.json();
      setAssignments(
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      ); // Sort by creation date
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setError(
        err.message || "Failed to load assignments. Please check server."
      );
      toast.error(err.message || "Failed to load assignments.");
    } finally {
      setLoadingAssignments(false);
    }
  }, [courseId, token]);

  // Function to fetch submitted assignments with details (for faculty)
  const fetchSubmittedAssignmentsDetails = useCallback(
    async (assignmentId) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/assignments/${assignmentId}/submissions`, // API that returns an array of Submission objects
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to fetch submitted assignment details."
          );
        }
        const data = await response.json();
        setFacultySubmissionsList(data); // Set the detailed list for faculty
      } catch (err) {
        console.error("Error fetching submitted details:", err);
        toast.error(err.message || "Failed to load detailed submissions.");
        setFacultySubmissionsList([]);
      }
    },
    [token]
  );

  // Function to fetch submitted/not-submitted status for faculty
  const fetchSubmissionStatusForFaculty = useCallback(
    async (assignmentId) => {
      if (!assignmentId) return;
      setLoadingSubmissions(true); // Start loading for both
      try {
        // Fetch detailed submissions (the full list of submitted files)
        await fetchSubmittedAssignmentsDetails(assignmentId); // This call now populates facultySubmissionsList

        // Fetch submitted/not-submitted status (who has submitted, who hasn't)
        const statusResponse = await fetch(
          `${API_BASE_URL}/assignments/${assignmentId}/status`, // Your new API for submitted/not-submitted list
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!statusResponse.ok) {
          const errorData = await statusResponse.json();
          throw new Error(
            errorData.message || "Failed to fetch submission status."
          );
        }
        const statusData = await statusResponse.json();
        setNotSubmittedStudents(statusData.notSubmitted || []);
      } catch (err) {
        console.error("Error fetching submission status:", err);
        toast.error(err.message || "Failed to load submission status.");
        setFacultySubmissionsList([]);
        setNotSubmittedStudents([]);
      } finally {
        setLoadingSubmissions(false);
      }
    },
    [token, fetchSubmittedAssignmentsDetails]
  );

  // Removed fetchMySubmission function as it's no longer needed for students
  /*
  const fetchMySubmission = useCallback(
    async (assignmentId) => {
      // This function is now entirely removed for student role
    },
    [token, userRole]
  );
  */

  useEffect(() => {
    if (courseId) {
      fetchMaterials();
      fetchAssignments();
    }
  }, [courseId, fetchMaterials, fetchAssignments]);

  useEffect(() => {
    if (selectedAssignmentForSubmissions) {
      if (userRole === "faculty") {
        fetchSubmissionStatusForFaculty(selectedAssignmentForSubmissions._id);
      }
      // No action for student role here, as they won't trigger a separate submission fetch
      // if they're not submitting or viewing 'their' specific submission.
      // If student needs to see assignment details, those come from `selectedAssignmentForSubmissions`
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedAssignmentForSubmissions,
    userRole,
    fetchSubmissionStatusForFaculty,
    // fetchMySubmission is removed here
  ]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      // Pre-fill title using the file name (without extension)
      setMaterialTitle(
        e.target.files[0].name.split(".").slice(0, -1).join(".")
      );
    } else {
      setSelectedFile(null);
      setMaterialTitle("");
    }
  };

  // Removed handleSubmissionFileChange as it's no longer needed
  /*
  const handleSubmissionFileChange = (e) => {
    // This function is now entirely removed
  };
  */

  /**
   * Uploads a file to Cloudinary using an unsigned upload preset.
   * @param {File} file The file to upload.
   * @returns {Promise<{secure_url: string, public_id: string, format: string, resource_type: string}>} Cloudinary response.
   * @throws {Error} If the upload fails.
   */
  const uploadToCloudinary = async (file) => {
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
        console.error("Cloudinary upload error:", errorData);
        throw new Error(
          errorData.error?.message || "Failed to upload file to Cloudinary."
        );
      }

      const data = await response.json();
      return data; // Contains secure_url, public_id, format, etc.
    } catch (err) {
      console.error("Error during Cloudinary upload process:", err);
      throw err;
    }
  };

  const handleUploadMaterial = async () => {
    if (userRole !== "faculty") {
      toast.error("Permission Denied: Only faculty can upload materials.");
      return;
    }
    if (!materialTitle.trim()) {
      toast.error("Please enter a title for the material.");
      return;
    }
    if (materialTypeInput === "file" && !selectedFile) {
      toast.error("Please select a file to upload.");
      return;
    }
    if (materialTypeInput === "link" && !materialLink.trim()) {
      toast.error("Please enter a URL for the link material.");
      return;
    }
    if (
      materialTypeInput === "link" &&
      !/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(materialLink.trim())
    ) {
      toast.error("Please enter a valid URL (e.g., https://example.com).");
      return;
    }
    if (!token) {
      toast.error("Authentication required. Please log in.");
      return;
    }
    if (!courseId) {
      toast.error("Cannot upload: Course ID is missing.");
      return;
    }

    setUploading(true);
    setError(null);

    let materialData = {
      courseId: courseId,
      title: materialTitle.trim(),
      description: materialDescription.trim(),
    };

    try {
      if (materialTypeInput === "file") {
        toast.loading("Uploading file to Cloudinary...", {
          id: "cloudinary-upload",
        });
        const cloudinaryResponse = await uploadToCloudinary(selectedFile);
        toast.success("File uploaded to Cloudinary!", {
          id: "cloudinary-upload",
        });

        const customMaterialType = mapMimeTypeToCustomType(selectedFile.type);
        materialData = {
          ...materialData,
          type: customMaterialType,
          fileUrl: cloudinaryResponse.secure_url,
          publicId: cloudinaryResponse.public_id,
        };
      } else {
        // Handle link material
        materialData = {
          ...materialData,
          type: "link", // Explicitly set type as "link"
          fileUrl: materialLink.trim(),
          publicId: null, // No publicId for links
        };
      }

      toast.loading("Saving material details...", { id: "save-material" });
      const response = await fetch(`${API_BASE_URL}/materials/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(materialData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to save material details: ${response.statusText}`
        );
      }

      toast.success("Material details saved successfully!", {
        id: "save-material",
      });
      // Reset form fields
      setSelectedFile(null);
      setMaterialTitle("");
      setMaterialDescription("");
      setMaterialLink("");
      setMaterialTypeInput("file"); // Reset to file upload by default
      if (document.getElementById("material-upload-input")) {
        document.getElementById("material-upload-input").value = "";
      }
      fetchMaterials(); // Refresh the list of materials
    } catch (error) {
      console.error("Error in upload process:", error);
      setError(error.message || "An error occurred during material upload.");
      toast.error(error.message || "Failed to upload material.");
      toast.dismiss("cloudinary-upload"); // Dismiss if still showing
      toast.dismiss("save-material");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = async (materialId, publicId) => {
    // Pass publicId to backend for Cloudinary deletion
    if (userRole !== "faculty") {
      toast.error("Permission Denied: Only faculty can delete materials.");
      return;
    }
    if (!token) {
      toast.error("Authentication required. Please log in.");
      return;
    }
    if (!materialId) {
      toast.error("Cannot delete: Material ID is missing.");
      return;
    }

    toast.custom(
      (t) => (
        <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center border border-gray-200">
          <p className="text-gray-800 text-lg mb-4">
            Are you sure you want to delete this material?
          </p>
          <div className="flex space-x-4">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                (async () => {
                  try {
                    toast.loading("Deleting material...", {
                      id: "delete-material",
                    });
                    const response = await fetch(
                      `${API_BASE_URL}/materials/${materialId}`, // Backend endpoint for deletion
                      {
                        method: "DELETE",
                        headers: {
                          "Content-Type": "application/json", // Important for sending body with DELETE
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ publicId: publicId }), // Send publicId (will be null for links)
                      }
                    );

                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(
                        errorData.message ||
                          `Deletion failed: ${response.statusText}`
                      );
                    }

                    toast.success("Material deleted successfully!", {
                      id: "delete-material",
                    });
                    fetchMaterials(); // Refresh the list
                  } catch (error) {
                    console.error("Error deleting material:", error);
                    setError(
                      error.message || "An error occurred during deletion."
                    );
                    toast.error(error.message || "Failed to delete material.");
                    toast.dismiss("delete-material"); // Dismiss if still showing
                  }
                })();
              }}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors shadow-sm"
            >
              Delete
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors shadow-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, style: { width: "fit-content" } }
    );
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (userRole !== "faculty") {
      toast.error("Permission Denied: Only faculty can create assignments.");
      return;
    }
    if (!newAssignmentTitle.trim() || !newAssignmentDueDate) {
      toast.error("Please fill all required fields for the assignment.");
      return;
    }
    if (new Date(newAssignmentDueDate) < new Date()) {
      toast.error("Due date cannot be in the past.");
      return;
    }

    setCreatingAssignment(true);
    try {
      toast.loading("Creating assignment...", { id: "create-assignment" });
      const response = await fetch(`${API_BASE_URL}/assignments/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId,
          title: newAssignmentTitle.trim(),
          description: newAssignmentDescription.trim(),
          dueDate: newAssignmentDueDate,
          // maxMarks is removed from here
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to create assignment: ${response.statusText}`
        );
      }

      toast.success("Assignment created successfully!", {
        id: "create-assignment",
      });
      setNewAssignmentTitle("");
      setNewAssignmentDescription("");
      setNewAssignmentDueDate("");
      setShowCreateAssignmentForm(false);
      fetchAssignments(); // Refresh assignments list
    } catch (err) {
      console.error("Error creating assignment:", err);
      toast.error(err.message || "Failed to create assignment.");
      toast.dismiss("create-assignment");
    } finally {
      setCreatingAssignment(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (userRole !== "faculty") {
      toast.error("Permission Denied: Only faculty can delete assignments.");
      return;
    }
    if (!token) {
      toast.error("Authentication required. Please log in.");
      return;
    }

    toast.custom(
      (t) => (
        <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center border border-gray-200">
          <p className="text-gray-800 text-lg mb-4">
            Are you sure you want to delete this assignment and all its
            submissions?
          </p>
          <div className="flex space-x-4">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                (async () => {
                  try {
                    toast.loading("Deleting assignment...", {
                      id: "delete-assignment",
                    });
                    const response = await fetch(
                      `${API_BASE_URL}/assignments/${assignmentId}`,
                      {
                        method: "DELETE",
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      }
                    );

                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(
                        errorData.message ||
                          `Deletion failed: ${response.statusText}`
                      );
                    }

                    toast.success("Assignment deleted successfully!", {
                      id: "delete-assignment",
                    });
                    fetchAssignments(); // Refresh assignments list
                    setSelectedAssignmentForSubmissions(null); // Close submissions view
                  } catch (error) {
                    console.error("Error deleting assignment:", error);
                    toast.error(
                      error.message || "Failed to delete assignment."
                    );
                    toast.dismiss("delete-assignment");
                  }
                })();
              }}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors shadow-sm"
            >
              Delete
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors shadow-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, style: { width: "fit-content" } }
    );
  };

  // Removed handleSubmitAssignment function
  /*
  const handleSubmitAssignment = async (e) => {
    // This function is now entirely removed
  };
  */

  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // If course is not available and an error is set (meaning it couldn't be loaded/found),
  // show a specific error page.
  if (error && !course) {
    return (
      <div className="text-center py-20 bg-gray-50 min-h-screen">
        <X className="w-20 h-20 text-red-400 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-red-700 mb-3">
          Error: Course Data Missing
        </h2>
        <p className="text-gray-500 mt-2">{error}</p>
        <button
          onClick={() => navigate("/courses")}
          className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ChevronLeft className="w-5 h-5 mr-2" /> Back to Courses
        </button>
      </div>
    );
  }

  // If course data is still loading or not available yet but no error,
  // we might want a general loading state for the *page* itself,
  // though current logic assumes course is either there or error.
  // For now, if `course` is null, the main content won't render details properly.
  if (!course) {
    return (
      <div className="text-center py-20 bg-gray-50 min-h-screen">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-3" />
        <p className="text-gray-600">Loading course details...</p>
      </div>
    );
  }

  const canUploadAndDelete = userRole === "faculty";
  const canCreateAssignment = userRole === "faculty";
  const canDeleteAssignment = userRole === "faculty";
  const canViewSubmissions = userRole === "faculty"; // Only faculty can view submissions now

  return (
    <div className="p-4 sm:p-6 space-y-8 bg-gray-50 min-h-screen font-sans">
      <Toaster position="top-right" />

      {/* Back Button and Course Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-200 gap-4">
        <button
          onClick={() => navigate("/courses")}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-fit"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Back to Courses
        </button>
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
            {course.courseName}
          </h1>
          <p className="text-gray-600 mt-2 text-base sm:text-lg">
            Course Code:{" "}
            <span className="font-semibold text-gray-800">
              {course.courseCode}
            </span>
          </p>
        </div>
      </div>

      {/* Course Info Section */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Course Information
        </h2>
        <div className="space-y-3 text-gray-700 text-base">
          <div className="flex items-center">
            <Building className="w-5 h-5 mr-3 text-indigo-600" />
            <span>
              <span className="font-semibold">Department:</span>{" "}
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getDepartmentColor(
                  course.department
                )}`}
              >
                {course.department}
              </span>
            </span>
          </div>
          <div className="flex items-center">
            <Calendar className="w-5 h-5 mr-3 text-purple-600" />
            <span>
              <span className="font-semibold">Year:</span> {course.year}
            </span>
          </div>
          {course.description && (
            <div className="flex items-start">
              <Layers className="w-5 h-5 mr-3 mt-1 text-teal-600 flex-shrink-0" />
              <span>
                <span className="font-semibold">Description:</span>{" "}
                <p className="mt-1 text-gray-800">{course.description}</p>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Upload Materials Section (Faculty Only) */}
      {canUploadAndDelete && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Upload New Material
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-black">
            {/* Material Title */}
            <div>
              <label
                htmlFor="material-title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Material Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                id="material-title"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g., Unit 5 Lecture Notes"
                value={materialTitle}
                onChange={(e) => setMaterialTitle(e.target.value)}
              />
            </div>

            {/* Material Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material Type <span className="text-red-500">*</span>
              </label>
              <select
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                value={materialTypeInput}
                onChange={(e) => {
                  setMaterialTypeInput(e.target.value);
                  setSelectedFile(null); // Clear file when switching to link
                  setMaterialLink(""); // Clear link when switching to file
                  if (document.getElementById("material-upload-input")) {
                    document.getElementById("material-upload-input").value = "";
                  }
                }}
              >
                <option value="file">File Upload</option>
                <option value="link">External Link (URL)</option>
              </select>
            </div>

            {/* Conditional Input based on materialTypeInput */}
            {materialTypeInput === "file" && (
              <div className="md:col-span-2">
                <label
                  htmlFor="material-upload-input"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Select File
                </label>
                <input
                  type="file"
                  id="material-upload-input"
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  onChange={handleFileChange}
                />
                {selectedFile && (
                  <p className="text-gray-600 text-sm mt-2">
                    Selected File:{" "}
                    <span className="font-semibold">{selectedFile.name}</span> (
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            )}

            {materialTypeInput === "link" && (
              <div className="md:col-span-2">
                <label
                  htmlFor="material-link-input"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Material URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  id="material-link-input"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                  placeholder="e.g., https://www.example.com/lecture-video"
                  value={materialLink}
                  onChange={(e) => setMaterialLink(e.target.value)}
                  required
                />
              </div>
            )}
          </div>
          {/* Description Textarea */}
          <div className="mt-4">
            <label
              htmlFor="material-description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="material-description"
              rows="3"
              className="mt-1 block w-full border text-black border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Detailed explanation, topics covered, etc."
              value={materialDescription}
              onChange={(e) => setMaterialDescription(e.target.value)}
            ></textarea>
          </div>
          {/* Upload Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleUploadMaterial}
              disabled={
                uploading ||
                !materialTitle.trim() ||
                (materialTypeInput === "file" && !selectedFile) ||
                (materialTypeInput === "link" && !materialLink.trim())
              }
              className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {uploading ? (
                <Loader2 className="animate-spin w-5 h-5 mr-2" />
              ) : (
                <UploadCloud className="w-5 h-5 mr-2" />
              )}
              {uploading ? "Uploading..." : "Upload Material"}
            </button>
          </div>
        </div>
      )}

      {/* View Materials Section */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Course Materials
        </h2>
        {error && materials.length === 0 && !loadingMaterials ? (
          <div className="text-center py-8">
            <X className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-700 font-semibold mb-2">
              Error Loading Materials:
            </p>
            <p className="text-gray-500 text-sm">{error}</p>
            <button
              onClick={fetchMaterials}
              className="mt-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Retry Loading Materials
            </button>
          </div>
        ) : loadingMaterials ? (
          <div className="text-center py-8">
            <Loader2 className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-3" />
            <p className="text-gray-600">Loading materials...</p>
          </div>
        ) : materials.length > 0 ? (
          <ul className="space-y-4">
            {materials.map((material) => (
              <li
                key={material._id}
                className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-center flex-grow min-w-0">
                  <div className="flex-shrink-0 mr-4 text-blue-600">
                    {/* Use material.type (which is now your custom enum) for icon */}
                    {getFileIcon(material.type)}
                  </div>
                  <div className="flex-grow min-w-0">
                    <a
                      href={material.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:text-blue-900 font-semibold truncate block text-lg"
                      title={material.title} // Always display title
                    >
                      {material.title} {/* Always display title */}
                      {material.type === "link" && (
                        <span className="ml-2 text-gray-500 text-sm">
                          (External Link)
                        </span>
                      )}
                    </a>
                    {material.description && (
                      <p className="text-gray-500 text-sm mt-0.5 max-w-full truncate">
                        {material.description}
                      </p>
                    )}
                    <p className="text-gray-500 text-sm mt-0.5">
                      Type:{" "}
                      {/* Use material.type (which is now your custom enum) for label */}
                      {getFileTypeLabel(material.type)}
                    </p>
                  </div>
                </div>
                {canUploadAndDelete && (
                  <button
                    onClick={() =>
                      handleDeleteMaterial(material._id, material.publicId)
                    }
                    className="ml-4 p-2 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete Material"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
            <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No materials uploaded yet.</p>
            {canUploadAndDelete && (
              <p className="text-gray-500 text-md mt-2">
                Use the section above to add new materials.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Assignments Section */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Assignments</h2>
          {canCreateAssignment && (
            <button
              onClick={() => setShowCreateAssignmentForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <GraduationCap className="w-5 h-5 mr-2" /> Create New Assignment
            </button>
          )}
        </div>

        {showCreateAssignmentForm && (
          <div className="mt-4 p-4 border border-blue-200 bg-blue-50 rounded-lg shadow-inner">
            <h3 className="text-xl font-semibold text-blue-800 mb-3">
              Create New Assignment
            </h3>
            <form onSubmit={handleCreateAssignment} className="space-y-3">
              <div>
                <label
                  htmlFor="assignment-title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="assignment-title"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={newAssignmentTitle}
                  onChange={(e) => setNewAssignmentTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="assignment-description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <textarea
                  id="assignment-description"
                  rows="3"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={newAssignmentDescription}
                  onChange={(e) => setNewAssignmentDescription(e.target.value)}
                ></textarea>
              </div>
              <div>
                <label
                  htmlFor="assignment-due-date"
                  className="block text-sm font-medium text-gray-700"
                >
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="assignment-due-date"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={newAssignmentDueDate}
                  onChange={(e) => setNewAssignmentDueDate(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateAssignmentForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAssignment}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingAssignment ? (
                    <Loader2 className="animate-spin w-4 h-4 mr-2" />
                  ) : (
                    <UploadCloud className="w-4 h-4 mr-2" />
                  )}
                  {creatingAssignment ? "Creating..." : "Create Assignment"}
                </button>
              </div>
            </form>
          </div>
        )}

        {loadingAssignments ? (
          <div className="text-center py-8">
            <Loader2 className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-3" />
            <p className="text-gray-600">Loading assignments...</p>
          </div>
        ) : assignments.length > 0 ? (
          <ul className="space-y-4 mt-4">
            {assignments.map((assignment) => (
              <li
                key={assignment._id}
                className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between transition-all hover:shadow-md"
              >
                <div className="flex-grow min-w-0">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {assignment.title}
                  </h3>
                  {assignment.description && (
                    <p className="text-gray-600 text-sm mt-1">
                      {assignment.description}
                    </p>
                  )}
                  <p className="text-gray-500 text-xs mt-2 flex items-center">
                    <Clock className="w-4 h-4 mr-1" /> Due:{" "}
                    {formatDate(assignment.dueDate)}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-3 sm:mt-0">
                  {/* Faculty can view submissions */}
                  {userRole === "faculty" && (
                    <button
                      onClick={() =>
                        setSelectedAssignmentForSubmissions(assignment)
                      }
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 shadow-sm"
                    >
                      <ClipboardCheck className="w-4 h-4 mr-2" /> View
                      Submissions
                    </button>
                  )}
                  {/* Students only view details without submission option here */}
                  {userRole === "student" && (
                    <button
                      onClick={() =>
                        setSelectedAssignmentForSubmissions(assignment)
                      }
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                    >
                      <ClipboardCheck className="w-4 h-4 mr-2" /> View Details
                    </button>
                  )}
                  {canDeleteAssignment && (
                    <button
                      onClick={() => handleDeleteAssignment(assignment._id)}
                      className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Assignment"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
            <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No assignments posted yet.</p>
            {canCreateAssignment && (
              <p className="text-gray-500 text-md mt-2">
                Use "Create New Assignment" to add one.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Submissions Modal/Section */}
      {selectedAssignmentForSubmissions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedAssignmentForSubmissions(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {userRole === "faculty"
                ? "Submissions for:"
                : "Assignment Details:"}{" "}
              <span className="text-blue-700">
                {selectedAssignmentForSubmissions.title}
              </span>
            </h2>
            <div className="mb-4 text-gray-700 border-b pb-4">
              <p>
                <span className="font-semibold">Due Date:</span>{" "}
                {formatDate(selectedAssignmentForSubmissions.dueDate)}
              </p>
              {selectedAssignmentForSubmissions.description && (
                <p className="text-gray-600 text-sm mt-1">
                  <span className="font-semibold">Description:</span>{" "}
                  {selectedAssignmentForSubmissions.description}
                </p>
              )}
            </div>

            {loadingSubmissions ? (
              <div className="text-center py-8">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" />
                <p className="text-gray-600">Loading data...</p>
              </div>
            ) : (
              <>
                {userRole === "faculty" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {/* Submitted List for Faculty */}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                        <ClipboardCheck className="w-5 h-5 mr-2 text-green-600" />
                        Submitted ({facultySubmissionsList.length})
                      </h3>
                      {facultySubmissionsList.length > 0 ? (
                        <ul className="space-y-3">
                          {facultySubmissionsList.map((submission) => (
                            <li
                              key={submission._id}
                              className="bg-gray-100 p-3 rounded-md border border-gray-200 flex items-center justify-between"
                            >
                              <div>
                                {/* Assuming student is populated in the submission object */}
                                <p className="font-semibold text-gray-900">
                                  {submission.student?.name ||
                                    "Unknown Student"}
                                </p>
                                <p className="text-sm text-gray-600">
                                  File:{" "}
                                  <a
                                    href={submission.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    {submission.fileName}
                                  </a>
                                </p>
                                {submission.comments && (
                                  <p className="text-xs text-gray-500 italic">
                                    "{submission.comments}"
                                  </p>
                                )}
                                <p className="text-xs text-gray-500">
                                  Submitted:{" "}
                                  {formatDate(submission.submittedAt)}
                                </p>
                                {submission.marks !== undefined && (
                                  <p className="text-sm text-green-700 font-medium">
                                    Marks: {submission.marks}
                                  </p>
                                )}
                                {submission.feedback && (
                                  <p className="text-sm text-purple-700">
                                    Feedback: {submission.feedback}
                                  </p>
                                )}
                              </div>
                              <a
                                href={submission.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-4 p-2 rounded-full text-blue-600 hover:bg-blue-100 flex-shrink-0"
                                title="Download Submission"
                              >
                                <Download className="w-5 h-5" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 text-center py-5">
                          No submissions yet for this assignment.
                        </p>
                      )}
                    </div>

                    {/* Not Submitted List for Faculty */}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                        <X className="w-5 h-5 mr-2 text-red-600" />
                        Not Submitted ({notSubmittedStudents.length})
                      </h3>
                      {notSubmittedStudents.length > 0 ? (
                        <ul className="space-y-3">
                          {notSubmittedStudents.map((student) => (
                            <li
                              key={student._id}
                              className="bg-red-50 p-3 rounded-md border border-red-200 flex items-center justify-between"
                            >
                              <div>
                                <p className="font-semibold text-red-800">
                                  {student.name}
                                </p>
                                <p className="text-sm text-red-600">
                                  Student ID: {student.studentId}
                                </p>
                                <p className="text-xs text-red-500">
                                  Email: {student.email}
                                </p>
                              </div>
                              <a
                                href={`mailto:${student.email}`}
                                className="ml-4 p-2 rounded-full text-red-600 hover:bg-red-100 flex-shrink-0"
                                title={`Email ${student.name}`}
                              >
                                <Mail className="w-5 h-5" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 text-center py-5">
                          All students have submitted!
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {userRole === "student" && (
                  <>
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">
                      Assignment Details
                    </h3>
                    <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
                      <p className="text-gray-700">
                        This section shows the details of the assignment. As a
                        student, you would typically submit your assignment
                        through a separate portal or mechanism.
                      </p>
                      <p className="text-gray-700 mt-2">
                        Please refer to your course instructor for submission
                        instructions.
                      </p>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetailsPage;
