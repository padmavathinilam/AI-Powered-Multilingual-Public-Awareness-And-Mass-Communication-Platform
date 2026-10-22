
import { useEffect, useState } from "react";
import api from "../services/api";

const languages = [
  "English",
  "Telugu",
  "Hindi",
  "Tamil",
  "Kannada",
  "Malayalam",
];

const initialForm = {
  campaign_id: "",
  template_id: "",
  audience_member_id: "",
  language: "English",
  content: "",
  channel: "Website",
  status: "pending",
  scheduled_at: "",
};

function Messages() {
  const [campaigns, setCampaigns] = useState([]);
  const [audienceMembers, setAudienceMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [campaignResponse, messageResponse, audienceResponse] =
        await Promise.all([
          api.get("/api/campaigns/"),
          api.get("/api/messages/"),
          api.get("/api/audience/"),
        ]);

      setCampaigns(campaignResponse.data);
      setMessages(messageResponse.data);
      setAudienceMembers(audienceResponse.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load data. Please check whether the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.campaign_id) {
      setError("Please select a campaign.");
      return;
    }

    if (!form.audience_member_id) {
      setError("Please select an audience member.");
      return;
    }

    if (!form.content.trim()) {
      setError("Please enter the message content.");
      return;
    }

    const payload = {
      campaign_id: Number(form.campaign_id),
      audience_member_id: Number(form.audience_member_id),
      template_id: form.template_id
        ? Number(form.template_id)
        : null,
      language: form.language,
      content: form.content.trim(),
      channel: form.channel,
      status: form.status,
      scheduled_at: form.scheduled_at
        ? new Date(form.scheduled_at).toISOString()
        : null,
    };

    setSaving(true);

    try {
      await api.post("/api/messages/", payload);

      setSuccess("Message created successfully!");
      setForm({ ...initialForm });

      await loadData();
    } catch (err) {
      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : detail
            ? JSON.stringify(detail)
            : "Could not create the message. Check the selected campaign, audience member, and template IDs."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="messages-page">
      <header className="messages-header">
        <div>
          <p className="messages-eyebrow">AI PUBLICCONNECT</p>
          <h1>Multilingual Message Management</h1>
          <p>
            Create and manage public awareness messages in different languages.
          </p>
        </div>

        <button
          type="button"
          className="messages-refresh"
          onClick={loadData}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh Messages"}
        </button>
      </header>

      {error && (
        <div className="messages-alert error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="messages-alert success" role="status">
          {success}
        </div>
      )}

      <section className="messages-card">
        <h2>Create a Message</h2>

        <p className="messages-help">
          Choose a campaign and audience member, then prepare your message.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="messages-form-grid">
            <label>
              Campaign <span>*</span>

              <select
                name="campaign_id"
                value={form.campaign_id}
                onChange={handleChange}
                required
              >
                <option value="">Select a campaign</option>

                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name} (ID: {campaign.id})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Audience Member <span>*</span>

              <select
                name="audience_member_id"
                value={form.audience_member_id}
                onChange={handleChange}
                required
              >
                <option value="">Select an audience member</option>

                {audienceMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} — ID: {member.id}
                    {member.preferred_language
                      ? ` (${member.preferred_language})`
                      : ""}
                  </option>
                ))}
              </select>

              {audienceMembers.length === 0 && !loading && (
                <span className="messages-field-note">
                  No audience members found. Add an audience member first.
                </span>
              )}
            </label>

            <label>
              Language <span>*</span>

              <select
                name="language"
                value={form.language}
                onChange={handleChange}
                required
              >
                {languages.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Communication Channel <span>*</span>

              <select
                name="channel"
                value={form.channel}
                onChange={handleChange}
                required
              >
                <option value="Website">Website</option>
                <option value="Email">Email</option>
                <option value="SMS">SMS</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Mobile Notification">
                  Mobile Notification
                </option>
              </select>
            </label>

            <label>
              Template ID (optional)

              <input
                type="number"
                name="template_id"
                min="1"
                value={form.template_id}
                onChange={handleChange}
                placeholder="Enter an existing template ID"
              />
            </label>

            <label>
              Status

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="pending">Pending</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </label>

            <label className="messages-full-width">
              Message Content <span>*</span>

              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder="Enter your public awareness message..."
                rows={5}
                required
              />

              <span className="messages-field-note">
                Write the message in the language selected above.
              </span>
            </label>

            <label className="messages-full-width">
              Schedule Date and Time (optional)

              <input
                type="datetime-local"
                name="scheduled_at"
                value={form.scheduled_at}
                onChange={handleChange}
              />
            </label>
          </div>

          <button
            type="submit"
            className="messages-submit"
            disabled={
              saving ||
              loading ||
              campaigns.length === 0 ||
              audienceMembers.length === 0
            }
          >
            {saving ? "Saving..." : "Create Message"}
          </button>
        </form>
      </section>

      <section className="messages-card">
        <div className="messages-list-heading">
          <div>
            <h2>Saved Messages</h2>

            <p className="messages-help">
              Messages currently stored in your database.
            </p>
          </div>

          <span className="messages-count">
            {messages.length}{" "}
            {messages.length === 1 ? "message" : "messages"}
          </span>
        </div>

        {loading ? (
          <p>Loading messages...</p>
        ) : messages.length === 0 ? (
          <p>No messages found. Create your first message above.</p>
        ) : (
          <div className="messages-table-wrapper">
            <table className="messages-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Campaign</th>
                  <th>Language</th>
                  <th>Message</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Scheduled At</th>
                </tr>
              </thead>

              <tbody>
                {messages.map((message) => (
                  <tr key={message.id}>
                    <td>{message.id}</td>
                    <td>{message.campaign_id}</td>
                    <td>{message.language}</td>

                    <td className="messages-content-cell">
                      {message.content}
                    </td>

                    <td>{message.channel}</td>

                    <td>
                      <span className="messages-status">
                        {message.status}
                      </span>
                    </td>

                    <td>
                      {message.scheduled_at
                        ? new Date(
                            message.scheduled_at
                          ).toLocaleString()
                        : "Not scheduled"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default Messages;
