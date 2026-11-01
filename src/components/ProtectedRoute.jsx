
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  // Wait for authentication to finish
  if (loading) {
    return <div style={{ padding: "30px" }}>Loading...</div>;
  }

  // Redirect if the user is not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check the user's role
  const userRole = String(user.role || "").trim().toLowerCase();

  if (
    allowedRoles &&
    !allowedRoles.some(
      (role) => role.trim().toLowerCase() === userRole
    )
  ) {
    return (
      <div style={{ padding: "30px" }}>
        <h2>Access Denied</h2>
        <p>Your account does not have permission to access this page.</p>
        <button onClick={() => (window.location.href = "/dashboard")}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  return children;
}
