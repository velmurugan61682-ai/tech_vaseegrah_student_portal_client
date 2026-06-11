import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as paymentService from '../services/paymentService';

// CountUp component to animate stats
function CountUp({ end, duration = 1000, prefix = '', suffix = '' }) {
  const [value, setValue] = useState(() => {
    const str = String(end);
    const cleanStr = str.replace(/[₹%,]/g, '');
    const target = parseFloat(cleanStr);
    return isNaN(target) ? end : '0';
  });

  useEffect(() => {
    const str = String(end);
    const cleanStr = str.replace(/[₹%,]/g, '');
    const target = parseFloat(cleanStr);
    
    if (isNaN(target)) return;

    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // cubic ease out
      
      const current = easeProgress * target;
      const formattedVal = Number.isInteger(target) ? Math.floor(current).toLocaleString() : current.toFixed(1);

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

export default function StudentPayments() {
  const { showToast } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Summaries
  const [summary, setSummary] = useState({
    totalBilled: 0,
    totalPaid: 0,
    balanceDue: 0
  });

  const loadStudentPayments = async () => {
    try {
      setLoading(true);
      const res = await paymentService.getStudentPayments();
      if (res.success) {
        setPayments(res.data);

        // Sum calculations
        let billed = 0;
        let paid = 0;
        
        res.data.forEach(p => {
          billed += p.amount;
          if (p.status === 'Paid') {
            paid += p.finalAmount;
          }
        });

        setSummary({
          totalBilled: billed,
          totalPaid: paid,
          balanceDue: Math.max(0, billed - paid)
        });
      }
    } catch (error) {
      console.error('Error loading student payments history:', error);
      showToast('Failed to load payment history', 'danger');
    } finally {
      // simulated delay
      setTimeout(() => {
        setLoading(false);
      }, 400);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStudentPayments();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Print PDF Receipt
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
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>My Payment Ledger</h1>
        <p style={{ color: 'var(--text-muted)' }}>Review your internship program fees, paid amounts, invoices, and transaction remarks.</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        {[
          { label: 'Total Billed Fees', val: `₹${summary.totalBilled?.toLocaleString()}`, color: 'var(--accent-primary)' },
          { label: 'Total Paid Fees', val: `₹${summary.totalPaid?.toLocaleString()}`, color: 'var(--color-success)' },
          { label: 'Pending Balance Due', val: `₹${summary.balanceDue?.toLocaleString()}`, color: summary.balanceDue > 0 ? 'var(--color-warning)' : 'var(--text-dark)' }
        ].map((card, index) => (
          <div key={index} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '20px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>{card.label}</span>
            <span style={{ fontSize: '2rem', fontWeight: '800', color: card.color }}>
              <CountUp end={card.val} />
            </span>
          </div>
        ))}
      </div>

      {/* Table Section */}
      {loading ? (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="skeleton-card" style={{ height: '300px' }}>
            <div className="skeleton-line" style={{ width: '200px', height: '24px' }} />
            <div className="skeleton-line" style={{ width: '100%', height: '180px', marginTop: '20px' }} />
          </div>
        </div>
      ) : payments.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1rem' }}>No payment transactions have been logged for your account yet.</p>
          <span style={{ fontSize: '0.82rem', display: 'block', marginTop: '10px' }}>Please contact admin if you have made an offline or online payment.</span>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Internship Course</th>
                <th>Final Paid</th>
                <th>Payment Type</th>
                <th>Payment Method</th>
                <th>Transaction Reference ID</th>
                <th>Payment Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Receipt</th>
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
                    <td style={{ fontWeight: '600' }}>{payment.internshipTitle}</td>
                    <td style={{ fontWeight: '700', color: payment.status === 'Paid' ? 'var(--color-success)' : 'var(--text-main)' }}>
                      ₹{payment.finalAmount?.toLocaleString()}
                      {payment.discount > 0 && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dark)', fontWeight: 'normal', textDecoration: 'line-through' }}>
                          ₹{payment.amount?.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td>{payment.paymentType}</td>
                    <td>{payment.paymentMethod}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{payment.transactionId || '-'}</td>
                    <td>{new Date(payment.paymentDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>
                      <span className={`badge ${badgeClass}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => handlePrintInvoice(payment)} 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        disabled={payment.status !== 'Paid'}
                      >
                        Print Invoice
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Instructions Policy */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--color-info)' }}>Payment Policy & Instructions</h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          All online payments are verified instantly. Cash and Bank Transfer methods will show as <strong style={{ color: 'var(--color-warning)' }}>Pending</strong> until approved by the account administrator. 
          Please keep the Transaction reference ID safe for all payments made online. For payment refund claims or balance clearance requests, email <strong>accounts@techvaseegrah.com</strong>.
        </p>
      </div>

    </div>
  );
}
