import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as receiptService from '../services/receiptService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';
const SERVER_URL = API_BASE_URL.replace(/\/+$/, '');

export default function StudentReceipts() {
  const { showToast } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calculations
  const [summary, setSummary] = useState({
    receiptsCount: 0,
    paidSum: 0,
    balanceDue: 0
  });

  const loadStudentReceipts = async () => {
    try {
      setLoading(true);
      const res = await receiptService.getStudentReceipts();
      if (res.success) {
        setReceipts(res.data);

        let paid = 0;
        let balance = 0;
        res.data.forEach(r => {
          paid += r.amountPaid || 0;
          balance += r.balanceDue || 0;
        });

        setSummary({
          receiptsCount: res.data.length,
          paidSum: paid,
          balanceDue: balance
        });
      }
    } catch (error) {
      console.error('Error fetching student receipts:', error);
      showToast('Failed to load receipts', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentReceipts();
  }, []);

  const openReceiptPDF = (receipt) => {
    if (!receipt.pdfPath) {
      showToast('Receipt PDF not yet compiled. Please contact administrator.', 'warning');
    } else {
      window.open(`${SERVER_URL}${receipt.pdfPath}`, '_blank');
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>My Payment Receipts</h1>
        <p style={{ color: 'var(--text-muted)' }}>Review your internship program billing receipts, payment verifications, and download PDF receipts.</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        {[
          { label: 'Receipts Issued', val: summary.receiptsCount, color: 'var(--accent-primary)' },
          { label: 'Total Fees Paid', val: `₹${summary.paidSum?.toLocaleString()}`, color: 'var(--color-success)' },
          { label: 'Remaining Balance Due', val: `₹${summary.balanceDue?.toLocaleString()}`, color: summary.balanceDue > 0 ? 'var(--color-warning)' : 'var(--text-dark)' }
        ].map((card, index) => (
          <div key={index} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '20px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>{card.label}</span>
            <span style={{ fontSize: '2rem', fontWeight: '800', color: card.color }}>{card.val}</span>
          </div>
        ))}
      </div>

      {/* Table Section */}
      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ 
            width: '35px', 
            height: '35px', 
            border: '3px solid var(--glass-border)', 
            borderTopColor: 'var(--accent-primary)', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 15px' 
          }} />
          <p>Retrieving payment receipts...</p>
        </div>
      ) : receipts.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1rem' }}>No payment receipts have been issued to your account yet.</p>
          <span style={{ fontSize: '0.82rem', display: 'block', marginTop: '10px' }}>Once your payment is approved, a PDF receipt is compiled and automatically emailed to you.</span>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Receipt Number</th>
                <th>Internship Track</th>
                <th>Paid Sum</th>
                <th>Balance Due</th>
                <th>Payment Mode</th>
                <th>Payment Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>PDF Invoice</th>
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
                    <td>{receipt.courseName}</td>
                    <td style={{ fontWeight: '700', color: 'var(--color-success)' }}>
                      ₹{receipt.amountPaid?.toLocaleString()}
                    </td>
                    <td style={{ fontWeight: '700', color: receipt.balanceDue > 0 ? 'var(--color-warning)' : 'var(--text-dark)' }}>
                      ₹{receipt.balanceDue?.toLocaleString()}
                    </td>
                    <td>{receipt.paymentMethod}</td>
                    <td>{new Date(receipt.paymentDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>
                      <span className={`badge ${badgeClass}`}>
                        {receipt.paymentStatus}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => openReceiptPDF(receipt)} 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      >
                        Download PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Corporate Metadata Policy Info */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-primary)' }}>Tech Vaseegrah Receipts Policy</h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          This receipt ledger lists all verified transactions. Receipts generated dynamically include QR verification stamps that are signed by the accounts office in Thanjavur, Tamil Nadu. 
          If there are discrepancies in your billing statements or outstanding balance due, please raise a ticket under <strong>Support Settings</strong> or email us at <strong>accounts@techvaseegrah.com</strong>.
        </p>
      </div>

    </div>
  );
}
