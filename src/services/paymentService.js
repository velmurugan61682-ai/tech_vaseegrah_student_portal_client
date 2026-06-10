import axiosInstance from '../api/axiosInstance';

export const getPayments = async (params = {}) => {
  const res = await axiosInstance.get('/payments', { params });
  return res.data;
};

export const getStudentPayments = async () => {
  const res = await axiosInstance.get('/payments/student');
  return res.data;
};

export const createPayment = async (formData) => {
  const res = await axiosInstance.post('/payments', formData);
  return res.data;
};

export const updatePayment = async (paymentId, formData) => {
  const res = await axiosInstance.put(`/payments/${paymentId}`, formData);
  return res.data;
};

export const deletePayment = async (paymentId) => {
  const res = await axiosInstance.delete(`/payments/${paymentId}`);
  return res.data;
};

export const updatePaymentStatus = async (paymentId, status) => {
  const res = await axiosInstance.patch(`/payments/status/${paymentId}`, { status });
  return res.data;
};

export const getPaymentAnalytics = async () => {
  const res = await axiosInstance.get('/payments/analytics');
  return res.data;
};

export const getInternships = async () => {
  const res = await axiosInstance.get('/payments/internships');
  return res.data;
};
