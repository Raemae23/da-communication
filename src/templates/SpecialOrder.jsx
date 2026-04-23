// src/templates/SpecialOrder.jsx
import React, { forwardRef } from 'react';
import '../styles/print-layout.css';

import headerImg from '../assets/images/da-header.png';
import footerImg from '../assets/images/da-footer.png';

const SpecialOrder = forwardRef(({ data }, ref) => {
  const customHeader = localStorage.getItem('da_custom_header');
  const customFooter = localStorage.getItem('da_custom_footer');
  const finalHeader = customHeader || headerImg;
  const finalFooter = customFooter || footerImg;

  const isFolio = data.paperSize === 'Folio';
  const paperWidth  = isFolio ? '8.5in'  : '8.27in';
  const paperHeight = isFolio ? '13in'   : '11.69in';

  const sections = data.contentSections || [data.bodyText || ''];
  const fullBody = sections.join('<p><br></p>');

  return (
    <div
      ref={ref}
      className="da-single-page font-serif text-[11pt] text-black"
      style={{ '--page-width': paperWidth, '--page-height': paperHeight }}
    >
      {/* ── HEADER ── */}
      <div className="da-page-header">
        <img src={finalHeader} alt="DA Letterhead" className="w-full h-auto object-cover block" />
      </div>

      {/* ── SCROLLABLE BODY ── */}
      <div className="da-page-body">
        <div className="font-bold uppercase text-left mb-0">SPECIAL ORDER</div>
        <div className="text-left mb-[2.3em] font-bold leading-[1]">
          <div>No. {data.documentNumber || '___'}</div>
          <div>Series of {data.seriesYear || new Date().getFullYear()}</div>
        </div>

        <div className="flex text-left items-start mb-[1.15em]">
          <div className="font-bold uppercase whitespace-nowrap tracking-wide">SUBJECT</div>
          <div className="font-bold ml-1">:</div>
          <div className="flex-1 uppercase font-bold ml-2">{data.subject || 'NO SUBJECT PROVIDED'}</div>
        </div>
        <hr className="border-t border-black my-[1.15em]" />

        <div
          className="da-document-body text-justify leading-[1.15] [&_p]:mb-0 [&_ul]:list-disc [&_ul]:pl-8 [&_ol]:list-decimal [&_ol]:pl-8 [&_li]:mb-0 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-black [&_td]:p-2 [&_th]:border [&_th]:border-black [&_th]:p-2"
          dangerouslySetInnerHTML={{ __html: fullBody }}
        />

        <div className="mt-[3.45em] text-left leading-[1] page-break-inside-avoid">
          <div className="h-[3em]" />
          <div className="font-bold uppercase">{data.signatoryName || 'ATTY. CHRISTOPHER R. BAÑAS'}</div>
          <div className="font-bold capitalize">{data.signatoryTitle || 'Regional Executive Director'}</div>
          {data.signatoryOffice && <div className="font-bold capitalize">{data.signatoryOffice}</div>}
        </div>

        <div className="mt-[2.3em] text-left page-break-inside-avoid text-[8pt] leading-[1]">
          <div className="tracking-wide uppercase">{data.reviewerInitials || 'J.D. CRUZ'}</div>
          <div className="font-normal">{data.reviewerDesignation || 'Division Chief'}</div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="da-page-footer">
        <img src={finalFooter} alt="DA Footer" className="w-full h-auto object-cover block" />
      </div>
    </div>
  );
});

export default SpecialOrder;