import { DarkInput, DarkSelect, DarkSearch } from './DarkControls';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminAttendance() {
  const { apiCall } = useAuth();
  
  // Default to local date YYYY-MM-DD
  const getLocalDateStr = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - (offset * 60 * 1000));
    return local.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getLocalDateStr());
  const [list, setList] = useState([]);
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await apiCall(`/attendance/all?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        const studentsList = data.list || data.data || [];
        setList(studentsList);

        // Calculate summary
        const total = studentsList.length;
        const presentCount = studentsList.filter(item => item.status === 'present' || item.status === 'late').length;
        const absentCount = studentsList.filter(item => item.status === 'absent').length;
        setSummary({
          total,
          present: presentCount,
          absent: total - presentCount
        });
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const handleStatusUpdate = async (studentId, newStatus) => {
    try {
      setUpdatingId(studentId);
      const res = await apiCall('/attendance/update', {
        method: 'PUT',
        body: JSON.stringify({
          studentId,
          date: selectedDate,
          status: newStatus
        })
      });
      if (res.ok) {
        fetchAttendance(); // Reload list
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to update attendance');
      }
    } catch (error) {
      alert('Error updating attendance: ' + error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Export today's list as CSV
  const handleExportCSV = () => {
    if (list.length === 0) return;

    const headers = ['Student Name', 'Email', 'Course', 'Branch', 'Batch', 'Attendance Status', 'Marked At'];
    
    const rows = list.map(item => {
      const markedAtTime = item.markedAt 
        ? new Date(item.markedAt).toLocaleTimeString() 
        : 'N/A';
      return [
        `"${item.name}"`,
        `"${item.email}"`,
        `"${item.course}"`,
        `"${item.branch}"`,
        `"${item.batch}"`,
        `"${item.status}"`,
        `"${markedAtTime}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_Report_${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Attendance Board</h1>
        <p style={{ color: 'var(--text-muted)' }}>Inspect daily check-ins, manually override status, and download raw reports.</p>
      </div>

      {/* Date select & Export actions */}
      <div className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Select Date:</label>
          <DarkInput 
            type="date" 
             
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ width: '180px' }}
          />
        </div>

        <button 
          onClick={handleExportCSV} 
          className="btn btn-primary"
          disabled={list.length === 0}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export as CSV
        </button>
      </div>

      {/* Numerical statistics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '16px 20px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total Interns</span>
          <span style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{summary.total}</span>
        </div>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '16px 20px' }}>
          <span style={{ color: 'var(--color-success)', fontSize: '0.8rem' }}>Present / Late Count</span>
          <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--color-success)' }}>{summary.present}</span>
        </div>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '16px 20px' }}>
          <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>Absent / Unmarked</span>
          <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--color-danger)' }}>{summary.absent}</span>
        </div>
      </div>

      {/* Main logs table */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Check-in Records for {selectedDate}</h3>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading records...</p>
        ) : list.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No student records found.</p>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Intern Name</th>
                  <th>Email</th>
                  <th>Course</th>
                  <th>Branch</th>
                  <th>Batch</th>
                  <th>Status Selector</th>
                  <th>Marked At</th>
                </tr>
              </thead>
              <tbody>
                {list.map(item => (
                  <tr key={item._id}>
                    <td style={{ fontWeight: '500' }}>{item.name}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{item.email}</td>
                    <td>{item.course}</td>
                    <td>{item.branch}</td>
                    <td>{item.batch}</td>
                    <td>
                      <DarkSelect
                        disabled={updatingId === item._id}
                        value={item.status}
                        onChange={(e) => handleStatusUpdate(item._id, e.target.value)}
                        
                        style={{ 
                          width: '125px', 
                          padding: '4px 8px', 
                          height: 'auto', 
                          fontSize: '0.82rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: '#fff',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '4px'
                        }}
                      >
                        <option value="unmarked" style={{ background: '#222' }}>Unmarked</option>
                        <option value="present" style={{ background: '#222' }}>Present</option>
                        <option value="absent" style={{ background: '#222' }}>Absent</option>
                        <option value="late" style={{ background: '#222' }}>Late</option>
                      </DarkSelect>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {item.markedAt 
                        ? new Date(item.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                        : 'N/A'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
