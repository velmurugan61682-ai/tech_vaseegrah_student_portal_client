import axiosInstance from '../api/axiosInstance';

export const getReceipts = async (params = {}) => {
  const res = await axiosInstance.get('/receipts', { params });
  return res.data;
};

export const getStudentReceipts = async () => {
  const res = await axiosInstance.get('/receipts/student');
  return res.data;
};

export const getReceiptDetails = async (receiptId) => {
  const res = await axiosInstance.get(`/receipts/${receiptId}`);
  return res.data;
};

export const updateReceipt = async (receiptId, formData) => {
  const res = await axiosInstance.put(`/receipts/${receiptId}`, formData);
  return res.data;
};

export const deleteReceipt = async (receiptId) => {
  const res = await axiosInstance.delete(`/receipts/${receiptId}`);
  return res.data;
};

export const generateReceiptPDF = async (receiptId) => {
  const res = await axiosInstance.post(`/receipts/${receiptId}/pdf`);
  return res.data;
};

export const sendReceiptEmail = async (receiptId, emailData) => {
  const res = await axiosInstance.post(`/receipts/${receiptId}/send`, emailData);
  return res.data;
};
