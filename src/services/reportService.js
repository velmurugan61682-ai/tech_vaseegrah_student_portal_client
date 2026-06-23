import axiosInstance from '../api/axiosInstance';

export const getReportsHistory = async () => {
  const res = await axiosInstance.get('/reports');
  return res.data;
};

export const saveReportLog = async (reportData) => {
  const res = await axiosInstance.post('/reports', reportData);
  return res.data;
};

export const getBranchWiseAttendanceReport = async () => {
  const res = await axiosInstance.get('/reports/branch-wise');
  return res.data;
};
