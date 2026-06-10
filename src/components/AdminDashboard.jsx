import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { apiCall } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    tasksSubmittedToday: 0
  });

  const [courseCounts, setCourseCounts] = useState({});
  const [branchCounts, setBranchCounts] = useState({});
  const [todayAttendanceList, setTodayAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await apiCall('/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        
        // Handle stats structure
        const returnedStats = data.stats || data;
        setStats({
          totalStudents: returnedStats.totalInterns || 0,
          presentToday: returnedStats.todayPresent || 0,
          absentToday: returnedStats.todayAbsent || 0,
          tasksSubmittedToday: returnedStats.tasksSubmittedToday || 0
        });

        setCourseCounts(returnedStats.byCourse || {});
        setBranchCounts(returnedStats.byBranch || {});
        setTodayAttendanceList(data.todayAttendanceList || []);
      }
    } catch (error) {
      console.error('Error fetching admin dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const maxCourseCount = Math.max(...Object.values(courseCounts), 1);
  const maxBranchCount = Math.max(...Object.values(branchCounts), 1);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Overview of intern registrations, attendance, and tasks activity.</p>
      </div>

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ marginBottom: '10px' }}></div>
          <p>Loading stats...</p>
        </div>
      ) : (
        <>
          {/* Numerical Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Registered Interns</span>
              <span style={{ fontSize: '2.4rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                {stats.totalStudents}
              </span>
            </div>
            
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Today's Present Count</span>
              <span style={{ fontSize: '2.4rem', fontWeight: 'bold', color: 'var(--color-success)' }}>
                {stats.presentToday}
              </span>
            </div>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Today's Absent/Unmarked</span>
              <span style={{ fontSize: '2.4rem', fontWeight: 'bold', color: 'var(--color-danger)' }}>
                {stats.absentToday}
              </span>
            </div>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tasks Submitted Today</span>
              <span style={{ fontSize: '2.4rem', fontWeight: 'bold', color: 'var(--color-warning)' }}>
                {stats.tasksSubmittedToday}
              </span>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
            {/* Course Breakdown */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Students by Course</h3>
              {Object.keys(courseCounts).length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No student records found</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {Object.entries(courseCounts).map(([course, count]) => {
                    const widthPercent = (count / maxCourseCount) * 100;
                    return (
                      <div key={course}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '5px' }}>
                          <span>{course}</span>
                          <span style={{ fontWeight: '600' }}>{count} {count === 1 ? 'intern' : 'interns'}</span>
                        </div>
                        <div style={{ width: '100%', height: '14px', background: 'var(--bg-tertiary)', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{ 
                            width: `${widthPercent}%`, 
                            height: '100%', 
                            background: 'var(--accent-gradient)',
                            borderRadius: '6px',
                            transition: 'width var(--transition-slow)'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Branch Breakdown */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Students by College Branch</h3>
              {Object.keys(branchCounts).length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No student records found</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {Object.entries(branchCounts).map(([branch, count]) => {
                    const widthPercent = (count / maxBranchCount) * 100;
                    return (
                      <div key={branch}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '5px' }}>
                          <span>{branch}</span>
                          <span style={{ fontWeight: '600' }}>{count} {count === 1 ? 'student' : 'students'}</span>
                        </div>
                        <div style={{ width: '100%', height: '14px', background: 'var(--bg-tertiary)', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{ 
                            width: `${widthPercent}%`, 
                            height: '100%', 
                            background: 'linear-gradient(90deg, var(--color-info) 0%, var(--accent-primary) 100%)',
                            borderRadius: '6px',
                            transition: 'width var(--transition-slow)'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Today's Attendance Overview */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Today's Intern Attendance Status</h3>
            {todayAttendanceList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No students registered.</p>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Course</th>
                      <th>Branch</th>
                      <th>Batch</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayAttendanceList.map(intern => {
                      let badgeClass = 'badge-secondary';
                      if (intern.status === 'present') badgeClass = 'badge-success';
                      else if (intern.status === 'absent') badgeClass = 'badge-danger';
                      else if (intern.status === 'late') badgeClass = 'badge-warning';

                      return (
                        <tr key={intern._id}>
                          <td style={{ fontWeight: '500' }}>{intern.name}</td>
                          <td>{intern.course}</td>
                          <td>{intern.branch}</td>
                          <td>{intern.batch}</td>
                          <td>
                            <span className={`badge ${badgeClass}`} style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
                              {intern.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
