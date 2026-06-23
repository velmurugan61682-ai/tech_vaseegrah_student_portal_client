import { DarkInput, DarkSelect, DarkSearch } from './DarkControls';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as receiptService from '../services/receiptService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';
// Strip trailing slash
const SERVER_URL = API_BASE_URL.replace(/\/+$/, '');

export default function AdminReceipts() {
  const { showToast } = useAuth();
  
  // Data lists
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    course: '',
    status: '',
    search: ''
  });

  // Analytics Summaries
  const [analytics, setAnalytics] = useState({
    totalCount: 0,
    emailRate: 100,
    totalBalance: 0
  });

  // Selected Record States
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  
  // Modals visibility
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    amountPaid: 0,
    balanceDue: 0,
    paymentStatus: 'Pending',
    notes: ''
  });

  // Email Editor Form State
  const [emailForm, setEmailForm] = useState({
    subject: 'Internship Fee Payment Receipt',
    message: `Dear Student,

Your internship payment has been successfully verified.

Please find the attached receipt PDF.

Regards,
InternHub Accounts Team`
  });

  // Fetch receipts and summaries
  const loadReceiptsData = async () => {
    try {
      setLoading(true);
      const res = await receiptService.getReceipts(filters);
      if (res.success) {
        setReceipts(res.data);
        
        // Calculations
        let balance = 0;
        let sentCount = 0;
        res.data.forEach(r => {
          balance += r.balanceDue || 0;
          if (r.emailSent) sentCount++;
        });

        setAnalytics({
          totalCount: res.data.length,
          emailRate: res.data.length > 0 ? Math.round((sentCount / res.data.length) * 100) : 100,
          totalBalance: balance
        });
      }
    } catch (error) {
      console.error('Error loading receipts roster:', error);
      showToast('Failed to load receipts roster', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceiptsData();
  }, [filters.course, filters.status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadReceiptsData();
  };

  const openEditModal = (receipt) => {
    setSelectedReceipt(receipt);
    setEditForm({
      amountPaid: receipt.amountPaid,
      balanceDue: receipt.balanceDue,
      paymentStatus: receipt.paymentStatus,
      notes: receipt.notes || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await receiptService.updateReceipt(selectedReceipt._id, editForm);
      if (res.success) {
        showToast('Receipt updated and PDF regenerated!', 'success');
        setShowEditModal(false);
        loadReceiptsData();
      } else {
        showToast(res.message || 'Update failed', 'danger');
      }
    } catch (error) {
      showToast(error.message, 'danger');
    } finally {
      setModalLoading(false);
    }
  };

  const openEmailModal = async (receipt) => {
    setSelectedReceipt(receipt);
    // Reload full details to fetch emailHistory
    try {
      const res = await receiptService.getReceiptDetails(receipt._id);
      if (res.success) {
        setSelectedReceipt(res.data);
      }
    } catch (e) {
      console.error(e);
    }
    
    // Set baseline subject and body
    setEmailForm({
      subject: 'Internship Fee Payment Receipt',
      message: `Dear Student,

Your internship payment has been successfully verified.

Please find the attached receipt PDF.

Regards,
InternHub Accounts Team`
    });
    setShowEmailModal(true);
  };

  const handleSendEmail = async () => {
    setModalLoading(true);
    try {
      const res = await receiptService.sendReceiptEmail(selectedReceipt._id, {
        subject: emailForm.subject,
        customMessage: emailForm.message
      });
      if (res.success) {
        showToast('Receipt email sent to student!', 'success');
        setShowEmailModal(false);
        loadReceiptsData();
      } else {
        showToast(res.message || 'Failed to send email', 'danger');
      }
    } catch (error) {
      showToast(error.message, 'danger');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteReceipt = async (receiptId) => {
    if (!window.confirm('Are you sure you want to delete this receipt? This action will generate an audit log.')) return;
    try {
      const res = await receiptService.deleteReceipt(receiptId);
      if (res.success) {
        showToast('Receipt deleted successfully!', 'success');
        loadReceiptsData();
      } else {
        showToast(res.message || 'Failed to delete receipt', 'danger');
      }
    } catch (error) {
      showToast(error.message, 'danger');
    }
  };

  // Replace tags for live preview box in email modal
  const renderEmailPreview = () => {
    if (!selectedReceipt) return '';
    return emailForm.message
      .replace(/\{\{studentName\}\}/g, selectedReceipt.studentName)
      .replace(/\{\{receiptNumber\}\}/g, selectedReceipt.receiptNumber)
      .replace(/\{\{courseName\}\}/g, selectedReceipt.courseName)
      .replace(/\{\{amount\}\}/g, `₹${selectedReceipt.amountPaid?.toLocaleString()}`)
      .replace(/\{\{paymentMethod\}\}/g, selectedReceipt.paymentMethod);
  };

  // Helper to resolve PDF path safely
  const openReceiptPDF = (receipt) => {
    if (!receipt.pdfPath) {
      showToast('PDF receipt not yet compiled. Triggering regeneration...', 'warning');
      receiptService.generateReceiptPDF(receipt._id).then(res => {
        if (res.success) {
          window.open(`${SERVER_URL}${res.pdfPath}`, '_blank');
        }
      });
    } else {
      window.open(`${SERVER_URL}${receipt.pdfPath}`, '_blank');
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Internship Receipt Management
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Generate PDF payment logs, edit billing sums, customize Nodemailer SMTP templates, and resend receipts.</p>
        </div>
      </div>

      {/* Analytics Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        {[
          { label: 'Receipts Generated', val: analytics.totalCount, color: 'var(--accent-primary)' },
          { label: 'Email Dispatch Success', val: `${analytics.emailRate}%`, color: 'var(--color-success)' },
          { label: 'Outstanding Balance Due', val: `₹${analytics.totalBalance?.toLocaleString()}`, color: 'var(--color-warning)' }
        ].map((card, index) => (
          <div key={index} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '20px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>{card.label}</span>
            <span style={{ fontSize: '2rem', fontWeight: '800', color: card.color }}>{card.val}</span>
          </div>
        ))}
      </div>

      {/* Search & Filters Row */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '15px', alignItems: 'end' }}>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search Receipts</label>
            <DarkSearch 
               
              
              placeholder="Search student name, email, receipt number..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0, minWidth: '160px' }}>
            <label className="form-label">Internship Track</label>
            <DarkSelect 
              
              value={filters.course}
              onChange={(e) => setFilters({ ...filters, course: e.target.value })}
            >
              <option value="">All Internships</option>
              <option value="MERN Stack">MERN Stack</option>
              <option value="Python">Python</option>
              <option value="AI & ML">AI & ML</option>
            </DarkSelect>
          </div>

          <div className="form-group" style={{ marginBottom: 0, minWidth: '150px' }}>
            <label className="form-label">Receipt Status</label>
            <DarkSelect 
              
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Refunded">Refunded</option>
            </DarkSelect>
          </div>

          <button type="submit" className="btn btn-secondary" style={{ height: '46px', padding: '0 25px' }}>
            Search
          </button>
        </form>
      </div>

      {/* Receipts Table Data */}
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
          <p>Analyzing receipts data...</p>
        </div>
      ) : receipts.length === 0 ? (
        <div className="glass-card" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1.1rem' }}>No payment receipts logged in the database yet.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Receipt Number</th>
                <th>Student</th>
                <th>Internship Course</th>
                <th>Paid Sum</th>
                <th>Balance Due</th>
                <th>Method</th>
                <th>Email Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map(receipt => {
                let badgeClass = 'badge-secondary';
                if (receipt.paymentStatus === 'Paid') badgeClass = 'badge-success';
                else if (receipt.paymentStatus === 'Pending') badgeClass = 'badge-warning';
                else if (receipt.paymentStatus === 'Failed') badgeClass = 'badge-danger';
                else if (receipt.paymentStatus === 'Refunded') badgeClass = 'badge-info';

                return (
                  <tr key={receipt._id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{receipt.receiptNumber}</td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{receipt.studentName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{receipt.email}</div>
                    </td>
                    <td>{receipt.courseName}</td>
                    <td style={{ fontWeight: '700', color: 'var(--color-success)' }}>
                      ₹{receipt.amountPaid?.toLocaleString()}
                    </td>
                    <td style={{ fontWeight: '700', color: receipt.balanceDue > 0 ? 'var(--color-warning)' : 'var(--text-dark)' }}>
                      ₹{receipt.balanceDue?.toLocaleString()}
                    </td>
                    <td>{receipt.paymentMethod}</td>
                    <td>
                      <span className={`badge ${receipt.emailSent ? 'badge-success' : 'badge-danger'}`}>
                        {receipt.emailSent ? 'Sent' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button onClick={() => openReceiptPDF(receipt)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} title="Download/Print PDF">
                          PDF
                        </button>
                        <button onClick={() => openEditModal(receipt)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} title="Edit Amount/Status">
                          Edit
                        </button>
                        <button onClick={() => openEmailModal(receipt)} className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} title="Nodemailer Rich Email Panel">
                          Email
                        </button>
                        <button onClick={() => handleDeleteReceipt(receipt._id)} className="btn btn-danger" style={{ padding: '6px 10px', fontSize: '0.75rem' }} title="Delete Record">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedReceipt && (
        <div style={modalOverlayStyle}>
          <div className="glass-card" style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h2 style={{ fontSize: '1.4rem' }}>Modify Receipt Details: {selectedReceipt.receiptNumber}</h2>
              <button onClick={() => setShowEditModal(false)} style={closeButtonStyle}>&times;</button>
            </div>
            
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={modalFormGridStyle}>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Student Name</label>
                  <DarkInput type="text"  value={selectedReceipt.studentName} disabled style={disabledInputStyle} />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Internship Program</label>
                  <DarkInput type="text"  value={selectedReceipt.courseName} disabled style={disabledInputStyle} />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Amount Paid (₹)*</label>
                  <DarkInput 
                    type="number" 
                    
                    value={editForm.amountPaid}
                    onChange={(e) => setEditForm({ ...editForm, amountPaid: parseFloat(e.target.value) || 0 })}
                    required
                    min="0"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Balance Due (₹)*</label>
                  <DarkInput 
                    type="number" 
                    
                    value={editForm.balanceDue}
                    onChange={(e) => setEditForm({ ...editForm, balanceDue: parseFloat(e.target.value) || 0 })}
                    required
                    min="0"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Payment Status*</label>
                  <DarkSelect 
                    
                    value={editForm.paymentStatus}
                    onChange={(e) => setEditForm({ ...editForm, paymentStatus: e.target.value })}
                    required
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                    <option value="Refunded">Refunded</option>
                  </DarkSelect>
                </div>

              </div>

              <div className="form-group">
                <label className="form-label">Administrative Notes</label>
                <textarea 
                  className="form-control" 
                  rows="2" 
                  value={editForm.notes} 
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                  {modalLoading ? 'Saving...' : 'Regenerate Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NODEMAILER EMAIL EDITOR & LOGS HISTORY MODAL */}
      {showEmailModal && selectedReceipt && (
        <div style={modalOverlayStyle}>
          <div className="glass-card" style={{ ...modalContentStyle, maxWidth: '900px' }}>
            <div style={modalHeaderStyle}>
              <h2 style={{ fontSize: '1.4rem' }}>Email Dispatch Center: {selectedReceipt.receiptNumber}</h2>
              <button onClick={() => setShowEmailModal(false)} style={closeButtonStyle}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '25px', maxHeight: '70vh', overflowY: 'auto' }}>
              
              {/* Left Column: Subject & Editor */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-primary)' }}>Nodemailer SMTP Editor</h3>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Student Recipient</label>
                  <DarkInput type="text"  value={`${selectedReceipt.studentName} <${selectedReceipt.email}>`} disabled style={disabledInputStyle} />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email Subject Line</label>
                  <DarkInput 
                    type="text" 
                     
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">Email Message Template</label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dark)' }}>HTML Allowed</span>
                  </div>
                  <textarea 
                    className="form-control" 
                    rows="8" 
                    style={{ fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.4' }}
                    value={emailForm.message}
                    onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {['studentName', 'receiptNumber', 'courseName', 'amount', 'paymentMethod'].map(tag => (
                      <span 
                        key={tag} 
                        onClick={() => setEmailForm({ ...emailForm, message: emailForm.message + ` {{${tag}}}` })}
                        style={{ fontSize: '0.7rem', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', color: 'var(--accent-secondary)' }}
                        title="Click to insert tag"
                      >
                        {`{{${tag}}}`}
                      </span>
                    ))}
                  </div>
                </div>

                <button onClick={handleSendEmail} className="btn btn-primary" style={{ width: '100%', height: '44px' }} disabled={modalLoading}>
                  {modalLoading ? 'Transmitting PDF Attachment...' : selectedReceipt.emailSent ? 'Resend Receipt PDF' : 'Send Receipt PDF'}
                </button>
              </div>

              {/* Right Column: Live Template Preview & Email Logs History */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderLeft: '1px solid var(--glass-border)', paddingLeft: '20px' }}>
                
                {/* Live Preview */}
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--color-success)', marginBottom: '10px' }}>Subject & Body Preview</h3>
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', fontSize: '0.82rem', maxHeight: '180px', overflowY: 'auto' }}>
                    <div style={{ borderBottom: '1px dashed var(--glass-border)', paddingBottom: '6px', marginBottom: '8px', fontWeight: 'bold', color: '#fff' }}>
                      Subject: {emailForm.subject}
                    </div>
                    <div style={{ whiteSpace: 'pre-line', color: 'var(--text-muted)' }}>
                      {renderEmailPreview()}
                    </div>
                  </div>
                </div>

                {/* Email History Logs */}
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Transmission Logs</h3>
                  {selectedReceipt.emailHistory?.length === 0 ? (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-dark)', fontStyle: 'italic' }}>No email dispatches recorded for this receipt.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxH: '200px', overflowY: 'auto' }}>
                      {selectedReceipt.emailHistory.map((history, idx) => (
                        <div key={idx} style={{ padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', fontSize: '0.78rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', marginBottom: '4px' }}>
                            <span><strong>Sent By:</strong> {history.adminId?.name || 'Admin'}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>
                              {new Date(history.sentAt).toLocaleDateString()} {new Date(history.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', color: 'var(--text-muted)' }}>
                            <strong>Subject:</strong> {history.subject}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: '15px', marginTop: '20px' }}>
              <button onClick={() => setShowEmailModal(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
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
  maxWidth: '800px',
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
  color: 'var(--text-muted)',
  cursor: 'not-allowed'
};
