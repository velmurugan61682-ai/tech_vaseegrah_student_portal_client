import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

export default function AdminTasks() {
  const { apiCall } = useAuth();
  
  const [tasks, setTasks] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State for creating task
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: 'all', // all / course / student
    course: 'MERN Stack', // default course
    studentId: '',
    dueDate: '',
    priority: 'Medium'
  });
  const [creating, setCreating] = useState(false);

  // Edit Task State
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    assignedTo: 'all',
    course: 'MERN Stack',
    studentId: '',
    dueDate: '',
    priority: 'Medium'
  });

  // Selected Task Submissions
  const [selectedTask, setSelectedTask] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [subsLoading, setSubsLoading] = useState(false);

  // Reviewing a submission
  const [reviewingSub, setReviewingSub] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const tasksRes = await apiCall('/tasks');
      const studentsRes = await apiCall('/admin/students');
      
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || tasksData.data || []);
      }
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData.students || studentsData.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleSelectTask = async (task) => {
    setSelectedTask(task);
    setIsEditing(false);
    setReviewingSub(null);
    try {
      setSubsLoading(true);
      const res = await apiCall(`/tasks/${task._id}/submissions`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || data.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubsLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      
      const payload = {
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        priority: formData.priority,
        assignmentType: formData.assignedTo
      };

      if (formData.assignedTo === 'course') {
        payload.course = formData.course;
      } else if (formData.assignedTo === 'student') {
        payload.assignedTo = [formData.studentId];
      }

      const res = await apiCall('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Task created and assigned successfully!');
        setShowCreateForm(false);
        setFormData({
          title: '',
          description: '',
          assignedTo: 'all',
          course: 'MERN Stack',
          studentId: '',
          dueDate: '',
          priority: 'Medium'
        });
        fetchInitialData();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to create task');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task and all student submissions?')) return;
    try {
      const res = await apiCall(`/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Task deleted');
        setSelectedTask(null);
        fetchInitialData();
      }
    } catch (error) {
      alert('Delete error: ' + error.message);
    }
  };

  const handleStartEdit = (task) => {
    setIsEditing(true);
    setEditFormData({
      title: task.title || '',
      description: task.description || '',
      assignedTo: task.assignmentType || 'all',
      course: task.course || 'MERN Stack',
      studentId: task.assignedTo && task.assignedTo.length > 0 ? task.assignedTo[0] : '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      priority: task.priority || 'Medium'
    });
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);

      const payload = {
        title: editFormData.title,
        description: editFormData.description,
        dueDate: editFormData.dueDate,
        priority: editFormData.priority,
        assignmentType: editFormData.assignedTo
      };

      if (editFormData.assignedTo === 'course') {
        payload.course = editFormData.course;
      } else if (editFormData.assignedTo === 'student') {
        payload.assignedTo = [editFormData.studentId];
      }

      const res = await apiCall(`/tasks/${selectedTask._id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Task updated successfully!');
        setIsEditing(false);
        const updatedTaskRes = await apiCall('/tasks');
        if (updatedTaskRes.ok) {
          const tasksData = await updatedTaskRes.json();
          const list = tasksData.tasks || tasksData.data || [];
          setTasks(list);
          const freshTask = list.find(t => t._id === selectedTask._id);
          if (freshTask) setSelectedTask(freshTask);
        }
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to update task');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenReview = (submission) => {
    setReviewingSub(submission);
    setRejectionReason(submission.adminFeedback || '');
  };

  const handleApprove = async (sub) => {
    try {
      setSavingReview(true);
      const studentId = sub.studentId?._id || sub.studentId;
      const res = await apiCall(`/tasks/${selectedTask._id}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ studentId })
      });

      if (res.ok) {
        alert('Submission approved successfully!');
        setReviewingSub(null);
        if (selectedTask) handleSelectTask(selectedTask);
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to approve submission');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSavingReview(false);
    }
  };

  const handleReject = async (sub, reason) => {
    try {
      setSavingReview(true);
      const studentId = sub.studentId?._id || sub.studentId;
      const res = await apiCall(`/tasks/${selectedTask._id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ studentId, reason })
      });

      if (res.ok) {
        alert('Submission rejected successfully!');
        setReviewingSub(null);
        if (selectedTask) handleSelectTask(selectedTask);
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to reject submission');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSavingReview(false);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Task Scheduler</h1>
          <p style={{ color: 'var(--text-muted)' }}>Publish daily intern objectives and evaluate solutions.</p>
        </div>

        <button 
          onClick={() => setShowCreateForm(!showCreateForm)} 
          className="btn btn-primary"
        >
          {showCreateForm ? 'View Active Tasks' : 'Create Daily Task'}
        </button>
      </div>

      {showCreateForm ? (
        /* Create Task Form */
        <div className="glass-card fade-in" style={{ maxWidth: '700px' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>Schedule New Task</h2>
          
          <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div className="form-group">
              <label className="form-label">Task Title</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. Implement JWT authentication flow"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Task Instructions / Description</label>
              <textarea 
                className="form-control" 
                rows="5"
                placeholder="Describe objective constraints, expected outputs, references..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Priority Level</label>
                <select 
                  className="form-control"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Assign To</label>
              <select 
                className="form-control"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              >
                <option value="all">All Registered Students</option>
                <option value="course">Entire Course Track</option>
                <option value="student">Specific Student</option>
              </select>
            </div>

            {formData.assignedTo === 'course' && (
              <div className="form-group fade-in">
                <label className="form-label">Select Course</label>
                <select 
                  className="form-control"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                >
                  <option value="Python">Python</option>
                  <option value="MERN Stack">MERN Stack</option>
                  <option value="AI & ML">AI & ML</option>
                </select>
              </div>
            )}

            {formData.assignedTo === 'student' && (
              <div className="form-group fade-in">
                <label className="form-label">Select Student</label>
                <select 
                  className="form-control"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  required
                >
                  <option value="">-- Choose student --</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.course})</option>
                  ))}
                </select>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px', height: '46px' }} disabled={creating}>
              {creating ? 'Publishing...' : 'Publish Task'}
            </button>
          </form>
        </div>
      ) : (
        /* Active Tasks Workspace */
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '30px', alignItems: 'start' }}>
          
          {/* Active Tasks Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }}>Published Objectives</h2>
            
            {loading ? (
              <p style={{ color: 'var(--text-muted)' }}>Loading objectives...</p>
            ) : tasks.length === 0 ? (
              <div className="glass-card">
                <p style={{ color: 'var(--text-muted)' }}>No tasks found. Create one using the button above.</p>
              </div>
            ) : (
              tasks.map(task => (
                <div 
                  key={task._id} 
                  className="glass-card"
                  onClick={() => handleSelectTask(task)}
                  style={{
                    cursor: 'pointer',
                    borderLeft: selectedTask?._id === task._id ? '4px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                    background: selectedTask?._id === task._id ? 'var(--bg-tertiary)' : 'var(--glass-bg)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                    <span className={`badge ${
                      task.priority === 'High' ? 'badge-danger' : task.priority === 'Medium' ? 'badge-warning' : 'badge-info'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>{task.title}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)', textTransform: 'capitalize' }}>
                    Scope: {task.assignmentType} {task.assignmentType === 'course' ? `(${task.course})` : ''}
                  </span>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed var(--glass-border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Submissions: <strong>{task.submissionCount || 0}</strong></span>
                    <span>Approved: <strong style={{ color: 'var(--color-success)' }}>{task.approvedCount || 0}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Submissions & Details Panel */}
          <div className="glass-card" style={{ minHeight: '400px' }}>
            {selectedTask ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                
                {isEditing ? (
                  /* Edit Task Form */
                  <div className="fade-in">
                    <h2 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>Edit Task Objectives</h2>
                    <form onSubmit={handleUpdateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      
                      <div className="form-group">
                        <label className="form-label">Task Title</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={editFormData.title}
                          onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Instructions / Description</label>
                        <textarea 
                          className="form-control" 
                          rows="4"
                          value={editFormData.description}
                          onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                          required
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="form-group">
                          <label className="form-label">Due Date</label>
                          <input 
                            type="date" 
                            className="form-control" 
                            value={editFormData.dueDate}
                            onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Priority Level</label>
                          <select 
                            className="form-control"
                            value={editFormData.priority}
                            onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Assign To</label>
                        <select 
                          className="form-control"
                          value={editFormData.assignedTo}
                          onChange={(e) => setEditFormData({ ...editFormData, assignedTo: e.target.value })}
                        >
                          <option value="all">All Registered Students</option>
                          <option value="course">Entire Course Track</option>
                          <option value="student">Specific Student</option>
                        </select>
                      </div>

                      {editFormData.assignedTo === 'course' && (
                        <div className="form-group fade-in">
                          <label className="form-label">Select Course</label>
                          <select 
                            className="form-control"
                            value={editFormData.course}
                            onChange={(e) => setEditFormData({ ...editFormData, course: e.target.value })}
                          >
                            <option value="Python">Python</option>
                            <option value="MERN Stack">MERN Stack</option>
                            <option value="AI & ML">AI & ML</option>
                          </select>
                        </div>
                      )}

                      {editFormData.assignedTo === 'student' && (
                        <div className="form-group fade-in">
                          <label className="form-label">Select Student</label>
                          <select 
                            className="form-control"
                            value={editFormData.studentId}
                            onChange={(e) => setEditFormData({ ...editFormData, studentId: e.target.value })}
                            required
                          >
                            <option value="">-- Choose student --</option>
                            {students.map(s => (
                              <option key={s._id} value={s._id}>{s.name} ({s.course})</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                        <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary">
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={creating}>
                          {creating ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  /* Header detail block */
                  <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                      <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>{selectedTask.title}</h2>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <strong>Due Date:</strong> {new Date(selectedTask.dueDate).toLocaleDateString()}
                        </span>
                        <p style={{ whiteSpace: 'pre-wrap', marginTop: '12px', color: 'var(--text-main)', background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', fontSize: '0.92rem' }}>
                          {selectedTask.description}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          onClick={() => handleStartEdit(selectedTask)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        >
                          Edit Task
                        </button>
                        <button 
                          onClick={() => handleDeleteTask(selectedTask._id)}
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        >
                          Delete Task
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submissions Section */}
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>
                    Intern Submissions ({submissions.length})
                  </h3>

                  {subsLoading ? (
                    <p style={{ color: 'var(--text-muted)' }}>Loading submissions...</p>
                  ) : submissions.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No student has submitted a solution for this task yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '550px', overflowY: 'auto' }}>
                      {submissions.map(sub => (
                        <div 
                          key={sub._id} 
                          style={{ 
                            padding: '16px', 
                            border: '1px solid var(--glass-border)', 
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(255,255,255,0.01)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: '#fff' }}>
                                {sub.studentId?.name ? sub.studentId.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <strong style={{ fontSize: '0.95rem' }}>{sub.studentId?.name || 'Deleted student'}</strong>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  <span>{sub.studentId?.course || 'N/A'}</span>
                                  <span style={{ margin: '0 6px' }}>•</span>
                                  <span>Submitted: {new Date(sub.submittedAt).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>

                            <span className={`badge ${sub.status === 'approved' ? 'badge-success' : sub.status === 'rejected' ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: '0.65rem' }}>
                              {sub.status}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.02)', whiteSpace: 'pre-wrap' }}>
                            {sub.solutionText}
                          </div>

                          {sub.githubLink && (
                            <div style={{ fontSize: '0.85rem' }}>
                              <strong>GitHub Link: </strong>
                              <a href={sub.githubLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>
                                {sub.githubLink}
                              </a>
                            </div>
                          )}

                          {(sub.imagePath || sub.documentPath) && (
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                              {sub.imagePath && (
                                <a 
                                  href={`${API_BASE_URL}${sub.imagePath}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="btn btn-secondary" 
                                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                                >
                                  View Image
                                </a>
                              )}
                              {sub.documentPath && (
                                <a 
                                  href={`${API_BASE_URL}${sub.documentPath}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  download
                                  className="btn btn-secondary" 
                                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                                >
                                  View Document
                                </a>
                              )}
                            </div>
                          )}

                          {sub.adminFeedback && (
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', borderLeft: '2px solid var(--accent-secondary)', paddingLeft: '10px' }}>
                              <strong>Feedback/Rejection Reason:</strong> {sub.adminFeedback}
                            </div>
                          )}

                          {reviewingSub?._id === sub._id ? (
                            /* Review Submission Section */
                            <div className="fade-in" style={{ borderTop: '1px dashed var(--glass-border)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Rejection Reason (only needed for rejection)</label>
                                <textarea 
                                  className="form-control" 
                                  rows="2"
                                  placeholder="Write reason for rejection or feedback..."
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                />
                              </div>

                              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setReviewingSub(null)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                                  Cancel
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => handleReject(sub, rejectionReason)} 
                                  className="btn btn-danger" 
                                  disabled={savingReview} 
                                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                >
                                  {savingReview ? 'Saving...' : 'Reject'}
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => handleApprove(sub)} 
                                  className="btn btn-success" 
                                  disabled={savingReview} 
                                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                >
                                  {savingReview ? 'Saving...' : 'Approve'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <button 
                                onClick={() => handleOpenReview(sub)}
                                className="btn btn-secondary" 
                                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                              >
                                Review Submission
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: '40px 0', textAlign: 'center', gap: '10px' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-dark)' }}>
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                <div>
                  <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '4px' }}>No Task Selected</h3>
                  <p>Click on any objective on the left panel to inspect description and grade solution filings.</p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
