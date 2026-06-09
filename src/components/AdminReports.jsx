import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminReports() {
  const { apiCall } = useAuth();
  
  const [activeTab, setActiveTab] = useState('attendance'); // attendance / performance / activity
  const [attendanceReport, setAttendanceReport] = useState([]);
  const [performanceReport, setPerformanceReport] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch attendance report
      const attRes = await apiCall('/attendance/report');
      let attData = [];
      if (attRes.ok) {
        const data = await attRes.json();
        attData = data.report || [];
        setAttendanceReport(attData);
      }

      // 2. Fetch all tasks to compute course-wise performance
      const tasksRes = await apiCall('/tasks');
      let allTasks = [];
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        allTasks = data.tasks || [];
      }

      // 3. For each student, compute task statistics
      // We will fetch submissions for each student
      const perfData = [];
      const activityData = [];
      
      for (const student of attData) {
        const subsRes = await apiCall(`/submissions/student/${student._id}`);
        if (subsRes.ok) {
          const subsData = await subsRes.json();
          const subs = subsData.submissions || [];
          
          // Calculate stats
          const totalSubmissions = subs.length;
          const approvedCount = subs.filter(s => s.status === 'approved').length;
          const rejectedCount = subs.filter(s => s.status === 'rejected').length;
          const pendingCount = subs.filter(s => s.status === 'pending').length;

          // Find tasks that apply to this student
          const studentTasks = allTasks.filter(task => {
            return (
              task.assignedTo === 'all' ||
              (task.assignedTo === 'course' && task.course === student.course) ||
              (task.assignedTo === 'student' && task.studentId?._id === student._id)
            );
          });

          const totalAssigned = studentTasks.length;
          const completionRate = totalAssigned > 0 
            ? Math.round((approvedCount / totalAssigned) * 100) 
            : 100;

          perfData.push({
            ...student,
            totalAssigned,
            totalSubmissions,
            approvedCount,
            rejectedCount,
            pendingCount,
            completionRate
          });

          // Compile activity logs
          subs.forEach(sub => {
            activityData.push({
              studentName: student.name,
              course: student.course,
              type: 'Submission',
              title: `Submitted task: "${sub.taskId?.title || 'Daily Task'}"`,
              status: sub.status,
              time: new Date(sub.submittedAt)
            });
          });
        }
      }

      setPerformanceReport(perfData);

      // Add attendance check-ins to activity logs
      // Let's query today's attendance to get today's check-ins
      const todayAttRes = await apiCall('/attendance/today');
      if (todayAttRes.ok) {
        const todayAttData = await todayAttRes.json();
        todayAttData.list.forEach(item => {
          if (item.attendance.status !== 'unmarked') {
            activityData.push({
              studentName: item.name,
              course: item.course,
              type: 'Attendance',
              title: `Checked in as "${item.attendance.status}"`,
              status: item.attendance.status === 'present' ? 'approved' : 'rejected',
              time: new Date(item.attendance.markedAt)
            });
          }
        });
      }

      // Sort activities by time descending
      activityData.sort((a, b) => b.time - a.time);
      setActivityLog(activityData.slice(0, 30)); // Take last 30 activities

    } catch (error) {
      console.error('Error generating reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab]);

  // Course aggregate metrics
  const coursePerformanceStats = () => {
    const courses = ['Java', 'Python', 'MERN Stack', 'AI & ML'];
    return courses.map(course => {
      const courseStudents = performanceReport.filter(s => s.course === course);
      const studentCount = courseStudents.length;
      
      const avgAttendance = studentCount > 0 
        ? Math.round(courseStudents.reduce((acc, curr) => acc + curr.percentage, 0) / studentCount)
        : 100;

      const avgTaskCompletion = studentCount > 0
        ? Math.round(courseStudents.reduce((acc, curr) => acc + curr.completionRate, 0) / studentCount)
        : 100;

      return {
        course,
        studentCount,
        avgAttendance,
        avgTaskCompletion
      };
    });
  };

  const handleExportCSV = () => {
    let headers = [];
    let rows = [];
    let filename = '';

    if (activeTab === 'attendance') {
      headers = ['Name', 'Email', 'Course', 'Branch', 'Batch', 'Total Logged', 'Present Days', 'Absent Days', 'Percentage'];
      rows = attendanceReport.map(r => [
        `"${r.name}"`, `"${r.email}"`, `"${r.course}"`, `"${r.branch}"`, `"${r.batch}"`,
        r.totalMarked, r.presentCount, r.absentCount, `"${r.percentage}%"`
      ]);
      filename = 'Intern_Attendance_Summary_Report.csv';
    } else if (activeTab === 'performance') {
      headers = ['Name', 'Email', 'Course', 'Assigned Tasks', 'Solutions Filed', 'Approved Tasks', 'Completion Rate'];
      rows = performanceReport.map(r => [
        `"${r.name}"`, `"${r.email}"`, `"${r.course}"`, r.totalAssigned, r.totalSubmissions, r.approvedCount, `"${r.completionRate}%"`
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

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Reports & Analytics</h1>
          <p style={{ color: 'var(--text-muted)' }}>Aggregate analytics, course tracks, and daily activity logs.</p>
        </div>

        {activeTab !== 'activity' && (
          <button onClick={handleExportCSV} className="btn btn-primary" disabled={loading}>
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
            onClick={() => setActiveTab(tab.id)}
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
        <p style={{ color: 'var(--text-muted)' }}>Compiling reports data...</p>
      ) : (
        <div className="fade-in">
          
          {/* TAB: ATTENDANCE SUMMARY */}
          {activeTab === 'attendance' && (
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
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceReport.map(row => (
                      <tr key={row._id}>
                        <td style={{ fontWeight: '500' }}>{row.name}</td>
                        <td>{row.course}</td>
                        <td>{row.totalMarked} days</td>
                        <td style={{ color: 'var(--color-success)' }}>{row.presentCount}</td>
                        <td style={{ color: 'var(--color-danger)' }}>{row.absentCount}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: '600' }}>{row.percentage}%</span>
                            <div style={{ width: '60px', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${row.percentage}%`, height: '100%', backgroundColor: row.percentage > 75 ? 'var(--color-success)' : 'var(--color-warning)', borderRadius: '3' }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: PERFORMANCE ANALYTICS */}
          {activeTab === 'performance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* Course aggregations */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                {coursePerformanceStats().map(stat => (
                  <div key={stat.course} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span className="badge badge-info" style={{ alignSelf: 'flex-start' }}>{stat.course}</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Interns:</span>
                      <strong style={{ color: '#fff' }}>{stat.studentCount}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Avg Attendance:</span>
                      <strong style={{ color: 'var(--color-success)' }}>{stat.avgAttendance}%</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Avg Task Rate:</span>
                      <strong style={{ color: 'var(--color-warning)' }}>{stat.avgTaskCompletion}%</strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* Student-wise performance table */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Student Performance Metrics</h3>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Intern Name</th>
                        <th>Course</th>
                        <th>Assigned Tasks</th>
                        <th>Solutions Filed</th>
                        <th>Approved Tasks</th>
                        <th>Completion Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceReport.map(row => (
                        <tr key={row._id}>
                          <td style={{ fontWeight: '500' }}>{row.name}</td>
                          <td>{row.course}</td>
                          <td>{row.totalAssigned}</td>
                          <td>{row.totalSubmissions}</td>
                          <td style={{ color: 'var(--color-success)' }}>{row.approvedCount}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: '600' }}>{row.completionRate}%</span>
                              <div style={{ width: '60px', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${row.completionRate}%`, height: '100%', background: 'var(--accent-gradient)', borderRadius: '3px' }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB: ACTIVITY LOGS */}
          {activeTab === 'activity' && (
            <div className="glass-card">
              <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Daily Live Activity Feed</h3>
              
              {activityLog.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No activities logged today.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {activityLog.map((act, idx) => (
                    <div 
                      key={idx} 
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
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          backgroundColor: act.type === 'Submission' ? 'var(--color-warning)' : 'var(--color-success)'
                        }} />
                        <div>
                          <p style={{ fontSize: '0.92rem', fontWeight: '500', color: '#fff', marginBottom: '2px' }}>
                            {act.studentName} <span style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>({act.course})</span>
                          </p>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{act.title}</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className={`badge ${act.status === 'approved' ? 'badge-success' : act.status === 'rejected' ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: '0.62rem' }}>
                          {act.status}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-dark)' }}>
                          {act.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
