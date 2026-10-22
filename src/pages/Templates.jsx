
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function getUserId() {
  const directId =
    localStorage.getItem("user_id") ||
    localStorage.getItem("userId") ||
    localStorage.getItem("id");

  if (directId && Number.isFinite(Number(directId))) {
    return Number(directId);
  }

  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const id = user.id ?? user.user_id;
    return id && Number.isFinite(Number(id)) ? Number(id) : null;
  } catch {
    return null;
  }
}

function getArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.templates)) return data.templates;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

const emptyForm = {
  title: "",
  category: "General",
  channel: "Email",
  language: "English",
  body: "",
  tags: "",
};

export default function Templates() {
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [languageFilter, setLanguageFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadTemplates = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/templates/");
      setTemplates(getArray(response.data));
    } catch (err) {
      setError(
        err.response?.data?.detail
          ? typeof err.response.data.detail === "string"
            ? err.response.data.detail
            : JSON.stringify(err.response.data.detail)
          : "Unable to load templates. Check the backend and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const categories = useMemo(
    () => [
      "All",
      ...new Set(
        templates
          .map((item) => item.category)
          .filter(Boolean)
      ),
    ],
    [templates]
  );

  const filteredTemplates = useMemo(() => {
    const term = search.toLowerCase().trim();

    return templates.filter((item) => {
      const title = item.title || item.name || "";
      const body = item.body || item.content || "";

      const matchesSearch =
        !term ||
        title.toLowerCase().includes(term) ||
        body.toLowerCase().includes(term) ||
        (item.category || "").toLowerCase().includes(term);

      const matchesChannel =
        channelFilter === "All" ||
        (item.channel || "").toLowerCase() === channelFilter.toLowerCase();

      const matchesCategory =
        categoryFilter === "All" ||
        item.category === categoryFilter;

      const matchesLanguage =
        languageFilter === "All" ||
        (item.language || "").toLowerCase() === languageFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesChannel &&
        matchesCategory &&
        matchesLanguage
      );
    });
  }, [
    templates,
    search,
    channelFilter,
    categoryFilter,
    languageFilter,
  ]);

  const updateForm = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const createTemplate = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const userId = getUserId();

    if (!userId) {
      setError("Your user ID was not found. Sign in again and retry.");
      return;
    }

    if (!form.title.trim() || !form.body.trim()) {
      setError("Enter both a template title and template content.");
      return;
    }

    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payload = {
      name: form.title.trim(),
      title: form.title.trim(),
      category: form.category,
      channel: form.channel,
      language: form.language,
      content: form.body.trim(),
      body: form.body.trim(),
      tags,
      created_by: userId,
    };

    setSaving(true);

    try {
      await api.post("/api/templates/", payload);

      setForm(emptyForm);
      setShowForm(false);
      setSuccess("Template created successfully.");
      await loadTemplates();
    } catch (err) {
      setError(
        err.response?.data?.detail
          ? typeof err.response.data.detail === "string"
            ? err.response.data.detail
            : JSON.stringify(err.response.data.detail)
          : "Unable to create the template. Check the backend and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const useTemplate = (template) => {
    navigate("/campaigns/new", {
      state: {
        template: {
          name: `Campaign - ${template.title || template.name || "New"}`,
          description: template.body || template.content || "",
          objective: "Awareness",
          campaign_type: "Awareness",
        },
      },
    });
  };

  const styles = {
    input: {
      width: "100%",
      boxSizing: "border-box",
      padding: "11px 12px",
      border: "1px solid #d7dfed",
      borderRadius: 9,
      background: "#fff",
      fontSize: 14,
    },
    button: {
      border: 0,
      borderRadius: 8,
      padding: "10px 14px",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
    },
    label: {
      display: "block",
      fontSize: 13,
      fontWeight: 700,
      marginBottom: 7,
    },
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", color: "#13264a" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 15,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>
            Template Library
          </h1>
          <p style={{ color: "#71809a", margin: 0 }}>
            Reuse content for consistent public awareness campaigns.
          </p>
        </div>

        <button
          style={{ ...styles.button, background: "#3569f6", color: "#fff" }}
          onClick={() => {
            setError("");
            setSuccess("");
            setShowForm((previous) => !previous);
          }}
        >
          {showForm ? "Close Form" : "+ Create Template"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            background: "#fff0f0",
            color: "#b42318",
            padding: 12,
            borderRadius: 9,
            marginBottom: 16,
            overflowWrap: "anywhere",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          style={{
            background: "#eafaf0",
            color: "#17663a",
            padding: 12,
            borderRadius: 9,
            marginBottom: 16,
          }}
        >
          {success}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={createTemplate}
          style={{
            background: "#fff",
            border: "1px solid #e2e8f2",
            borderRadius: 14,
            padding: 22,
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 20, marginTop: 0 }}>Create a template</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            <label>
              <span style={styles.label}>Template title *</span>
              <input
                style={styles.input}
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                placeholder="e.g. Health Awareness Notice"
                required
              />
            </label>

            <label>
              <span style={styles.label}>Category</span>
              <select
                style={styles.input}
                value={form.category}
                onChange={(e) => updateForm("category", e.target.value)}
              >
                <option>General</option>
                <option>Health</option>
                <option>Education</option>
                <option>Public Safety</option>
                <option>Government</option>
                <option>Emergency</option>
                <option>Community</option>
              </select>
            </label>

            <label>
              <span style={styles.label}>Channel</span>
              <select
                style={styles.input}
                value={form.channel}
                onChange={(e) => updateForm("channel", e.target.value)}
              >
                <option>Email</option>
                <option>SMS</option>
                <option>WhatsApp</option>
                <option>Social Media</option>
              </select>
            </label>

            <label>
              <span style={styles.label}>Language</span>
              <select
                style={styles.input}
                value={form.language}
                onChange={(e) => updateForm("language", e.target.value)}
              >
                <option>English</option>
                <option>Telugu</option>
                <option>Hindi</option>
                <option>Tamil</option>
                <option>Kannada</option>
                <option>Malayalam</option>
              </select>
            </label>

            <label style={{ gridColumn: "1 / -1" }}>
              <span style={styles.label}>Content *</span>
              <textarea
                style={{ ...styles.input, minHeight: 130, resize: "vertical" }}
                value={form.body}
                onChange={(e) => updateForm("body", e.target.value)}
                placeholder="Write your reusable campaign message..."
                required
              />
              <small style={{ color: "#71809a" }}>
                You can use placeholders such as {"{name}"} and {"{date}"}.
              </small>
            </label>

            <label style={{ gridColumn: "1 / -1" }}>
              <span style={styles.label}>Tags (comma-separated)</span>
              <input
                style={styles.input}
                value={form.tags}
                onChange={(e) => updateForm("tags", e.target.value)}
                placeholder="health, awareness, community"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              ...styles.button,
              background: "#3569f6",
              color: "#fff",
              marginTop: 18,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving..." : "Save Template"}
          </button>
        </form>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 22,
        }}
      >
        <input
          style={styles.input}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates..."
        />

        <select
          style={styles.input}
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
        >
          <option value="All">All channels</option>
          <option>Email</option>
          <option>SMS</option>
          <option>WhatsApp</option>
          <option>Social Media</option>
        </select>

        <select
          style={styles.input}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category === "All" ? "All categories" : category}
            </option>
          ))}
        </select>

        <select
          style={styles.input}
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value)}
        >
          <option value="All">All languages</option>
          <option>English</option>
          <option>Telugu</option>
          <option>Hindi</option>
          <option>Tamil</option>
          <option>Kannada</option>
          <option>Malayalam</option>
        </select>
      </div>

      {loading ? (
        <p>Loading templates...</p>
      ) : filteredTemplates.length === 0 ? (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f2",
            borderRadius: 14,
            padding: 35,
            textAlign: "center",
          }}
        >
          <h3>No templates found</h3>
          <p style={{ color: "#71809a" }}>
            Try different filters or create your first template.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 18,
          }}
        >
          {filteredTemplates.map((template) => {
            const title = template.title || template.name || "Untitled";
            const body = template.body || template.content || "";

            return (
              <article
                key={template.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f2",
                  borderRadius: 14,
                  padding: 20,
                  minWidth: 0,
                  boxShadow: "0 4px 15px rgba(19,38,74,0.035)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 10,
                  }}
                >
                  <h3 style={{ margin: "0 0 12px", fontSize: 17 }}>
                    {title}
                  </h3>
                  <span
                    style={{
                      background: "#edf2ff",
                      color: "#315bd5",
                      borderRadius: 20,
                      padding: "5px 8px",
                      fontSize: 11,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {template.channel || "General"}
                  </span>
                </div>

                <p style={{ color: "#71809a", fontSize: 13, margin: "0 0 8px" }}>
                  {template.category || "General"} ·{" "}
                  {template.language || "English"}
                </p>

                <p
                  style={{
                    color: "#53637d",
                    fontSize: 14,
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    minHeight: 65,
                  }}
                >
                  {body.length > 160 ? `${body.slice(0, 160)}...` : body}
                </p>

                {Array.isArray(template.tags) && template.tags.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          background: "#f0f3f8",
                          borderRadius: 6,
                          padding: "4px 7px",
                          fontSize: 11,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                  <button
                    style={{
                      ...styles.button,
                      background: "#eef2f8",
                      color: "#243656",
                    }}
                    onClick={() => setSelected(template)}
                  >
                    Preview
                  </button>

                  <button
                    style={{
                      ...styles.button,
                      background: "#3569f6",
                      color: "#fff",
                    }}
                    onClick={() => useTemplate(template)}
                  >
                    Use Template
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(10, 22, 45, 0.55)",
            display: "grid",
            placeItems: "center",
            padding: 18,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Template preview"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 15,
              padding: 25,
              width: "100%",
              maxWidth: 650,
              maxHeight: "85vh",
              overflowY: "auto",
              boxSizing: "border-box",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              {selected.title || selected.name || "Template preview"}
            </h2>

            <p style={{ color: "#71809a", fontSize: 13 }}>
              {selected.category || "General"} ·{" "}
              {selected.channel || "General"} ·{" "}
              {selected.language || "English"}
            </p>

            <div
              style={{
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                lineHeight: 1.7,
                background: "#f6f8fc",
                borderRadius: 10,
                padding: 16,
              }}
            >
              {selected.body || selected.content || ""}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 20,
              }}
            >
              <button
                style={{
                  ...styles.button,
                  background: "#eef2f8",
                  color: "#243656",
                }}
                onClick={() => setSelected(null)}
              >
                Close
              </button>

              <button
                style={{
                  ...styles.button,
                  background: "#3569f6",
                  color: "#fff",
                }}
                onClick={() => useTemplate(selected)}
              >
                Use This Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
