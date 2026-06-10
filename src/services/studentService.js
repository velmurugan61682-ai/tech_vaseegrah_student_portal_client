import axiosInstance from '../api/axiosInstance';

export const getStudentDashboard = async () => {
  const res = await axiosInstance.get('/student/dashboard');
  return res.data;
};

export const getStudentProfile = async () => {
  const res = await axiosInstance.get('/student/profile');
  return res.data;
};

export const updateStudentProfile = async (formData) => {
  const isForm = formData instanceof FormData;
  const res = await axiosInstance.put('/student/profile', formData, {
    headers: {
      'Content-Type': isForm ? 'multipart/form-data' : 'application/json'
    }
  });
  return res.data;
};
