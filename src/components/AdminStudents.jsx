import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminStudents() {
  const { apiCall } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters state
  const [filters, setFilters] = useState({
    course: '',
    branch: '',
    batch: '',
    attendanceStatus: ''
  });

  // Unique lists for filtering dropdowns
  const [coursesList] = useState(['Python', 'MERN Stack', 'AI & ML']);
  const [branchesList, setBranchesList] = useState([]);
  const [batchesList, setBatchesList] = useState([]);

  // Selected Student Profile Inspection
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentTab, setStudentTab] = useState('profile'); // profile / attendance / submissions
  const [studentHistory, setStudentHistory] = useState([]);
  const [studentSubmissions, setStudentSubmissions] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      // Build query string
      const params = new URLSearchParams();
      if (filters.course) params.append('course', filters.course);
      if (filters.branch) params.append('branch', filters.branch);
      if (filters.batch) params.append('batch', filters.batch);
      if (filters.attendanceStatus) params.append('todayStatus', filters.attendanceStatus);

      const res = await apiCall(`/admin/students?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const studentData = data.students || data.data || [];
        setStudents(studentData);

        // Extract unique branches and batches for dynamic filter values
        const branches = new Set();
        const batches = new Set();
        studentData.forEach(student => {
          if (student.branch) branches.add(student.branch.toUpperCase());
          if (student.batch) batches.add(student.batch);
        });
        
        if (branchesList.length === 0) setBranchesList(Array.from(branches));
        if (batchesList.length === 0) setBatchesList(Array.from(batches));
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [filters]);

  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setStudentTab('profile');
    
    try {
      setDetailsLoading(true);
      // Fetch selected student's attendance history
      const attRes = await apiCall(`/attendance/student/${student._id}`);
      const subsRes = await apiCall(`/tasks/student/${student._id}/submissions`);
      
      if (attRes.ok && subsRes.ok) {
        const attData = await attRes.json();
        const subsData = await subsRes.json();
        
        setStudentHistory(attData.history || []);
        setStudentSubmissions(subsData.submissions || []);
      }
    } catch (error) {
      console.error('Error loading student details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({
      course: '',
      branch: '',
      batch: '',
      attendanceStatus: ''
    });
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to permanently delete this student record? This cannot be undone.')) {
      return;
    }
    
    try {
      const res = await apiCall(`/admin/students/${studentId}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Student deleted successfully');
        setSelectedStudent(null);
        fetchStudents();
      } else {
        const data = await res.json();
        alert(data.message || 'Delete operation failed');
      }
    } catch (error) {
      alert('Error deleting: ' + error.message);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Student Directory</h1>
        <p style={{ color: 'var(--text-muted)' }}>Review and manage intern accounts, check-in histories, and task solutions.</p>
      </div>

      {/* Filter panel */}
      <div className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 1, minWidth: '180px', marginBottom: 0 }}>
          <label className="form-label">Course</label>
          <select name="course" className="form-control" value={filters.course} onChange={handleFilterChange}>
            <option value="">All Courses</option>
            {coursesList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-group" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }}>
          <label className="form-label">Branch</label>
          <select name="branch" className="form-control" value={filters.branch} onChange={handleFilterChange}>
            <option value="">All Branches</option>
            {branchesList.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div className="form-group" style={{ flex: 1, minWidth: '120px', marginBottom: 0 }}>
          <label className="form-label">Batch</label>
          <select name="batch" className="form-control" value={filters.batch} onChange={handleFilterChange}>
            <option value="">All Batches</option>
            {batchesList.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div className="form-group" style={{ flex: 1, minWidth: '180px', marginBottom: 0 }}>
          <label className="form-label">Today's Attendance</label>
          <select name="attendanceStatus" className="form-control" value={filters.attendanceStatus} onChange={handleFilterChange}>
            <option value="">All Statuses</option>
            <option value="present">Present / Late</option>
            <option value="absent">Absent</option>
            <option value="unmarked">Unmarked</option>
          </select>
        </div>

        <button onClick={clearFilters} className="btn btn-secondary" style={{ height: '45px' }}>
          Clear Filters
        </button>
      </div>

      {/* Main split view container */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Student List */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Students List ({students.length})</h3>
          </div>

          {loading ? (
            <p style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading student records...</p>
          ) : students.length === 0 ? (
            <p style={{ padding: '24px', color: 'var(--text-muted)' }}>No student records matched the criteria.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '550px', overflowY: 'auto' }}>
              {students.map(student => (
                <div 
                  key={student._id}
                  onClick={() => handleSelectStudent(student)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    backgroundColor: selectedStudent?._id === student._id ? 'var(--bg-tertiary)' : 'transparent',
                    transition: 'background-color var(--transition-fast)'
                  }}
                >
                  <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: '#fff' }}>
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flexGrow: 1 }}>
                    <h4 style={{ fontSize: '0.98rem', marginBottom: '3px' }}>{student.name}</h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{student.course} | {student.branch}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dark)' }}>{student.batch}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Student Detail Inspector */}
        <div className="glass-card" style={{ minHeight: '400px' }}>
          {selectedStudent ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Header profile details */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                    {selectedStudent.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.3rem', marginBottom: '2px' }}>{selectedStudent.name}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{selectedStudent.email}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleDeleteStudent(selectedStudent._id)}
                  className="btn btn-danger"
                  style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                >
                  Delete Student
                </button>
              </div>

              {/* Detail Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)' }}>
                {['profile', 'attendance', 'submissions'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setStudentTab(tab)}
                    style={{
                      padding: '10px 18px',
                      background: 'none',
                      border: 'none',
                      color: studentTab === tab ? '#fff' : 'var(--text-muted)',
                      borderBottom: studentTab === tab ? '2px solid var(--accent-primary)' : '2px solid transparent',
                      cursor: 'pointer',
                      fontWeight: '500',
                      textTransform: 'capitalize',
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {detailsLoading ? (
                <p style={{ color: 'var(--text-muted)' }}>Loading student metrics...</p>
              ) : (
                <div>
                  
                  {/* TAB: PROFILE */}
                  {studentTab === 'profile' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '0.95rem' }}>
                      <div><strong style={{ color: 'var(--text-muted)' }}>College:</strong><p style={{ marginTop: '3px' }}>{selectedStudent.college || 'N/A'}</p></div>
                      <div><strong style={{ color: 'var(--text-muted)' }}>Branch:</strong><p style={{ marginTop: '3px' }}>{selectedStudent.branch || 'N/A'}</p></div>
                      <div><strong style={{ color: 'var(--text-muted)' }}>Internship Course:</strong><p style={{ marginTop: '3px' }}>{selectedStudent.course || 'N/A'}</p></div>
                      <div><strong style={{ color: 'var(--text-muted)' }}>Batch:</strong><p style={{ marginTop: '3px' }}>{selectedStudent.batch || 'N/A'}</p></div>
                      <div><strong style={{ color: 'var(--text-muted)' }}>Phone:</strong><p style={{ marginTop: '3px' }}>{selectedStudent.phone || 'N/A'}</p></div>
                      <div><strong style={{ color: 'var(--text-muted)' }}>Attendance Rate:</strong><p style={{ marginTop: '3px', color: 'var(--color-success)', fontWeight: 'bold' }}>{selectedStudent.attendanceRate}%</p></div>
                    </div>
                  )}

                  {/* TAB: ATTENDANCE HISTORY */}
                  {studentTab === 'attendance' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Logged Days: <strong>{studentHistory.length}</strong></span>
                        <span>Present Rate: <strong style={{ color: 'var(--color-success)' }}>{selectedStudent.attendanceRate}%</strong></span>
                      </div>
                      
                      {studentHistory.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No attendance logged yet.</p>
                      ) : (
                        <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
                          <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Logged At</th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentHistory.map(record => (
                                <tr key={record._id}>
                                  <td>{new Date(record.date).toLocaleDateString()}</td>
                                  <td>
                                    <span className={`badge ${record.status === 'present' ? 'badge-success' : record.status === 'late' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.65rem', textTransform: 'capitalize' }}>
                                      {record.status}
                                    </span>
                                  </td>
                                  <td>{new Date(record.markedAt || record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: SUBMISSIONS */}
                  {studentTab === 'submissions' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Total Solved: <strong>{studentSubmissions.length}</strong></span>
                        <span>Approved Count: <strong style={{ color: 'var(--color-success)' }}>
                          {studentSubmissions.filter(s => s.status === 'approved').length}
                        </strong></span>
                      </div>

                      {studentSubmissions.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No solutions filed yet.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                          {studentSubmissions.map(submission => (
                            <div key={submission._id} style={{ padding: '12px', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.01)', fontSize: '0.88rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <strong>{submission.taskId?.title || 'Unknown Task'}</strong>
                                <span className={`badge ${submission.status === 'approved' ? 'badge-success' : submission.status === 'rejected' ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: '0.65rem', textTransform: 'capitalize' }}>
                                  {submission.status}
                                </span>
                              </div>
                              <p style={{ color: 'var(--text-main)', fontSize: '0.85rem', marginBottom: '6px', background: 'rgba(0,0,0,0.15)', padding: '8px', borderRadius: '4px' }}>
                                {submission.submissionText}
                              </p>
                              {submission.adminFeedback && (
                                <p style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)' }}>
                                  <strong>Feedback/Reason:</strong> {submission.adminFeedback}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: '40px 0', textAlign: 'center', gap: '10px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-dark)' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <div>
                <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '4px' }}>No Intern Selected</h3>
                <p>Click on any student card on the left panel to inspect their profile and logs.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
