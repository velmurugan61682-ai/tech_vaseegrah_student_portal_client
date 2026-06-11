import axiosInstance from '../api/axiosInstance';

export const getLeaves = async (params = {}) => {
  const res = await axiosInstance.get('/leaves', { params });
  return res.data;
};

export const getStudentLeaves = async () => {
  const res = await axiosInstance.get('/leaves/student');
  return res.data;
};

export const applyLeave = async (leaveData) => {
  const res = await axiosInstance.post('/leaves', leaveData);
  return res.data;
};

export const reviewLeave = async (leaveId, reviewData) => {
  const res = await axiosInstance.put(`/leaves/${leaveId}`, reviewData);
  return res.data;
};
