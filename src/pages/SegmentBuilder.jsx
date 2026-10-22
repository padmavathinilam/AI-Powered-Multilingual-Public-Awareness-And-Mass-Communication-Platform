
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

const BASIC_FIELDS = [
  { value: "age", label: "Age" },
  { value: "gender", label: "Gender" },
  { value: "city", label: "City" },
  { value: "state", label: "State" },
  { value: "preferred_language", label: "Preferred Language" },
  { value: "occupation", label: "Occupation" },
  { value: "organization_department", label: "Department" },
  { value: "consent_status", label: "Consent Status" },
];

const ENGAGEMENT_FIELDS = [
  { value: "message_status", label: "Message Status" },
  { value: "message_opened", label: "Message Opened" },
  { value: "link_clicked", label: "Link Clicked" },
  { value: "campaign_id", label: "Campaign ID" },
];

const TEXT_OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Does not equal" },
  { value: "contains", label: "Contains" },
  { value: "in", label: "Is one of" },
  { value: "is_empty", label: "Is empty" },
  { value: "is_not_empty", label: "Is not empty" },
];

const AGE_OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Does not equal" },
  { value: "greater_than", label: "Greater than" },
  { value: "greater_than_or_equal", label: "Greater than or equal" },
  { value: "less_than", label: "Less than" },
  { value: "less_than_or_equal", label: "Less than or equal" },
  { value: "between", label: "Between" },
];

const ENGAGEMENT_OPERATORS = {
  message_status: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Does not equal" },
    { value: "contains", label: "Contains" },
    { value: "in", label: "Is one of" },
  ],
  message_opened: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Does not equal" },
  ],
  link_clicked: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Does not equal" },
  ],
  campaign_id: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Does not equal" },
    { value: "in", label: "Is one of" },
  ],
};

const EMPTY_RULE = {
  field: "age",
  operator: "greater_than_or_equal",
  value: "18",
};

function operatorsFor(field) {
  if (ENGAGEMENT_OPERATORS[field]) {
    return ENGAGEMENT_OPERATORS[field];
  }

  return field === "age" ? AGE_OPERATORS : TEXT_OPERATORS;
}

function defaultOperator(field) {
  return operatorsFor(field)[0].value;
}

function defaultValue(field, operator = defaultOperator(field)) {
  if (operator === "is_empty" || operator === "is_not_empty") {
    return "";
  }

  if (field === "message_opened" || field === "link_clicked") {
    return "true";
  }

  if (field === "message_status") {
    return "sent";
  }

  if (field === "campaign_id") {
    return "1";
  }

  if (field === "age") {
    return operator === "between" ? ["18", "30"] : "18";
  }

  return "";
}

function normalizeRule(rule) {
  const field = rule.field || "age";
  const operator = operatorsFor(field).some(
    (item) => item.value === rule.operator
  )
    ? rule.operator
    : defaultOperator(field);

  let value = rule.value ?? defaultValue(field, operator);

  if (operator === "between") {
    if (!Array.isArray(value)) value = ["18", "30"];
    value = [String(value[0] ?? ""), String(value[1] ?? "")];
  } else if (operator === "in" && Array.isArray(value)) {
    value = value.join(", ");
  } else if (value !== null && value !== undefined) {
    value = String(value);
  }

  return { field, operator, value };
}

function buildPayloadRule(rule) {
  const normalized = normalizeRule(rule);
  let value = normalized.value;

  if (normalized.operator === "between") {
    value = value.map(Number);
  } else if (normalized.operator === "in") {
    value = String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (normalized.field === "campaign_id") {
      value = value.map(Number);
    }
  } else if (normalized.operator !== "is_empty" &&
             normalized.operator !== "is_not_empty") {
    if (normalized.field === "age" || normalized.field === "campaign_id") {
      value = Number(value);
    }
  }

  return {
    field: normalized.field,
    operator: normalized.operator,
    ...(normalized.operator !== "is_empty" &&
       normalized.operator !== "is_not_empty"
      ? { value }
      : {}),
  };
}

export default function SegmentBuilder() {
  const params = useParams();
  const segmentId = params.id || params.segmentId;
  const navigate = useNavigate();
  const isEditing = Boolean(segmentId);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logic, setLogic] = useState("AND");
  const [rules, setRules] = useState([{ ...EMPTY_RULE }]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isEditing) return;

    let cancelled = false;

    async function loadSegment() {
      try {
        setLoading(true);
        const response = await api.get(`/api/segments/${segmentId}`);

        if (cancelled) return;

        const segment = response.data;
        setName(segment.name || "");
        setDescription(segment.description || "");
        setLogic(
          String(segment.filter_rules?.logic || "AND").toUpperCase()
        );

        const savedRules = segment.filter_rules?.rules || [];
        setRules(
          savedRules.length
            ? savedRules.map(normalizeRule)
            : [{ ...EMPTY_RULE }]
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.detail || "Unable to load segment."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSegment();

    return () => {
      cancelled = true;
    };
  }, [segmentId, isEditing]);

  function updateRule(index, changes) {
    setRules((current) =>
      current.map((rule, i) => {
        if (i !== index) return rule;

        const updated = { ...rule, ...changes };

        if (changes.field) {
          updated.operator = defaultOperator(changes.field);
          updated.value = defaultValue(
            changes.field,
            updated.operator
          );
        }

        if (changes.operator) {
          updated.value = defaultValue(
            updated.field,
            changes.operator
          );
        }

        return updated;
      })
    );

    setPreview(null);
    setError("");
  }

  function addRule() {
    setRules((current) => [
      ...current,
      { ...EMPTY_RULE },
    ]);
    setPreview(null);
  }

  function removeRule(index) {
    setRules((current) => current.filter((_, i) => i !== index));
    setPreview(null);
  }

  function getFilterRules() {
    return {
      logic,
      rules: rules.map(buildPayloadRule),
    };
  }

  async function handlePreview() {
    try {
      setError("");
      setSuccess("");
      setPreviewLoading(true);

      const response = await api.post("/api/segments/preview", {
        filter_rules: getFilterRules(),
        sample_size: 5,
      });

      setPreview(response.data);
    } catch (err) {
      setPreview(null);
      setError(
        err.response?.data?.detail ||
          "Unable to preview audience. Check the selected rules."
      );
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Please enter a segment name.");
      return;
    }

    if (rules.some((rule) => {
      const noValue = ["is_empty", "is_not_empty"].includes(
        rule.operator
      );

      if (noValue) return false;

      if (rule.operator === "between") {
        return (
          !Array.isArray(rule.value) ||
          rule.value.some((value) => value === "" || !Number.isFinite(Number(value))) ||
          Number(rule.value[0]) > Number(rule.value[1])
        );
      }

      if (rule.operator === "in") {
        return !String(rule.value).split(",").some((value) => value.trim());
      }

      if (rule.value === "" || rule.value === null || rule.value === undefined) {
        return true;
      }

      if (["age", "campaign_id"].includes(rule.field)) {
        return !Number.isFinite(Number(rule.value)) ||
          (rule.field === "campaign_id" && Number(rule.value) < 1);
      }

      return false;
    })) {
      setError("Please enter valid values for every rule.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const payload = {
        name: name.trim(),
        description: description.trim(),
        filter_rules: getFilterRules(),
      };

      if (isEditing) {
        await api.put(`/api/segments/${segmentId}`, payload);
      } else {
        await api.post("/api/segments/", payload);
      }

      setSuccess("Segment saved successfully.");
      navigate("/segments");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Unable to save segment."
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading && isEditing && !name) {
    return <div style={styles.page}>Loading segment...</div>;
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>
            {isEditing ? "Edit Segment" : "Create Segment"}
          </h1>
          <p style={styles.muted}>
            Define audience rules and preview matching members.
          </p>
        </div>

        <button
          type="button"
          style={styles.secondaryButton}
          onClick={() => navigate("/segments")}
        >
          Back to Segments
        </button>
      </div>

      {error && <div style={styles.error}>{String(error)}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <form onSubmit={handleSave}>
        <section style={styles.card}>
          <h2 style={styles.subheading}>Segment Details</h2>

          <label style={styles.label}>Segment Name</label>
          <input
            style={styles.input}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Example: Telugu-speaking youth"
            required
          />

          <label style={styles.label}>Description</label>
          <textarea
            style={styles.textarea}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe this audience segment"
            rows={3}
          />
        </section>

        <section style={styles.card}>
          <div style={styles.ruleHeader}>
            <div>
              <h2 style={styles.subheading}>Audience Rules</h2>
              <p style={styles.muted}>
                Choose profile or engagement filters.
              </p>
            </div>

            <div>
              <label style={styles.label}>Match Rules</label>
              <select
                style={styles.select}
                value={logic}
                onChange={(event) => {
                  setLogic(event.target.value);
                  setPreview(null);
                }}
              >
                <option value="AND">AND — Match all rules</option>
                <option value="OR">OR — Match any rule</option>
              </select>
            </div>
          </div>

          {rules.map((rule, index) => (
            <div style={styles.rule} key={index}>
              <div style={styles.ruleNumber}>{index + 1}</div>

              <div style={styles.ruleFields}>
                <div>
                  <label style={styles.label}>Field</label>
                  <select
                    style={styles.select}
                    value={rule.field}
                    onChange={(event) =>
                      updateRule(index, { field: event.target.value })
                    }
                  >
                    <optgroup label="Audience Profile">
                      {BASIC_FIELDS.map((field) => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Engagement History">
                      {ENGAGEMENT_FIELDS.map((field) => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Operator</label>
                  <select
                    style={styles.select}
                    value={rule.operator}
                    onChange={(event) =>
                      updateRule(index, {
                        operator: event.target.value,
                      })
                    }
                  >
                    {operatorsFor(rule.field).map((operator) => (
                      <option
                        key={operator.value}
                        value={operator.value}
                      >
                        {operator.label}
                      </option>
                    ))}
                  </select>
                </div>

                {!["is_empty", "is_not_empty"].includes(rule.operator) && (
                  <div>
                    <label style={styles.label}>Value</label>

                    {rule.operator === "between" ? (
                      <div style={styles.range}>
                        <input
                          style={styles.input}
                          type="number"
                          value={rule.value[0]}
                          placeholder="Minimum"
                          onChange={(event) =>
                            updateRule(index, {
                              value: [event.target.value, rule.value[1]],
                            })
                          }
                        />
                        <input
                          style={styles.input}
                          type="number"
                          value={rule.value[1]}
                          placeholder="Maximum"
                          onChange={(event) =>
                            updateRule(index, {
                              value: [rule.value[0], event.target.value],
                            })
                          }
                        />
                      </div>
                    ) : rule.field === "message_opened" ||
                      rule.field === "link_clicked" ? (
                      <select
                        style={styles.select}
                        value={rule.value}
                        onChange={(event) =>
                          updateRule(index, { value: event.target.value })
                        }
                      >
                        <option value="true">Yes / True</option>
                        <option value="false">No / False</option>
                      </select>
                    ) : (
                      <input
                        style={styles.input}
                        type={
                          rule.field === "age" ||
                          rule.field === "campaign_id"
                            ? "number"
                            : "text"
                        }
                        min={rule.field === "campaign_id" ? 1 : undefined}
                        value={rule.value}
                        placeholder={
                          rule.operator === "in"
                            ? "Enter comma-separated values"
                            : rule.field === "message_status"
                              ? "Example: sent"
                              : rule.field === "campaign_id"
                                ? "Existing campaign ID"
                                : "Enter value"
                        }
                        onChange={(event) =>
                          updateRule(index, { value: event.target.value })
                        }
                      />
                    )}

                    {rule.operator === "in" && (
                      <small style={styles.hint}>
                        Separate multiple values with commas.
                      </small>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                style={styles.removeButton}
                onClick={() => removeRule(index)}
                disabled={rules.length === 1}
                title="Remove rule"
              >
                Remove
              </button>
            </div>
          ))}

          <div style={styles.actions}>
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={addRule}
            >
              + Add Rule
            </button>

            <button
              type="button"
              style={styles.primaryButton}
              onClick={handlePreview}
              disabled={previewLoading}
            >
              {previewLoading ? "Previewing..." : "Preview Audience"}
            </button>
          </div>
        </section>

        {preview && (
          <section style={styles.card}>
            <h2 style={styles.subheading}>Audience Preview</h2>
            <div style={styles.countBox}>
              <span style={styles.count}>{preview.count}</span>
              <span>matching audience members</span>
            </div>

            {preview.sample?.length > 0 ? (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Age</th>
                      <th style={styles.th}>City</th>
                      <th style={styles.th}>Language</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sample.map((member) => (
                      <tr key={member.id}>
                        <td style={styles.td}>{member.name}</td>
                        <td style={styles.td}>{member.email || "—"}</td>
                        <td style={styles.td}>{member.age ?? "—"}</td>
                        <td style={styles.td}>{member.city || "—"}</td>
                        <td style={styles.td}>
                          {member.preferred_language || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={styles.muted}>
                No members matched these rules. Check the filters and
                whether engagement events have been recorded.
              </p>
            )}
          </section>
        )}

        <div style={styles.footer}>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => navigate("/segments")}
          >
            Cancel
          </button>

          <button
            type="submit"
            style={styles.primaryButton}
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : isEditing
                ? "Update Segment"
                : "Save Segment"}
          </button>
        </div>
      </form>
    </main>
  );
}

const styles = {
  page: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: 24,
    color: "var(--text-primary, #202938)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 24,
  },
  heading: { margin: 0, fontSize: 28 },
  subheading: { marginTop: 0, marginBottom: 12, fontSize: 19 },
  muted: { color: "#687386", marginTop: 6 },
  card: {
    background: "var(--card-bg, #ffffff)",
    border: "1px solid #e0e5ec",
    borderRadius: 12,
    padding: 22,
    marginBottom: 20,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 7,
    marginTop: 12,
  },
  input: {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: "10px 12px",
    border: "1px solid #cbd3df",
    borderRadius: 7,
    fontSize: 14,
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: 12,
    border: "1px solid #cbd3df",
    borderRadius: 7,
    resize: "vertical",
    fontSize: 14,
  },
  select: {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: "10px 9px",
    border: "1px solid #cbd3df",
    borderRadius: 7,
    background: "#ffffff",
    fontSize: 14,
  },
  ruleHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 18,
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  rule: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    marginBottom: 12,
    border: "1px solid #e1e6ed",
    borderRadius: 9,
  },
  ruleNumber: {
    borderRadius: "50%",
    background: "#edf2ff",
    color: "#344db2",
    width: 30,
    height: 30,
    flexShrink: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: 700,
    marginTop: 20,
  },
  ruleFields: {
    flex: 1,
    minWidth: 0,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: 12,
  },
  range: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },
  hint: { color: "#687386", display: "block", marginTop: 5 },
  actions: {
    display: "flex",
    gap: 10,
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginTop: 20,
  },
  primaryButton: {
    background: "#3549b8",
    color: "#ffffff",
    border: "none",
    borderRadius: 7,
    padding: "11px 18px",
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryButton: {
    background: "#ffffff",
    color: "#263449",
    border: "1px solid #cbd3df",
    borderRadius: 7,
    padding: "10px 16px",
    cursor: "pointer",
  },
  removeButton: {
    background: "#ffffff",
    color: "#b42318",
    border: "1px solid #efc5c2",
    borderRadius: 7,
    padding: "9px 11px",
    cursor: "pointer",
    marginTop: 20,
  },
  countBox: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    padding: 16,
    borderRadius: 9,
    background: "#f0f4ff",
    marginBottom: 18,
  },
  count: { fontSize: 28, fontWeight: 700, color: "#3549b8" },
  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: 11,
    background: "#f5f7fa",
    borderBottom: "1px solid #dce2ea",
  },
  td: {
    padding: 11,
    borderBottom: "1px solid #e7ebf0",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20,
    marginBottom: 30,
  },
  error: {
    padding: 12,
    background: "#fff0f0",
    color: "#a61b1b",
    borderRadius: 7,
    marginBottom: 16,
  },
  success: {
    padding: 12,
    background: "#edf9f0",
    color: "#176b35",
    borderRadius: 7,
    marginBottom: 16,
  },
};
