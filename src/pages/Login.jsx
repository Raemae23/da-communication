// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Loader2, Eye, EyeOff, UserPlus, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { loginUser, registerUser, logoutUser } from '../services/firebase/auth';

// --- NEW: Import your DA Logo ---
import daLogo from '../assets/images/da-logo.png';
import daBackground from '../assets/images/da-background.jpg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false); // --- NEW: Toggle State ---
  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    setToastMessage({ show: true, message, type });
    setTimeout(() => {
      setToastMessage(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        const result = await registerUser(email, password);
        if (result.success) {
          // Immediately log them out so they must re-enter credentials
          await logoutUser();
          showToast('Account successfully saved! Please sign in with your new credentials.', 'success');
          setIsRegistering(false);
          setPassword('');
          setLoading(false);
        } else {
          setError(result.error);
          setLoading(false);
        }
      } else {
        const result = await loginUser(email, password);
        if (result.success) {
          navigate('/dashboard');
        } else {
          setError(result.error);
          setLoading(false);
        }
      }
    } catch (err) {
      setError(`Failed to ${isRegistering ? 'register' : 'log in'}. Please check your connection.`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center font-sans overflow-hidden relative bg-slate-900">

      {/* --- TOAST NOTIFICATION --- */}
      {toastMessage.show && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-6 duration-300 min-w-[300px] border ${toastMessage.type === 'success'
          ? 'bg-emerald-50/95 backdrop-blur-md border-emerald-200 text-emerald-800 shadow-emerald-900/20'
          : 'bg-red-50/95 backdrop-blur-md border-red-200 text-red-800 shadow-red-900/20'
          }`}>
          {toastMessage.type === 'success'
            ? <CheckCircle size={28} className="text-emerald-600" />
            : <ShieldAlert size={28} className="text-red-600" />
          }
          <div className="flex flex-col">
            <span className="font-black text-[10px] uppercase tracking-widest opacity-70">
              {toastMessage.type === 'success' ? 'Success' : 'Attention'}
            </span>
            <span className="font-bold text-sm tracking-tight">{toastMessage.message}</span>
          </div>
          <button
            onClick={() => setToastMessage(prev => ({ ...prev, show: false }))}
            className="ml-auto p-1.5 hover:bg-black/5 rounded-full transition-colors"
          >
            <XCircle size={18} className="opacity-50 hover:opacity-100" />
          </button>
        </div>
      )}

      {/* Dynamic Ambient Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#1E5631]/80 backdrop-blur-[2px] mix-blend-multiply z-10 transition-all"></div>
        <img src={daBackground} alt="Background" className="w-full h-full object-cover opacity-60 z-0 scale-105" />

        {/* Magical Glowing Orbs */}
        <div className="absolute top-[10%] right-[15%] w-[40rem] h-[40rem] bg-[#D4AF37]/30 rounded-full blur-[120px] animate-[pulse_6s_ease-in-out_infinite] z-10 pointer-events-none"></div>
        <div className="absolute -bottom-[10%] -left-[10%] w-[50rem] h-[50rem] bg-[#1E5631]/80 rounded-full blur-[150px] animate-[pulse_8s_ease-in-out_infinite] delay-1000 z-10 pointer-events-none"></div>
      </div>

      {/* Main Glassmorphism Card */}
      <div className="relative z-20 w-full max-w-[960px] max-h-[640px] min-h-[540px] flex flex-col lg:flex-row rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)] mx-4 border border-white/20">

        {/* Left Side: Modern Glass Branding */}
        <div className="p-10 lg:p-14 flex-[1.1] flex flex-col items-center justify-center text-center relative bg-white/10 backdrop-blur-2xl border-b lg:border-b-0 lg:border-r border-white/20">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent z-0 pointer-events-none"></div>

          {/* Logo Showcase */}
          <div className="relative z-10 w-32 h-32 lg:w-40 lg:h-40 bg-white/10 backdrop-blur-xl rounded-full p-3 mx-auto mb-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 transform hover:-translate-y-2 transition-transform duration-500 flex items-center justify-center overflow-hidden">
            <div className="w-full h-full bg-[#FFFFFF] rounded-full flex items-center justify-center p-2 shadow-inner">
              <img src={daLogo} alt="DA Logo" className="w-[90%] h-[90%] object-contain drop-shadow-md" />
            </div>
          </div>

          <h1 className="relative z-10 text-3xl lg:text-4xl font-black text-white mb-2 tracking-tighter leading-tight drop-shadow-2xl">
            Department of <br /><span className="text-[#D4AF37] drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]">Agriculture</span>
          </h1>
          <div className="relative z-10 h-1.5 w-20 bg-gradient-to-r from-white/10 via-[#D4AF37] to-white/10 mx-auto mb-5 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.6)]"></div>

          <div className="relative z-10 space-y-1 bg-black/10 px-6 py-3 rounded-3xl backdrop-blur-sm border border-white/10 shadow-xl">
            <p className="text-white text-sm lg:text-base font-light tracking-wide italic">Agribusiness and Marketing Assistance Division</p>
            <p className="text-[#D4AF37] uppercase tracking-[0.4em] text-[9px] lg:text-[10px] font-black">Communication System</p>
          </div>
        </div>

        {/* Right Side: Ultra Clean Premium Form */}
        <div className="flex-1 p-8 lg:p-12 bg-[#FFFFFF] flex flex-col justify-center relative overflow-y-auto">
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-[#1E5631]/5 rounded-full blur-[100px] -mr-64 -mt-64 pointer-events-none"></div>

          <div className="mb-7 relative z-10">
            <h2 className="text-3xl lg:text-4xl font-black text-[#2B2B2B] tracking-tighter mb-1">Welcome</h2>
            <p className="text-xs font-bold text-[#2B2B2B]/40 uppercase tracking-[0.3em]">
              {isRegistering ? 'Create a new staff account' : 'Verify your credentials to continue'}
            </p>
          </div>

          <form className="space-y-4 relative z-10" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-[11px] font-black uppercase tracking-widest p-5 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]"></div>
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="group">
                <label className="block text-[10px] font-black text-[#2B2B2B]/60 uppercase tracking-[0.3em] mb-4 ml-2 transition-colors group-focus-within:text-[#1E5631]">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <Mail size={18} className="text-[#2B2B2B]/30 group-focus-within:text-[#1E5631] transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-16 pr-6 py-6 bg-[#F8F9FA] border-2 border-slate-100 text-[#2B2B2B] rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] focus:bg-[#FFFFFF] transition-all font-bold text-sm shadow-[0_8px_20px_rgba(0,0,0,0.02)] hover:border-slate-200"
                    placeholder="name@da.gov.ph"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[10px] font-black text-[#2B2B2B]/60 uppercase tracking-[0.3em] mb-4 ml-2 transition-colors group-focus-within:text-[#1E5631]">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <Lock size={18} className="text-[#2B2B2B]/30 group-focus-within:text-[#1E5631] transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="block w-full pl-16 pr-16 py-6 bg-[#F8F9FA] border-2 border-slate-100 text-[#2B2B2B] rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] focus:bg-[#FFFFFF] transition-all font-bold text-sm shadow-[0_8px_20px_rgba(0,0,0,0.02)] hover:border-slate-200 tracking-widest"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-6 flex items-center text-[#2B2B2B]/40 hover:text-[#1E5631] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative flex justify-center items-center gap-3 py-4 mt-3 bg-gradient-to-r from-[#1E5631] to-[#153a21] hover:from-[#153a21] hover:to-[#0d2a17] text-[#FFFFFF] text-[13px] font-black rounded-[1.5rem] shadow-[0_15px_30px_rgba(30,86,49,0.3)] hover:shadow-[0_20px_40px_rgba(30,86,49,0.4)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-70 group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                isRegistering ? <UserPlus size={18} /> : <LogIn size={18} />
              )}
              <span className="tracking-[0.2em] uppercase">
                {loading ? (isRegistering ? 'Creating...' : 'Verifying...') : (isRegistering ? 'Create Account' : 'Secure Login')}
              </span>
            </button>

            <div className="text-center mt-5 text-[10px] font-black text-[#2B2B2B]/40 uppercase tracking-[0.25em]">
              {isRegistering ? (
                <>
                  Already registered?{' '}
                  <button type="button" onClick={() => setIsRegistering(false)} className="text-[#1E5631] hover:text-[#D4AF37] transition-colors ml-2 underline underline-offset-4 decoration-[#1E5631]/30 hover:decoration-[#D4AF37]">
                    Sign In Here
                  </button>
                </>
              ) : (
                <>
                  Need an account?{' '}
                  <button type="button" onClick={() => setIsRegistering(true)} className="text-[#1E5631] hover:text-[#D4AF37] transition-colors ml-2 underline underline-offset-4 decoration-[#1E5631]/30 hover:decoration-[#D4AF37]">
                    Create Account
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;