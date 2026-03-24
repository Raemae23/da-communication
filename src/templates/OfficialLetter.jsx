// src/templates/OfficialLetter.jsx
import React, { forwardRef } from 'react';
import '../styles/print-layout.css';

import headerImg from '../assets/images/da-header.png';
import footerImg from '../assets/images/da-footer.png';

const OfficialLetter = forwardRef(({ data }, ref) => {
  const isFolio = data.paperSize === 'Folio';
  const paperDimensions = isFolio
    ? { '--page-height': '13in', '--page-width': '8.5in' }
    : { '--page-height': '11.69in', '--page-width': '8.27in' };

  const sections = data.contentSections || [data.bodyText || ''];

  return (
    <div ref={ref} className="da-multi-page-container">
      {sections.map((content, index) => {
        const isFirstPage = index === 0;
        const isLastPage = index === sections.length - 1;

        return (
          <div
            key={index}
            className="da-document-wrapper flex flex-col justify-between"
            style={paperDimensions}
          >
            <div className="w-full">
              <div className="-mt-[1in] -ml-[1.25in] -mr-[1in] mb-0 w-[calc(100%+2.25in)]">
                <img src={headerImg} alt="DA Letterhead" className="w-full h-auto object-cover block" />
              </div>

              {isFirstPage && (
                <>
                  <div className="text-left mb-[2.3em] font-normal leading-[1]">
                    {data.dateLine || "Month DD, YYYY"}
                  </div>
                  <div className="text-left mb-[2.3em] leading-[1]">
                    <div className="font-bold uppercase">{data.addresseeName || "HON. (NAME OF MAYOR)"}</div>
                    <div className="capitalize mt-[2pt]">{data.addresseeTitle || "Governor/Congressman/Mayor"}</div>
                    <div className="mt-[2pt]">{data.addresseeOffice || "Local Government Unit of [Municipality/City]"}</div>
                    <div className="mt-[2pt]">{data.addresseeLocation || "[Province, MIMAROPA Region]"}</div>
                  </div>
                  {data.thruName && (
                    <div className="flex mb-[2.3em] text-left leading-[1]">
                      <div className="w-16 font-normal">Thru:</div>
                      <div>
                        <div className="font-bold uppercase">{data.thruName || "JUAN DELA CRUZ"}</div>
                        <div className="capitalize mt-[2pt]">{data.thruTitle || "Municipal Agriculturist"}</div>
                      </div>
                    </div>
                  )}
                  <div className="font-bold mb-[1.15em] text-left leading-[1]">
                    {data.salutation || "Dear Mayor [Last Name]:"}
                  </div>
                </>
              )}

              <div
                className="da-document-body text-justify leading-[1.15] [&_p]:mb-0 [&_ul]:list-disc [&_ul]:pl-8 [&_ol]:list-decimal [&_ol]:pl-8 [&_li]:mb-[0] [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-black [&_td]:p-2 [&_th]:border [&_th]:border-black [&_th]:p-2"
                dangerouslySetInnerHTML={{ __html: content }}
              />

              {isLastPage && (
                <>
                  <div className="mt-[2.3em] text-left leading-[1]">
                    {data.complimentaryClose || "Sincerely yours,"}
                  </div>
                  <div className="mt-[3.45em] text-left leading-[1] page-break-inside-avoid">
                    <div className="font-bold uppercase">{data.signatoryName || "ATTY. CHRISTOPHER R. BAÑAS"}</div>
                    <div className="font-normal capitalize">{data.signatoryTitle || "Regional Executive Director"}</div>
                    {data.signatoryOffice && <div className="font-normal capitalize">{data.signatoryOffice}</div>}
                  </div>
                  {data.enclosures && (
                    <div className="mt-[2.3em] text-left page-break-inside-avoid leading-[1]">
                      Encl.: {data.enclosures}
                    </div>
                  )}
                  <div className="review-initials mt-[2.3em] text-left page-break-inside-avoid text-[8pt] leading-[1]">
                    <div className="tracking-wide uppercase">{data.reviewerInitials || "J.D. CRUZ"}</div>
                    <div className="font-normal">{data.reviewerDesignation || "Division Chief"}</div>
                  </div>
                </>
              )}
            </div>

            <div className="-mb-[1in] -ml-[1.25in] -mr-[1in] mt-12 w-[calc(100%+2.25in)]">
              <div className="relative">
                <img src={footerImg} alt="DA Footer" className="w-full h-auto object-cover block" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default OfficialLetter;