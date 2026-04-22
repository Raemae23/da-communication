// src/templates/AdministrativeOrder.jsx
import React, { forwardRef } from 'react';
import '../styles/print-layout.css';

// Ensure these images are placed inside your src/assets/images/ folder
import headerImg from '../assets/images/da-header.png';
import footerImg from '../assets/images/da-footer.png';

// Using forwardRef so the print library can target this specific div
const AdministrativeOrder = forwardRef(({ data }, ref) => {
  const customHeader = localStorage.getItem('da_custom_header');
  const customFooter = localStorage.getItem('da_custom_footer');
  const finalHeader = customHeader || headerImg;
  const finalFooter = customFooter || footerImg;

  const isFolio = data.paperSize === 'Folio';
  const paperDimensions = isFolio
    ? { '--page-height': '13in', '--page-width': '8.5in' }
    : { '--page-height': '11.69in', '--page-width': '8.27in' };

  // Ensure contentSections is an array
  const sections = data.contentSections || [data.bodyText || ''];

  return (
    <div ref={ref} className="da-multi-page-container font-serif text-[11pt] text-black">
      {sections.map((content, index) => {
        const isFirstPage = index === 0;
        const isLastPage = index === sections.length - 1;

        return (
          <div
            key={index}
            className="da-document-wrapper flex flex-col justify-between whitespace-pre-wrap"
            style={paperDimensions}
          >
            {/* --- TOP SECTION --- */}
            <div className="w-full">
              {/* HEADER (Every Page) */}
              <div className="-mt-[1in] -ml-[1.25in] -mr-[1in] mb-0 w-[calc(100%+2.25in)]">
                <img src={finalHeader} alt="DA Letterhead" className="w-full h-auto object-cover block" />
              </div>

              {/* METADATA (Only First Page) */}
              {isFirstPage && (
                <>
                  <div className="font-bold uppercase text-left mb-[0]">
                    ADMINISTRATIVE ORDER
                  </div>
                  <div className="text-left mb-[2.3em] font-normal leading-[1]">
                    <div>No. {data.documentNumber || "___"}</div>
                    <div>Series of {data.seriesYear || new Date().getFullYear()}</div>
                  </div>
                  <div className="flex text-left items-start mb-[1.15em]">
                    <div className="font-bold uppercase whitespace-nowrap tracking-wide">SUBJECT</div>
                    <div className="font-bold ml-1">:</div>
                    {/* Content is ALL CAPS and bold and 2 spaces from the colon */}
                    <div className="flex-1 uppercase font-bold ml-2">
                      {data.subject || "NO SUBJECT PROVIDED"}
                    </div>
                  </div>
                  {/* Before the line: 1 blank line (handled by mb-[1.15em] above / margin-top below) */}
                  {/* After the line: 1 blank line (handled by mt/mb) */}
                  <hr className="border-t-[1px] border-black my-[1.15em]" />
                </>
              )}

              {/* BODY CONTENT (For this page) */}
              {/* Ensure Tailwind's reset is disabled for basic WYSIWYG elements (lists, tables, alignment styling) */}
              <div
                className="da-document-body text-justify leading-[1.15] [&_p]:mb-0 [&_ul]:list-disc [&_ul]:pl-8 [&_ol]:list-decimal [&_ol]:pl-8 [&_li]:mb-0 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-black [&_td]:p-2 [&_th]:border [&_th]:border-black [&_th]:p-2"
                dangerouslySetInnerHTML={{ __html: content }}
              />

              {/* SIGNATURES (Only Last Page) */}
              {isLastPage && (
                <>
                  {/* 3 line spaces below body (3.45em) */}
                  <div className="mt-[3.45em] text-left leading-[1] page-break-inside-avoid">
                    {/* Space for handwritten signature */}
                    <div className="h-[3em]"></div>
                    <div className="font-bold uppercase">{data.signatoryName || "ATTY. CHRISTOPHER R. BAÑAS"}</div>
                    <div className="font-bold capitalize">{data.signatoryTitle || "Regional Executive Director"}</div>
                    {data.signatoryOffice && <div className="font-bold capitalize">{data.signatoryOffice}</div>}
                  </div>

                  {/* Document Review Initial: 2 spaces below signature block (approx 2.3em) */}
                  <div className="mt-[2.3em] text-left page-break-inside-avoid text-[8pt] leading-[1]">
                    <div className="tracking-wide">{data.reviewerInitials || "J.D. CRUZ"}</div>
                    <div className="font-normal">{data.reviewerDesignation || "Division Chief"}</div>
                  </div>
                </>
              )}
            </div>

            {/* --- BOTTOM SECTION (Footer Every Page) --- */}
            <div className="-mb-[1in] -ml-[1.25in] -mr-[1in] mt-12 w-[calc(100%+2.25in)]">
              <div className="relative">
                <img src={finalFooter} alt="DA Footer" className="w-full h-auto object-cover block" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default AdministrativeOrder;