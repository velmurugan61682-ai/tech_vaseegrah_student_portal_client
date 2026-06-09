import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function StudentAttendance() {
  const { user, apiCall } = useAuth();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ totalDays: 0, presentDays: 0, percent: 100 });
  const [loading, setLoading] = useState(true);
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await apiCall(`/attendance/student/${user._id}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
        setStats({
          totalDays: data.totalDays,
          presentDays: data.presentDays,
          percent: data.attendancePercentage
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const changeMonth = (offset) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  // Days in month
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const daysInMonth = getDaysInMonth(year, month);

  // First day of month index (0 = Sunday, 6 = Saturday)
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Create calendar cells array
  const cells = [];

  // Previous month padding cells
  const prevMonthDays = getDaysInMonth(year, month - 1);
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    cells.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
      dateString: null
    });
  }

  // Current month cells
  for (let d = 1; d <= daysInMonth; d++) {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({
      day: d,
      isCurrentMonth: true,
      dateString: formattedDate
    });
  }

  // Next month padding cells to make grid multiple of 7
  const remainingCells = 42 - cells.length; // standard 6-row grid
  for (let i = 1; i <= remainingCells; i++) {
    cells.push({
      day: i,
      isCurrentMonth: false,
      dateString: null
    });
  }

  // Map history logs by date for O(1) lookup in render
  const historyMap = {};
  history.forEach(record => {
    historyMap[record.date] = record.status;
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Attendance History</h1>
        <p style={{ color: 'var(--text-muted)' }}>Keep track of your daily attendance and metrics.</p>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Attendance Rate</span>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-success)' }}>
            {loading ? '...' : `${stats.percent}%`}
          </span>
        </div>
        
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Present Days</span>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
            {loading ? '...' : stats.presentDays}
          </span>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Absent Days</span>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-danger)' }}>
            {loading ? '...' : (stats.totalDays - stats.presentDays)}
          </span>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Logged Days</span>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
            {loading ? '...' : stats.totalDays}
          </span>
        </div>
      </div>

      {/* Interactive Calendar Widget */}
      <div className="glass-card">
        {/* Calendar Nav Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)' }}>
            {monthNames[month]} {year}
          </h2>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => changeMonth(-1)} style={{ padding: '6px 12px' }}>
              &larr; Prev
            </button>
            <button className="btn btn-secondary" onClick={() => changeMonth(1)} style={{ padding: '6px 12px' }}>
              Next &rarr;
            </button>
          </div>
        </div>

        {/* Week Day headers */}
        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="calendar-day-header">
              {day}
            </div>
          ))}

          {/* Day Grid Cells */}
          {cells.map((cell, idx) => {
            const status = cell.dateString ? historyMap[cell.dateString] : null;
            let cellClass = 'calendar-day-cell';
            if (cell.isCurrentMonth) cellClass += ' current-month';
            if (status === 'present') cellClass += ' present';
            if (status === 'absent') cellClass += ' absent';

            // Highlight today
            const todayStr = new Date().toISOString().split('T')[0];
            const isToday = cell.dateString === todayStr;
            if (isToday) cellClass += ' today';

            return (
              <div key={idx} className={cellClass}>
                <span className="calendar-day-label">{cell.day}</span>
                {status && (
                  <span className={`calendar-status-dot ${status === 'present' ? 'present' : 'absent'}`} />
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '20px', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />
            <span>Present</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-danger)' }} />
            <span>Absent</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', border: '1px solid var(--accent-primary)', backgroundColor: 'rgba(99, 102, 241, 0.05)' }} />
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* Attendance Raw Log Table */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>All Logged Entries</h3>
        
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading logs...</p>
        ) : history.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No logs found. Mark attendance to get started.</p>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Method</th>
                  <th>Logged At</th>
                </tr>
              </thead>
              <tbody>
                {history.map(record => (
                  <tr key={record._id}>
                    <td style={{ fontWeight: '500' }}>{record.date}</td>
                    <td>
                      <span className={`badge ${record.status === 'present' ? 'badge-success' : 'badge-danger'}`}>
                        {record.status}
                      </span>
                    </td>
                    <td>{record.markedByStudent ? 'Self Checked-in' : 'Admin Assigned'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(record.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
