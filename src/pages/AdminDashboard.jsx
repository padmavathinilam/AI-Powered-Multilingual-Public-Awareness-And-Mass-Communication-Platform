
import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../styles/admin.css";

const ROLES = [
  "Admin",
  "Campaign Manager",
  "Communication Team",
];

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);

  const userRole = String(
    typeof user?.role === "object"
      ? user?.role?.name || ""
      : user?.role || ""
  ).trim().toLowerCase();

  const isAdmin = userRole === "admin";

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/auth/users");
      const data = response.data;

      const userList = Array.isArray(data)
        ? data
        : Array.isArray(data?.users)
          ? data.users
          : [];

      setUsers(userList);
    } catch (err) {
      console.error("Loading users failed:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load users. Verify your Admin permissions."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (isAdmin) {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [authLoading, isAdmin, loadUsers]);

  async function changeRole(targetUser, newRole) {
    if (targetUser.role === newRole) return;

    const previousRole = targetUser.role;

    setBusyId(targetUser.id);
    setError("");
    setMessage("");

    try {
      await api.patch(
        `/auth/users/${targetUser.id}/role`,
        null,
        {
          params: {
            role_name: newRole,
          },
        }
      );

      setUsers((previousUsers) =>
        previousUsers.map((item) =>
          String(item.id) === String(targetUser.id)
            ? { ...item, role: newRole }
            : item
        )
      );

      setMessage(`Role updated for ${targetUser.name || targetUser.email}.`);
    } catch (err) {
      console.error("Role update failed:", err);

      setUsers((previousUsers) =>
        previousUsers.map((item) =>
          String(item.id) === String(targetUser.id)
            ? { ...item, role: previousRole }
            : item
        )
      );

      setError(
        err.response?.data?.detail ||
          err.message ||
          "Could not update the user's role."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function toggleStatus(targetUser) {
    if (String(targetUser.id) === String(user?.id)) {
      setError("You cannot deactivate your own account here.");
      return;
    }

    const action = targetUser.is_active ? "deactivate" : "activate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${
          targetUser.name || targetUser.email
        }?`
      )
    ) {
      return;
    }

    const previousStatus = targetUser.is_active;
    const newStatus = !previousStatus;

    setBusyId(targetUser.id);
    setError("");
    setMessage("");

    try {
      await api.patch(
        `/auth/users/${targetUser.id}/status`,
        null,
        {
          params: {
            is_active: newStatus,
          },
        }
      );

      setUsers((previousUsers) =>
        previousUsers.map((item) =>
          String(item.id) === String(targetUser.id)
            ? { ...item, is_active: newStatus }
            : item
        )
      );

      setMessage(
        `Account ${action}d successfully.`
      );
    } catch (err) {
      console.error("Account status update failed:", err);

      setUsers((previousUsers) =>
        previousUsers.map((item) =>
          String(item.id) === String(targetUser.id)
            ? { ...item, is_active: previousStatus }
            : item
        )
      );

      setError(
        err.response?.data?.detail ||
          err.message ||
          "Could not update account status."
      );
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading) {
    return (
      <div className="admin-loading">
        Checking your account...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const searchText = search.trim().toLowerCase();

  const filteredUsers = users.filter((item) => {
    return (
      String(item.name || "").toLowerCase().includes(searchText) ||
      String(item.email || "").toLowerCase().includes(searchText) ||
      String(item.role || "").toLowerCase().includes(searchText)
    );
  });

  const activeCount = users.filter(
    (item) => item.is_active
  ).length;

  const inactiveCount = users.length - activeCount;

  const adminCount = users.filter(
    (item) =>
      String(item.role || "").trim().toLowerCase() === "admin"
  ).length;

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">
            AI PUBLICCONNECT / ADMIN
          </p>

          <h1>Admin Dashboard</h1>

          <p className="admin-subtitle">
            Manage users, roles, and account access.
          </p>
        </div>

        <button
          type="button"
          className="admin-button"
          onClick={loadUsers}
          disabled={loading || busyId !== null}
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </header>

      {error && (
        <div className="admin-alert error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="admin-alert success" role="status">
          {message}
        </div>
      )}

      <section className="admin-stats">
        <article className="admin-stat">
          <span>Total users</span>
          <strong>{loading ? "—" : users.length}</strong>
        </article>

        <article className="admin-stat">
          <span>Active users</span>
          <strong>{loading ? "—" : activeCount}</strong>
        </article>

        <article className="admin-stat">
          <span>Inactive users</span>
          <strong>{loading ? "—" : inactiveCount}</strong>
        </article>

        <article className="admin-stat">
          <span>Administrators</span>
          <strong>{loading ? "—" : adminCount}</strong>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>User Management</h2>
            <p>Change roles and control account status.</p>
          </div>

          <input
            className="admin-search"
            type="search"
            placeholder="Search name, email, or role..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search users"
          />
        </div>

        {loading ? (
          <p className="admin-empty">Loading users...</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Account action</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((item) => {
                  const itemRole = String(item.role || "").trim();
                  const knownRole = ROLES.includes(itemRole);
                  const isCurrentUser =
                    String(item.id) === String(user.id);
                  const isBusy = String(busyId) === String(item.id);

                  return (
                    <tr key={item.id}>
                      <td>
                        <strong>
                          {item.name || "Unnamed user"}
                        </strong>

                        {isCurrentUser && (
                          <span className="admin-you">You</span>
                        )}
                      </td>

                      <td>{item.email || "—"}</td>

                      <td>
                        <select
                          value={itemRole}
                          disabled={isBusy || !knownRole}
                          onChange={(event) =>
                            changeRole(item, event.target.value)
                          }
                          aria-label={`Role for ${
                            item.name || item.email
                          }`}
                        >
                          {!knownRole && (
                            <option value={itemRole}>
                              {itemRole || "Unknown role"}
                            </option>
                          )}

                          {ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>

                        {isBusy && (
                          <span className="admin-you">
                            Saving...
                          </span>
                        )}
                      </td>

                      <td>
                        <span
                          className={`admin-status ${
                            item.is_active ? "active" : "inactive"
                          }`}
                        >
                          {item.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className={`admin-button ${
                            item.is_active ? "danger" : "primary"
                          }`}
                          disabled={isBusy || isCurrentUser}
                          onClick={() => toggleStatus(item)}
                        >
                          {isBusy
                            ? "Saving..."
                            : item.is_active
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="admin-empty">
                      {users.length === 0
                        ? "No users found."
                        : "No users match your search."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
