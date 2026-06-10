import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as adminService from '../services/adminService';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area, LineChart, Line 
} from 'recharts';

// Colors for Pie/Donut charts
const COLORS = ['#6366f1', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
const TASK_COLORS = {
  'Pending': '#f59e0b',
  'In Progress': '#3b82f6',
  'Submitted': '#6366f1',
  'Approved': '#10b981',
  'Rejected': '#ef4444'
};

export default function AdminDashboard() {
  const { showToast } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    activeTasks: 0,
    completedTasks: 0,
    internshipProgress: 100,
    totalPayments: 0,
    paidAmount: 0,
    pendingAmount: 0,
    monthlyRevenue: 0,
    onlinePayments: 0,
    offlinePayments: 0,
    paymentSuccessRate: 100
  });

  const [chartsData, setChartsData] = useState({
    studentsByCourse: [],
    studentsByBranch: [],
    attendanceAnalytics: [],
    taskAnalytics: [],
    monthlyRevenue: [],
    paymentStatusPie: [],
    internshipWiseRevenue: [],
    studentPaymentTrends: []
  });

  const [todayAttendanceList, setTodayAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardStats();
      if (data.success) {
        setStats({
          totalStudents: data.stats.totalStudents || 0,
          presentToday: data.stats.presentToday || 0,
          absentToday: data.stats.absentToday || 0,
          activeTasks: data.stats.activeTasks || 0,
          completedTasks: data.stats.completedTasks || 0,
          internshipProgress: data.stats.internshipProgress || 0,
          totalPayments: data.stats.totalPayments || 0,
          paidAmount: data.stats.paidAmount || 0,
          pendingAmount: data.stats.pendingAmount || 0,
          monthlyRevenue: data.stats.monthlyRevenue || 0,
          onlinePayments: data.stats.onlinePayments || 0,
          offlinePayments: data.stats.offlinePayments || 0,
          paymentSuccessRate: data.stats.paymentSuccessRate || 100
        });

        setTodayAttendanceList(data.todayAttendanceList || []);
        
        // Populate chart details
        const charts = data.charts || {};
        setChartsData({
          studentsByCourse: charts.studentsByCourse || [],
          studentsByBranch: charts.studentsByBranch || [],
          attendanceAnalytics: charts.attendanceAnalytics || [],
          taskAnalytics: charts.taskAnalytics || [],
          monthlyRevenue: charts.monthlyRevenue || [],
          paymentStatusPie: charts.paymentStatusPie || [],
          internshipWiseRevenue: charts.internshipWiseRevenue || [],
          studentPaymentTrends: charts.studentPaymentTrends || []
        });
      }
    } catch (error) {
      console.error('Error fetching admin dashboard metrics:', error);
      showToast('Failed to load dashboard metrics', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Overview Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Real-time internship insights, daily attendance audits, and tasks status.</p>
      </div>

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid var(--glass-border)', 
            borderTopColor: 'var(--accent-primary)', 
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 15px'
          }} />
          <p>Analyzing analytics telemetry...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : (
        <>
          {/* Section: Operations Telemetry */}
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: 'var(--text-muted)' }}>Operations Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              {[
                { label: 'Total Students', val: stats.totalStudents, color: 'var(--accent-primary)' },
                { label: 'Present Today', val: stats.presentToday, color: 'var(--color-success)' },
                { label: 'Absent Today', val: stats.absentToday, color: 'var(--color-danger)' },
                { label: 'Active Tasks', val: stats.activeTasks, color: 'var(--color-info)' },
                { label: 'Completed Tasks', val: stats.completedTasks, color: 'var(--color-success)' },
                { label: 'Internship Progress', val: `${stats.internshipProgress}%`, color: 'var(--accent-secondary)' }
              ].map((card, idx) => (
                <div key={idx} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '20px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>{card.label}</span>
                  <span style={{ fontSize: '2.2rem', fontWeight: '800', color: card.color }}>
                    {card.val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Financial Telemetry */}
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: 'var(--text-muted)' }}>Payment & Revenue Metrics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              {[
                { label: 'Total Payments', val: stats.totalPayments, color: 'var(--accent-primary)' },
                { label: 'Paid Amount (Total)', val: `₹${stats.paidAmount?.toLocaleString()}`, color: 'var(--color-success)' },
                { label: 'Pending Balance Due', val: `₹${stats.pendingAmount?.toLocaleString()}`, color: 'var(--color-warning)' },
                { label: 'Monthly Revenue', val: `₹${stats.monthlyRevenue?.toLocaleString()}`, color: 'var(--color-info)' },
                { label: 'Online Payments', val: stats.onlinePayments, color: 'var(--color-success)' },
                { label: 'Offline Payments', val: stats.offlinePayments, color: 'var(--accent-secondary)' },
                { label: 'Payment Success Rate', val: `${stats.paymentSuccessRate}%`, color: 'var(--color-info)' }
              ].map((card, idx) => (
                <div key={idx} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '20px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>{card.label}</span>
                  <span style={{ fontSize: '2.2rem', fontWeight: '800', color: card.color }}>
                    {card.val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Charts Row 1: Course (Pie) & Branch (Bar) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            
            {/* Students by Course */}
            <div className="glass-card" style={{ minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>
                Students by CourseTrack
              </h3>
              <div style={{ position: 'relative', width: '100%', height: '260px' }}>
                {chartsData.studentsByCourse.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '80px' }}>No records found</p>
                ) : (
                  <ResponsiveContainer width="99%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartsData.studentsByCourse}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="count"
                      >
                        {chartsData.studentsByCourse.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: '#171b26', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }} 
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        formatter={(value, entry) => <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{entry.payload.name}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Students by Branch */}
            <div className="glass-card" style={{ minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>
                Students by College Branch
              </h3>
              <div style={{ position: 'relative', width: '100%', height: '260px' }}>
                {chartsData.studentsByBranch.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '80px' }}>No records found</p>
                ) : (
                  <ResponsiveContainer width="99%" height="100%">
                    <BarChart data={chartsData.studentsByBranch}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ background: '#171b26', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }} 
                        itemStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="count" fill="url(#branchGrad)" radius={[4, 4, 0, 0]}>
                        {chartsData.studentsByBranch.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                      <defs>
                        <linearGradient id="branchGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--accent-secondary)" stopOpacity={0.4}/>
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* Charts Row 2: Attendance Trend (Area) & Task Statuses (Pie) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            
            {/* Attendance Trends */}
            <div className="glass-card" style={{ minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>
                Attendance Trends (Last 5 Active Days)
              </h3>
              <div style={{ position: 'relative', width: '100%', height: '260px' }}>
                {chartsData.attendanceAnalytics.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '80px' }}>No records logged yet</p>
                ) : (
                  <ResponsiveContainer width="99%" height="100%">
                    <AreaChart data={chartsData.attendanceAnalytics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ background: '#171b26', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }} 
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend formatter={(value) => <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{value}</span>} />
                      <Area type="monotone" dataKey="Present" stroke="#10b981" fillOpacity={0.2} fill="rgba(16, 185, 129, 0.2)" />
                      <Area type="monotone" dataKey="Absent" stroke="#ef4444" fillOpacity={0.2} fill="rgba(239, 68, 68, 0.2)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Task Analytics */}
            <div className="glass-card" style={{ minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>
                Task Submissions Analytics
              </h3>
              <div style={{ position: 'relative', width: '100%', height: '260px' }}>
                {chartsData.taskAnalytics.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '80px' }}>No task solutions filed yet</p>
                ) : (
                  <ResponsiveContainer width="99%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartsData.taskAnalytics}
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {chartsData.taskAnalytics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={TASK_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: '#171b26', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }} 
                        itemStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* New Payment Analytics Charts Row 3: Revenue Bar & Payment Status Pie */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            
            {/* Monthly Revenue Chart */}
            <div className="glass-card" style={{ minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>
                Monthly Revenue Chart (${currentYear})
              </h3>
              <div style={{ position: 'relative', width: '100%', height: '260px' }}>
                {chartsData.monthlyRevenue.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '80px' }}>No revenue records found</p>
                ) : (
                  <ResponsiveContainer width="99%" height="100%">
                    <BarChart data={chartsData.monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ background: '#171b26', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }} 
                        itemStyle={{ color: '#fff' }}
                        formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                      />
                      <Bar dataKey="Revenue" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Payment Status Pie Chart */}
            <div className="glass-card" style={{ minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>
                Payment Status Distribution
              </h3>
              <div style={{ position: 'relative', width: '100%', height: '260px' }}>
                {chartsData.paymentStatusPie.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '80px' }}>No transaction history found</p>
                ) : (
                  <ResponsiveContainer width="99%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartsData.paymentStatusPie}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {chartsData.paymentStatusPie.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: '#171b26', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }} 
                        itemStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* New Payment Analytics Charts Row 4: Internship wise Revenue & Payment Trends */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            
            {/* Internship Wise Revenue */}
            <div className="glass-card" style={{ minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>
                Internship Program Revenue Breakdown
              </h3>
              <div style={{ position: 'relative', width: '100%', height: '260px' }}>
                {chartsData.internshipWiseRevenue.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '80px' }}>No revenue recorded</p>
                ) : (
                  <ResponsiveContainer width="99%" height="100%">
                    <BarChart data={chartsData.internshipWiseRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ background: '#171b26', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }} 
                        itemStyle={{ color: '#fff' }}
                        formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                      />
                      <Bar dataKey="Revenue" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Student Payment Trends */}
            <div className="glass-card" style={{ minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>
                Student Payment Trends (Recent Approvals)
              </h3>
              <div style={{ position: 'relative', width: '100%', height: '260px' }}>
                {chartsData.studentPaymentTrends.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '80px' }}>No recent payment transactions</p>
                ) : (
                  <ResponsiveContainer width="99%" height="100%">
                    <LineChart data={chartsData.studentPaymentTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ background: '#171b26', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }} 
                        itemStyle={{ color: '#fff' }}
                        formatter={(value, name, props) => [`₹${value.toLocaleString()}`, `${props.payload.studentName}`]}
                      />
                      <Line type="monotone" dataKey="Amount" stroke="var(--accent-secondary)" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* Today's active attendance tracking list */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>
              Today's Intern Attendance Status
            </h3>
            {todayAttendanceList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No student records registered.</p>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Course</th>
                      <th>Branch</th>
                      <th>Batch</th>
                      <th>Check-In</th>
                      <th>Check-Out</th>
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
                          <td>{intern.checkIn}</td>
                          <td>{intern.checkOut}</td>
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
