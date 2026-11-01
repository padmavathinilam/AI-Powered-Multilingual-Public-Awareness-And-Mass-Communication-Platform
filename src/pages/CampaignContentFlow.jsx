import React, { useState } from "react";
import api, { reviewCampaignContent } from "../services/api";
import "./CampaignContentFlow.css";

const STEPS = [
  { id: 7, title: "Content Studio" },
  { id: 8, title: "Translation" },
  { id: 9, title: "Personalization" },
  { id: 10, title: "Tone Optimization" },
  { id: 11, title: "AI Quality Review" },
  { id: 12, title: "Approval Workflow" },
  { id: 13, title: "Content Summary" },
];

const LANGUAGES = [
  "Hindi",
  "Kannada",
  "Tamil",
  "Telugu",
  "Marathi",
  "Bengali",
  "Gujarati",
  "Malayalam",
  "Punjabi",
  "Urdu",
];

const SEGMENTS = [
  "Parents",
  "Teachers",
  "College Students",
  "General Public",
  "Senior Citizens",
];

const CAMPAIGN_TYPES = [
  "Awareness",
  "Emergency Alert",
  "Education",
  "Announcement",
];

const TONES = [
  "Friendly",
  "Formal",
  "Persuasive",
  "Informative",
  "Urgent",
];

const getMessage = (data) => {
  if (typeof data === "string") return data;

  return (
    data?.content ??
    data?.message ??
    data?.generated_message ??
    data?.output ??
    data?.text ??
    data?.translation ??
    data?.translated_text ??
    data?.improved_content ??
    data?.improved_text ??
    data?.rewritten_text ??
    ""
  );
};

const getErrorMessage = (error) => {
  const detail = error?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const field = item.loc?.slice(-1)[0];
        return field ? `${field}: ${item.msg}` : item.msg;
      })
      .join(", ");
  }

  return (
    detail ||
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
};

const formatEmailContent = (text) => {
  if (!text || typeof text !== "string") return text || "";

  let formatted = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  formatted = formatted.replace(
    /^(Subject:[^\n]*?)(\s+)(?=(?:Dear\b|Hello\b|Hi\b))/i,
    "$1\n\n"
  );

  formatted = formatted.replace(
    /[ \t]+(Dear\b[^,\n]*,|Hello\b[^,\n]*,|Hi\b[^,\n]*,)/gi,
    "\n\n$1"
  );

  formatted = formatted.replace(
    /[ \t]+(Best regards,|Kind regards,|Regards,|Sincerely,|Yours sincerely,)/gi,
    "\n\n$1"
  );

  formatted = formatted.replace(
    /(Best regards,|Kind regards,|Regards,|Sincerely,|Yours sincerely,)[ \t]+/gi,
    "$1\n"
  );

  return formatted.replace(/\n{3,}/g, "\n\n").trim();
};

export default function CampaignContentFlow() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // TASK 7: CONTENT STUDIO

  const [campaignType, setCampaignType] = useState("Awareness");
  const [topic, setTopic] = useState("Polio camp this Sunday");
  const [audience, setAudience] = useState(
    "Families and parents in the local community"
  );
  const [tone, setTone] = useState("Friendly");
  const [length, setLength] = useState("SMS short");
  const [channel, setChannel] = useState("SMS");
  const [keyPoints, setKeyPoints] = useState(
    "Date: Sunday; Venue: local health centre; Bring vaccination card"
  );
  const [content, setContent] = useState("");
  const [history, setHistory] = useState([]);

  // TASK 8: TRANSLATION

  const [languages, setLanguages] = useState([
    "Telugu",
    "Hindi",
    "Tamil",
  ]);
  const [translations, setTranslations] = useState({});
  const [activeLanguage, setActiveLanguage] = useState("Telugu");
  const [approvedTranslations, setApprovedTranslations] = useState({});

  // TASK 9: PERSONALIZATION

  const [segments, setSegments] = useState([
    "Parents",
    "Teachers",
    "College Students",
  ]);
  const [personalizationMode, setPersonalizationMode] = useState("ai");
  const [variants, setVariants] = useState([]);
  const [recipient, setRecipient] = useState({
    name: "Sample Recipient",
    age: "35",
    occupation: "Community Member",
    city: "Guntur",
    language: "English",
    role: "Parents",
  });
  const [preview, setPreview] = useState("");

  // TASK 10: TONE OPTIMIZATION

  const [analysis, setAnalysis] = useState(null);
  const [improved, setImproved] = useState("");

  // TASK 11: AI QUALITY REVIEW

  const [reviewReport, setReviewReport] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  // TASK 12: APPROVAL WORKFLOW

  const [reviewerName, setReviewerName] = useState("");
  const [reviewerComments, setReviewerComments] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("Draft");
  const [approvalHistory, setApprovalHistory] = useState([]);

  // TASK 12: PIPELINE STATUS

  const [pipelineReport, setPipelineReport] = useState(null);
  const [pipelineLoading, setPipelineLoading] = useState(false);

  const charCount = content.length;
  const smsLimitExceeded = channel === "SMS" && charCount > 160;

  const currentStep = STEPS[step];

  // =====================================================
  // SHARED API HELPERS
  // =====================================================

  const post = async (url, payload) => {
    const response = await api.post(url, payload);
    return response.data;
  };

  const run = async (key, callback) => {
    setBusy(key);
    setError("");
    setNotice("");

    try {
      await callback();
    } catch (err) {
      console.error(`${key} operation failed:`, err);
      setError(getErrorMessage(err));
    } finally {
      setBusy("");
    }
  };

  const toggleItem = (items, setter, value, checked) => {
    setter(
      checked
        ? [...items, value]
        : items.filter((item) => item !== value)
    );
  };

  const copyContent = async (text) => {
    if (!text) {
      setError("There is no content to copy.");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setError("");
      setNotice("Copied to clipboard.");
    } catch {
      setError("Copy failed. Please select and copy the text manually.");
    }
  };

  // =====================================================
  // TASK 7: GENERATE CAMPAIGN CONTENT
  // =====================================================

  const generateContent = () =>
    run("generate", async () => {
      if (!topic.trim()) {
        throw new Error("Please enter a campaign topic.");
      }

      if (!audience.trim()) {
        throw new Error("Please enter an audience description.");
      }

      const wordLimit =
        channel === "Email"
          ? 250
          : length === "SMS short"
            ? 30
            : length === "Medium"
              ? 100
              : 250;

      const data = await post("/api/ai/generate", {
        campaign_type: campaignType,
        topic: topic.trim(),
        audience: audience.trim(),
        language: "English",
        content_type: channel,
        tone,
        word_limit: wordLimit,
        key_points: keyPoints.trim(),
      });

      const raw = getMessage(data);

      if (!raw) {
        throw new Error("The backend returned no generated content.");
      }

      const generated =
        channel === "Email" ? formatEmailContent(raw) : raw;

      setContent(generated);
      setReviewReport(null);
      setApprovalStatus("Draft");

      setHistory((previous) => [
        {
          id: Date.now(),
          topic,
          channel,
          text: generated,
          time: new Date().toLocaleString(),
        },
        ...previous,
      ]);

      setNotice("Campaign content generated successfully.");
    });

  // =====================================================
  // SAVE TEMPLATE AND DRAFT
  // =====================================================

  const saveTemplate = () =>
    run("template", async () => {
      if (!content.trim()) {
        throw new Error("Enter campaign content before saving.");
      }

      const data = await post("/api/templates/", {
        name: topic.trim() || "Campaign template",
        content: content.trim(),
        channel,
        campaign_type: campaignType,
      });

      setNotice(data?.message || "Template saved successfully.");
    });

  const saveDraft = () =>
    run("draft", async () => {
      if (!content.trim()) {
        throw new Error("Enter campaign content before saving.");
      }

      const data = await post("/api/drafts/", {
        title: topic.trim() || "Campaign draft",
        content: content.trim(),
        channel,
        campaign_type: campaignType,
      });

      setNotice(data?.message || "Draft saved successfully.");
    });

  // =====================================================
  // TASK 8: TRANSLATE ALL LANGUAGES
  // =====================================================

  const translateAll = () =>
    run("translate", async () => {
      if (!content.trim()) {
        throw new Error("Generate or enter content before translating.");
      }

      if (languages.length === 0) {
        throw new Error("Select at least one language.");
      }

      const data = await post("/ai/translate/bulk", {
        text: content,
        source_language: "English",
        target_languages: languages,
      });

      const raw =
        data?.translations ??
        data?.results ??
        data?.data?.translations ??
        data;

      const result = {};

      if (Array.isArray(raw)) {
        raw.forEach((item) => {
          const language =
            item.language || item.target_language || item.lang;

          const text =
            item.text ||
            item.translation ||
            item.translated_text ||
            "";

          if (language && text) {
            result[language] = {
              text,
              status: item.status || "Auto-translated",
            };
          }
        });
      } else if (raw && typeof raw === "object") {
        Object.entries(raw).forEach(([language, value]) => {
          const text =
            typeof value === "string"
              ? value
              : value?.text ||
                value?.translation ||
                value?.translated_text ||
                "";

          if (text) {
            result[language] = {
              text,
              status:
                typeof value === "object"
                  ? value.status || "Auto-translated"
                  : "Auto-translated",
            };
          }
        });
      }

      if (Object.keys(result).length === 0) {
        throw new Error(
          "No translations received. Check the translation API response."
        );
      }

      setTranslations((previous) => ({ ...previous, ...result }));
      setActiveLanguage(Object.keys(result)[0]);

      setApprovedTranslations((previous) => {
        const updated = { ...previous };
        Object.keys(result).forEach((language) => {
          delete updated[language];
        });
        return updated;
      });

      setNotice("Translations generated successfully.");
    });

  const translateOne = (language) =>
    run("translate-one", async () => {
      if (!content.trim()) {
        throw new Error("Enter content before translating.");
      }

      const data = await post("/ai/translate", {
        text: content,
        source_language: "English",
        target_language: language,
      });

      const translated = getMessage(data);

      if (!translated) {
        throw new Error("The translation response was empty.");
      }

      setTranslations((previous) => ({
        ...previous,
        [language]: {
          text: translated,
          status: "Auto-translated",
        },
      }));

      setApprovedTranslations((previous) => {
        const updated = { ...previous };
        delete updated[language];
        return updated;
      });

      setNotice(`${language} translation regenerated.`);
    });

  const updateTranslation = (language, text) => {
    setTranslations((previous) => ({
      ...previous,
      [language]: {
        ...previous[language],
        text,
        status: "Edited — review needed",
      },
    }));

    setApprovedTranslations((previous) => {
      const updated = { ...previous };
      delete updated[language];
      return updated;
    });
  };

  const approveTranslation = (language) => {
    const translation = translations[language];

    if (!translation?.text?.trim()) {
      setError("There is no translation to approve.");
      return;
    }

    setApprovedTranslations((previous) => ({
      ...previous,
      [language]: {
        text: translation.text,
        status: "Approved locally",
        approvedAt: new Date().toLocaleString(),
      },
    }));

    setTranslations((previous) => ({
      ...previous,
      [language]: {
        ...previous[language],
        status: "Approved locally",
      },
    }));

    setError("");
    setNotice(
      `${language} marked as approved in this session. This is not backend approval.`
    );
  };

  const removeTranslationApproval = (language) => {
    setApprovedTranslations((previous) => {
      const updated = { ...previous };
      delete updated[language];
      return updated;
    });

    setTranslations((previous) => ({
      ...previous,
      [language]: {
        ...previous[language],
        status: "Review needed",
      },
    }));

    setNotice(`${language} approval removed.`);
  };

  // =====================================================
  // TASK 9: PERSONALIZATION
  // =====================================================

  const generateVariants = () =>
    run("variants", async () => {
      if (!content.trim()) {
        throw new Error("Generate or enter a base message first.");
      }

      if (segments.length === 0) {
        throw new Error("Select at least one audience segment.");
      }

      const data = await post("/api/ai/personalize", {
        base_message: content,
        segments,
        mode: personalizationMode,
        language: recipient.language,
        channel,
      });

      const raw =
        data?.variants ??
        data?.data?.variants ??
        data?.results ??
        data;

      let result = [];

      if (Array.isArray(raw)) {
        result = raw.map((item, index) => ({
          id: item.id ?? `${Date.now()}-${index}`,
          segment:
            item.segment ||
            item.role ||
            segments[index] ||
            `Segment ${index + 1}`,
          text:
            item.text ||
            item.message ||
            item.personalized_message ||
            "",
          language: item.language || recipient.language,
        }));
      } else if (raw && typeof raw === "object") {
        result = Object.entries(raw).map(([segment, value], index) => ({
          id: `${Date.now()}-${index}`,
          segment,
          text:
            typeof value === "string"
              ? value
              : value?.text || value?.message || "",
          language: recipient.language,
        }));
      }

      result = result.filter((item) => item.text);

      if (result.length === 0) {
        throw new Error(
          "No variants returned. Check the personalization API."
        );
      }

      setVariants(result);
      setNotice("Audience-specific variants generated.");
    });

  const fillPlaceholders = (text) =>
    text.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (match, key) =>
      recipient[key] !== undefined ? String(recipient[key]) : match
    );

  const previewRecipient = () =>
    run("preview", async () => {
      const variant =
        variants.find(
          (item) =>
            item.segment.toLowerCase() === recipient.role.toLowerCase()
        ) || variants[0];

      if (!variant) {
        throw new Error("Generate audience variants before previewing.");
      }

      if (personalizationMode === "placeholder") {
        setPreview(fillPlaceholders(variant.text));
        return;
      }

      try {
        const data = await post("/api/ai/personalize/preview", {
          variant_id: variant.id,
          recipient: {
            ...recipient,
            age: recipient.age ? Number(recipient.age) : null,
          },
          channel,
        });

        setPreview(
          getMessage(data) ||
            data?.preview ||
            data?.personalized_message ||
            fillPlaceholders(variant.text)
        );
      } catch (err) {
        console.error("Recipient preview API failed:", err);
        setPreview(fillPlaceholders(variant.text));
        setNotice(
          "Showing a local preview because the preview API was unavailable."
        );
      }
    });

  // =====================================================
  // TASK 10: TONE ANALYSIS
  // =====================================================

  const analyzeTone = () =>
    run("analyze", async () => {
      if (!content.trim()) {
        throw new Error("Enter a message to analyze.");
      }

      const data = await post("/api/ai/analyze-tone", {
        content,
        expected_tone: tone,
      });

      setAnalysis(data?.analysis || data?.data?.analysis || data);

      setImproved(
        data?.improved_content ||
          data?.improved_text ||
          data?.rewritten_text ||
          ""
      );

      setNotice("Tone analysis completed.");
    });

  const improveTone = (targetTone) =>
    run("improve", async () => {
      if (!content.trim()) {
        throw new Error("Enter a message first.");
      }

      const data = await post("/api/ai/improvetone", {
        content,
        target_tone: targetTone,
      });

      const text =
        data?.improved_content ||
        data?.improved_text ||
        data?.rewritten_text ||
        getMessage(data);

      if (!text) {
        throw new Error("No improved message was returned.");
      }

      setImproved(text);
      setNotice("Improved version generated.");
    });

  const applyImproved = () => {
    if (!improved.trim()) return;

    setContent(improved);
    setReviewReport(null);
    setApprovalStatus("Draft");
    setNotice("Improved message applied. Run the quality review again.");
  };

  const suggestions = Array.isArray(
    analysis?.suggestions || analysis?.improvement_suggestions
  )
    ? analysis?.suggestions || analysis?.improvement_suggestions
    : [];

  // =====================================================
  // TASK 11: AI QUALITY REVIEW
  // =====================================================

  const handleReviewContent = async () => {
    if (!content.trim()) {
      setError("Generate or enter content before reviewing.");
      return;
    }

    setReviewLoading(true);
    setError("");
    setNotice("");
    setReviewReport(null);

    try {
      const report = await reviewCampaignContent({
        content: content.trim(),
        channel,
        language: "English",
      });

      setReviewReport(report);
      setApprovalStatus("Pending human review");

      setNotice("AI quality review completed.");
    } catch (err) {
      console.error("AI review failed:", err);
      setError(getErrorMessage(err));
    } finally {
      setReviewLoading(false);
    }
  };

  const applySuggestedFix = (issue) => {
    if (!issue?.text || !issue?.suggestion) {
      setError(
        "This issue has no automatic replacement text. Edit the message manually using the suggestion."
      );
      return;
    }

    setError("");
    setNotice(
      `Suggested fix: ${issue.suggestion}. Review the recommendation and edit the message manually.`
    );

    setStep(0);
  };

  // =====================================================
  // TASK 12: APPROVAL WORKFLOW
  // =====================================================

  const submitForApproval = () => {
    if (!content.trim()) {
      setError("There is no content to submit.");
      return;
    }

    if (!reviewReport) {
      setError("Run AI Quality Review before submitting.");
      return;
    }

    if (reviewReport.approval_blocked) {
      setError(
        "Submission is blocked because critical review issues were detected."
      );
      return;
    }

    setApprovalStatus("Pending human review");

    setApprovalHistory((previous) => [
      {
        action: "Submitted for review",
        reviewer: reviewerName.trim() || "Current user",
        comments: reviewerComments.trim(),
        time: new Date().toLocaleString(),
      },
      ...previous,
    ]);

    setNotice(
      "Submission recorded in this browser session. Connect a backend approval endpoint for official approval."
    );
  };

  const recordLocalDecision = (decision) => {
    if (!reviewReport) {
      setError("Run AI Quality Review before making a decision.");
      return;
    }

    if (reviewReport.approval_blocked) {
      setError(
        "Approval is blocked until critical issues are addressed."
      );
      return;
    }

    if (!reviewerName.trim()) {
      setError("Enter the reviewer name before recording a decision.");
      return;
    }

    if (decision === "Rejected" && !reviewerComments.trim()) {
      setError("Please provide comments explaining the rejection.");
      return;
    }

    const timestamp = new Date().toLocaleString();

    setApprovalStatus(decision);

    setApprovalHistory((previous) => [
      {
        action: decision,
        reviewer: reviewerName.trim(),
        comments: reviewerComments.trim(),
        time: timestamp,
      },
      ...previous,
    ]);

    setNotice(
      `${decision} recorded locally. This is not an official backend approval decision.`
    );
  };

  // =====================================================
  // TASK 12: END-TO-END PIPELINE
  // =====================================================

  const runFullPipeline = async () => {
    setError("");
    setNotice("");

    if (!content.trim()) {
      setError("Generate or enter content before running the pipeline.");
      return;
    }

    setPipelineReport(null);
    setPipelineLoading(true);

    try {
      /*
       * This request uses the pipeline route added to api.js.
       * The exact request schema must match your backend implementation.
       * If the backend expects different fields, adjust this payload.
       */
      const response = await api.post(
        `/campaigns/8/content/pipeline`,
        {
          content: content.trim(),
          topic,
          campaign_type: campaignType,
          audience,
          channel,
          tone,
          languages,
          segments,
        }
      );

      setPipelineReport(response.data);
      setNotice("Pipeline request completed.");
    } catch (err) {
      console.error("Pipeline request failed:", err);
      setError(
        `${getErrorMessage(err)} If the pipeline endpoint is not implemented or expects a different payload, verify it in FastAPI Swagger.`
      );
    } finally {
      setPipelineLoading(false);
    }
  };

  // =====================================================
  // SUMMARY HELPERS
  // =====================================================

  const reviewScore = reviewReport?.overall_score;
  const issueCounts = reviewReport?.severity_counts || {};

  const translationCount = Object.keys(translations).length;
  const approvedTranslationCount = Object.keys(approvedTranslations).length;

  const currentStepDescription = [
    "Create campaign content with AI.",
    "Translate your message into Indian languages.",
    "Generate audience-specific message variants.",
    "Analyze and improve the message tone.",
    "Check content quality and potential compliance risks.",
    "Review the content decision and comments.",
    "View the workflow summary and pipeline status.",
  ][step];

  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="ccf-page">
      <header className="ccf-header">
        <div>
          <div className="ccf-eyebrow">
            AI PUBLIC AWARENESS PLATFORM
          </div>

          <h1>Campaign Content Studio</h1>

          <p>
            Generate, translate, personalize, optimize, review, and
            prepare campaign content through one guided workflow.
          </p>
        </div>

        <span className="ccf-workspace-badge">● AI WORKSPACE</span>
      </header>

      {/* WORKFLOW STEPPER */}

      <nav className="ccf-stepper" aria-label="Campaign workflow">
        <div className="ccf-progress">
          <span
            style={{
              width: `${((step + 1) / STEPS.length) * 100}%`,
            }}
          />
        </div>

        {STEPS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`ccf-step ${
              step === index ? "active" : ""
            } ${step > index ? "done" : ""}`}
            onClick={() => {
              setError("");
              setNotice("");
              setStep(index);
            }}
          >
            <span className="ccf-step-number">
              {step > index ? "✓" : item.id}
            </span>

            <span className="ccf-step-text">
              <b>{item.title}</b>
              <small>Task {item.id}</small>
            </span>
          </button>
        ))}
      </nav>

      {/* NOTIFICATIONS */}

      {(error || notice) && (
        <div
          className={`ccf-alert ${error ? "error" : "success"}`}
          role={error ? "alert" : "status"}
        >
          <span>{error || notice}</span>

          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => {
              setError("");
              setNotice("");
            }}
          >
            ×
          </button>
        </div>
      )}

      <section className="ccf-panel">
        <div className="ccf-panel-head">
          <div>
            <span className="ccf-kicker">
              TASK {currentStep.id} OF 13
            </span>

            <h2>{currentStep.title}</h2>
            <p>{currentStepDescription}</p>
          </div>

          <span className="ccf-step-pill">
            STEP {step + 1} / {STEPS.length}
          </span>
        </div>

        {/* =================================================
            STEP 1: CONTENT STUDIO
        ================================================= */}

        {step === 0 && (
          <div className="ccf-body">
            <div className="ccf-form-grid">
              <label>
                Campaign type
                <select
                  value={campaignType}
                  onChange={(e) => setCampaignType(e.target.value)}
                >
                  {CAMPAIGN_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>

              <label>
                Topic
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter campaign topic"
                />
              </label>

              <label>
                Audience description
                <input
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="Describe your target audience"
                />
              </label>

              <label>
                Tone
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                >
                  {TONES.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>

              <label>
                Message length
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                >
                  <option>SMS short</option>
                  <option>Medium</option>
                  <option>Email long</option>
                </select>
              </label>

              <label>
                Communication channel
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                >
                  <option>SMS</option>
                  <option>WhatsApp</option>
                  <option>Email</option>
                  <option>Notification</option>
                  <option>Social Media</option>
                </select>
              </label>

              <label className="ccf-full">
                Key points
                <textarea
                  rows="3"
                  value={keyPoints}
                  onChange={(e) => setKeyPoints(e.target.value)}
                  placeholder="Date, venue, action, contact..."
                />
              </label>
            </div>

            <div className="ccf-actions">
              <span className="ccf-muted">
                Generate a message and edit it before use.
              </span>

              <button
                type="button"
                className="ccf-btn primary"
                disabled={!!busy}
                onClick={generateContent}
              >
                {busy === "generate"
                  ? "Generating..."
                  : "✦ Generate with AI"}
              </button>
            </div>

            <div className="ccf-card">
              <div className="ccf-editor-head">
                <div>
                  <h3>
                    {channel === "Email" ? "Email editor" : "Message editor"}
                  </h3>
                  <p>Edit the generated campaign content below.</p>
                </div>

                <b className={smsLimitExceeded ? "ccf-over" : "ccf-counter"}>
                  {charCount} characters
                  {channel === "SMS" ? " / 160" : ""}
                </b>
              </div>

              <textarea
                className="ccf-large-editor"
                rows={channel === "Email" ? 12 : 7}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setReviewReport(null);
                  setApprovalStatus("Draft");
                }}
                placeholder="Your generated campaign message appears here."
                style={{
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.7,
                  minHeight: channel === "Email" ? "280px" : undefined,
                }}
              />

              {channel === "SMS" && (
                <p className={`ccf-hint ${smsLimitExceeded ? "ccf-over" : ""}`}>
                  {smsLimitExceeded
                    ? "This message exceeds 160 characters."
                    : "SMS guideline: keep the message within 160 characters."}
                </p>
              )}

              <div className="ccf-actions ccf-actions-wrap">
                <button
                  type="button"
                  className="ccf-btn secondary"
                  onClick={generateContent}
                  disabled={!!busy}
                >
                  Regenerate
                </button>

                <button
                  type="button"
                  className="ccf-btn secondary"
                  onClick={() => copyContent(content)}
                  disabled={!content}
                >
                  Copy
                </button>

                <button
                  type="button"
                  className="ccf-btn secondary"
                  onClick={saveDraft}
                  disabled={!content.trim() || !!busy}
                >
                  {busy === "draft" ? "Saving..." : "Save as draft"}
                </button>

                <button
                  type="button"
                  className="ccf-btn secondary"
                  onClick={saveTemplate}
                  disabled={!content.trim() || !!busy}
                >
                  {busy === "template" ? "Saving..." : "Save as template"}
                </button>
              </div>
            </div>

            <div className="ccf-card">
              <div className="ccf-section-head">
                <h3>Generation history</h3>
                <span>{history.length} items</span>
              </div>

              {history.length ? (
                history.slice(0, 5).map((item) => (
                  <button
                    type="button"
                    className="ccf-history-row"
                    key={item.id}
                    onClick={() => {
                      setContent(item.text);
                      setTopic(item.topic);
                      setChannel(item.channel);
                      setReviewReport(null);
                      setApprovalStatus("Draft");
                    }}
                  >
                    <span>
                      <b>{item.topic}</b>
                      <small>{item.time} · {item.channel}</small>
                    </span>
                    <span>Load ↗</span>
                  </button>
                ))
              ) : (
                <p className="ccf-muted">
                  Your generated messages will appear here.
                </p>
              )}
            </div>
          </div>
        )}

        {/* =================================================
            STEP 2: TRANSLATION
        ================================================= */}

        {step === 1 && (
          <div className="ccf-body">
            <div className="ccf-callout">
              <span className="ccf-callout-icon">文</span>
              <div>
                <b>Multilingual campaign translation</b>
                <small>
                  Select multiple languages and translate your English message.
                </small>
              </div>
            </div>

            <div className="ccf-language-grid">
              {LANGUAGES.map((language) => (
                <label
                  key={language}
                  className={`ccf-language ${
                    languages.includes(language) ? "selected" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={languages.includes(language)}
                    onChange={(e) =>
                      toggleItem(
                        languages,
                        setLanguages,
                        language,
                        e.target.checked
                      )
                    }
                  />

                  <span className="ccf-checkbox">
                    {languages.includes(language) ? "✓" : ""}
                  </span>

                  {language}
                </label>
              ))}
            </div>

            <div className="ccf-actions">
              <span className="ccf-muted">
                {languages.length} languages selected
              </span>

              <button
                type="button"
                className="ccf-btn primary"
                onClick={translateAll}
                disabled={!!busy || !content.trim()}
              >
                {busy === "translate" ? "Translating..." : "🌐 Translate all"}
              </button>
            </div>

            <div className="ccf-translation-grid">
              <article className="ccf-card">
                <span className="ccf-kicker">SOURCE · ENGLISH</span>
                <h3>Original message</h3>
                <p className="ccf-source-text" style={{ whiteSpace: "pre-wrap" }}>
                  {content || "Complete Step 1 first."}
                </p>
              </article>

              <article className="ccf-card">
                <div className="ccf-tabs">
                  {Object.keys(translations).map((language) => (
                    <button
                      type="button"
                      key={language}
                      className={activeLanguage === language ? "active" : ""}
                      onClick={() => setActiveLanguage(language)}
                    >
                      {language}
                    </button>
                  ))}
                </div>

                {translations[activeLanguage] ? (
                  <>
                    <div className="ccf-editor-head">
                      <h3>{activeLanguage}</h3>
                      <span className="ccf-status">
                        {translations[activeLanguage].status}
                      </span>
                    </div>

                    <textarea
                      rows="7"
                      value={translations[activeLanguage].text}
                      onChange={(e) =>
                        updateTranslation(activeLanguage, e.target.value)
                      }
                    />

                    <div className="ccf-actions ccf-actions-wrap">
                      <button
                        type="button"
                        className="ccf-btn secondary"
                        onClick={() => translateOne(activeLanguage)}
                        disabled={!!busy}
                      >
                        Re-translate
                      </button>

                      <button
                        type="button"
                        className="ccf-btn primary"
                        onClick={() => approveTranslation(activeLanguage)}
                        disabled={!!busy}
                      >
                        ✓ Mark approved locally
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="ccf-empty">
                    <span>文</span>
                    <b>No translations yet</b>
                    <p>Select languages and click Translate all.</p>
                  </div>
                )}
              </article>
            </div>

            <div className="ccf-card">
              <div className="ccf-section-head">
                <h3>Approved translations</h3>
                <span>{approvedTranslationCount} approved</span>
              </div>

              {approvedTranslationCount ? (
                Object.entries(approvedTranslations).map(([language, item]) => (
                  <article className="ccf-card" key={language}>
                    <h4>{language} · {item.status}</h4>
                    <p style={{ whiteSpace: "pre-wrap" }}>{item.text}</p>
                    <small>{item.approvedAt}</small>

                    <div className="ccf-actions">
                      <button
                        type="button"
                        className="ccf-btn secondary"
                        onClick={() => copyContent(item.text)}
                      >
                        Copy
                      </button>

                      <button
                        type="button"
                        className="ccf-btn secondary"
                        onClick={() => removeTranslationApproval(language)}
                      >
                        Remove approval
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="ccf-muted">
                  No translations have been marked approved in this session.
                  These marks are local and are not saved as official backend approvals.
                </p>
              )}
            </div>
          </div>
        )}

        {/* =================================================
            STEP 3: PERSONALIZATION
        ================================================= */}

        {step === 2 && (
          <div className="ccf-body">
            <div className="ccf-callout">
              <span className="ccf-callout-icon">✨</span>
              <div>
                <b>Audience-specific personalization</b>
                <small>
                  Create tailored messages for different audience segments.
                </small>
              </div>
            </div>

            <div className="ccf-card">
              <h3>Base campaign message</h3>
              <p className="ccf-muted">
                You can use placeholders such as {"{name}"} and {"{city}"}.
              </p>

              <textarea
                rows="5"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />

              <div className="ccf-form-grid">
                <label>
                  Personalization mode
                  <select
                    value={personalizationMode}
                    onChange={(e) => setPersonalizationMode(e.target.value)}
                  >
                    <option value="ai">AI segment rewriting</option>
                    <option value="placeholder">Placeholder filling</option>
                  </select>
                </label>

                <label>
                  Communication channel
                  <select value={channel} onChange={(e) => setChannel(e.target.value)}>
                    <option>SMS</option>
                    <option>WhatsApp</option>
                    <option>Email</option>
                    <option>Notification</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="ccf-card">
              <div className="ccf-section-head">
                <h3>Select audience segments</h3>
                <span>{segments.length} selected</span>
              </div>

              <div className="ccf-segment-grid">
                {SEGMENTS.map((segment, index) => (
                  <label
                    key={segment}
                    className={`ccf-segment ${
                      segments.includes(segment) ? "selected" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={segments.includes(segment)}
                      onChange={(e) =>
                        toggleItem(
                          segments,
                          setSegments,
                          segment,
                          e.target.checked
                        )
                      }
                    />

                    <span className="ccf-segment-emoji">
                      {["👨‍👩‍👧", "👩‍🏫", "🎓", "👥", "👴"][index]}
                    </span>

                    <b>{segment}</b>
                    <small>Create a relevant message for this audience.</small>
                  </label>
                ))}
              </div>

              <button
                type="button"
                className="ccf-btn primary"
                onClick={generateVariants}
                disabled={!!busy}
              >
                {busy === "variants" ? "Generating..." : "✦ Generate variants"}
              </button>
            </div>

            <div className="ccf-card">
              <div className="ccf-section-head">
                <h3>Generated variants</h3>
                <span>{variants.length} variants</span>
              </div>

              {variants.length ? (
                <div className="ccf-variant-grid">
                  {variants.map((variant) => (
                    <article className="ccf-card" key={variant.id}>
                      <h3>{variant.segment}</h3>
                      <small>{variant.language}</small>

                      <textarea
                        rows="5"
                        value={variant.text}
                        onChange={(e) =>
                          setVariants((previous) =>
                            previous.map((item) =>
                              item.id === variant.id
                                ? { ...item, text: e.target.value }
                                : item
                            )
                          )
                        }
                      />

                      <div className="ccf-actions">
                        <button
                          type="button"
                          className="ccf-btn secondary"
                          onClick={() =>
                            setVariants((previous) =>
                              previous.map((item) =>
                                item.id === variant.id
                                  ? { ...item, text: fillPlaceholders(item.text) }
                                  : item
                              )
                            )
                          }
                        >
                          Fill placeholders
                        </button>

                        <button
                          type="button"
                          className="ccf-btn secondary"
                          onClick={() => copyContent(variant.text)}
                        >
                          Copy
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="ccf-muted">
                  Generate variants to display audience-specific messages here.
                </p>
              )}
            </div>

            <div className="ccf-card">
              <h3>Recipient preview</h3>

              <div className="ccf-form-grid">
                <label>
                  Audience segment
                  <select
                    value={recipient.role}
                    onChange={(e) =>
                      setRecipient((previous) => ({
                        ...previous,
                        role: e.target.value,
                      }))
                    }
                  >
                    {SEGMENTS.map((segment) => (
                      <option key={segment}>{segment}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Recipient name
                  <input
                    value={recipient.name}
                    onChange={(e) =>
                      setRecipient((previous) => ({
                        ...previous,
                        name: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Age
                  <input
                    type="number"
                    value={recipient.age}
                    onChange={(e) =>
                      setRecipient((previous) => ({
                        ...previous,
                        age: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Occupation
                  <input
                    value={recipient.occupation}
                    onChange={(e) =>
                      setRecipient((previous) => ({
                        ...previous,
                        occupation: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  City
                  <input
                    value={recipient.city}
                    onChange={(e) =>
                      setRecipient((previous) => ({
                        ...previous,
                        city: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Recipient language
                  <select
                    value={recipient.language}
                    onChange={(e) =>
                      setRecipient((previous) => ({
                        ...previous,
                        language: e.target.value,
                      }))
                    }
                  >
                    {["English", ...LANGUAGES].map((language) => (
                      <option key={language}>{language}</option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                type="button"
                className="ccf-btn primary"
                onClick={previewRecipient}
                disabled={!!busy || variants.length === 0}
              >
                {busy === "preview" ? "Preparing..." : "👁 Preview message"}
              </button>

              {preview && (
                <div className="ccf-preview">
                  <span className="ccf-kicker">RECIPIENT PREVIEW</span>
                  <p style={{ whiteSpace: "pre-wrap" }}>{preview}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================
            STEP 4: TONE OPTIMIZATION
        ================================================= */}

        {step === 3 && (
          <div className="ccf-body">
            <div className="ccf-callout">
              <span className="ccf-callout-icon">◈</span>
              <div>
                <b>Tone and sentiment analysis</b>
                <small>
                  Analyze your campaign and compare it with an improved version.
                </small>
              </div>
            </div>

            <div className="ccf-tone-grid">
              <div>
                <label className="ccf-block-label">
                  Message to analyze
                  <textarea
                    className="ccf-large-editor"
                    rows="8"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </label>

                <button
                  type="button"
                  className="ccf-btn primary ccf-wide"
                  onClick={analyzeTone}
                  disabled={!!busy}
                >
                  {busy === "analyze" ? "Analyzing..." : "Analyze tone"}
                </button>

                <div className="ccf-quick-tones">
                  <h3>Quick tone actions</h3>
                  <div className="ccf-quick-grid">
                    {[
                      ["Make it more formal", "Formal"],
                      ["Make it friendlier", "Friendly"],
                      ["Make it shorter", "Shorter"],
                      ["Make it more urgent", "Urgent"],
                    ].map(([label, target]) => (
                      <button
                        type="button"
                        className="ccf-btn secondary"
                        key={target}
                        onClick={() => improveTone(target)}
                        disabled={!!busy}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="ccf-card">
                <div className="ccf-section-head">
                  <h3>Content quality</h3>
                  <span>{analysis ? "Analysis ready" : "Awaiting analysis"}</span>
                </div>

                {analysis ? (
                  <>
                    <div className="ccf-metrics">
                      <div>
                        <small>Detected tone</small>
                        <b>
                          {analysis.detected_tone || analysis.tone || "Neutral"}
                        </b>
                      </div>

                      <div>
                        <small>Sentiment score</small>
                        <b>
                          {analysis.sentiment_score ?? analysis.sentiment ?? "—"}
                        </b>
                      </div>

                      <div>
                        <small>Readability</small>
                        <b>
                          {analysis.readability_score ??
                            analysis.readability_level ??
                            "—"}
                        </b>
                      </div>

                      <div>
                        <small>Clarity score</small>
                        <b>{analysis.clarity_score ?? "—"}/100</b>
                      </div>
                    </div>

                    <h3>Improvement suggestions</h3>

                    {suggestions.length ? (
                      suggestions.map((suggestion, index) => (
                        <div className="ccf-suggestion" key={index}>
                          <span>✦</span>
                          <p>
                            {typeof suggestion === "string"
                              ? suggestion
                              : suggestion.text ||
                                suggestion.message ||
                                suggestion.suggestion}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="ccf-muted">
                        No suggestions returned by the API.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="ccf-empty">
                    <span>◈</span>
                    <b>Run tone analysis</b>
                    <p>Your scores and suggestions will appear here.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="ccf-card">
              <div className="ccf-section-head">
                <h3>Before vs. after</h3>

                <button
                  type="button"
                  className="ccf-btn secondary"
                  onClick={() => improveTone(tone)}
                  disabled={!!busy || !content.trim()}
                >
                  Generate improved version
                </button>
              </div>

              <div className="ccf-compare-grid">
                <div>
                  <span className="ccf-kicker">BEFORE · ORIGINAL</span>
                  <p style={{ whiteSpace: "pre-wrap" }}>
                    {content || "Original message appears here."}
                  </p>
                </div>

                <div>
                  <span className="ccf-kicker">AFTER · IMPROVED</span>
                  <textarea
                    rows="6"
                    value={improved}
                    onChange={(e) => setImproved(e.target.value)}
                  />

                  <button
                    type="button"
                    className="ccf-btn primary ccf-wide"
                    onClick={applyImproved}
                    disabled={!improved.trim()}
                  >
                    Use improved version
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================
            STEP 5: AI QUALITY REVIEW
        ================================================= */}

        {step === 4 && (
          <div className="ccf-body">
            <div className="ccf-callout">
              <span className="ccf-callout-icon">🛡️</span>
              <div>
                <b>AI quality and compliance review</b>
                <small>
                  Detect potential content risks before sending your campaign
                  for human approval.
                </small>
              </div>
            </div>

            <div className="ccf-card">
              <div className="ccf-section-head">
                <h3>Content to review</h3>
                <span>{content.length} characters</span>
              </div>

              <textarea
                className="ccf-large-editor"
                rows="8"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setReviewReport(null);
                  setApprovalStatus("Draft");
                }}
                placeholder="Generate or enter campaign content..."
              />

              <div className="ccf-actions ccf-actions-wrap">
                <button
                  type="button"
                  className="ccf-btn primary"
                  onClick={handleReviewContent}
                  disabled={reviewLoading || !content.trim()}
                >
                  {reviewLoading ? "Reviewing..." : "🛡️ Run AI Review"}
                </button>

                <button
                  type="button"
                  className="ccf-btn secondary"
                  onClick={() => setStep(0)}
                >
                  Edit campaign content
                </button>
              </div>
            </div>

            {reviewReport && (
              <>
                <div className="ccf-card">
                  <div className="ccf-section-head">
                    <div>
                      <span className="ccf-kicker">REVIEW REPORT</span>
                      <h3>Quality score</h3>
                    </div>

                    <span className="ccf-status">
                      {reviewReport.status}
                    </span>
                  </div>

                  <div className="ccf-metrics">
                    <div>
                      <small>Overall score</small>
                      <b>{reviewReport.overall_score ?? 0}/100</b>
                    </div>

                    <div>
                      <small>Total issues</small>
                      <b>{reviewReport.total_issues ?? 0}</b>
                    </div>

                    <div>
                      <small>Errors</small>
                      <b>{issueCounts.error ?? 0}</b>
                    </div>

                    <div>
                      <small>Warnings</small>
                      <b>{issueCounts.warning ?? 0}</b>
                    </div>

                    <div>
                      <small>Information</small>
                      <b>{issueCounts.info ?? 0}</b>
                    </div>

                    <div>
                      <small>Critical issues</small>
                      <b>{reviewReport.critical_issue_count ?? 0}</b>
                    </div>
                  </div>

                  <div
                    className={`ccf-alert ${
                      reviewReport.approval_blocked ? "error" : "success"
                    }`}
                  >
                    {reviewReport.approval_blocked
                      ? "Approval is blocked because critical issues were detected."
                      : "No critical issues detected. Content can proceed to human review."}
                  </div>

                  <p className="ccf-muted">
                    Review method: {reviewReport.review_method || "Backend review"}
                  </p>

                  {reviewReport.reviewed_at && (
                    <p className="ccf-muted">
                      Reviewed at:{" "}
                      {new Date(reviewReport.reviewed_at).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="ccf-card">
                  <h3>Detected issues</h3>

                  {reviewReport.issues?.length ? (
                    reviewReport.issues.map((issue, index) => (
                      <article
                        key={`${issue.category}-${index}`}
                        className={`ccf-card review-issue ${issue.severity}`}
                      >
                        <div className="ccf-section-head">
                          <b>
                            {issue.severity?.toUpperCase()} · {issue.category}
                          </b>
                        </div>

                        <p>{issue.message}</p>

                        {issue.text && (
                          <p>
                            <strong>Flagged text:</strong> {issue.text}
                          </p>
                        )}

                        <p>
                          <strong>Suggested fix:</strong> {issue.suggestion}
                        </p>

                        <button
                          type="button"
                          className="ccf-btn secondary"
                          onClick={() => applySuggestedFix(issue)}
                        >
                          Review suggestion in editor
                        </button>
                      </article>
                    ))
                  ) : (
                    <div className="ccf-empty">
                      <span>✓</span>
                      <b>No issues detected</b>
                      <p>
                        The current rule-based checks did not detect any issues.
                        This does not guarantee factual accuracy.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* =================================================
            STEP 6: APPROVAL WORKFLOW
        ================================================= */}

        {step === 5 && (
          <div className="ccf-body">
            <div className="ccf-callout">
              <span className="ccf-callout-icon">✓</span>
              <div>
                <b>Manager approval workflow</b>
                <small>
                  Review the quality report, record comments, and track the
                  decision made during this browser session.
                </small>
              </div>
            </div>

            <div className="ccf-card">
              <div className="ccf-section-head">
                <h3>Approval readiness</h3>
                <span className="ccf-status">{approvalStatus}</span>
              </div>

              {!reviewReport ? (
                <div className="ccf-empty">
                  <span>🛡️</span>
                  <b>Quality review required</b>
                  <p>
                    Run AI Quality Review before submitting the content.
                  </p>

                  <button
                    type="button"
                    className="ccf-btn primary"
                    onClick={() => setStep(4)}
                  >
                    Go to quality review
                  </button>
                </div>
              ) : (
                <>
                  <div className="ccf-metrics">
                    <div>
                      <small>Quality score</small>
                      <b>{reviewReport.overall_score}/100</b>
                    </div>

                    <div>
                      <small>Review result</small>
                      <b>{reviewReport.status}</b>
                    </div>

                    <div>
                      <small>Critical issues</small>
                      <b>{reviewReport.critical_issue_count ?? 0}</b>
                    </div>
                  </div>

                  {reviewReport.approval_blocked && (
                    <div className="ccf-alert error">
                      Approval is blocked. Resolve critical issues and run
                      the review again.
                    </div>
                  )}

                  <div className="ccf-form-grid">
                    <label>
                      Reviewer name
                      <input
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        placeholder="Enter reviewer name"
                      />
                    </label>

                    <label className="ccf-full">
                      Reviewer comments
                      <textarea
                        rows="4"
                        value={reviewerComments}
                        onChange={(e) => setReviewerComments(e.target.value)}
                        placeholder="Add feedback, corrections, or rejection reason..."
                      />
                    </label>
                  </div>

                  <div className="ccf-actions ccf-actions-wrap">
                    <button
                      type="button"
                      className="ccf-btn secondary"
                      onClick={submitForApproval}
                      disabled={
                        !!busy ||
                        !!reviewReport.approval_blocked ||
                        approvalStatus === "Approved"
                      }
                    >
                      Submit for review
                    </button>

                    <button
                      type="button"
                      className="ccf-btn primary"
                      onClick={() => recordLocalDecision("Approved")}
                      disabled={
                        !!busy ||
                        !!reviewReport.approval_blocked ||
                        approvalStatus === "Approved"
                      }
                    >
                      ✓ Record approval
                    </button>

                    <button
                      type="button"
                      className="ccf-btn secondary"
                      onClick={() => recordLocalDecision("Rejected")}
                      disabled={
                        !!busy ||
                        !reviewReport ||
                        !!reviewReport.approval_blocked
                      }
                    >
                      Reject with comments
                    </button>
                  </div>

                  <p className="ccf-hint">
                    Important: approval decisions on this screen are stored
                    only in React state. They are not persisted to your backend
                    or an audit log. Connect a real approval endpoint before
                    treating a decision as official.
                  </p>
                </>
              )}
            </div>

            <div className="ccf-card">
              <div className="ccf-section-head">
                <h3>Approval history</h3>
                <span>{approvalHistory.length} events</span>
              </div>

              {approvalHistory.length ? (
                approvalHistory.map((item, index) => (
                  <article className="ccf-card" key={`${item.time}-${index}`}>
                    <div className="ccf-section-head">
                      <b>{item.action}</b>
                      <small>{item.time}</small>
                    </div>

                    <p>
                      <strong>Reviewer:</strong> {item.reviewer}
                    </p>

                    <p>
                      <strong>Comments:</strong> {item.comments || "No comments"}
                    </p>
                  </article>
                ))
              ) : (
                <div className="ccf-empty">
                  <span>📋</span>
                  <b>No approval events yet</b>
                  <p>Recorded decisions will appear here during this session.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================
            STEP 7: CONTENT SUMMARY
        ================================================= */}

        {step === 6 && (
          <div className="ccf-body">
            <div className="ccf-callout">
              <span className="ccf-callout-icon">📊</span>
              <div>
                <b>Campaign content summary</b>
                <small>
                  Review the content, languages, variants, quality report,
                  approval status, and pipeline response.
                </small>
              </div>
            </div>

            <div className="ccf-metrics">
              <div className="ccf-card">
                <small>Campaign type</small>
                <h3>{campaignType}</h3>
              </div>

              <div className="ccf-card">
                <small>Channel</small>
                <h3>{channel}</h3>
              </div>

              <div className="ccf-card">
                <small>Characters</small>
                <h3>{content.length}</h3>
              </div>

              <div className="ccf-card">
                <small>Quality score</small>
                <h3>
                  {reviewScore != null ? `${reviewScore}/100` : "Not reviewed"}
                </h3>
              </div>

              <div className="ccf-card">
                <small>Translations</small>
                <h3>{translationCount}</h3>
              </div>

              <div className="ccf-card">
                <small>Personalized variants</small>
                <h3>{variants.length}</h3>
              </div>

              <div className="ccf-card">
                <small>Approved translations</small>
                <h3>{approvedTranslationCount}</h3>
              </div>

              <div className="ccf-card">
                <small>Approval status</small>
                <h3>{approvalStatus}</h3>
              </div>
            </div>

            <div className="ccf-card">
              <div className="ccf-section-head">
                <h3>Campaign details</h3>
                <button
                  type="button"
                  className="ccf-btn secondary"
                  onClick={() => setStep(0)}
                >
                  Edit content
                </button>
              </div>

              <p>
                <strong>Topic:</strong> {topic || "Not specified"}
              </p>

              <p>
                <strong>Audience:</strong> {audience || "Not specified"}
              </p>

              <p>
                <strong>Tone:</strong> {tone}
              </p>

              <p>
                <strong>Channel:</strong> {channel}
              </p>

              <h3>Final campaign content</h3>

              <div className="ccf-preview">
                <p style={{ whiteSpace: "pre-wrap" }}>
                  {content || "No campaign content created yet."}
                </p>
              </div>

              <button
                type="button"
                className="ccf-btn secondary"
                onClick={() => copyContent(content)}
                disabled={!content}
              >
                Copy final content
              </button>
            </div>

            <div className="ccf-card">
              <h3>Translations and audience variants</h3>

              <h4>Translations</h4>

              {Object.entries(translations).length ? (
                Object.entries(translations).map(([language, item]) => (
                  <article className="ccf-card" key={language}>
                    <div className="ccf-section-head">
                      <b>{language}</b>
                      <span>{item.status}</span>
                    </div>
                    <p style={{ whiteSpace: "pre-wrap" }}>{item.text}</p>
                  </article>
                ))
              ) : (
                <p className="ccf-muted">No translations created.</p>
              )}

              <h4>Audience variants</h4>

              {variants.length ? (
                variants.map((variant) => (
                  <article className="ccf-card" key={variant.id}>
                    <b>{variant.segment}</b>
                    <p style={{ whiteSpace: "pre-wrap" }}>{variant.text}</p>
                  </article>
                ))
              ) : (
                <p className="ccf-muted">No personalized variants created.</p>
              )}
            </div>

            <div className="ccf-card">
              <h3>Quality review summary</h3>

              {reviewReport ? (
                <>
                  <p>
                    <strong>Score:</strong> {reviewReport.overall_score}/100
                  </p>

                  <p>
                    <strong>Result:</strong> {reviewReport.status}
                  </p>

                  <p>
                    <strong>Errors:</strong> {issueCounts.error ?? 0}
                  </p>

                  <p>
                    <strong>Warnings:</strong> {issueCounts.warning ?? 0}
                  </p>

                  <p>
                    <strong>Information:</strong> {issueCounts.info ?? 0}
                  </p>

                  <p>
                    <strong>Approval blocked:</strong>{" "}
                    {reviewReport.approval_blocked ? "Yes" : "No"}
                  </p>

                  <button
                    type="button"
                    className="ccf-btn secondary"
                    onClick={() => setStep(4)}
                  >
                    View full review
                  </button>
                </>
              ) : (
                <>
                  <p className="ccf-muted">
                    The campaign has not been reviewed yet.
                  </p>

                  <button
                    type="button"
                    className="ccf-btn primary"
                    onClick={() => setStep(4)}
                  >
                    Run quality review
                  </button>
                </>
              )}
            </div>

            <div className="ccf-card">
              <div className="ccf-section-head">
                <h3>End-to-end pipeline</h3>
                <span>
                  {pipelineReport ? "Response received" : "Not run"}
                </span>
              </div>

              <p className="ccf-muted">
                This action calls the campaign pipeline endpoint. Verify the
                endpoint's request schema in Swagger before using it.
              </p>

              <button
                type="button"
                className="ccf-btn primary"
                onClick={runFullPipeline}
                disabled={pipelineLoading || !content.trim()}
              >
                {pipelineLoading ? "Running pipeline..." : "Run full pipeline"}
              </button>

              {pipelineReport && (
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    marginTop: "16px",
                  }}
                >
                  {JSON.stringify(pipelineReport, null, 2)}
                </pre>
              )}
            </div>

            <div className="ccf-card">
              <h3>Before publishing</h3>

              <p>
                AI-generated content, translations, and review results should
                be checked for factual accuracy by a responsible human reviewer.
              </p>

              <p className="ccf-muted">
                A local approval status is not proof of official approval.
                Backend persistence and audit logging must be implemented for
                production use.
              </p>
            </div>
          </div>
        )}

        {/* WORKFLOW FOOTER */}

        <footer className="ccf-footer">
          <button
            type="button"
            className="ccf-btn secondary"
            disabled={step === 0 || !!busy || reviewLoading || pipelineLoading}
            onClick={() => {
              setError("");
              setNotice("");
              setStep((previous) => previous - 1);
            }}
          >
            ← Previous
          </button>

          <span>
            Step {step + 1} of {STEPS.length}
          </span>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              className="ccf-btn primary"
              disabled={!!busy || reviewLoading || pipelineLoading}
              onClick={() => {
                setError("");
                setNotice("");
                setStep((previous) => previous + 1);
              }}
            >
              Next: {STEPS[step + 1].title} →
            </button>
          ) : (
            <button
              type="button"
              className="ccf-btn primary"
              disabled={!!busy || reviewLoading || pipelineLoading}
              onClick={() => {
                setStep(0);
                setNotice("Returned to the beginning of the workflow.");
              }}
            >
              ↺ Start again
            </button>
          )}
        </footer>
      </section>

      <p className="ccf-disclaimer">
        Review AI-generated and translated public-awareness messages for
        factual accuracy before sending.
      </p>
    </main>
  );
}