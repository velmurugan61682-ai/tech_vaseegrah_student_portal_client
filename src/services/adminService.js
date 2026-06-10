import axiosInstance from '../api/axiosInstance';

export const getDashboardStats = async () => {
  const res = await axiosInstance.get('/admin/dashboard');
  return res.data;
};

export const getStudentsDirectory = async (params = {}) => {
  const res = await axiosInstance.get('/admin/students', { params });
  return res.data;
};

export const addStudent = async (formData) => {
  const res = await axiosInstance.post('/admin/students', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
};

export const updateStudent = async (studentId, formData) => {
  const res = await axiosInstance.put(`/admin/students/${studentId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
};

export const deleteStudent = async (studentId) => {
  const res = await axiosInstance.delete(`/admin/students/${studentId}`);
  return res.data;
};
