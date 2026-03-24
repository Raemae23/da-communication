// src/pages/CreateDocument.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Printer, FileText, Save, Loader2, Wand2, CheckCircle, Zap, Plus, Trash2, ZoomIn, ZoomOut, Maximize2, AlertTriangle, XCircle } from 'lucide-react';
// IMPORT FIREBASE FUNCTIONS
import { saveDocument, updateDocument } from '../services/firebase/firestore';

import AdministrativeOrder from '../templates/AdministrativeOrder';
import SpecialOrder from '../templates/SpecialOrder';
import OfficialLetter from '../templates/OfficialLetter';
import Memorandum from '../templates/Memorandum';

// --- IMPORT TINYMCE FOR RICH TEXT EDITING ---
import { Editor } from '@tinymce/tinymce-react';

import { useAuth } from '../context/AuthContext';

// --- NEW: Import DA Logo ---
import daLogo from '../assets/images/da-logo.png';

// --- SMART SNIPPETS FOR QUICK WRITING ---
const SNIPPETS = {
  AO: [
    "All circulars, orders, and issuances inconsistent herewith are hereby repealed.",
    "This Order shall take effect immediately upon signing.",
    "Done this ___ day of ____, YYYY."
  ],
  SO: [
    "In the exigency of service and in support of [Opening Statement]...",
    "The primary objective of this designation/authority is to...",
    "The following personnel are hereby authorized to...",
    "They shall perform the following duties and responsibilities:",
    "All traveling expenses and per diems shall be chargeable against...",
    "This Order shall take effect immediately and shall remain in force until revoked in writing. All other orders, memoranda, and issuances inconsistent herewith are deemed revoked or modified accordingly.",
    "Issued this _____ day of (MonthYYYY)."
  ],
  MEMO: [
    "In line with the directives of...",
    "The primary purpose of this memorandum is to...",
    "You are hereby instructed to...",
    "All reports must be submitted on or before...",
    "Please be guided accordingly."
  ],
  LETTER: [
    "The Department of Agriculture-MIMAROPA respectfully invites...",
    "Here are the details of the activity:",
    "This initiative is in line with the national priority programs...",
    "We cordially request your confirmation on or before..."
  ]
};

// --- TINYMCE INITIALIZED IN COMPONENT ---

// --- PAPER SIZE CONFIGURATIONS ---
const PAPER_SIZES = {
  A4: { name: 'A4 (8.27" x 11.69")', width: '8.27in', height: '11.69in', pageName: 'A4' },
  Folio: { name: 'Folio / Officio (8.5" x 13")', width: '8.5in', height: '13in', pageName: '216mm 330mm' }
};

// --- AUTO-PAGE: Calculate max usable body height (px) per page ---
// Paper height minus top/bottom margins (1in each = 96px each) = 192px
// Minus header image (~115px) and footer image (~55px)
// First page of AO/SO/MEMO also has document number + subject block (~140px)
const getMaxBodyHeight = (paperSize, docType, isFirstPage) => {
  const PX_PER_IN = 96;
  const paperHeightIn = paperSize === 'Folio' ? 13 : 11.69;
  const paperHeightPx = paperHeightIn * PX_PER_IN;
  const marginsPx = 2 * PX_PER_IN;       // 1in top + 1in bottom
  const headerPx = 115;                   // da-header.png approx height
  const footerPx = 65;                    // da-footer.png + mt-12 approx
  const metadataPx = (isFirstPage && (docType === 'AO' || docType === 'SO' || docType === 'MEMO' || docType === 'LETTER')) ? 155 : 0;
  const signaturePx = 120;                // leave room for signature block on last page (safety buffer)
  return paperHeightPx - marginsPx - headerPx - footerPx - metadataPx - signaturePx;
};

const CreateDocument = () => {
  const printComponentRef = useRef(null);
  const quillRef = useRef(null);
  const containerRef = useRef(null); // Ref for the preview container
  const editorRefs = useRef({});    // Map of page index -> TinyMCE editor instance
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isAdmin } = useAuth();

  const incomingType = location.state?.defaultType || 'AO';
  const incomingData = location.state?.editData || null;

  const [docType, setDocType] = useState(incomingType);
  const [paperSize, setPaperSize] = useState(incomingData?.paperSize || 'A4');
  const [docId, setDocId] = useState(incomingData?.id || null);
  const [docStatus, setDocStatus] = useState(incomingData?.status || 'Draft');
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);
  const [scale, setScale] = useState(1); // Scale state for preview
  const [manualScale, setManualScale] = useState(null); // null = auto-fit

  // --- NEW: Toast Notification State ---
  const [toastMessage, setToastMessage] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToastMessage({ show: true, message, type });
    setTimeout(() => {
      setToastMessage(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const zoomIn = () => setManualScale(prev => Math.min((prev ?? scale) + 0.1, 2.0));
  const zoomOut = () => setManualScale(prev => Math.max((prev ?? scale) - 0.1, 0.2));
  const resetZoom = () => setManualScale(null);

  const activeScale = manualScale ?? scale;

  const [formData, setFormData] = useState({
    documentNumber: '',
    seriesYear: new Date().getFullYear(),
    subject: '',
    // Content Sections (Multi-page support)
    // --- Pre-fill AO and SO Structure based on DA-MIMAROPA Guidelines ---
    contentSections: [
      incomingType === 'AO' && !incomingData
        ? `<p></p>`
        : incomingType === 'SO' && !incomingData
          ? `<p><strong>1. LEGAL/ADMINISTRATIVE BASIS</strong></p><p>In the exigency of the service and in support of...</p><p><br></p><p><strong>2. PURPOSE AND OBJECTIVE</strong></p><p>The primary objective of this authority/designation is to...</p><p><br></p><p><strong>3. AUTHORIZED PERSONNEL</strong></p><p>The following personnel are hereby authorized to...</p><p><br></p><p><strong>4. DUTIES AND RESPONSIBILITIES</strong></p><p>They shall perform the following duties and responsibilities:</p><p><br></p><p><strong>5. FUNDING</strong></p><p>All traveling expenses and per diems shall be chargeable against...</p><p><br></p><p><strong>6. EFFECTIVITY</strong></p><p>This Order shall take effect immediately and shall remain in force until revoked in writing. All other orders, memoranda, or issuances inconsistent herewith are deemed revoked or modified accordingly.</p>`
          : incomingType === 'MEMO' && !incomingData
            ? `<p><strong>1. OPENING CONTEXT</strong></p><p>In line with the directives of...</p><p><br></p><p><strong>2. PURPOSE OR OBJECTIVE</strong></p><p>The primary purpose of this memorandum is to...</p><p><br></p><p><strong>3. DIRECTIVES / INSTRUCTIONS</strong></p><p>Please be informed that...</p><p><br></p><p><strong>4. TIMELINE / ACTIONS EXPECTED</strong></p><p>All compliance reports must be submitted on or before...</p><p><br></p><p>Please be guided accordingly.</p>`
            : incomingType === 'LETTER' && !incomingData
              ? `<p>State the purpose of the letter and identify DA-MIMAROPA as the inviting/requesting party.</p><p><br></p><p>Here are the details of the activity:</p><ul><li><strong>Date:</strong> </li><li><strong>Time:</strong> </li><li><strong>Venue:</strong> </li><li><strong>Participants:</strong> </li></ul><p><br></p><p>Explain the importance of the activity and link it to the DA programs and priorities.</p>`
              : '<p>Start typing your document content here...</p>'
    ],

    // Administrative logic
    status: 'draft',
    approvals: {},
    issueMonthYear: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date()),
    memoAddresseeType: 'FOR',
    memoToName: 'ALL DA-MIMAROPA EMPLOYEES',
    memoToTitle: '',
    dateLine: new Intl.DateTimeFormat('en-US', { month: 'long', day: '2-digit', year: 'numeric' }).format(new Date()),
    addresseeName: 'HON. JUAN DELA CRUZ',
    addresseeTitle: 'Mayor',
    addresseeOffice: 'Local Government Unit of Calapan City',
    addresseeLocation: 'Oriental Mindoro, MIMAROPA Region',
    thruName: '',
    thruTitle: '',
    salutation: 'Dear Mayor Dela Cruz:',
    complimentaryClose: 'Sincerely,',
    enclosure: '',
    signatoryName: 'ATTY. CHRISTOPHER R. BAÑAS',
    signatoryTitle: 'Regional Executive Director',
    reviewerInitials: 'Chiefs Initials',
    reviewerDesignation: 'Division Chief'
  });

  useEffect(() => {
    if (incomingData) {
      // Merge old multi-page documents into a single continuous flowing document
      let mergedSections = incomingData.contentSections || [];
      if (mergedSections.length > 1) {
        mergedSections = [mergedSections.join('<p><br></p>')]; // Join with blank lines
      }
      setFormData(prev => ({ ...prev, ...incomingData, contentSections: mergedSections }));
      setDocId(incomingData.id);
    }
  }, [incomingData]);

  // Handle dynamic scaling of the preview
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.clientWidth - 80;
      const containerHeight = containerRef.current.clientHeight - 80;

      const paperWidthPx = parseFloat(PAPER_SIZES[paperSize].width) * 96;
      const paperHeightPx = parseFloat(PAPER_SIZES[paperSize].height) * 96;

      const scaleX = containerWidth / paperWidthPx;
      const scaleY = containerHeight / paperHeightPx;

      const newScale = Math.min(scaleX, scaleY, 1);
      setScale(newScale);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [paperSize]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAIGrammarCheck = async () => {
    const fullBodyText = formData.contentSections.join(' ');
    if (!fullBodyText || fullBodyText.trim() === '') return;
    setIsCheckingGrammar(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        showToast("Missing API Key! Please restart your dev server if you just added it.", "error");
        setIsCheckingGrammar(false);
        return;
      }

      const aiPrompt = `
        You are an expert editor for the Philippine Department of Agriculture. 
        Fix the grammar, punctuation, and spelling of the following text. 
        Make it sound highly professional, formal, and suitable for an official government memorandum or order. 
        IMPORTANT: The text contains HTML formatting tags (like <p>, <strong>, <em>, <ul>, <li>). You MUST preserve all HTML formatting perfectly.
        Do NOT change the original meaning. Do NOT add conversational filler. 
        ONLY return the corrected HTML text. Do NOT wrap it in markdown blockquotes like \`\`\`html.
        
        Text to correct:
        ${fullBodyText}
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: aiPrompt }] }] })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "API Request Failed.");
      }

      if (data.candidates && data.candidates.length > 0) {
        let correctedText = data.candidates[0].content.parts[0].text.trim();

        // Safely strip off any Markdown code block wrapping that the AI might add
        correctedText = correctedText.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '').trim();

        // Update the first section with corrected text
        const updatedSections = [...formData.contentSections];
        updatedSections[0] = correctedText;
        setFormData(prev => ({ ...prev, contentSections: updatedSections }));
        showToast("Grammar optimized successfully!", "success");
      } else {
        throw new Error("AI returned an empty response.");
      }
    } catch (error) {
      console.error("Grammar check failed:", error);
      showToast(error.message || "Failed to connect to the AI Grammar Checker.", "error");
    } finally {
      setIsCheckingGrammar(false);
    }
  };

  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    const fullType = docType === 'AO' ? 'Administrative Order' : docType === 'SO' ? 'Special Order' : docType === 'MEMO' ? 'Memorandum' : 'Official Letter';

    const payload = {
      ...formData,
      type: fullType,
      number: formData.documentNumber || '-',
      year: formData.seriesYear,
      status: docStatus,
      paperSize: paperSize
    };

    if (docId) {
      const result = await updateDocument(docId, payload);
      if (result.success) {
        showToast("Changes saved to database successfully!", "success");
      } else {
        showToast("Error saving: " + result.error, "error");
      }
    } else {
      const result = await saveDocument(payload);
      if (result.success) {
        setDocId(result.id);
        showToast("New document saved to database!", "success");
      } else {
        showToast("Error saving: " + result.error, "error");
      }
    }
    setIsSaving(false);
  };

  const currentPaper = PAPER_SIZES[paperSize];

  const updateContentSection = (index, newContent) => {
    setFormData(prev => {
      const updated = [...prev.contentSections];
      updated[index] = newContent;
      return { ...prev, contentSections: updated };
    });
  };

  const addPage = () => {
    setFormData(prev => ({ ...prev, contentSections: [...prev.contentSections, '<p></p>'] }));
  };

  const removePage = (index) => {
    if (formData.contentSections.length === 1) return;
    setFormData(prev => {
      const updated = [...prev.contentSections];
      updated.splice(index, 1);
      return { ...prev, contentSections: updated };
    });
  };

  // --- AUTO-PAGE: Called on every TinyMCE content change ---
  const handleEditorChange = (index, newContent, editor) => {
    updateContentSection(index, newContent);

    // Small timeout to let the DOM settle before measuring
    setTimeout(() => {
      try {
        const editorBody = editor?.getBody();
        if (!editorBody) return;

        const contentHeight = editorBody.scrollHeight;
        const isFirstPage = index === 0;
        const maxHeight = getMaxBodyHeight(paperSize, docType, isFirstPage);

        // Only auto-add if this is the LAST page (we don't split mid-document)
        setFormData(prev => {
          if (index !== prev.contentSections.length - 1) return prev; // not the last page
          if (contentHeight <= maxHeight) return prev; // still fits

          // Content overflows – add a new blank page
          showToast('Page full — a new page has been added automatically.', 'success');
          return { ...prev, contentSections: [...prev.contentSections, '<p></p>'] };
        });
      } catch (e) {
        // Silently ignore measurement errors
      }
    }, 100);
  };


  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    content: () => printComponentRef.current,
    documentTitle: `DA-MIMAROPA_${docType}_${formData.documentNumber || 'Draft'}`,
    pageStyle: `
      @page { 
        size: ${currentPaper.pageName}; 
        margin: 0mm !important; 
      }
      @media print {
        html, body {
          width: ${currentPaper.width} !important;
          margin: 0 !important;
          padding: 0 !important;
          background-color: white !important;
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact;
        }
        .page-break-after {
          display: block;
          page-break-after: always;
        }
      }
    `
  });

  const insertSnippet = (text) => {
    setFormData(prev => {
      const currentBody = prev.contentSections[0];
      // If the body is just the default placeholder, replace it.
      if (currentBody === '<p>Start typing your document content here...</p>') {
        return { ...prev, contentSections: [text, ...prev.contentSections.slice(1)] };
      }
      // Otherwise, append it
      return { ...prev, contentSections: [currentBody + text, ...prev.contentSections.slice(1)] };
    });
  };

  return (
    <div className="h-screen w-screen bg-gray-100 flex flex-col font-sans m-0 p-0 overflow-hidden">

      {/* --- TOAST NOTIFICATION --- */}
      {toastMessage.show && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-6 duration-300 min-w-[300px] border ${toastMessage.type === 'success'
          ? 'bg-emerald-50/95 backdrop-blur-md border-emerald-200 text-emerald-800 shadow-emerald-900/20'
          : 'bg-red-50/95 backdrop-blur-md border-red-200 text-red-800 shadow-red-900/20'
          }`}>
          {toastMessage.type === 'success'
            ? <CheckCircle size={28} className="text-emerald-600" />
            : <AlertTriangle size={28} className="text-red-600" />
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

      {/* --- PREMIUM TOP NAVBAR --- */}
      <nav className="bg-[#FFFFFF] px-8 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex justify-between items-center w-full sticky top-0 z-50 border-b border-[#F8F9FA] no-print">
        <div className="flex items-center gap-5">
          <div className="bg-[#1E5631] p-2.5 rounded-xl shadow-lg shadow-emerald-900/20">
            <img src={daLogo} alt="DA Logo" className="h-8 w-8 object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl text-[#2B2B2B] tracking-tight flex items-center gap-2">
              DA-MIMAROPA

            </span>
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#2B2B2B]/60">Communication Management System</span>
          </div>
          <div className="h-8 w-px bg-slate-100 mx-4"></div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2.5 text-[#2B2B2B]/60 hover:text-[#1E5631] font-bold text-sm transition-all group px-4 py-2 rounded-xl hover:bg-[#F8F9FA]"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
        </div>
      </nav>

      {/* --- MAIN WORKSPACE --- */}
      <div className="flex flex-1 overflow-hidden">

        {/* --- LEFT SIDEBAR: FORM PANELS --- */}
        <div className="w-[480px] min-w-[480px] bg-[#FFFFFF] border-r border-[#F8F9FA] flex flex-col z-10 no-print shadow-[10px_0_30px_-15px_rgba(0,0,0,0.05)]">

          <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar bg-[#FFFFFF]">

            {/* Workflow Settings */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#1E5631] rounded-full"></div>
                <h3 className="text-[11px] font-black text-[#2B2B2B] uppercase tracking-[0.25em]">Workflow Settings</h3>
              </div>

              <div className="bg-[#FFFFFF] rounded-[2.5rem] border border-[#F8F9FA] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#1E5631]/10 blur-[50px] rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-1.5 bg-[#1E5631]"></div>

                <div className="grid grid-cols-2 gap-6 relative z-10">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-[#2B2B2B]/60 mb-3 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Zap size={12} className="text-[#D4AF37]" /> Document Classification
                    </label>
                    <div className="relative group/select">
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="w-full border-2 border-[#F8F9FA] rounded-2xl px-5 py-4 text-[#2B2B2B] font-extrabold focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] outline-none bg-[#F8F9FA]/50 transition-all appearance-none cursor-pointer text-sm"
                      >
                        <option value="AO">Administrative Order</option>
                        <option value="SO">Special Order</option>
                        <option value="MEMO">Memorandum</option>
                        <option value="LETTER">Official Letter</option>
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#2B2B2B]/60 group-focus-within/select:text-[#1E5631] transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#2B2B2B]/60 mb-3 uppercase tracking-widest ml-1">Paper Size</label>
                    <div className="relative">
                      <select
                        value={paperSize}
                        onChange={(e) => setPaperSize(e.target.value)}
                        className="w-full border-2 border-[#F8F9FA] rounded-2xl px-5 py-3.5 text-[#2B2B2B] font-black focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] outline-none bg-[#F8F9FA]/50 transition-all appearance-none cursor-pointer text-xs"
                      >
                        <option value="A4">A4 (Standard)</option>
                        <option value="Folio">Folio (Long)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#2B2B2B]/60 mb-3 uppercase tracking-widest ml-1">Processing Status</label>
                    <div className="relative">
                      <select
                        value={docStatus}
                        onChange={(e) => setDocStatus(e.target.value)}
                        className={`w-full border-2 border-[#F8F9FA] rounded-2xl px-5 py-3.5 font-black focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] outline-none bg-[#F8F9FA]/50 transition-all appearance-none cursor-pointer text-xs ${docStatus === 'Approved' ? 'text-emerald-700' :
                          docStatus === 'Pending Review' ? 'text-blue-700' : 'text-amber-700'
                          }`}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Pending Review">Pending Review</option>
                        {isAdmin && <option value="Approved">Release (Final)</option>}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100 mx-4"></div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-[#D4AF37] rounded-full"></div>
                  <h3 className="text-[11px] font-black text-[#2B2B2B] uppercase tracking-[0.25em]">Issuance Metadata</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#1E5631]"></span>
                  <span className="text-[10px] text-[#2B2B2B]/60 font-bold tracking-widest uppercase italic">Header Records</span>
                </div>
              </div>

              {(docType !== 'LETTER') && (
                <div className="grid grid-cols-2 gap-5 bg-[#FFFFFF] p-8 rounded-[2.5rem] border border-[#F8F9FA] shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all hover:bg-[#F8F9FA]/30">
                  <div>
                    <label className="block text-[10px] font-bold text-[#2B2B2B]/60 mb-3 uppercase tracking-widest ml-1">
                      {docType === 'AO' ? 'AO Number' : docType === 'SO' ? 'SO Number' : 'Memo Number'}
                    </label>
                    <input type="text" name="documentNumber" value={formData.documentNumber} onChange={handleChange} className="w-full border-2 border-[#F8F9FA] rounded-2xl px-5 py-4 text-sm font-black focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] outline-none uppercase bg-[#FFFFFF] transition-all placeholder:text-[#2B2B2B]/40" placeholder="00-00-00" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#2B2B2B]/60 mb-3 uppercase tracking-widest ml-1">Series</label>
                    <input type="number" name="seriesYear" value={formData.seriesYear} onChange={handleChange} className="w-full border-2 border-[#F8F9FA] rounded-2xl px-5 py-4 text-sm font-black focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] outline-none bg-[#FFFFFF] transition-all shadow-sm" />
                  </div>
                </div>
              )}

              {docType === 'MEMO' && (
                <div className="bg-[#FFFFFF] p-8 rounded-[2.5rem] border border-[#F8F9FA] shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-[#2B2B2B]/60 mb-3 uppercase tracking-widest ml-1">Internal Date Stamp</label>
                    <input type="text" name="dateLine" value={formData.dateLine} onChange={handleChange} className="w-full border-2 border-[#F8F9FA] rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] outline-none bg-[#FFFFFF] transition-all" />
                  </div>
                  <div className="grid grid-cols-3 gap-5">
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-[#2B2B2B]/60 mb-3 uppercase tracking-widest ml-1">Addressee Type</label>
                      <select name="memoAddresseeType" value={formData.memoAddresseeType} onChange={handleChange} className="w-full border-2 border-[#F8F9FA] rounded-2xl px-5 py-4 text-sm font-black focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] outline-none uppercase bg-[#FFFFFF] cursor-pointer appearance-none">
                        <option value="FOR">FOR</option>
                        <option value="TO">TO</option>
                        <option value="THROUGH">THROUGH</option>
                        <option value="ATTENTION">ATTENTION</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-[#2B2B2B]/60 mb-3 uppercase tracking-widest ml-1">Recipient Name</label>
                      <input type="text" name="memoToName" value={formData.memoToName} onChange={handleChange} className="w-full border-2 border-[#F8F9FA] rounded-2xl px-5 py-4 text-sm font-black focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] outline-none uppercase bg-[#FFFFFF]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#2B2B2B]/60 mb-3 uppercase tracking-widest ml-1">Recipient Title / Position</label>
                    <input type="text" name="memoToTitle" value={formData.memoToTitle} onChange={handleChange} className="w-full border-2 border-[#F8F9FA] rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] outline-none capitalize bg-[#FFFFFF]" placeholder="E.g., Division Chief" />
                  </div>
                </div>
              )}

              {(docType === 'AO' || docType === 'SO' || docType === 'MEMO') && (
                <div className="bg-[#FFFFFF] p-8 rounded-[2.5rem] border border-[#F8F9FA] shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
                  <label className="block text-[10px] font-bold text-[#2B2B2B]/60 mb-3 uppercase tracking-widest ml-1">Official Subject Line</label>
                  <textarea name="subject" value={formData.subject} onChange={handleChange} className="w-full border-2 border-[#F8F9FA] rounded-2xl px-6 py-5 text-sm font-black focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] outline-none uppercase bg-[#FFFFFF] transition-all min-h-[140px] resize-none leading-relaxed" placeholder="ENTER SUBJECT MATTER IN DETAIL..." rows="4" />
                </div>
              )}

              {docType === 'LETTER' && (
                <div className="bg-[#FFFFFF] p-8 rounded-[2.5rem] border border-[#F8F9FA] shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-6">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-bold text-[#2B2B2B]/60 mb-3 uppercase tracking-widest ml-1">Date</label>
                      <input type="text" name="dateLine" value={formData.dateLine} onChange={handleChange} className="w-full border-2 border-[#F8F9FA] rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] outline-none bg-[#FFFFFF]" placeholder="Month DD, YYYY" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#2B2B2B]/60 mb-3 uppercase tracking-widest ml-1">Salutation</label>
                      <input type="text" name="salutation" value={formData.salutation} onChange={handleChange} className="w-full border-2 border-[#F8F9FA] rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] outline-none bg-[#FFFFFF]" placeholder="Dear Mayor [Last Name]:" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5 border-t border-[#F8F9FA] pt-6">
                    <div>
                      <label className="block text-[10px] font-bold text-[#2B2B2B]/60 mb-3 uppercase tracking-widest ml-1">Addressee Name</label>
                      <input type="text" name="addresseeName" value={formData.addresseeName} onChange={handleChange} className="w-full border-2 border-[#F8F9FA] rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] outline-none uppercase bg-[#FFFFFF]" placeholder="HON. [NAME]" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#2B2B2B]/60 mb-3 uppercase tracking-widest ml-1">Official Designation</label>
                      <input type="text" name="addresseeTitle" value={formData.addresseeTitle} onChange={handleChange} className="w-full border-2 border-[#F8F9FA] rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] outline-none capitalize bg-[#FFFFFF]" placeholder="Governor/Congressman/Mayor" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#2B2B2B]/60 mb-3 uppercase tracking-widest ml-1">Office / LGU</label>
                      <input type="text" name="addresseeOffice" value={formData.addresseeOffice} onChange={handleChange} className="w-full border-2 border-[#F8F9FA] rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] outline-none bg-[#FFFFFF]" placeholder="Local Government Unit of [City]" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#2B2B2B]/60 mb-3 uppercase tracking-widest ml-1">Province / Region</label>
                      <input type="text" name="addresseeLocation" value={formData.addresseeLocation} onChange={handleChange} className="w-full border-2 border-[#F8F9FA] rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] outline-none bg-[#FFFFFF]" placeholder="Province, MIMAROPA Region" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5 border-t border-[#F8F9FA] pt-6">
                    <div>
                      <label className="block text-[10px] font-bold text-[#2B2B2B]/60 mb-3 uppercase tracking-widest ml-1">Thru: Name (Optional)</label>
                      <input type="text" name="thruName" value={formData.thruName} onChange={handleChange} className="w-full border-2 border-[#F8F9FA] rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] outline-none uppercase bg-[#FFFFFF]" placeholder="Leave blank if none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#2B2B2B]/60 mb-3 uppercase tracking-widest ml-1">Thru: Title (Optional)</label>
                      <input type="text" name="thruTitle" value={formData.thruTitle} onChange={handleChange} className="w-full border-2 border-[#F8F9FA] rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] outline-none capitalize bg-[#FFFFFF]" placeholder="e.g., Municipal Agriculturist" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5 border-t border-[#F8F9FA] pt-6">
                    <div>
                      <label className="block text-[10px] font-bold text-[#2B2B2B]/60 mb-3 uppercase tracking-widest ml-1">Complimentary Close</label>
                      <input type="text" name="complimentaryClose" value={formData.complimentaryClose} onChange={handleChange} className="w-full border-2 border-[#F8F9FA] rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] outline-none bg-[#FFFFFF]" placeholder="Sincerely yours," />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#2B2B2B]/60 mb-3 uppercase tracking-widest ml-1">Enclosures (Optional)</label>
                      <input type="text" name="enclosures" value={formData.enclosures} onChange={handleChange} className="w-full border-2 border-[#F8F9FA] rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] outline-none bg-[#FFFFFF]" placeholder="List enclosures if any" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <hr className="border-gray-200" />

            {/* Editor Workspace Panel */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-[#1E5631] rounded-full"></div>
                  <h3 className="text-[11px] font-black text-[#2B2B2B] uppercase tracking-[0.25em]">Editor Workspace</h3>
                </div>
                <button
                  type="button"
                  onClick={handleAIGrammarCheck}
                  disabled={isCheckingGrammar}
                  className="flex items-center gap-2.5 bg-[#1E5631] border border-[#1E5631] text-[#FFFFFF] hover:bg-[#153a21] px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest shadow-lg shadow-[#1E5631]/20 transition-all disabled:opacity-50 active:scale-95 group/ai"
                >
                  {isCheckingGrammar ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} className="group-hover/ai:rotate-12 transition-transform shadow-sm" />}
                  {isCheckingGrammar ? 'OPTIMIZING...' : 'AI GRAMMAR ASSISTANT'}
                </button>
              </div>

              {/* --- SMART SNIPPET BAR --- */}
              <div className="bg-slate-900/5 p-4 rounded-2xl border border-[#F8F9FA]/60 flex flex-wrap gap-2">
                <div className="w-full mb-1 flex items-center gap-2 px-1">
                  <Zap size={10} className="text-[#D4AF37] fill-[#D4AF37]" />
                  <span className="text-[9px] font-black text-[#2B2B2B]/60 uppercase tracking-widest">Rapid Insertion Snippets</span>
                </div>
                {SNIPPETS[docType]?.map((snip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => insertSnippet(snip)}
                    className="bg-[#FFFFFF] border border-[#F8F9FA] hover:border-[#1E5631] hover:text-[#1E5631] px-3 py-1.5 rounded-lg text-[10px] font-bold text-[#2B2B2B]/60 transition-all active:scale-95 shadow-sm"
                  >
                    {snip.length > 25 ? snip.substring(0, 25) + "..." : snip}
                  </button>
                ))}
              </div>

              {/* PAGE EDITORS */}
              <div className="space-y-6">
                {formData.contentSections.map((content, index) => (
                  <div key={index} className="bg-[#FFFFFF] rounded-[2.5rem] border border-[#F8F9FA] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.04)] focus-within:ring-8 focus-within:ring-[#1E5631]/10 focus-within:border-[#1E5631] transition-all">
                    <div className="bg-[#F8F9FA]/80 px-8 py-4 border-b border-[#F8F9FA] flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-[#1E5631] text-[#FFFFFF] flex items-center justify-center text-xs font-black shadow-lg shadow-[#1E5631]/20">{index + 1}</span>
                        <span className="text-[10px] font-black text-[#2B2B2B]/60 uppercase tracking-[0.2em]">Document Page {index + 1}</span>
                      </div>
                      {formData.contentSections.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePage(index)}
                          className="flex items-center gap-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      )}
                    </div>
                    {/* Apply WYSIWYG Editor Styles matching the formatting rules natively inside TinyMCE */}
                    <div className="da-tinymce-editor shadow-inner rounded-2xl overflow-hidden border border-[#F8F9FA] focus-within:ring-4 focus-within:ring-[#1E5631]/10 transition-all">
                      <Editor
                        apiKey="3eaylba29tb3fzrsl4p0zhh45n0s46lk87m54oumiaa3otx6"
                        value={content || ''}
                        onEditorChange={(newContent, editor) => handleEditorChange(index, newContent, editor)}
                        init={{
                          height: 500,
                          menubar: false,
                          plugins: ['lists', 'advlist', 'autolink', 'table', 'pagebreak'],
                          toolbar: 'fontfamily fontsize lineheight | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist | table | pagebreak',
                          font_size_formats: '8pt 9pt 10pt 11pt 12pt 14pt 16pt 18pt 24pt 36pt',
                          font_family_formats: 'Times New Roman=times new roman,times,serif; Arial=arial,helvetica,sans-serif; Courier New=courier new,courier,monospace; Georgia=georgia,palatino,serif; Tahoma=tahoma,arial,helvetica,sans-serif; Verdana=verdana,geneva,sans-serif;',
                          line_height_formats: '0 0.5 0.8 1 1.15 1.5 2.0 2.5 3.0',
                          content_style: `
                            body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #1e293b; background-color: #ffffff; padding: 2rem;}
                            ${(docType === 'AO' || docType === 'SO' || docType === 'MEMO' || docType === 'LETTER') ? 'p, li { text-align: justify; line-height: 1.15; margin-top: 0; margin-bottom: 0; }' : 'p { margin-top: 0; margin-bottom: 0; }'}
                            .mce-pagebreak { margin: 10px 0; border: 1px dashed #cbd5e1; }
                          `,
                          placeholder: `Start typing page ${index + 1} content here...`,
                          setup: (ed) => {
                            editorRefs.current[index] = ed;
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addPage}
                  className="w-full py-4 border-2 border-dashed border-[#F8F9FA] hover:border-[#1E5631] text-[#2B2B2B]/60 hover:text-[#1E5631] hover:bg-[#1E5631]/5 rounded-[2.5rem] flex items-center justify-center gap-2 text-xs font-black tracking-widest uppercase transition-all"
                >
                  <Plus size={16} /> Add New Document Page
                </button>
              </div>
            </div>

            <div className="bg-[#FFFFFF] p-8 rounded-[2.5rem] border border-[#F8F9FA] shadow-[0_8px_30px_rgb(0,0,0,0.03)] relative overflow-hidden group/sig">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#1E5631]/10 blur-[60px] rounded-full group-hover/sig:bg-[#1E5631]/10 transition-all"></div>

              <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="w-1.5 h-6 bg-[#1E5631] rounded-full"></div>
                <h3 className="text-[11px] font-black text-[#2B2B2B] uppercase tracking-[0.25em]">Authorization & Review</h3>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-[#2B2B2B]/60 mb-3 uppercase tracking-widest ml-1">Official Signatory</label>
                    <input type="text" name="signatoryName" value={formData.signatoryName} onChange={handleChange} className="w-full bg-[#FFFFFF] border-2 border-[#F8F9FA] rounded-2xl px-6 py-4 text-sm font-black text-[#2B2B2B] focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] outline-none uppercase transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#2B2B2B]/60 mb-3 uppercase tracking-widest ml-1">Signatory Designation</label>
                    <input type="text" name="signatoryTitle" value={formData.signatoryTitle} onChange={handleChange} className="w-full bg-[#FFFFFF] border-2 border-[#F8F9FA] rounded-2xl px-6 py-4 text-sm font-bold text-[#2B2B2B] focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] outline-none transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5 pt-4 border-t border-[#F8F9FA]">
                  <div>
                    <label className="block text-[10px] font-bold text-[#2B2B2B]/60 mb-3 uppercase tracking-widest ml-1">Evaluated By (Initials)</label>
                    <input type="text" name="reviewerInitials" value={formData.reviewerInitials} onChange={handleChange} className="w-full bg-[#FFFFFF] border-2 border-[#F8F9FA] rounded-2xl px-5 py-4 text-sm font-black text-[#2B2B2B] focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] outline-none uppercase transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#2B2B2B]/60 mb-3 uppercase tracking-widest ml-1">Reviewer Role</label>
                    <input type="text" name="reviewerDesignation" value={formData.reviewerDesignation} onChange={handleChange} className="w-full bg-[#FFFFFF] border-2 border-[#F8F9FA] rounded-2xl px-5 py-4 text-sm font-bold text-[#2B2B2B] focus:ring-4 focus:ring-[#1E5631]/10 focus:border-[#1E5631] outline-none uppercase transition-all" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pb-10"></div> {/* Spacer for scrolling */}
          </div>
        </div>

        {/* --- RIGHT SIDE: LIVE PREVIEW --- */}
        <div className="flex-1 bg-slate-100/50 relative overflow-hidden flex flex-col no-print">
          {/* Preview Background Pattern */}
          <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `radial-gradient(#1E5631 0.5px, transparent 0.5px)`, backgroundSize: '24px 24px' }}></div>

          {/* --- ZOOM CONTROLS --- */}
          <div className="flex items-center justify-center gap-3 px-6 py-3 bg-[#FFFFFF] border-b border-[#F8F9FA] z-10">
            <button
              onClick={zoomOut}
              className="p-2 rounded-xl bg-[#F8F9FA] hover:bg-slate-100 text-[#2B2B2B]/60 border border-[#F8F9FA] transition-all"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-[11px] font-black text-[#2B2B2B]/60 uppercase tracking-widest min-w-[52px] text-center">
              {Math.round(activeScale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-2 rounded-xl bg-[#F8F9FA] hover:bg-slate-100 text-[#2B2B2B]/60 border border-[#F8F9FA] transition-all"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
            <div className="w-px h-5 bg-slate-200 mx-1"></div>
            <button
              onClick={resetZoom}
              className={`p-2 rounded-xl border transition-all text-xs font-black uppercase tracking-wider ${manualScale === null
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : 'bg-[#F8F9FA] border-[#F8F9FA] text-[#2B2B2B]/60 hover:bg-slate-100'
                }`}
              title="Fit to Screen"
            >
              <Maximize2 size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-12 custom-scrollbar relative z-10" ref={containerRef}>
            <div
              style={{
                transform: `scale(${activeScale})`,
                transformOrigin: 'top center',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              className="flex justify-center"
            >
              <div className="shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-sm bg-[#FFFFFF] border border-[#F8F9FA]">
                {docType === 'AO' && <AdministrativeOrder ref={printComponentRef} data={{ ...formData, paperSize }} />}
                {docType === 'SO' && <SpecialOrder ref={printComponentRef} data={{ ...formData, paperSize }} />}
                {docType === 'MEMO' && <Memorandum ref={printComponentRef} data={{ ...formData, paperSize }} />}
                {docType === 'LETTER' && <OfficialLetter ref={printComponentRef} data={{ ...formData, paperSize }} />}
              </div>
            </div>
          </div>
          {/* --- FIXED BOTTOM ACTION BAR --- */}
          <div className="bg-[#FFFFFF]/90 backdrop-blur-xl p-8 border-t border-[#F8F9FA] flex gap-5 z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.04)]">
            <button
              onClick={handleSaveToDatabase}
              disabled={isSaving}
              type="button"
              className="group flex-1 bg-[#FFFFFF] border-2 border-[#F8F9FA] hover:border-[#1E5631] hover:text-[#1E5631] text-[#2B2B2B]/60 font-black py-4.5 rounded-[1.5rem] shadow-sm flex justify-center items-center gap-3 text-[11px] tracking-[0.2em] uppercase transition-all active:scale-95 disabled:opacity-70"
            >
              <div className="w-8 h-8 rounded-lg bg-[#F8F9FA] flex items-center justify-center group-hover:bg-[#1E5631]/10 transition-colors">
                {isSaving ? <Loader2 className="animate-spin text-[#1E5631]" size={16} /> : <Save size={16} className="group-hover:scale-110 transition-transform" />}
              </div>
              {isSaving ? "Synchronizing Cloud..." : "Save"}
            </button>

            <button
              onClick={handlePrint}
              type="button"
              className="group flex-[1] bg-[#1E5631] text-[#FFFFFF] hover:brightness-110 text-[#FFFFFF] font-black py-4.5 rounded-[1.5rem] shadow-2xl shadow-[#1E5631]/20 flex justify-center items-center gap-4 text-[11px] tracking-[0.2em] uppercase transition-all hover:-translate-y-1 active:scale-95"
            >
              <div className="w-8 h-8 rounded-xl bg-[#FFFFFF]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Printer size={20} />
              </div>
              Print Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateDocument;