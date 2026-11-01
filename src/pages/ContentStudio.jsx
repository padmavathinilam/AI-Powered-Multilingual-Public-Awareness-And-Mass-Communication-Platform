
import React, { useCallback, useEffect, useState } from "react";
import api, {
  analyzeCampaignTone,
  improveCampaignTone,
} from "../services/api";
import TranslationPanel from "../components/TranslationPanel";
import "./ContentStudio.css";

const INITIAL_FORM = {
  topic: "",
  target_audience: "General Public",
  language: "English",
  content_type: "Awareness Message",
  tone: "Informative",
  max_words: 150,
  key_points: "",
  campaign_type: "Public Awareness",
};

const DRAFTS_KEY = "contentStudioDrafts";
const TEMPLATES_KEY = "contentStudioTemplates";

const AVAILABLE_TONES = [
  "Friendly",
  "Formal",
  "Persuasive",
  "Informative",
  "Urgent",
];

function readLocalStorage(key) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function getResponseItems(response) {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.history)) return data.history;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;

  return [];
}

function getGeneratedText(response) {
  const data = response?.data ?? response;

  if (typeof data === "string") return data;

  return (
    data?.content ??
    data?.generated_content ??
    data?.generated_text ??
    data?.message ??
    data?.text ??
    data?.result ??
    ""
  );
}

function getHistoryContent(item) {
  return (
    item?.content ??
    item?.generated_content ??
    item?.generated_text ??
    item?.message ??
    item?.text ??
    ""
  );
}

function getErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || "Invalid request").join(", ");
  }

  return error?.response?.data?.message || fallback;
}

function getWordCount(content) {
  const trimmed = content.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export default function ContentStudio() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [generatedContent, setGeneratedContent] = useState("");

  const [history, setHistory] = useState([]);
  const [drafts, setDrafts] = useState(() =>
    readLocalStorage(DRAFTS_KEY)
  );
  const [templates, setTemplates] = useState(() =>
    readLocalStorage(TEMPLATES_KEY)
  );

  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Task 10: Sentiment-aware tone optimization.
  const [selectedTone, setSelectedTone] = useState("Friendly");
  const [toneAnalysis, setToneAnalysis] = useState(null);
  const [improvedContent, setImprovedContent] = useState("");
  const [toneAnalysisLoading, setToneAnalysisLoading] = useState(false);
  const [toneImprovementLoading, setToneImprovementLoading] = useState(false);
  const [toneError, setToneError] = useState("");
  const [toneSuccess, setToneSuccess] = useState("");

  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true);

    try {
      const response = await api.get("/api/ai/history", {
        params: { limit: 20 },
      });

      setHistory(getResponseItems(response));
    } catch (err) {
      console.error("Unable to load generation history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    } catch (err) {
      console.error("Unable to save drafts:", err);
    }
  }, [drafts]);

  useEffect(() => {
    try {
      localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
    } catch (err) {
      console.error("Unable to save templates:", err);
    }
  }, [templates]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: name === "max_words" ? Number(value) : value,
    }));

    setError("");
    setSuccess("");
  };

  const handleGeneratedContentChange = (value) => {
    setGeneratedContent(value);
    setToneAnalysis(null);
    setImprovedContent("");
    setToneError("");
    setToneSuccess("");
  };

  const handleGenerate = async (event) => {
    event.preventDefault();

    if (!form.topic.trim()) {
      setError("Please enter an awareness topic.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...form,
        topic: form.topic.trim(),
        key_points: form.key_points
          .split("\n")
          .map((point) => point.trim())
          .filter(Boolean),
      };

      const response = await api.post("/api/ai/generate", payload);
      const content = getGeneratedText(response);

      if (!content) {
        setError("No generated content was returned by the server.");
        return;
      }

      setGeneratedContent(content);
      setToneAnalysis(null);
      setImprovedContent("");
      setToneError("");
      setToneSuccess("");
      setSuccess("Content generated successfully.");

      await refreshHistory();
    } catch (err) {
      console.error("Content generation failed:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to generate content. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setError("");
    setSuccess("");
  };

  // Task 10: Analyze tone, sentiment, readability, and clarity.
  const handleAnalyzeTone = async () => {
    if (!generatedContent.trim()) {
      setToneError("Generate or enter content before analyzing its tone.");
      setToneSuccess("");
      return;
    }

    setToneAnalysisLoading(true);
    setToneError("");
    setToneSuccess("");
    setToneAnalysis(null);

    try {
      const result = await analyzeCampaignTone(
        generatedContent.trim(),
        selectedTone
      );

      setToneAnalysis(result);
      setToneSuccess("Tone analysis completed successfully.");
    } catch (err) {
      console.error("Tone analysis failed:", err);

      setToneError(
        getErrorMessage(
          err,
          "Unable to analyze the content. Please try again."
        )
      );
    } finally {
      setToneAnalysisLoading(false);
    }
  };

  // Task 10: Rewrite content using Gemini.
  const handleImproveTone = async () => {
    if (!generatedContent.trim()) {
      setToneError("Generate or enter content before improving its tone.");
      setToneSuccess("");
      return;
    }

    setToneImprovementLoading(true);
    setToneError("");
    setToneSuccess("");
    setImprovedContent("");

    try {
      const result = await improveCampaignTone(
        generatedContent.trim(),
        selectedTone
      );

      if (!result?.improved_content?.trim()) {
        setToneError("The server did not return improved content.");
        return;
      }

      setImprovedContent(result.improved_content);
      setToneSuccess(
        `Content improved in a ${selectedTone.toLowerCase()} tone.`
      );
    } catch (err) {
      console.error("Tone improvement failed:", err);

      setToneError(
        getErrorMessage(
          err,
          "Unable to improve the content. Please try again."
        )
      );
    } finally {
      setToneImprovementLoading(false);
    }
  };

  // Task 10: Apply the improved text to the main editor.
  const handleUseImprovedContent = () => {
    if (!improvedContent.trim()) {
      setToneError("There is no improved content to apply.");
      return;
    }

    setGeneratedContent(improvedContent);
    setImprovedContent("");
    setToneAnalysis(null);
    setToneError("");
    setToneSuccess("Improved content applied to the editor.");
  };

  const handleSelectedToneChange = (tone) => {
    setSelectedTone(tone);
    setToneError("");
    setToneSuccess("");
  };

  const saveDraft = () => {
    if (!generatedContent.trim()) {
      setError("Generate content before saving a draft.");
      return;
    }

    setDrafts((previous) => [
      {
        id: Date.now(),
        title: form.topic.trim() || "Untitled awareness message",
        content: generatedContent,
        form: { ...form },
        savedAt: new Date().toISOString(),
      },
      ...previous,
    ]);

    setError("");
    setSuccess("Draft saved successfully.");
  };

  const loadDraft = (draft) => {
    setGeneratedContent(draft.content || "");

    if (draft.form) {
      setForm({ ...INITIAL_FORM, ...draft.form });
    }

    setToneAnalysis(null);
    setImprovedContent("");
    setToneError("");
    setToneSuccess("");
    setError("");
    setSuccess("Draft loaded successfully.");
  };

  const deleteDraft = (id) => {
    setDrafts((previous) =>
      previous.filter((draft) => draft.id !== id)
    );
  };

  const saveTemplate = () => {
    if (!generatedContent.trim()) {
      setError("Generate content before saving a template.");
      return;
    }

    setTemplates((previous) => [
      {
        id: Date.now(),
        title: form.topic.trim() || "Untitled template",
        content: generatedContent,
        form: { ...form },
        savedAt: new Date().toISOString(),
      },
      ...previous,
    ]);

    setError("");
    setSuccess("Template saved successfully.");
  };

  const loadTemplate = (template) => {
    setGeneratedContent(template.content || "");

    if (template.form) {
      setForm({ ...INITIAL_FORM, ...template.form });
    }

    setToneAnalysis(null);
    setImprovedContent("");
    setToneError("");
    setToneSuccess("");
    setError("");
    setSuccess("Template loaded successfully.");
  };

  const deleteTemplate = (id) => {
    setTemplates((previous) =>
      previous.filter((template) => template.id !== id)
    );
  };

  const restoreHistoryItem = (item) => {
    const content = getHistoryContent(item);

    if (!content) {
      setError("No content was found in this history item.");
      return;
    }

    setGeneratedContent(content);

    setForm((previous) => ({
      ...previous,
      topic: item?.topic ?? previous.topic,
    }));

    setToneAnalysis(null);
    setImprovedContent("");
    setToneError("");
    setToneSuccess("");
    setError("");
    setSuccess("Previous content restored.");
  };

  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent);
      setError("");
      setSuccess("Content copied to clipboard.");
    } catch {
      setError("Unable to copy content to clipboard.");
    }
  };

  return (
    <main className="content-studio">
      {/* PAGE HEADER */}
      <header className="studio-heading">
        <div className="studio-heading-copy">
          <div className="studio-eyebrow">
            AI-POWERED PUBLIC AWARENESS
          </div>

          <h1>Content Studio</h1>

          <p className="studio-subtitle">
            Generate compelling public-awareness messages with AI and
            translate them into Indian languages.
          </p>
        </div>

        <div className="studio-ai-badge">
          <span aria-hidden="true">✦</span>
          Gemini AI
        </div>
      </header>

      <div className="studio-workspace">
        {/* LEFT: AI CONTENT GENERATION */}
        <section className="studio-generation-panel">
          <div className="studio-panel-title">
            <div className="studio-panel-icon" aria-hidden="true">
              ✦
            </div>

            <div className="studio-panel-heading">
              <h2>AI Content Generation</h2>
              <p>Create clear, ready-to-use awareness messages.</p>
            </div>
          </div>

          <div className="studio-card">
            <div className="studio-card-heading">
              <span className="studio-step-number">01</span>
              <h3>Content preferences</h3>
            </div>

            <form onSubmit={handleGenerate}>
              <div className="studio-form-fields">
                <div className="studio-field">
                  <label htmlFor="topic">Awareness topic *</label>
                  <input
                    id="topic"
                    name="topic"
                    value={form.topic}
                    onChange={handleChange}
                    placeholder="e.g. Dengue prevention"
                    required
                  />
                </div>

                <div className="studio-field">
                  <label htmlFor="target_audience">
                    Target audience
                  </label>
                  <select
                    id="target_audience"
                    name="target_audience"
                    value={form.target_audience}
                    onChange={handleChange}
                  >
                    <option>General Public</option>
                    <option>Children</option>
                    <option>Students</option>
                    <option>Women</option>
                    <option>Farmers</option>
                    <option>Senior Citizens</option>
                    <option>Rural Communities</option>
                  </select>
                </div>

                <div className="studio-field">
                  <label htmlFor="language">Content language</label>
                  <select
                    id="language"
                    name="language"
                    value={form.language}
                    onChange={handleChange}
                  >
                    <option>English</option>
                    <option>Telugu</option>
                    <option>Hindi</option>
                    <option>Tamil</option>
                    <option>Kannada</option>
                    <option>Malayalam</option>
                    <option>Marathi</option>
                    <option>Bengali</option>
                    <option>Gujarati</option>
                    <option>Odia</option>
                    <option>Punjabi</option>
                  </select>
                </div>

                <div className="studio-field">
                  <label htmlFor="content_type">Content type</label>
                  <select
                    id="content_type"
                    name="content_type"
                    value={form.content_type}
                    onChange={handleChange}
                  >
                    <option>Awareness Message</option>
                    <option>Social Media Post</option>
                    <option>Public Announcement</option>
                    <option>Campaign Message</option>
                    <option>Educational Article</option>
                    <option>Poster Content</option>
                    <option>Short Speech</option>
                  </select>
                </div>

                <div className="studio-field">
                  <label htmlFor="tone">Tone</label>
                  <select
                    id="tone"
                    name="tone"
                    value={form.tone}
                    onChange={handleChange}
                  >
                    <option>Informative</option>
                    <option>Friendly</option>
                    <option>Professional</option>
                    <option>Persuasive</option>
                    <option>Empathetic</option>
                    <option>Urgent</option>
                  </select>
                </div>

                <div className="studio-field">
                  <label htmlFor="max_words">Maximum words</label>
                  <input
                    id="max_words"
                    name="max_words"
                    type="number"
                    min="30"
                    max="1000"
                    value={form.max_words}
                    onChange={handleChange}
                  />
                </div>

                <div className="studio-field studio-field-full">
                  <label htmlFor="campaign_type">
                    Campaign category
                  </label>
                  <select
                    id="campaign_type"
                    name="campaign_type"
                    value={form.campaign_type}
                    onChange={handleChange}
                  >
                    <option>Public Awareness</option>
                    <option>Health</option>
                    <option>Education</option>
                    <option>Environment</option>
                    <option>Government Schemes</option>
                    <option>Road Safety</option>
                    <option>Women Empowerment</option>
                    <option>Digital Literacy</option>
                  </select>
                </div>

                <div className="studio-field studio-field-full">
                  <label htmlFor="key_points">
                    Key points (one per line)
                  </label>
                  <textarea
                    id="key_points"
                    name="key_points"
                    rows={3}
                    value={form.key_points}
                    onChange={handleChange}
                    placeholder={
                      "Enter important points to include\nExample: Symptoms, prevention, and when to seek medical help"
                    }
                  />
                </div>
              </div>

              {error && (
                <div className="studio-alert studio-alert-error" role="alert">
                  {error}
                </div>
              )}

              {success && (
                <div
                  className="studio-alert studio-alert-success"
                  role="status"
                >
                  {success}
                </div>
              )}

              <div className="studio-form-actions">
                <button
                  type="button"
                  className="studio-button studio-button-secondary"
                  onClick={handleReset}
                  disabled={loading}
                >
                  Reset
                </button>

                <button
                  type="submit"
                  className="studio-button"
                  disabled={loading}
                >
                  {loading ? "Generating..." : "✦ Generate Content"}
                </button>
              </div>
            </form>
          </div>

          {/* GENERATED CONTENT */}
          {generatedContent && (
            <div className="studio-card studio-generated-card">
              <div className="studio-card-heading">
                <span className="studio-step-number">02</span>
                <h3>Generated content</h3>
              </div>

              <textarea
                className="studio-generated-text"
                aria-label="Generated awareness content"
                rows={9}
                value={generatedContent}
                onChange={(event) =>
                  handleGeneratedContentChange(event.target.value)
                }
              />

              <div className="studio-content-meta">
                <span>{getWordCount(generatedContent)} words</span>
                <span>{generatedContent.length} characters</span>
              </div>

              <div className="studio-form-actions">
                <button
                  type="button"
                  className="studio-button studio-button-secondary"
                  onClick={saveDraft}
                >
                  Save Draft
                </button>

                <button
                  type="button"
                  className="studio-button studio-button-secondary"
                  onClick={saveTemplate}
                >
                  Save Template
                </button>

                <button
                  type="button"
                  className="studio-button"
                  onClick={copyContent}
                >
                  Copy Content
                </button>
              </div>
            </div>
          )}

          {/* TASK 10: SENTIMENT-AWARE TONE OPTIMIZATION */}
          <section className="studio-tone-panel">
            <div className="studio-section-heading">
              <div>
                <span className="studio-tone-eyebrow">
                  TASK 10 · AI WRITING ASSISTANT
                </span>
                <h3>Sentiment-Aware Tone Optimization</h3>
                <p>
                  Analyze your message and improve it for your target audience.
                </p>
              </div>
            </div>

            <div className="studio-tone-card">
              <label htmlFor="selectedTone">Choose your target tone</label>

              <select
                id="selectedTone"
                value={selectedTone}
                onChange={(event) =>
                  handleSelectedToneChange(event.target.value)
                }
              >
                {AVAILABLE_TONES.map((tone) => (
                  <option key={tone} value={tone}>
                    {tone}
                  </option>
                ))}
              </select>

              <div className="studio-tone-quick-options">
                {AVAILABLE_TONES.map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    className={`studio-tone-chip ${
                      selectedTone === tone ? "active" : ""
                    }`}
                    onClick={() => handleSelectedToneChange(tone)}
                    aria-pressed={selectedTone === tone}
                  >
                    {tone}
                  </button>
                ))}
              </div>

              <p className="studio-tone-hint">
                Select a tone to analyze your message or rewrite it using Gemini.
              </p>

              {toneError && (
                <div className="studio-alert studio-alert-error" role="alert">
                  {toneError}
                </div>
              )}

              {toneSuccess && (
                <div
                  className="studio-alert studio-alert-success"
                  role="status"
                >
                  {toneSuccess}
                </div>
              )}

              <div className="studio-tone-actions">
                <button
                  type="button"
                  className="studio-button studio-button-secondary"
                  onClick={handleAnalyzeTone}
                  disabled={toneAnalysisLoading || toneImprovementLoading}
                >
                  {toneAnalysisLoading ? "Analyzing..." : "Analyze Tone"}
                </button>

                <button
                  type="button"
                  className="studio-button"
                  onClick={handleImproveTone}
                  disabled={toneAnalysisLoading || toneImprovementLoading}
                >
                  {toneImprovementLoading ? "Improving..." : "✦ Improve Tone"}
                </button>
              </div>
            </div>

            {/* ANALYSIS RESULTS */}
            {toneAnalysis && (
              <div className="studio-tone-results">
                <div className="studio-tone-results-heading">
                  <div>
                    <h4>Content Analysis</h4>
                    <p>
                      Method: {toneAnalysis.analysis_method || "Not specified"}
                    </p>
                  </div>

                  <span
                    className={`studio-tone-match ${
                      toneAnalysis.tone_matches ? "match" : "no-match"
                    }`}
                  >
                    {toneAnalysis.tone_matches
                      ? "Tone matches"
                      : "Tone may need adjustment"}
                  </span>
                </div>

                <div className="studio-tone-metrics">
                  <article className="studio-tone-metric">
                    <span>Detected Tone</span>
                    <strong>
                      {toneAnalysis.detected_tone || "Not available"}
                    </strong>
                    <small>
                      Target: {toneAnalysis.expected_tone || selectedTone}
                    </small>
                  </article>

                  <article className="studio-tone-metric">
                    <span>Sentiment</span>
                    <strong className="studio-tone-capitalize">
                      {toneAnalysis.sentiment || "Not available"}
                    </strong>
                    <small>
                      Score: {toneAnalysis.sentiment_score ?? "N/A"}
                    </small>
                  </article>

                  <article className="studio-tone-metric">
                    <span>Readability</span>
                    <strong>
                      {toneAnalysis.readability_score ?? "N/A"}
                      {toneAnalysis.readability_score != null ? "/100" : ""}
                    </strong>
                    <small>
                      {toneAnalysis.readability_level || "Not available"}
                    </small>
                  </article>

                  <article className="studio-tone-metric">
                    <span>Clarity</span>
                    <strong>
                      {toneAnalysis.clarity_score ?? "N/A"}
                      {toneAnalysis.clarity_score != null ? "/100" : ""}
                    </strong>
                    <small>Message clarity score</small>
                  </article>
                </div>

                <div className="studio-tone-counts">
                  <span>
                    Words: {toneAnalysis.word_count ?? 0}
                  </span>
                  <span>
                    Characters: {toneAnalysis.character_count ?? 0}
                  </span>
                </div>

                {Array.isArray(toneAnalysis.warnings) &&
                  toneAnalysis.warnings.length > 0 && (
                    <div className="studio-tone-feedback warning">
                      <h4>Warnings</h4>
                      <ul>
                        {toneAnalysis.warnings.map((warning, index) => (
                          <li key={`${index}-${warning}`}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {Array.isArray(toneAnalysis.suggestions) &&
                  toneAnalysis.suggestions.length > 0 && (
                    <div className="studio-tone-feedback suggestions">
                      <h4>Suggestions for Improvement</h4>
                      <ul>
                        {toneAnalysis.suggestions.map((suggestion, index) => (
                          <li key={`${index}-${suggestion}`}>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            )}

            {/* IMPROVED CONTENT PREVIEW */}
            {improvedContent && (
              <div className="studio-tone-improved">
                <div className="studio-tone-results-heading">
                  <div>
                    <h4>Improved Content</h4>
                    <p>
                      Review the rewritten message before applying it.
                    </p>
                  </div>
                </div>

                <textarea
                  className="studio-generated-text"
                  aria-label="Improved awareness content"
                  rows={7}
                  value={improvedContent}
                  onChange={(event) =>
                    setImprovedContent(event.target.value)
                  }
                />

                <div className="studio-content-meta">
                  <span>{getWordCount(improvedContent)} words</span>
                  <span>{improvedContent.length} characters</span>
                </div>

                <div className="studio-form-actions">
                  <button
                    type="button"
                    className="studio-button studio-button-secondary"
                    onClick={() => setImprovedContent("")}
                  >
                    Discard
                  </button>

                  <button
                    type="button"
                    className="studio-button"
                    onClick={handleUseImprovedContent}
                  >
                    Use Improved Version
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* GENERATION HISTORY */}
          <section className="studio-history-section">
            <div className="studio-section-heading">
              <div>
                <h3>Generation history</h3>
                <p>Revisit previously generated awareness messages.</p>
              </div>

              <button
                type="button"
                className="studio-button studio-button-secondary"
                onClick={refreshHistory}
                disabled={historyLoading}
              >
                {historyLoading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {history.length === 0 ? (
              <div className="studio-empty-state">
                {historyLoading
                  ? "Loading generation history..."
                  : "Your generated messages will appear here."}
              </div>
            ) : (
              <div className="studio-history-table-wrapper">
                <table className="studio-history-table">
                  <thead>
                    <tr>
                      <th>Topic</th>
                      <th>Content</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {history.map((item, index) => {
                      const content = getHistoryContent(item);

                      return (
                        <tr key={item.id ?? item._id ?? index}>
                          <td>
                            {item.topic || item.title || "Awareness message"}
                          </td>

                          <td>
                            {String(content).slice(0, 100)}
                            {String(content).length > 100 ? "..." : ""}
                          </td>

                          <td>
                            <button
                              type="button"
                              className="studio-button studio-button-secondary"
                              onClick={() => restoreHistoryItem(item)}
                            >
                              Restore
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* SAVED DRAFTS */}
          <section className="studio-history-section">
            <div className="studio-section-heading">
              <div>
                <h3>Saved drafts</h3>
                <p>Continue working on saved awareness messages.</p>
              </div>
            </div>

            {drafts.length === 0 ? (
              <div className="studio-empty-state">
                No drafts saved yet.
              </div>
            ) : (
              <div className="studio-saved-grid">
                {drafts.map((draft) => (
                  <article className="studio-card" key={draft.id}>
                    <h4>{draft.title}</h4>

                    <p>
                      {(draft.content || "").slice(0, 120)}
                      {(draft.content || "").length > 120 ? "..." : ""}
                    </p>

                    <div className="studio-form-actions">
                      <button
                        type="button"
                        className="studio-button"
                        onClick={() => loadDraft(draft)}
                      >
                        Open
                      </button>

                      <button
                        type="button"
                        className="studio-button studio-button-secondary"
                        onClick={() => deleteDraft(draft.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* SAVED TEMPLATES */}
          <section className="studio-history-section">
            <div className="studio-section-heading">
              <div>
                <h3>Saved templates</h3>
                <p>Reuse content and preferences for future campaigns.</p>
              </div>
            </div>

            {templates.length === 0 ? (
              <div className="studio-empty-state">
                No templates saved yet.
              </div>
            ) : (
              <div className="studio-saved-grid">
                {templates.map((template) => (
                  <article className="studio-card" key={template.id}>
                    <h4>{template.title}</h4>

                    <p>
                      {(template.content || "").slice(0, 120)}
                      {(template.content || "").length > 120 ? "..." : ""}
                    </p>

                    <div className="studio-form-actions">
                      <button
                        type="button"
                        className="studio-button"
                        onClick={() => loadTemplate(template)}
                      >
                        Use Template
                      </button>

                      <button
                        type="button"
                        className="studio-button studio-button-secondary"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>

        {/* RIGHT: MULTILINGUAL TRANSLATION STUDIO */}
        <section className="studio-translation-panel">
          <div className="studio-panel-title">
            <div className="studio-panel-icon" aria-hidden="true">
              🌐
            </div>

            <div className="studio-panel-heading">
              <h2>Multilingual Translation Studio</h2>
              <p>
                Translate public-awareness messages into Indian languages,
                edit the results, and review them before publishing.
              </p>
            </div>
          </div>

          <TranslationPanel sourceText={generatedContent} />
        </section>
      </div>
    </main>
  );
}
