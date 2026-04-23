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

  const formatDate = (dateString, fallback) => {
    if (!dateString) return fallback || 'PENDING';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  const { userRole, isAdmin, isStaff } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'All Classification',
    status: 'All Status',
    dateFrom: '',
    dateTo: ''
  });

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
    navigate('/create', { state: { defaultType: docTypeCode, editData: doc } });
  };

  const handleDirectPrint = (doc) => {
    const docTypeCode = getDocTypeCode(doc.type);
    navigate('/create', { state: { defaultType: docTypeCode, editData: doc, autoPrint: true } });
  };

  const handleDuplicate = (doc) => {
    const docCopy = { ...doc };
    delete docCopy.id;
    docCopy.number = '';
    docCopy.dateLine = '';
    const docTypeCode = getDocTypeCode(doc.type);
    navigate('/create', { state: { defaultType: docTypeCode, editData: docCopy } });
  };

  const handleExportCSV = () => {
    if (filteredDocuments.length === 0) { alert("No data available to export."); return; }
    const headers = ["Document ID", "Type", "Series/Number", "Subject", "Status", "Date Filed"];
    const rows = filteredDocuments.map(doc => [
      doc.id,
      `"${doc.type}"`,
      `"${doc.number !== '-' ? `${doc.number} / s. ${doc.year}` : `Series of ${doc.year}`}"`,
      `"${(doc.subject || '').replace(/"/g, '""')}"`,
      `"${doc.status || 'Draft'}"`,
      `"${doc.dateLine || doc.date || ''}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `damimaropa_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setFilters({ type: 'All Classification', status: 'All Status', dateFrom: '', dateTo: '' });
    setSearchTerm('');
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch =
      doc.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.number && doc.number.includes(searchTerm));
    const matchesType = filters.type === 'All Classification' || doc.type === filters.type;
    const docActualStatus = doc.status || 'Draft';
    const matchesStatus = filters.status === 'All Status' || docActualStatus === filters.status;
    let matchesDateRange = true;
    if (filters.dateFrom || filters.dateTo) {
      const docDateString = doc.dateLine || doc.date;
      if (docDateString) {
        const docDate = new Date(docDateString).getTime();
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom).getTime() : 0;
        const toDate = filters.dateTo ? new Date(filters.dateTo).setHours(23, 59, 59, 999) : Infinity;
        if (!isNaN(docDate)) { matchesDateRange = docDate >= fromDate && docDate <= toDate; }
      }
    }
    return matchesSearch && matchesType && matchesStatus && matchesDateRange;
  });

  const typeColors = {
    'Administrative Order': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    'Special Order': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
    'Memorandum': { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
    'Official Letter': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  };

  const statusStyles = {
    'Approved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Pending Review': 'bg-amber-50 text-amber-700 border-amber-200',
    'Cancelled': 'bg-red-50 text-red-600 border-red-200',
    'Rejected': 'bg-red-50 text-red-600 border-red-200',
    'Draft': 'bg-slate-100 text-slate-500 border-slate-200',
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans overflow-x-hidden text-[#2B2B2B]">

      {/* ── NAVBAR ── */}
      <nav className="bg-[#1E5631] px-6 sm:px-10 py-3 flex justify-between items-center w-full sticky top-0 z-50 border-b-[3px] border-[#D4AF37] shadow-lg">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-full shadow border-2 border-white/70 shrink-0">
            <img src={daLogo} alt="DA Logo" className="h-10 w-10 object-contain" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-black text-xl text-white tracking-tight">DA-MIMAROPA · Agribusiness & Marketing Assistance Division</span>
            <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#D4AF37] mt-0.5">Document System</span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex gap-2 items-center">
          <Link
            to="/create"
            className="bg-[#D4AF37] hover:bg-[#f0c53e] text-[#1a4a2a] px-5 py-2 rounded-xl font-black shadow-md active:scale-95 transition-all flex items-center gap-2 text-xs tracking-wider uppercase"
          >
            <PlusCircle size={15} />
            New Document
          </Link>

          <div className="h-6 w-px bg-white/20 mx-1" />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 relative text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              title="Notifications"
            >
              <Bell size={18} />
              {recentHappenings.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D4AF37] border-2 border-[#1E5631] rounded-full" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in slide-in-from-top-4 fade-in duration-200">
                <div className="bg-[#F8F9FA] px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-black text-[10px] uppercase tracking-widest text-[#2B2B2B]">Recent Activity</h4>
                  <span className="bg-[#1E5631]/10 text-[#1E5631] text-[9px] font-bold px-2 py-0.5 rounded-full">{recentHappenings.length}</span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {recentHappenings.length === 0 ? (
                    <div className="p-8 flex flex-col items-center justify-center text-slate-400">
                      <Archive size={22} className="mb-2 opacity-40" />
                      <span className="text-xs font-bold uppercase tracking-wide">No recent activity</span>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {recentHappenings.map((doc, idx) => (
                        <Link
                          to={`/preview/${doc.id}`}
                          key={idx}
                          className="px-5 py-3.5 hover:bg-[#F8F9FA] transition-colors flex items-start gap-3 group block w-full text-left"
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${doc.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : doc.status === 'Pending Review' ? 'bg-amber-50 text-amber-500' : 'bg-slate-100 text-slate-400'}`}>
                            <FileText size={14} />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[9px] font-bold text-[#2B2B2B]/50 uppercase tracking-wider">{doc.type || 'Document'}</span>
                              <span className="text-[9px] text-[#2B2B2B]/30 whitespace-nowrap">{formatDate(doc.createdAt, 'Just now')}</span>
                            </div>
                            <p className="text-xs font-bold text-[#2B2B2B] truncate mt-0.5 group-hover:text-[#1E5631] transition-colors">{doc.subject || 'Untitled Document'}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Link to="/settings" className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all" title="Settings">
            <Settings size={18} />
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 text-white/80 hover:text-white hover:bg-red-500/80 rounded-xl transition-all font-black text-xs uppercase tracking-wider"
            title="Log Out"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 px-6 py-8 lg:px-12 flex flex-col max-w-[1600px] mx-auto w-full gap-8">

        {/* ── PAGE HEADER ── */}
        <div>
          <h1 className="text-2xl font-black text-[#1E5631] tracking-tight">Document Repository</h1>
          <p className="text-xs text-[#2B2B2B]/40 font-semibold mt-0.5 uppercase tracking-widest"></p>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

          {/* Total Issuances */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute right-0 top-0 w-28 h-28 bg-[#1E5631]/[0.04] rounded-full -mr-8 -mt-8 group-hover:scale-125 transition-transform duration-500" />
            <div className="bg-[#1E5631]/10 p-3.5 rounded-xl text-[#1E5631] shrink-0">
              <FileText size={22} />
            </div>
            <div>
              <div className="text-4xl font-black text-[#1E5631] tracking-tight leading-none">{documents.length}</div>
              <div className="text-[10px] font-black text-[#2B2B2B]/40 uppercase tracking-widest mt-1.5">Total Issuances</div>
            </div>
          </div>

          {/* Approved */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute right-0 top-0 w-28 h-28 bg-[#D4AF37]/[0.06] rounded-full -mr-8 -mt-8 group-hover:scale-125 transition-transform duration-500" />
            <div className="bg-[#D4AF37]/15 p-3.5 rounded-xl text-[#c49b20] shrink-0">
              <CheckCircle size={22} />
            </div>
            <div>
              <div className="text-4xl font-black text-[#c49b20] tracking-tight leading-none">{documents.filter(d => d.status === 'Approved').length}</div>
              <div className="text-[10px] font-black text-[#2B2B2B]/40 uppercase tracking-widest mt-1.5">Approved</div>
            </div>
          </div>

          {/* Drafts */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute right-0 top-0 w-28 h-28 bg-slate-400/[0.05] rounded-full -mr-8 -mt-8 group-hover:scale-125 transition-transform duration-500" />
            <div className="bg-slate-100 p-3.5 rounded-xl text-slate-500 shrink-0">
              <Archive size={22} />
            </div>
            <div>
              <div className="text-4xl font-black text-slate-500 tracking-tight leading-none">{documents.filter(d => d.status === 'Draft' || !d.status).length}</div>
              <div className="text-[10px] font-black text-[#2B2B2B]/40 uppercase tracking-widest mt-1.5">Drafts</div>
            </div>
          </div>
        </div>

        {/* ── REPOSITORY TABLE CARD ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">

          {/* Search + Filter Bar */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1E5631]/60" />
              <input
                type="text"
                placeholder="Search by subject, type, or number..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-xl text-sm font-semibold text-[#2B2B2B] placeholder:text-[#2B2B2B]/30 focus:outline-none focus:ring-2 focus:ring-[#1E5631]/20 focus:border-[#1E5631] transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shrink-0 ${showFilters ? 'bg-[#1E5631] text-white shadow-md' : 'bg-[#F8F9FA] text-[#2B2B2B]/60 border border-slate-200 hover:border-[#1E5631] hover:text-[#1E5631]'}`}
            >
              <Filter size={14} />
              {showFilters ? 'Filters On' : 'Filters'}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="px-6 py-4 bg-[#FAFAFA] border-b border-slate-100 animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-[#2B2B2B]/40 uppercase tracking-widest mb-1.5">Classification</label>
                  <select
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#1E5631]/20 transition-all"
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  >
                    <option value="All Classification">All Types</option>
                    <option value="Administrative Order">Administrative Order</option>
                    <option value="Special Order">Special Order</option>
                    <option value="Memorandum">Memorandum</option>
                    <option value="Official Letter">Official Letter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-[#2B2B2B]/40 uppercase tracking-widest mb-1.5">Status</label>
                  <select
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#1E5631]/20 transition-all"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <option value="All Status">All Status</option>
                    <option value="Draft">Draft</option>
                    <option value="Pending Review">Pending Review</option>
                    <option value="Approved">Approved</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-[#2B2B2B]/40 uppercase tracking-widest mb-1.5">Date From</label>
                  <input type="date" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#1E5631]/20 transition-all"
                    value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-[9px] font-black text-[#2B2B2B]/40 uppercase tracking-widest mb-1.5">Date To</label>
                    <input type="date" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#1E5631]/20 transition-all"
                      value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
                  </div>
                  <button onClick={clearFilters}
                    className="h-[38px] px-4 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-100 font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 shrink-0">
                    <RefreshCw size={12} /> Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F8F9FA] text-[#2B2B2B]/40 text-[9px] uppercase tracking-[0.2em] font-black border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 w-[22%]">Type / Number</th>
                  <th className="px-6 py-4 w-[38%]">Subject</th>
                  <th className="px-6 py-4 w-[13%]">Date Filed</th>
                  <th className="px-6 py-4 w-[12%] text-center">Status</th>
                  <th className="px-6 py-4 w-[15%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 size={28} className="animate-spin text-[#1E5631]" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Loading documents...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
                        <div className="bg-slate-50 p-5 rounded-2xl text-slate-200 border border-dashed border-slate-200">
                          <FileText size={40} />
                        </div>
                        <div>
                          <p className="font-black text-sm text-slate-600 uppercase tracking-wide">No Documents Found</p>
                          <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters.</p>
                        </div>
                        <button onClick={clearFilters} className="text-[10px] font-black text-[#1E5631] uppercase tracking-widest px-4 py-2 bg-white border border-slate-200 rounded-xl hover:border-[#1E5631] transition-all">
                          Clear Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => {
                    const tc = typeColors[doc.type] || { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200', dot: 'bg-slate-400' };
                    const ss = statusStyles[doc.status] || statusStyles['Draft'];
                    return (
                      <tr
                        key={doc.id}
                        onClick={() => handleEditOrPrint(doc)}
                        className="hover:bg-[#F8FFFE] transition-colors duration-150 group border-l-2 border-l-transparent hover:border-l-[#1E5631] cursor-pointer"
                      >
                        {/* Type + Number */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md border ${tc.bg} ${tc.text} ${tc.border} mb-1.5`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
                            {doc.type}
                          </span>
                          <div className="text-[10px] font-bold text-[#2B2B2B]/40 tracking-wide">
                            {doc.number !== '-' ? `No. ${doc.number} · S-${doc.year}` : `Series ${doc.year}`}
                          </div>
                        </td>

                        {/* Subject */}
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-[#2B2B2B]/80 line-clamp-2 leading-snug group-hover:text-[#1E5631] transition-colors" title={doc.subject}>
                            {doc.subject || 'No Subject Declared'}
                          </p>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-xs font-bold text-[#2B2B2B]/40 whitespace-nowrap">
                          {formatDate(doc.createdAt, doc.dateLine || doc.date)}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${ss}`}>
                            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${doc.status === 'Approved' ? 'bg-emerald-500' : doc.status === 'Pending Review' ? 'bg-amber-400' : doc.status === 'Cancelled' || doc.status === 'Rejected' ? 'bg-red-500' : 'bg-slate-400'}`} />
                            {doc.status || 'Draft'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button onClick={(e) => { e.stopPropagation(); handleEditOrPrint(doc); }}
                              className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-[#1E5631] hover:border-[#1E5631] hover:bg-emerald-50 rounded-lg transition-all shadow-sm" title="Edit">
                              <Edit size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDirectPrint(doc); }}
                              className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-[#1E5631] hover:border-[#1E5631] hover:bg-emerald-50 rounded-lg transition-all shadow-sm" title="Print">
                              <Printer size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteTrigger(doc); }}
                              className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 rounded-lg transition-all shadow-sm" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          {!loading && filteredDocuments.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-100 bg-[#FAFAFA] flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Showing {filteredDocuments.length} of {documents.length} records
              </span>
              {(searchTerm || filters.type !== 'All Classification' || filters.status !== 'All Status') && (
                <button onClick={clearFilters} className="text-[10px] font-black text-[#1E5631] uppercase tracking-widest hover:underline">
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="px-10 py-6 bg-white border-t border-slate-100 text-center">
        <div className="flex items-center justify-center gap-6 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <img src={daLogo} className="h-7 w-7 object-contain" alt="DA" />
            <span className="text-xs font-black uppercase tracking-widest text-[#1E5631]">Department of Agriculture</span>
          </div>
          <span className="text-xs font-bold text-slate-300">|</span>
          <span className="text-xs font-black uppercase tracking-widest text-[#1E5631]/70">DA-AMAD Communication System © 2026</span>
        </div>
        <p className="text-[11px] text-slate-400 font-medium max-w-lg mx-auto leading-relaxed">
          This system contains sensitive government data. Governed by Republic Act No. 10173 (Data Privacy Act of 2012).
        </p>
      </footer>

      {/* ── DELETE MODAL ── */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-7 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight">Delete Document?</h3>
                <p className="text-slate-400 text-xs mt-1">This action is permanent and cannot be undone.</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                >Cancel</button>
                <button
                  onClick={executeDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
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