import { DarkInput, DarkSelect, DarkSearch } from './DarkControls';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as leaveService from '../services/leaveService';

export default function AdminLeaves() {
  const { showToast } = useAuth();
  
  // Data States
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Filtering
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

  // Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [reviewAction, setReviewAction] = useState('Approved'); // Approved / Rejected
  const [adminRemarks, setAdminRemarks] = useState('');

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const res = await leaveService.getLeaves(filters);
      if (res.success) {
        setLeaves(res.data);
      }
    } catch (error) {
      console.error('Error fetching admin leaves:', error);
      showToast('Failed to load leave applications roster', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, [filters.status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadLeaves();
  };

  const openReviewModal = (leave, action) => {
    setSelectedLeave(leave);
    setReviewAction(action);
    setAdminRemarks(leave.adminRemarks || '');
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await leaveService.reviewLeave(selectedLeave._id, {
        status: reviewAction,
        adminRemarks
      });
      if (res.success) {
        showToast(`Leave request has been ${reviewAction.toLowerCase()} successfully!`, 'success');
        setShowReviewModal(false);
        loadLeaves();
      } else {
        showToast(res.message || 'Action failed', 'danger');
      }
    } catch (error) {
      showToast(error.response?.data?.message || error.message, 'danger');
    } finally {
      setModalLoading(false);
    }
  };

  // Metrics
  const pendingCount = leaves.filter(l => l.status === 'Pending').length;
  const approvedCount = leaves.filter(l => l.status === 'Approved').length;
  const rejectedCount = leaves.filter(l => l.status === 'Rejected').length;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Leave Roster Auditor
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Review active leave applications, coordinate absence permissions, and log audit remarks.</p>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        {[
          { label: 'Total Applications', val: leaves.length, color: 'var(--accent-primary)' },
          { label: 'Pending Reviews', val: pendingCount, color: 'var(--color-warning)' },
          { label: 'Approved Permissions', val: approvedCount, color: 'var(--color-success)' },
          { label: 'Rejected Applications', val: rejectedCount, color: 'var(--color-danger)' }
        ].map((card, idx) => (
          <div key={idx} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '20px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>{card.label}</span>
            <span style={{ fontSize: '2rem', fontWeight: '800', color: card.color }}>{card.val}</span>
          </div>
        ))}
      </div>

      {/* Filter Row */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '15px', alignItems: 'end' }}>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search Students</label>
            <DarkSearch 
               
              
              placeholder="Search by student name or email..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0, minWidth: '180px' }}>
            <label className="form-label">Review Status</label>
            <DarkSelect 
              
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Applications</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </DarkSelect>
          </div>

          <button type="submit" className="btn btn-secondary" style={{ height: '46px', padding: '0 25px' }}>
            Search
          </button>
        </form>
      </div>

      {/* Table Section */}
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
          <p>Auditing leave applications database...</p>
        </div>
      ) : leaves.length === 0 ? (
        <div className="glass-card" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1.1rem' }}>No leave applications match the selected criteria.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Internship Track</th>
                <th>Leave Range</th>
                <th>Total Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Action Review</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map(leave => {
                let badgeClass = 'badge-secondary';
                if (leave.status === 'Approved') badgeClass = 'badge-success';
                else if (leave.status === 'Rejected') badgeClass = 'badge-danger';
                else if (leave.status === 'Pending') badgeClass = 'badge-warning';

                const studentName = leave.studentId?.name || 'Unknown Student';
                const studentEmail = leave.studentId?.email || '';
                const studentTrack = leave.studentId?.internshipTrack || leave.studentId?.course || 'Internship';
                const studentBranch = leave.studentId?.branch || 'N/A';

                const totalDays = Math.ceil((new Date(leave.toDate) - new Date(leave.fromDate)) / (1000 * 60 * 60 * 24)) + 1;

                return (
                  <tr key={leave._id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{studentName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{studentEmail}</div>
                    </td>
                    <td>
                      <div>{studentTrack}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dark)' }}>Branch: {studentBranch}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '500' }}>
                        {new Date(leave.fromDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(leave.toDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                    <td style={{ fontWeight: 'bold' }}>{totalDays} Days</td>
                    <td>
                      <div style={{ maxWidth: '250px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', color: 'var(--text-muted)' }} title={leave.reason}>
                        {leave.reason}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>
                        {leave.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        {leave.status === 'Pending' ? (
                          <>
                            <button onClick={() => openReviewModal(leave, 'Approved')} className="btn btn-success" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                              Approve
                            </button>
                            <button onClick={() => openReviewModal(leave, 'Rejected')} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                              Reject
                            </button>
                          </>
                        ) : (
                          <button onClick={() => openReviewModal(leave, leave.status)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                            View Remarks
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* REVIEW LEAVE DIALOG MODAL */}
      {showReviewModal && selectedLeave && (
        <div style={modalOverlayStyle}>
          <div className="glass-card" style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h2 style={{ fontSize: '1.4rem' }}>
                {selectedLeave.status === 'Pending' ? `Review Application` : `Leave Application Details`}
              </h2>
              <button onClick={() => setShowReviewModal(false)} style={closeButtonStyle}>&times;</button>
            </div>
            
            <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={modalFormGridStyle}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Student Name</label>
                  <DarkInput type="text"  value={selectedLeave.studentId?.name || ''} disabled style={disabledInputStyle} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Duration</label>
                  <DarkInput type="text"  value={`${new Date(selectedLeave.fromDate).toLocaleDateString()} to ${new Date(selectedLeave.toDate).toLocaleDateString()}`} disabled style={disabledInputStyle} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Leave Request</label>
                <textarea className="form-control" rows="3" value={selectedLeave.reason} disabled style={disabledInputStyle} />
              </div>

              {selectedLeave.status === 'Pending' && (
                <div className="form-group">
                  <label className="form-label">Decision Action</label>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#fff', fontSize: '0.9rem' }}>
                      <DarkInput 
                        type="radio" 
                        name="reviewAction" 
                        value="Approved" 
                        checked={reviewAction === 'Approved'} 
                        onChange={() => setReviewAction('Approved')} 
                      />
                      Approve Permission
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#fff', fontSize: '0.9rem' }}>
                      <DarkInput 
                        type="radio" 
                        name="reviewAction" 
                        value="Rejected" 
                        checked={reviewAction === 'Rejected'} 
                        onChange={() => setReviewAction('Rejected')} 
                      />
                      Reject Application
                    </label>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Auditing Comments / Remarks</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  placeholder={selectedLeave.status === 'Pending' ? "Input explanation notes..." : "No administrative remarks logged."}
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  disabled={selectedLeave.status !== 'Pending'}
                  style={selectedLeave.status !== 'Pending' ? disabledInputStyle : {}}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowReviewModal(false)} className="btn btn-secondary">
                  Close
                </button>
                {selectedLeave.status === 'Pending' && (
                  <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                    {modalLoading ? 'Updating ledger...' : 'Submit Decision'}
                  </button>
                )}
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Modal styles
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(5, 5, 8, 0.85)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 10000,
  padding: '20px'
};

const modalContentStyle = {
  width: '100%',
  maxWidth: '600px',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), var(--shadow-glow)',
  border: '1px solid rgba(255,255,255,0.08)',
  background: '#0f1118'
};

const modalHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid var(--glass-border)',
  paddingBottom: '15px',
  marginBottom: '20px'
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '1.8rem',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  lineHeight: 1
};

const modalFormGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '15px'
};

const disabledInputStyle = {
  background: 'rgba(255,255,255,0.01)',
  border: '1px solid var(--glass-border)',
  color: 'var(--text-dark)',
  cursor: 'not-allowed'
};
