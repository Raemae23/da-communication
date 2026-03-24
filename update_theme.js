const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src', 'pages', 'CreateDocument.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

const replacements = [
  { search: /bg-slate-50\/50/g, replace: "bg-[#F8F9FA]/50" },
  { search: /bg-slate-50\/80/g, replace: "bg-[#F8F9FA]/80" },
  { search: /bg-slate-50/g, replace: "bg-[#F8F9FA]" },
  
  { search: /bg-white\/90/g, replace: "bg-[#FFFFFF]/90" },
  { search: /bg-white\/10/g, replace: "bg-[#FFFFFF]/10" },
  { search: /bg-white/g, replace: "bg-[#FFFFFF]" },
  
  { search: /text-white/g, replace: "text-[#FFFFFF]" },
  
  { search: /text-slate-[789]00/g, replace: "text-[#2B2B2B]" },
  { search: /text-slate-[45]00/g, replace: "text-[#2B2B2B]/60" },
  { search: /text-slate-300/g, replace: "text-[#2B2B2B]/40" },
  
  { search: /border-slate-[12]00\/60/g, replace: "border-[#F8F9FA]/60" },
  { search: /border-slate-[12]00/g, replace: "border-[#F8F9FA]" },
  
  { search: /bg-gradient-to-br from-emerald-[89]00 to-emerald-[89]00/g, replace: "bg-[#1E5631]" },
  
  { search: /bg-da-green-[6789]00\/[51][0]?/g, replace: "bg-[#1E5631]/10" },
  { search: /bg-da-green-[6789]00/g, replace: "bg-[#1E5631]" },
  
  { search: /text-da-green-[6789]00/g, replace: "text-[#1E5631]" },
  { search: /text-da-green-50/g, replace: "text-[#1E5631]" },
  
  { search: /border-da-green-[267]00/g, replace: "border-[#1E5631]" },
  { search: /focus:border-da-green-[6]00/g, replace: "focus:border-[#1E5631]" },
  { search: /focus-within:border-da-green-[6]00/g, replace: "focus-within:border-[#1E5631]" },
  
  { search: /focus:ring-da-green-600\/[51][0]?/g, replace: "focus:ring-[#1E5631]/10" },
  { search: /focus-within:ring-da-green-[6]00\/[15][0]?/g, replace: "focus-within:ring-[#1E5631]/10" },
  
  { search: /shadow-green-900\/[23]0/g, replace: "shadow-[#1E5631]/20" },
  
  { search: /hover:border-da-green-[6]00/g, replace: "hover:border-[#1E5631]" },
  { search: /hover:text-da-green-[7]00/g, replace: "hover:text-[#1E5631]" },
  { search: /hover:bg-da-green-[5]0/g, replace: "hover:bg-[#1E5631]/10" },
  { search: /hover:bg-da-green-[8]00/g, replace: "hover:bg-[#153a21]" },
  
  { search: /group-focus-within\/select:text-da-green-[6]00/g, replace: "group-focus-within/select:text-[#1E5631]" },
  
  { search: /bg-da-gold-500/g, replace: "bg-[#D4AF37]" },
  { search: /text-da-gold-[56]00/g, replace: "text-[#D4AF37]" },
  { search: /fill-da-gold-[6]00/g, replace: "fill-[#D4AF37]" },
  
  { search: /da-gradient-bg/g, replace: "bg-[#1E5631] text-[#FFFFFF]" },
  { search: /var\(--da-green-900\)/g, replace: "#1E5631" },
];

replacements.forEach(({ search, replace }) => {
  content = content.replace(search, replace);
});

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Theme updated successfully.');
