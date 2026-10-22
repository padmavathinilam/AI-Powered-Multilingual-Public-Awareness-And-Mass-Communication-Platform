
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const emptyForm = {
  name: "",
  description: "",
  objective: "",
  status: "draft",
  start_at: "",
  end_at: "",
};

function toDateInput(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().slice(0, 16);
}

function Campaigns() {
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function loadCampaigns() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/campaigns/");
      const data = response.data;

      setCampaigns(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.campaigns)
            ? data.campaigns
            : []
      );
    } catch (err) {
      setError(
        typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : "Unable to load campaigns. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCampaigns();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function startEditing(campaign) {
    setEditingId(campaign.id);

    setForm({
      name: campaign.name || "",
      description: campaign.description || "",
      objective: campaign.objective || "",
      status: campaign.status || "draft",
      start_at: toDateInput(campaign.start_at),
      end_at: toDateInput(campaign.end_at),
    });

    setError("");
    setSuccess("");
    setShowForm(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (
      form.start_at &&
      form.end_at &&
      new Date(form.end_at) <= new Date(form.start_at)
    ) {
      setError("The end date must be after the start date.");
      return;
    }

    const storedUserId = Number(
      localStorage.getItem("user_id") ||
        localStorage.getItem("userId")
    );

    const payload = {
      ...form,
      created_by:
        Number.isFinite(storedUserId) && storedUserId > 0
          ? storedUserId
          : 0,
      start_at: form.start_at
        ? new Date(form.start_at).toISOString()
        : null,
      end_at: form.end_at
        ? new Date(form.end_at).toISOString()
        : null,
    };

    setSaving(true);

    try {
      if (editingId !== null) {
        await api.put(`/api/campaigns/${editingId}`, payload);
        setSuccess("Campaign updated successfully!");
      } else {
        await api.post("/api/campaigns/", payload);
        setSuccess("Campaign created successfully!");
      }

      setEditingId(null);
      setForm(emptyForm);
      setShowForm(false);

      await loadCampaigns();
    } catch (err) {
      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to save the campaign. Check the backend response."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(campaign) {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${campaign.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`/api/campaigns/${campaign.id}`);

      if (editingId === campaign.id) {
        cancelForm();
      }

      setSuccess("Campaign deleted successfully.");
      await loadCampaigns();
    } catch (err) {
      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to delete the campaign."
      );
    }
  }

  const inputStyle = {
    display: "block",
    width: "100%",
    padding: "11px",
    marginTop: "8px",
    marginBottom: "16px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    boxSizing: "border-box",
    fontSize: "14px",
    background: "#ffffff",
    color: "#172033",
  };

  const labelStyle = {
    display: "block",
    fontWeight: "600",
    color: "#374151",
    fontSize: "14px",
  };

  const buttonStyle = {
    padding: "10px 14px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const searchText = search.trim().toLowerCase();

    const matchesSearch =
      !searchText ||
      [campaign.name, campaign.description, campaign.objective]
        .some((value) =>
          String(value || "").toLowerCase().includes(searchText)
        );

    const matchesStatus =
      statusFilter === "all" ||
      String(campaign.status || "").toLowerCase() ===
        statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
        padding: "28px",
        fontFamily: "Arial, sans-serif",
        color: "#172033",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Campaign Management</h1>
          <p style={{ color: "#64748b" }}>
            View and manage your public awareness campaigns.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              ...buttonStyle,
              background: "#e2e8f0",
              color: "#172033",
            }}
          >
            Back to Dashboard
          </button>

          <button
            onClick={openCreateForm}
            style={{
              ...buttonStyle,
              background: "#4f46e5",
              color: "#ffffff",
            }}
          >
            + Create Campaign
          </button>
        </div>
      </header>

      {error && !showForm && (
        <div
          role="alert"
          style={{
            padding: "12px 16px",
            marginBottom: "16px",
            background: "#fee2e2",
            color: "#b91c1c",
            borderRadius: "8px",
          }}
        >
          {error}
        </div>
      )}

      {success && !showForm && (
        <div
          role="status"
          style={{
            padding: "12px 16px",
            marginBottom: "16px",
            background: "#dcfce7",
            color: "#166534",
            borderRadius: "8px",
          }}
        >
          {success}
        </div>
      )}

      {showForm && (
        <section
          style={{
            background: "#ffffff",
            padding: "24px",
            borderRadius: "14px",
            boxShadow: "0 4px 16px rgba(15, 23, 42, 0.06)",
            marginBottom: "24px",
            maxWidth: "850px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            {editingId !== null ? "Edit Campaign" : "Create a Campaign"}
          </h2>

          <form onSubmit={handleSubmit}>
            <label style={labelStyle}>
              Campaign Name *
              <input
                style={inputStyle}
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Health Awareness Week"
                maxLength={200}
                required
              />
            </label>

            <label style={labelStyle}>
              Description *
              <textarea
                style={{ ...inputStyle, minHeight: "90px" }}
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the campaign"
                required
              />
            </label>

            <label style={labelStyle}>
              Objective *
              <textarea
                style={{ ...inputStyle, minHeight: "75px" }}
                name="objective"
                value={form.objective}
                onChange={handleChange}
                placeholder="What should this campaign achieve?"
                required
              />
            </label>

            <label style={labelStyle}>
              Status
              <select
                style={inputStyle}
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </label>

            <label style={labelStyle}>
              Start Date and Time *
              <input
                style={inputStyle}
                type="datetime-local"
                name="start_at"
                value={form.start_at}
                onChange={handleChange}
                required
              />
            </label>

            <label style={labelStyle}>
              End Date and Time *
              <input
                style={inputStyle}
                type="datetime-local"
                name="end_at"
                value={form.end_at}
                onChange={handleChange}
                min={form.start_at || undefined}
                required
              />
            </label>

            {error && (
              <p role="alert" style={{ color: "#b91c1c" }}>
                {error}
              </p>
            )}

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="submit"
                disabled={saving}
                style={{
                  ...buttonStyle,
                  background: saving ? "#94a3b8" : "#4f46e5",
                  color: "#ffffff",
                  flex: 1,
                }}
              >
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Save Changes"
                    : "Create Campaign"}
              </button>

              <button
                type="button"
                onClick={cancelForm}
                disabled={saving}
                style={{
                  ...buttonStyle,
                  background: "#e2e8f0",
                  color: "#172033",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section
        style={{
          background: "#ffffff",
          padding: "24px",
          borderRadius: "14px",
          boxShadow: "0 4px 16px rgba(15, 23, 42, 0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ margin: 0 }}>
            Campaigns ({filteredCampaigns.length})
          </h2>

          <button
            onClick={loadCampaigns}
            disabled={loading}
            style={{
              ...buttonStyle,
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#172033",
            }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <input
            style={{ ...inputStyle, marginBottom: 0 }}
            type="search"
            placeholder="Search campaigns..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            style={{ ...inputStyle, marginBottom: 0 }}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter campaigns by status"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="running">Running</option>
            <option value="in review">In Review</option>
            <option value="approved">Approved</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {loading ? (
          <p>Loading campaigns...</p>
        ) : filteredCampaigns.length === 0 ? (
          <div
            style={{
              padding: "32px 16px",
              textAlign: "center",
              color: "#64748b",
              border: "1px dashed #cbd5e1",
              borderRadius: "10px",
            }}
          >
            <h3 style={{ color: "#172033" }}>No campaigns found</h3>
            <p>
              {campaigns.length === 0
                ? "Create your first campaign to get started."
                : "Try changing your search or status filter."}
            </p>

            {campaigns.length === 0 && (
              <button
                onClick={openCreateForm}
                style={{
                  ...buttonStyle,
                  background: "#4f46e5",
                  color: "#ffffff",
                }}
              >
                + Create Campaign
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "16px",
            }}
          >
            {filteredCampaigns.map((campaign) => (
              <article
                key={campaign.id}
                style={{
                  padding: "18px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  background: "#ffffff",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <h3 style={{ margin: "0 0 12px", overflowWrap: "anywhere" }}>
                    {campaign.name}
                  </h3>

                  <span
                    style={{
                      padding: "5px 9px",
                      borderRadius: "20px",
                      background:
                        String(campaign.status).toLowerCase() === "completed"
                          ? "#dcfce7"
                          : String(campaign.status).toLowerCase() === "failed"
                            ? "#fee2e2"
                            : "#e0e7ff",
                      color:
                        String(campaign.status).toLowerCase() === "completed"
                          ? "#166534"
                          : String(campaign.status).toLowerCase() === "failed"
                            ? "#b91c1c"
                            : "#3730a3",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}
                  >
                    {campaign.status || "Draft"}
                  </span>
                </div>

                <p style={{ color: "#64748b", lineHeight: 1.5 }}>
                  {campaign.description || "No description provided."}
                </p>

                <p>
                  <strong>Objective:</strong>{" "}
                  {campaign.objective || "Not specified"}
                </p>

                {campaign.start_at && (
                  <p style={{ fontSize: "13px", color: "#475569" }}>
                    <strong>Start:</strong>{" "}
                    {new Date(campaign.start_at).toLocaleString()}
                  </p>
                )}

                {campaign.end_at && (
                  <p style={{ fontSize: "13px", color: "#475569" }}>
                    <strong>End:</strong>{" "}
                    {new Date(campaign.end_at).toLocaleString()}
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginTop: "16px",
                  }}
                >
                  <button
                    onClick={() => startEditing(campaign)}
                    style={{
                      ...buttonStyle,
                      background: "#4f46e5",
                      color: "#ffffff",
                    }}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(campaign)}
                    style={{
                      ...buttonStyle,
                      background: "#fee2e2",
                      color: "#b91c1c",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Campaigns;
