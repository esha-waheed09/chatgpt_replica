import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_URL,
});

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeToTokenRefresh = (
  callback
) => {
  refreshSubscribers.push(callback);
};

const notifyTokenRefresh = (
  newToken
) => {
  refreshSubscribers.forEach(
    (callback) => callback(newToken)
  );

  refreshSubscribers = [];
};

const clearAuthentication = () => {
  localStorage.removeItem(
    "access_token"
  );

  localStorage.removeItem(
    "refresh_token"
  );
};

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        "access_token"
      );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error) => {
    const originalRequest =
      error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest?._retry
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshToken =
      localStorage.getItem(
        "refresh_token"
      );

    if (!refreshToken) {
      clearAuthentication();

      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise(
        (resolve, reject) => {
          subscribeToTokenRefresh(
            (newToken) => {
              if (!newToken) {
                reject(error);
                return;
              }

              originalRequest.headers.Authorization =
                `Bearer ${newToken}`;

              resolve(
                api(originalRequest)
              );
            }
          );
        }
      );
    }

    isRefreshing = true;

    try {
      const response =
        await axios.post(
          `${API_URL}/auth/token/refresh/`,
          {
            refresh: refreshToken,
          }
        );

      const newAccessToken =
        response.data.access;

      if (!newAccessToken) {
        throw new Error(
          "No access token returned from refresh endpoint."
        );
      }

      localStorage.setItem(
        "access_token",
        newAccessToken
      );

      notifyTokenRefresh(
        newAccessToken
      );

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return api(
        originalRequest
      );
    } catch (refreshError) {
      clearAuthentication();

      notifyTokenRefresh(null);

      return Promise.reject(
        refreshError
      );
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;