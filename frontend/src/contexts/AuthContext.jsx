import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, userPreferencesAPI } from "../api/endpoints";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await authAPI.getCurrentUser();
          setUser(response.data);
        } catch (error) {
          console.error("Auth check failed:", error);
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token, isFirstLogin, ...userData } = response.data;

      localStorage.setItem("token", token);
      setUser(userData);

      // Redirect to welcome screen for first-time users
      if (isFirstLogin) {
        navigate("/welcome");
      } else {
        navigate("/dashboard");
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Login failed",
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token, ...userInfo } = response.data;

      localStorage.setItem("token", token);
      setUser(userInfo);

      // Redirect to welcome screen for new users
      navigate("/welcome");

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.response?.data?.errors ||
          "Registration failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  const updateUser = async (userData) => {
    try {
      const response = await userPreferencesAPI.updateUser(userData);
      setUser(response.data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to update user information",
      };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      await authAPI.changePassword(passwordData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to change password",
      };
    }
  };

  const deleteAccount = async (password) => {
    try {
      await userPreferencesAPI.deleteAccount(password);
      // Log out the user after successful deletion
      localStorage.removeItem("token");
      setUser(null);
      navigate("/login");
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to delete account",
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    changePassword,
    deleteAccount,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
