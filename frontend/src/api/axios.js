import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized - redirect to login (except for auth endpoints)
    if (error.response?.status === 401) {
      const isAuthEndpoint =
        error.config?.url?.includes("/api/auth/login") ||
        error.config?.url?.includes("/api/auth/register");

      if (!isAuthEndpoint) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }

    // Handle 403 Forbidden - check for email verification requirement
    if (error.response?.status === 403) {
      const responseData = error.response?.data;

      // If error is specifically about email verification, redirect to verify page
      if (
        responseData?.emailVerified === false ||
        responseData?.error === "Email verification required"
      ) {
        // Only redirect if not already on verify-email page
        if (!window.location.pathname.includes("/verify-email")) {
          window.location.href = "/verify-email";
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
