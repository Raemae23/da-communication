// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Settings, User, Bell, Shield, Palette,
  Save, Loader2, ArrowLeft,
  Monitor, Moon, Sun, CheckCircle, AlertCircle
} from 'lucide-react';
import { updateUserProfile } from '../services/firebase/auth';
import { useAuth } from '../context/AuthContext';
import daLogo from '../assets/images/da-logo.png';

// ─── Reusable Section Wrapper ──────────────────────────────────────────────
const SettingsSection = ({ icon: Icon, title, description, children }) => (
  <div className="bg-[#FFFFFF] rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="px-8 py-6 border-b border-[#F8F9FA] flex items-center gap-4">
      <div className="bg-[#1E5631]/10 p-3 rounded-2xl text-[#1E5631]">
        <Icon size={20} />
      </div>
      <div>
        <h2 className="font-black text-[#2B2B2B] text-sm uppercase tracking-wider">{title}</h2>
        {description && <p className="text-xs text-[#2B2B2B]/60 font-bold mt-0.5">{description}</p>}
      </div>
    </div>
    <div className="px-8 py-6 space-y-6">{children}</div>
  </div>
);

// ─── Field Row ─────────────────────────────────────────────────────────────
const SettingsField = ({ label, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
    <label className="text-[11px] font-black text-[#2B2B2B]/80 uppercase tracking-widest sm:w-48 shrink-0">{label}</label>
    <div className="flex-1">{children}</div>
  </div>
);

const inputClass =
  "w-full px-5 py-3.5 bg-[#FFFFFF] border-2 border-[#F8F9FA] rounded-2xl text-sm font-bold text-[#2B2B2B] focus:outline-none focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] transition-all";

// ─── Main Component ────────────────────────────────────────────────────────
const Settings_Page = () => {
  const navigate = useNavigate();
  const { isAdmin, currentUser } = useAuth();

  // ── Profile state ──────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null); // {type:'success'|'error', text}


  // ── Appearance state ───────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => localStorage.getItem('da_theme') || 'system');

  // ── Notifications state ────────────────────────────────────────────────
  const [notifs, setNotifs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('da_notifs')) || {
        documentUpdates: true,
        approvals: true,
        systemAlerts: false,
      };
    } catch {
      return { documentUpdates: true, approvals: true, systemAlerts: false };
    }
  });
  const [notifSaved, setNotifSaved] = useState(false);

  // ── Apply theme to <html> ──────────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (t) => {
      if (t === 'dark') root.classList.add('dark');
      else root.classList.remove('dark');
    };
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mq.matches ? 'dark' : 'light');
      const handler = (e) => applyTheme(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      applyTheme(theme);
    }
    localStorage.setItem('da_theme', theme);
  }, [theme]);

  // ── Helpers ────────────────────────────────────────────────────────────
  const flash = (setter, type, text, duration = 4000) => {
    setter({ type, text });
    setTimeout(() => setter(null), duration);
  };

  // ── Profile submit ─────────────────────────────────────────────────────
  const handleProfileSave = async () => {
    if (!displayName.trim()) {
      flash(setProfileMsg, 'error', 'Display name cannot be empty.');
      return;
    }
    setProfileSaving(true);
    const result = await updateUserProfile(displayName.trim());
    setProfileSaving(false);
    if (result.success) {
      flash(setProfileMsg, 'success', 'Display name updated successfully!');
    } else {
      flash(setProfileMsg, 'error', result.error || 'Failed to update profile.');
    }
  };


  // ── Notification save ──────────────────────────────────────────────────
  const handleNotifSave = () => {
    localStorage.setItem('da_notifs', JSON.stringify(notifs));
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 3000);
  };


  const Toggle = ({ checked, onChange }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${checked ? 'bg-[#1E5631]' : 'bg-slate-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  const FeedbackBanner = ({ msg }) => {
    if (!msg) return null;
    const isSuccess = msg.type === 'success';
    return (
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-xs font-bold border ${isSuccess ? 'bg-[#1E5631]/10 border-[#1E5631]/20 text-[#1E5631]' : 'bg-red-50 border-red-100 text-red-700'}`}>
        {isSuccess ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
        {msg.text}
      </div>
    );
  };


  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">

      {/* NAVBAR */}
      <nav className="bg-[#1E5631] px-8 py-5 flex justify-between items-center w-full sticky top-0 z-50 border-b-4 border-[#D4AF37] shadow-lg shadow-[#1E5631]/20">
        <div className="flex items-center gap-5">
          <div className="bg-[#FFFFFF] p-2.5 rounded-xl shadow-md transition-transform hover:scale-105">
            <img src={daLogo} alt="DA Logo" className="h-8 w-8 object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl text-[#FFFFFF] leading-none tracking-tight">DA-MIMAROPA</span>
            <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#D4AF37] mt-1">Institutional Communication</span>
          </div>
        </div>
      </nav>

      <main className="flex-1 px-8 py-10 lg:px-16 max-w-[900px] mx-auto w-full space-y-8">

        {/* Page Header */}
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2.5 bg-[#FFFFFF] border border-slate-200 rounded-2xl text-[#2B2B2B]/40 hover:text-[#1E5631] hover:border-[#1E5631] hover:bg-[#1E5631]/10 transition-all shadow-sm" title="Back to Dashboard">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-black text-[#2B2B2B] tracking-tight flex items-center gap-3">
            <Settings size={24} className="text-[#1E5631]" /> System Settings
          </h1>
        </div>

        {/* Role Badge */}
        <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border text-xs font-black uppercase tracking-widest w-fit ${isAdmin ? 'bg-[#D4AF37]/10 border-[#D4AF37]/20 text-[#D4AF37]' : 'bg-[#1E5631]/10 border-[#1E5631]/20 text-[#1E5631]'}`}>
          <Shield size={14} />
          {isAdmin ? 'System Administrator' : 'Staff Encoder'}
          <span className="opacity-40">•</span>
          {currentUser?.email}
        </div>

        {/* ── PROFILE ──────────────────────────────────────────────────────── */}
        <SettingsSection icon={User} title="Profile" description="Update your display name">
          <SettingsField label="Email Address">
            <input type="email" className={inputClass + ' opacity-60 cursor-not-allowed'} value={currentUser?.email || ''} readOnly />
          </SettingsField>
          <SettingsField label="Display Name">
            <input
              type="text"
              className={inputClass}
              placeholder="Enter your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </SettingsField>
          <SettingsField label="Role">
            <div className="px-5 py-3.5 bg-[#F8F9FA] border-2 border-slate-200 rounded-2xl text-sm font-black text-[#2B2B2B]/60 uppercase tracking-widest opacity-60">
              {isAdmin ? 'Administrator' : 'Staff Encoder'}
            </div>
          </SettingsField>
          <FeedbackBanner msg={profileMsg} />
          <div className="flex justify-end">
            <button
              onClick={handleProfileSave}
              disabled={profileSaving}
              className="px-8 py-3.5 bg-[#1E5631] hover:bg-[#153a21] text-[#FFFFFF] rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#1E5631]/20 active:scale-95 transition-all duration-300 disabled:opacity-60 flex items-center gap-2.5"
            >
              {profileSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {profileSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </SettingsSection>


        {/* ── APPEARANCE ───────────────────────────────────────────────────── */}
        <SettingsSection icon={Palette} title="Appearance" description="Customize your interface theme">
          <SettingsField label="Theme">
            <div className="flex gap-3">
              {[
                { value: 'light', icon: Sun, label: 'Light' },
                { value: 'dark', icon: Moon, label: 'Dark' },
                { value: 'system', icon: Monitor, label: 'System' },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all ${theme === value ? 'bg-[#1E5631]/10 border-[#1E5631] text-[#1E5631]' : 'bg-[#F8F9FA] border-slate-200 text-[#2B2B2B]/40 hover:border-[#1E5631]/50'}`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </SettingsField>
          <p className="text-[11px] text-[#2B2B2B]/60 font-bold ml-1">Theme preference is saved instantly and persists across sessions.</p>
        </SettingsSection>

        {/* ── NOTIFICATIONS ─────────────────────────────────────────────────── */}
        <SettingsSection icon={Bell} title="Notifications" description="Control what alerts you receive">
          {[
            { key: 'documentUpdates', label: 'Document Updates', desc: 'Get notified when a document is modified' },
            { key: 'approvals', label: 'Approval Requests', desc: 'Receive alerts when documents need your review' },
            { key: 'systemAlerts', label: 'System Alerts', desc: 'Maintenance and security notifications' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black text-[#2B2B2B]">{label}</p>
                <p className="text-xs text-[#2B2B2B]/60 font-bold">{desc}</p>
              </div>
              <Toggle checked={notifs[key]} onChange={(val) => setNotifs({ ...notifs, [key]: val })} />
            </div>
          ))}
          <div className="flex items-center justify-between pt-2">
            {notifSaved && (
              <span className="flex items-center gap-2 text-xs font-bold text-[#1E5631]">
                <CheckCircle size={14} /> Notification preferences saved!
              </span>
            )}
            <div className="ml-auto">
              <button
                onClick={handleNotifSave}
                className="px-8 py-3.5 bg-[#1E5631] hover:bg-[#153a21] text-[#FFFFFF] rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#1E5631]/20 active:scale-95 transition-all duration-300 flex items-center gap-2.5"
              >
                <Save size={15} /> Save Notifications
              </button>
            </div>
          </div>
        </SettingsSection>

        {/* Bottom Spacer */}
        <div className="pb-10" />
      </main>
    </div>
  );
};

export default Settings_Page;
