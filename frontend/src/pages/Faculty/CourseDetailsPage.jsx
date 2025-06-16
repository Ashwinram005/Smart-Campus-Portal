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
  Building2, // Updated from Building for consistency
  CalendarDays, // Updated from Calendar for consistency
  Layers,
  ChevronLeft,
  Loader2,
  GraduationCap,
  Clock,
  ClipboardCheck,
  Download,
  Link,
  Mail,
  UserRound, // For student names in submissions
  CheckCircle, // For submitted status
  AlertCircle, // For not submitted status
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import toast, { Toaster } from "react-hot-toast";
import { twMerge } from "tailwind-merge";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const mapMimeTypeToCustomType = (mimeType) => {
  if (!mimeType) return "other";
  if (mimeType.includes("pdf")) return "pdf";
  if (
    mimeType.includes("wordprocessingml.document") ||
    mimeType.includes("msword")
  )
    return "doc";
  if (
    mimeType.includes("presentationml.presentation") ||
    mimeType.includes("powerpoint")
  )
    return "ppt";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.includes("spreadsheetml.sheet") || mimeType.includes("excel"))
    return "doc"; // Group Excel as doc
  if (mimeType.includes("text/plain")) return "doc";
  return "other";
};

const getFileIcon = (customType) => {
  switch (customType) {
    case "pdf":
      return <FileText className="w-8 h-8 text-red-400" />;
    case "image":
      return <FileImage className="w-8 h-8 text-blue-400" />;
    case "video":
      return <FileVideo className="w-8 h-8 text-purple-400" />;
    case "audio":
      return <FileAudio className="w-8 h-8 text-emerald-400" />;
    case "doc":
      return <FileText className="w-8 h-8 text-orange-400" />; // Generic doc icon with orange
    case "ppt":
      return <FileText className="w-8 h-8 text-yellow-400" />; // PPT with yellow
    case "link":
      return <Link className="w-8 h-8 text-cyan-400" />;
    default:
      return <File className="w-8 h-8 text-gray-400" />;
  }
};

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
  // Using specific text/border colors from your theme's palette
  const colors = {
    "Computer Science": "text-indigo-300 border-indigo-700",
    "Electrical Engineering": "text-purple-300 border-purple-700",
    "Mechanical Engineering": "text-green-300 border-green-700",
    "Civil Engineering": "text-yellow-300 border-yellow-700",
    Mathematics: "text-red-300 border-red-700",
    Physics: "text-blue-300 border-blue-700",
    Chemistry: "text-teal-300 border-teal-700",
  };
  return colors[departmentName] || "text-gray-300 border-gray-700";
};

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
  const [materialTypeInput, setMaterialTypeInput] = useState("file");
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
  ] = useState(null);
  const [facultySubmissionsList, setFacultySubmissionsList] = useState([]);
  const [notSubmittedStudents, setNotSubmittedStudents] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

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
      );
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

  const fetchSubmittedAssignmentsDetails = useCallback(
    async (assignmentId) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/assignments/${assignmentId}/submissions`,
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
        setFacultySubmissionsList(data);
      } catch (err) {
        console.error("Error fetching submitted details:", err);
        toast.error(err.message || "Failed to load detailed submissions.");
        setFacultySubmissionsList([]);
      }
    },
    [token]
  );

  const fetchSubmissionStatusForFaculty = useCallback(
    async (assignmentId) => {
      if (!assignmentId) return;
      setLoadingSubmissions(true);
      try {
        await fetchSubmittedAssignmentsDetails(assignmentId);

        const statusResponse = await fetch(
          `${API_BASE_URL}/assignments/${assignmentId}/status`,
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedAssignmentForSubmissions,
    userRole,
    fetchSubmissionStatusForFaculty,
  ]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setMaterialTitle(
        e.target.files[0].name.split(".").slice(0, -1).join(".")
      );
    } else {
      setSelectedFile(null);
      setMaterialTitle("");
    }
  };

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
      return data;
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
        materialData = {
          ...materialData,
          type: "link",
          fileUrl: materialLink.trim(),
          publicId: null,
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
      setSelectedFile(null);
      setMaterialTitle("");
      setMaterialDescription("");
      setMaterialLink("");
      setMaterialTypeInput("file");
      if (document.getElementById("material-upload-input")) {
        document.getElementById("material-upload-input").value = "";
      }
      fetchMaterials();
    } catch (error) {
      console.error("Error in upload process:", error);
      setError(error.message || "An error occurred during material upload.");
      toast.error(error.message || "Failed to upload material.");
      toast.dismiss("cloudinary-upload");
      toast.dismiss("save-material");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = async (materialId, publicId) => {
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-xs sm:max-w-sm rounded-xl border border-[#0c4511] bg-[#0a130f] p-8 text-white shadow-2xl shadow-[#00FFA5]/10 relative animate-scale-in">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full hover:bg-[#1a2e20] transition-colors"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <p className="text-xl sm:text-2xl font-semibold mb-6 text-center text-red-400">
              Confirm Deletion
            </p>
            <p className="text-lg text-gray-300 mb-6 text-center">
              Are you sure you want to delete this material?
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  (async () => {
                    try {
                      toast.loading("Deleting material...", {
                        id: "delete-material",
                      });
                      const response = await fetch(
                        `${API_BASE_URL}/materials/${materialId}`,
                        {
                          method: "DELETE",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({ publicId: publicId }),
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
                      fetchMaterials();
                    } catch (error) {
                      console.error("Error deleting material:", error);
                      setError(
                        error.message || "An error occurred during deletion."
                      );
                      toast.error(
                        error.message || "Failed to delete material."
                      );
                      toast.dismiss("delete-material");
                    }
                  })();
                }}
                className="group relative inline-flex items-center justify-center p-0.5 overflow-hidden text-lg font-medium rounded-full bg-gradient-to-br from-red-600 to-rose-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-red-300 w-full sm:w-auto transform hover:scale-105 transition-transform duration-200 shadow-md"
              >
                <span className="relative flex items-center justify-center px-6 py-3 transition-all ease-in duration-75 bg-[#0a130f] rounded-full group-hover:bg-opacity-0 text-white group-hover:text-white">
                  Delete Anyway
                </span>
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="px-6 py-3 rounded-full text-white font-medium bg-[#1a2e20] hover:bg-[#1f2d23] transition-colors shadow-md transform hover:scale-105"
              >
                Cancel
              </button>
            </div>
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
      fetchAssignments();
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-xs sm:max-w-sm rounded-xl border border-[#0c4511] bg-[#0a130f] p-8 text-white shadow-2xl shadow-[#00FFA5]/10 relative animate-scale-in">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full hover:bg-[#1a2e20] transition-colors"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <p className="text-xl sm:text-2xl font-semibold mb-6 text-center text-red-400">
              Confirm Deletion
            </p>
            <p className="text-lg text-gray-300 mb-6 text-center">
              Are you sure you want to delete this assignment and all its
              submissions?
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
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
                      fetchAssignments();
                      setSelectedAssignmentForSubmissions(null);
                    } catch (error) {
                      console.error("Error deleting assignment:", error);
                      toast.error(
                        error.message || "Failed to delete assignment."
                      );
                      toast.dismiss("delete-assignment");
                    }
                  })();
                }}
                className="group relative inline-flex items-center justify-center p-0.5 overflow-hidden text-lg font-medium rounded-full bg-gradient-to-br from-red-600 to-rose-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-red-300 w-full sm:w-auto transform hover:scale-105 transition-transform duration-200 shadow-md"
              >
                <span className="relative flex items-center justify-center px-6 py-3 transition-all ease-in duration-75 bg-[#0a130f] rounded-full group-hover:bg-opacity-0 text-white group-hover:text-white">
                  Delete Anyway
                </span>
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="px-6 py-3 rounded-full text-white font-medium bg-[#1a2e20] hover:bg-[#1f2d23] transition-colors shadow-md transform hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ),
      { duration: Infinity, style: { width: "fit-content" } }
    );
  };

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

  if (error && !course) {
    return (
      <div className="text-center py-20 bg-black text-white min-h-screen flex flex-col items-center justify-center">
        <X className="w-20 h-20 text-red-400 mx-auto mb-6 filter drop-shadow-[0_0_8px_rgba(255,0,0,0.4)]" />
        <h2 className="text-3xl font-bold text-red-500 mb-3">
          Error: Course Data Unavailable
        </h2>
        <p className="text-gray-400 mt-2 text-lg">{error}</p>
        <button
          onClick={() => navigate("/courses")}
          className="mt-8 group relative inline-flex items-center justify-center p-0.5 overflow-hidden text-lg font-medium rounded-full bg-gradient-to-br from-[#00FFA5] to-blue-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-[#00FFA5]/30 shadow-xl hover:shadow-[#00FFA5]/50 transition-all duration-300"
        >
          <span className="relative flex items-center justify-center px-8 py-3 transition-all ease-in duration-75 bg-black rounded-full group-hover:bg-opacity-0 text-white">
            <ChevronLeft className="w-5 h-5 mr-3 -ml-1" /> Back to Courses
          </span>
        </button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20 bg-black text-white min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="animate-spin h-16 w-16 text-[#00FFA5] mx-auto mb-6 filter drop-shadow-[0_0_8px_rgba(0,255,165,0.4)]" />
        <p className="text-gray-400 text-xl">
          Initiating data stream for course details...
        </p>
      </div>
    );
  }

  const canUploadAndDelete = userRole === "faculty";
  const canCreateAssignment = userRole === "faculty";
  const canDeleteAssignment = userRole === "faculty";
  const canViewSubmissions = userRole === "faculty";

  return (
    <div className="space-y-10 text-white font-sans overflow-hidden">
      <Toaster position="top-right" />

      {/* Back Button and Course Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-[#0c4511] gap-6">
        <button
          onClick={() => navigate("/courses")}
          className="group relative inline-flex items-center justify-center p-0.5 overflow-hidden text-lg font-medium rounded-full bg-gradient-to-br from-[#00FFA5] to-blue-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-[#00FFA5]/30 shadow-md hover:shadow-[#00FFA5]/20 transition-all duration-300 w-fit"
        >
          <span className="relative flex items-center justify-center px-6 py-2.5 transition-all ease-in duration-75 bg-[#0a130f] rounded-full group-hover:bg-opacity-0 text-white">
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back to Courses
          </span>
        </button>
        <div className="text-right">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-[#00FFA5] animate-gradient-shift">
            {course.courseName}
          </h1>
          <p className="text-gray-400 mt-2 text-lg sm:text-xl">
            Course Code:{" "}
            <span className="font-semibold text-white">
              {course.courseCode}
            </span>
          </p>
        </div>
      </div>

      {/* Course Info Section */}
      <div className="bg-[#0a130f] rounded-2xl p-6 border border-[#0c4511] shadow-xl shadow-[#00FFA5]/10">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-6">
          Course Information
        </h2>
        <div className="space-y-4 text-gray-400 text-base">
          <div className="flex items-center">
            <Building2 className="w-5 h-5 mr-3 text-indigo-400" />
            <span>
              <span className="font-semibold text-gray-300">Department:</span>{" "}
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${getDepartmentColor(
                  course.department
                )} bg-[#0a130f]`}
              >
                {course.department}
              </span>
            </span>
          </div>
          <div className="flex items-center">
            <CalendarDays className="w-5 h-5 mr-3 text-purple-400" />
            <span>
              <span className="font-semibold text-gray-300">Year:</span>{" "}
              {course.year}
            </span>
          </div>
          {course.description && (
            <div className="flex items-start">
              <Layers className="w-5 h-5 mr-3 mt-1 text-teal-400 flex-shrink-0" />
              <span>
                <span className="font-semibold text-gray-300">
                  Description:
                </span>{" "}
                <p className="mt-1 text-gray-400">{course.description}</p>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Upload Materials Section (Faculty Only) */}
      {canUploadAndDelete && (
        <div className="bg-[#0a130f] rounded-2xl p-6 border border-[#0c4511] shadow-xl shadow-[#00FFA5]/10">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 mb-6">
            Upload New Material
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Material Title */}
            <div>
              <label
                htmlFor="material-title"
                className="block text-sm font-semibold text-gray-300 mb-1"
              >
                Material Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                id="material-title"
                className="w-full px-5 py-3 border border-[#0c4511] rounded-xl bg-black text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors disabled:bg-gray-950 disabled:cursor-not-allowed"
                placeholder="e.g., Unit 5 Lecture Notes"
                value={materialTitle}
                onChange={(e) => setMaterialTitle(e.target.value)}
              />
            </div>

            {/* Material Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">
                Material Type <span className="text-red-400">*</span>
              </label>
              <select
                className="w-full px-5 py-3 border border-[#0c4511] rounded-xl bg-black text-white appearance-none pr-10 focus:ring-2 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors"
                value={materialTypeInput}
                onChange={(e) => {
                  setMaterialTypeInput(e.target.value);
                  setSelectedFile(null);
                  setMaterialLink("");
                  if (document.getElementById("material-upload-input")) {
                    document.getElementById("material-upload-input").value = "";
                  }
                }}
              >
                <option value="file">File Upload</option>
                <option value="link">External Link (URL)</option>
              </select>
            </div>

            {materialTypeInput === "file" && (
              <div className="md:col-span-2">
                <label
                  htmlFor="material-upload-input"
                  className="block text-sm font-semibold text-gray-300 mb-1"
                >
                  Select File
                </label>
                <input
                  type="file"
                  id="material-upload-input"
                  className="block w-full text-sm text-white border border-[#0c4511] rounded-xl cursor-pointer bg-black focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#0c4511] file:text-[#00FFA5] hover:file:bg-[#1a2e20] hover:file:text-white transition-colors"
                  onChange={handleFileChange}
                />
                {selectedFile && (
                  <p className="text-gray-400 text-sm mt-2">
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
                  className="block text-sm font-semibold text-gray-300 mb-1"
                >
                  Material URL <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  id="material-link-input"
                  className="w-full px-5 py-3 border border-[#0c4511] rounded-xl bg-black text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors"
                  placeholder="e.g., https://www.example.com/lecture-video"
                  value={materialLink}
                  onChange={(e) => setMaterialLink(e.target.value)}
                  required
                />
              </div>
            )}
          </div>
          <div className="mt-5">
            <label
              htmlFor="material-description"
              className="block text-sm font-semibold text-gray-300 mb-1"
            >
              Description
            </label>
            <textarea
              id="material-description"
              rows="3"
              className="w-full px-5 py-3 border border-[#0c4511] rounded-xl bg-black text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors resize-y"
              placeholder="Detailed explanation, topics covered, etc."
              value={materialDescription}
              onChange={(e) => setMaterialDescription(e.target.value)}
            ></textarea>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleUploadMaterial}
              disabled={
                uploading ||
                !materialTitle.trim() ||
                (materialTypeInput === "file" && !selectedFile) ||
                (materialTypeInput === "link" && !materialLink.trim())
              }
              className="group relative inline-flex items-center justify-center p-0.5 overflow-hidden text-lg font-medium rounded-full bg-gradient-to-br from-[#00FFA5] to-blue-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-[#00FFA5]/30 shadow-xl hover:shadow-[#00FFA5]/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <span className="relative flex items-center justify-center px-8 py-3 transition-all ease-in duration-75 bg-[#0a130f] rounded-full group-hover:bg-opacity-0 text-white">
                {uploading ? (
                  <Loader2 className="animate-spin w-6 h-6 mr-3" />
                ) : (
                  <UploadCloud className="w-6 h-6 mr-3 -ml-1" />
                )}
                {uploading ? "Uploading..." : "Upload Material"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* View Materials Section */}
      <div className="bg-[#0a130f] rounded-2xl p-6 border border-[#0c4511] shadow-xl shadow-[#00FFA5]/10">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-green-400 mb-6">
          Course Materials
        </h2>
        {error && materials.length === 0 && !loadingMaterials ? (
          <div className="text-center py-8 bg-[#1a2e20] rounded-lg border border-[#0c4511] shadow-md">
            <X className="w-12 h-12 text-red-400 mx-auto mb-3 filter drop-shadow-[0_0_8px_rgba(255,0,0,0.4)]" />
            <p className="text-red-500 font-semibold mb-2">
              Error Loading Materials:
            </p>
            <p className="text-gray-400 text-sm">{error}</p>
            <button
              onClick={fetchMaterials}
              className="mt-4 px-4 py-2 border border-[#0c4511] rounded-md shadow-sm text-sm font-medium text-gray-300 bg-[#1a2e20] hover:bg-[#1f2d23] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a2e20] focus:ring-[#00FFA5]"
            >
              Retry Loading Materials
            </button>
          </div>
        ) : loadingMaterials ? (
          <div className="text-center py-8 bg-[#1a2e20] rounded-lg border border-[#0c4511] shadow-md">
            <Loader2 className="animate-spin h-10 w-10 text-[#00FFA5] mx-auto mb-3 filter drop-shadow-[0_0_8px_rgba(0,255,165,0.4)]" />
            <p className="text-gray-400">Loading materials...</p>
          </div>
        ) : materials.length > 0 ? (
          <ul className="space-y-4">
            {materials.map((material) => (
              <li
                key={material._id}
                className="flex flex-col sm:flex-row items-center justify-between bg-[#1a2e20] p-4 rounded-lg border border-[#0c4511] shadow-md transition-all hover:shadow-lg hover:shadow-[#00FFA5]/10"
              >
                <div className="flex items-center flex-grow min-w-0 mb-3 sm:mb-0">
                  <div className="flex-shrink-0 mr-4">
                    {getFileIcon(material.type)}
                  </div>
                  <div className="flex-grow min-w-0">
                    <a
                      href={material.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00FFA5] hover:text-cyan-400 font-semibold truncate block text-lg transition-colors"
                      title={material.title}
                    >
                      {material.title}
                      {material.type === "link" && (
                        <span className="ml-2 text-gray-400 text-sm">
                          (External Link)
                        </span>
                      )}
                    </a>
                    {material.description && (
                      <p className="text-gray-400 text-sm mt-0.5 max-w-full truncate">
                        {material.description}
                      </p>
                    )}
                    <p className="text-gray-500 text-sm mt-0.5">
                      Type: {getFileTypeLabel(material.type)}
                    </p>
                  </div>
                </div>
                {canUploadAndDelete && (
                  <button
                    onClick={() =>
                      handleDeleteMaterial(material._id, material.publicId)
                    }
                    className="ml-0 sm:ml-4 p-2 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-900 transition-colors shadow-md flex-shrink-0"
                    title="Delete Material"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-10 bg-[#1a2e20] rounded-lg border border-[#0c4511] shadow-md">
            <File className="w-16 h-16 text-gray-600 mx-auto mb-4 filter drop-shadow-[0_0_8px_rgba(0,255,165,0.2)]" />
            <p className="text-gray-400 text-lg">No materials uploaded yet.</p>
            {canUploadAndDelete && (
              <p className="text-gray-500 text-md mt-2">
                Use the section above to add new materials.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Assignments Section */}
      <div className="bg-[#0a130f] rounded-2xl p-6 border border-[#0c4511] shadow-xl shadow-[#00FFA5]/10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Assignments
          </h2>
          {canCreateAssignment && (
            <button
              onClick={() => setShowCreateAssignmentForm(true)}
              className="group relative inline-flex items-center justify-center p-0.5 overflow-hidden text-lg font-medium rounded-full bg-gradient-to-br from-[#00FFA5] to-blue-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-[#00FFA5]/30 shadow-md hover:shadow-[#00FFA5]/20 transition-all duration-300 w-fit"
            >
              <span className="relative flex items-center justify-center px-6 py-2.5 transition-all ease-in duration-75 bg-[#0a130f] rounded-full group-hover:bg-opacity-0 text-white">
                <GraduationCap className="w-5 h-5 mr-2" /> Create New Assignment
              </span>
            </button>
          )}
        </div>

        {showCreateAssignmentForm && (
          <div className="mt-4 p-6 border border-[#0c4511] bg-[#1a2e20] rounded-lg shadow-inner shadow-[#00FFA5]/10">
            <h3 className="text-xl font-semibold text-white mb-4">
              Create New Assignment
            </h3>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label
                  htmlFor="assignment-title"
                  className="block text-sm font-semibold text-gray-300 mb-1"
                >
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="assignment-title"
                  className="w-full px-5 py-3 border border-[#0c4511] rounded-xl bg-black text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors"
                  value={newAssignmentTitle}
                  onChange={(e) => setNewAssignmentTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="assignment-description"
                  className="block text-sm font-semibold text-gray-300 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="assignment-description"
                  rows="3"
                  className="w-full px-5 py-3 border border-[#0c4511] rounded-xl bg-black text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors resize-y"
                  value={newAssignmentDescription}
                  onChange={(e) => setNewAssignmentDescription(e.target.value)}
                ></textarea>
              </div>
              <div>
                <label
                  htmlFor="assignment-due-date"
                  className="block text-sm font-semibold text-gray-300 mb-1"
                >
                  Due Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="assignment-due-date"
                  className="w-full px-5 py-3 border border-[#0c4511] rounded-xl bg-black text-white focus:ring-2 focus:ring-[#00FFA5] focus:border-[#00FFA5] transition-colors"
                  value={newAssignmentDueDate}
                  onChange={(e) => setNewAssignmentDueDate(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateAssignmentForm(false)}
                  className="px-6 py-2.5 border border-[#0c4511] text-gray-300 rounded-lg font-medium hover:bg-[#1a2e20] transition-colors shadow-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAssignment}
                  className="group relative inline-flex items-center justify-center p-0.5 overflow-hidden text-lg font-medium rounded-full bg-gradient-to-br from-[#00FFA5] to-blue-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-[#00FFA5]/30 shadow-md hover:shadow-[#00FFA5]/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative flex items-center justify-center px-6 py-2.5 transition-all ease-in duration-75 bg-[#0a130f] rounded-full group-hover:bg-opacity-0 text-white">
                    {creatingAssignment ? (
                      <Loader2 className="animate-spin w-5 h-5 mr-2" />
                    ) : (
                      <UploadCloud className="w-5 h-5 mr-2" />
                    )}
                    {creatingAssignment ? "Creating..." : "Create Assignment"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}

        {loadingAssignments ? (
          <div className="text-center py-8 bg-[#1a2e20] rounded-lg border border-[#0c4511] shadow-md">
            <Loader2 className="animate-spin h-10 w-10 text-[#00FFA5] mx-auto mb-3 filter drop-shadow-[0_0_8px_rgba(0,255,165,0.4)]" />
            <p className="text-gray-400">Loading assignments...</p>
          </div>
        ) : assignments.length > 0 ? (
          <ul className="space-y-4 mt-4">
            {assignments.map((assignment) => (
              <li
                key={assignment._id}
                className="bg-[#1a2e20] p-4 rounded-lg border border-[#0c4511] shadow-md flex flex-col sm:flex-row sm:items-center justify-between transition-all hover:shadow-lg hover:shadow-[#00FFA5]/10"
              >
                <div className="flex-grow min-w-0">
                  <h3 className="text-xl font-semibold text-white">
                    {assignment.title}
                  </h3>
                  {assignment.description && (
                    <p className="text-gray-400 text-sm mt-1">
                      {assignment.description}
                    </p>
                  )}
                  <p className="text-gray-500 text-xs mt-2 flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-blue-400" /> Due:{" "}
                    <span className="text-gray-400 ml-1">
                      {formatDate(assignment.dueDate)}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-3 sm:mt-0">
                  {canViewSubmissions && (
                    <button
                      onClick={() =>
                        setSelectedAssignmentForSubmissions(assignment)
                      }
                      className="group relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-purple-300 shadow-md hover:shadow-purple-500/20"
                    >
                      <span className="relative flex items-center justify-center px-4 py-2 transition-all ease-in duration-75 bg-[#1a2e20] rounded-full group-hover:bg-opacity-0 text-white">
                        <ClipboardCheck className="w-4 h-4 mr-2" /> View{" "}
                        {userRole === "faculty" ? "Submissions" : "Details"}
                      </span>
                    </button>
                  )}
                  {canDeleteAssignment && (
                    <button
                      onClick={() => handleDeleteAssignment(assignment._id)}
                      className="p-2 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-900 transition-colors shadow-md"
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
          <div className="text-center py-10 bg-[#1a2e20] rounded-lg border border-[#0c4511] shadow-md">
            <GraduationCap className="w-16 h-16 text-gray-600 mx-auto mb-4 filter drop-shadow-[0_0_8px_rgba(0,255,165,0.2)]" />
            <p className="text-gray-400 text-lg">No assignments posted yet.</p>
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-[100] animate-fade-in">
          <div className="bg-[#0a130f] rounded-2xl p-6 sm:p-8 border border-[#0c4511] shadow-2xl shadow-[#00FFA5]/10 max-w-5xl w-full max-h-[90vh] overflow-y-auto relative animate-scale-in">
            <button
              onClick={() => setSelectedAssignmentForSubmissions(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-[#1a2e20] hover:bg-[#1f2d23] text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400 mb-4">
              {userRole === "faculty"
                ? "Submissions for:"
                : "Assignment Details:"}{" "}
              <span className="text-white">
                {selectedAssignmentForSubmissions.title}
              </span>
            </h2>
            <div className="mb-6 text-gray-400 border-b border-[#0c4511] pb-4">
              <p className="text-lg">
                <span className="font-semibold text-gray-300">Due Date:</span>{" "}
                {formatDate(selectedAssignmentForSubmissions.dueDate)}
              </p>
              {selectedAssignmentForSubmissions.description && (
                <p className="text-gray-400 text-sm mt-2">
                  <span className="font-semibold text-gray-300">
                    Description:
                  </span>{" "}
                  {selectedAssignmentForSubmissions.description}
                </p>
              )}
            </div>

            {loadingSubmissions ? (
              <div className="text-center py-8 bg-[#1a2e20] rounded-lg border border-[#0c4511] shadow-md">
                <Loader2 className="animate-spin h-10 w-10 text-[#00FFA5] mx-auto mb-3 filter drop-shadow-[0_0_8px_rgba(0,255,165,0.4)]" />
                <p className="text-gray-400">Loading submission data...</p>
              </div>
            ) : (
              <>
                {userRole === "faculty" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                    {/* Submitted List for Faculty */}
                    <div>
                      <h3 className="text-2xl font-semibold text-white mb-4 flex items-center">
                        <CheckCircle className="w-6 h-6 mr-3 text-green-400" />
                        Submitted ({facultySubmissionsList.length})
                      </h3>
                      {facultySubmissionsList.length > 0 ? (
                        <ul className="space-y-4">
                          {facultySubmissionsList.map((submission) => (
                            <li
                              key={submission._id}
                              className="bg-[#1a2e20] p-4 rounded-lg border border-[#0c4511] shadow-md flex items-center justify-between"
                            >
                              <div className="flex-grow min-w-0">
                                <p className="font-semibold text-white flex items-center">
                                  <UserRound className="w-4 h-4 mr-2 text-blue-400" />
                                  {submission.student?.name ||
                                    "Unknown Student"}
                                </p>
                                <p className="text-sm text-gray-400">
                                  ID: {submission.student?.studentId || "N/A"}
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                  File:{" "}
                                  <a
                                    href={submission.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#00FFA5] hover:text-cyan-400 hover:underline"
                                  >
                                    {submission.fileName}
                                  </a>
                                </p>
                                {submission.comments && (
                                  <p className="text-xs text-gray-500 italic mt-1">
                                    "{submission.comments}"
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                  Submitted:{" "}
                                  {formatDate(submission.submittedAt)}
                                </p>
                                {(submission.marks !== undefined ||
                                  submission.feedback) && (
                                  <div className="mt-2 pt-2 border-t border-[#0c4511]">
                                    {submission.marks !== undefined && (
                                      <p className="text-sm text-green-400 font-medium">
                                        Marks: {submission.marks}
                                      </p>
                                    )}
                                    {submission.feedback && (
                                      <p className="text-sm text-purple-400">
                                        Feedback: {submission.feedback}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                              <a
                                href={submission.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-4 p-2 rounded-full text-blue-400 hover:bg-[#1f2d23] flex-shrink-0 shadow-md"
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
                      <h3 className="text-2xl font-semibold text-white mb-4 flex items-center">
                        <AlertCircle className="w-6 h-6 mr-3 text-red-400" />
                        Not Submitted ({notSubmittedStudents.length})
                      </h3>
                      {notSubmittedStudents.length > 0 ? (
                        <ul className="space-y-4">
                          {notSubmittedStudents.map((student) => (
                            <li
                              key={student._id}
                              className="bg-[#1a2e20] p-4 rounded-lg border border-[#0c4511] shadow-md flex items-center justify-between"
                            >
                              <div>
                                <p className="font-semibold text-red-400 flex items-center">
                                  <UserRound className="w-4 h-4 mr-2 text-red-400" />
                                  {student.name}
                                </p>
                                <p className="text-sm text-gray-400">
                                  ID: {student.studentId}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Email: {student.email}
                                </p>
                              </div>
                              <a
                                href={`mailto:${student.email}`}
                                className="ml-4 p-2 rounded-full text-blue-400 hover:bg-[#1f2d23] flex-shrink-0 shadow-md"
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

                {/* Student View of Assignment Details (No submission form here) */}
                {userRole === "student" && (
                  <>
                    <h3 className="text-2xl font-semibold text-white mb-3">
                      Assignment Submission Status
                    </h3>
                    <div className="bg-[#1a2e20] p-6 rounded-lg border border-[#0c4511] shadow-md">
                      <p className="text-gray-400">
                        This section shows the details of the assignment. As a
                        student, you would submit your assignment through a
                        separate, designated portal or mechanism based on your
                        institute's guidelines.
                      </p>
                      <p className="text-gray-400 mt-3">
                        Please refer to your course instructor for specific
                        submission instructions and where to upload your work.
                      </p>
                      {/* You might add a link/button here if there's a *general* submission portal */}
                      {/* <button className="mt-4 bg-[#00FFA5] text-black px-4 py-2 rounded-md font-medium">Go to Submission Portal</button> */}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Global CSS for animations and custom selects - Put this in your main CSS file (e.g., index.css) */}
      <style>{`
        /* General Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }

        /* Gradient Text Animation */
        @keyframes gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .animate-gradient-shift {
            background-size: 200% auto;
            animation: gradient-shift 5s ease-in-out infinite;
        }

        /* Custom Select Arrow Styling (for dark theme) */
        select.appearance-none {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='%239CA3AF' class='w-6 h-6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M8.25 4.5l7.5 7.5-7.5 7.5' /%3E%3C/svg%3E"); /* Light gray arrow for dark bg */
          background-repeat: no-repeat;
          background-position: right 1rem center;
          background-size: 1.25rem 1.25rem;
        }
        /* Specific drop shadow for glow */
        .filter.drop-shadow-\[0_0_8px_rgba\(0,255,165,0.4\)\] {
          filter: drop-shadow(0 0 8px rgba(0,255,165,0.4));
        }
      `}</style>
    </div>
  );
};

export default CourseDetailsPage;
