// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Loader2, Eye, EyeOff, UserPlus, ShieldAlert } from 'lucide-react';
import { loginUser, registerUser } from '../services/firebase/auth';

// --- NEW: Import your DA Logo ---
import daLogo from '../assets/images/da-logo.png';
import daBackground from '../assets/images/da-background.jpg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false); // --- NEW: Toggle State ---
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (isRegistering) {
        result = await registerUser(email, password);
      } else {
        result = await loginUser(email, password);
      }

      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      setError(`Failed to ${isRegistering ? 'register' : 'log in'}. Please check your connection.`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col md:flex-row bg-[#F8F9FA] font-sans overflow-hidden">

      {/* Left Side: Branding & Info (Hidden on mobile) */}
      <div className="hidden md:flex flex-1 relative overflow-hidden bg-[#1E5631] items-center justify-center p-12">
        <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: `url(${daBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
        <div className="absolute inset-0 bg-[#1E5631]/40 backdrop-blur-sm z-10"></div>
        <div className="absolute top-0 left-0 w-full h-full z-15 pointer-events-none opacity-30" style={{ backgroundImage: 'radial-gradient(#D4AF37 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }}></div>

        <div className="relative z-20 max-w-2xl lg:max-w-4xl text-center">
          <div className="w-56 h-56 bg-[#FFFFFF] rounded-full p-0 mx-auto mb-10 shadow-2xl border-4 border-white/20 transform hover:scale-105 transition-transform duration-500 overflow-hidden flex items-center justify-center">
            <img src={daLogo} alt="DA Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl lg:text-6xl font-black text-white mb-2 tracking-tight leading-tight whitespace-nowrap">
            Department of <span className="text-[#D4AF37]">Agriculture</span>
          </h1>
          <div className="h-1.5 w-24 bg-[#D4AF37] mx-auto mb-4 rounded-full"></div>
          <div className="space-y-1 mb-10">
            <p className="text-white text-2xl font-light tracking-wide italic opacity-90">MIMAROPA Regional Field Office</p>
            <p className="text-[#D4AF37] uppercase tracking-[0.3em] text-sm font-white">Issuance Management System</p>
          </div>
        </div>
      </div>

      {/* Right Side: Authentication Form */}
      <div className="w-full md:w-[500px] lg:w-[600px] flex items-center justify-center p-8 md:p-12 bg-[#FFFFFF] relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#1E5631]/5 rounded-full blur-[100px] -mr-32 -mt-32 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-[100px] -ml-32 -mb-32 opacity-50"></div>

        <div className="w-full max-w-lg relative z-10">
          <div className="md:hidden text-center mb-10">
            <div className="w-32 h-32 bg-[#FFFFFF] rounded-full p-0 mx-auto mb-5 shadow-lg flex items-center justify-center border-2 border-slate-100 overflow-hidden">
              <img src={daLogo} alt="DA Logo" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-2xl font-black text-[#1E5631]">DA-MIMAROPA</h2>
            <p className="text-[10px] uppercase font-bold text-[#2B2B2B]/40 tracking-widest">Issuance & Correspondence</p>
          </div>

          <div className="mb-10 text-center md:text-left">
            {isRegistering && (
              <p className="text-[#2B2B2B]/60 font-medium">
                Provision a new staff account
              </p>
            )}
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-2 border-red-100 text-red-700 text-xs font-bold p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="group">
                <label className="block text-[12px] font-black text-[#2B2B2B]/60 uppercase tracking-[0.2em] mb-4 ml-1 transition-colors group-focus-within:text-[#1E5631]">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <Mail size={20} className="text-[#2B2B2B]/40 group-focus-within:text-[#1E5631] transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-16 pr-6 py-5 bg-[#F8F9FA] border-2 border-[#F8F9FA] text-[#2B2B2B] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] focus:bg-[#FFFFFF] transition-all font-bold text-base"
                    placeholder="name@da.gov.ph"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[12px] font-black text-[#2B2B2B]/60 uppercase tracking-[0.2em] mb-4 ml-1 transition-colors group-focus-within:text-[#1E5631]">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <Lock size={20} className="text-[#2B2B2B]/40 group-focus-within:text-[#1E5631] transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="block w-full pl-16 pr-16 py-5 bg-[#F8F9FA] border-2 border-[#F8F9FA] text-[#2B2B2B] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] focus:bg-[#FFFFFF] transition-all font-bold text-base"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-6 flex items-center text-[#2B2B2B]/40 hover:text-[#1E5631] transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full relative flex justify-center items-center gap-3 py-5 bg-[#1E5631] hover:bg-[#153a21] text-[#FFFFFF] text-base font-black rounded-2xl shadow-xl shadow-[#1E5631]/20 active:scale-90 transition-all duration-300 disabled:opacity-70 group overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FFFFFF]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                isRegistering ? <UserPlus size={20} /> : <LogIn size={20} />
              )}
              <span className="tracking-widest uppercase">
                {loading ? (isRegistering ? 'CREATING...' : 'VERIFYING...') : (isRegistering ? 'PROVISION ACCOUNT' : 'SIGN IN')}
              </span>
            </button>

          </form>

          <div className="mt-16 bg-[#F8F9FA] border border-slate-200 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#D4AF37]"></div>
            <div className="flex items-center gap-3 mb-3">
              <ShieldAlert size={18} className="text-[#D4AF37]" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#2B2B2B]">System Warning</span>
            </div>
            <p className="text-[11px] text-[#2B2B2B]/60 font-bold leading-relaxed">
              This is a <span className="text-[#2B2B2B]">private government system</span>. All activities are monitored and logged. Unauthorized access is strictly prohibited and punishable by law under the <span className="text-[#2B2B2B]">Cybercrime Prevention Act</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;