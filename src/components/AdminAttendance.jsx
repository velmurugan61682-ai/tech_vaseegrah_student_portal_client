import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as branchService from '../services/branchService';
import * as attendanceService from '../services/attendanceService';
import { DarkInput, DarkSelect } from './DarkControls';

export default function AdminAttendance() {
  const { apiCall, showToast } = useAuth();
  
  // Default to local date YYYY-MM-DD
  const getLocalDateStr = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - (offset * 60 * 1000));
    return local.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getLocalDateStr());
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [students, setStudents] = useState([]);
  const [attendanceStatuses, setAttendanceStatuses] = useState({}); // { studentId: 'Present' | 'Absent' | 'Late' }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch branches on mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await branchService.getBranches();
        if (res.success) {
          const list = res.branches || res.data || [];
          setBranches(list);
          if (list.length > 0) {
            setSelectedBranchId(list[0]._id);
          }
        }
      } catch (err) {
        console.error('Error fetching branches:', err);
        showToast('Failed to load branches', 'danger');
      }
    };
    fetchBranches();
  }, []);

  // Fetch students of the selected branch and their existing attendance for selected date
  const fetchBranchAttendanceData = async () => {
    if (!selectedBranchId) return;
    
    try {
      setLoading(true);
      // 1. Fetch all students belonging to the selected branch
      const studentsRes = await apiCall(`/students/branch/${selectedBranchId}`);
      
      // 2. Fetch existing attendance records for the selected date and branch
      const attendanceRes = await attendanceService.getAttendanceByDate(selectedDate, selectedBranchId);

      if (studentsRes.ok && attendanceRes.success) {
        const branchStudents = studentsRes.data.students || studentsRes.data.data || [];
        const existingRecords = attendanceRes.records || attendanceRes.data || [];

        setStudents(branchStudents);

        // Map existing attendance statuses
        const initialStatuses = {};
        branchStudents.forEach(student => {
          // Find if there is an existing attendance record for this student
          const matchedRecord = existingRecords.find(r => r.studentId?._id === student._id || r.studentId === student._id);
          // Default to 'Present' if no record exists
          initialStatuses[student._id] = matchedRecord ? matchedRecord.status : 'Present';
        });
        setAttendanceStatuses(initialStatuses);
      } else {
        showToast('Failed to retrieve branch student registry', 'danger');
      }
    } catch (err) {
      console.error('Error fetching branch attendance:', err);
      showToast('Error fetching attendance data', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranchAttendanceData();
  }, [selectedBranchId, selectedDate]);

  // Update status for a specific student locally in state
  const handleStatusChange = (studentId, newStatus) => {
    setAttendanceStatuses(prev => ({
      ...prev,
      [studentId]: newStatus
    }));
  };

  // Submit bulk attendance marking
  const handleSaveAttendance = async () => {
    if (!selectedBranchId || students.length === 0) return;
    
    setSaving(true);
    try {
      // Construct payload array
      const recordsPayload = students.map(student => ({
        studentId: student._id,
        status: attendanceStatuses[student._id] || 'Present'
      }));

      const res = await apiCall('/attendance/mark', {
        method: 'POST',
        body: JSON.stringify({
          branchId: selectedBranchId,
          date: selectedDate,
          records: recordsPayload
        })
      });

      if (res.ok) {
        showToast('Branch attendance saved successfully!', 'success');
        fetchBranchAttendanceData(); // Reload
      } else {
        const data = await res.json();
        showToast(data.message || 'Failed to save attendance', 'danger');
      }
    } catch (err) {
      console.error('Error saving attendance:', err);
      showToast('Connection error saving attendance', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const getBranchName = () => {
    const br = branches.find(b => b._id === selectedBranchId);
    return br ? br.branchName : '';
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Branch Attendance Board
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Select branch, review interns roster, set status, and lock daily records.</p>
      </div>

      {/* Select Controls Card */}
      <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Select Branch:</label>
          <DarkSelect 
            value={selectedBranchId} 
            onChange={(e) => setSelectedBranchId(e.target.value)}
          >
            {branches.length === 0 ? (
              <option value="">No branches configured</option>
            ) : (
              branches.map(b => (
                <option key={b._id} value={b._id}>{b.branchName}</option>
              ))
            )}
          </DarkSelect>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Select Date:</label>
          <DarkInput 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px 20px', borderLeft: '4px solid var(--accent-primary)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Branch Students</span>
          <span style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{students.length}</span>
        </div>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px 20px', borderLeft: '4px solid #10b981' }}>
          <span style={{ color: '#10b981', fontSize: '0.8rem' }}>Present Count</span>
          <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981' }}>
            {Object.values(attendanceStatuses).filter(v => v === 'Present').length}
          </span>
        </div>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px 20px', borderLeft: '4px solid #ef4444' }}>
          <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>Absent Count</span>
          <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ef4444' }}>
            {Object.values(attendanceStatuses).filter(v => v === 'Absent').length}
          </span>
        </div>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px 20px', borderLeft: '4px solid #f59e0b' }}>
          <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>Late Count</span>
          <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#f59e0b' }}>
            {Object.values(attendanceStatuses).filter(v => v === 'Late').length}
          </span>
        </div>
      </div>

      {/* Roster Listing */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>
            Attendance Roster: {getBranchName() || 'No Branch'}
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Date: {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '50px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ width: '30px', height: '30px', border: '2px solid var(--glass-border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px auto' }} />
            <p>Retrieving branch roster...</p>
          </div>
        ) : students.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No student records registered under {getBranchName() || 'this branch'}.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Branch</th>
                    <th style={{ width: '320px', textAlign: 'center' }}>Status Selector</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => {
                    const currentStatus = attendanceStatuses[student._id] || 'Present';
                    return (
                      <tr key={student._id}>
                        <td style={{ fontWeight: '600', fontSize: '0.98rem' }}>{student.name}</td>
                        <td style={{ color: 'var(--text-muted)', fontWeight: '500' }}>{getBranchName()}</td>
                        <td>
                          {/* Segmented Selector Buttons */}
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            {[
                              { label: 'Present', color: '#10b981', glow: 'rgba(16, 185, 129, 0.25)' },
                              { label: 'Absent', color: '#ef4444', glow: 'rgba(239, 68, 68, 0.25)' },
                              { label: 'Late', color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.25)' }
                            ].map(btn => {
                              const isSelected = currentStatus === btn.label;
                              return (
                                <button
                                  key={btn.label}
                                  type="button"
                                  onClick={() => handleStatusChange(student._id, btn.label)}
                                  style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid',
                                    borderColor: isSelected ? btn.color : 'var(--glass-border)',
                                    background: isSelected ? btn.glow : 'rgba(255, 255, 255, 0.02)',
                                    color: isSelected ? '#fff' : 'var(--text-muted)',
                                    fontWeight: isSelected ? '700' : '500',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: isSelected ? `0 0 10px ${btn.glow}` : 'none',
                                    textShadow: isSelected ? '0 0 4px #fff' : 'none'
                                  }}
                                >
                                  {btn.label}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
              <button
                onClick={handleSaveAttendance}
                disabled={saving}
                className="btn btn-primary"
                style={{ 
                  padding: '12px 30px', 
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  boxShadow: 'var(--shadow-glow)',
                  letterSpacing: '0.02em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {saving ? (
                  <>
                    <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Saving Records...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    Save Attendance
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
