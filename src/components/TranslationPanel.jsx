
import React, { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import "./TranslationPanel.css";

const LANGUAGES = [
  { name: "Hindi", native: "हिन्दी" },
  { name: "Kannada", native: "ಕನ್ನಡ" },
  { name: "Tamil", native: "தமிழ்" },
  { name: "Telugu", native: "తెలుగు" },
  { name: "Marathi", native: "मराठी" },
  { name: "Bengali", native: "বাংলা" },
  { name: "Gujarati", native: "ગુજરાતી" },
  { name: "Malayalam", native: "മലയാളം" },
  { name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { name: "Urdu", native: "اردو" },
];

const INITIAL_LANGUAGES = LANGUAGES.map((language) => language.name);

function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || "Invalid request").join(", ");
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function normalizeTranslation(item) {
  const isReviewed =
    item?.is_reviewed === true || item?.is_reviewed === 1;

  const isApproved =
    item?.is_approved === true || item?.is_approved === 1;

  return {
    ...item,
    is_reviewed: isReviewed,
    is_approved: isApproved,
    translated_text: item?.translated_text || "",
    source_text: item?.source_text || "",
    status: isApproved
      ? "Approved"
      : isReviewed
        ? "Reviewed"
        : item?.status || "Auto-translated",
  };
}

function getStatusClass(status) {
  switch (status) {
    case "Approved":
      return "translation-status-approved";
    case "Reviewed":
      return "translation-status-reviewed";
    default:
      return "translation-status-auto";
  }
}

function getUpdatedTime(item) {
  const value =
    item?.updated_at ||
    item?.updatedAt ||
    item?.created_at ||
    item?.createdAt;

  if (!value) return "Saved";

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "Saved" : date.toLocaleString();
}

function sortTranslations(items) {
  const languageOrder = new Map(
    LANGUAGES.map((language, index) => [language.name, index])
  );

  return [...items].sort(
    (a, b) =>
      (languageOrder.get(a.target_language) ?? 999) -
      (languageOrder.get(b.target_language) ?? 999)
  );
}

function mergeTranslations(existing, incoming) {
  const map = new Map();

  [...existing, ...incoming].forEach((rawItem) => {
    const item = normalizeTranslation(rawItem);
    const key =
      item.id != null
        ? `id-${item.id}`
        : `language-${item.target_language}`;

    const previous = map.get(key);

    map.set(key, {
      ...previous,
      ...item,
      is_reviewed:
        item.is_reviewed || previous?.is_reviewed || false,
      is_approved:
        item.is_approved || previous?.is_approved || false,
    });
  });

  const latestByLanguage = new Map();

  Array.from(map.values()).forEach((item) => {
    const current = latestByLanguage.get(item.target_language);

    if (
      !current ||
      (item.id != null && current.id != null && item.id > current.id) ||
      (current.id == null && item.id != null)
    ) {
      latestByLanguage.set(item.target_language, item);
    }
  });

  return sortTranslations(Array.from(latestByLanguage.values()));
}

function extractTranslations(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.translations)) {
    return data.translations;
  }

  if (Array.isArray(data?.history)) {
    return data.history;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
}

export default function TranslationPanel({ sourceText = "" }) {
  const [source, setSource] = useState(sourceText);
  const [selectedLanguages, setSelectedLanguages] =
    useState(INITIAL_LANGUAGES);
  const [translations, setTranslations] = useState([]);
  const [activeLanguage, setActiveLanguage] = useState("");

  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [retryingId, setRetryingId] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setSource(sourceText || "");
  }, [sourceText]);

  const loadTranslationHistory = useCallback(async () => {
    setHistoryLoading(true);

    try {
      const response = await api.get("/ai/translate/history", {
        params: { limit: 100 },
      });

      const savedItems = extractTranslations(response.data).map(
        normalizeTranslation
      );

      setTranslations(sortTranslations(savedItems));

      setActiveLanguage((previous) => {
        if (
          previous &&
          savedItems.some((item) => item.target_language === previous)
        ) {
          return previous;
        }

        return savedItems[0]?.target_language || "";
      });

      setError("");
    } catch (err) {
      console.error("Translation history request failed:", {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });

      setError(
        `Could not load saved translation history: ${getErrorMessage(err)}`
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTranslationHistory();
  }, [loadTranslationHistory]);

  function toggleLanguage(languageName) {
    setSelectedLanguages((previous) =>
      previous.includes(languageName)
        ? previous.filter((name) => name !== languageName)
        : [...previous, languageName]
    );
  }

  function selectAllLanguages() {
    setSelectedLanguages(INITIAL_LANGUAGES);
  }

  function clearLanguages() {
    setSelectedLanguages([]);
  }

  function updateTranslationByLanguage(language, translatedText) {
    setTranslations((previous) =>
      previous.map((item) =>
        item.target_language === language
          ? {
              ...item,
              translated_text: translatedText,
              has_unsaved_changes: true,
            }
          : item
      )
    );
  }

  async function handleTranslateAll() {
    if (!source.trim()) {
      setError("Enter or generate a message before translating.");
      setNotice("");
      return;
    }

    if (selectedLanguages.length === 0) {
      setError("Select at least one target language.");
      setNotice("");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await api.post("/ai/translate/bulk", {
        text: source.trim(),
        source_language: "English",
        target_languages: selectedLanguages,
      });

      const results = extractTranslations(response.data).map(
        normalizeTranslation
      );

      if (results.length === 0) {
        setError("The backend did not return any translations.");
        return;
      }

      setTranslations((previous) => mergeTranslations(previous, results));
      setActiveLanguage(results[0]?.target_language || "");

      setNotice(
        `${results.length} translation(s) generated. Saved translations can be restored after refreshing the page.`
      );

      // Reload the server's persisted records.
      await loadTranslationHistory();
    } catch (err) {
      console.error("Bulk translation failed:", err?.response?.data || err);

      setError(`Translation failed: ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleRetranslate(language) {
    if (!source.trim()) {
      setError("Enter the source message before translating.");
      return;
    }

    setRetryingId(language);
    setError("");
    setNotice("");

    try {
      const response = await api.post("/ai/translate", {
        text: source.trim(),
        source_language: "English",
        target_language: language,
      });

      const result = normalizeTranslation(response.data);

      setTranslations((previous) => mergeTranslations(previous, [result]));
      setActiveLanguage(language);

      setNotice(`${language} translation regenerated successfully.`);

      await loadTranslationHistory();
    } catch (err) {
      setError(
        `Could not re-translate ${language}: ${getErrorMessage(err)}`
      );
    } finally {
      setRetryingId(null);
    }
  }

  async function saveTranslation(item, payload, successMessage) {
    if (item?.id == null) {
      setError(
        `The ${item?.target_language || ""} translation has no database ID. Translate it again before saving.`
      );
      return;
    }

    if (
      Object.prototype.hasOwnProperty.call(payload, "translated_text") &&
      !payload.translated_text.trim()
    ) {
      setError("Translation text cannot be empty.");
      return;
    }

    setSavingId(item.id);
    setError("");
    setNotice("");

    try {
      const response = await api.patch(
        `/ai/translate/${item.id}`,
        payload
      );

      const updatedItem = normalizeTranslation({
        ...item,
        ...response.data,
      });

      setTranslations((previous) =>
        previous.map((translation) =>
          translation.id === item.id
            ? {
                ...translation,
                ...updatedItem,
                has_unsaved_changes: false,
              }
            : translation
        )
      );

      // The database response is authoritative.
      await loadTranslationHistory();

      setNotice(successMessage);
    } catch (err) {
      console.error("Translation update failed:", {
        status: err?.response?.status,
        data: err?.response?.data,
      });

      setError(
        `Could not update ${item.target_language}: ${getErrorMessage(err)}`
      );
    } finally {
      setSavingId(null);
    }
  }

  async function handleSaveStatus(item, nextStatus) {
    const payload = {
      translated_text: item.translated_text.trim(),
    };

    // Only update the requested flag. Never reset the other flag.
    if (nextStatus === "Reviewed") {
      payload.is_reviewed = true;
    } else if (nextStatus === "Approved") {
      payload.is_approved = true;
    }

    await saveTranslation(
      item,
      payload,
      `${item.target_language} translation marked as ${nextStatus}.`
    );
  }

  async function handleSaveEdits(item) {
    await saveTranslation(
      item,
      {
        translated_text: item.translated_text.trim(),
      },
      `${item.target_language} edits saved successfully.`
    );
  }

  function getLanguageInfo(name) {
    return LANGUAGES.find((language) => language.name === name);
  }

  const activeTranslation = translations.find(
    (item) => item.target_language === activeLanguage
  );

  return (
    <section className="translation-panel">
      {/* STEP 1: SOURCE MESSAGE */}
      <div className="translation-source-card">
        <div className="translation-section-heading">
          <div>
            <span className="translation-step">01</span>
            <h3>Source message</h3>
          </div>

          <span className="translation-language-label">
            English · Source
          </span>
        </div>

        <label className="translation-label" htmlFor="translation-source">
          Message to translate
        </label>

        <textarea
          id="translation-source"
          className="translation-textarea translation-source-text"
          value={source}
          onChange={(event) => setSource(event.target.value)}
          placeholder="Generate content above or enter your English message..."
          rows={4}
        />

        <small className="translation-help">
          Check dates, names, numbers, and links in every translation.
        </small>
      </div>

      {/* STEP 2: TARGET LANGUAGES */}
      <div className="translation-language-card">
        <div className="translation-section-heading">
          <div>
            <span className="translation-step">02</span>
            <h3>Select target languages</h3>
          </div>

          <span className="translation-selected-count">
            {selectedLanguages.length}/10 selected
          </span>
        </div>

        <div className="translation-language-actions">
          <button
            type="button"
            className="translation-link-button"
            onClick={selectAllLanguages}
          >
            Select all 10
          </button>

          <button
            type="button"
            className="translation-link-button"
            onClick={clearLanguages}
          >
            Clear selection
          </button>
        </div>

        <div className="translation-language-grid">
          {LANGUAGES.map((language) => {
            const checked = selectedLanguages.includes(language.name);

            return (
              <label
                key={language.name}
                className={`translation-language-option ${
                  checked ? "selected" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleLanguage(language.name)}
                />

                <span className="translation-language-native">
                  {language.native}
                </span>

                <span className="translation-language-name">
                  {language.name}
                </span>
              </label>
            );
          })}
        </div>

        <button
          type="button"
          className="translation-primary-button"
          onClick={handleTranslateAll}
          disabled={
            loading || !source.trim() || selectedLanguages.length === 0
          }
        >
          {loading ? (
            <>
              <span className="translation-spinner" />
              Translating...
            </>
          ) : (
            <>🌐 Translate All ({selectedLanguages.length})</>
          )}
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div
          className="translation-alert translation-alert-error"
          role="alert"
        >
          <strong>Translation notice</strong>
          <span>{error}</span>
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {notice && (
        <div
          className="translation-alert translation-alert-success"
          role="status"
        >
          <span>✓</span>
          <span>{notice}</span>
        </div>
      )}

      {/* STEP 3: TRANSLATION HISTORY */}
      <div className="translation-results">
        <div className="translation-section-heading">
          <div>
            <span className="translation-step">03</span>
            <h3>Translation history</h3>
          </div>

          <button
            type="button"
            className="translation-secondary-button"
            onClick={loadTranslationHistory}
            disabled={historyLoading}
          >
            {historyLoading ? "Loading..." : "↻ Refresh history"}
          </button>
        </div>

        {historyLoading && translations.length === 0 && (
          <p className="translation-help">
            Loading saved translations...
          </p>
        )}

        {!historyLoading && translations.length === 0 && !error && (
          <div className="translation-empty-state">
            <h4>No saved translations yet</h4>
            <p>
              Enter a source message, select one or more languages, and
              choose Translate All. Saved translations will appear here
              after they are returned by the backend.
            </p>
          </div>
        )}

        {translations.length > 0 && (
          <>
            <p className="translation-history-summary">
              {translations.length} saved language translation(s)
            </p>

            <div
              className="translation-tabs"
              role="tablist"
              aria-label="Translation languages"
            >
              {translations.map((item) => {
                const info = getLanguageInfo(item.target_language);

                return (
                  <button
                    key={item.id ?? item.target_language}
                    type="button"
                    role="tab"
                    aria-selected={activeLanguage === item.target_language}
                    className={`translation-tab ${
                      activeLanguage === item.target_language ? "active" : ""
                    }`}
                    onClick={() => {
                      setActiveLanguage(item.target_language);
                      setSource(item.source_text || source);
                      setError("");
                    }}
                  >
                    <span>{info?.native || item.target_language}</span>
                    <small>{item.target_language}</small>
                  </button>
                );
              })}
            </div>

            {/* ACTIVE TRANSLATION */}
            {activeTranslation && (
              <article
                className="translation-result-card"
                key={
                  activeTranslation.id ?? activeTranslation.target_language
                }
              >
                <div className="translation-result-header">
                  <div>
                    <h4>
                      {getLanguageInfo(activeTranslation.target_language)
                        ?.native || ""}{" "}
                      {activeTranslation.target_language}
                    </h4>

                    <div className="translation-independent-statuses">
                      <span
                        className={`translation-status-badge ${
                          activeTranslation.is_reviewed
                            ? getStatusClass("Reviewed")
                            : getStatusClass("Auto-translated")
                        }`}
                      >
                        {activeTranslation.is_reviewed
                          ? "✓ Reviewed"
                          : "Not Reviewed"}
                      </span>

                      <span
                        className={`translation-status-badge ${
                          activeTranslation.is_approved
                            ? getStatusClass("Approved")
                            : getStatusClass("Auto-translated")
                        }`}
                      >
                        {activeTranslation.is_approved
                          ? "✓ Approved"
                          : "Not Approved"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="translation-secondary-button"
                    onClick={() =>
                      handleRetranslate(activeTranslation.target_language)
                    }
                    disabled={
                      retryingId === activeTranslation.target_language ||
                      loading
                    }
                  >
                    {retryingId === activeTranslation.target_language
                      ? "Re-translating..."
                      : "↻ Re-translate"}
                  </button>
                </div>

                {/* ORIGINAL AND TRANSLATED TEXT */}
                <div className="translation-comparison">
                  <div className="translation-comparison-column">
                    <div className="translation-column-heading">
                      <span>Original message</span>
                      <span>
                        {activeTranslation.source_language || "English"}
                      </span>
                    </div>

                    <div className="translation-original-text">
                      {activeTranslation.source_text ||
                        source ||
                        "No source text available."}
                    </div>
                  </div>

                  <div className="translation-comparison-column">
                    <div className="translation-column-heading">
                      <span>Translated message</span>
                      <span>{activeTranslation.target_language}</span>
                    </div>

                    <label
                      className="translation-sr-label"
                      htmlFor={`translated-${activeTranslation.id ?? activeTranslation.target_language}`}
                    >
                      Edit translated message
                    </label>

                    <textarea
                      id={`translated-${activeTranslation.id ?? activeTranslation.target_language}`}
                      className="translation-textarea translation-output-text"
                      dir={
                        activeTranslation.target_language === "Urdu"
                          ? "rtl"
                          : "auto"
                      }
                      value={activeTranslation.translated_text}
                      onChange={(event) =>
                        updateTranslationByLanguage(
                          activeTranslation.target_language,
                          event.target.value
                        )
                      }
                      rows={6}
                    />

                    <small className="translation-help">
                      Characters: {activeTranslation.translated_text.length}
                      {activeTranslation.has_unsaved_changes
                        ? " · Unsaved changes"
                        : ""}
                    </small>
                  </div>
                </div>

                {/* SAVE, REVIEW, AND APPROVE ACTIONS */}
                <div className="translation-result-footer">
                  <p>
                    Review names, dates, links, numbers, and important
                    public information before approving this translation.
                  </p>

                  <div className="translation-result-buttons">
                    <button
                      type="button"
                      className="translation-secondary-button"
                      onClick={() => handleSaveEdits(activeTranslation)}
                      disabled={
                        savingId === activeTranslation.id ||
                        activeTranslation.id == null ||
                        !activeTranslation.has_unsaved_changes
                      }
                    >
                      {savingId === activeTranslation.id
                        ? "Saving..."
                        : "Save edits"}
                    </button>

                    <button
                      type="button"
                      className="translation-secondary-button"
                      onClick={() =>
                        handleSaveStatus(activeTranslation, "Reviewed")
                      }
                      disabled={
                        savingId === activeTranslation.id ||
                        activeTranslation.id == null ||
                        activeTranslation.is_reviewed
                      }
                    >
                      {savingId === activeTranslation.id
                        ? "Saving..."
                        : activeTranslation.is_reviewed
                          ? "✓ Reviewed"
                          : "✓ Save as Reviewed"}
                    </button>

                    <button
                      type="button"
                      className="translation-approve-button"
                      onClick={() =>
                        handleSaveStatus(activeTranslation, "Approved")
                      }
                      disabled={
                        savingId === activeTranslation.id ||
                        activeTranslation.id == null ||
                        activeTranslation.is_approved
                      }
                    >
                      {savingId === activeTranslation.id
                        ? "Saving..."
                        : activeTranslation.is_approved
                          ? "✓ Approved"
                          : "✓ Approve"}
                    </button>
                  </div>
                </div>
              </article>
            )}

            {/* STEP 4: TRANSLATION STATUS TABLE */}
            <div className="translation-status-section">
              <div className="translation-section-heading">
                <div>
                  <span className="translation-step">04</span>
                  <h3>Translation status</h3>
                </div>
              </div>

              <div className="translation-status-table-wrapper">
                <table className="translation-status-table">
                  <thead>
                    <tr>
                      <th>Language</th>
                      <th>Review</th>
                      <th>Approval</th>
                      <th>Last updated</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {translations.map((item) => (
                      <tr key={item.id ?? item.target_language}>
                        <td>
                          <strong>{item.target_language}</strong>
                        </td>

                        <td>
                          <span
                            className={`translation-status-badge ${
                              item.is_reviewed
                                ? getStatusClass("Reviewed")
                                : getStatusClass("Auto-translated")
                            }`}
                          >
                            {item.is_reviewed ? "Reviewed" : "Pending"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`translation-status-badge ${
                              item.is_approved
                                ? getStatusClass("Approved")
                                : getStatusClass("Auto-translated")
                            }`}
                          >
                            {item.is_approved ? "Approved" : "Pending"}
                          </span>
                        </td>

                        <td>{getUpdatedTime(item)}</td>

                        <td>
                          <button
                            type="button"
                            className="translation-edit-status-button"
                            aria-label={`Open ${item.target_language} translation`}
                            title={`Open ${item.target_language} translation`}
                            onClick={() => {
                              setActiveLanguage(item.target_language);
                              setSource(item.source_text || source);
                            }}
                          >
                            ✎
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
