import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export const instance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

instance.interceptors.request.use(
  //each user has many permisions, attach the token to the header so that the server can check if the user has the right to do that.
  (config) => {
    const token = Cookies.get("access_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

//login
export const loginacc = async (data: { [key: string]: string }) => {
  return axios.post(`${apiBaseUrl}/login`, data);
};

export const fetchMe = async () => {
  return instance.get(`${apiBaseUrl}/me`);
};

export const refreshAccessToken = async (data: { [key: string]: any }) => {
  return instance.post(`/refresh_token`, data);
};

export const change_password = async (data: { [key: string]: any }) => {
  return instance.put("/change_password", data);
};

export const sendActiveUser = async (email: string) => {
  return instance.put("/send_active_user", {
    email: email,
  });
};

export const chat = async (
  title: string,
  chatid: string,
  question: string,
  answer: string,
  file: string | { [key: string]: any }[] | undefined,
) => {
  return instance.post(`${apiBaseUrl}/chat`, {
    talk_title: title,
    detail: {
      chat_id: chatid,
      question: question,
      answer: answer,
      ref_file: JSON.stringify(file ?? []), // fallback nếu undefined
    },
  });
};

export const chatHistory = async (search: string) => {
  return instance.get(`${apiBaseUrl}/chat?search=${search}`);
};

export const chatId = async (id: string) => {
  return instance.get(`${apiBaseUrl}/chat/${id}`);
};

export const deleteChats = async (chatIds: string[]) => {
  return instance.delete(`${apiBaseUrl}/chat`, {
    data: {
      chat_ids: chatIds,
    },
  });
};

export const getUser = async (page: number, limit: number, search: string) => {
  try {
    const response = await instance.get(
      `${apiBaseUrl}/users?page=${page}&limit=${limit}&search=${search}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};

export const registUser = async (data: { [key: string]: any }) => {
  return instance.post(`${apiBaseUrl}/users`, data);
};

export const deleteUser = async (userIds: string[]) => {
  return instance.delete(`${apiBaseUrl}/users`, {
    data: {
      user_ids: userIds,
    },
  });
};

export const updateUser = async (id: string, data: { [key: string]: any }) => {
  return instance.put(`${apiBaseUrl}/users/${id}`, data);
};

export const getUserId = async (id: string) => {
  return instance.get(`${apiBaseUrl}/users/${id}`);
};

export const checkContinueGoogle = async (data: { [key: string]: any }) => {
  return axios.post(`${apiBaseUrl}/check_continue_google`, data);
};

export const continueGoogle = async (data: { [key: string]: any }) => {
  return axios.post(`${apiBaseUrl}/continue_google`, data);
};

export const updatePassWord = async (data: { [key: string]: any }) => {
  return instance.put(`${apiBaseUrl}/change_password`, data);
};

export const getFile = async (
  page: number,
  limit: number,
  valueSearch: string,
) => {
  return instance.get(
    `${apiBaseUrl}/upload?page=${page}&limit=${limit}&search=${valueSearch}`,
  );
};

export const uploadFile = async (data: { [key: string]: any }) => {
  return instance.post("/upload", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const deleteFile = async (id: string[]) => {
  return instance.delete("/upload", {
    data: {
      file_ids: id,
    },
  });
};

export const deleteFolder = async (id: string[]) => {
  return instance.delete("/folder", {
    data: {
      folder_ids: id,
    },
  });
};

export const sendResetLink = async (data: { [key: string]: any }) => {
  return axios.post(`${apiBaseUrl}/send_reset_link`, data);
};

export const setResetLink = async (key: string) => {
  return axios.get(`${apiBaseUrl}/users/reset/?q=${key}`);
};

export const changeForgottenPass = async (
  pass: string,
  confirm: string,
  id: string,
) => {
  return axios.put(`${apiBaseUrl}/change_forgotten_password`, {
    password: pass,
    password_confirm: confirm,
    token: id,
  });
};

export const getFolderAndFile = async (key: string) => {
  if (key != "") {
    return instance.get(`${apiBaseUrl}/folder/my?folder_id=${key}`);
  } else {
    return instance.get(`${apiBaseUrl}/folder/my`);
  }
};

export const createFolder = async (name: string, parent_id: string | null) => {
  return instance.post(`${apiBaseUrl}/folder`, {
    name: name,
    parent_id: parent_id === "" ? null : parent_id,
  });
};

export const sendAccessControl = async (data: { [key: string]: any }) => {
  return instance.post(`${apiBaseUrl}/access_control`, data);
};

export const getDepartment = async (
  page: number,
  limit: number,
  search: string,
) => {
  try {
    const response = await instance.get(
      `${apiBaseUrl}/departments?page=${page}&limit=${limit}&search=${search}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching department:", error);
    throw error;
  }
};

export const getSharedFileFolder = async (folder_id: string) => {
  if (folder_id != "") {
    return instance.get(`${apiBaseUrl}/folder/shared?folder_id=${folder_id}`);
  } else {
    return instance.get(`${apiBaseUrl}/folder/shared`);
  }
};

export const getAllFileFolder = async () => {
  return instance.get(`${apiBaseUrl}/folder/all`);
};

export const getAccessControl = async (file_id: string, folder_id: string) => {
  if (file_id != "") {
    return instance.get(`${apiBaseUrl}/access_control?file_id=${file_id}`);
  } else if (folder_id != "") {
    return instance.get(`${apiBaseUrl}/access_control?folder_id=${folder_id}`);
  }
};

export const deleteAccessControl = async (access_control_id: string) => {
  return instance.delete(`${apiBaseUrl}/access_control/${access_control_id}`);
};

export const editAccessControl = async (data: { [key: string]: any }) => {
  return instance.put(`${apiBaseUrl}/access_control?`, data);
};

//department
export const getAllDepart = async () => {
  return instance.get(`${apiBaseUrl}/departments`);
};

export const createDepart = async (data: { [key: string]: any }) => {
  return instance.post(`${apiBaseUrl}/departments`, data);
};

export const deleteDepart = async (id: string) => {
  return instance.delete(`${apiBaseUrl}/departments/${id}`);
};
