
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import "../styles/Audience.css";

const LANGUAGES = [
  "English", "Telugu", "Hindi", "Tamil", "Kannada",
  "Malayalam", "Marathi", "Bengali", "Gujarati",
  "Punjabi", "Urdu", "Odia", "Assamese",
];

const CHANNELS = [
  "Email", "SMS", "WhatsApp", "Mobile Notification", "Website",
];

const CONSENT_STATUSES = ["Pending", "Granted", "Revoked"];

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  age: "",
  gender: "",
  city: "",
  state: "",
  preferred_language: "English",
  occupation: "",
  organization_department: "",
  preferred_channel: "Email",
  consent_status: "Pending",
};

const EMPTY_FILTERS = {
  city: "",
  state: "",
  preferred_language: "",
  preferred_channel: "",
  consent_status: "",
  occupation: "",
};

const styles = {
  page: {
    width: "100%",
    minHeight: "100%",
    background: "#f5f7fb",
    color: "#111827",
    fontFamily: "Arial, sans-serif",
  },
  main: {
    width: "100%",
    minWidth: 0,
    padding: 24,
    boxSizing: "border-box",
  },
  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    marginBottom: 20,
    boxSizing: "border-box",
  },
  input: {
    width: "100%",
    padding: 10,
    border: "1px solid #cbd5e1",
    borderRadius: 7,
    boxSizing: "border-box",
    background: "#fff",
    color: "#111827",
  },
  button: {
    padding: "10px 14px",
    border: 0,
    borderRadius: 7,
    cursor: "pointer",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 600,
  },
  secondary: {
    padding: "9px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: 7,
    cursor: "pointer",
    background: "#fff",
    color: "#111827",
    fontWeight: 500,
  },
  danger: {
    padding: "7px 10px",
    border: 0,
    borderRadius: 6,
    cursor: "pointer",
    background: "#fee2e2",
    color: "#b91c1c",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    color: "#111827",
    fontWeight: 500,
    minWidth: 0,
  },
  th: {
    textAlign: "left",
    padding: 12,
    background: "#f1f5f9",
    color: "#111827",
    fontWeight: 700,
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
  },
  td: {
    padding: 12,
    color: "#111827",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    fontSize: 13,
    fontWeight: 500,
  },
};

function getErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(", ");
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  return fallback;
}

function escapeCsv(value) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Audience() {
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);

  const [sortKey, setSortKey] = useState("id");
  const [sortDirection, setSortDirection] = useState("desc");

  const refreshData = () => {
    setRefreshKey((value) => value + 1);
  };

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        page,
        page_size: pageSize,
      };

      if (query.trim()) {
        params.q = query.trim();
      }

      Object.entries(filters).forEach(([key, value]) => {
        if (value.trim()) {
          params[key] = value.trim();
        }
      });

      const response = await api.get("/api/audience/", { params });
      const data = response.data || {};

      setMembers(Array.isArray(data.items) ? data.items : []);
      setTotal(Number(data.total || 0));
      setTotalPages(Number(data.total_pages || 0));
    } catch (err) {
      console.error("Audience fetch error:", err);
      setError(
        getErrorMessage(err, "Unable to load audience members.")
      );
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, query, filters]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get("/api/audience/stats");
      setStats(response.data || {});
    } catch (err) {
      console.error("Audience statistics error:", err);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers, refreshKey]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshKey]);

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setQuery(searchInput);
    setSelectedIds([]);
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));

    setPage(1);
    setSelectedIds([]);
  }

  function clearFilters() {
    setFilters({ ...EMPTY_FILTERS });
    setSearchInput("");
    setQuery("");
    setPage(1);
    setSelectedIds([]);
    setError("");
    setSuccess("");
  }

  function openAddForm() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function openEditForm(member) {
    setForm({
      ...EMPTY_FORM,
      ...member,
      age: member.age ?? "",
      email: member.email || "",
      phone: member.phone || "",
      city: member.city || "",
      state: member.state || "",
      occupation: member.occupation || "",
      organization_department: member.organization_department || "",
    });

    setEditingId(member.id);
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      age: form.age === "" ? null : Number(form.age),
      gender: form.gender || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      occupation: form.occupation.trim() || null,
      organization_department:
        form.organization_department.trim() || null,
    };

    try {
      if (editingId !== null) {
        await api.put(`/api/audience/${editingId}`, payload);
        setSuccess("Audience member updated successfully.");
      } else {
        await api.post("/api/audience/", payload);
        setSuccess("Audience member added successfully.");
      }

      closeForm();
      setPage(1);
      setSelectedIds([]);
      refreshData();
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to save audience member.")
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(member) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${member.name}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`/api/audience/${member.id}`);

      setSelectedIds((current) =>
        current.filter((id) => id !== member.id)
      );

      setSuccess("Audience member deleted successfully.");

      if (members.length === 1 && page > 1) {
        setPage((current) => current - 1);
      }

      refreshData();
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to delete audience member.")
      );
    }
  }

  async function handleUpload(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      setError("Please select a CSV or XLSX file.");
      return;
    }

    if (!/\.(csv|xlsx)$/i.test(file.name)) {
      setError("Only CSV and XLSX files are supported.");
      input.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must not exceed 10 MB.");
      input.value = "";
      return;
    }

    const body = new FormData();
    body.append("file", file, file.name);

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.post(
        "/api/audience/bulk-upload",
        body
      );

      const result = response.data || {};
      const imported = Number(result.imported ?? 0);
      const skipped = Number(result.skipped ?? 0);

      setSuccess(
        `Import completed: ${imported} imported, ${skipped} skipped.`
      );

      if (Array.isArray(result.errors) && result.errors.length > 0) {
        const messages = result.errors.map(
          (item) =>
            `Row ${item.row ?? "?"}: ${
              item.reason ?? item.message ?? "Invalid data"
            }`
        );

        if (result.errors_truncated) {
          messages.push("Additional errors were omitted by the server.");
        }

        setError(messages.join("\n"));
      }

      setPage(1);
      setSelectedIds([]);
      refreshData();
    } catch (err) {
      console.error("Audience upload error:", err.response?.data || err);

      setError(
        getErrorMessage(
          err,
          "Upload failed. Check the file columns and try again."
        )
      );
    } finally {
      setUploading(false);
      input.value = "";
    }
  }

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDirection((current) =>
        current === "asc" ? "desc" : "asc"
      );
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  const sortedMembers = [...members].sort((a, b) => {
    const first = a[sortKey] ?? "";
    const second = b[sortKey] ?? "";

    let comparison;

    if (sortKey === "id" || sortKey === "age") {
      comparison = Number(first || 0) - Number(second || 0);
    } else {
      comparison = String(first).localeCompare(String(second), undefined, {
        numeric: true,
        sensitivity: "base",
      });
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  const allSelected =
    members.length > 0 &&
    members.every((member) => selectedIds.includes(member.id));

  function toggleMember(id) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function toggleAllVisible(event) {
    setSelectedIds(
      event.target.checked ? members.map((member) => member.id) : []
    );
  }

  function exportCsv() {
    if (members.length === 0) {
      setError("There are no audience members on this page to export.");
      return;
    }

    const columns = [
      "id", "name", "email", "phone", "age", "gender",
      "city", "state", "preferred_language", "occupation",
      "organization_department", "preferred_channel", "consent_status",
    ];

    const rows = [
      columns.map(escapeCsv).join(","),
      ...members.map((member) =>
        columns.map((column) => escapeCsv(member[column])).join(",")
      ),
    ];

    downloadFile(
      "\uFEFF" + rows.join("\r\n"),
      "audience_members.csv",
      "text/csv;charset=utf-8;"
    );

    setSuccess("CSV export completed.");
    setError("");
  }

  const consentCounts = stats?.by_consent_status || {};

  const statCards = [
    { label: "Total Audience", value: stats?.total ?? total },
    { label: "Consent Granted", value: consentCounts.Granted ?? 0 },
    { label: "Consent Pending", value: consentCounts.Pending ?? 0 },
    { label: "Consent Revoked", value: consentCounts.Revoked ?? 0 },
  ];

  const field = (name, label, type = "text") => (
    <label key={name} style={styles.field}>
      <span>{label}</span>
      <input
        style={styles.input}
        type={type}
        name={name}
        value={form[name] ?? ""}
        onChange={handleFormChange}
        required={name === "name"}
        min={name === "age" ? 0 : undefined}
        max={name === "age" ? 120 : undefined}
      />
    </label>
  );

  const selectField = (name, label, options) => (
    <label key={name} style={styles.field}>
      <span>{label}</span>
      <select
        style={styles.input}
        name={name}
        value={form[name] ?? ""}
        onChange={handleFormChange}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option || "Select"}
          </option>
        ))}
      </select>
    </label>
  );

  const sortableHeader = (label, key) => (
    <th style={styles.th} key={key}>
      <button
        type="button"
        onClick={() => toggleSort(key)}
        style={{
          border: 0,
          background: "transparent",
          fontWeight: 700,
          cursor: "pointer",
          color: "#111827",
        }}
      >
        {label}{" "}
        {sortKey === key
          ? sortDirection === "asc"
            ? "↑"
            : "↓"
          : "↕"}
      </button>
    </th>
  );

  return (
    <div style={styles.page}>
      {/* The main SidebarLayout is provided by App.jsx. */}
      <main style={styles.main}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <div>
            <h1>Audience Database</h1>
            <p>Manage audience members and communication preferences.</p>
          </div>
          <button style={styles.button} onClick={openAddForm}>
            + Add Audience
          </button>
        </header>

        {error && (
          <div
            role="alert"
            style={{
              ...styles.card,
              background: "#fef2f2",
              color: "#b91c1c",
              borderColor: "#fecaca",
              whiteSpace: "pre-line",
              overflowWrap: "anywhere",
            }}
          >
            {error}
            <button
              type="button"
              onClick={() => setError("")}
              style={{ ...styles.secondary, float: "right" }}
            >
              Close
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            style={{
              ...styles.card,
              background: "#f0fdf4",
              color: "#166534",
              borderColor: "#bbf7d0",
            }}
          >
            {success}
            <button
              type="button"
              onClick={() => setSuccess("")}
              style={{ ...styles.secondary, float: "right" }}
            >
              Close
            </button>
          </div>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: 16,
          }}
        >
          {statCards.map((card) => (
            <div key={card.label} style={styles.card}>
              <div style={{ color: "#64748b" }}>{card.label}</div>
              <h2>{card.value}</h2>
            </div>
          ))}
        </section>

        {showForm && (
          <section style={styles.card}>
            <h2>
              {editingId !== null
                ? "Edit Audience Member"
                : "Add Audience Member"}
            </h2>

            <form onSubmit={handleSave}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 16,
                }}
              >
                {field("name", "Full Name")}
                {field("email", "Email", "email")}
                {field("phone", "Phone")}
                {field("age", "Age", "number")}
                {selectField("gender", "Gender", [
                  "", "Female", "Male", "Other", "Prefer not to say",
                ])}
                {field("city", "City")}
                {field("state", "State")}
                {selectField("preferred_language", "Preferred Language", LANGUAGES)}
                {field("occupation", "Occupation")}
                {field("organization_department", "Department")}
                {selectField("preferred_channel", "Preferred Channel", CHANNELS)}
                {selectField("consent_status", "Consent Status", CONSENT_STATUSES)}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button
                  style={styles.button}
                  disabled={saving}
                  type="submit"
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                    ? "Update Member"
                    : "Save Member"}
                </button>

                <button
                  style={styles.secondary}
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section style={styles.card}>
          <h2>Search and Filter</h2>

          <form
            onSubmit={handleSearch}
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <input
              style={{ ...styles.input, flex: "1 1 240px" }}
              placeholder="Search name, email, phone..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <button style={styles.button} type="submit">
              Search
            </button>
            <button
              style={styles.secondary}
              type="button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </form>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 12,
            }}
          >
            <label style={styles.field}>
              City
              <input
                style={styles.input}
                name="city"
                value={filters.city}
                onChange={handleFilterChange}
              />
            </label>

            <label style={styles.field}>
              State
              <input
                style={styles.input}
                name="state"
                value={filters.state}
                onChange={handleFilterChange}
              />
            </label>

            <label style={styles.field}>
              Language
              <select
                style={styles.input}
                name="preferred_language"
                value={filters.preferred_language}
                onChange={handleFilterChange}
              >
                <option value="">All languages</option>
                {LANGUAGES.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>

            <label style={styles.field}>
              Channel
              <select
                style={styles.input}
                name="preferred_channel"
                value={filters.preferred_channel}
                onChange={handleFilterChange}
              >
                <option value="">All channels</option>
                {CHANNELS.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>

            <label style={styles.field}>
              Consent
              <select
                style={styles.input}
                name="consent_status"
                value={filters.consent_status}
                onChange={handleFilterChange}
              >
                <option value="">All statuses</option>
                {CONSENT_STATUSES.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>

            <label style={styles.field}>
              Occupation
              <input
                style={styles.input}
                name="occupation"
                value={filters.occupation}
                onChange={handleFilterChange}
              />
            </label>
          </div>
        </section>

        <section style={styles.card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <h2>Audience Members</h2>
              <p>{total} total member(s)</p>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <label style={styles.secondary}>
                {uploading ? "Uploading..." : "Upload CSV/Excel"}
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleUpload}
                  disabled={uploading}
                  style={{ display: "none" }}
                />
              </label>

              <button
                type="button"
                style={styles.secondary}
                onClick={exportCsv}
              >
                Export CSV
              </button>

              <button
                type="button"
                style={styles.secondary}
                onClick={refreshData}
                disabled={loading}
              >
                Refresh
              </button>
            </div>
          </div>

          <div style={{ overflowX: "auto", width: "100%" }}>
            <table
              className="audience-table"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 950,
                backgroundColor: "#fff",
                color: "#111827",
              }}
            >
              <thead>
                <tr>
                  <th style={styles.th}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAllVisible}
                      aria-label="Select all visible members"
                    />
                  </th>
                  {sortableHeader("ID", "id")}
                  {sortableHeader("Name", "name")}
                  {sortableHeader("Email", "email")}
                  {sortableHeader("Phone", "phone")}
                  {sortableHeader("City", "city")}
                  {sortableHeader("Language", "preferred_language")}
                  {sortableHeader("Channel", "preferred_channel")}
                  {sortableHeader("Consent", "consent_status")}
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td style={styles.td} colSpan={10}>
                      Loading audience members...
                    </td>
                  </tr>
                ) : sortedMembers.length === 0 ? (
                  <tr>
                    <td style={styles.td} colSpan={10}>
                      No audience members found.
                    </td>
                  </tr>
                ) : (
                  sortedMembers.map((member) => (
                    <tr key={member.id}>
                      <td style={styles.td}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(member.id)}
                          onChange={() => toggleMember(member.id)}
                        />
                      </td>
                      <td style={styles.td}>{member.id}</td>
                      <td style={styles.td}>{member.name}</td>
                      <td style={styles.td}>{member.email || "—"}</td>
                      <td style={styles.td}>{member.phone || "—"}</td>
                      <td style={styles.td}>
                        {[member.city, member.state].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td style={styles.td}>{member.preferred_language || "—"}</td>
                      <td style={styles.td}>{member.preferred_channel || "—"}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            padding: "5px 8px",
                            borderRadius: 6,
                            background:
                              member.consent_status === "Granted"
                                ? "#dcfce7"
                                : member.consent_status === "Revoked"
                                ? "#fee2e2"
                                : "#fef3c7",
                            color:
                              member.consent_status === "Granted"
                                ? "#166534"
                                : member.consent_status === "Revoked"
                                ? "#991b1b"
                                : "#92400e",
                          }}
                        >
                          {member.consent_status || "Pending"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            style={styles.secondary}
                            onClick={() => openEditForm(member)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            style={styles.danger}
                            onClick={() => handleDelete(member)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 20,
            }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              Rows per page
              <select
                style={{ ...styles.input, width: 85 }}
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                  setSelectedIds([]);
                }}
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </label>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span>
                Page {totalPages === 0 ? 0 : page} of {totalPages}
              </span>

              <button
                type="button"
                style={styles.secondary}
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>

              <button
                type="button"
                style={styles.secondary}
                disabled={page >= totalPages || totalPages === 0 || loading}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </section>

        <p style={{ color: "#64748b", fontSize: 13 }}>
          Audience data is loaded from your AI PublicConnect backend.
          CSV and XLSX files must contain the columns supported by the backend API.
        </p>
      </main>
    </div>
  );
}
