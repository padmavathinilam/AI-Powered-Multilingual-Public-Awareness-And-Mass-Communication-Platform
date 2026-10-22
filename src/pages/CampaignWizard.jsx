
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";

const channelOptions = ["SMS", "Email", "WhatsApp", "Social Media"];

const initialForm = {
  name: "",
  description: "",
  objective: "Awareness",
  campaign_type: "Awareness",
  target_segments: [],
  channels: ["Email"],
  start_at: "",
  end_at: "",
  priority: "Normal",
};

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
  if (Array.isArray(data?.segments)) return data.segments;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

export default function CampaignWizard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [segments, setSegments] = useState([]);
  const [loadingSegments, setLoadingSegments] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => ({
    ...initialForm,
    ...(location.state?.template || {}),
  }));

  useEffect(() => {
    let active = true;

    async function loadSegments() {
      try {
        const response = await api.get("/api/segments/");
        if (active) setSegments(getArray(response.data));
      } catch {
        if (active) setSegments([]);
      } finally {
        if (active) setLoadingSegments(false);
      }
    }

    loadSegments();
    return () => {
      active = false;
    };
  }, []);

  const update = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const toggleValue = (field, value) => {
    setForm((previous) => {
      const values = previous[field];
      return {
        ...previous,
        [field]: values.includes(value)
          ? values.filter((item) => item !== value)
          : [...values, value],
      };
    });
  };

  const validateStep = () => {
    if (step === 1 && !form.name.trim()) {
      setError("Enter a campaign name.");
      return false;
    }

    if (step === 2 && form.channels.length === 0) {
      setError("Select at least one communication channel.");
      return false;
    }

    if (step === 3) {
      if (!form.start_at || !form.end_at) {
        setError("Select both the start and end dates.");
        return false;
      }

      if (new Date(form.end_at) < new Date(form.start_at)) {
        setError("The end date must be on or after the start date.");
        return false;
      }
    }

    setError("");
    return true;
  };

  const next = () => {
    if (validateStep()) setStep((previous) => Math.min(4, previous + 1));
  };

  const saveCampaign = async () => {
    const userId = getUserId();

    if (!userId) {
      setError(
        "Your user ID was not found. Sign in again and try saving."
      );
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      objective: form.objective,
      campaign_type: form.campaign_type,
      target_segments: form.target_segments,
      channels: form.channels,
      priority:
        form.campaign_type === "Emergency" ? "High" : form.priority,
      status: "Draft",
      created_by: userId,
      start_at: form.start_at
        ? new Date(form.start_at).toISOString()
        : null,
      end_at: form.end_at
        ? new Date(form.end_at).toISOString()
        : null,
    };

    try {
      await api.post("/api/campaigns/", payload);
      navigate("/campaigns", {
        replace: true,
        state: { message: "Campaign draft saved successfully." },
      });
    } catch (err) {
      setError(
        err.response?.data?.detail
          ? typeof err.response.data.detail === "string"
            ? err.response.data.detail
            : JSON.stringify(err.response.data.detail)
          : "Unable to save the campaign. Check the backend and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #d7dfed",
    borderRadius: "9px",
    marginTop: "7px",
    fontSize: "14px",
    background: "#fff",
  };

  const labelStyle = {
    display: "block",
    fontSize: "14px",
    fontWeight: 600,
    marginBottom: "18px",
    color: "#243656",
  };

  const buttonStyle = {
    border: 0,
    borderRadius: "9px",
    padding: "11px 18px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "14px",
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", color: "#13264a" }}>
      <div style={{ marginBottom: 25 }}>
        <button
          onClick={() => navigate("/campaigns")}
          style={{
            ...buttonStyle,
            background: "transparent",
            color: "#3569f6",
            paddingLeft: 0,
          }}
        >
          ← Back to campaigns
        </button>

        <h1 style={{ margin: "8px 0", fontSize: 28 }}>
          Create Campaign
        </h1>
        <p style={{ color: "#71809a", margin: 0 }}>
          Build and review your public awareness campaign.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 10,
          marginBottom: 25,
        }}
      >
        {["Details", "Audience", "Schedule", "Review"].map(
          (title, index) => (
            <div
              key={title}
              style={{
                padding: "13px 8px",
                borderRadius: 10,
                background: step === index + 1 ? "#e9efff" : "#fff",
                border:
                  step === index + 1
                    ? "1px solid #3569f6"
                    : "1px solid #e1e7f0",
                textAlign: "center",
                color: step === index + 1 ? "#2454d8" : "#687791",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {index + 1}. {title}
            </div>
          )
        )}
      </div>

      <section
        style={{
          background: "#fff",
          border: "1px solid #e2e8f2",
          borderRadius: 15,
          padding: 25,
          boxShadow: "0 5px 20px rgba(19,38,74,0.04)",
        }}
      >
        {step === 1 && (
          <>
            <h2 style={{ marginTop: 0 }}>Campaign details</h2>

            <label style={labelStyle}>
              Campaign name *
              <input
                style={inputStyle}
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Community Health Awareness"
              />
            </label>

            <label style={labelStyle}>
              Description
              <textarea
                style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Describe the campaign and its purpose."
              />
            </label>

            <label style={labelStyle}>
              Objective
              <select
                style={inputStyle}
                value={form.objective}
                onChange={(e) => update("objective", e.target.value)}
              >
                <option>Awareness</option>
                <option>Education</option>
                <option>Public Safety</option>
                <option>Health</option>
                <option>Community Engagement</option>
                <option>Emergency Response</option>
              </select>
            </label>

            <label style={labelStyle}>
              Campaign type
              <select
                style={inputStyle}
                value={form.campaign_type}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((previous) => ({
                    ...previous,
                    campaign_type: value,
                    priority: value === "Emergency" ? "High" : "Normal",
                  }));
                }}
              >
                <option value="Awareness">Awareness</option>
                <option value="Educational">Educational</option>
                <option value="Emergency">Emergency</option>
                <option value="Government">Government</option>
                <option value="Community">Community</option>
              </select>
            </label>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ marginTop: 0 }}>Audience and channels</h2>
            <p style={{ color: "#71809a" }}>
              Select the audience segments and communication channels.
            </p>

            <h3 style={{ fontSize: 16 }}>Audience segments</h3>

            {loadingSegments ? (
              <p>Loading segments...</p>
            ) : segments.length === 0 ? (
              <p style={{ color: "#71809a" }}>
                No segments were returned by the API. You can continue
                without selecting a segment.
              </p>
            ) : (
              <div style={{ display: "grid", gap: 10, marginBottom: 25 }}>
                {segments.map((segment) => {
                  const id = segment.id;
                  const title =
                    segment.name || segment.segment_name || `Segment ${id}`;

                  return (
                    <label
                      key={id}
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        border: "1px solid #e1e7f0",
                        borderRadius: 9,
                        padding: 12,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.target_segments.includes(id)}
                        onChange={() => toggleValue("target_segments", id)}
                      />
                      <span>{title}</span>
                    </label>
                  );
                })}
              </div>
            )}

            <h3 style={{ fontSize: 16 }}>Communication channels *</h3>
            <div style={{ display: "grid", gap: 10 }}>
              {channelOptions.map((channel) => (
                <label
                  key={channel}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: 12,
                    border: "1px solid #e1e7f0",
                    borderRadius: 9,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.channels.includes(channel)}
                    onChange={() => toggleValue("channels", channel)}
                  />
                  {channel}
                </label>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 style={{ marginTop: 0 }}>Schedule and priority</h2>

            <label style={labelStyle}>
              Start date and time *
              <input
                type="datetime-local"
                style={inputStyle}
                value={form.start_at}
                onChange={(e) => update("start_at", e.target.value)}
              />
            </label>

            <label style={labelStyle}>
              End date and time *
              <input
                type="datetime-local"
                style={inputStyle}
                value={form.end_at}
                min={form.start_at || undefined}
                onChange={(e) => update("end_at", e.target.value)}
              />
            </label>

            <label style={labelStyle}>
              Priority
              <select
                style={inputStyle}
                value={form.campaign_type === "Emergency" ? "High" : form.priority}
                disabled={form.campaign_type === "Emergency"}
                onChange={(e) => update("priority", e.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
              </select>
            </label>

            {form.campaign_type === "Emergency" && (
              <p style={{ color: "#b42318", fontSize: 13 }}>
                Emergency campaigns are automatically assigned High priority.
              </p>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <h2 style={{ marginTop: 0 }}>Review your campaign</h2>

            {[
              ["Name", form.name],
              ["Description", form.description || "Not provided"],
              ["Objective", form.objective],
              ["Type", form.campaign_type],
              [
                "Selected segments",
                form.target_segments.length
                  ? form.target_segments.join(", ")
                  : "None selected",
              ],
              ["Channels", form.channels.join(", ") || "None selected"],
              ["Start", form.start_at || "Not set"],
              ["End", form.end_at || "Not set"],
              [
                "Priority",
                form.campaign_type === "Emergency" ? "High" : form.priority,
              ],
              ["Status", "Draft"],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(120px, 180px) 1fr",
                  gap: 12,
                  padding: "13px 0",
                  borderBottom: "1px solid #edf0f6",
                }}
              >
                <strong style={{ fontSize: 14 }}>{label}</strong>
                <span style={{ fontSize: 14, color: "#53637d", overflowWrap: "anywhere" }}>
                  {value}
                </span>
              </div>
            ))}
          </>
        )}

        {error && (
          <div
            role="alert"
            style={{
              marginTop: 20,
              padding: 12,
              borderRadius: 8,
              background: "#fff0f0",
              color: "#b42318",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            marginTop: 25,
            flexWrap: "wrap",
          }}
        >
          <button
            style={{
              ...buttonStyle,
              background: "#eef2f8",
              color: "#243656",
            }}
            disabled={step === 1 || saving}
            onClick={() => {
              setError("");
              setStep((previous) => Math.max(1, previous - 1));
            }}
          >
            Back
          </button>

          {step < 4 ? (
            <button
              style={{ ...buttonStyle, background: "#3569f6", color: "#fff" }}
              onClick={next}
            >
              Continue →
            </button>
          ) : (
            <button
              style={{
                ...buttonStyle,
                background: "#3569f6",
                color: "#fff",
                opacity: saving ? 0.7 : 1,
              }}
              disabled={saving}
              onClick={saveCampaign}
            >
              {saving ? "Saving..." : "Save as Draft"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
