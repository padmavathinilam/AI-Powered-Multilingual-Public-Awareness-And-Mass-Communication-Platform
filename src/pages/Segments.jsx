
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Segments() {
  const navigate = useNavigate();

  const [segments, setSegments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const loadSegments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/segments/");
      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : data?.segments || data?.items || data?.results || [];

      setSegments(list);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load segments. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSegments();
  }, [loadSegments]);

  const deleteSegment = async (segment) => {
    const id = segment.id ?? segment.segment_id;

    if (id == null) {
      setError("This segment does not have a valid ID.");
      return;
    }

    if (!window.confirm(`Delete "${segment.name}"?`)) return;

    setDeletingId(id);
    setError("");

    try {
      await api.delete(`/api/segments/${id}`);
      setSegments((previous) =>
        previous.filter(
          (item) => (item.id ?? item.segment_id) !== id
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to delete this segment."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const filteredSegments = segments.filter((segment) =>
    String(segment.name || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const styles = {
    page: {
      minHeight: "100vh",
      padding: "32px",
      background: "#f5f7fc",
      color: "#172344",
      fontFamily: "Arial, sans-serif",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "16px",
      flexWrap: "wrap",
      marginBottom: "26px",
    },
    title: { margin: 0, fontSize: "28px" },
    subtitle: { color: "#71809b", fontSize: "14px" },
    button: {
      padding: "11px 16px",
      background: "#2864ed",
      color: "#fff",
      border: 0,
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: 600,
    },
    search: {
      width: "100%",
      maxWidth: "420px",
      padding: "12px 14px",
      border: "1px solid #dce3f0",
      borderRadius: "9px",
      fontSize: "14px",
      outlineColor: "#2864ed",
      marginBottom: "20px",
    },
    card: {
      background: "#fff",
      border: "1px solid #e2e8f3",
      borderRadius: "14px",
      padding: "22px",
      boxShadow: "0 4px 15px rgba(25,41,82,0.04)",
    },
    secondary: {
      background: "#eef1ff",
      color: "#354dc4",
      border: 0,
      padding: "9px 12px",
      borderRadius: "7px",
      cursor: "pointer",
      fontWeight: 600,
    },
    danger: {
      background: "#fff0f0",
      color: "#b42318",
      border: 0,
      padding: "9px 12px",
      borderRadius: "7px",
      cursor: "pointer",
      fontWeight: 600,
    },
  };

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Audience Segments</h1>
          <p style={styles.subtitle}>
            Build and manage targeted audiences for your campaigns.
          </p>
        </div>

        <button
          style={styles.button}
          onClick={() => navigate("/segments/new")}
        >
          + Create Segment
        </button>
      </header>

      <input
        style={styles.search}
        type="search"
        placeholder="Search segments by name..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {error && (
        <div
          role="alert"
          style={{
            background: "#fff0f0",
            color: "#b42318",
            padding: "14px",
            borderRadius: "8px",
            marginBottom: "18px",
          }}
        >
          {String(error)}
        </div>
      )}

      {loading ? (
        <p>Loading segments...</p>
      ) : filteredSegments.length === 0 ? (
        <section style={styles.card}>
          <h3>
            {search ? "No matching segments" : "No segments created yet"}
          </h3>
          <p style={styles.subtitle}>
            Create a segment using age, language, location, occupation,
            and engagement rules.
          </p>
          <button
            style={styles.button}
            onClick={() => navigate("/segments/new")}
          >
            Create Your First Segment
          </button>
        </section>
      ) : (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "18px",
          }}
        >
          {filteredSegments.map((segment) => {
            const id = segment.id ?? segment.segment_id;
            const count =
              segment.member_count ??
              segment.members_count ??
              segment.size ??
              segment.count;

            return (
              <article key={id} style={styles.card}>
                <h3 style={{ marginTop: 0 }}>{segment.name}</h3>

                <p style={{ color: "#71809b", lineHeight: 1.6 }}>
                  {segment.description || "No description provided."}
                </p>

                <div
                  style={{
                    background: "#f2f4ff",
                    padding: "15px",
                    borderRadius: "9px",
                    margin: "18px 0",
                  }}
                >
                  <div style={{ color: "#71809b", fontSize: "12px" }}>
                    Matching members
                  </div>
                  <strong style={{ fontSize: "25px", color: "#2864ed" }}>
                    {count ?? "—"}
                  </strong>
                </div>

                <p style={{ color: "#71809b", fontSize: "12px" }}>
                  Created:{" "}
                  {segment.created_at
                    ? new Date(segment.created_at).toLocaleDateString()
                    : "Not available"}
                </p>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    style={styles.button}
                    onClick={() => navigate(`/segments/${id}`)}
                  >
                    View Members
                  </button>

                  <button
                    style={styles.secondary}
                    onClick={() => navigate(`/segments/${id}/edit`)}
                  >
                    Edit
                  </button>

                  <button
                    style={styles.danger}
                    disabled={deletingId === id}
                    onClick={() => deleteSegment(segment)}
                  >
                    {deletingId === id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
