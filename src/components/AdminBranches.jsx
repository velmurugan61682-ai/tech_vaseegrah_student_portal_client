import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as branchService from '../services/branchService';

export default function AdminBranches() {
  const { showToast } = useAuth();
  
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form states
  const [addForm, setAddForm] = useState({
    branchName: '',
    description: ''
  });

  const [editForm, setEditForm] = useState({
    branchName: '',
    description: ''
  });

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await branchService.getBranches();
      if (res.success) {
        setBranches(res.branches || res.data || []);
      } else {
        showToast(res.message || 'Failed to fetch branches', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading branches', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.branchName.trim()) {
      showToast('Branch name is required', 'warning');
      return;
    }
    setFormLoading(true);
    try {
      const res = await branchService.createBranch({
        branchName: addForm.branchName.toUpperCase().trim(),
        description: addForm.description.trim()
      });
      if (res.success) {
        showToast('Branch created successfully!', 'success');
        setShowAddModal(false);
        setAddForm({ branchName: '', description: '' });
        fetchBranches();
      } else {
        showToast(res.message || 'Failed to create branch', 'danger');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      showToast(msg || 'Error creating branch', 'danger');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditClick = (branch) => {
    setSelectedBranch(branch);
    setEditForm({
      branchName: branch.branchName,
      description: branch.description || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.branchName.trim()) {
      showToast('Branch name is required', 'warning');
      return;
    }
    setFormLoading(true);
    try {
      const res = await branchService.updateBranch(selectedBranch._id, {
        branchName: editForm.branchName.toUpperCase().trim(),
        description: editForm.description.trim()
      });
      if (res.success) {
        showToast('Branch updated successfully!', 'success');
        setShowEditModal(false);
        fetchBranches();
      } else {
        showToast(res.message || 'Failed to update branch', 'danger');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      showToast(msg || 'Error updating branch', 'danger');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteClick = async (branchId, name) => {
    if (!window.confirm(`Are you sure you want to delete the branch "${name}"? Registered students will have their branch cleared.`)) {
      return;
    }
    try {
      const res = await branchService.deleteBranch(branchId);
      if (res.success) {
        showToast('Branch deleted successfully!', 'success');
        fetchBranches();
      } else {
        showToast(res.message || 'Failed to delete branch', 'danger');
      }
    } catch (err) {
      showToast(err.message || 'Error deleting branch', 'danger');
    }
  };

  // Helper to get stats or icons
  const getBranchInitial = (name) => {
    return name ? name.substring(0, 2).toUpperCase() : 'BR';
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Branch Management
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage academic branches and view student registration analytics in real-time.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ padding: '12px 24px' }}>
          + Add New Branch
        </button>
      </div>

      {/* Analytics Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: 'var(--radius-md)', background: 'var(--accent-primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
              <path d="M12 7v14" />
              <path d="M9 11h6" />
            </svg>
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Branches</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '2px' }}>{branches.length}</h3>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Assigned Interns</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '2px' }}>
              {branches.reduce((acc, curr) => acc + (curr.totalStudents || 0), 0)}
            </h3>
          </div>
        </div>
      </div>

      {/* Grid of branches */}
      {loading ? (
        <div className="glass-card" style={{ padding: '50px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading branch configurations...</p>
        </div>
      ) : branches.length === 0 ? (
        <div className="glass-card" style={{ padding: '50px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No branches registered yet. Add one to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
          {branches.map((branch) => (
            <div key={branch._id} className="glass-card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ width: '45px', height: '45px', borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: '#fff', boxShadow: 'var(--shadow-glow)' }}>
                    {getBranchInitial(branch.branchName)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span className="badge badge-info" style={{ fontSize: '0.72rem', padding: '4px 10px' }}>
                      {branch.totalStudents || 0} Interns
                    </span>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.3rem', marginTop: '15px', marginBottom: '8px' }}>
                  {branch.branchName}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', minHeight: '45px' }}>
                  {branch.description || 'No description provided for this academic branch.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--glass-border)', paddingTop: '15px', marginTop: '10px' }}>
                <button onClick={() => handleEditClick(branch)} className="btn btn-secondary" style={{ flex: 1, fontSize: '0.85rem', padding: '8px' }}>
                  Edit Details
                </button>
                <button onClick={() => handleDeleteClick(branch._id, branch.branchName)} className="btn btn-danger" style={{ flex: 1, fontSize: '0.85rem', padding: '8px' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================= */}
      {/* 1. ADD NEW BRANCH MODAL FORM             */}
      {/* ======================================= */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '480px', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
              <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-heading)' }}>Add New Academic Branch</h2>
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Close</button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Branch Code/Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  placeholder="e.g. CSE, IT, ECE"
                  value={addForm.branchName} 
                  onChange={(e) => setAddForm({...addForm, branchName: e.target.value})} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description</label>
                <textarea 
                  className="form-control" 
                  rows="3"
                  placeholder="Academic division description..."
                  value={addForm.description} 
                  onChange={(e) => setAddForm({...addForm, description: e.target.value})}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ height: '46px', marginTop: '10px' }} disabled={formLoading}>
                {formLoading ? 'Creating Branch...' : 'Save Branch'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 2. EDIT BRANCH MODAL FORM                */}
      {/* ======================================= */}
      {showEditModal && selectedBranch && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '480px', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
              <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-heading)' }}>Edit Branch Details</h2>
              <button onClick={() => setShowEditModal(false)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Close</button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Branch Code/Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  placeholder="e.g. CSE, IT, ECE"
                  value={editForm.branchName} 
                  onChange={(e) => setEditForm({...editForm, branchName: e.target.value})} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description</label>
                <textarea 
                  className="form-control" 
                  rows="3"
                  placeholder="Academic division description..."
                  value={editForm.description} 
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ height: '46px', marginTop: '10px' }} disabled={formLoading}>
                {formLoading ? 'Saving changes...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
