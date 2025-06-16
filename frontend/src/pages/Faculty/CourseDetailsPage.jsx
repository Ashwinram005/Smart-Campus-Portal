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
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import toast, { Toaster } from "react-hot-toast";

/**
 * @typedef {Object} CourseMaterial
 * @property {string} _id - Unique identifier for the material
 * @property {string} fileName - Original file name (or title if that's what you store)
 * @property {string} fileUrl - Cloudinary URL for the file
 * @property {string} fileType - MIME type of the file (e.g., "application/pdf", "image/jpeg") - NOTE: This will be backend's simplified type now.
 * @property {string} publicId - Cloudinary public ID for the file
 * @property {string} uploadedBy - User ID who uploaded the material
 * @property {string} uploadedByRole - Role of the user who uploaded it
 * @property {string} createdAt - Timestamp of upload
 * @property {string} title - The title of the material as entered by the user
 * @property {string} description - The description of the material as entered by the user
 * @property {string} type - The simplified type of the material (e.g., "pdf", "video", "doc")
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
      return <File className="w-8 h-8" />; // Or a specific link icon if you add it
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
      setError(
        "Course data not found. Please navigate from the course list to ensure full details are loaded."
      );
      toast.error(
        "Course data missing. Refreshing may not work. Some details may be unavailable."
      );
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
      // Assume backend returns 'title' and 'type' fields consistent with the new schema.
      // Adjust sorting to use 'title' which is the primary display name now.
      setMaterials(data.sort((a, b) => a.title.localeCompare(b.title)));
    } catch (err) {
      console.error("Error fetching materials:", err);
      setError(err.message || "Failed to load materials. Please check server.");
      toast.error(err.message || "Failed to load materials.");
    } finally {
      setLoadingMaterials(false);
    }
  }, [courseId, token]);

  useEffect(() => {
    if (courseId) {
      fetchMaterials();
    }
  }, [courseId, fetchMaterials]);

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
      setMaterialDescription("");
    }
  };

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
    if (!selectedFile) {
      toast.error("Please select a file to upload.");
      return;
    }
    if (!materialTitle.trim()) {
      toast.error("Please enter a title for the material.");
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

    try {
      // Step 1: Upload file to Cloudinary
      toast.loading("Uploading file to Cloudinary...", {
        id: "cloudinary-upload",
      });
      const cloudinaryResponse = await uploadToCloudinary(selectedFile);
      toast.success("File uploaded to Cloudinary!", {
        id: "cloudinary-upload",
      });

      // Map the MIME type to your backend's enum type
      const customMaterialType = mapMimeTypeToCustomType(selectedFile.type);

      // Step 2: Send the specific JSON format to your backend
      const materialData = {
        courseId: courseId,
        title: materialTitle.trim(),
        description: materialDescription.trim(),
        type: customMaterialType, // <--- Using the mapped custom type here
        fileUrl: cloudinaryResponse.secure_url,
        publicId: cloudinaryResponse.public_id, // Important for backend to delete from Cloudinary
      };

      console.log("Sending materialData to backend:", materialData); // For debugging

      const response = await fetch(
        `${API_BASE_URL}/materials/upload`, // Your backend endpoint expecting JSON
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json", // Crucial: tell backend you're sending JSON
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(materialData), // Send the JSON string
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to save material details: ${response.statusText}`
        );
      }

      toast.success("Material details saved successfully!");
      setSelectedFile(null);
      setMaterialTitle(""); // Clear title input
      setMaterialDescription(""); // Clear description input
      document.getElementById("material-upload-input").value = ""; // Clear file input
      fetchMaterials(); // Refresh the list of materials
    } catch (error) {
      console.error("Error in upload process:", error);
      setError(error.message || "An error occurred during material upload.");
      toast.error(error.message || "Failed to upload material.");
      toast.dismiss("cloudinary-upload"); // Dismiss if still showing
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
      toast.error("Cannot delete: Material ID or public ID is missing.");
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
                    console.log(materialId);
                    // Backend needs publicId to delete from Cloudinary
                    const response = await fetch(
                      `${API_BASE_URL}/materials/${materialId}`, // Backend endpoint for deletion
                      {
                        method: "DELETE",
                        headers: {
                          "Content-Type": "application/json", // Important for sending body with DELETE
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ publicId: publicId }), // Send publicId
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
  // If `course` is null here, but `error` is also null, it implies
  // something is still in an initial rendering state before useEffects fire.
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
            {/* Title Input */}
            <div>
              <label
                htmlFor="material-title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Material Title
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
            {/* File Input */}
            <div>
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
            </div>
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
              required
              onChange={(e) => setMaterialDescription(e.target.value)}
            ></textarea>
          </div>
          {/* Selected File Info and Upload Button */}
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
            {selectedFile && (
              <p className="text-gray-600 text-sm flex-grow">
                Selected File:{" "}
                <span className="font-semibold">{selectedFile.name}</span> (
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            <button
              onClick={handleUploadMaterial}
              disabled={uploading || !selectedFile || !materialTitle.trim()} // Disable if no file or title
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
    </div>
  );
};

export default CourseDetailsPage;
