import axiosInstance from '../api/axiosInstance';

export const getAllAttendance = async (date) => {
  const res = await axiosInstance.get(`/attendance/all?date=${date || ''}`);
  return res.data;
};

export const updateAttendance = async (attendanceData) => {
  const res = await axiosInstance.put('/attendance/update', attendanceData);
  return res.data;
};

export const markAttendance = async (attendanceData) => {
  const res = await axiosInstance.post('/attendance/mark', attendanceData);
  return res.data;
};

export const getMyAttendance = async () => {
  const res = await axiosInstance.get('/attendance/my');
  return res.data;
};

export const getAttendanceReport = async () => {
  const res = await axiosInstance.get('/attendance/report');
  return res.data;
};

export const getStudentAttendance = async (studentId) => {
  const res = await axiosInstance.get(`/attendance/student/${studentId}`);
  return res.data;
};

export const downloadAttendanceCSV = () => {
  // Returns raw CSV data
  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';
  window.open(`${API_BASE_URL}/api/attendance/export?token=${token}`, '_blank');
};

export const getAttendanceByDate = async (date, branchId = '') => {
  const params = branchId ? { branchId } : {};
  const res = await axiosInstance.get(`/attendance/date/${date}`, { params });
  return res.data;
};
