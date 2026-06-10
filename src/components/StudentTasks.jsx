import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

export default function StudentTasks() {
  const { user, apiCall } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selected Task to view details / submit response
  const [selectedTask, setSelectedTask] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [docName, setDocName] = useState('');
  
  const [submitting, setSubmitting] = useState(false);

  const fetchTasksAndSubmissions = async () => {
    try {
      setLoading(true);
      const res = await apiCall('/tasks/my');
      
      if (res.ok) {
        const data = await res.json();
        const list = data.list || data.data || [];
        setTasks(list);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndSubmissions();
  }, []);

  // Map submissions by taskId
  const submissionMap = {};
  tasks.forEach(task => {
    if (task.submission) {
      submissionMap[task._id.toString()] = {
        ...task.submission,
        submissionText: task.submission.solutionText,
        githubLink: task.submission.githubLink,
        imagePath: task.submission.imagePath,
        documentPath: task.submission.documentPath,
        adminFeedback: task.submission.rejectionReason,
        submittedAt: task.submission.submittedAt || new Date()
      };
    }
  });

  const handleOpenTask = (task) => {
    setSelectedTask(task);
    const existing = submissionMap[task._id.toString()];
    setSubmissionText(existing ? existing.submissionText : '');
    setGithubLink(existing ? existing.githubLink : '');
    setImageFile(null);
    setImagePreview('');
    setDocFile(null);
    setDocName('');
  };

  // File Input Change Handlers
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid PNG or JPG image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size must be less than 5MB.');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDocChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedExtensions = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(file.type) && !['pdf', 'docx', 'doc'].includes(fileExtension)) {
      alert('Please upload a valid PDF or DOCX document.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Document file size must be less than 10MB.');
      return;
    }

    setDocFile(file);
    setDocName(file.name);
  };

  const removeImageFile = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const removeDocFile = () => {
    setDocFile(null);
    setDocName('');
  };

  const handlePostSubmission = async (e) => {
    e.preventDefault();
    if (!submissionText.trim()) return;

    try {
      setSubmitting(true);
      
      const formDataToSend = new FormData();
      formDataToSend.append('solutionText', submissionText);
      formDataToSend.append('githubLink', githubLink);
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }
      if (docFile) {
        formDataToSend.append('document', docFile);
      }

      const res = await apiCall(`/tasks/${selectedTask._id}/submit`, {
        method: 'PUT',
        body: formDataToSend
      });

      if (res.ok) {
        alert('Submission sent successfully!');
        setSelectedTask(null);
        setSubmissionText('');
        setGithubLink('');
        setImageFile(null);
        setImagePreview('');
        setDocFile(null);
        setDocName('');
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
                        Created by: Admin
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
                      color: 'var(--text-muted)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dark)', display: 'block', marginBottom: '8px' }}>
                          Submitted on: {new Date(submissionMap[selectedTask._id.toString()].submittedAt).toLocaleString()}
                        </span>
                        <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-main)' }}>
                          {submissionMap[selectedTask._id.toString()].submissionText}
                        </div>
                      </div>

                      {submissionMap[selectedTask._id.toString()].githubLink && (
                        <div style={{ fontSize: '0.9rem' }}>
                          <strong>GitHub/Project: </strong>
                          <a href={submissionMap[selectedTask._id.toString()].githubLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>
                            {submissionMap[selectedTask._id.toString()].githubLink}
                          </a>
                        </div>
                      )}

                      {(submissionMap[selectedTask._id.toString()].imagePath || submissionMap[selectedTask._id.toString()].documentPath) && (
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
                          {submissionMap[selectedTask._id.toString()].imagePath && (
                            <a 
                              href={`${API_BASE_URL}${submissionMap[selectedTask._id.toString()].imagePath}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="btn btn-secondary" 
                              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                            >
                              View Screenshot
                            </a>
                          )}
                          {submissionMap[selectedTask._id.toString()].documentPath && (
                            <a 
                              href={`${API_BASE_URL}${submissionMap[selectedTask._id.toString()].documentPath}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              download
                              className="btn btn-secondary" 
                              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                            >
                              Download PDF/DOCX
                            </a>
                          )}
                        </div>
                      )}
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
                        rows="4"
                        placeholder="Provide details of your task output, description, or answers..."
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        required
                        style={{ resize: 'vertical' }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">GitHub / Project URL</label>
                      <input
                        type="url"
                        className="form-control"
                        placeholder="https://github.com/..."
                        value={githubLink}
                        onChange={(e) => setGithubLink(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Upload Screenshot (PNG, JPG - max 5MB)</label>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg"
                          onChange={handleImageChange}
                          style={{ display: 'none' }}
                          id="submit-screenshot"
                        />
                        <label htmlFor="submit-screenshot" className="btn btn-secondary" style={{ width: '100%' }}>
                          Select Image
                        </label>
                        {imagePreview && (
                          <div style={{ position: 'relative', marginTop: '10px', width: '100%', height: '100px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
                            <img src={imagePreview} alt="Screenshot preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button 
                              type="button" 
                              onClick={removeImageFile}
                              style={{ position: 'absolute', top: '5px', right: '5px', background: 'var(--color-danger)', border: 'none', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                            >
                              &times;
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Upload Document (PDF, DOCX - max 10MB)</label>
                        <input
                          type="file"
                          accept="application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/msword"
                          onChange={handleDocChange}
                          style={{ display: 'none' }}
                          id="submit-document"
                        />
                        <label htmlFor="submit-document" className="btn btn-secondary" style={{ width: '100%' }}>
                          Select Document
                        </label>
                        {docName && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '80%' }}>{docName}</span>
                            <button 
                              type="button" 
                              onClick={removeDocFile}
                              style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px', display: 'flex', alignItems: 'center' }}
                            >
                              &times;
                            </button>
                          </div>
                        )}
                      </div>
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
