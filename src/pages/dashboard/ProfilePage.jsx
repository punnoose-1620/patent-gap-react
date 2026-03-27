import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { useUser } from '../../hooks/useUser';
import { Save, Camera, Eye, EyeOff, User, Mail, Building2, Phone, Shield, Bell, Key, LogOut, ChevronRight } from 'lucide-react';
import DashboardSidebar from '../../components/layout/DashboardSidebar';

export default function ProfilePage() {
  const authUser   = useSelector((state) => state.auth.user);   // basic auth (email)
  //const { userProfile } = useUser(); 
  const { userProfile, loadUserProfile } = useUser();                             // ✅ full profile from API

  // ✅ Merge — prefer full profile, fall back to auth user
  const user = userProfile || authUser;

    // ── Debug: print full user object whenever it changes ──
    /*useEffect(() => {
      console.log('👤 Redux auth.user:', user);
      console.log('👤 Full user details:', JSON.stringify(user, null, 2));
    }, [user]);*/
  const { logout, updateProfile, changePassword } = useAuth();

  const [activeItem,  setActiveItem]  = useState('profile');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab,   setActiveTab]   = useState('account');

  // ── Profile form — matches DB schema exactly ──
  const [profile, setProfile] = useState({
    title:         user?.title                || '',
    full_name:     user?.full_name            || '',
    email:         user?.email                || '',
    phone:         user?.phone                || '',
    company:       user?.company              || '',
    job_title:     user?.job_title            || '',
    address_line1: user?.address?.line1       || '',
    address_line2: user?.address?.line2       || '',
    city:          user?.address?.city        || '',
    state:         user?.address?.state       || '',
    postal_code:   user?.address?.postal_code || '',
    country:       user?.address?.country     || '',
  });

  // ── 5. Load profile on mount ──             
  useEffect(() => {
    if (!userProfile) loadUserProfile();  // ✅ now defined, no error
  }, []);

  // Re-sync if Redux user loads after initial render
  useEffect(() => {
    if (!user) return;
    setProfile({
      title:         user.title                || '',
      full_name:     user.full_name            || '',
      email:         user.email                || '',
      phone:         user.phone                || '',
      company:       user.company              || '',
      job_title:     user.job_title            || '',
      address_line1: user.address?.line1       || '',
      address_line2: user.address?.line2       || '',
      city:          user.address?.city        || '',
      state:         user.address?.state       || '',
      postal_code:   user.address?.postal_code || '',
      country:       user.address?.country     || '',
    });
  }, [user]);

  

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved,  setProfileSaved]  = useState(false);

  // Password form
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [showPw,    setShowPw]    = useState({ current: false, next: false, confirm: false });
  const [pwSaving,  setPwSaving]  = useState(false);
  const [pwError,   setPwError]   = useState('');
  const [pwSaved,   setPwSaved]   = useState(false);

  // Notifications
  const [notifs, setNotifs] = useState({
    highRisk:     true,
    weeklyReport: true,
    newMatches:   true,
    systemAlerts: false,
    emailDigest:  true,
  });

  // ── Helpers ──
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(Boolean);
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  };

  const initials    = getInitials(profile.full_name);
  const displayName = profile.full_name || user?.email || 'Unknown User';
  const displayRole = profile.job_title || '';

  const handleProfileChange = (e) =>
    setProfile((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const payload = {
        title:     profile.title,
        full_name: profile.full_name,
        email:     profile.email,
        phone:     profile.phone     || null,
        company:   profile.company   || null,
        job_title: profile.job_title,
        address: {
          line1:       profile.address_line1 || null,
          line2:       profile.address_line2 || null,
          city:        profile.city          || null,
          state:       profile.state         || null,
          postal_code: profile.postal_code   || null,
          country:     profile.country       || null,
        },
      };
      console.log('📝 Saving profile:', payload);
      await updateProfile?.(payload);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      console.error('Profile save failed:', err);
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPwError('');
    if (passwords.next !== passwords.confirm) {
      setPwError('New passwords do not match.');
      return;
    }
    if (passwords.next.length < 8) {
      setPwError('Password must be at least 8 characters.');
      return;
    }
    setPwSaving(true);
    try {
      await changePassword?.(passwords.current, passwords.next);
      setPwSaved(true);
      setPasswords({ current: '', next: '', confirm: '' });
      setTimeout(() => setPwSaved(false), 3000);
    } catch (err) {
      setPwError(err?.message || 'Failed to update password.');
    } finally {
      setPwSaving(false);
    }
  };

  const TABS = [
    { id: 'account',       label: 'Account',      icon: <User size={14} /> },
    { id: 'security',      label: 'Security',      icon: <Shield size={14} /> },
   
  ];

  return (
    <div className="dash-shell">
      <DashboardSidebar
        activeItem={activeItem}
        onItemClick={setActiveItem}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="dash-main">

        {/* ── Top Nav ── */}
        <header className="topnav">
          <div className="tn-left">
            <button className="tn-hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6"  x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span className="tn-title">Patent Gap AI</span>
            <div className="tn-sep" />
            <span className="tn-sub">Profile</span>
          </div>

          <div className="tn-center">
            <div className="tn-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input placeholder="Search patents, findings..." />
            </div>
          </div>

          <div className="tn-right">
            <button className="tn-icon" aria-label="Notifications">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </button>
            <div className="tn-vsep" />
            <Link to="/dashboard" className="tn-btn tn-btn--home">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span>Dashboard</span>
            </Link>
            <button className="tn-btn" onClick={() => logout()}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span className="tn-btn-label">Log out</span>
            </button>
          </div>
        </header>

        {/* ── Content ── */}
        <div className="dash-content">

          {/* ── Page Header ── */}
          <div className="page-hd" style={{ marginBottom: 28 }}>
            <div>
              <div className="page-eyebrow">Settings</div>
              <h1 className="page-title">My <em>Profile</em></h1>
            </div>
          </div>

          {/* ── Profile layout ── */}
          <div className="prof-layout">

            {/* ── Left: Identity card ── */}
            <aside className="prof-aside">
              <div className="prof-avatar-wrap">
                <div className="prof-avatar">
                  <span className="prof-initials">{initials}</span>
                  <button className="prof-avatar-btn" aria-label="Change photo">
                    <Camera size={13} />
                  </button>
                </div>
                <div className="prof-name">
                  {profile.title ? `${profile.title}. ` : ''}{displayName}
                </div>
                <div className="prof-role-tag">{displayRole}</div>
                {profile.company && (
                  <div className="prof-company">
                    <Building2 size={12} />
                    {profile.company}
                  </div>
                )}
              </div>

              {/* Quick stats */}
              <div className="prof-stats">
                {[
                  { label: 'Patents',  value: '—' },
                  { label: 'Findings', value: '—' },
                  { label: 'Reports',  value: '—' },
                ].map((s, i) => (
                  <div key={i} className="prof-stat">
                    <div className="prof-stat-val">{s.value}</div>
                    <div className="prof-stat-lbl">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Nav items */}
              <nav className="prof-nav">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    className={`prof-nav-item${activeTab === t.id ? ' active' : ''}`}
                    onClick={() => setActiveTab(t.id)}
                  >
                    <span className="prof-nav-ico">{t.icon}</span>
                    {t.label}
                    <ChevronRight size={13} className="prof-nav-arrow" />
                  </button>
                ))}
                <div className="prof-nav-sep" />
                <button className="prof-nav-item prof-nav-danger" onClick={() => logout()}>
                  <span className="prof-nav-ico"><LogOut size={14} /></span>
                  Sign Out
                </button>
              </nav>
            </aside>

            {/* ── Right: Tab panels ── */}
            <div className="prof-main">

              {/* ══════════════════════════════
                  ACCOUNT TAB
              ══════════════════════════════ */}
              {activeTab === 'account' && (
                <div className="prof-panel">
                  <div className="prof-panel-hd">
                    <div className="prof-panel-ico"><User size={14} /></div>
                    <div>
                      <div className="prof-panel-eye">Personal Information</div>
                      <div className="prof-panel-title">Account Details</div>
                    </div>
                  </div>

                  <form onSubmit={handleProfileSave}>

                    {/* ── Personal section ── */}
                    <div className="prof-section-hd" style={{ marginBottom: 12 }}>
                      <User size={13} /> Personal
                    </div>
                    <div className="prof-form-grid" style={{ marginBottom: 28 }}>

                      {/* Title */}
                      <div className="form-group">
                        <label className="form-label">Title</label>
                        <select
                          className="form-input"
                          name="title"
                          value={profile.title}
                          onChange={handleProfileChange}
                        >
                          <option value="">Select…</option>
                          {['Mr', 'Ms', 'Mrs', 'Dr', 'Prof', 'Esq'].map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      {/* Full Name */}
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                          className="form-input"
                          name="full_name"
                          value={profile.full_name}
                          onChange={handleProfileChange}
                          placeholder="Jane Doe"
                        />
                      </div>

                      {/* Email */}
                      <div className="form-group prof-form-full">
                        <label className="form-label">Work Email</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            className="form-input"
                            name="email"
                            type="email"
                            value={profile.email}
                            onChange={handleProfileChange}
                            placeholder="jane@firm.com"
                            style={{ paddingLeft: 36 }}
                          />
                          <Mail size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink3)' }} />
                        </div>
                      </div>

                      {/* Job Title */}
                      <div className="form-group">
                        <label className="form-label">Job Title</label>
                        <input
                          className="form-input"
                          name="job_title"
                          value={profile.job_title}
                          onChange={handleProfileChange}
                          placeholder="Patent Attorney"
                        />
                      </div>

                      {/* Company */}
                      <div className="form-group">
                        <label className="form-label">Company / Firm</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            className="form-input"
                            name="company"
                            value={profile.company}
                            onChange={handleProfileChange}
                            placeholder="Your firm name"
                            style={{ paddingLeft: 36 }}
                          />
                          <Building2 size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink3)' }} />
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="form-group">
                        <label className="form-label">
                          Phone <span style={{ color: 'var(--ink3)', fontWeight: 400 }}>(optional)</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            className="form-input"
                            name="phone"
                            type="tel"
                            value={profile.phone}
                            onChange={handleProfileChange}
                            placeholder="+1 (555) 000-0000"
                            style={{ paddingLeft: 36 }}
                          />
                          <Phone size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink3)' }} />
                        </div>
                      </div>
                    </div>

                    {/* ── Address section ── */}
                    <div className="prof-section-hd" style={{ marginBottom: 12 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      Address&nbsp;
                      <span style={{ color: 'var(--ink3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>
                        (optional)
                      </span>
                    </div>
                    <div className="prof-form-grid" style={{ marginBottom: 24 }}>

                      <div className="form-group prof-form-full">
                        <label className="form-label">Address Line 1</label>
                        <input
                          className="form-input"
                          name="address_line1"
                          value={profile.address_line1}
                          onChange={handleProfileChange}
                          placeholder="123 Main St"
                        />
                      </div>

                      <div className="form-group prof-form-full">
                        <label className="form-label">
                          Address Line 2 <span style={{ color: 'var(--ink3)', fontWeight: 400 }}>(optional)</span>
                        </label>
                        <input
                          className="form-input"
                          name="address_line2"
                          value={profile.address_line2}
                          onChange={handleProfileChange}
                          placeholder="Suite 400"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">City</label>
                        <input
                          className="form-input"
                          name="city"
                          value={profile.city}
                          onChange={handleProfileChange}
                          placeholder="New York"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">State / Province</label>
                        <input
                          className="form-input"
                          name="state"
                          value={profile.state}
                          onChange={handleProfileChange}
                          placeholder="NY"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Postal Code</label>
                        <input
                          className="form-input"
                          name="postal_code"
                          value={profile.postal_code}
                          onChange={handleProfileChange}
                          placeholder="10001"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Country</label>
                        <input
                          className="form-input"
                          name="country"
                          value={profile.country}
                          onChange={handleProfileChange}
                          placeholder="United States"
                        />
                      </div>
                    </div>

                    {/* ── Save ── */}
                    <div className="prof-form-actions">
                      {profileSaved && (
                        <div className="prof-saved-badge">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Changes saved
                        </div>
                      )}
                      <button type="submit" className="btn-green prof-save-btn" disabled={profileSaving}>
                        {profileSaving ? (
                          <>
                            Saving...
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                            </svg>
                          </>
                        ) : (
                          <>
                            <Save size={14} />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ══════════════════════════════
                  SECURITY TAB
              ══════════════════════════════ */}
              {activeTab === 'security' && (
                <div className="prof-panel">
                  <div className="prof-panel-hd">
                    <div className="prof-panel-ico"><Shield size={14} /></div>
                    <div>
                      <div className="prof-panel-eye">Access Control</div>
                      <div className="prof-panel-title">Security Settings</div>
                    </div>
                  </div>

                  {/* Password change */}
                  <div className="prof-section">
                    <div className="prof-section-hd">
                      <Key size={13} /> Change Password
                    </div>

                    {pwError && (
                      <div className="prof-error">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8"  x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        {pwError}
                      </div>
                    )}

                    <form onSubmit={handlePasswordSave}>
                      <div className="prof-form-grid" style={{ maxWidth: 480 }}>
                        {[
                          { key: 'current', label: 'Current Password',    placeholder: '••••••••' },
                          { key: 'next',    label: 'New Password',         placeholder: 'Min. 8 characters' },
                          { key: 'confirm', label: 'Confirm New Password', placeholder: 'Repeat new password' },
                        ].map(({ key, label, placeholder }) => (
                          <div key={key} className="form-group prof-form-full">
                            <label className="form-label">{label}</label>
                            <div style={{ position: 'relative' }}>
                              <input
                                className="form-input"
                                type={showPw[key] ? 'text' : 'password'}
                                value={passwords[key]}
                                onChange={(e) => setPasswords((p) => ({ ...p, [key]: e.target.value }))}
                                placeholder={placeholder}
                                required
                                style={{ paddingRight: 40 }}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPw((s) => ({ ...s, [key]: !s[key] }))}
                                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink3)', padding: 0, display: 'flex' }}
                              >
                                {showPw[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="prof-form-actions">
                        {pwSaved && (
                          <div className="prof-saved-badge">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            Password updated
                          </div>
                        )}
                        <button type="submit" className="btn-green prof-save-btn" disabled={pwSaving}>
                          {pwSaving ? (
                            <>
                              Updating...
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                              </svg>
                            </>
                          ) : (
                            <>
                              <Key size={14} /> Update Password
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Session info */}
                  <div className="prof-section" style={{ marginTop: 32 }}>
                    <div className="prof-section-hd">
                      <Shield size={13} /> Session & Access
                    </div>
                    <div className="prof-info-list">
                      {[
                        { label: 'Account Status', value: 'Active',    badge: 'green' },
                        { label: 'Last Sign In',    value: 'Today',     badge: null },
                        { label: 'Access Level',    value: displayRole, badge: null },
                        { label: 'Encryption',      value: 'TLS 1.3',   badge: 'green' },
                        { label: 'SOC 2',           value: 'Compliant', badge: 'green' },
                      ].map((row, i) => (
                        <div key={i} className="prof-info-row">
                          <span className="prof-info-label">{row.label}</span>
                          <span className={`prof-info-val${row.badge ? ` badge-${row.badge}` : ''}`}>
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Danger zone */}
                  <div className="prof-section prof-danger-section" style={{ marginTop: 32 }}>
                    <div className="prof-section-hd" style={{ color: 'var(--red)' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9"  x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                      Danger Zone
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 14, lineHeight: 1.6 }}>
                      Permanently delete your account and all associated patent data. This action cannot be undone.
                    </p>
                    <button className="prof-danger-btn">Delete Account</button>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════
                  NOTIFICATIONS TAB
              ══════════════════════════════ */}
              {activeTab === 'notifications' && (
                <div className="prof-panel">
                  <div className="prof-panel-hd">
                    <div className="prof-panel-ico"><Bell size={14} /></div>
                    <div>
                      <div className="prof-panel-eye">Alert Preferences</div>
                      <div className="prof-panel-title">Notification Settings</div>
                    </div>
                  </div>

                  <div className="prof-notif-list">
                    {[
                      { key: 'highRisk',     title: 'High Risk Findings',  desc: 'Immediate alerts when high-risk infringement signals are detected.' },
                      { key: 'weeklyReport', title: 'Weekly Report',        desc: 'Receive a summary of your portfolio activity every Monday.' },
                      { key: 'newMatches',   title: 'New Matches',          desc: 'Notify me when new patent matches are found for any monitored patent.' },
                      { key: 'systemAlerts', title: 'System Alerts',        desc: 'Maintenance windows, updates, and platform announcements.' },
                      { key: 'emailDigest',  title: 'Email Digest',         desc: 'Consolidated daily email with all activity from the past 24 hours.' },
                    ].map(({ key, title, desc }) => (
                      <div key={key} className="prof-notif-row">
                        <div className="prof-notif-text">
                          <div className="prof-notif-title">{title}</div>
                          <div className="prof-notif-desc">{desc}</div>
                        </div>
                        <button
                          className={`prof-toggle${notifs[key] ? ' on' : ''}`}
                          onClick={() => setNotifs((n) => ({ ...n, [key]: !n[key] }))}
                          aria-label={`Toggle ${title}`}
                          type="button"
                        >
                          <span className="prof-toggle-knob" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="prof-form-actions" style={{ marginTop: 28 }}>
                    <button className="btn-green prof-save-btn">
                      <Save size={14} /> Save Preferences
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .tn-sep       { display: block; }
        .tn-sub       { display: block; }
        .tn-btn-label { display: inline; }
        .tn-btn--home span { display: inline; }

        /* ════════════════════
           PROFILE LAYOUT
        ════════════════════ */
        .prof-layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 24px;
          align-items: start;
          animation: fadeInUp 0.45s ease-out both;
        }

        .prof-aside {
          background: var(--surf, #F5F2EC);
          border: 1px solid var(--rule, rgba(13,40,24,0.08));
          border-radius: 16px;
          overflow: hidden;
          position: sticky;
          top: 24px;
        }

        .prof-avatar-wrap {
          padding: 28px 20px 20px;
          display: flex; flex-direction: column; align-items: center; text-align: center;
          border-bottom: 1px solid var(--rule, rgba(13,40,24,0.08));
          background: var(--bg, #FAFAF7);
        }

        .prof-avatar {
          position: relative;
          width: 72px; height: 72px; border-radius: 50%;
          background: var(--acc-soft, rgba(46,125,50,0.10));
          border: 2px solid var(--accent, #2E7D32);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px; flex-shrink: 0;
        }

        .prof-initials {
          font-family: 'Libre Baskerville', serif;
          font-size: 22px; font-weight: 700;
          color: var(--accent, #2E7D32);
          letter-spacing: -0.02em; user-select: none;
        }

        .prof-avatar-btn {
          position: absolute; bottom: -2px; right: -2px;
          width: 24px; height: 24px; border-radius: 50%;
          background: var(--accent, #2E7D32);
          border: 2px solid var(--bg, #FAFAF7);
          color: #fff; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.15s, transform 0.15s;
        }
        .prof-avatar-btn:hover { background: #256427; transform: scale(1.1); }

        .prof-name {
          font-family: 'Libre Baskerville', serif;
          font-size: 17px; font-weight: 700;
          color: var(--deep, #0D2818); margin-bottom: 4px;
        }

        .prof-role-tag {
          font-family: 'Inconsolata', monospace;
          font-size: 10px; text-transform: uppercase; letter-spacing: 0.10em;
          color: var(--accent, #2E7D32);
          background: var(--acc-soft, rgba(46,125,50,0.10));
          padding: 3px 10px; border-radius: 5px; margin-bottom: 8px;
        }

        .prof-company {
          display: flex; align-items: center; gap: 5px;
          font-size: 12px; color: var(--ink3);
        }

        .prof-stats {
          display: grid; grid-template-columns: repeat(3, 1fr);
          border-bottom: 1px solid var(--rule, rgba(13,40,24,0.08));
        }

        .prof-stat {
          padding: 14px 8px; text-align: center;
          border-right: 1px solid var(--rule, rgba(13,40,24,0.08));
        }
        .prof-stat:last-child { border-right: none; }
        .prof-stat-val {
          font-family: 'Libre Baskerville', serif;
          font-size: 18px; font-weight: 700; color: var(--deep, #0D2818);
        }
        .prof-stat-lbl {
          font-family: 'Inconsolata', monospace;
          font-size: 9px; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--ink3); margin-top: 2px;
        }

        .prof-nav {
          padding: 8px; display: flex; flex-direction: column; gap: 2px;
        }

        .prof-nav-item {
          all: unset; cursor: pointer;
          display: flex; align-items: center; gap: 9px;
          padding: 9px 12px; border-radius: 9px;
          font-family: 'Jost', sans-serif;
          font-size: 13.5px; font-weight: 500; color: var(--ink2);
          transition: background 0.14s, color 0.14s;
          -webkit-tap-highlight-color: transparent;
        }
        .prof-nav-item:hover  { background: var(--bg, #FAFAF7); color: var(--ink); }
        .prof-nav-item.active {
          background: var(--acc-soft, rgba(46,125,50,0.10));
          color: var(--accent, #2E7D32); font-weight: 600;
        }
        .prof-nav-ico    { display: flex; align-items: center; flex-shrink: 0; }
        .prof-nav-arrow  { margin-left: auto; opacity: 0.4; }
        .prof-nav-sep    { height: 1px; background: var(--rule, rgba(13,40,24,0.08)); margin: 6px 4px; }
        .prof-nav-danger { color: var(--red) !important; }
        .prof-nav-danger:hover { background: rgba(185,28,28,0.06) !important; }

        .prof-main  { min-width: 0; }

        .prof-panel {
          background: var(--bg, #FAFAF7);
          border: 1px solid var(--rule, rgba(13,40,24,0.08));
          border-radius: 16px; padding: 28px;
          animation: fadeInUp 0.3s ease-out both;
        }

        .prof-panel-hd {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 24px; padding-bottom: 20px;
          border-bottom: 1px solid var(--rule, rgba(13,40,24,0.08));
        }

        .prof-panel-ico {
          width: 32px; height: 32px; border-radius: 8px;
          background: var(--acc-soft, rgba(46,125,50,0.10));
          display: flex; align-items: center; justify-content: center;
          color: var(--accent, #2E7D32); flex-shrink: 0;
        }

        .prof-panel-eye {
          font-family: 'Inconsolata', monospace;
          font-size: 9.5px; text-transform: uppercase;
          letter-spacing: 0.12em; color: var(--ink3); margin-bottom: 2px;
        }

        .prof-panel-title { font-size: 15px; font-weight: 700; color: var(--ink); }

        .prof-form-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 16px; margin-bottom: 20px;
        }
        .prof-form-full { grid-column: 1 / -1; }

        .prof-form-actions {
          display: flex; align-items: center; gap: 14px; padding-top: 4px;
        }

        .prof-save-btn {
          display: inline-flex; align-items: center; gap: 7px; padding: 9px 22px;
        }

        .prof-saved-badge {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: 'Inconsolata', monospace;
          font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;
          color: var(--accent, #2E7D32);
          background: var(--acc-soft, rgba(46,125,50,0.10));
          padding: 5px 12px; border-radius: 6px;
          animation: fadeInUp 0.25s ease-out both;
        }

        .prof-section-hd {
          display: flex; align-items: center; gap: 7px;
          font-family: 'Inconsolata', monospace;
          font-size: 10px; text-transform: uppercase;
          letter-spacing: 0.12em; color: var(--ink3); margin-bottom: 16px;
        }

        .prof-info-list {
          background: var(--surf, #F5F2EC);
          border: 1px solid var(--rule, rgba(13,40,24,0.08));
          border-radius: 10px; overflow: hidden;
        }
        .prof-info-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid var(--rule2, rgba(13,40,24,0.05));
          font-size: 13px;
        }
        .prof-info-row:last-child { border-bottom: none; }
        .prof-info-label { color: var(--ink3); }
        .prof-info-val   { color: var(--ink); font-weight: 600; }
        .prof-info-val.badge-green {
          color: var(--accent, #2E7D32);
          background: var(--acc-soft, rgba(46,125,50,0.10));
          font-family: 'Inconsolata', monospace;
          font-size: 11px; padding: 2px 9px; border-radius: 5px;
        }

        .prof-error {
          display: flex; align-items: flex-start; gap: 9px;
          background: rgba(185,28,28,0.06);
          border: 1px solid rgba(185,28,28,0.18);
          border-left: 3px solid var(--red);
          border-radius: 0 6px 6px 0;
          padding: 11px 14px; margin-bottom: 18px;
          font-size: 13px; color: var(--red); line-height: 1.5;
        }

        .prof-danger-section {
          background: rgba(185,28,28,0.03);
          border: 1px solid rgba(185,28,28,0.14);
          border-radius: 10px; padding: 18px;
        }
        .prof-danger-btn {
          all: unset; cursor: pointer;
          display: inline-flex; align-items: center;
          font-family: 'Jost', sans-serif;
          font-size: 13px; font-weight: 600;
          color: var(--red);
          border: 1.5px solid rgba(185,28,28,0.30);
          padding: 8px 18px; border-radius: 8px;
          transition: background 0.15s, border-color 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .prof-danger-btn:hover { background: rgba(185,28,28,0.08); border-color: var(--red); }

        .prof-notif-list  { display: flex; flex-direction: column; }
        .prof-notif-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 0;
          border-bottom: 1px solid var(--rule2, rgba(13,40,24,0.05)); gap: 20px;
        }
        .prof-notif-row:last-child { border-bottom: none; }
        .prof-notif-text  { flex: 1; min-width: 0; }
        .prof-notif-title { font-size: 14px; font-weight: 600; color: var(--ink); margin-bottom: 3px; }
        .prof-notif-desc  { font-size: 12.5px; color: var(--ink3); line-height: 1.55; }

        .prof-toggle {
          all: unset; cursor: pointer;
          width: 40px; height: 22px; flex-shrink: 0;
          background: var(--surf2, rgba(13,40,24,0.10));
          border-radius: 99px; position: relative;
          transition: background 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .prof-toggle.on { background: var(--accent, #2E7D32); }
        .prof-toggle-knob {
          position: absolute; top: 3px; left: 3px;
          width: 16px; height: 16px; border-radius: 50%;
          background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.18);
          transition: transform 0.2s cubic-bezier(0.22,1,0.36,1);
        }
        .prof-toggle.on .prof-toggle-knob { transform: translateX(18px); }

        /* ════════════════════════
           RESPONSIVE
        ════════════════════════ */
        @media (max-width: 1023px) {
          .tn-sep { display: none; } .tn-sub { display: none; }
          .dash-content { padding: 20px 20px 40px !important; }
          .prof-layout { grid-template-columns: 220px 1fr; gap: 18px; }
        }

        @media (max-width: 899px) {
          .prof-layout { grid-template-columns: 1fr; gap: 16px; }
          .prof-aside {
            position: static; display: grid;
            grid-template-columns: auto 1fr;
            grid-template-rows: auto auto; align-items: start;
          }
          .prof-avatar-wrap {
            grid-row: 1 / 3; padding: 20px 16px;
            border-bottom: none;
            border-right: 1px solid var(--rule, rgba(13,40,24,0.08));
            min-width: 160px;
          }
          .prof-stats { grid-column: 2; grid-row: 1; }
          .prof-nav {
            grid-column: 2; grid-row: 2;
            flex-direction: row; flex-wrap: wrap; gap: 4px; padding: 8px;
            border-top: 1px solid var(--rule, rgba(13,40,24,0.08));
          }
          .prof-nav-item { flex: 1; min-width: 100px; justify-content: center; gap: 6px; }
          .prof-nav-arrow { display: none; }
          .prof-nav-sep   { display: none; }
          .prof-nav-danger { flex: none; }
        }

        @media (max-width: 767px) {
          .tn-center { display: none; } .tn-btn--home span { display: none; }
          .dash-content { padding: 16px 16px 40px !important; }
          .prof-aside { display: block; }
          .prof-avatar-wrap { border-right: none; border-bottom: 1px solid var(--rule, rgba(13,40,24,0.08)); }
          .prof-nav { flex-direction: row; flex-wrap: wrap; border-top: none; }
          .prof-nav-item { font-size: 12.5px; }
          .prof-panel { padding: 20px 18px; }
          .prof-form-grid { grid-template-columns: 1fr; gap: 12px; }
          .prof-form-full { grid-column: 1; }
          .page-hd { flex-direction: column !important; }
          .page-title { font-size: 22px !important; }
        }

        @media (max-width: 599px) {
          .topnav { padding: 0 12px !important; height: 50px !important; }
          .tn-center { display: none; } .tn-vsep { display: none !important; }
          .tn-btn--home { display: none !important; } .tn-btn-label { display: none; }
          .dash-content { padding: 14px 12px 40px !important; }
          .prof-panel { padding: 16px 14px; }
          .prof-panel-hd { margin-bottom: 18px; padding-bottom: 14px; }
          .prof-notif-row { gap: 12px; }
          .prof-form-actions { flex-direction: column; align-items: flex-start; gap: 10px; }
          .prof-save-btn { width: 100%; justify-content: center; }
          .page-title { font-size: 20px !important; }
        }

        @media (max-width: 379px) {
          .dash-content { padding: 12px 10px 32px !important; }
          .prof-panel { padding: 14px 12px; }
          .prof-name { font-size: 15px; } .prof-stat-val { font-size: 16px; }
        }
      `}</style>
    </div>
  );
}