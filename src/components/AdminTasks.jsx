import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

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

  // Selected Task Submissions
  const [selectedTask, setSelectedTask] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [subsLoading, setSubsLoading] = useState(false);

  // Reviewing a submission
  const [reviewingSub, setReviewingSub] = useState(null); // the submission object being reviewed
  const [reviewForm, setReviewForm] = useState({
    status: 'approved',
    adminFeedback: ''
  });
  const [savingReview, setSavingReview] = useState(false);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const tasksRes = await apiCall('/tasks');
      const studentsRes = await apiCall('/students');
      
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
      }
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData.students || []);
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
    setReviewingSub(null);
    try {
      setSubsLoading(true);
      const res = await apiCall(`/submissions/task/${task._id}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
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
        assignedTo: formData.assignedTo,
        dueDate: formData.dueDate,
        priority: formData.priority
      };

      if (formData.assignedTo === 'course') {
        payload.course = formData.course;
      } else if (formData.assignedTo === 'student') {
        payload.studentId = formData.studentId;
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

  const handleOpenReview = (submission) => {
    setReviewingSub(submission);
    setReviewForm({
      status: 'approved',
      adminFeedback: submission.adminFeedback || ''
    });
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    try {
      setSavingReview(true);
      const res = await apiCall(`/submissions/${reviewingSub._id}/review`, {
        method: 'PUT',
        body: JSON.stringify(reviewForm)
      });

      if (res.ok) {
        alert('Review saved successfully');
        setReviewingSub(null);
        // Refresh submissions list
        if (selectedTask) handleSelectTask(selectedTask);
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to submit review');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setSavingReview(false);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Task Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Publish daily intern objectives and evaluate solutions.</p>
        </div>
        
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)} 
          className="btn btn-primary"
        >
          {showCreateForm ? 'View Tasks List' : 'Assign New Task'}
        </button>
      </div>

      {showCreateForm ? (
        /* Form for Task Creation */
        <div className="glass-card" style={{ maxWidth: '700px' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '20px' }}>Create Daily Task</h2>
          
          <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Task Title</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="e.g. Build Login Screen UI"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Task Description</label>
              <textarea 
                className="form-control"
                rows="5"
                placeholder="Enter details of the task, links, or expectations..."
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
                <label className="form-label">Priority</label>
                <select 
                  className="form-control"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Assign Target Scope</label>
              <select 
                className="form-control"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              >
                <option value="all">All Registered Students</option>
                <option value="course">Specific Course Track</option>
                <option value="student">Individual Student</option>
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
                  <option value="Java">Java</option>
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
                  <option value="">-- Choose Student --</option>
                  {students.map(student => (
                    <option key={student._id} value={student._id}>
                      {student.name} ({student.course})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Creating...' : 'Publish Task'}
            </button>
          </form>
        </div>
      ) : (
        /* Tasks List & Submission Review split view */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '30px', alignItems: 'start' }}>
          
          {/* Tasks List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }}>Published Objectives</h2>
            
            {loading ? (
              <p style={{ color: 'var(--text-muted)' }}>Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <div className="glass-card">
                <p style={{ color: 'var(--text-muted)' }}>No tasks found. Click "Assign New Task" to create one.</p>
              </div>
            ) : (
              tasks.map(task => (
                <div 
                  key={task._id} 
                  className="glass-card" 
                  onClick={() => handleSelectTask(task)}
                  style={{ 
                    cursor: 'pointer',
                    borderLeft: selectedTask?._id === task._id ? '4px solid var(--accent-primary)' : '4px solid rgba(255,255,255,0.05)',
                    background: selectedTask?._id === task._id ? 'var(--bg-tertiary)' : 'var(--glass-bg)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                    <span className={`badge ${
                      task.priority === 'High' ? 'badge-danger' : task.priority === 'Medium' ? 'badge-warning' : 'badge-info'
                    }`}>
                      {task.priority} Priority
                    </span>
                  </div>
                  
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>{task.title}</h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dark)' }}>
                    Assigned to: {task.assignedTo === 'all' ? 'All Interns' : task.assignedTo === 'course' ? `${task.course} Course` : task.studentId?.name || 'Individual'}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Submission and Reviews Panel */}
          <div className="glass-card" style={{ minHeight: '400px' }}>
            {selectedTask ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Task Details Info */}
                <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.3rem', marginBottom: '6px' }}>{selectedTask.title}</h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', whiteSpace: 'pre-wrap' }}>
                        {selectedTask.description}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDeleteTask(selectedTask._id)}
                      className="btn btn-danger"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    >
                      Delete Task
                    </button>
                  </div>
                </div>

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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '450px', overflowY: 'auto' }}>
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
                              {sub.studentId?.profilePhoto ? (
                                <img src={sub.studentId.profilePhoto} alt="" style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                              ) : (
                                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                  {sub.studentId?.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <strong style={{ fontSize: '0.95rem' }}>{sub.studentId?.name || 'Deleted student'}</strong>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                                  ({sub.studentId?.course} | Batch {sub.studentId?.batch})
                                </span>
                              </div>
                            </div>

                            <span className={`badge ${sub.status === 'approved' ? 'badge-success' : sub.status === 'rejected' ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: '0.65rem' }}>
                              {sub.status}
                            </span>
                          </div>

                          <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.02)' }}>
                            {sub.submissionText}
                          </p>

                          {sub.adminFeedback && (
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', borderLeft: '2px solid var(--accent-secondary)', paddingLeft: '10px' }}>
                              <strong>Feedback:</strong> {sub.adminFeedback}
                            </div>
                          )}

                          {reviewingSub?._id === sub._id ? (
                            /* Sub form to edit evaluation */
                            <form onSubmit={handleSaveReview} className="fade-in" style={{ borderTop: '1px dashed var(--glass-border)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div style={{ display: 'flex', gap: '15px' }}>
                                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                  <label className="form-label">Status</label>
                                  <select 
                                    className="form-control"
                                    value={reviewForm.status}
                                    onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
                                  >
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                  </select>
                                </div>
                              </div>

                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Review Feedback</label>
                                <textarea 
                                  className="form-control" 
                                  rows="2"
                                  placeholder="Add notes / tips for improvement..."
                                  value={reviewForm.adminFeedback}
                                  onChange={(e) => setReviewForm({ ...reviewForm, adminFeedback: e.target.value })}
                                />
                              </div>

                              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setReviewingSub(null)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                                  Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={savingReview} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                                  {savingReview ? 'Saving...' : 'Save Review'}
                                </button>
                              </div>
                            </form>
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
