
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const menuItems = [
  { label: "Dashboard", path: "/dashboard", icon: "D" },
  { label: "Campaigns", path: "/campaigns", icon: "C" },
  { label: "Campaign Wizard", path: "/campaigns/new", icon: "+" },
  { label: "Template Library", path: "/templates", icon: "T" },
  { label: "AI Content Studio", path: "/content-studio", icon: "✦" },
  { label: "Messages", path: "/messages", icon: "M" },
  { label: "Audience", path: "/audience", icon: "A" },
  { label: "Segments", path: "/segments", icon: "S" },
];

export default function SidebarLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const role = (
    localStorage.getItem("user_role") || ""
  ).toLowerCase();

  const handleLogout = () => {
    [
      "access_token",
      "user",
      "user_role",
      "email",
      "id",
      "name",
      "user_id",
      "userId",
    ].forEach((key) => localStorage.removeItem(key));

    navigate("/login", { replace: true });
  };

  return (
    <div className="sidebar-layout">
      <aside
        className={`app-sidebar ${collapsed ? "collapsed" : ""}`}
      >
        <div className="sidebar-brand">
          <div className="brand-icon">P</div>

          {!collapsed && (
            <div>
              <strong>PublicConnect</strong>
              <small>Admin Portal</small>
            </div>
          )}
        </div>

        <div className="sidebar-section">
          {!collapsed && (
            <p className="sidebar-heading">MAIN MENU</p>
          )}

          {menuItems.map((item) => {
            const active =
              location.pathname === item.path ||
              (item.path !== "/campaigns" &&
                location.pathname.startsWith(item.path + "/")) ||
              (item.path === "/campaigns" &&
                location.pathname === "/campaigns");

            return (
              <button
                type="button"
                key={item.path}
                className={`sidebar-link ${active ? "active" : ""}`}
                title={collapsed ? item.label : ""}
                onClick={() => navigate(item.path)}
              >
                <span className="sidebar-icon">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}

          {role === "admin" && (
            <button
              type="button"
              className={`sidebar-link ${
                location.pathname === "/users" ? "active" : ""
              }`}
              onClick={() => navigate("/users")}
              title={collapsed ? "User Management" : ""}
            >
              <span className="sidebar-icon">U</span>
              {!collapsed && <span>User Management</span>}
            </button>
          )}
        </div>

        <div className="sidebar-bottom">
          <button
            type="button"
            className="sidebar-link"
            onClick={handleLogout}
          >
            <span className="sidebar-icon">X</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="sidebar-main">
        <header className="sidebar-topbar">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setCollapsed((previous) => !previous)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <span>AI PublicConnect</span>
        </header>

        <div className="sidebar-page-content">{children}</div>
      </main>

      <style>{`
        .sidebar-layout {
          display: flex;
          min-height: 100vh;
          background: #f4f7fc;
          color: #13264a;
          font-family: Arial, sans-serif;
        }

        .app-sidebar {
          width: 250px;
          flex-shrink: 0;
          min-height: 100vh;
          background: #13264a;
          color: white;
          display: flex;
          flex-direction: column;
          padding: 20px 14px;
          transition: width 0.2s ease;
          box-sizing: border-box;
        }

        .app-sidebar.collapsed {
          width: 76px;
          padding-inline: 10px;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          min-height: 52px;
          padding: 0 5px 22px;
          border-bottom: 1px solid #344568;
        }

        .brand-icon {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          background: #3569f6;
          display: grid;
          place-items: center;
          font-size: 22px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .sidebar-brand strong,
        .sidebar-brand small {
          display: block;
        }

        .sidebar-brand strong {
          font-size: 16px;
        }

        .sidebar-brand small {
          color: #b8c7e6;
          margin-top: 5px;
          font-size: 12px;
        }

        .sidebar-section {
          padding-top: 24px;
        }

        .sidebar-heading {
          padding-left: 10px;
          margin: 0 0 12px;
          font-size: 11px;
          letter-spacing: 1px;
          color: #9db0d2;
        }

        .sidebar-link {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 13px 12px;
          margin: 4px 0;
          border: 0;
          border-radius: 9px;
          background: transparent;
          color: #e0e8f8;
          text-align: left;
          font-size: 14px;
          cursor: pointer;
        }

        .sidebar-link:hover {
          background: #263d66;
          color: white;
        }

        .sidebar-link.active {
          background: #3569f6;
          color: white;
          font-weight: 700;
        }

        .sidebar-icon {
          width: 22px;
          flex-shrink: 0;
          text-align: center;
          font-size: 16px;
          font-weight: 700;
        }

        .collapsed .sidebar-link {
          justify-content: center;
          padding-inline: 5px;
        }

        .sidebar-bottom {
          margin-top: auto;
          padding-top: 20px;
          border-top: 1px solid #344568;
        }

        .sidebar-main {
          flex: 1;
          min-width: 0;
        }

        .sidebar-topbar {
          height: 64px;
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 0 25px;
          background: white;
          border-bottom: 1px solid #e2e8f2;
          font-weight: 700;
        }

        .sidebar-toggle {
          border: 0;
          background: #eef2ff;
          color: #13264a;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 19px;
          cursor: pointer;
        }

        .sidebar-page-content {
          padding: 25px;
          min-width: 0;
          box-sizing: border-box;
        }

        @media (max-width: 700px) {
          .app-sidebar {
            width: 76px;
            padding-inline: 10px;
          }

          .app-sidebar:not(.collapsed) {
            width: 210px;
          }

          .sidebar-page-content {
            padding: 15px;
          }

          .sidebar-topbar {
            padding: 0 15px;
          }
        }
      `}</style>
    </div>
  );
}
