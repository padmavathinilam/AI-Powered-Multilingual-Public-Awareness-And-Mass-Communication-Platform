
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const initialStats = {
  users: null,
  campaigns: null,
  audience: null,
  messages: null,
};

function getCount(data) {
  if (Array.isArray(data)) return data.length;

  if (data && typeof data === "object") {
    if (typeof data.total === "number") return data.total;
    if (typeof data.count === "number") return data.count;

    for (const key of [
      "items",
      "results",
      "data",
      "campaigns",
      "users",
      "members",
      "messages",
    ]) {
      if (Array.isArray(data[key])) return data[key].length;
    }
  }

  return null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const userName =
    user?.name ||
    user?.full_name ||
    localStorage.getItem("user_name") ||
    localStorage.getItem("userName") ||
    "User";

  const userRole =
    (typeof user?.role === "string" ? user.role : user?.role?.name) ||
    localStorage.getItem("user_role") ||
    "Campaign Manager";

  const isAdmin = userRole.trim().toLowerCase() === "admin";

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");

    const endpoints = [
      { key: "campaigns", url: "/api/campaigns/" },
      { key: "audience", url: "/api/audience/" },
      { key: "messages", url: "/api/messages/" },
      ...(isAdmin ? [{ key: "users", url: "/api/users/" }] : []),
    ];

    try {
      const results = await Promise.allSettled(
        endpoints.map((item) => api.get(item.url))
      );

      const nextStats = { ...initialStats };
      const failed = [];

      results.forEach((result, index) => {
        const { key, url } = endpoints[index];

        if (result.status === "fulfilled") {
          nextStats[key] = getCount(result.value.data);
        } else {
          failed.push(url);
          console.error(
            `Failed to load ${url}:`,
            result.reason
          );
        }
      });

      setStats(nextStats);
      setLastUpdated(new Date());

      if (failed.length > 0) {
        setError(
          `Unable to load some dashboard data: ${failed.join(", ")}.`
        );
      }
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError("Unable to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const statCards = [
    {
      title: "Audience Members",
      value: stats.audience,
      description: "People in your audience",
      icon: "🌍",
    },
    {
      title: "Campaigns",
      value: stats.campaigns,
      description: "Public awareness campaigns",
      icon: "📢",
    },
    {
      title: "Messages",
      value: stats.messages,
      description: "Communication messages",
      icon: "💬",
    },
    ...(isAdmin
      ? [
          {
            title: "Total Users",
            value: stats.users,
            description: "Registered platform users",
            icon: "👥",
          },
        ]
      : []),
  ];

  const modules = [
    {
      title: "Campaigns",
      description: "Create and manage public awareness campaigns.",
      path: "/campaigns",
      icon: "📢",
    },
    {
      title: "Multilingual Messages",
      description: "Prepare messages for different language communities.",
      path: "/messages",
      icon: "🌐",
    },
    {
      title: "Audience Segments",
      description: "Organize audiences for targeted communication.",
      path: "/segments",
      icon: "👥",
    },
    {
      title: "Audience Database",
      description:
        "Manage members, contact details, consent, and preferences.",
      path: "/audience",
      icon: "🗂️",
    },
  ];

  return (
    <div className="dashboard-content">
      <style>{`
        .dashboard-content {
          color: #172344;
          font-family: Inter, Arial, sans-serif;
          width: 100%;
        }

        .dashboard-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 30px;
        }

        .dashboard-topbar h1 {
          font-size: 23px;
          margin: 0;
        }

        .dashboard-topbar p {
          font-size: 12px;
          color: #8791a6;
          margin: 7px 0 0;
        }

        .dashboard-refresh {
          background: #3569f6;
          color: white;
          border: 0;
          padding: 12px 17px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .dashboard-refresh:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .dashboard-welcome {
          margin-bottom: 30px;
        }

        .dashboard-eyebrow {
          color: #6252f6;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.6px;
          margin-bottom: 10px;
        }

        .dashboard-welcome h2 {
          font-size: clamp(26px, 3vw, 36px);
          margin: 0 0 10px;
        }

        .dashboard-welcome p {
          color: #77839a;
          font-size: 13px;
          line-height: 1.7;
          margin: 0;
        }

        .dashboard-section-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 17px;
        }

        .dashboard-section-heading h3 {
          margin: 0;
          font-size: 18px;
        }

        .dashboard-updated {
          color: #8791a6;
          font-size: 11px;
        }

        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 17px;
        }

        .dashboard-stat {
          background: white;
          border: 1px solid #e6eaf3;
          border-radius: 15px;
          padding: 22px;
          box-shadow: 0 5px 20px rgba(32, 47, 80, 0.025);
          min-width: 0;
        }

        .dashboard-stat-top {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #66728b;
          font-size: 12px;
        }

        .dashboard-stat-icon {
          font-size: 21px;
        }

        .dashboard-stat-value {
          font-size: 31px;
          font-weight: 800;
          margin-top: 22px;
          color: #172344;
        }

        .dashboard-stat-description {
          color: #8791a6;
          font-size: 11px;
          margin: 8px 0 0;
        }

        .dashboard-modules-section {
          margin-top: 36px;
        }

        .dashboard-module-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 17px;
        }

        .dashboard-module {
          background: white;
          border: 1px solid #e6eaf3;
          border-radius: 15px;
          padding: 23px;
          min-width: 0;
        }

        .dashboard-module-icon {
          font-size: 26px;
        }

        .dashboard-module h4 {
          font-size: 15px;
          margin: 15px 0 8px;
        }

        .dashboard-module p {
          color: #7c879d;
          font-size: 12px;
          line-height: 1.7;
          min-height: 40px;
        }

        .dashboard-module button {
          background: #eef2ff;
          color: #3569f6;
          border: 0;
          border-radius: 8px;
          padding: 10px 13px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .dashboard-module button:hover {
          background: #dfe7ff;
        }

        .dashboard-error {
          background: #fff0f0;
          color: #b42318;
          padding: 13px;
          border-radius: 9px;
          margin-bottom: 20px;
          font-size: 12px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .dashboard-footer {
          margin-top: 38px;
          color: #9aa3b5;
          font-size: 11px;
          text-align: center;
        }

        @media (max-width: 650px) {
          .dashboard-topbar {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .dashboard-stats,
          .dashboard-module-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <header className="dashboard-topbar">
        <div>
          <h1>Dashboard</h1>
          <p>AI PublicConnect / Overview</p>
        </div>

        <button
          className="dashboard-refresh"
          onClick={fetchDashboardData}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "↻ Refresh Data"}
        </button>
      </header>

      <section className="dashboard-welcome">
        <div className="dashboard-eyebrow">
          YOUR COMMUNICATION CENTER
        </div>

        <h2>Welcome back, {userName}!</h2>

        <p>
          Manage campaigns, audiences, and multilingual communications
          from one place.
        </p>
      </section>

      {error && (
        <div className="dashboard-error" role="alert">
          {error}
        </div>
      )}

      <section>
        <div className="dashboard-section-heading">
          <h3>Platform Overview</h3>

          <span className="dashboard-updated">
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString()}`
              : "Loading platform data..."}
          </span>
        </div>

        <div className="dashboard-stats">
          {statCards.map((item) => (
            <article key={item.title} className="dashboard-stat">
              <div className="dashboard-stat-top">
                <span className="dashboard-stat-icon">
                  {item.icon}
                </span>
                <span>{item.title}</span>
              </div>

              <div className="dashboard-stat-value">
                {loading && item.value === null
                  ? "..."
                  : item.value === null
                    ? "—"
                    : item.value.toLocaleString()}
              </div>

              <p className="dashboard-stat-description">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-modules-section">
        <div className="dashboard-section-heading">
          <h3>Quick Access</h3>
        </div>

        <div className="dashboard-module-grid">
          {modules.map((module) => (
            <article
              key={module.title}
              className="dashboard-module"
            >
              <div className="dashboard-module-icon">
                {module.icon}
              </div>

              <h4>{module.title}</h4>
              <p>{module.description}</p>

              <button onClick={() => navigate(module.path)}>
                Open Module →
              </button>
            </article>
          ))}
        </div>
      </section>

      <footer className="dashboard-footer">
        AI PublicConnect · Multilingual Public Awareness Platform
      </footer>
    </div>
  );
}
