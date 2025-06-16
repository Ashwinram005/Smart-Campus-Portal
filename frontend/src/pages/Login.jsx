import { useState, useCallback, useEffect } from "react";
import {
  FaGoogle,
  FaGithub,
  FaFacebook,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
import icon from "../assets/react.svg"; // Replace with your campus logo

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.email) {
      setFormData((prev) => ({ ...prev, email: location.state.email }));
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        setError("Please enter both email and password.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem("token", data.token);
          navigate("/dashboard");
        } else {
          setError(data.message || "Invalid credentials. Try again.");
        }
      } catch (err) {
        console.error("Login error:", err);
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [formData, navigate]
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-[#0c2d13] p-6">
      <div
        className="rounded-[32px] w-[1100px] h-[600px] max-w-full shadow-2xl backdrop-blur-md border border-[#1a4028] overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #09180f 0%, #07210e 100%)",
        }}
      >
        <div className="grid grid-cols-2 w-full h-full">
          {/* Left Panel */}
          <div className="flex flex-col justify-center items-start px-10 text-white relative bg-gradient-to-b from-[#06160f] to-[#123f25]">
            <img
              src={icon}
              alt="Campus Logo"
              className="absolute top-6 left-6 w-16 h-16"
            />
            <h1 className="text-[44px] font-bold leading-tight mb-4">
              Welcome to
              <br /> Smart Campus Portal
            </h1>
            <div className="w-20 h-1 bg-[#7EFFA5] mb-6" />
            <p className="text-sm text-gray-300 max-w-md leading-relaxed">
              Your one-stop solution for managing announcements, course content,
              collaborations, and student-faculty interactions — all in one
              secure and smart portal.
            </p>
          </div>

          {/* Right Panel */}
          <div className="flex flex-col justify-center px-10 py-8 bg-[#041309] text-white">
            <h2 className="text-[28px] text-[#7EFFA5] font-semibold mb-6 text-center">
              Log in to Your Account
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm mb-1">Email / Username</label>
                <input
                  type="text"
                  name="email"
                  placeholder="Enter email or username"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-md bg-[#112b1c] border border-[#2f6f4a] placeholder:text-gray-400 text-white focus:outline-none"
                />
              </div>
              <div className="relative">
                <label className="block text-sm mb-1">Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-md bg-[#112b1c] border border-[#2f6f4a] placeholder:text-gray-400 text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute top-9 right-3 text-gray-400"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              {error && (
                <div className="text-red-400 text-sm text-center">{error}</div>
              )}

              <Link
                to="/forgot-password"
                className="text-[#91C9A6] text-sm text-right hover:underline"
              >
                Forgot password?
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2 bg-[#2AF87D] text-black font-bold rounded-full hover:bg-[#1dd36b] transition disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="text-sm text-center mt-6 text-gray-300">
              Don’t have an account?{" "}
              <Link
                to="/signup"
                className="text-white font-semibold hover:underline"
              >
                Sign up
              </Link>
            </p>

            <div className="mt-6 text-center text-white text-sm">
              Or sign in with
              <div className="flex justify-center mt-3 gap-5">
                <FaGoogle className="text-[#91C9A6]" size={20} />
                <FaGithub className="text-[#91C9A6]" size={20} />
                <FaFacebook className="text-[#91C9A6]" size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
