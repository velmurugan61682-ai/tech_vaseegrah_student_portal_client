import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminReports() {
  const { apiCall } = useAuth();
  
  const [activeTab, setActiveTab] = useState('attendance'); // attendance / performance / activity
  const [loading, setLoading] = useState(true);

  // States for Tab 1: Attendance Report
  const [attendanceReport, setAttendanceReport] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({ total: 0, avgRate: 0, perfect: 0, atRisk: 0 });

  // States for Tab 2: Performance Analytics
  const [performanceReport, setPerformanceReport] = useState([]);
  const [performanceStats, setPerformanceStats] = useState({ assigned: 0, completed: 0, approved: 0, avgScore: 0 });
  const [courseBreakdown, setCourseBreakdown] = useState([]);

  // States for Tab 3: Activity Logs
  const [activityLog, setActivityLog] = useState([]);
  const [activityStats, setActivityStats] = useState({ loginsToday: 0, submissionsToday: 0, attendanceToday: 0, alertsCount: 0 });
  const [activityFilter, setActivityFilter] = useState('all'); // all / login / tasks / attendance / alerts

  const fetchReports = async () => {
    try {
      setLoading(true);
      if (activeTab === 'attendance') {
        const res = await apiCall('/attendance/report');
        if (res.ok) {
          const data = await res.json();
          setAttendanceReport(data.students || data.data || []);
          setAttendanceStats(data.stats || { total: 0, avgRate: 0, perfect: 0, atRisk: 0 });
        }
      } else if (activeTab === 'performance') {
        const res = await apiCall('/tasks/performance');
        if (res.ok) {
          const data = await res.json();
          setPerformanceReport(data.students || data.data || []);
          setPerformanceStats(data.stats || { assigned: 0, completed: 0, approved: 0, avgScore: 0 });
          setCourseBreakdown(data.courseBreakdown || []);
        }
      } else if (activeTab === 'activity') {
        const res = await apiCall('/logs');
        if (res.ok) {
          const data = await res.json();
          setActivityLog(data.logs || data.data || []);
          setActivityStats(data.stats || { loginsToday: 0, submissionsToday: 0, attendanceToday: 0, alertsCount: 0 });
        }
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab]);

  const handleExportCSV = () => {
    let headers = [];
    let rows = [];
    let filename = '';

    if (activeTab === 'attendance') {
      headers = ['Name', 'Email', 'Course', 'Branch', 'Batch', 'Total Logged', 'Present Days', 'Absent Days', 'Percentage'];
      rows = attendanceReport.map(r => [
        `"${r.name}"`, `"${r.email}"`, `"${r.course}"`, `"${r.branch}"`, `"${r.batch}"`,
        r.totalLogged, r.presentCount, r.absentCount, `"${r.rate}%"`
      ]);
      filename = 'Intern_Attendance_Summary_Report.csv';
    } else if (activeTab === 'performance') {
      headers = ['Name', 'Course', 'Assigned Tasks', 'Solutions Filed', 'Approved Tasks', 'Completion Rate'];
      rows = performanceReport.map(r => [
        `"${r.name}"`, `"${r.course}"`, r.assigned, r.completed, r.approved, `"${r.rate}%"`
      ]);
      filename = 'Intern_Performance_Report.csv';
    }

    if (rows.length === 0) return;

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Activity filter logic
  const filteredLogs = activityLog.filter(log => {
    if (activityFilter === 'all') return true;
    if (activityFilter === 'login') return log.action === 'login';
    if (activityFilter === 'tasks') return ['task_submit', 'task_approved', 'task_rejected'].includes(log.action);
    if (activityFilter === 'attendance') return log.action === 'attendance';
    if (activityFilter === 'alerts') return ['task_rejected', 'deadline_missed', 'absent'].includes(log.action);
    return true;
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Reports & Analytics</h1>
          <p style={{ color: 'var(--text-muted)' }}>Aggregate analytics, course tracks, and daily activity logs.</p>
        </div>

        {activeTab !== 'activity' && (
          <button onClick={handleExportCSV} className="btn btn-primary" disabled={loading || (activeTab === 'attendance' ? attendanceReport.length === 0 : performanceReport.length === 0)}>
            Export to CSV
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)' }}>
        {[
          { id: 'attendance', label: 'Attendance Report' },
          { id: 'performance', label: 'Performance Analytics' },
          { id: 'activity', label: 'Activity Logs' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
            }}
            style={{
              padding: '12px 20px',
              background: 'none',
              border: 'none',
              color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'var(--transition-fast)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ marginBottom: '10px' }}></div>
          <p>Compiling reports data...</p>
        </div>
      ) : (
        <div className="fade-in">
          
          {/* TAB: ATTENDANCE SUMMARY */}
          {activeTab === 'attendance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                <div className="glass-card">
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Students</span>
                  <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff', marginTop: '5px' }}>{attendanceStats.total}</h2>
                </div>
                <div className="glass-card">
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Avg Attendance Rate</span>
                  <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-success)', marginTop: '5px' }}>{attendanceStats.avgRate}%</h2>
                </div>
                <div className="glass-card">
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Perfect Attendance</span>
                  <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-primary)', marginTop: '5px' }}>{attendanceStats.perfect}</h2>
                </div>
                <div className="glass-card">
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Below 75% (At Risk)</span>
                  <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-danger)', marginTop: '5px' }}>{attendanceStats.atRisk}</h2>
                </div>
              </div>

              {/* Table */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Student Attendance Summaries</h3>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Intern Name</th>
                        <th>Course Track</th>
                        <th>Total Logged</th>
                        <th>Present Count</th>
                        <th>Absent Count</th>
                        <th>Attendance Rate</th>
                        <th>Last Seen</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceReport.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                            No data found
                          </td>
                        </tr>
                      ) : (
                        attendanceReport.map(row => {
                          let rateColor = 'var(--color-danger)';
                          if (row.rate >= 90) rateColor = 'var(--color-success)';
                          else if (row.rate >= 75) rateColor = 'var(--color-warning)';
                          
                          let statusBadge = 'badge-success';
                          if (row.status === 'At Risk') statusBadge = 'badge-danger';
                          else if (row.status === 'Inactive') statusBadge = 'badge-secondary';

                          return (
                            <tr key={row._id}>
                              <td style={{ fontWeight: '500' }}>{row.name}</td>
                              <td>{row.course}</td>
                              <td>{row.totalLogged} days</td>
                              <td style={{ color: 'var(--color-success)' }}>{row.presentCount}</td>
                              <td style={{ color: 'var(--color-danger)' }}>{row.absentCount}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontWeight: '600', color: rateColor }}>{row.rate}%</span>
                                  <div style={{ width: '60px', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${row.rate}%`, height: '100%', backgroundColor: rateColor, borderRadius: '3px' }} />
                                  </div>
                                </div>
                              </td>
                              <td>{row.lastSeen ? new Date(row.lastSeen).toLocaleDateString() : 'Never'}</td>
                              <td>
                                <span className={`badge ${statusBadge}`} style={{ fontSize: '0.7rem' }}>
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB: PERFORMANCE ANALYTICS */}
          {activeTab === 'performance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                <div className="glass-card">
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tasks Assigned</span>
                  <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff', marginTop: '5px' }}>{performanceStats.assigned}</h2>
                </div>
                <div className="glass-card">
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Solutions Filed</span>
                  <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-info)', marginTop: '5px' }}>{performanceStats.completed}</h2>
                </div>
                <div className="glass-card">
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Approved Tasks</span>
                  <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-success)', marginTop: '5px' }}>{performanceStats.approved}</h2>
                </div>
                <div className="glass-card">
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Avg Score %</span>
                  <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-warning)', marginTop: '5px' }}>{performanceStats.avgScore}%</h2>
                </div>
              </div>

              {/* Leaderboard and Breakdown side-by-side */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                {/* Leaderboard */}
                <div className="glass-card">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Top Performing Interns</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {[...performanceReport]
                      .sort((a, b) => b.rate - a.rate)
                      .slice(0, 5)
                      .map((row, idx) => {
                        let statusBadge = 'badge-success';
                        if (row.rate < 50) statusBadge = 'badge-danger';
                        else if (row.rate < 75) statusBadge = 'badge-warning';

                        return (
                          <div key={row._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontWeight: 'bold', color: 'var(--text-muted)', width: '20px' }}>#{idx + 1}</span>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>
                                {row.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{row.name}</strong>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.course}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span className={`badge ${statusBadge}`} style={{ fontSize: '0.65rem' }}>{row.rate}% Completion</span>
                            </div>
                          </div>
                        );
                      })}
                    {performanceReport.length === 0 && (
                      <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No student records found</p>
                    )}
                  </div>
                </div>

                {/* Course Breakdown */}
                <div className="glass-card">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Course Track Aggregations</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {courseBreakdown.map(cb => (
                      <div key={cb.course}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '5px' }}>
                          <span>{cb.course}</span>
                          <span style={{ fontWeight: '600' }}>{cb.rate}% rate ({cb.approved}/{cb.assigned})</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${cb.rate}%`, height: '100%', background: 'var(--accent-gradient)', borderRadius: '4px' }} />
                        </div>
                      </div>
                    ))}
                    {courseBreakdown.length === 0 && (
                      <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No course breakdown available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Student Performance Table */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Student Performance Metrics</h3>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Intern Name</th>
                        <th>Course</th>
                        <th>Assigned Tasks</th>
                        <th>Solutions Filed</th>
                        <th>Approved Tasks</th>
                        <th>Completion Rate</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceReport.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                            No data found
                          </td>
                        </tr>
                      ) : (
                        performanceReport.map((row, idx) => {
                          let status = 'Excellent';
                          let statusClass = 'badge-success';
                          if (row.rate < 50) {
                            status = 'Needs Attention';
                            statusClass = 'badge-danger';
                          } else if (row.rate < 75) {
                            status = 'Average';
                            statusClass = 'badge-warning';
                          }

                          return (
                            <tr key={row._id}>
                              <td>{idx + 1}</td>
                              <td style={{ fontWeight: '500' }}>{row.name}</td>
                              <td>{row.course}</td>
                              <td>{row.assigned}</td>
                              <td>{row.completed}</td>
                              <td style={{ color: 'var(--color-success)' }}>{row.approved}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontWeight: '600' }}>{row.rate}%</span>
                                  <div style={{ width: '60px', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${row.rate}%`, height: '100%', background: 'var(--accent-gradient)', borderRadius: '3px' }} />
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className={`badge ${statusClass}`} style={{ fontSize: '0.7rem' }}>
                                  {status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB: ACTIVITY LOGS */}
          {activeTab === 'activity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                <div className="glass-card">
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Logins Today</span>
                  <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-success)', marginTop: '5px' }}>{activityStats.loginsToday}</h2>
                </div>
                <div className="glass-card">
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tasks Submitted Today</span>
                  <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-primary)', marginTop: '5px' }}>{activityStats.submissionsToday}</h2>
                </div>
                <div className="glass-card">
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Attendance Marked Today</span>
                  <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-info)', marginTop: '5px' }}>{activityStats.attendanceToday}</h2>
                </div>
                <div className="glass-card">
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Alerts Today</span>
                  <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-danger)', marginTop: '5px' }}>{activityStats.alertsCount}</h2>
                </div>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'All Activities' },
                  { id: 'login', label: 'Logins' },
                  { id: 'tasks', label: 'Task Activities' },
                  { id: 'attendance', label: 'Attendance' },
                  { id: 'alerts', label: 'Alerts' }
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setActivityFilter(filter.id)}
                    className={`btn ${activityFilter === filter.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Live activity feed */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Daily Live Activity Feed</h3>
                
                {filteredLogs.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No activities logged for this filter.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {filteredLogs.map((act) => {
                      let dotColor = 'var(--color-info)';
                      if (act.action === 'login' || act.action === 'attendance') dotColor = 'var(--color-success)';
                      else if (act.action === 'task_submit' || act.action === 'task_approved') dotColor = 'var(--accent-primary)';
                      else if (act.action === 'task_rejected' || act.action === 'absent') dotColor = 'var(--color-danger)';
                      else if (act.action === 'deadline_missed') dotColor = 'var(--color-warning)';

                      let statusClass = 'badge-info';
                      if (act.action === 'task_approved') statusClass = 'badge-success';
                      else if (act.action === 'task_rejected' || act.action === 'absent') statusClass = 'badge-danger';
                      else if (act.action === 'login') statusClass = 'badge-info';
                      else if (act.action === 'attendance') statusClass = 'badge-success';

                      return (
                        <div 
                          key={act._id} 
                          style={{ 
                            padding: '14px 16px', 
                            border: '1px solid var(--glass-border)', 
                            borderRadius: 'var(--radius-md)', 
                            background: 'rgba(255,255,255,0.01)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '15px',
                            flexWrap: 'wrap'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ 
                              width: '10px', 
                              height: '10px', 
                              borderRadius: '50%', 
                              backgroundColor: dotColor
                            }} />
                            <div>
                              <p style={{ fontSize: '0.92rem', fontWeight: '500', color: '#fff', marginBottom: '2px' }}>
                                {act.studentName} <span style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>({act.course})</span>
                              </p>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{act.details || act.action}</span>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span className={`badge ${statusClass}`} style={{ fontSize: '0.62rem', textTransform: 'capitalize' }}>
                              {act.action.replace('_', ' ')}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-dark)' }}>
                              {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
}
