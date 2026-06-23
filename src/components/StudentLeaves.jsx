import { DarkInput, DarkSelect, DarkSearch } from './DarkControls';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as leaveService from '../services/leaveService';

export default function StudentLeaves() {
  const { showToast } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fromDate: '',
    toDate: '',
    reason: ''
  });

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const res = await leaveService.getStudentLeaves();
      if (res.success) {
        setLeaves(res.data);
      }
    } catch (error) {
      console.error('Error fetching student leaves:', error);
      showToast('Failed to load leave history', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(formData.fromDate) > new Date(formData.toDate)) {
      showToast('Start Date cannot be after End Date', 'danger');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await leaveService.applyLeave(formData);
      if (res.success) {
        showToast('Leave request submitted successfully!', 'success');
        setFormData({ fromDate: '', toDate: '', reason: '' });
        loadLeaves();
      } else {
        showToast(res.message || 'Failed to apply leave', 'danger');
      }
    } catch (error) {
      showToast(error.response?.data?.message || error.message, 'danger');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Leave Planner
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Apply for internship leaves, monitor request approvals, and view administrative comments.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Left Column: Apply Form */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>
            Apply for Leave
          </h2>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">From Date*</label>
              <DarkInput 
                type="date" 
                name="fromDate" 
                 
                value={formData.fromDate}
                onChange={handleInputChange}
                required 
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">To Date*</label>
              <DarkInput 
                type="date" 
                name="toDate" 
                 
                value={formData.toDate}
                onChange={handleInputChange}
                required 
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Reason for Absence*</label>
              <textarea 
                name="reason" 
                className="form-control" 
                placeholder="Describe the reason for your leave request..." 
                rows="4" 
                value={formData.reason}
                onChange={handleInputChange}
                required 
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '46px', marginTop: '10px' }} disabled={submitLoading}>
              {submitLoading ? 'Submitting Request...' : 'Submit Leave Request'}
            </button>

          </form>
        </div>

        {/* Right Column: History List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>
              Leave Application Ledger
            </h2>
            
            {loading ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ 
                  width: '30px', 
                  height: '30px', 
                  border: '3px solid var(--glass-border)', 
                  borderTopColor: 'var(--accent-primary)', 
                  borderRadius: '50%', 
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 15px' 
                }} />
                <p>Syncing leave records...</p>
              </div>
            ) : leaves.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>No leave requests logged in your account.</p>
                <span style={{ fontSize: '0.8rem', display: 'block', marginTop: '6px' }}>Submit the form on the left to request a leave of absence.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '55vh', overflowY: 'auto', paddingRight: '5px' }}>
                {leaves.map(leave => {
                  let badgeClass = 'badge-secondary';
                  if (leave.status === 'Approved') badgeClass = 'badge-success';
                  else if (leave.status === 'Rejected') badgeClass = 'badge-danger';
                  else if (leave.status === 'Pending') badgeClass = 'badge-warning';

                  return (
                    <div key={leave._id} className="glass-card" style={{ padding: '16px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#fff' }}>
                            {new Date(leave.fromDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(leave.toDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dark)' }}>
                            ({Math.ceil((new Date(leave.toDate) - new Date(leave.fromDate)) / (1000 * 60 * 60 * 24)) + 1} Days)
                          </span>
                        </div>
                        <span className={`badge ${badgeClass}`} style={{ fontSize: '0.75rem' }}>
                          {leave.status}
                        </span>
                      </div>
                      
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)', textTransform: 'uppercase', fontWeight: 'bold' }}>Reason</span>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px', whiteSpace: 'pre-line' }}>{leave.reason}</p>
                      </div>

                      {leave.adminRemarks && (
                        <div style={{ background: 'rgba(255,255,255,0.01)', borderLeft: '3px solid var(--accent-primary)', padding: '10px 12px', borderRadius: '4px' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--accent-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Admin Comments</span>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>{leave.adminRemarks}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
