import React, { useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const SEGMENTS = [
  {
    id: "Parents",
    name: "Parents",
    icon: "👨‍👩‍👧",
    description: "Family-focused awareness messages.",
  },
  {
    id: "Teachers",
    name: "Teachers",
    icon: "👩‍🏫",
    description: "Educational and community messages.",
  },
  {
    id: "College Students",
    name: "College Students",
    icon: "🎓",
    description: "Engaging messages for young adults.",
  },
];

const LANGUAGES = [
  "English",
  "Telugu",
  "Hindi",
  "Tamil",
  "Kannada",
  "Malayalam",
  "Marathi",
];

const CHANNELS = ["SMS", "WhatsApp", "Email", "Notification"];

const INITIAL_MESSAGE =
  "Hello {name}, please attend the health awareness camp in {city}. Join us to learn about healthy living!";

export default function AudiencePersonalization() {
  // --------------------------------------------------
  // STATE
  // --------------------------------------------------

  const [baseMessage, setBaseMessage] = useState(INITIAL_MESSAGE);
  const [mode, setMode] = useState("ai");
  const [language, setLanguage] = useState("English");
  const [channel, setChannel] = useState("SMS");
  const [campaignId, setCampaignId] = useState("");

  const [selectedSegments, setSelectedSegments] = useState([
    "Parents",
    "Teachers",
    "College Students",
  ]);

  const [variants, setVariants] = useState([]);

  const [recipients, setRecipients] = useState([
    {
      name: "Sample Recipient",
      age: "35",
      occupation: "Community Member",
      city: "Guntur",
      language: "English",
      role: "Parents",
      channel: "SMS",
    },
  ]);

  const [recipientIndex, setRecipientIndex] = useState(0);

  const [sampleName, setSampleName] = useState("Sample Recipient");
  const [sampleAge, setSampleAge] = useState("35");
  const [sampleOccupation, setSampleOccupation] =
    useState("Community Member");
  const [sampleCity, setSampleCity] = useState("Guntur");
  const [sampleRole, setSampleRole] = useState("Parents");
  const [sampleLanguage, setSampleLanguage] = useState("English");
  const [sampleChannel, setSampleChannel] = useState("SMS");

  const [previewMessage, setPreviewMessage] = useState("");
  const [previewLanguage, setPreviewLanguage] = useState("");
  const [previewChannel, setPreviewChannel] = useState("");

  const [loading, setLoading] = useState(false);
  const [busyVariant, setBusyVariant] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  // --------------------------------------------------
  // STYLES
  // --------------------------------------------------

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #dfe6f1",
    borderRadius: 14,
    padding: 22,
    boxShadow: "0 3px 12px rgba(19, 38, 74, 0.04)",
    marginBottom: 22,
  };

  const labelStyle = {
    display: "block",
    marginBottom: 8,
    color: "#253858",
    fontWeight: 600,
    fontSize: 14,
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 13px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    fontSize: 14,
    color: "#13264a",
    boxSizing: "border-box",
    background: "#ffffff",
  };

  const primaryButton = {
    border: "none",
    borderRadius: 8,
    padding: "12px 18px",
    background: "#3569f6",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  };

  const secondaryButton = {
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    padding: "10px 14px",
    background: "#ffffff",
    color: "#13264a",
    fontWeight: 600,
    cursor: "pointer",
  };

  // --------------------------------------------------
  // API HELPERS
  // --------------------------------------------------

  function getAuthHeaders() {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async function apiRequest(path, options = {}) {
    let response;

    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...(options.headers || {}),
        },
      });
    } catch {
      throw new Error(
        `Cannot connect to ${API_BASE_URL}. Make sure your FastAPI backend is running.`
      );
    }

    const responseText = await response.text();
    let data = {};

    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { detail: responseText };
      }
    }

    if (!response.ok) {
      const detail =
        data.detail ||
        data.message ||
        data.error ||
        `Request failed with status ${response.status}`;

      throw new Error(
        typeof detail === "string"
          ? detail
          : JSON.stringify(detail)
      );
    }

    return data;
  }

  // --------------------------------------------------
  // VARIANT HELPERS
  // --------------------------------------------------

  function getVariantId(variant) {
    return (
      variant.id ??
      variant.variant_id ??
      variant.content_variant_id
    );
  }

  function getVariantText(variant) {
    return (
      variant.text ??
      variant.content ??
      variant.message ??
      variant.variant_text ??
      ""
    );
  }

  function hasDatabaseId(variant) {
    const id = getVariantId(variant);

    if (
      id === undefined ||
      id === null ||
      id === ""
    ) {
      return false;
    }

    // IDs generated locally as fallbacks are not database IDs.
    if (
      typeof id === "string" &&
      (
        id.startsWith("Parents-") ||
        id.startsWith("Teachers-") ||
        id.startsWith("College Students-") ||
        id.startsWith("Segment ") ||
        id.startsWith("variant-")
      )
    ) {
      return false;
    }

    return true;
  }

  function normalizeVariants(data) {
    const raw = Array.isArray(data)
      ? data
      : data.variants ??
        data.data?.variants ??
        data.results ??
        data.data?.results ??
        [];

    if (Array.isArray(raw)) {
      return raw.map((variant, index) => ({
        ...variant,
        id:
          getVariantId(variant) ??
          `${variant.segment || variant.segment_name || "segment"}-${index}`,
        segment:
          variant.segment ??
          variant.segment_name ??
          variant.audience ??
          `Segment ${index + 1}`,
        language: variant.language || language,
        channel: variant.channel || channel,
        text: getVariantText(variant),
      }));
    }

    if (raw && typeof raw === "object") {
      return Object.entries(raw).map(([segment, value], index) => {
        const item =
          typeof value === "string"
            ? { text: value }
            : value || {};

        return {
          ...item,
          id:
            getVariantId(item) ??
            `${segment}-${index}`,
          segment:
            item.segment ||
            item.segment_name ||
            segment,
          language: item.language || language,
          channel: item.channel || channel,
          text: getVariantText(item),
        };
      });
    }

    return [];
  }

  function toggleSegment(segmentId) {
    setSelectedSegments((previous) =>
      previous.includes(segmentId)
        ? previous.filter((item) => item !== segmentId)
        : [...previous, segmentId]
    );
  }

  // --------------------------------------------------
  // PLACEHOLDER REPLACEMENT
  // --------------------------------------------------

  function fillPlaceholders(message, recipient) {
    const values = {
      name: recipient.name || "",
      age: recipient.age ?? "",
      occupation: recipient.occupation || "",
      city: recipient.city || "",
      language: recipient.language || "",
      role: recipient.role || "",
      segment: recipient.role || "",
    };

    return String(message || "").replace(
      /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g,
      (match, key) =>
        Object.prototype.hasOwnProperty.call(values, key)
          ? String(values[key])
          : match
    );
  }

  // --------------------------------------------------
  // GENERATE VARIANTS
  // --------------------------------------------------

  async function generateVariants() {
    setError("");
    setSuccess("");
    setPreviewMessage("");

    if (!baseMessage.trim()) {
      setError("Please enter a base campaign message.");
      return;
    }

    if (selectedSegments.length === 0) {
      setError("Please select at least one audience segment.");
      return;
    }

    if (
      campaignId.trim() &&
      (
        !Number.isInteger(Number(campaignId)) ||
        Number(campaignId) <= 0
      )
    ) {
      setError("Campaign ID must be a positive integer.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        base_message: baseMessage.trim(),
        segments: selectedSegments,
        mode,
        language,
        channel,
        ...(campaignId.trim()
          ? { campaign_id: Number(campaignId) }
          : {}),
      };

      const data = await apiRequest(
        "/api/ai/personalize",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      const generated = normalizeVariants(data);

      if (generated.length === 0) {
        throw new Error(
          "The backend returned no variants. Check the API response in Swagger."
        );
      }

      setVariants(generated);
      setEditingId(null);
      setEditText("");

      setSuccess(
        `${generated.length} variant(s) generated successfully.`
      );
    } catch (err) {
      setError(`Could not generate variants: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // EDIT VARIANT
  // --------------------------------------------------

  function startEditing(variant) {
    setEditingId(getVariantId(variant));
    setEditText(getVariantText(variant));
    setError("");
    setSuccess("");
  }

  // --------------------------------------------------
  // SAVE VARIANT
  // --------------------------------------------------

  async function saveVariant(variant) {
    const variantId = getVariantId(variant);

    if (!hasDatabaseId(variant)) {
      setError(
        "This variant has no database ID. Check whether the generate API returns the saved variant ID."
      );
      return;
    }

    if (!editText.trim()) {
      setError("Variant text cannot be empty.");
      return;
    }

    setBusyVariant(String(variantId));
    setError("");
    setSuccess("");

    try {
      const data = await apiRequest(
        `/api/ai/personalize/variants/${encodeURIComponent(variantId)}`,
        {
          method: "PUT",
          body: JSON.stringify({
            text: editText.trim(),
          }),
        }
      );

      setVariants((previous) =>
        previous.map((item) =>
          String(getVariantId(item)) === String(variantId)
            ? {
                ...item,
                ...data,
                id: variantId,
                text:
                  data.text ??
                  data.content ??
                  data.message ??
                  editText.trim(),
              }
            : item
        )
      );

      setEditingId(null);
      setEditText("");
      setSuccess("Variant changes saved successfully.");
    } catch (err) {
      setError(`Could not save the variant: ${err.message}`);
    } finally {
      setBusyVariant(null);
    }
  }

  // --------------------------------------------------
  // REGENERATE VARIANT
  // --------------------------------------------------

  async function regenerateVariant(variant) {
    const variantId = getVariantId(variant);

    if (!hasDatabaseId(variant)) {
      setError(
        "This variant has no saved database ID. Check the generate API response."
      );
      return;
    }

    setBusyVariant(String(variantId));
    setError("");
    setSuccess("");

    try {
      const data = await apiRequest(
        `/api/ai/personalize/variants/${encodeURIComponent(variantId)}/regenerate`,
        {
          method: "POST",
          body: JSON.stringify({
            tone: "Friendly and informative",
            word_limit: 100,
            key_points: "",
          }),
        }
      );

      const replacement =
        data.variant ??
        data.data?.variant ??
        data.data ??
        data;

      const newText =
        typeof replacement === "string"
          ? replacement
          : getVariantText(replacement);

      if (!newText) {
        throw new Error(
          "The backend did not return the regenerated message."
        );
      }

      setVariants((previous) =>
        previous.map((item) =>
          String(getVariantId(item)) === String(variantId)
            ? {
                ...item,
                ...(typeof replacement === "object"
                  ? replacement
                  : {}),
                id: variantId,
                text: newText,
              }
            : item
        )
      );

      setSuccess(
        `The ${variant.segment} variant was regenerated successfully.`
      );
    } catch (err) {
      setError(`Could not regenerate the variant: ${err.message}`);
    } finally {
      setBusyVariant(null);
    }
  }

  // --------------------------------------------------
  // PREVIEW AS RECIPIENT
  // --------------------------------------------------

  async function previewRecipientFor(recipient) {
    setError("");
    setSuccess("");
    setPreviewMessage("");

    const selectedVariant = variants.find(
      (variant) =>
        String(variant.segment).toLowerCase() ===
        String(recipient.role).toLowerCase()
    );

    if (!selectedVariant) {
      setError(
        `No generated variant exists for ${recipient.role}. Generate that segment first.`
      );
      return;
    }

    const variantId = getVariantId(selectedVariant);

    // Local preview for placeholder mode.
    if (mode === "placeholder") {
      let message = fillPlaceholders(
        getVariantText(selectedVariant),
        recipient
      );

      if (
        String(recipient.language).toLowerCase() !==
        String(selectedVariant.language || language).toLowerCase()
      ) {
        setError(
          "Placeholder mode does not translate messages automatically. Select the same language as the variant or use AI Segment Rewriting."
        );
        return;
      }

      if (
        String(recipient.channel).toLowerCase() === "sms"
      ) {
        message = message.slice(0, 160);
      }

      setPreviewMessage(message);
      setPreviewLanguage(recipient.language || language);
      setPreviewChannel(recipient.channel || channel);
      setSuccess("Recipient preview created successfully.");
      return;
    }

    if (!hasDatabaseId(selectedVariant)) {
      setError(
        "This variant has no database ID, so the backend preview API cannot load it."
      );
      return;
    }

    const busyKey = `preview-${variantId}`;

    setBusyVariant(busyKey);

    try {
      const data = await apiRequest(
        "/api/ai/personalize/preview",
        {
          method: "POST",
          body: JSON.stringify({
            variant_id: Number(variantId),
            recipient: {
              ...recipient,
              age:
                recipient.age === "" || recipient.age == null
                  ? null
                  : Number(recipient.age),
            },
          }),
        }
      );

      const message =
        data.message ??
        data.personalized_message ??
        data.preview ??
        data.text ??
        data.data?.message ??
        data.data?.preview;

      if (
        typeof message !== "string" ||
        !message.trim()
      ) {
        throw new Error(
          "The preview API returned no message. Check the PreviewRequest schema in Swagger."
        );
      }

      setPreviewMessage(message);
      setPreviewLanguage(data.language || recipient.language || language);
      setPreviewChannel(data.channel || recipient.channel || channel);

      setSuccess("Recipient preview loaded successfully.");
    } catch (err) {
      setError(`Could not preview the recipient: ${err.message}`);
    } finally {
      setBusyVariant(null);
    }
  }

  async function previewRecipient() {
    const currentRecipient = recipients[recipientIndex];

    if (!currentRecipient) {
      setError("Please select a recipient.");
      return;
    }

    const updatedRecipient = {
      ...currentRecipient,
      name: sampleName.trim(),
      age: sampleAge,
      occupation: sampleOccupation.trim(),
      city: sampleCity.trim(),
      role: sampleRole,
      language: sampleLanguage,
      channel: sampleChannel,
    };

    setRecipients((previous) =>
      previous.map((item, index) =>
        index === recipientIndex
          ? updatedRecipient
          : item
      )
    );

    await previewRecipientFor(updatedRecipient);
  }

  // --------------------------------------------------
  // ADD SAMPLE RECIPIENT
  // --------------------------------------------------

  function addSampleRecipient() {
    setError("");
    setSuccess("");

    if (!sampleName.trim() || !sampleCity.trim()) {
      setError("Please enter the recipient's name and city.");
      return;
    }

    const recipient = {
      name: sampleName.trim(),
      age: sampleAge,
      occupation: sampleOccupation.trim(),
      city: sampleCity.trim(),
      language: sampleLanguage,
      role: sampleRole,
      channel: sampleChannel,
    };

    setRecipients((previous) => {
      const next = [...previous, recipient];
      setRecipientIndex(next.length - 1);
      return next;
    });

    setPreviewMessage("");
    setSuccess("Sample recipient added successfully.");
  }

  // --------------------------------------------------
  // PAGE UI
  // --------------------------------------------------

  return (
    <div className="personalization-page">
      <style>{`
        .personalization-page {
          max-width: 1450px;
          margin: 0 auto;
          color: #13264a;
          font-family: Arial, sans-serif;
        }

        .personalization-page * {
          box-sizing: border-box;
        }

        .personalization-page textarea,
        .personalization-page input,
        .personalization-page select {
          font: inherit;
        }

        .personalization-page textarea:focus,
        .personalization-page input:focus,
        .personalization-page select:focus {
          outline: 2px solid #b9cbff;
          border-color: #3569f6;
        }

        .personalization-page .muted {
          color: #64748b;
        }

        .personalization-page .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .personalization-page .segment-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .personalization-page .segment-option {
          border: 1px solid #dfe6f1;
          border-radius: 12px;
          padding: 18px;
          background: #fff;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .personalization-page .segment-option.selected {
          border: 2px solid #3569f6;
          background: #f0f4ff;
        }

        .personalization-page .variant-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .personalization-page .variant-text {
          width: 100%;
          min-height: 150px;
          resize: vertical;
          padding: 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          line-height: 1.6;
          color: #13264a;
          background: #fff;
        }

        .personalization-page .status-message {
          padding: 13px 16px;
          border-radius: 8px;
          margin: 16px 0;
          overflow-wrap: anywhere;
        }

        .personalization-page .error-message {
          background: #fff0f0;
          border: 1px solid #fecaca;
          color: #991b1b;
        }

        .personalization-page .success-message {
          background: #ecfdf3;
          border: 1px solid #bbf7d0;
          color: #166534;
        }

        @media (max-width: 900px) {
          .personalization-page .segment-grid,
          .personalization-page .variant-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .personalization-page .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* PAGE HEADING */}

      <header style={{ marginBottom: 26 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              display: "grid",
              placeItems: "center",
              background: "#e9efff",
              fontSize: 24,
            }}
          >
            ✨
          </div>

          <div>
            <h1 style={{ fontSize: 30, margin: 0 }}>
              Audience-Specific Content Personalization
            </h1>

            <p className="muted" style={{ margin: "8px 0 0" }}>
              Create, edit, and preview campaign messages for different
              audience segments.
            </p>
          </div>
        </div>
      </header>

      {/* STATUS MESSAGES */}

      {error && (
        <div className="status-message error-message" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div className="status-message success-message" role="status">
          {success}
        </div>
      )}

      {/* 1. BASE CAMPAIGN MESSAGE */}

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0, fontSize: 21 }}>
          1. Base Campaign Message
        </h2>

        <p className="muted">
          Use placeholders such as <code>{"{name}"}</code>,{" "}
          <code>{"{city}"}</code>, <code>{"{age}"}</code>, and{" "}
          <code>{"{occupation}"}</code>.
        </p>

        <label style={labelStyle} htmlFor="base-message">
          Campaign message
        </label>

        <textarea
          id="base-message"
          value={baseMessage}
          onChange={(event) => setBaseMessage(event.target.value)}
          rows={5}
          placeholder="Enter your campaign message..."
          style={{
            ...inputStyle,
            resize: "vertical",
            lineHeight: 1.6,
          }}
        />

        <div className="form-grid" style={{ marginTop: 18 }}>
          <div>
            <label style={labelStyle} htmlFor="campaign-id">
              Campaign ID (optional)
            </label>

            <input
              id="campaign-id"
              value={campaignId}
              onChange={(event) => setCampaignId(event.target.value)}
              placeholder="Enter existing campaign ID"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle} htmlFor="personalization-mode">
              Personalization mode
            </label>

            <select
              id="personalization-mode"
              value={mode}
              onChange={(event) => {
                setMode(event.target.value);
                setPreviewMessage("");
              }}
              style={inputStyle}
            >
              <option value="placeholder">Placeholder Filling</option>
              <option value="ai">AI Segment Rewriting</option>
            </select>
          </div>

          <div>
            <label style={labelStyle} htmlFor="output-language">
              Default language
            </label>

            <select
              id="output-language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              style={inputStyle}
            >
              {LANGUAGES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle} htmlFor="output-channel">
              Communication channel
            </label>

            <select
              id="output-channel"
              value={channel}
              onChange={(event) => setChannel(event.target.value)}
              style={inputStyle}
            >
              {CHANNELS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {mode === "placeholder" && (
          <div
            style={{
              marginTop: 15,
              padding: 13,
              background: "#f0f6ff",
              borderRadius: 8,
              color: "#25477f",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            <strong>Placeholder mode:</strong> Recipient details replace
            supported placeholders when you preview a message. This mode
            does not automatically translate messages.
          </div>
        )}
      </section>

      {/* 2. SELECT AUDIENCE SEGMENTS */}

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0, fontSize: 21 }}>
          2. Select Audience Segments
        </h2>

        <p className="muted">
          Generate one reusable message variant for each selected segment.
        </p>

        <div className="segment-grid">
          {SEGMENTS.map((segment) => {
            const selected = selectedSegments.includes(segment.id);

            return (
              <label
                key={segment.id}
                className={`segment-option ${selected ? "selected" : ""}`}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleSegment(segment.id)}
                    style={{
                      width: 17,
                      height: 17,
                      marginTop: 5,
                      accentColor: "#3569f6",
                    }}
                  />

                  <div>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        marginBottom: 8,
                      }}
                    >
                      {segment.icon} {segment.name}
                    </div>

                    <p
                      className="muted"
                      style={{
                        margin: 0,
                        fontSize: 13,
                        lineHeight: 1.5,
                      }}
                    >
                      {segment.description}
                    </p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 15,
            marginTop: 22,
          }}
        >
          <button
            type="button"
            onClick={generateVariants}
            disabled={loading}
            style={{
              ...primaryButton,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Generating..." : "✨ Generate Variants"}
          </button>

          <span className="muted" style={{ fontSize: 13 }}>
            {selectedSegments.length} segment(s) selected
          </span>
        </div>
      </section>

      {/* 3. GENERATED VARIANTS */}

      <section style={cardStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 21 }}>
              3. Generated Variants
            </h2>

            <p className="muted" style={{ marginBottom: 0 }}>
              Edit, save, or regenerate each segment's message.
            </p>
          </div>

          <span
            style={{
              background: "#e9efff",
              color: "#2853bf",
              padding: "7px 12px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {variants.length} variant(s)
          </span>
        </div>

        {variants.length === 0 ? (
          <div
            style={{
              padding: 35,
              textAlign: "center",
              border: "1px dashed #cbd5e1",
              borderRadius: 10,
              background: "#f8faff",
            }}
          >
            <div style={{ fontSize: 35, marginBottom: 10 }}>📝</div>

            <strong>No variants generated yet</strong>

            <p className="muted" style={{ marginBottom: 0 }}>
              Enter your message, select segments, and click Generate
              Variants.
            </p>
          </div>
        ) : (
          <div className="variant-grid">
            {variants.map((variant, index) => {
              const variantId = getVariantId(variant);
              const isEditing =
                String(editingId) === String(variantId);
              const isBusy =
                String(busyVariant) === String(variantId);

              const segmentInfo = SEGMENTS.find(
                (item) =>
                  item.id.toLowerCase() ===
                  String(variant.segment).toLowerCase()
              );

              return (
                <article
                  key={`${variantId}-${index}`}
                  style={{
                    border: "1px solid #dfe6f1",
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "#fff",
                  }}
                >
                  <div
                    style={{
                      padding: "16px 18px",
                      background: "#f3f6ff",
                      borderBottom: "1px solid #dfe6f1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 16 }}>
                        {variant.segment}
                      </strong>

                      <div
                        className="muted"
                        style={{ fontSize: 12, marginTop: 5 }}
                      >
                        {variant.language || language} ·{" "}
                        {variant.channel || channel}
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          color: hasDatabaseId(variant)
                            ? "#15803d"
                            : "#b45309",
                          marginTop: 5,
                        }}
                      >
                        {hasDatabaseId(variant)
                          ? `Saved variant ID: ${variantId}`
                          : "No database ID returned"}
                      </div>
                    </div>

                    <span style={{ fontSize: 24 }}>
                      {segmentInfo?.icon || "✉️"}
                    </span>
                  </div>

                  <div style={{ padding: 18 }}>
                    {isEditing ? (
                      <>
                        <label
                          style={labelStyle}
                          htmlFor={`edit-${index}`}
                        >
                          Edit message
                        </label>

                        <textarea
                          id={`edit-${index}`}
                          className="variant-text"
                          value={editText}
                          onChange={(event) =>
                            setEditText(event.target.value)
                          }
                        />

                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 9,
                            marginTop: 12,
                          }}
                        >
                          <button
                            type="button"
                            style={primaryButton}
                            disabled={isBusy}
                            onClick={() => saveVariant(variant)}
                          >
                            {isBusy ? "Saving..." : "Save Changes"}
                          </button>

                          <button
                            type="button"
                            style={secondaryButton}
                            onClick={() => {
                              setEditingId(null);
                              setEditText("");
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          style={{
                            whiteSpace: "pre-wrap",
                            overflowWrap: "anywhere",
                            lineHeight: 1.7,
                            minHeight: 100,
                            fontSize: 14,
                          }}
                        >
                          {getVariantText(variant) ||
                            "No message text was returned."}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 9,
                            marginTop: 20,
                          }}
                        >
                          <button
                            type="button"
                            style={secondaryButton}
                            onClick={() => startEditing(variant)}
                          >
                            ✏️ Edit
                          </button>

                          <button
                            type="button"
                            style={{
                              ...secondaryButton,
                              color: "#2853bf",
                            }}
                            disabled={isBusy}
                            onClick={() => regenerateVariant(variant)}
                          >
                            {isBusy ? "Working..." : "🔄 Regenerate"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. PREVIEW AS RECIPIENT */}

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0, fontSize: 21 }}>
          4. Preview as Recipient
        </h2>

        <p className="muted">
          Select a sample recipient and preview the message intended for
          their audience segment, language, and communication channel.
        </p>

        <div className="form-grid">
          <div>
            <label style={labelStyle} htmlFor="recipient-select">
              Select recipient
            </label>

            <select
              id="recipient-select"
              value={recipientIndex}
              onChange={(event) => {
                const index = Number(event.target.value);
                const recipient = recipients[index];

                setRecipientIndex(index);

                if (recipient) {
                  setSampleName(recipient.name || "");
                  setSampleAge(recipient.age ?? "");
                  setSampleOccupation(recipient.occupation || "");
                  setSampleCity(recipient.city || "");
                  setSampleRole(recipient.role || "Parents");
                  setSampleLanguage(recipient.language || "English");
                  setSampleChannel(recipient.channel || "SMS");
                }

                setPreviewMessage("");
                setError("");
                setSuccess("");
              }}
              style={inputStyle}
            >
              {recipients.map((recipient, index) => (
                <option key={index} value={index}>
                  {recipient.name} — {recipient.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle} htmlFor="recipient-name">
              Recipient name
            </label>

            <input
              id="recipient-name"
              value={sampleName}
              onChange={(event) => setSampleName(event.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle} htmlFor="recipient-age">
              Age
            </label>

            <input
              id="recipient-age"
              type="number"
              min="0"
              value={sampleAge}
              onChange={(event) => setSampleAge(event.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle} htmlFor="recipient-occupation">
              Occupation
            </label>

            <input
              id="recipient-occupation"
              value={sampleOccupation}
              onChange={(event) =>
                setSampleOccupation(event.target.value)
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle} htmlFor="recipient-city">
              City
            </label>

            <input
              id="recipient-city"
              value={sampleCity}
              onChange={(event) => setSampleCity(event.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle} htmlFor="recipient-role">
              Audience segment / role
            </label>

            <select
              id="recipient-role"
              value={sampleRole}
              onChange={(event) => setSampleRole(event.target.value)}
              style={inputStyle}
            >
              {SEGMENTS.map((segment) => (
                <option key={segment.id} value={segment.id}>
                  {segment.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle} htmlFor="recipient-language">
              Recipient language
            </label>

            <select
              id="recipient-language"
              value={sampleLanguage}
              onChange={(event) =>
                setSampleLanguage(event.target.value)
              }
              style={inputStyle}
            >
              {LANGUAGES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle} htmlFor="recipient-channel">
              Communication channel
            </label>

            <select
              id="recipient-channel"
              value={sampleChannel}
              onChange={(event) =>
                setSampleChannel(event.target.value)
              }
              style={inputStyle}
            >
              {CHANNELS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginTop: 20,
          }}
        >
          <button
            type="button"
            style={primaryButton}
            disabled={String(busyVariant || "").startsWith("preview-")}
            onClick={previewRecipient}
          >
            {String(busyVariant || "").startsWith("preview-")
              ? "Loading Preview..."
              : "👁️ Preview Message"}
          </button>

          <button
            type="button"
            style={secondaryButton}
            onClick={addSampleRecipient}
          >
            + Add Sample Recipient
          </button>
        </div>

        {/* FINAL MESSAGE PREVIEW */}

        {previewMessage && (
          <div
            style={{
              marginTop: 24,
              padding: 20,
              border: "1px solid #cbd8ff",
              borderRadius: 12,
              background: "#f4f7ff",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <h3 style={{ margin: 0 }}>
                Final Message Preview
              </h3>

              <span
                style={{
                  padding: "5px 10px",
                  borderRadius: 20,
                  background: "#dfe8ff",
                  color: "#2853bf",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {previewLanguage} · {previewChannel}
              </span>
            </div>

            <p
              style={{
                margin: 0,
                lineHeight: 1.8,
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}
            >
              {previewMessage}
            </p>

            {previewChannel === "SMS" && (
              <p className="muted" style={{ fontSize: 12 }}>
                Preview length: {previewMessage.length} characters
              </p>
            )}
          </div>
        )}
      </section>

      <div
        className="muted"
        style={{
          fontSize: 12,
          lineHeight: 1.7,
          padding: "0 2px 20px",
        }}
      >
        Note: Previewing a message does not send it. Actual delivery
        requires a separate messaging integration.
      </div>
    </div>
  );
}