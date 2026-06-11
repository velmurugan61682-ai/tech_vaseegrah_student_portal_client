import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as paymentService from '../services/paymentService';
import * as adminService from '../services/adminService';

// CountUp component to animate stats
function CountUp({ end, duration = 1000, prefix = '', suffix = '' }) {
  const [value, setValue] = useState('0');

  useEffect(() => {
    const str = String(end);
    const cleanStr = str.replace(/[₹%,]/g, '');
    const target = parseFloat(cleanStr);
    
    if (isNaN(target)) {
      setValue(end);
      return;
    }

    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // cubic ease out
      
      const current = easeProgress * target;
      let formattedVal = '';
      if (Number.isInteger(target)) {
        formattedVal = Math.floor(current).toLocaleString();
      } else {
        formattedVal = current.toFixed(1);
      }

      const hasRupee = str.includes('₹');
      const hasPercent = str.includes('%');
      
      setValue((hasRupee ? '₹' : '') + formattedVal + (hasPercent ? '%' : ''));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setValue(end);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span>{prefix}{value}{suffix}</span>;
}

export default function AdminPayments() {
  const { showToast } = useAuth();
  
  // Data States
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [internships, setInternships] = useState([]);
  
  // Filters & Search State
  const [filters, setFilters] = useState({
    course: '',
    batch: '',
    status: '',
    search: ''
  });

  // Metrics State
  const [metrics, setMetrics] = useState({
    totalPayments: 0,
    paidAmount: 0,
    pendingAmount: 0,
    paymentSuccessRate: 100
  });

  // Loading States
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);

  // Modals States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  
  // Selected Record States
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    studentId: '',
    internshipId: '',
    amount: 0,
    discount: 0,
    finalAmount: 0,
    paymentType: 'Online Payment',
    paymentMethod: 'UPI',
    transactionId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    status: 'Pending',
    notes: ''
  });

  // Load baseline payments, students, and internships
  const loadInitialData = async () => {
    try {
      setLoading(true);
      // Fetch payments
      const payRes = await paymentService.getPayments(filters);
      if (payRes.success) {
        setPayments(payRes.data);
      }

      // Fetch students for add/edit dropdowns
      const studRes = await adminService.getStudentsDirectory();
      if (studRes.success) {
        setStudents(studRes.students || studRes.data || []);
      }

      // Fetch internships for program tracks selection
      const internRes = await paymentService.getInternships();
      if (internRes.success) {
        setInternships(internRes.data);
      }

      // Fetch payment analytics metrics
      const metricRes = await paymentService.getPaymentAnalytics();
      if (metricRes.success) {
        setMetrics(metricRes.stats);
      }
    } catch (error) {
      console.error('Error loading payments data:', error);
      showToast('Failed to load payments telemetry', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [filters.course, filters.batch, filters.status]); // Auto-reload on dropdown selections

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadInitialData();
  };

  // Auto-calculate final amount in form when amount/discount changes
  useEffect(() => {
    const amt = parseFloat(formData.amount) || 0;
    const disc = parseFloat(formData.discount) || 0;
    setFormData(prev => ({
      ...prev,
      finalAmount: Math.max(0, amt - disc)
    }));
  }, [formData.amount, formData.discount]);

  // When student is selected, auto-select their internship and prefill price if available
  const handleStudentSelect = (studentId) => {
    const student = students.find(s => s._id === studentId);
    if (student && student.course) {
      const matchIntern = internships.find(i => i.title.toLowerCase().includes(student.course.toLowerCase()));
      setFormData(prev => ({
        ...prev,
        studentId,
        internshipId: matchIntern ? matchIntern._id : prev.internshipId,
        amount: matchIntern ? matchIntern.price : prev.amount
      }));
    } else {
      setFormData(prev => ({ ...prev, studentId }));
    }
  };

  // When internship program is selected, prefill price
  const handleInternshipSelect = (internshipId) => {
    const intern = internships.find(i => i._id === internshipId);
    setFormData(prev => ({
      ...prev,
      internshipId,
      amount: intern ? intern.price : prev.amount
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      if (showAddModal) {
        const res = await paymentService.createPayment(formData);
        if (res.success) {
          showToast('Payment record added successfully!', 'success');
          setShowAddModal(false);
          loadInitialData();
        } else {
          showToast(res.message || 'Failed to add payment', 'danger');
        }
      } else if (showEditModal && selectedPayment) {
        const res = await paymentService.updatePayment(selectedPayment._id, formData);
        if (res.success) {
          showToast('Payment record updated successfully!', 'success');
          setShowEditModal(false);
          loadInitialData();
        } else {
          showToast(res.message || 'Failed to update payment', 'danger');
        }
      }
    } catch (error) {
      showToast(error.response?.data?.message || error.message, 'danger');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDirectApprove = async (paymentId) => {
    if (!window.confirm('Are you sure you want to mark this transaction as Paid/Approved?')) return;
    try {
      const res = await paymentService.updatePaymentStatus(paymentId, 'Paid');
      if (res.success) {
        showToast('Payment status marked as Paid!', 'success');
        loadInitialData();
      } else {
        showToast(res.message || 'Failed to approve payment', 'danger');
      }
    } catch (error) {
      showToast(error.message, 'danger');
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('CRITICAL ACTION: Are you sure you want to delete this payment record? This action will generate an audit log.')) return;
    try {
      const res = await paymentService.deletePayment(paymentId);
      if (res.success) {
        showToast('Payment record deleted successfully!', 'success');
        loadInitialData();
      } else {
        showToast(res.message || 'Failed to delete record', 'danger');
      }
    } catch (error) {
      showToast(error.message, 'danger');
    }
  };

  const openAddModal = () => {
    setFormData({
      studentId: '',
      internshipId: '',
      amount: 0,
      discount: 0,
      finalAmount: 0,
      paymentType: 'Online Payment',
      paymentMethod: 'UPI',
      transactionId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
      notes: ''
    });
    setShowAddModal(true);
  };

  const openEditModal = (payment) => {
    setSelectedPayment(payment);
    setFormData({
      studentId: payment.studentId?._id || payment.studentId || '',
      internshipId: payment.internshipId?._id || payment.internshipId || '',
      amount: payment.amount,
      discount: payment.discount,
      finalAmount: payment.finalAmount,
      paymentType: payment.paymentType,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      paymentDate: new Date(payment.paymentDate).toISOString().split('T')[0],
      status: payment.status,
      notes: payment.notes
    });
    setShowEditModal(true);
  };

  const openViewModal = (payment) => {
    setSelectedPayment(payment);
    setShowViewModal(true);
  };

  // Export spreadsheet as CSV
  const handleExportCSV = () => {
    const headers = ['Student Name', 'Email', 'Phone', 'Internship Program', 'Original Amount', 'Discount', 'Final Paid Amount', 'Payment Type', 'Payment Method', 'Transaction ID', 'Payment Date', 'Payment Status', 'Notes'];
    const rows = payments.map(p => [
      p.studentName,
      p.email,
      p.phone || '-',
      p.internshipTitle,
      p.amount,
      p.discount,
      p.finalAmount,
      p.paymentType,
      p.paymentMethod,
      p.transactionId || '-',
      new Date(p.paymentDate).toLocaleDateString(),
      p.status,
      p.notes || '-'
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Tech_Vaseegrah_Students_Payments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print PDF Invoice
  const handlePrintInvoice = (payment) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${payment.studentName}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 40px; line-height: 1.5; }
            .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, .15); border-radius: 8px; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .header-table td { vertical-align: top; }
            .logo { font-size: 24px; font-weight: bold; color: #10b981; }
            .title { font-size: 28px; text-align: right; text-transform: uppercase; color: #555; }
            .meta-info { margin-bottom: 30px; display: flex; justify-content: space-between; border-top: 2px solid #10b981; border-bottom: 2px solid #10b981; padding: 15px 0; }
            .details-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .details-table th { background: #f8f9fa; border-bottom: 2px solid #dee2e6; padding: 10px; text-align: left; font-weight: bold; }
            .details-table td { padding: 12px 10px; border-bottom: 1px solid #eee; }
            .totals-panel { text-align: right; margin-top: 20px; font-size: 16px; }
            .totals-panel div { margin-bottom: 8px; }
            .final-row { font-size: 20px; font-weight: bold; color: #10b981; margin-top: 10px; border-top: 1px solid #dee2e6; padding-top: 10px; }
            .footer-note { text-align: center; margin-top: 60px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 50px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .badge-Paid { background: #d1fae5; color: #065f46; }
            .badge-Pending { background: #fef3c7; color: #92400e; }
            .badge-Failed { background: #fee2e2; color: #991b1b; }
            .badge-Refunded { background: #e0f2fe; color: #075985; }
            @media print {
              body { margin: 0; }
              .invoice-box { border: none; box-shadow: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <table class="header-table">
              <tr>
                <td>
                  <div class="logo">Tech Vaseegrah Student Portal</div>
                  <div>123 Skill Development Highway<br/>Chennai, TN, India</div>
                </td>
                <td style="text-align: right">
                  <div class="title">Receipt / Invoice</div>
                  <div>Date: ${new Date(payment.paymentDate).toLocaleDateString()}</div>
                  <div>Receipt No: REC-${payment._id.substring(18).toUpperCase()}</div>
                </td>
              </tr>
            </table>

            <div class="meta-info">
              <div>
                <strong>Billed To:</strong><br/>
                Name: ${payment.studentName}<br/>
                Email: ${payment.email}<br/>
                Phone: ${payment.phone || 'N/A'}
              </div>
              <div style="text-align: right">
                <strong>Internship Program Details:</strong><br/>
                Course: ${payment.internshipTitle}<br/>
                Duration: ${payment.internshipId?.duration || '3 Months'}<br/>
                Status: <span class="badge badge-${payment.status}">${payment.status}</span>
              </div>
            </div>

            <table class="details-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: right">Rate</th>
                  <th style="text-align: right">Discount</th>
                  <th style="text-align: right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${payment.internshipTitle} Internship Program Enrollment</td>
                  <td style="text-align: right">₹${payment.amount.toLocaleString()}</td>
                  <td style="text-align: right">₹${payment.discount.toLocaleString()}</td>
                  <td style="text-align: right">₹${payment.finalAmount.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div class="totals-panel">
              <div>Subtotal: ₹${payment.amount.toLocaleString()}</div>
              <div>Discount Applied: -₹${payment.discount.toLocaleString()}</div>
              <div class="final-row">Final Amount Paid: ₹${payment.finalAmount.toLocaleString()}</div>
            </div>

            <div style="margin-top: 40px; font-size: 14px;">
              <strong>Transaction Metadata:</strong><br/>
              Payment Mode: ${payment.paymentType} (${payment.paymentMethod})<br/>
              Transaction Reference ID: ${payment.transactionId || 'N/A'}<br/>
              Remarks: ${payment.notes || 'None'}
            </div>

            <div class="footer-note">
              Thank you for learning with Tech Vaseegrah!<br/>
              For questions regarding this receipt, please contact accounts@techvaseegrah.com
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Internship Payments Roster
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Audit student payment entries, track revenue breakdown, approve transactions, and print receipts.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportCSV} className="btn btn-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5l5 5 5-5m-5 5V3"/>
            </svg>
            Export CSV
          </button>
          <button onClick={openAddModal} className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Payment Record
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        {[
          { label: 'Total Payments Logged', val: metrics.totalPayments, color: 'var(--accent-primary)' },
          { label: 'Total Paid Amount', val: `₹${metrics.paidAmount?.toLocaleString()}`, color: 'var(--color-success)' },
          { label: 'Total Pending Amount', val: `₹${metrics.pendingAmount?.toLocaleString()}`, color: 'var(--color-warning)' },
          { label: 'Collection Success Rate', val: `${metrics.paymentSuccessRate}%`, color: 'var(--color-info)' }
        ].map((card, index) => (
          <div key={index} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '20px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>{card.label}</span>
            <span style={{ fontSize: '2rem', fontWeight: '800', color: card.color }}>
              <CountUp end={card.val} />
            </span>
          </div>
        ))}
      </div>

      {/* Filters & Search Row */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: '15px', alignItems: 'end', flexWrap: 'wrap' }}>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search Payments</label>
            <input 
              type="text" 
              className="form-control"
              placeholder="Search student, email, transaction..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0, minWidth: '150px' }}>
            <label className="form-label">Internship Track</label>
            <select 
              className="form-control"
              value={filters.course}
              onChange={(e) => setFilters({ ...filters, course: e.target.value })}
            >
              <option value="">All Internships</option>
              <option value="MERN Stack">MERN Stack</option>
              <option value="Python">Python</option>
              <option value="AI & ML">AI & ML</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0, minWidth: '130px' }}>
            <label className="form-label">Batch Year</label>
            <select 
              className="form-control"
              value={filters.batch}
              onChange={(e) => setFilters({ ...filters, batch: e.target.value })}
            >
              <option value="">All Batches</option>
              <option value="2023-25">2023-25</option>
              <option value="2024-26">2024-26</option>
              <option value="2025-27">2025-27</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0, minWidth: '130px' }}>
            <label className="form-label">Payment Status</label>
            <select 
              className="form-control"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary" style={{ height: '46px', padding: '0 25px' }}>
            Search
          </button>
        </form>
      </div>

      {/* Payments Table Data */}
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
          <p>Auditing payments data...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="glass-card" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '10px' }}>No payment records found matching the criteria.</p>
          <button onClick={openAddModal} className="btn btn-secondary">Log First Payment</button>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Internship Track</th>
                <th>Final Paid</th>
                <th>Payment Mode</th>
                <th>Transaction Reference</th>
                <th>Payment Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => {
                let badgeClass = 'badge-secondary';
                if (payment.status === 'Paid') badgeClass = 'badge-success';
                else if (payment.status === 'Pending') badgeClass = 'badge-warning';
                else if (payment.status === 'Failed') badgeClass = 'badge-danger';
                else if (payment.status === 'Refunded') badgeClass = 'badge-info';

                return (
                  <tr key={payment._id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{payment.studentName}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{payment.email}</div>
                    </td>
                    <td>
                      <div>{payment.internshipTitle}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>Batch: {payment.studentId?.batch || 'N/A'}</div>
                    </td>
                    <td style={{ fontWeight: '700', color: payment.status === 'Paid' ? 'var(--color-success)' : 'var(--text-main)' }}>
                      ₹{payment.finalAmount?.toLocaleString()}
                      {payment.discount > 0 && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dark)', fontWeight: 'normal', textDecoration: 'line-through' }}>
                          ₹{payment.amount?.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td>
                      <div>{payment.paymentType}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Method: {payment.paymentMethod}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {payment.transactionId || '-'}
                    </td>
                    <td>
                      {new Date(payment.paymentDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button onClick={() => openViewModal(payment)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} title="View Receipt & Audit History">
                          View
                        </button>
                        <button onClick={() => openEditModal(payment)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} title="Edit Details">
                          Edit
                        </button>
                        {payment.status === 'Pending' && (
                          <button onClick={() => handleDirectApprove(payment._id)} className="btn btn-success" style={{ padding: '6px 10px', fontSize: '0.75rem' }} title="Approve Payment">
                            Approve
                          </button>
                        )}
                        <button onClick={() => handleDeletePayment(payment._id)} className="btn btn-danger" style={{ padding: '6px 10px', fontSize: '0.75rem' }} title="Delete Record">
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

      {/* ADD PAYMENT MODAL */}
      {showAddModal && (
        <div style={modalOverlayStyle}>
          <div className="glass-card" style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h2 style={{ fontSize: '1.4rem' }}>Log New Payment</h2>
              <button onClick={() => setShowAddModal(false)} style={closeButtonStyle}>&times;</button>
            </div>
            
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={modalFormGridStyle}>
                
                {/* Select Student */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Select Student*</label>
                  <select 
                    className="form-control"
                    value={formData.studentId}
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.course || 'Unassigned'})</option>
                    ))}
                  </select>
                </div>

                {/* Select Internship Program */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Internship Track*</label>
                  <select 
                    className="form-control"
                    value={formData.internshipId}
                    onChange={(e) => handleInternshipSelect(e.target.value)}
                    required
                  >
                    <option value="">-- Select Program --</option>
                    {internships.map(i => (
                      <option key={i._id} value={i._id}>{i.title} (₹{i.price})</option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Payment Amount (₹)*</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    required
                    min="0"
                  />
                </div>

                {/* Discount */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Discount Amount (₹)</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                    min="0"
                  />
                </div>

                {/* Final Amount (Auto calculated) */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Final Paid Amount (₹)</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={formData.finalAmount}
                    readOnly
                    style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--glass-border)', color: 'var(--color-success)', fontWeight: 'bold' }}
                  />
                </div>

                {/* Payment Type */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Payment Type*</label>
                  <select 
                    className="form-control"
                    value={formData.paymentType}
                    onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                    required
                  >
                    <option value="Online Payment">Online Payment</option>
                    <option value="Offline Payment">Offline Payment</option>
                  </select>
                </div>

                {/* Payment Method */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Payment Method*</label>
                  <select 
                    className="form-control"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    required
                  >
                    <option value="UPI">UPI</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                {/* Transaction ID */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Transaction Reference ID</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="e.g. TXN987654321"
                    value={formData.transactionId}
                    onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                  />
                </div>

                {/* Payment Date */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Payment Date*</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    required
                  />
                </div>

                {/* Status */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Initial Status*</label>
                  <select 
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>

              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">Private Audit Notes</label>
                <textarea 
                  className="form-control"
                  placeholder="Memo, install plan details..."
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                  {modalLoading ? 'Submitting...' : 'Log Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PAYMENT MODAL */}
      {showEditModal && (
        <div style={modalOverlayStyle}>
          <div className="glass-card" style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h2 style={{ fontSize: '1.4rem' }}>Modify Payment details</h2>
              <button onClick={() => setShowEditModal(false)} style={closeButtonStyle}>&times;</button>
            </div>
            
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={modalFormGridStyle}>
                
                {/* Select Student (Disabled on Edit) */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Student Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={selectedPayment?.studentName || ''} 
                    disabled 
                    style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}
                  />
                </div>

                {/* Select Internship Program */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Internship Track*</label>
                  <select 
                    className="form-control"
                    value={formData.internshipId}
                    onChange={(e) => handleInternshipSelect(e.target.value)}
                    required
                  >
                    <option value="">-- Select Program --</option>
                    {internships.map(i => (
                      <option key={i._id} value={i._id}>{i.title} (₹{i.price})</option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Payment Amount (₹)*</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    required
                    min="0"
                  />
                </div>

                {/* Discount */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Discount Amount (₹)</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                    min="0"
                  />
                </div>

                {/* Final Amount */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Final Paid Amount (₹)</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={formData.finalAmount}
                    readOnly
                    style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--glass-border)', color: 'var(--color-success)', fontWeight: 'bold' }}
                  />
                </div>

                {/* Payment Type */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Payment Type*</label>
                  <select 
                    className="form-control"
                    value={formData.paymentType}
                    onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                    required
                  >
                    <option value="Online Payment">Online Payment</option>
                    <option value="Offline Payment">Offline Payment</option>
                  </select>
                </div>

                {/* Payment Method */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Payment Method*</label>
                  <select 
                    className="form-control"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    required
                  >
                    <option value="UPI">UPI</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                {/* Transaction ID */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Transaction Reference ID</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={formData.transactionId}
                    onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                  />
                </div>

                {/* Payment Date */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Payment Date*</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    required
                  />
                </div>

                {/* Status */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Payment Status*</label>
                  <select 
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>

              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">Private Audit Notes</label>
                <textarea 
                  className="form-control"
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                  {modalLoading ? 'Saving...' : 'Update Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PAYMENT DETAILS & AUDIT LOGS MODAL */}
      {showViewModal && selectedPayment && (
        <div style={modalOverlayStyle}>
          <div className="glass-card" style={{ ...modalContentStyle, maxWidth: '650px' }}>
            <div style={modalHeaderStyle}>
              <h2 style={{ fontSize: '1.4rem' }}>Transaction Details & Audit Logs</h2>
              <button onClick={() => setShowViewModal(false)} style={closeButtonStyle}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Receipt Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', padding: '15px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>STUDENT NAME</span>
                  <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#fff' }}>{selectedPayment.studentName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedPayment.email}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedPayment.phone || 'No phone'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>INTERNSHIP PROGRAM</span>
                  <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>{selectedPayment.internshipTitle}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Duration: {selectedPayment.internshipId?.duration || '3 Months'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status: <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{selectedPayment.status}</span></div>
                </div>
                
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TRANSACTION METADATA</span>
                  <div style={{ fontSize: '0.88rem' }}><strong>Type:</strong> {selectedPayment.paymentType}</div>
                  <div style={{ fontSize: '0.88rem' }}><strong>Method:</strong> {selectedPayment.paymentMethod}</div>
                  <div style={{ fontSize: '0.88rem', fontFamily: 'monospace' }}><strong>Ref ID:</strong> {selectedPayment.transactionId || 'N/A'}</div>
                </div>
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PAYMENT SUMS</span>
                  <div style={{ fontSize: '0.88rem' }}><strong>Base Fee:</strong> ₹{selectedPayment.amount?.toLocaleString()}</div>
                  <div style={{ fontSize: '0.88rem' }}><strong>Discount:</strong> ₹{selectedPayment.discount?.toLocaleString()}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--color-success)' }}><strong>Final:</strong> ₹{selectedPayment.finalAmount?.toLocaleString()}</div>
                </div>

                <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--glass-border)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AUDIT NOTES</span>
                  <div style={{ fontSize: '0.88rem', fontStyle: 'italic' }}>{selectedPayment.notes || 'No remarks recorded.'}</div>
                </div>
              </div>

              {/* PDF Print Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <button onClick={() => handlePrintInvoice(selectedPayment)} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                  </svg>
                  Print PDF Invoice / Receipt
                </button>
              </div>

            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
              <button onClick={() => setShowViewModal(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Modal styling configurations
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
