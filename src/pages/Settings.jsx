// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Settings, User, Bell, Shield, Palette,
  Save, Loader2, ArrowLeft,
  Monitor, Moon, Sun, CheckCircle, AlertCircle, Image as ImageIcon
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
  // ── Branding state ──────────────────────────────────────────────────────
  const [headerPreview, setHeaderPreview] = useState(() => localStorage.getItem('da_custom_header') || null);
  const [footerPreview, setFooterPreview] = useState(() => localStorage.getItem('da_custom_footer') || null);

  const handleImageUpload = (type, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2.5 * 1024 * 1024) {
        flash(setProfileMsg, 'error', 'Image is too large. Max 2.5MB allowed.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'header') {
          setHeaderPreview(reader.result);
          localStorage.setItem('da_custom_header', reader.result);
        } else {
          setFooterPreview(reader.result);
          localStorage.setItem('da_custom_footer', reader.result);
        }
        flash(setProfileMsg, 'success', `${type === 'header' ? 'Header' : 'Footer'} image updated successfully!`);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetBranding = (type) => {
      if (type === 'header') {
         localStorage.removeItem('da_custom_header');
         setHeaderPreview(null);
      } else {
         localStorage.removeItem('da_custom_footer');
         setFooterPreview(null);
      }
      flash(setProfileMsg, 'success', `${type === 'header' ? 'Header' : 'Footer'} reset to default.`);
  };



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

        {/* ── DOCUMENT BRANDING ────────────────────────────────────────────── */}
        <SettingsSection icon={ImageIcon} title="Document Branding" description="Customize printed document headers and footers">
          <SettingsField label="Custom Header">
            <div className="space-y-3">
              {headerPreview ? (
                <div className="w-full bg-[#FFFFFF] border-2 border-slate-200 rounded-xl overflow-hidden shadow-inner p-4 relative flex justify-center h-[120px] items-center">
                  <img src={headerPreview} alt="Header Preview" className="h-full object-contain" />
                </div>
              ) : (
                <div className="w-full bg-[#F8F9FA] border-2 border-dashed border-slate-200 rounded-xl shadow-inner p-4 flex justify-center h-[120px] items-center">
                   <span className="text-[11px] font-bold text-[#2B2B2B]/40 uppercase tracking-widest">No Custom Header (Using Default)</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer bg-[#FFFFFF] border-2 border-dashed border-[#1E5631]/30 hover:border-[#1E5631] hover:bg-[#1E5631]/5 text-center py-3 rounded-2xl transition-all">
                  <span className="text-[11px] font-black text-[#1E5631] uppercase tracking-widest flex items-center justify-center gap-2">
                    <ImageIcon size={14} /> Upload Header Image
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload('header', e)} />
                </label>
                {headerPreview && (
                  <button onClick={() => resetBranding('header')} className="px-5 py-3 bg-red-50 text-red-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-100 transition-all border-2 border-red-100">
                    Reset
                  </button>
                )}
              </div>
            </div>
          </SettingsField>

          <SettingsField label="Custom Footer">
            <div className="space-y-3">
              {footerPreview ? (
                <div className="w-full bg-[#FFFFFF] border-2 border-slate-200 rounded-xl overflow-hidden shadow-inner p-4 relative flex justify-center h-[120px] items-center">
                  <img src={footerPreview} alt="Footer Preview" className="h-full object-contain" />
                </div>
              ) : (
                <div className="w-full bg-[#F8F9FA] border-2 border-dashed border-slate-200 rounded-xl shadow-inner p-4 flex justify-center h-[120px] items-center">
                   <span className="text-[11px] font-bold text-[#2B2B2B]/40 uppercase tracking-widest">No Custom Footer (Using Default)</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer bg-[#FFFFFF] border-2 border-dashed border-[#1E5631]/30 hover:border-[#1E5631] hover:bg-[#1E5631]/5 text-center py-3 rounded-2xl transition-all">
                  <span className="text-[11px] font-black text-[#1E5631] uppercase tracking-widest flex items-center justify-center gap-2">
                    <ImageIcon size={14} /> Upload Footer Image
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload('footer', e)} />
                </label>
                {footerPreview && (
                  <button onClick={() => resetBranding('footer')} className="px-5 py-3 bg-red-50 text-red-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-100 transition-all border-2 border-red-100">
                    Reset
                  </button>
                )}
              </div>
            </div>
          </SettingsField>
        </SettingsSection>
      </main>
    </div>
  );
};

export default Settings_Page;
