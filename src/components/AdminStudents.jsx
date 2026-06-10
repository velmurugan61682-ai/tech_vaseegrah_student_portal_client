import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import * as adminService from '../services/adminService';
import * as branchService from '../services/branchService';
import * as taskService from '../services/taskService';
import * as attendanceService from '../services/attendanceService';

export default function AdminStudents() {
  const { showToast } = useAuth();
  
  // Data States
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filters, setFilters] = useState({
    search: '',
    course: '',
    branch: '',
    batch: '',
    attendanceStatus: ''
  });

  // Modal Views State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Selected entities for actions
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentHistory, setSelectedStudentHistory] = useState([]);
  const [selectedStudentSubmissions, setSelectedStudentSubmissions] = useState([]);
  const [studentDetailsTab, setStudentDetailsTab] = useState('profile'); // profile / attendance / submissions
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form input references
  const addFileRef = useRef(null);
  const editFileRef = useRef(null);

  // Add Student Form State
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    college: '',
    department: '',
    branch: 'CSE',
    course: 'MERN Stack',
    batch: '2024-26',
    startDate: '',
    endDate: '',
    internshipDuration: '3 Months'
  });

  // Edit Student Form State
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    department: '',
    branch: '',
    course: '',
    batch: '',
    startDate: '',
    endDate: '',
    internshipDuration: '',
    status: 'Active'
  });

  // Assign Task Form State
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'Medium'
  });

  const [formLoading, setFormLoading] = useState(false);

  // Fetch student directory and branches list
  const fetchRegistry = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.course) params.course = filters.course;
      if (filters.branch) params.branch = filters.branch;
      if (filters.batch) params.batch = filters.batch;
      if (filters.attendanceStatus) params.todayStatus = filters.attendanceStatus;

      const data = await adminService.getStudentsDirectory(params);
      if (data.success) {
        let list = data.students || [];
        if (filters.search) {
          const query = filters.search.toLowerCase();
          list = list.filter(s => 
            s.name.toLowerCase().includes(query) || 
            s.email.toLowerCase().includes(query) ||
            s.college.toLowerCase().includes(query)
          );
        }
        setStudents(list);
      }

      // Fetch branches for options
      const bData = await branchService.getBranches();
      if (bData.success) {
        setBranches(bData.branches || []);
      }
    } catch (error) {
      console.error(error);
      showToast('Error loading student directory', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistry();
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      course: '',
      branch: '',
      batch: '',
      attendanceStatus: ''
    });
  };

  // Inspect student details
  const handleViewStudent = async (student) => {
    setSelectedStudent(student);
    setStudentDetailsTab('profile');
    setShowViewModal(true);
    
    try {
      setDetailsLoading(true);
      const attRes = await attendanceService.getStudentAttendance(student._id);
      const subsRes = await taskService.getStudentSubmissions(student._id);
      
      if (attRes.success && subsRes.success) {
        setSelectedStudentHistory(attRes.history || []);
        setSelectedStudentSubmissions(subsRes.submissions || []);
      }
    } catch (error) {
      console.error('Error fetching student logs:', error);
      showToast('Could not load student history logs', 'danger');
    } finally {
      setDetailsLoading(false);
    }
  };

  // Add Student Handler
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    
    try {
      const formData = new FormData();
      Object.keys(addForm).forEach(key => {
        formData.append(key, addForm[key]);
      });
      if (addFileRef.current && addFileRef.current.files[0]) {
        formData.append('profilePhoto', addFileRef.current.files[0]);
      }

      const res = await adminService.addStudent(formData);
      if (res.success) {
        showToast('Student registered successfully!', 'success');
        setShowAddModal(false);
        // Reset Form
        setAddForm({
          name: '',
          email: '',
          password: '',
          phone: '',
          college: '',
          department: '',
          branch: 'CSE',
          course: 'MERN Stack',
          batch: '2024-26',
          startDate: '',
          endDate: '',
          internshipDuration: '3 Months'
        });
        if (addFileRef.current) addFileRef.current.value = '';
        fetchRegistry();
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      showToast(msg || 'Registration failed', 'danger');
    } finally {
      setFormLoading(false);
    }
  };

  // Edit Click
  const handleEditClick = (student) => {
    setSelectedStudent(student);
    setEditForm({
      name: student.name,
      email: student.email,
      phone: student.phone || '',
      college: student.college || '',
      department: student.department || '',
      branch: student.branch || '',
      course: student.course || '',
      batch: student.batch || '',
      startDate: student.startDate ? student.startDate.split('T')[0] : '',
      endDate: student.endDate ? student.endDate.split('T')[0] : '',
      internshipDuration: student.internshipDuration || '',
      status: student.status || 'Active'
    });
    setShowEditModal(true);
  };

  // Edit Student Handler
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    
    try {
      const formData = new FormData();
      Object.keys(editForm).forEach(key => {
        formData.append(key, editForm[key]);
      });
      if (editFileRef.current && editFileRef.current.files[0]) {
        formData.append('profilePhoto', editFileRef.current.files[0]);
      }

      const res = await adminService.updateStudent(selectedStudent._id, formData);
      if (res.success) {
        showToast('Student details updated successfully!', 'success');
        setShowEditModal(false);
        fetchRegistry();
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      showToast(msg || 'Update failed', 'danger');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete student Handler
  const handleDeleteClick = async (studentId) => {
    if (!window.confirm('Are you sure you want to permanently delete this student record? All logs will be deleted.')) {
      return;
    }
    
    try {
      const res = await adminService.deleteStudent(studentId);
      if (res.success) {
        showToast('Student deleted successfully', 'success');
        fetchRegistry();
      }
    } catch (error) {
      showToast(error.message || 'Deletion failed', 'danger');
    }
  };

  // Assign Task Click
  const handleAssignClick = (student) => {
    setSelectedStudent(student);
    setTaskForm({
      title: '',
      description: '',
      dueDate: '',
      priority: 'Medium'
    });
    setShowAssignModal(true);
  };

  // Assign Task Handler
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const payload = {
        title: taskForm.title,
        description: taskForm.description,
        dueDate: taskForm.dueDate,
        priority: taskForm.priority,
        assignedTo: [selectedStudent._id],
        assignmentType: 'student'
      };

      const res = await taskService.createTask(payload);
      if (res.success) {
        showToast(`Task assigned successfully to ${selectedStudent.name}!`, 'success');
        setShowAssignModal(false);
      }
    } catch (error) {
      showToast(error.message || 'Assignment failed', 'danger');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Student Directory
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage intern profiles, register new entries, and assign tasks.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ padding: '12px 24px' }}>
          + Add New Student
        </button>
      </div>

      {/* Directory Filter controls panel */}
      <div className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 1.5, minWidth: '200px', marginBottom: 0 }}>
          <label className="form-label">Search Student</label>
          <input 
            type="text" 
            name="search"
            value={filters.search} 
            onChange={handleFilterChange} 
            className="form-control" 
            placeholder="Search by name, email or college..." 
          />
        </div>

        <div className="form-group" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }}>
          <label className="form-label">CourseTrack</label>
          <select name="course" className="form-control" value={filters.course} onChange={handleFilterChange}>
            <option value="">All Courses</option>
            <option value="MERN Stack">MERN Stack</option>
            <option value="Python">Python</option>
            <option value="AI & ML">AI & ML</option>
          </select>
        </div>

        <div className="form-group" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }}>
          <label className="form-label">Branch</label>
          <select name="branch" className="form-control" value={filters.branch} onChange={handleFilterChange}>
            <option value="">All Branches</option>
            {branches.map(b => (
              <option key={b._id} value={b.branchName}>{b.branchName}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ flex: 1, minWidth: '120px', marginBottom: 0 }}>
          <label className="form-label">Batch</label>
          <select name="batch" className="form-control" value={filters.batch} onChange={handleFilterChange}>
            <option value="">All Batches</option>
            <option value="2023-25">2023-25</option>
            <option value="2024-26">2024-26</option>
            <option value="2025-27">2025-27</option>
          </select>
        </div>

        <div className="form-group" style={{ flex: 1, minWidth: '140px', marginBottom: 0 }}>
          <label className="form-label">Attendance status</label>
          <select name="attendanceStatus" className="form-control" value={filters.attendanceStatus} onChange={handleFilterChange}>
            <option value="">All Statuses</option>
            <option value="present">Present / Late Today</option>
            <option value="absent">Absent Today</option>
            <option value="unmarked">Unmarked Today</option>
          </select>
        </div>

        <button onClick={clearFilters} className="btn btn-secondary" style={{ height: '45px' }}>
          Clear Filters
        </button>
      </div>

      {/* Directory Datatable */}
      <div className="glass-card" style={{ padding: 0 }}>
        {loading ? (
          <p style={{ padding: '30px', color: 'var(--text-muted)', textAlign: 'center' }}>Loading directory records...</p>
        ) : students.length === 0 ? (
          <p style={{ padding: '30px', color: 'var(--text-muted)', textAlign: 'center' }}>No intern records found matching the criteria.</p>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>College</th>
                  <th>Department</th>
                  <th>Branch</th>
                  <th>Course</th>
                  <th>Batch</th>
                  <th>Attendance %</th>
                  <th>Task %</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => {
                  let statusBadge = 'badge-success';
                  if (s.status === 'At Risk') statusBadge = 'badge-warning';
                  else if (s.status === 'Inactive') statusBadge = 'badge-danger';

                  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';
                  const photoSrc = s.profilePhoto ? (s.profilePhoto.startsWith('http') ? s.profilePhoto : `${API_BASE_URL}${s.profilePhoto}`) : '';

                  return (
                    <tr key={s._id}>
                      <td>
                        {photoSrc ? (
                          <img src={photoSrc} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--glass-border)' }} />
                        ) : (
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: '600' }}>{s.name}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{s.email}</td>
                      <td style={{ fontSize: '0.85rem' }}>{s.college || '-'}</td>
                      <td style={{ fontSize: '0.85rem' }}>{s.department || '-'}</td>
                      <td style={{ fontWeight: '500' }}>{s.branch}</td>
                      <td>{s.course}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{s.batch}</td>
                      <td style={{ fontWeight: 'bold', color: s.attendancePercentage >= 75 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {s.attendancePercentage}%
                      </td>
                      <td style={{ fontWeight: 'bold', color: 'var(--color-info)' }}>
                        {s.taskCompletionPercentage}%
                      </td>
                      <td>
                        <span className={`badge ${statusBadge}`} style={{ fontSize: '0.68rem' }}>
                          {s.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleViewStudent(s)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} title="View Logs">
                            View
                          </button>
                          <button onClick={() => handleEditClick(s)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem', borderColor: 'var(--accent-primary-glow)' }} title="Edit Profile">
                            Edit
                          </button>
                          <button onClick={() => handleAssignClick(s)} className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} title="Assign Task">
                            Assign
                          </button>
                          <button onClick={() => handleDeleteClick(s._id)} className="btn btn-danger" style={{ padding: '6px 10px', fontSize: '0.75rem' }} title="Delete Student">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================= */}
      {/* 1. ADD NEW STUDENT MODAL FORM           */}
      {/* ======================================= */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }}>
          <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '650px', background: 'var(--bg-secondary)', overflowY: 'auto', maxHeight: '90vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
              <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)' }}>Register New Student</h2>
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Close</button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Profile Image Upload</label>
                <input type="file" ref={addFileRef} accept="image/*" className="form-control" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-control" required value={addForm.name} onChange={(e) => setAddForm({...addForm, name: e.target.value})} placeholder="e.g. John Doe" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-control" required value={addForm.email} onChange={(e) => setAddForm({...addForm, email: e.target.value})} placeholder="e.g. john@domain.com" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Login Password</label>
                  <input type="password" className="form-control" required value={addForm.password} onChange={(e) => setAddForm({...addForm, password: e.target.value})} placeholder="At least 6 characters" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Phone Number</label>
                  <input type="tel" className="form-control" value={addForm.phone} onChange={(e) => setAddForm({...addForm, phone: e.target.value})} placeholder="Mobile phone" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">College Name</label>
                  <input type="text" className="form-control" value={addForm.college} onChange={(e) => setAddForm({...addForm, college: e.target.value})} placeholder="College name" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Department</label>
                  <input type="text" className="form-control" value={addForm.department} onChange={(e) => setAddForm({...addForm, department: e.target.value})} placeholder="e.g. Information Technology" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Branch</label>
                  <select className="form-control" value={addForm.branch} onChange={(e) => setAddForm({...addForm, branch: e.target.value})}>
                    {branches.map(b => (
                      <option key={b._id} value={b.branchName}>{b.branchName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">CourseTrack</label>
                  <select className="form-control" value={addForm.course} onChange={(e) => setAddForm({...addForm, course: e.target.value})}>
                    <option value="MERN Stack">MERN Stack</option>
                    <option value="Python">Python</option>
                    <option value="AI & ML">AI & ML</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Batch</label>
                  <select className="form-control" value={addForm.batch} onChange={(e) => setAddForm({...addForm, batch: e.target.value})}>
                    <option value="2023-25">2023-25</option>
                    <option value="2024-26">2024-26</option>
                    <option value="2025-27">2025-27</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-control" value={addForm.startDate} onChange={(e) => setAddForm({...addForm, startDate: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-control" value={addForm.endDate} onChange={(e) => setAddForm({...addForm, endDate: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Duration</label>
                  <input type="text" className="form-control" value={addForm.internshipDuration} onChange={(e) => setAddForm({...addForm, internshipDuration: e.target.value})} placeholder="e.g. 3 Months" />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ height: '46px', marginTop: '10px' }} disabled={formLoading}>
                {formLoading ? 'Registering Intern...' : 'Save Student'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 2. EDIT STUDENT MODAL FORM             */}
      {/* ======================================= */}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }}>
          <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '650px', background: 'var(--bg-secondary)', overflowY: 'auto', maxHeight: '90vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
              <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)' }}>Edit Student Record</h2>
              <button onClick={() => setShowEditModal(false)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Close</button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Update Profile Photo</label>
                <input type="file" ref={editFileRef} accept="image/*" className="form-control" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-control" required value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-control" required value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Phone Number</label>
                  <input type="tel" className="form-control" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Internship Status</label>
                  <select className="form-control" value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">College Name</label>
                  <input type="text" className="form-control" value={editForm.college} onChange={(e) => setEditForm({...editForm, college: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Department</label>
                  <input type="text" className="form-control" value={editForm.department} onChange={(e) => setEditForm({...editForm, department: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Branch</label>
                  <select className="form-control" value={editForm.branch} onChange={(e) => setEditForm({...editForm, branch: e.target.value})}>
                    {branches.map(b => (
                      <option key={b._id} value={b.branchName}>{b.branchName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">CourseTrack</label>
                  <select className="form-control" value={editForm.course} onChange={(e) => setEditForm({...editForm, course: e.target.value})}>
                    <option value="MERN Stack">MERN Stack</option>
                    <option value="Python">Python</option>
                    <option value="AI & ML">AI & ML</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Batch</label>
                  <select className="form-control" value={editForm.batch} onChange={(e) => setEditForm({...editForm, batch: e.target.value})}>
                    <option value="2023-25">2023-25</option>
                    <option value="2024-26">2024-26</option>
                    <option value="2025-27">2025-27</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-control" value={editForm.startDate} onChange={(e) => setEditForm({...editForm, startDate: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-control" value={editForm.endDate} onChange={(e) => setEditForm({...editForm, endDate: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Duration</label>
                  <input type="text" className="form-control" value={editForm.internshipDuration} onChange={(e) => setEditForm({...editForm, internshipDuration: e.target.value})} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ height: '46px', marginTop: '10px' }} disabled={formLoading}>
                {formLoading ? 'Saving changes...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 3. ASSIGN TASK MODAL FORM               */}
      {/* ======================================= */}
      {showAssignModal && selectedStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
              <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }}>Assign Task to {selectedStudent.name}</h2>
              <button onClick={() => setShowAssignModal(false)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Close</button>
            </div>

            <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Task Title</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  placeholder="e.g. Implement MongoDB Schema validations"
                  value={taskForm.title} 
                  onChange={(e) => setTaskForm({...taskForm, title: e.target.value})} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Task Description</label>
                <textarea 
                  className="form-control" 
                  rows="4"
                  placeholder="Provide detailed instructions..."
                  value={taskForm.description} 
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Due Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    required 
                    value={taskForm.dueDate} 
                    onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})} 
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Priority</label>
                  <select className="form-control" value={taskForm.priority} onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ height: '46px', marginTop: '10px' }} disabled={formLoading}>
                {formLoading ? 'Assigning task...' : 'Assign Task'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 4. VIEW LOGS DETAILS MODAL FORM         */}
      {/* ======================================= */}
      {showViewModal && selectedStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '750px', background: 'var(--bg-secondary)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff' }}>
                  {selectedStudent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }}>{selectedStudent.name}</h2>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{selectedStudent.email}</span>
                </div>
              </div>
              <button onClick={() => setShowViewModal(false)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Close</button>
            </div>

            {/* Inspect Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', marginBottom: '20px' }}>
              {['profile', 'attendance', 'submissions'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setStudentDetailsTab(tab)}
                  style={{
                    padding: '10px 18px',
                    background: 'none',
                    border: 'none',
                    color: studentDetailsTab === tab ? '#fff' : 'var(--text-muted)',
                    borderBottom: studentDetailsTab === tab ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    cursor: 'pointer',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {detailsLoading ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>Loading student history metrics...</p>
            ) : (
              <div style={{ minHeight: '250px' }}>
                
                {/* PROFILE TAB */}
                {studentDetailsTab === 'profile' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '0.95rem' }}>
                    <div><strong style={{ color: 'var(--text-muted)' }}>College:</strong><p style={{ marginTop: '3px' }}>{selectedStudent.college || 'N/A'}</p></div>
                    <div><strong style={{ color: 'var(--text-muted)' }}>Department:</strong><p style={{ marginTop: '3px' }}>{selectedStudent.department || 'N/A'}</p></div>
                    <div><strong style={{ color: 'var(--text-muted)' }}>College Branch:</strong><p style={{ marginTop: '3px' }}>{selectedStudent.branch || 'N/A'}</p></div>
                    <div><strong style={{ color: 'var(--text-muted)' }}>Course Track:</strong><p style={{ marginTop: '3px' }}>{selectedStudent.course || 'N/A'}</p></div>
                    <div><strong style={{ color: 'var(--text-muted)' }}>Batch:</strong><p style={{ marginTop: '3px' }}>{selectedStudent.batch || 'N/A'}</p></div>
                    <div><strong style={{ color: 'var(--text-muted)' }}>Phone Number:</strong><p style={{ marginTop: '3px' }}>{selectedStudent.phone || 'N/A'}</p></div>
                    <div><strong style={{ color: 'var(--text-muted)' }}>Start Date:</strong><p style={{ marginTop: '3px' }}>{selectedStudent.startDate ? new Date(selectedStudent.startDate).toLocaleDateString() : 'N/A'}</p></div>
                    <div><strong style={{ color: 'var(--text-muted)' }}>End Date:</strong><p style={{ marginTop: '3px' }}>{selectedStudent.endDate ? new Date(selectedStudent.endDate).toLocaleDateString() : 'N/A'}</p></div>
                    <div><strong style={{ color: 'var(--text-muted)' }}>Internship Duration:</strong><p style={{ marginTop: '3px' }}>{selectedStudent.internshipDuration || 'N/A'}</p></div>
                    <div><strong style={{ color: 'var(--text-muted)' }}>Status:</strong><p style={{ marginTop: '3px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>{selectedStudent.status}</p></div>
                  </div>
                )}

                {/* ATTENDANCE HISTORY TAB */}
                {studentDetailsTab === 'attendance' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span>Overall Rate: <strong style={{ color: 'var(--color-success)' }}>{selectedStudent.attendancePercentage}%</strong></span>
                      <span>Total Logged: <strong>{selectedStudentHistory.length} Days</strong></span>
                    </div>

                    {selectedStudentHistory.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', paddingTop: '40px' }}>No logs found for this student.</p>
                    ) : (
                      <div style={{ maxHeight: '250px', overflowY: 'auto' }} className="table-container">
                        <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Check-In</th>
                              <th>Check-Out</th>
                              <th>Status</th>
                              <th>Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedStudentHistory.map(row => (
                              <tr key={row._id}>
                                <td>{row.date}</td>
                                <td>{row.checkIn || '-'}</td>
                                <td>{row.checkOut || '-'}</td>
                                <td>
                                  <span className={`badge ${row.status === 'present' ? 'badge-success' : row.status === 'late' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.62rem', textTransform: 'capitalize' }}>
                                    {row.status}
                                  </span>
                                </td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{row.remarks || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* TASK SUBMISSIONS TAB */}
                {studentDetailsTab === 'submissions' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span>Completion Rate: <strong style={{ color: 'var(--color-info)' }}>{selectedStudent.taskCompletionPercentage}%</strong></span>
                      <span>Total Submitted: <strong>{selectedStudentSubmissions.length}</strong></span>
                    </div>

                    {selectedStudentSubmissions.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', paddingTop: '40px' }}>No solutions submitted yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '250px', overflowY: 'auto' }}>
                        {selectedStudentSubmissions.map(sub => (
                          <div key={sub._id} style={{ padding: '12px', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.01)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                              <strong>{sub.taskId?.title || 'Unknown Task'}</strong>
                              <span className={`badge ${sub.status === 'approved' ? 'badge-success' : sub.status === 'rejected' ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: '0.65rem', textTransform: 'capitalize' }}>
                                {sub.status}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', background: 'rgba(0,0,0,0.15)', padding: '8px', borderRadius: '4px', marginBottom: '8px' }}>
                              {sub.submissionText}
                            </p>
                            {sub.githubLink && (
                              <a href={sub.githubLink} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', display: 'block', marginBottom: '6px' }}>
                                🔗 GitHub Link: {sub.githubLink}
                              </a>
                            )}
                            {sub.adminFeedback && (
                              <p style={{ fontSize: '0.8rem', color: 'var(--color-warning)' }}>
                                <strong>Feedback:</strong> {sub.adminFeedback}
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
        </div>
      )}
    </div>
  );
}
