import { useState, useCallback, useEffect } from "react";
import {
  FaGoogle,
  FaGithub,
  FaFacebook,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
import icon from "../assets/react.svg"; // Update this path if needed

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state && location.state.email) {
      setFormData((prevData) => ({
        ...prevData,
        email: location.state.email,
      }));
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      if (!formData.email || !formData.password) {
        setError("Please enter your email/username and password.");
        setLoading(false);
        return;
      }

      const payload = {
        email: formData.email,
        password: formData.password,
      };

      try {
        const response = await fetch(`${BACKEND_URL}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem("token", data.token);

          navigate("/dashboard");
        } else {
          setError(
            data.message ||
              data.detail ||
              "Login failed. Please check your credentials."
          );
        }
      } catch (err) {
        console.error("Login error:", err);
        setError("Network error or unexpected issue. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [formData, navigate]
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#000000] to-[#0c4511] p-4 overflow-auto"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      <div
        className="rounded-[40px] p-1 w-[1150px] h-[600px] max-w-full max-h-screen"
        style={{
          boxShadow:
            "0 8px 30px rgba(0, 0, 0, 0.4), 0 16px 60px rgba(0, 0, 0, 0.2)",
          background:
            "linear-gradient(135deg, rgba(30,30,30,0.2), rgba(15,15,15,0.4))",
        }}
      >
        <div className="grid grid-cols-2 rounded-[36px] overflow-hidden bg-[#06170F] w-full h-full">
          {/* Left Panel */}
          <div className="relative flex flex-col justify-center items-center text-white px-6 md:px-10 py-10 md:py-16 bg-gradient-to-b from-black to-[#0c4511] rounded-tl-[36px] md:rounded-bl-[36px] w-full h-full">
            <img
              src={icon}
              alt="Icon"
              className="absolute top-[20px] left-[20px] md:top-[30px] md:left-[44px] w-[60px] md:w-[80px] h-[60px] md:h-[80px]"
            />
            <h1
              className="font-bold mb-2 text-[40px] sm:text-[48px] md:text-[56px] lg:text-[64px] max-w-xs sm:max-w-md md:max-w-lg mx-auto sm:mx-0"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                lineHeight: "35px",
              }}
            >
              Welcome!
            </h1>
            <div className="border-[1px] border-[#91C9A6] my-4 w-24 sm:w-36 md:w-44 mx-auto sm:mx-0" />
            <p
              className="text-sm text-center text-gray-300 leading-relaxed"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 500,
                fontSize: "12px",
                lineHeight: "15px",
              }}
            >
              App.Eraser.io is a collaborative platform for managing GitHub
              repositories, creating content and blogs, subscribing to
              newsletters, submitting feedback, and engaging with challenges and
              rewards. It includes robust authentication features like password
              recovery and 2FA, with role-based access.
            </p>
          </div>

          {/* Right Panel */}
          <div className="relative flex flex-col justify-center px-6 md:px-10 py-10 md:py-16 text-white rounded-tr-[36px] md:rounded-br-[36px] bg-gradient-to-b from-[#031000] to-[#0c4511] backdrop-blur-[8.2px] w-full h-full">
            <h2
              className="mb-6 text-center text-[#77F4A5]"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 500,
                fontSize: "28px",
                lineHeight: "36px",
              }}
            >
              Log in
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col">
              {/* Email */}
              <label className="text-[16px] mb-1 font-[500] block">
                Email or Username
              </label>
              <input
                type="text"
                placeholder="Enter your email or Username"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mb-5 px-4 py-2 rounded-md bg-[#1A3324] border border-[#336645] placeholder-[#91C9A6] placeholder:text-[16px] placeholder:font-[400] text-white w-full focus:outline-none"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              />
              {/* Password */}
              <label className="text-[16px] mb-1 font-[500] block">
                Password
              </label>
              <div className="relative mb-4">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="px-4 py-2 rounded-md bg-[#1A3324] border border-[#336645] placeholder-[#91C9A6] placeholder:text-[16px] placeholder:font-[400] text-white w-full focus:outline-none"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-3 flex items-center text-[#91C9A6]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <Link
                className="text-[#91C9A6] text-[16px] font-[400] mb-6 inline-block"
                to="/forgot-password"
              >
                Forgot password?
              </Link>

              {error && (
                <div className="text-red-400 text-center text-sm p-2 rounded-md mb-4">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full block text-center py-2 bg-[#26ED73] hover:bg-[#1ddd60] cursor-pointer rounded-full text-black font-semibold transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Log in"}
              </button>
            </form>

            <p className="text-[#91C9A6] mt-6 text-center font-bold text-base leading-[24px] tracking-normal cursor-pointer">
              Don’t have an account?{" "}
              <Link to="/signup" className="text-white font-semibold">
                Sign Up
              </Link>
            </p>

            <p className="text-[16px] text-white mt-6 text-center font-[700] leading-none">
              Sign Up With
            </p>
            <div className="flex justify-center gap-6 mt-3">
              <FaGoogle className="text-[#91C9A6]" size={24} />
              <FaGithub className="text-[#91C9A6]" size={24} />
              <FaFacebook className="text-[#91C9A6]" size={24} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
