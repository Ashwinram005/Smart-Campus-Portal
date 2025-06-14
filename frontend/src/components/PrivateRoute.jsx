// components/PrivateRoute.jsx
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token"); // or use context/auth hook

  return token ? children : <Navigate to="/" replace />;
};

export default PrivateRoute;
