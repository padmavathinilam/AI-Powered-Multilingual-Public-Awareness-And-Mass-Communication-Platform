
import React, { useState } from "react";
import api from "../services/api";
import "./ContentStudio.css";

const languages = [
  { value: "English", label: "English" },
  { value: "Assamese", label: "অসমীয়া — Assamese" },
  { value: "Bengali", label: "বাংলা — Bengali" },
  { value: "Bodo", label: "बड़ो — Bodo" },
  { value: "Dogri", label: "डोगरी — Dogri" },
  { value: "Gujarati", label: "ગુજરાતી — Gujarati" },
  { value: "Hindi", label: "हिन्दी — Hindi" },
  { value: "Kannada", label: "ಕನ್ನಡ — Kannada" },
  { value: "Kashmiri", label: "कॉशुर — Kashmiri" },
  { value: "Konkani", label: "कोंकणी — Konkani" },
  { value: "Maithili", label: "मैथिली — Maithili" },
  { value: "Malayalam", label: "മലയാളം — Malayalam" },
  { value: "Manipuri", label: "মৈতৈলোন্ — Manipuri" },
  { value: "Marathi", label: "मराठी — Marathi" },
  { value: "Nepali", label: "नेपाली — Nepali" },
  { value: "Odia", label: "ଓଡ଼ିଆ — Odia" },
  { value: "Punjabi", label: "ਪੰਜਾਬੀ — Punjabi" },
  { value: "Sanskrit", label: "संस्कृतम् — Sanskrit" },
  { value: "Santali", label: "ᱥᱟᱱᱛᱟᱲᱤ — Santali" },
  { value: "Sindhi", label: "سنڌي — Sindhi" },
  { value: "Tamil", label: "தமிழ் — Tamil" },
  { value: "Telugu", label: "తెలుగు — Telugu" },
  { value: "Urdu", label: "اردو — Urdu" },
];

const initialForm = {
  topic: "",
  audience: "General public",
  language: "English",
  content_type: "Awareness Message",
  tone: "Friendly",
  word_limit: 150,
};

export default function ContentStudio() {
  const [form, setForm] = useState(initialForm);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: name === "word_limit" ? Number(value) : value,
    }));
  }

  async function handleGenerate(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");
    setCopied(false);
    setContent("");

    try {
      const response = await api.post("/api/ai/generate", {
        ...form,
        word_limit: Number(form.word_limit),
      });

      setContent(response.data.content || "");
      setMessage(
        `Content generated successfully. Word count: ${response.data.word_count}.`
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to generate content. Check your backend connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!content.trim()) return;

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setMessage("Content copied to clipboard.");
      setError("");
    } catch {
      setError(
        "Clipboard access failed. Select the generated text and copy it manually."
      );
    }
  }

  function handleReset() {
    setForm(initialForm);
    setContent("");
    setError("");
    setMessage("");
    setCopied(false);
  }

  return (
    <div className="content-studio">
      <div className="studio-heading">
        <div>
          <p className="studio-eyebrow">AI PUBLICCONNECT / AI TOOLS</p>
          <h1>AI Content Studio</h1>
          <p className="studio-subtitle">
            Create multilingual public-awareness content using Gemini AI.
          </p>
        </div>
        <div className="studio-ai-badge">
          <span>✦</span> Gemini AI
        </div>
      </div>

      <div className="studio-intro">
        <div className="studio-intro-icon">✦</div>
        <div>
          <h2>Turn awareness ideas into clear messages</h2>
          <p>
            Choose a topic, audience, language, and tone. Generate content,
            review it, edit it, and copy it for your campaign.
          </p>
        </div>
      </div>

      <form className="studio-card" onSubmit={handleGenerate}>
        <div className="studio-card-heading">
          <div>
            <span className="studio-step">01</span>
            <h2>Content preferences</h2>
          </div>
          <p>Required fields are marked with *</p>
        </div>

        <div className="studio-form-fields">
          <label className="studio-field">
            <span>Campaign topic *</span>
            <input
              name="topic"
              value={form.topic}
              onChange={updateField}
              placeholder="e.g. Importance of vaccination"
              minLength={3}
              maxLength={200}
              required
            />
          </label>

          <label className="studio-field">
            <span>Target audience *</span>
            <input
              name="audience"
              value={form.audience}
              onChange={updateField}
              placeholder="e.g. Rural families, students, farmers"
              minLength={2}
              maxLength={200}
              required
            />
          </label>

          <label className="studio-field">
            <span>Language *</span>
            <select
              name="language"
              value={form.language}
              onChange={updateField}
              required
            >
              {languages.map((language) => (
                <option key={language.value} value={language.value}>
                  {language.label}
                </option>
              ))}
            </select>
            <small>English and 22 scheduled Indian languages</small>
          </label>

          <label className="studio-field">
            <span>Content type *</span>
            <select
              name="content_type"
              value={form.content_type}
              onChange={updateField}
              required
            >
              <option value="Awareness Message">Awareness Message</option>
              <option value="Social Media Post">Social Media Post</option>
              <option value="SMS">SMS</option>
              <option value="Announcement">Announcement</option>
            </select>
          </label>

          <label className="studio-field">
            <span>Tone *</span>
            <select
              name="tone"
              value={form.tone}
              onChange={updateField}
              required
            >
              <option value="Friendly">Friendly</option>
              <option value="Formal">Formal</option>
              <option value="Persuasive">Persuasive</option>
              <option value="Informative">Informative</option>
            </select>
          </label>

          <label className="studio-field">
            <span>Maximum words *</span>
            <input
              type="number"
              name="word_limit"
              min="20"
              max="500"
              value={form.word_limit}
              onChange={updateField}
              required
            />
            <small>Choose between 20 and 500 words</small>
          </label>
        </div>

        {error && (
          <div className="studio-alert studio-alert-error" role="alert">
            <strong>Generation failed</strong>
            <span>{error}</span>
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
            className="studio-button studio-button-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="studio-spinner" />
                Generating content...
              </>
            ) : (
              <>✦ Generate Content</>
            )}
          </button>
        </div>
      </form>

      {message && (
        <div className="studio-alert studio-alert-success" role="status">
          {message}
        </div>
      )}

      {content && (
        <section className="studio-card studio-result-card">
          <div className="studio-card-heading">
            <div>
              <span className="studio-step">02</span>
              <h2>Generated content</h2>
            </div>

            <span className="studio-result-label">AI generated</span>
          </div>

          <div className="studio-result-meta">
            <span>{form.language}</span>
            <span>{form.content_type}</span>
            <span>{content.trim().split(/\s+/).filter(Boolean).length} words</span>
          </div>

          <label className="studio-field">
            <span>Edit your content before publishing</span>
            <textarea
              aria-label="Generated content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={12}
            />
          </label>

          <div className="studio-result-actions">
            <button
              type="button"
              className="studio-button studio-button-primary"
              onClick={handleCopy}
            >
              {copied ? "✓ Copied" : "Copy content"}
            </button>
          </div>

          <p className="studio-review-note">
            Review generated content for accuracy and suitability before
            publishing, especially for health and government-related messages.
          </p>
        </section>
      )}
    </div>
  );
}
