import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function StudentTasks() {
  const { user, apiCall } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selected Task to view details / submit response
  const [selectedTask, setSelectedTask] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTasksAndSubmissions = async () => {
    try {
      setLoading(true);
      const tasksRes = await apiCall('/tasks');
      const submissionsRes = await apiCall(`/submissions/student/${user._id}`);
      
      if (tasksRes.ok && submissionsRes.ok) {
        const tasksData = await tasksRes.json();
        const submissionsData = await submissionsRes.json();
        
        setTasks(tasksData.tasks || []);
        setSubmissions(submissionsData.submissions || []);
      }
    } catch (error) {
      console.error('Error fetching tasks/submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndSubmissions();
  }, []);

  // Map submissions by taskId
  const submissionMap = {};
  submissions.forEach(sub => {
    const taskIdStr = sub.taskId?._id || sub.taskId;
    if (taskIdStr) {
      submissionMap[taskIdStr.toString()] = sub;
    }
  });

  const handleOpenTask = (task) => {
    setSelectedTask(task);
    const existing = submissionMap[task._id.toString()];
    setSubmissionText(existing ? existing.submissionText : '');
  };

  const handlePostSubmission = async (e) => {
    e.preventDefault();
    if (!submissionText.trim()) return;

    try {
      setSubmitting(true);
      const res = await apiCall('/submissions', {
        method: 'POST',
        body: JSON.stringify({
          taskId: selectedTask._id,
          submissionText
        })
      });

      if (res.ok) {
        alert('Submission sent successfully!');
        setSelectedTask(null);
        setSubmissionText('');
        fetchTasksAndSubmissions();
      } else {
        const data = await res.json();
        alert(data.message || 'Submission failed');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Daily Tasks</h1>
        <p style={{ color: 'var(--text-muted)' }}>Solve problems assigned by administrators and submit your solutions.</p>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading tasks and submissions...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px', alignItems: 'start' }}>
          
          {/* Tasks List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }}>Assigned Tasks</h2>
            
            {tasks.length === 0 ? (
              <div className="glass-card">
                <p style={{ color: 'var(--text-muted)' }}>No tasks assigned yet. Check back later!</p>
              </div>
            ) : (
              tasks.map(task => {
                const submission = submissionMap[task._id.toString()];
                
                return (
                  <div 
                    key={task._id} 
                    className="glass-card" 
                    onClick={() => handleOpenTask(task)}
                    style={{ 
                      cursor: 'pointer',
                      borderLeft: selectedTask?._id === task._id 
                        ? '4px solid var(--accent-primary)' 
                        : submission 
                          ? '4px solid rgba(255,255,255,0.1)' 
                          : '4px solid var(--color-warning)',
                      background: selectedTask?._id === task._id ? 'var(--bg-tertiary)' : 'var(--glass-bg)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                      <span className={`badge ${
                        task.priority === 'High' ? 'badge-danger' : task.priority === 'Medium' ? 'badge-warning' : 'badge-info'
                      }`}>
                        {task.priority} Priority
                      </span>
                    </div>
                    
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{task.title}</h3>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dark)' }}>
                        Created by: {task.createdBy?.name || 'Admin'}
                      </span>
                      
                      {submission ? (
                        <span className={`badge ${
                          submission.status === 'approved' 
                            ? 'badge-success' 
                            : submission.status === 'rejected' 
                              ? 'badge-danger' 
                              : 'badge-info'
                        }`}>
                          {submission.status}
                        </span>
                      ) : (
                        <span className="badge badge-warning">Pending Submit</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Task Details & Submission Panel */}
          <div className="glass-card" style={{ minHeight: '300px' }}>
            {selectedTask ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span className={`badge ${
                      selectedTask.priority === 'High' ? 'badge-danger' : selectedTask.priority === 'Medium' ? 'badge-warning' : 'badge-info'
                    }`}>
                      {selectedTask.priority} Priority
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Due: {new Date(selectedTask.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.4rem', marginBottom: '12px' }}>{selectedTask.title}</h2>
                  <p style={{ 
                    whiteSpace: 'pre-wrap', 
                    background: 'rgba(0,0,0,0.2)', 
                    padding: '16px', 
                    borderRadius: 'var(--radius-md)', 
                    fontSize: '0.95rem',
                    color: 'var(--text-main)',
                    border: '1px solid var(--glass-border)'
                  }}>
                    {selectedTask.description}
                  </p>
                </div>

                {/* Status/Feedback check */}
                {submissionMap[selectedTask._id.toString()] ? (
                  <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <h3 style={{ fontSize: '1.1rem' }}>Your Submission</h3>
                    
                    <div style={{ 
                      padding: '16px', 
                      background: 'rgba(255,255,255,0.01)', 
                      borderRadius: 'var(--radius-md)', 
                      border: '1px solid var(--glass-border)',
                      fontSize: '0.95rem',
                      color: 'var(--text-muted)'
                    }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dark)', display: 'block', marginBottom: '8px' }}>
                        Submitted on: {new Date(submissionMap[selectedTask._id.toString()].submittedAt).toLocaleString()}
                      </span>
                      {submissionMap[selectedTask._id.toString()].submissionText}
                    </div>

                    <div style={{ 
                      padding: '16px', 
                      borderRadius: 'var(--radius-md)', 
                      border: '1px solid transparent',
                      background: submissionMap[selectedTask._id.toString()].status === 'approved' 
                        ? 'rgba(16, 185, 129, 0.05)' 
                        : submissionMap[selectedTask._id.toString()].status === 'rejected' 
                          ? 'rgba(239, 68, 68, 0.05)' 
                          : 'rgba(59, 130, 246, 0.05)',
                      borderColor: submissionMap[selectedTask._id.toString()].status === 'approved' 
                        ? 'rgba(16, 185, 129, 0.2)' 
                        : submissionMap[selectedTask._id.toString()].status === 'rejected' 
                          ? 'rgba(239, 68, 68, 0.2)' 
                          : 'rgba(59, 130, 246, 0.2)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <div style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          backgroundColor: submissionMap[selectedTask._id.toString()].status === 'approved' 
                            ? 'var(--color-success)' 
                            : submissionMap[selectedTask._id.toString()].status === 'rejected' 
                              ? 'var(--color-danger)' 
                              : 'var(--color-info)' 
                        }} />
                        <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>
                          Status: {submissionMap[selectedTask._id.toString()].status}
                        </span>
                      </div>
                      
                      {submissionMap[selectedTask._id.toString()].adminFeedback && (
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '8px', borderTop: '1px dashed var(--glass-border)', paddingTop: '8px' }}>
                          <strong>Feedback:</strong> {submissionMap[selectedTask._id.toString()].adminFeedback}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handlePostSubmission} style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <h3 style={{ fontSize: '1.1rem' }}>Submit Solution</h3>
                    
                    <div className="form-group">
                      <label className="form-label">Solution Text / Details</label>
                      <textarea
                        className="form-control"
                        rows="6"
                        placeholder="Provide details of your task output, github link, or descriptive answers..."
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        required
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                    
                    <button type="submit" className="btn btn-primary" disabled={submitting || !submissionText.trim()}>
                      {submitting ? 'Sending...' : 'Submit Solution'}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)', gap: '15px', padding: '40px 0' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-dark)' }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '6px' }}>No Task Selected</h3>
                  <p>Click on any assigned task on the left panel to read instructions and submit your solution.</p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
