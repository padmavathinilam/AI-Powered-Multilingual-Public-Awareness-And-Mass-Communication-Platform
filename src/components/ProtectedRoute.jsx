
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  allowedRoles,
}) {
  const { user, loading } = useAuth();

  // Wait until the user's authentication status is checked
  if (loading) {
    return <div style={{ padding: "30px" }}>Loading...</div>;
  }

  // Redirect users who are not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Restrict access based on the user's role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
