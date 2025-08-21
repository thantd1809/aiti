"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { fetchMe, refreshAccessToken } from "./ApiService";
import { MyInfoProps } from "./types/UserDetail";

interface UserContextType {
  user: MyInfoProps;
  setUser: (user: MyInfoProps) => void;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(undefined);
  const [isUserLoaded, setIsUserLoaded] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetchMe();
      setUser(response?.data?.data);
      setIsUserLoaded(true);
    } catch (error) {
      setUser(null);
      logout();
    }
  }, []);

  useEffect(() => {
    const accessToken = Cookies.get("access_token");
    const refreshToken = Cookies.get("refresh_token");

    if (accessToken && refreshToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      fetchUser().then((r) => r);
    } else if (refreshToken) {
      const refreshAccessTokenAndFetchUser = async () => {
        try {
          const response = await refreshAccessToken({
            refresh_token: refreshToken,
          });
          const {
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
          } = response.data?.data;

          Cookies.set("access_token", newAccessToken, { expires: 1 });
          Cookies.set("refresh_token", newRefreshToken, { expires: 7 });

          axios.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${newAccessToken}`;

          await fetchUser();
        } catch (refreshError) {
          setUser(null);
        }
      };

      refreshAccessTokenAndFetchUser().then((r) => r);
    } else {
      setUser(null);
    }
  }, [fetchUser]);

  const login = (accessToken: string, refreshToken: string) => {
    Cookies.set("access_token", accessToken, { expires: 1 });
    Cookies.set("refresh_token", refreshToken, { expires: 7 });
    axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    fetchUser().then((r) => r);
  };

  const logout = () => {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    setUser(null);
    delete axios.defaults.headers.common["Authorization"];
    window.location.href = "/login";
  };

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = Cookies.get("refresh_token");

        if (refreshToken) {
          try {
            const response = await refreshAccessToken({
              refresh_token: refreshToken,
            });
            const {
              access_token: newAccessToken,
              refresh_token: newRefreshToken,
            } = response.data?.data;

            // Update cookies
            Cookies.set("access_token", newAccessToken, { expires: 1 });
            Cookies.set("refresh_token", newRefreshToken, { expires: 7 });

            // Update axios headers
            axios.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${newAccessToken}`;
            originalRequest.headers[
              "Authorization"
            ] = `Bearer ${newAccessToken}`;

            return axios(originalRequest);
          } catch (refreshError) {
            console.error("Token refresh failed", refreshError);
            logout();
          }
        } else {
          logout();
        }
      }

      return Promise.reject(error);
    },
  );

  const contextValue = {
    user,
    setUser,
    login,
    logout,
  };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
