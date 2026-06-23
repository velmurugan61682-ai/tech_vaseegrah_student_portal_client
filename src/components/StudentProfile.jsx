import { DarkInput, DarkSelect, DarkSearch } from './DarkControls';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function StudentProfile() {
  const { user, updateProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    college: user.college || '',
    branch: user.department?.code || user.branch || '',
    batch: user.batch?.name || user.batch || '',
    profilePhoto: user.profilePhoto || ''
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Password change states
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passSaving, setPassSaving] = useState(false);
  const [passMsg, setPassMsg] = useState({ text: '', type: '' });

  const handlePassChange = (e) => {
    setPassData({ ...passData, [e.target.name]: e.target.value });
  };

  const handlePassSubmit = async (e) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      setPassMsg({ text: 'New passwords do not match!', type: 'error' });
      return;
    }
    if (passData.newPassword.length < 6) {
      setPassMsg({ text: 'New password must be at least 6 characters!', type: 'error' });
      return;
    }

    setPassSaving(true);
    setPassMsg({ text: '', type: '' });

    try {
      const authService = await import('../services/authService');
      const res = await authService.changePassword(passData.currentPassword, passData.newPassword);
      if (res.success) {
        setPassMsg({ text: 'Password updated successfully!', type: 'success' });
        setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPassMsg({ text: res.message || 'Failed to update password', type: 'error' });
      }
    } catch (err) {
      setPassMsg({ text: err.response?.data?.message || err.message, type: 'error' });
    } finally {
      setPassSaving(false);
    }
  };

  // Handle image conversion to Base64
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMsg({ text: 'Image size should be less than 2MB', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, profilePhoto: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ text: '', type: '' });

    try {
      const res = await updateProfile(user._id, formData);
      if (res.success) {
        setMsg({ text: 'Profile updated successfully!', type: 'success' });
      } else {
        setMsg({ text: res.message || 'Failed to update profile', type: 'error' });
      }
    } catch (err) {
      setMsg({ text: 'Error: ' + err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '800px' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Personal Profile</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your personal details and academic properties.</p>
      </div>

      {msg.text && (
        <div style={{ 
          padding: '12px 16px', 
          borderRadius: 'var(--radius-md)', 
          background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
          border: '1px solid',
          borderColor: msg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
          color: msg.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
          fontSize: '0.95rem'
        }}>
          {msg.text}
        </div>
      )}

      <div className="glass-card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Profile Photo Header Block */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              {formData.profilePhoto ? (
                <img 
                  src={formData.profilePhoto} 
                  alt="Avatar" 
                  style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-primary)' }} 
                />
              ) : (
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', border: '3px solid var(--accent-primary)' }}>
                  {formData.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Profile Photo</h3>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                style={{ display: 'none' }} 
                id="avatar-upload" 
              />
              <label htmlFor="avatar-upload" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
                Upload Photo
              </label>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dark)', marginTop: '6px' }}>
                Maximum size 2MB. Supports PNG, JPG, JPEG.
              </span>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)' }} />

          {/* Form grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <DarkInput 
                type="text" 
                name="name"
                 
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <DarkInput 
                type="email" 
                 
                value={user.email} 
                disabled 
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>Email cannot be changed</span>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <DarkInput 
                type="tel" 
                name="phone"
                 
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">College / Institution</label>
              <DarkInput 
                type="text" 
                name="college"
                 
                value={formData.college}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department / Branch</label>
              <DarkInput 
                type="text" 
                name="branch"
                 
                value={formData.branch}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Batch Year</label>
              <DarkInput 
                type="text" 
                name="batch"
                 
                value={formData.batch}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Internship Course</label>
              <DarkInput 
                type="text" 
                 
                value={user.course} 
                disabled 
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>Contact your provider to switch courses</span>
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: '150px' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>

      {/* Change Password Card */}
      <div className="glass-card" style={{ marginTop: '20px' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>
          Change Password
        </h2>

        {passMsg.text && (
          <div style={{ 
            padding: '12px 16px', 
            borderRadius: 'var(--radius-md)', 
            background: passMsg.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: '1px solid',
            borderColor: passMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            color: passMsg.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
            fontSize: '0.95rem',
            marginBottom: '20px'
          }}>
            {passMsg.text}
          </div>
        )}

        <form onSubmit={handlePassSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Current Password*</label>
              <DarkInput 
                type="password" 
                name="currentPassword" 
                 
                value={passData.currentPassword}
                onChange={handlePassChange}
                required 
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">New Password*</label>
              <DarkInput 
                type="password" 
                name="newPassword" 
                 
                placeholder="Min 6 characters"
                value={passData.newPassword}
                onChange={handlePassChange}
                required 
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Confirm New Password*</label>
              <DarkInput 
                type="password" 
                name="confirmPassword" 
                 
                value={passData.confirmPassword}
                onChange={handlePassChange}
                required 
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="submit" className="btn btn-primary" disabled={passSaving} style={{ minWidth: '150px' }}>
              {passSaving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
