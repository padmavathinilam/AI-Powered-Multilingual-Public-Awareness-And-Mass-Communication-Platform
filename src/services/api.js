
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the access token to API requests.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired or invalid authentication.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";
    const isLoginRequest = requestUrl.includes("/auth/login");

    if (status === 401 && !isLoginRequest) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// Task 7: Generate campaign content.
// Confirm the route against your backend before using it.
export const generateCampaignContent = async (payload) => {
  const response = await api.post("/api/ai/generate", payload);
  return response.data;
};

// Task 10: Analyze campaign tone, sentiment, readability, and clarity.
export const analyzeCampaignTone = async (
  content,
  expectedTone = "Informative"
) => {
  const response = await api.post("/api/ai/analyze-tone", {
    content,
    expected_tone: expectedTone,
  });

  return response.data;
};

// Task 10: Improve campaign content using the selected tone.
export const improveCampaignTone = async (
  content,
  targetTone = "Friendly"
) => {
  const response = await api.post("/api/ai/improvetone", {
    content,
    target_tone: targetTone,
  });

  return response.data;
};

// Task 11: AI Quality Review & Compliance Validation
export const reviewCampaignContent = async (payload) => {
  const response = await api.post("/ai/review", payload);
  return response.data;
};

// Task 12: Run the complete AI content pipeline
export const runCampaignContentPipeline = async (
  campaignId,
  payload = {}
) => {
  const response = await api.post(
    `/campaigns/${campaignId}/content/pipeline`,
    payload
  );

  return response.data;
};

// Task 12: Check AI service health and usage
// Confirm this route against your backend before using it.
export const getAIServiceHealth = async () => {
  const response = await api.get("/ai/health");
  return response.data;
};


export default api;
