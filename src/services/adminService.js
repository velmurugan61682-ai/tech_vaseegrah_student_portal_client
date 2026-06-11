import axiosInstance from '../api/axiosInstance';

export const getDashboardStats = async () => {
  const res = await axiosInstance.get('/dashboard');
  return res.data;
};

export const getStudentsDirectory = async (params = {}) => {
  const res = await axiosInstance.get('/students', { params });
  return res.data;
};

export const addStudent = async (formData) => {
  const res = await axiosInstance.post('/students', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
};

export const updateStudent = async (studentId, formData) => {
  const res = await axiosInstance.put(`/students/${studentId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
};

export const deleteStudent = async (studentId) => {
  const res = await axiosInstance.delete(`/students/${studentId}`);
  return res.data;
};
