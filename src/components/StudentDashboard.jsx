import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// CountUp component to animate stats
function CountUp({ end, duration = 1000, prefix = '', suffix = '' }) {
  const [value, setValue] = useState(() => {
    const target = parseFloat(end);
    return isNaN(target) ? end : 0;
  });

  useEffect(() => {
    const target = parseFloat(end);
    if (isNaN(target)) return;

    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // cubic ease out
      
      const current = easeProgress * target;
      if (Number.isInteger(target)) {
        setValue(Math.floor(current));
      } else {
        setValue(current.toFixed(1));
      }

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setValue(target);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span>{prefix}{value}{suffix}</span>;
}

export default function StudentDashboard({ setActiveTab }) {
  const { user, apiCall } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState('unmarked');
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [attendancePercent, setAttendancePercent] = useState(100);
  const [taskCompletionRate, setTaskCompletionRate] = useState(0);
  const [marking, setMarking] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      
      // 1. Fetch dashboard metrics
      const res = await apiCall('/student/dashboard');
      if (res.ok) {
        const data = await res.json();
        const metrics = data.data || data;
        setPendingTasksCount(metrics.pendingTasks || 0);
        setAttendancePercent(metrics.attendanceRate || 100);
        setTaskCompletionRate(metrics.taskCompletionRate || 0);
      }

      // 2. Check if today's attendance is marked
      const attRes = await apiCall('/attendance/my');
      if (attRes.ok) {
        const attData = await attRes.json();
        const historyList = attData.history || [];
        const todayStr = new Date().toISOString().split('T')[0];
        const todayRecord = historyList.find(record => {
          if (!record.date) return false;
          return new Date(record.date).toISOString().split('T')[0] === todayStr;
        });
        
        if (todayRecord) {
          setTodayAttendance(todayRecord.status);
        } else {
          setTodayAttendance('unmarked');
        }
      }
    } catch (error) {
      console.error('Failed to load student dashboard stats:', error);
    } finally {
      // Simulate slight delay for animations and skeletons
      setTimeout(() => {
        setStatsLoading(false);
      }, 400);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDashboardStats();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleMarkAttendance = async (status) => {
    try {
      setMarking(true);
      const res = await apiCall('/attendance/mark', {
        method: 'POST',
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setTodayAttendance(status);
        fetchDashboardStats(); // Refresh stats
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to mark attendance');
      }
    } catch (error) {
      alert('Error marking attendance: ' + error.message);
    } finally {
      setMarking(false);
    }
  };

  if (statsLoading) {
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div>
          <div className="skeleton-line skeleton-title" style={{ height: '32px', marginBottom: '8px' }} />
          <div className="skeleton-line skeleton-text-half" style={{ height: '16px' }} />
        </div>
        
        {/* Welcome Widget Skeleton */}
        <div className="skeleton-card" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: '140px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            <div className="skeleton-line" style={{ width: '80px', height: '18px' }} />
            <div className="skeleton-line" style={{ width: '220px', height: '28px' }} />
            <div className="skeleton-line" style={{ width: '380px', height: '16px' }} />
          </div>
          <div className="skeleton-circle" />
        </div>

        {/* Primary Metrics Grid Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="skeleton-card" style={{ height: '200px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="skeleton-line" style={{ width: '120px', height: '20px' }} />
                  <div className="skeleton-line" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                </div>
                <div className="skeleton-line" style={{ width: '180px', height: '32px' }} />
              </div>
              <div className="skeleton-line" style={{ width: '100%', height: '38px', borderRadius: 'var(--radius-md)' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Workspace</h1>
        <p style={{ color: 'var(--text-muted)' }}>Welcome back to your internship workspace.</p>
      </div>

      {/* Welcome & Info Widget */}
      <div className="glass-card" style={{ 
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.08) 100%), var(--glass-bg)',
        borderLeft: '4px solid var(--accent-primary)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
      }}>
        {user && (
          <div>
            <span className="badge badge-info" style={{ marginBottom: '10px' }}>{user.course || 'Intern'} Track</span>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Hello, {user.name}!</h2>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <span><strong>College:</strong> {user.college || 'N/A'}</span>
              <span><strong>Branch:</strong> {user.branch || 'N/A'}</span>
              <span><strong>Batch:</strong> {user.batch || 'N/A'}</span>
              <span><strong>Phone:</strong> {user.phone || 'N/A'}</span>
            </div>
          </div>
        )}
        
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 'bold', border: '3px solid var(--accent-primary)', color: '#fff', boxShadow: 'var(--shadow-glow)' }}>
          {user ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Attendance Widget */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Attendance Status</h3>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-primary)' }}>
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            
            {todayAttendance === 'unmarked' ? (
              <div>
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.95rem' }}>
                  You have not marked today's attendance yet. Please select your status:
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    disabled={marking} 
                    onClick={() => handleMarkAttendance('present')} 
                    className="btn btn-success" 
                    style={{ flex: 1 }}
                  >
                    Mark Present
                  </button>
                  <button 
                    disabled={marking} 
                    onClick={() => handleMarkAttendance('absent')} 
                    className="btn btn-danger" 
                    style={{ flex: 1 }}
                  >
                    Mark Absent
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)' }}>
                <div className="pulse-glowing-dot" style={{ 
                  backgroundColor: todayAttendance === 'present' ? 'var(--color-success)' : todayAttendance === 'late' ? 'var(--color-warning)' : 'var(--color-danger)' 
                }} />
                <div>
                  <h4 style={{ textTransform: 'capitalize', fontSize: '1.1rem' }}>Today: {todayAttendance}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Marked successfully</span>
                </div>
              </div>
            )}
          </div>
          
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Overall Rate</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-success)' }}>
              <CountUp end={attendancePercent} suffix="%" />
            </span>
          </div>
        </div>

        {/* Tasks Summary Widget */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Pending Tasks</h3>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-primary)' }}>
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: '1' }}>
                <CountUp end={pendingTasksCount} />
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>tasks remaining today</span>
            </div>
          </div>
          
          <button onClick={() => setActiveTab('tasks')} className="btn btn-secondary" style={{ width: '100%' }}>
            View Daily Tasks
          </button>
        </div>

        {/* Progress Overview Widget */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Task Completion Rate</h3>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-info)' }}>
                <path d="M18 20V10"/>
                <path d="M12 20V4"/>
                <path d="M6 20v-6"/>
              </svg>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '5px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Approved Solutions</span>
                  <span style={{ fontWeight: '600' }}>
                    <CountUp end={taskCompletionRate} suffix="%" />
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${taskCompletionRate}%`, 
                    height: '100%', 
                    background: 'var(--accent-gradient)',
                    borderRadius: '4px',
                    transition: 'width var(--transition-slow)'
                  }} />
                </div>
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '5px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Attendance Rate</span>
                  <span style={{ fontWeight: '600' }}>
                    <CountUp end={attendancePercent} suffix="%" />
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${attendancePercent}%`, 
                    height: '100%', 
                    backgroundColor: 'var(--color-success)',
                    borderRadius: '4px',
                    transition: 'width var(--transition-slow)'
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
