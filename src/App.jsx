import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import StudentDashboard from './components/StudentDashboard';
import StudentAttendance from './components/StudentAttendance';
import StudentTasks from './components/StudentTasks';
import StudentProfile from './components/StudentProfile';
import AdminDashboard from './components/AdminDashboard';
import AdminStudents from './components/AdminStudents';
import AdminAttendance from './components/AdminAttendance';
import AdminTasks from './components/AdminTasks';
import AdminReports from './components/AdminReports';
import AdminBranches from './components/AdminBranches';
import AdminPayments from './components/AdminPayments';
import StudentPayments from './components/StudentPayments';
import AdminReceipts from './components/AdminReceipts';
import StudentReceipts from './components/StudentReceipts';
import StudentLeaves from './components/StudentLeaves';
import AdminLeaves from './components/AdminLeaves';
import ParticleBackground from './components/ParticleBackground';

const TechVaseegrahLogo = ({ size = 32 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.4))' }}
  >
    {/* Leaf Outline (horizontal) */}
    <path 
      d="M24 43 C24 20, 48 16, 85 50 C48 84, 24 80, 24 57" 
      stroke="url(#leafGlow)" 
      strokeWidth="4" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    {/* Horizontal Center Stem */}
    <line 
      x1="12" 
      y1="50" 
      x2="82" 
      y2="50" 
      stroke="url(#leafGlow)" 
      strokeWidth="4" 
      strokeLinecap="round" 
    />
    
    {/* Top left circuit path 1 */}
    <path d="M44 50 L34 32 L28 32" stroke="url(#leafGlow)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="28" cy="32" r="3.5" fill="#fff" />

    {/* Top middle circuit path 2 */}
    <path d="M55 50 L42 22 L36 22" stroke="url(#leafGlow)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="36" cy="22" r="3.5" fill="#fff" />
    
    {/* Top right circuit path 3 */}
    <path d="M66 50 L76 34 L82 34" stroke="url(#leafGlow)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="82" cy="34" r="3.5" fill="#fff" />

    {/* Bottom left circuit path 1 */}
    <path d="M46 50 L36 68 L30 68" stroke="url(#leafGlow)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="30" cy="68" r="3.5" fill="#fff" />

    {/* Bottom right circuit path 2 */}
    <path d="M58 50 L68 72 L74 72" stroke="url(#leafGlow)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="74" cy="72" r="3.5" fill="#fff" />

    <defs>
      <linearGradient id="leafGlow" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
  </svg>
);

function MainAppContent() {
  const { user, loading, login, register, logout } = useAuth();
  
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Global ripple effect handler
  useEffect(() => {
    const handleButtonClick = (e) => {
      const btn = e.target.closest('button, .btn, .btn-primary, .btn-secondary, .btn-success, .btn-danger');
      if (!btn) return;

      const ripple = document.createElement('span');
      ripple.className = 'ripple-element';

      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;

      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      const originalPosition = window.getComputedStyle(btn).position;
      if (originalPosition === 'static') {
        btn.style.position = 'relative';
      }

      btn.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);
    };

    document.addEventListener('mousedown', handleButtonClick);
    return () => {
      document.removeEventListener('mousedown', handleButtonClick);
    };
  }, []);
  
  // Auth screen state
  const [authRole, setAuthRole] = useState('student'); // student / admin
  const [isRegister, setIsRegister] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Login/Register Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    college: '',
    branch: '',
    course: 'MERN Stack', // default course
    batch: ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      if (isRegister) {
        // Validation check for student register
        if (authRole === 'student' && (!formData.college || !formData.branch || !formData.batch)) {
          setAuthError('Please fill in college academic fields');
          setAuthLoading(false);
          return;
        }

        const payload = authRole === 'admin' 
          ? { name: formData.name, email: formData.email, password: formData.password, phone: formData.phone }
          : { ...formData };

        const result = await register(payload, authRole);
        if (!result.success) setAuthError(result.message);
      } else {
        const result = await login(formData.email, formData.password, authRole);
        if (!result.success) setAuthError(result.message);
      }
    } catch (err) {
      setAuthError('An unexpected error occurred: ' + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Splash Loading Screen
  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)', gap: '20px', position: 'relative', overflow: 'hidden' }}>
        <ParticleBackground />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', position: 'relative', zIndex: 1 }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '3px solid var(--glass-border)', 
            borderTopColor: 'var(--accent-primary)', 
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em' }}>
            LOADING TECH VASEEGRAH...
          </p>
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

  // Not Logged In - Render Authentication Portal Selector and Forms
  if (!user) {
    return (
      <div className="fade-in" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', overflow: 'hidden' }}>
        <ParticleBackground />
        <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '25px', position: 'relative', zIndex: 1 }}>
          
          {/* Brand Header */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <TechVaseegrahLogo size={55} />
            <div>
              <h1 style={{ fontSize: '2.2rem', fontWeight: '800', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '6px', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
                TECH VASEEGRAH
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600' }}>Student & Admin Portal</p>
            </div>
          </div>

          {/* Role selector panel */}
          <div className="glass-card" style={{ padding: '6px', borderRadius: 'var(--radius-md)', display: 'flex', gap: '4px' }}>
            <button 
              onClick={() => { setAuthRole('student'); setIsRegister(false); setAuthError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                background: authRole === 'student' ? 'var(--accent-gradient)' : 'transparent',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
            >
              Student Portal
            </button>
            <button 
              onClick={() => { setAuthRole('admin'); setIsRegister(false); setAuthError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                background: authRole === 'admin' ? 'var(--accent-gradient)' : 'transparent',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
            >
              Admin Panel
            </button>
          </div>

          {/* Login / Register Card */}
          <div className="glass-card">
            <h2 style={{ fontSize: '1.4rem', marginBottom: '6px', fontFamily: 'var(--font-heading)' }}>
              {isRegister ? 'Create Account' : 'Sign In'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
              {isRegister ? `Register as an ${authRole}` : `Access your ${authRole} workspace`}
            </p>

            {authError && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--color-danger-glow)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '20px' }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {isRegister && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    name="name"
                    className="form-control" 
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  className="form-control" 
                  placeholder="e.g. name@domain.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  name="password"
                  className="form-control" 
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {isRegister && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="tel" 
                    name="phone"
                    className="form-control" 
                    placeholder="Mobile number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              )}

              {/* Student specific fields */}
              {isRegister && authRole === 'student' && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">College Name</label>
                    <input 
                      type="text" 
                      name="college"
                      className="form-control" 
                      placeholder="e.g. IIT Madras"
                      value={formData.college}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Branch</label>
                      <input 
                        type="text" 
                        name="branch"
                        className="form-control" 
                        placeholder="e.g. CSE"
                        value={formData.branch}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Batch Year</label>
                      <input 
                        type="text" 
                        name="batch"
                        className="form-control" 
                        placeholder="e.g. 2026"
                        value={formData.batch}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Internship Course Track</label>
                    <select 
                      name="course" 
                      className="form-control"
                      value={formData.course}
                      onChange={handleInputChange}
                    >
                      <option value="Python">Python</option>
                      <option value="MERN Stack">MERN Stack</option>
                      <option value="AI & ML">AI & ML</option>
                    </select>
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px', height: '46px' }} disabled={authLoading}>
                {authLoading ? 'Please wait...' : isRegister ? 'Register' : 'Log In'}
              </button>

            </form>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {isRegister ? 'Already registered?' : 'Need an account?'}
              <button 
                onClick={() => { setIsRegister(!isRegister); setAuthError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: '600', marginLeft: '6px', cursor: 'pointer' }}
              >
                {isRegister ? 'Log In here' : 'Register here'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN - Render Portal Shell (Sidebar + Main Content View)
  const isStudent = user.role === 'student';

  return (
    <div className="layout-wrapper fade-in" style={{ position: 'relative', overflow: 'hidden' }}>
      <ParticleBackground />
      
      {/* Dynamic Sidebar */}
      <aside className="sidebar" style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Logo brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <TechVaseegrahLogo size={32} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
                VASEEGRAH
              </h2>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.1em' }}>
              {user.role} Workspace
            </span>
          </div>

          {/* Navigation Items */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {isStudent ? (
              /* Student Navigation Link tabs */
              <>
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
                  { id: 'attendance', label: 'Attendance', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { id: 'tasks', label: 'Daily Tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                  { id: 'payments', label: 'My Payments', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
                  { id: 'receipts', label: 'My Receipts', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z' },
                  { id: 'leaves', label: 'Leave Request', icon: 'M19 20a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z' },
                  { id: 'profile', label: 'Profile Settings', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: 'none',
                      background: activeTab === item.id ? 'var(--accent-gradient)' : 'transparent',
                      color: activeTab === item.id ? '#fff' : 'var(--text-muted)',
                      fontSize: '0.92rem',
                      fontWeight: '500',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={item.icon} />
                    </svg>
                    {item.label}
                  </button>
                ))}
              </>
            ) : (
              /* Admin Navigation Link tabs */
              <>
                {[
                  { id: 'dashboard', label: 'Overview Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
                  { id: 'students', label: 'Student Directory', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
                  { id: 'attendance', label: 'Attendance Board', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                  { id: 'branches', label: 'Branch Management', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
                  { id: 'tasks', label: 'Task Scheduler', icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2' },
                  { id: 'payments', label: 'Payment Audit', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
                  { id: 'receipts', label: 'Receipt Audit', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z' },
                  { id: 'leaves', label: 'Leave Management', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                  { id: 'reports', label: 'Reports & Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: 'none',
                      background: activeTab === item.id ? 'var(--accent-gradient)' : 'transparent',
                      color: activeTab === item.id ? '#fff' : 'var(--text-muted)',
                      fontSize: '0.92rem',
                      fontWeight: '500',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={item.icon} />
                    </svg>
                    {item.label}
                  </button>
                ))}
              </>
            )}
          </nav>
        </div>

        {/* Sidebar Footer (Profile / Logout) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {user.profilePhoto ? (
              <img src={user.profilePhoto} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ overflow: 'hidden' }}>
              <h4 style={{ fontSize: '0.88rem', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{user.name}</h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.role}</span>
            </div>
          </div>

          <button onClick={logout} className="btn btn-secondary" style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>

      </aside>

      {/* Main Panel View Area */}
      <main className="main-content">
        
        {/* Render Student Panels */}
        {isStudent && (
          <>
            {activeTab === 'dashboard' && <StudentDashboard setActiveTab={setActiveTab} />}
            {activeTab === 'attendance' && <StudentAttendance />}
            {activeTab === 'tasks' && <StudentTasks />}
            {activeTab === 'payments' && <StudentPayments />}
            {activeTab === 'receipts' && <StudentReceipts />}
            {activeTab === 'leaves' && <StudentLeaves />}
            {activeTab === 'profile' && <StudentProfile />}
          </>
        )}

        {/* Render Admin Panels */}
        {!isStudent && (
          <>
            {activeTab === 'dashboard' && <AdminDashboard />}
            {activeTab === 'students' && <AdminStudents />}
            {activeTab === 'attendance' && <AdminAttendance />}
            {activeTab === 'branches' && <AdminBranches />}
            {activeTab === 'tasks' && <AdminTasks />}
            {activeTab === 'payments' && <AdminPayments />}
            {activeTab === 'receipts' && <AdminReceipts />}
            {activeTab === 'leaves' && <AdminLeaves />}
            {activeTab === 'reports' && <AdminReports />}
          </>
        )}

      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
