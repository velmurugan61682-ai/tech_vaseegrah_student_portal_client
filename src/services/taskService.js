import axiosInstance from '../api/axiosInstance';

export const getPerformanceAnalytics = async () => {
  const res = await axiosInstance.get('/tasks/performance');
  return res.data;
};

export const getMyTasks = async () => {
  const res = await axiosInstance.get('/tasks/my');
  return res.data;
};

export const getStudentSubmissions = async (studentId) => {
  const res = await axiosInstance.get(`/tasks/student/${studentId}/submissions`);
  return res.data;
};

export const getTaskSubmissions = async (taskId) => {
  const res = await axiosInstance.get(`/tasks/${taskId}/submissions`);
  return res.data;
};

export const createTask = async (taskData) => {
  const res = await axiosInstance.post('/tasks', taskData);
  return res.data;
};

export const getAllTasks = async (params = {}) => {
  const res = await axiosInstance.get('/tasks', { params });
  return res.data;
};

export const submitTaskSolution = async (taskId, formData) => {
  const res = await axiosInstance.put(`/tasks/${taskId}/submit`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
};

export const reviewTaskSubmission = async (taskId, reviewData) => {
  const res = await axiosInstance.put(`/tasks/${taskId}/review`, reviewData);
  return res.data;
};

export const deleteTask = async (taskId) => {
  const res = await axiosInstance.delete(`/tasks/${taskId}`);
  return res.data;
};
