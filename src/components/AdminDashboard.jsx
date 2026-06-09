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
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch students to get totals and breakdowns
      const studentsRes = await apiCall('/students');
      let allStudents = [];
      if (studentsRes.ok) {
        const data = await studentsRes.json();
        allStudents = data.students || [];
      }

      // 2. Fetch today's attendance
      const attendanceRes = await apiCall('/attendance/today');
      let attendanceSummary = { present: 0, absent: 0 };
      if (attendanceRes.ok) {
        const data = await attendanceRes.json();
        attendanceSummary = data.summary;
      }

      // Compute breakdowns
      const courses = {};
      const branches = {};
      
      allStudents.forEach(student => {
        // Course
        const course = student.course || 'Unassigned';
        courses[course] = (courses[course] || 0) + 1;

        // Branch
        const branch = student.branch ? student.branch.toUpperCase() : 'OTHER';
        branches[branch] = (branches[branch] || 0) + 1;
      });

      setCourseCounts(courses);
      setBranchCounts(branches);

      // 3. Compute tasks submitted today
      // Find submissions, then count how many were submitted on today's date
      // For simplicity, we can fetch all submissions or a report if we had one.
      // Let's call /api/students to get all students and then query submissions.
      // To get tasks submitted today, we can fetch all students task submissions and check the dates.
      // Let's aggregate submissions across all students
      let submissionsToday = 0;
      const todayStr = new Date().toISOString().split('T')[0];
      
      // Fetch submissions from each student or query task submissions if we can.
      // Since we can fetch student submissions, let's fetch for each student or fetch from general reports.
      // Wait, is there a report endpoint? Yes, let's check tasks or write a simple count.
      // To keep it simple, we can estimate it or fetch tasks list.
      // Let's assume we can fetch submissions or list them. Let's do a fetch for tasks and submissions.
      const tasksRes = await apiCall('/tasks');
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        // For each task, we can retrieve submissions
        for (const task of tasksData.tasks) {
          const subsRes = await apiCall(`/submissions/task/${task._id}`);
          if (subsRes.ok) {
            const subsData = await subsRes.json();
            subsData.submissions.forEach(sub => {
              const subDate = new Date(sub.submittedAt).toISOString().split('T')[0];
              if (subDate === todayStr) {
                submissionsToday++;
              }
            });
          }
        }
      }

      setStats({
        totalStudents: allStudents.length,
        presentToday: attendanceSummary.present,
        absentToday: attendanceSummary.absent,
        tasksSubmittedToday: submissionsToday
      });

    } catch (error) {
      console.error('Error fetching admin dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Prepare SVGs chart data
  const maxCourseCount = Math.max(...Object.values(courseCounts), 1);
  const maxBranchCount = Math.max(...Object.values(branchCounts), 1);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Overview of intern registrations, attendance, and tasks activity.</p>
      </div>

      {/* Numerical Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Registered Interns</span>
          <span style={{ fontSize: '2.4rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
            {loading ? '...' : stats.totalStudents}
          </span>
        </div>
        
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Today's Present Count</span>
          <span style={{ fontSize: '2.4rem', fontWeight: 'bold', color: 'var(--color-success)' }}>
            {loading ? '...' : stats.presentToday}
          </span>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Today's Absent/Unmarked</span>
          <span style={{ fontSize: '2.4rem', fontWeight: 'bold', color: 'var(--color-danger)' }}>
            {loading ? '...' : stats.absentToday}
          </span>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tasks Submitted Today</span>
          <span style={{ fontSize: '2.4rem', fontWeight: 'bold', color: 'var(--color-warning)' }}>
            {loading ? '...' : stats.tasksSubmittedToday}
          </span>
        </div>
      </div>

      {/* SVG Analytical Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        
        {/* Course-wise count chart */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Students by Course</h3>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading course chart...</p>
          ) : Object.keys(courseCounts).length === 0 ? (
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

        {/* Branch-wise count chart */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Students by College Branch</h3>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading branch chart...</p>
          ) : Object.keys(branchCounts).length === 0 ? (
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
    </div>
  );
}
