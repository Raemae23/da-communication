// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, FilePlus, Archive, CheckCircle, Search, Filter, Printer, Edit, Trash2, PlusCircle, Loader2, LogOut, Copy, Download, RefreshCw, X, AlertTriangle, Settings, Bell } from 'lucide-react';
// IMPORT FIREBASE FUNCTIONS
import { fetchDocuments, deleteDocument } from '../services/firebase/firestore';
import { logoutUser } from '../services/firebase/auth';

// --- NEW: Import DA Logo ---
import daLogo from '../assets/images/da-logo.png';
import { useAuth } from '../context/AuthContext'; // --- NEW: Import Auth Context ---

const Dashboard = () => {
  const navigate = useNavigate();

  // --- NEW: Date Formatting Utility ---
  const formatDate = (dateString, fallback) => {
    if (!dateString) return fallback || 'PENDING';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return as-is if it's already a string like "March 18, 2026"

      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };
  const { userRole, isAdmin, isStaff } = useAuth(); // --- NEW: Consume Auth Context ---
  const [searchTerm, setSearchTerm] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- NEW: Custom Deletion State ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- NEW: Advanced Filters State ---
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'All Classification',
    status: 'All Status',
    dateFrom: '',
    dateTo: ''
  });

  // --- NEW: Notifications State ---
  const [showNotifications, setShowNotifications] = useState(false);

  const recentHappenings = [...documents]
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || a.dateLine || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || b.dateLine || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 5);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const result = await fetchDocuments();
      if (result.success) {
        setDocuments(result.data);
      } else {
        console.error("Failed to load documents:", result.error);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const handleDeleteTrigger = (doc) => {
    setDocumentToDelete(doc);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!documentToDelete) return;

    setIsDeleting(true);
    const result = await deleteDocument(documentToDelete.id);
    if (result.success) {
      setDocuments(documents.filter(doc => doc.id !== documentToDelete.id));
      setIsDeleteModalOpen(false);
      setDocumentToDelete(null);
    } else {
      alert("Failed to delete document. Please try again.");
    }
    setIsDeleting(false);
  };

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      navigate('/');
    } else {
      alert("Failed to log out. Try again.");
    }
  };

  const getDocTypeCode = (typeString) => {
    switch (typeString) {
      case 'Administrative Order': return 'AO';
      case 'Special Order': return 'SO';
      case 'Memorandum': return 'MEMO';
      case 'Official Letter': return 'LETTER';
      default: return 'AO';
    }
  };

  const handleEditOrPrint = (doc) => {
    const docTypeCode = getDocTypeCode(doc.type);
    navigate('/create', {
      state: {
        defaultType: docTypeCode,
        editData: doc
      }
    });
  };

  const handleDuplicate = (doc) => {
    // 1. Copy the document data
    const docCopy = { ...doc };
    // 2. Remove the unique ID and sensitive trace info
    delete docCopy.id;
    docCopy.number = '';
    docCopy.dateLine = '';
    // Set a flag if needed, or simply let the target page know it's prefilled data
    const docTypeCode = getDocTypeCode(doc.type);

    navigate('/create', {
      state: {
        defaultType: docTypeCode,
        editData: docCopy
      }
    });
  };

  const handleExportCSV = () => {
    if (filteredDocuments.length === 0) {
      alert("No data available to export.");
      return;
    }

    // 1. Define CSV Headers
    const headers = ["Document ID", "Type", "Series/Number", "Subject", "Status", "Date Filed"];

    // 2. Map data to rows
    const rows = filteredDocuments.map(doc => [
      doc.id,
      `"${doc.type}"`, // Wrap in quotes to prevent issue with commas in text
      `"${doc.number !== '-' ? `${doc.number} / s. ${doc.year}` : `Series of ${doc.year}`}"`,
      `"${(doc.subject || '').replace(/"/g, '""')}"`, // escape existing quotes
      `"${doc.status || 'Draft'}"`,
      `"${doc.dateLine || doc.date || ''}"`
    ]);

    // 3. Combine headers and rows
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    // 4. Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `damimaropa_issuance_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setFilters({ type: 'All Classification', status: 'All Status', dateFrom: '', dateTo: '' });
    setSearchTerm('');
  };

  const filteredDocuments = documents.filter(doc => {
    // 1. Search Query execution
    const matchesSearch =
      doc.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.number && doc.number.includes(searchTerm));

    // 2. Advanced Filtering Context logic
    const matchesType = filters.type === 'All Classification' || doc.type === filters.type;
    // Handle 'Drafts' capturing both explicit 'Draft' and missing status fields
    const docActualStatus = doc.status || 'Draft';
    const matchesStatus = filters.status === 'All Status' || docActualStatus === filters.status;

    // Basic date parsing (very rudimentary, suitable for basic string compares or proper ISO dates)
    let matchesDateRange = true;
    if (filters.dateFrom || filters.dateTo) {
      const docDateString = doc.dateLine || doc.date;
      if (docDateString) {
        const docDate = new Date(docDateString).getTime();
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom).getTime() : 0;
        const toDate = filters.dateTo ? new Date(filters.dateTo).setHours(23, 59, 59, 999) : Infinity;

        if (!isNaN(docDate)) {
          matchesDateRange = docDate >= fromDate && docDate <= toDate;
        }
      }
    }

    return matchesSearch && matchesType && matchesStatus && matchesDateRange;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans overflow-x-hidden text-[#2B2B2B]">

      {/* --- PREMIUM DASHBOARD NAVBAR --- */}
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

        <div className="flex gap-4 items-center">
          <Link
            to="/create"
            className="bg-[#D4AF37] hover:bg-[#F4C430] text-[#1E5631] px-6 py-3 rounded-2xl font-black shadow-lg shadow-[#D4AF37]/20 active:scale-95 transition-all flex items-center gap-2.5 text-xs tracking-wider uppercase"
          >
            <PlusCircle size={18} />
            Create New Document
          </Link>
          <div className="h-8 w-px bg-white/20 mx-2"></div>

          {/* NOTIFICATIONS DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-3 relative text-white/90 hover:text-white hover:bg-white/10 rounded-2xl transition-all border border-transparent"
              title="Notifications"
            >
              <Bell size={20} />
              {recentHappenings.length > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#D4AF37] border-2 border-[#1E5631] rounded-full"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-[#FFFFFF] rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in slide-in-from-top-4 fade-in duration-200">
                <div className="bg-[#F8F9FA] px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-black text-xs uppercase tracking-widest text-[#2B2B2B]">Recent Happenings</h4>
                  <span className="bg-[#1E5631]/10 text-[#1E5631] text-[9px] font-bold px-2 py-0.5 rounded-full">{recentHappenings.length} NEW</span>
                </div>
                <div className="max-h-80 overflow-y-auto w-full">
                  {recentHappenings.length === 0 ? (
                    <div className="p-6 flex flex-col items-center justify-center text-slate-400">
                      <Archive size={24} className="mb-2 opacity-50" />
                      <span className="text-xs font-bold uppercase tracking-wide">No recent activity</span>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {recentHappenings.map((doc, idx) => (
                        <Link
                          to={`/preview/${doc.id}`}
                          key={idx}
                          className="px-5 py-4 hover:bg-[#F8F9FA] transition-colors flex items-start gap-4 group block w-full text-left"
                        >
                          <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${doc.status === 'Approved' ? 'bg-[#1E5631]/10 text-[#1E5631]' : doc.status === 'Pending Review' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-slate-100 text-slate-500'}`}>
                            <FileText size={16} />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[10px] font-bold text-[#2B2B2B]/60 uppercase tracking-wider">{doc.type || 'Document'}</span>
                              <span className="text-[9px] text-[#2B2B2B]/40 whitespace-nowrap">{formatDate(doc.createdAt, 'Just now')}</span>
                            </div>
                            <p className="text-sm font-bold text-[#2B2B2B] truncate mt-1 group-hover:text-[#1E5631] transition-colors">{doc.subject || doc.title || 'Untitled Document'}</p>
                            <p className="text-xs font-semibold text-[#2B2B2B]/60 mt-1 truncate">
                              {doc.status === 'Approved' ? 'Has been released and approved' :
                                doc.status === 'Pending Review' ? 'Is currently pending review' : 'Was saved as a draft'}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <Link
            to="/settings"
            className="p-3 text-white/90 hover:text-white hover:bg-white/10 rounded-2xl transition-all border border-transparent"
            title="Settings"
          >
            <Settings size={20} />
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-3 text-white/90 hover:text-white hover:bg-red-500 rounded-2xl transition-all border border-transparent font-black text-xs uppercase tracking-wider"
            title="Secure Logout"
          >
            <LogOut size={20} />
            Log out
          </button>
        </div>
      </nav>

      <main className="flex-1 px-8 py-10 lg:px-16 flex flex-col max-w-[1800px] mx-auto w-full space-y-12">

        {/* --- PERFORMANCE SNAPSHOT (STATS) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-[#FFFFFF] rounded-[2rem] shadow-sm p-5 group relative overflow-hidden border-2 border-transparent hover:border-[#1E5631]/20 transition-all">
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#1E5631]/5 blur-2xl rounded-full -mr-10 -mt-10 transition-all"></div>
            <div className="flex items-center justify-between mb-3">
              <div className="bg-[#F8F9FA] p-2.5 rounded-xl text-[#1E5631] group-hover:scale-110 group-hover:rotate-3 transition-transform border border-[#1E5631]/10">
                <FileText size={18} />
              </div>
            </div>
            <div className="text-4xl font-black text-[#2B2B2B] tracking-tighter mb-1">{documents.length}</div>
            <div className="text-sm font-bold text-[#2B2B2B]/60 uppercase tracking-widest leading-none">Total Classified Issuances</div>
          </div>

          <div className="bg-[#FFFFFF] rounded-[2rem] shadow-sm p-5 group relative overflow-hidden border-2 border-transparent hover:border-[#D4AF37]/40 transition-all">
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#D4AF37]/5 blur-2xl rounded-full -mr-10 -mt-10 transition-all"></div>
            <div className="flex items-center justify-between mb-3">
              <div className="bg-[#F8F9FA] p-2.5 rounded-xl text-[#D4AF37] group-hover:scale-110 group-hover:-rotate-3 transition-transform border border-[#D4AF37]/20">
                <CheckCircle size={18} />
              </div>
            </div>
            <div className="text-4xl font-black text-[#2B2B2B] tracking-tighter mb-1">{documents.filter(d => d.status === 'Approved').length}</div>
            <div className="text-sm font-bold text-[#2B2B2B]/60 uppercase tracking-widest leading-none">Official Approved Documents</div>
          </div>

          <div className="bg-[#FFFFFF] rounded-[2rem] shadow-sm p-5 group relative overflow-hidden border-2 border-transparent hover:border-slate-300 transition-all">
            <div className="absolute top-0 right-0 w-20 h-20 bg-slate-500/5 blur-2xl rounded-full -mr-10 -mt-10 transition-all"></div>
            <div className="flex items-center justify-between mb-3">
              <div className="bg-[#F8F9FA] p-2.5 rounded-xl text-[#2B2B2B]/50 group-hover:scale-110 group-hover:rotate-3 transition-transform border border-slate-200">
                <Archive size={18} />
              </div>
            </div>
            <div className="text-4xl font-black text-[#2B2B2B] tracking-tighter mb-1">{documents.filter(d => d.status === 'Draft' || !d.status).length}</div>
            <div className="text-sm font-bold text-[#2B2B2B]/60 uppercase tracking-widest leading-none">Active Unsealed Drafts</div>
          </div>
        </div>

        {/* --- REPOSITORY EXPLORER --- */}
        <div className="bg-[#FFFFFF] rounded-[2rem] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="p-8 border-b border-[#F8F9FA] bg-[#F8F9FA]/80">
            <div className="flex flex-col xl:flex-row gap-6 items-center">
              <div className="flex-1 w-full relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#2B2B2B]/40 group-focus-within:text-[#1E5631] transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="Query repository by subject, series, or issuance type..."
                  className="w-full pl-14 pr-6 py-4.5 bg-[#FFFFFF] border-2 border-slate-100 rounded-[1.25rem] focus:border-[#1E5631] focus:outline-none transition-all text-[#2B2B2B] font-bold text-sm shadow-sm placeholder:text-[#2B2B2B]/40"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-3 w-full xl:w-auto">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex-1 xl:flex-none flex items-center justify-center gap-3 px-8 py-4.5 rounded-[1.25rem] font-black text-xs uppercase tracking-widest transition-all shadow-md ${showFilters
                    ? 'bg-[#1E5631] text-[#FFFFFF] shadow-[#1E5631]/20'
                    : 'bg-[#FFFFFF] border-2 border-slate-100 text-[#2B2B2B] hover:border-[#1E5631] hover:text-[#1E5631]'
                    }`}
                >
                  <Filter size={18} /> {showFilters ? 'Hide Parameters' : 'Search Parameters'}
                </button>
                {isAdmin && (
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center justify-center gap-3 px-8 py-4.5 bg-[#FFFFFF] border-2 border-slate-100 rounded-[1.25rem] hover:border-[#D4AF37] hover:text-[#D4AF37] font-black text-xs uppercase tracking-widest text-[#2B2B2B] transition-all shadow-md active:scale-95"
                    title="Export Research Data"
                  >
                    <Download size={18} /> Export
                  </button>
                )}
              </div>
            </div>

            {/* --- PARAMETER TUNING PANEL --- */}
            {showFilters && (
              <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-[#2B2B2B]/60 uppercase tracking-widest ml-1">Issuance Classification</label>
                  <select
                    className="w-full px-5 py-3.5 bg-[#FFFFFF] border-2 border-slate-100 rounded-2xl text-xs font-black text-[#2B2B2B] focus:outline-none focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] transition-all cursor-pointer"
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  >
                    <option value="All Classification">All Categories</option>
                    <option value="Administrative Order">Administrative Order</option>
                    <option value="Special Order">Special Order</option>
                    <option value="Memorandum">Memorandum</option>
                    <option value="Official Letter">Official Letter</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-[#2B2B2B]/60 uppercase tracking-widest ml-1">Lifecycle Status</label>
                  <select
                    className="w-full px-5 py-3.5 bg-[#FFFFFF] border-2 border-slate-100 rounded-2xl text-xs font-black text-[#2B2B2B] focus:outline-none focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] transition-all cursor-pointer"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <option value="All Status">Any Status</option>
                    <option value="Draft">Drafting Phase</option>
                    <option value="Pending Review">Awaiting Review</option>
                    <option value="Approved">Legally Bound (Approved)</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-[#2B2B2B]/60 uppercase tracking-widest ml-1">Chronological Start</label>
                  <input
                    type="date"
                    className="w-full px-5 py-3.5 bg-[#FFFFFF] border-2 border-slate-100 rounded-2xl text-xs font-black text-[#2B2B2B] focus:outline-none focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] transition-all"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 items-end">
                  <div className="flex-1 space-y-3">
                    <label className="block text-[10px] font-black text-[#2B2B2B]/60 uppercase tracking-widest ml-1">Chronological End</label>
                    <input
                      type="date"
                      className="w-full px-5 py-3.5 bg-[#FFFFFF] border-2 border-slate-100 rounded-2xl text-xs font-black text-[#2B2B2B] focus:outline-none focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] transition-all"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    />
                  </div>
                  <button
                    onClick={clearFilters}
                    className="px-5 py-3.5 bg-[#F8F9FA] hover:bg-slate-200 text-[#2B2B2B] rounded-2xl transition-all shadow-inner h-[52px] w-[52px] flex items-center justify-center shrink-0 border-2 border-slate-100 hover:border-slate-300"
                    title="Reset Parameters"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* --- DATA REPOSITORY TABLE --- */}
          <div className="overflow-x-auto min-h-[600px] bg-[#FFFFFF]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F8F9FA] text-[#2B2B2B] uppercase text-[9px] tracking-[0.2em] font-black border-b border-slate-100 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="px-8 py-6 w-[22%]">Record Identity</th>
                  <th className="px-8 py-6 w-[38%]">Formal Subject / Purpose</th>
                  <th className="px-8 py-6 w-[15%]">Filing Date</th>
                  <th className="px-8 py-6 w-[12%] text-center">Lifecycle</th>
                  <th className="px-8 py-6 w-[13%] text-right font-black">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-5">
                        <div className="relative">
                          <div className="w-16 h-16 border-4 border-slate-100 rounded-full"></div>
                          <div className="w-16 h-16 border-4 border-da-green-700 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                        </div>
                        <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse">Synchronizing Cloud Repository...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-32 text-center">
                      <div className="flex flex-col items-center gap-6 max-w-sm mx-auto p-12 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 text-slate-200">
                          <FileText size={56} />
                        </div>
                        <div className="space-y-2">
                          <p className="font-black text-slate-800 uppercase tracking-widest">No Matches Found</p>
                          <p className="text-xs text-slate-400 font-bold leading-relaxed">Your query returned zero records. Please refine your search parameters or synchronize with the latest updates.</p>
                        </div>
                        <button onClick={clearFilters} className="text-[10px] font-black text-da-green-700 uppercase tracking-widest px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-da-green-700 transition-all">Clear Search Filter</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => (
                    <tr
                      key={doc.id}
                      onClick={() => handleEditOrPrint(doc)}
                      className="hover:bg-[#1E5631]/5 transition-all group border-l-4 border-l-transparent hover:border-l-[#1E5631] cursor-pointer"
                    >
                      <td className="px-8 py-6">
                        <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border mb-2 transition-all shadow-sm ${doc.type === 'Administrative Order' ? 'bg-[#1E5631]/10 text-[#1E5631] border-[#1E5631]/20' :
                          doc.type === 'Special Order' ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20' :
                            doc.type === 'Memorandum' ? 'bg-[#2B2B2B]/10 text-[#2B2B2B]/80 border-[#2B2B2B]/20' :
                              doc.type === 'Official Letter' ? 'bg-[#1E5631]/5 text-[#1E5631]/80 border-[#1E5631]/10' :
                                'bg-[#F8F9FA] text-[#2B2B2B]/60 border-slate-200'
                          }`}>
                          {doc.type}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center rounded-lg bg-[#F8F9FA] px-2.5 py-1 text-[9px] font-black text-[#2B2B2B]/60 tracking-[0.1em] border border-slate-200">
                            {doc.number !== '-' ? `# ${doc.number} / S- ${doc.year}` : `SERIES ${doc.year}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="font-bold text-[#2B2B2B]/80 text-[13px] leading-relaxed max-w-2xl group-hover:text-[#2B2B2B] transition-colors line-clamp-2 italic" title={doc.subject}>
                          {doc.subject || 'Indefinite Subject Declaration'}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-[#2B2B2B]/60 font-bold text-[11px] uppercase tracking-wider">
                        {formatDate(doc.createdAt, doc.dateLine || doc.date)}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm transition-all ${doc.status === 'Approved'
                            ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20'
                            : doc.status === 'Pending Review'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : doc.status === 'Cancelled' || doc.status === 'Rejected'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-[#1E5631]/10 text-[#1E5631] border-[#1E5631]/20'
                            }`}>
                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${doc.status === 'Approved' ? 'bg-[#D4AF37]' :
                              doc.status === 'Pending Review' ? 'bg-blue-500' :
                                doc.status === 'Cancelled' || doc.status === 'Rejected' ? 'bg-red-500' :
                                  'bg-[#1E5631]'
                              }`}></div>
                            {doc.status || 'Draft'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-all">
                          <button onClick={(e) => { e.stopPropagation(); handleEditOrPrint(doc); }} className="p-3 bg-[#FFFFFF] border border-slate-200 text-[#2B2B2B]/40 hover:text-[#1E5631] hover:border-[#1E5631] hover:bg-[#1E5631]/5 rounded-xl transition-all shadow-sm" title="Edit Metadata">
                            <Edit size={16} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDuplicate(doc); }} className="p-3 bg-[#FFFFFF] border border-slate-200 text-[#2B2B2B]/40 hover:text-[#D4AF37] hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 rounded-xl transition-all shadow-sm" title="Clone Record">
                            <Copy size={16} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleEditOrPrint(doc); }} className="p-3 bg-[#FFFFFF] border border-slate-200 text-[#2B2B2B]/40 hover:text-[#1E5631] hover:border-[#1E5631] hover:bg-[#1E5631]/5 rounded-xl transition-all shadow-sm" title="Provision Official Document">
                            <Printer size={16} />
                          </button>
                          {isAdmin && (
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteTrigger(doc); }} className="p-3 bg-[#FFFFFF] border border-slate-200 text-[#2B2B2B]/40 hover:text-red-700 hover:border-red-700 hover:bg-red-50 rounded-xl transition-all shadow-sm" title="Expunge Data">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="px-16 py-10 bg-[#FFFFFF] border-t border-slate-200 text-center">
        <div className="flex items-center justify-center gap-10 mb-6 flex-wrap">
          <div className="flex items-center gap-3 transition-all cursor-default">
            <img src={daLogo} className="h-8 w-8 object-contain" alt="DA" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1E5631]">Department of Agriculture</span>
          </div>
          <div className="h-4 w-px bg-slate-300"></div>
          <div className="text-[10px] font-black uppercase tracking-widest text-[#1E5631] opacity-80">DA-MIMAROPA Communication System © 2026</div>
        </div>
        <p className="text-[9px] text-[#1E5631] font-bold max-w-3xl mx-auto uppercase tracking-widest leading-relaxed">
          This repository contains sensitive government data. Access is governed by Republic Act No. 10173 (Data Privacy Act of 2012).
        </p>
      </footer>

      {/* --- DELETION MODAL --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center space-y-4">
              <div className="mx-auto w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                <Trash2 size={28} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Delete Document?</h3>
                <p className="text-slate-400 text-xs mt-1">This action cannot be undone.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;