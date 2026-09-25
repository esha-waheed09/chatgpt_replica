import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import axios from "axios";

const AuthContext = createContext(null);

const API_URL = "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("access_token");

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

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] =
    useState(
      localStorage.getItem(
        "access_token"
      )
    );

  const [user, setUser] = useState(null);
  const [loading, setLoading] =
    useState(true);

  const refreshAccessToken =
    async () => {
      const refreshToken =
        localStorage.getItem(
          "refresh_token"
        );

      if (!refreshToken) {
        return null;
      }

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
            "Refresh succeeded but no access token was returned."
          );
        }

        localStorage.setItem(
          "access_token",
          newAccessToken
        );

        setAccessToken(
          newAccessToken
        );

        return newAccessToken;
      } catch (error) {
        console.error(
          "Token refresh failed:",
          error
        );

        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem(
          "refresh_token"
        );

        setAccessToken(null);
        setUser(null);

        return null;
      }
    };

  useEffect(() => {
    const loadUser = async () => {
      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response =
          await api.get(
            "/auth/me/"
          );

        setUser(
          response.data
        );

        setAccessToken(
          token
        );
      } catch (error) {
        if (
          error?.response?.status ===
          401
        ) {
          const newToken =
            await refreshAccessToken();

          if (newToken) {
            try {
              const response =
                await api.get(
                  "/auth/me/"
                );

              setUser(
                response.data
              );
            } catch (retryError) {
              console.error(
                "Failed to load user after token refresh:",
                retryError
              );
            }
          }
        } else {
          console.error(
            "Failed to load authenticated user:",
            error
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (
    email,
    password
  ) => {
    try {
      const loginResponse =
        await axios.post(
          `${API_URL}/auth/login/`,
          {
            email,
            password,
          }
        );

      const {
        access,
        refresh,
      } = loginResponse.data;

      if (
        !access ||
        !refresh
      ) {
        throw new Error(
          "Login succeeded but the server did not return authentication tokens."
        );
      }

      localStorage.setItem(
        "access_token",
        access
      );

      localStorage.setItem(
        "refresh_token",
        refresh
      );

      setAccessToken(access);

      const userResponse =
        await axios.get(
          `${API_URL}/auth/me/`,
          {
            headers: {
              Authorization:
                `Bearer ${access}`,
            },
          }
        );

      setUser(
        userResponse.data
      );

      return userResponse.data;
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      if (error.response) {
        console.error(
          "STATUS:",
          error.response.status
        );

        console.error(
          "RESPONSE:",
          error.response.data
        );
      }

      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "refresh_token"
    );

    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        user,
        loading,
        login,
        logout,
        refreshAccessToken,
        api,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(
      AuthContext
    );

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}