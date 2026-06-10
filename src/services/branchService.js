import axiosInstance from '../api/axiosInstance';

export const getBranches = async () => {
  const res = await axiosInstance.get('/branches');
  return res.data;
};

export const createBranch = async (branchData) => {
  const res = await axiosInstance.post('/branches', branchData);
  return res.data;
};

export const updateBranch = async (branchId, branchData) => {
  const res = await axiosInstance.put(`/branches/${branchId}`, branchData);
  return res.data;
};

export const deleteBranch = async (branchId) => {
  const res = await axiosInstance.delete(`/branches/${branchId}`);
  return res.data;
};
