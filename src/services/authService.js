import axiosInstance from '../api/axiosInstance';

export const loginAdmin = async (email, password) => {
  const res = await axiosInstance.post('/auth/admin/login', { email, password });
  return res.data;
};

export const registerAdmin = async (userData) => {
  const res = await axiosInstance.post('/auth/admin/register', userData);
  return res.data;
};

export const loginStudent = async (email, password) => {
  const res = await axiosInstance.post('/auth/student/login', { email, password });
  return res.data;
};

export const registerStudent = async (userData) => {
  const res = await axiosInstance.post('/auth/student/register', userData);
  return res.data;
};

export const logoutUser = async () => {
  const res = await axiosInstance.post('/auth/logout');
  return res.data;
};

export const getMe = async () => {
  const res = await axiosInstance.get('/auth/me');
  return res.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const res = await axiosInstance.put('/auth/change-password', { currentPassword, newPassword });
  return res.data;
};
