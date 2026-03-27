import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Types 
export interface CropReportData {
  crop: string;
  district: string;
  state: string;
  farming_type: string;
  language: string;
  environmentalSummary: string[];
  cropRequirementSummary: string[];
  compatibilityAnalysis: string[];
  suitabilityScore: string[];
  qualityImpactAnalysis: string[];
  economicFeasibility: string[];
  finalRecommendation: string[];
}

// Section config 
const SECTIONS = [
  { num: 1, label: 'Environmental Summary',  sub: 'Current site conditions',               key: 'environmentalSummary',   color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
  { num: 2, label: 'Crop Requirements',       sub: 'Ideal growing parameters',              key: 'cropRequirementSummary', color: '#059669', bg: '#ecfdf5', border: '#6ee7b7' },
  { num: 3, label: 'Compatibility Analysis',  sub: 'Temperature, Humidity, Rainfall, Soil', key: 'compatibilityAnalysis',  color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { num: 4, label: 'Suitability Score',       sub: 'Score /100 with classification',        key: 'suitabilityScore',       color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { num: 5, label: 'Quality Impact Analysis', sub: 'Risks and quality effects',             key: 'qualityImpactAnalysis',  color: '#e11d48', bg: '#fff1f2', border: '#fecdd3' },
  { num: 6, label: 'Economic Feasibility',    sub: 'Market viability and profitability',    key: 'economicFeasibility',    color: '#4d7c0f', bg: '#f7fee7', border: '#bef264' },
  { num: 7, label: 'Final Recommendation',    sub: 'Actionable expert guidance',            key: 'finalRecommendation',    color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
] as const;

// Date helper 
function formatDate(full: boolean): string {
  const now    = new Date();
  const months = full
    ? ['January','February','March','April','May','June','July','August','September','October','November','December']
    : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const d  = now.getDate();
  const m  = months[now.getMonth()];
  const y  = now.getFullYear();
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  return full ? `${d} ${m} ${y}` : `${d} ${m} ${y}, ${hh}:${mm}`;
}

// Build HTML template (browser renders all Unicode/fonts) 
function buildHTML(report: CropReportData): string {
  const crop = report.crop.charAt(0).toUpperCase() + report.crop.slice(1);

  const sectionsHTML = SECTIONS.map(sec => {
    const items: string[] = (report as unknown as Record<string, string[]>)[sec.key] ?? [];
    const bullets = items.filter(t => t?.trim()).map(text => `
      <div style="display:flex;align-items:stretch;gap:0;background:${sec.bg};border:1px solid ${sec.border};border-radius:8px;margin-bottom:6px;overflow:hidden;">
        <div style="width:4px;background:${sec.color};flex-shrink:0;"></div>
        <p style="margin:0;padding:8px 10px;font-size:12.5px;line-height:1.65;color:#1f2937;font-family:'Noto Sans',sans-serif;">${text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>
      </div>`).join('');

    return `
      <div data-pdf-block="section" style="margin-bottom:18px;">
        <div style="background:${sec.color};border-radius:8px 8px 0 0;padding:8px 14px;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:22px;height:22px;background:rgba(255,255,255,0.25);border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff;font-family:'Noto Sans',sans-serif;">${sec.num}</div>
            <span style="font-size:13px;font-weight:700;color:#fff;font-family:'Noto Sans',sans-serif;">${sec.label}</span>
          </div>
          <span style="font-size:10px;color:rgba(255,255,255,0.85);font-family:'Noto Sans',sans-serif;">${sec.sub}</span>
        </div>
        <div style="padding-top:8px;">${bullets}</div>
      </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700;900&family=Noto+Sans+Devanagari:wght@400;700&family=Noto+Sans+Bengali:wght@400;700&family=Noto+Sans+Tamil:wght@400;700&family=Noto+Sans+Telugu:wght@400;700&family=Noto+Sans+Malayalam:wght@400;700&family=Noto+Sans+Kannada:wght@400;700&family=Noto+Sans+Gujarati:wght@400;700&family=Noto+Sans+Gurmukhi:wght@400;700&family=Noto+Sans+Odia:wght@400;700&display=swap"/>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{width:794px;background:#fff;font-family:'Noto Sans',sans-serif;}</style>
</head>
<body>

<!-- HEADER -->
<div data-pdf-block="header" style="background:linear-gradient(135deg,#16a34a,#0d9488);padding:24px 28px 20px;position:relative;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#34d399,#6ee7b7);"></div>
  <div style="position:absolute;right:-20px;top:-20px;font-size:120px;opacity:0.06;line-height:1;">&#127807;</div>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;">
    <div>
      <div style="font-size:9px;font-weight:700;color:#a7f3d0;letter-spacing:2px;margin-bottom:6px;">AgriGPT  |  AI-POWERED DECISION SUPPORT</div>
      <div style="font-size:22px;font-weight:900;color:#fff;line-height:1.2;margin-bottom:4px;">Agricultural Suitability Report</div>
      <div style="font-size:10.5px;color:#a7f3d0;">Automated analysis based on live environmental data</div>
    </div>
    <div style="text-align:right;">
      <div style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);border-radius:6px;padding:4px 10px;font-size:8.5px;font-weight:700;color:#d1fae5;letter-spacing:1px;margin-bottom:8px;display:inline-block;">FOR PERSONAL USE ONLY</div>
      <div style="font-size:9.5px;color:#a7f3d0;">Generated: ${formatDate(false)}</div>
    </div>
  </div>
</div>

<!-- METADATA -->
<div data-pdf-block="meta" style="margin:16px 20px;background:#f0fdf4;border:1.5px solid #a7f3d0;border-radius:10px;padding:14px 18px;">
  <div style="display:grid;grid-template-columns:1fr 1px 1fr;gap:0;">
    <div style="padding-right:18px;display:grid;grid-template-columns:auto 1fr;gap:6px 12px;align-items:center;">
      <span style="font-size:8.5px;font-weight:700;color:#6b7280;letter-spacing:1px;">CROP</span>
      <span style="font-size:12px;font-weight:700;color:#111827;">${crop}</span>
      <span style="font-size:8.5px;font-weight:700;color:#6b7280;letter-spacing:1px;">LOCATION</span>
      <span style="font-size:12px;font-weight:700;color:#111827;">${report.district}, ${report.state}</span>
      <span style="font-size:8.5px;font-weight:700;color:#6b7280;letter-spacing:1px;">FARMING TYPE</span>
      <span style="font-size:12px;font-weight:700;color:#111827;">${report.farming_type}</span>
    </div>
    <div style="background:#a7f3d0;width:1px;margin:4px 0;"></div>
    <div style="padding-left:18px;display:grid;grid-template-columns:auto 1fr;gap:6px 12px;align-items:center;">
      <span style="font-size:8.5px;font-weight:700;color:#6b7280;letter-spacing:1px;">LANGUAGE</span>
      <span style="font-size:12px;font-weight:700;color:#111827;">${report.language}</span>
      <span style="font-size:8.5px;font-weight:700;color:#6b7280;letter-spacing:1px;">STATE</span>
      <span style="font-size:12px;font-weight:700;color:#111827;">${report.state}</span>
      <span style="font-size:8.5px;font-weight:700;color:#6b7280;letter-spacing:1px;">DISTRICT</span>
      <span style="font-size:12px;font-weight:700;color:#111827;">${report.district}</span>
    </div>
  </div>
</div>

<!-- SECTIONS -->
<div style="padding:0 20px 20px;">${sectionsHTML}</div>

<!-- FOOTER -->
<div data-pdf-block="footer" style="background:#111827;padding:9px 20px;display:flex;justify-content:space-between;align-items:center;">
  <span style="font-size:8.5px;color:#9ca3af;">AgriGPT  |  Agricultural Suitability Report</span>
  <span style="font-size:8.5px;color:#9ca3af;">${formatDate(true)}</span>
  <span style="font-size:8.5px;color:#9ca3af;">For personal agricultural use only</span>
</div>

</body></html>`;
}

// (async â€” waits for fonts to load in the iframe) 
export async function generateReportPDF(report: CropReportData): Promise<void> {
  // 1. Render the HTML template in a hidden off-screen iframe.
  //    The browser handles ALL font rendering â€” Devanagari, Bengali, Tamil,
  //    Telugu, Malayalam, Kannada, Gujarati, Punjabi, Odia, Latinâ€¦ everything.
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;height:1px;border:none;visibility:hidden;';
  document.body.appendChild(iframe);

  const iDoc = iframe.contentDocument!;
  iDoc.open();
  iDoc.write(buildHTML(report));
  iDoc.close();

  // 2. Wait for layout + Google Fonts (up to ~2 s)
  await new Promise<void>(resolve => {
    const deadline = Date.now() + 2500;
    const check = () => {
      const h = iDoc.body?.scrollHeight ?? 0;
      if (h > 200 || Date.now() >= deadline) {
        setTimeout(resolve, 900); // extra buffer for web-font paint
      } else {
        setTimeout(check, 60);
      }
    };
    check();
  });

  // Expand iframe height to full content so nothing clips
  iframe.style.height = `${iDoc.body.scrollHeight + 60}px`;
  await new Promise(r => setTimeout(r, 150));

  // 3. Render each semantic block (header/meta/sections/footer) so page breaks
  // happen between blocks rather than slicing through cards.
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const contentW = pageW - margin * 2;
  const pageBottom = pageH - margin;
  const blockGap = 2;
  let y = margin;

  const blocks = Array.from(iDoc.querySelectorAll<HTMLElement>('[data-pdf-block]'));

  try {
    for (const block of blocks) {
      const blockCanvas = await html2canvas(block, {
        scale: 2.2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
        windowWidth: 794,
      });

      const blockHInPdf = (blockCanvas.height * contentW) / blockCanvas.width;
      const maxContentH = pageH - margin * 2;

      // Very tall blocks are split into page-sized slices.
      if (blockHInPdf > maxContentH) {
        if (y !== margin) {
          pdf.addPage();
          y = margin;
        }

        const pxPerMm = blockCanvas.width / contentW;
        const maxSlicePx = Math.max(1, Math.floor(maxContentH * pxPerMm));
        let offsetY = 0;

        while (offsetY < blockCanvas.height) {
          const slicePx = Math.min(maxSlicePx, blockCanvas.height - offsetY);
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = blockCanvas.width;
          sliceCanvas.height = slicePx;
          const sliceCtx = sliceCanvas.getContext('2d')!;
          sliceCtx.fillStyle = '#ffffff';
          sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          sliceCtx.drawImage(
            blockCanvas,
            0,
            offsetY,
            blockCanvas.width,
            slicePx,
            0,
            0,
            blockCanvas.width,
            slicePx,
          );

          const sliceHInPdf = (slicePx * contentW) / blockCanvas.width;
          pdf.addImage(
            sliceCanvas.toDataURL('image/jpeg', 0.97),
            'JPEG',
            margin,
            y,
            contentW,
            sliceHInPdf,
            undefined,
            'FAST',
          );

          offsetY += slicePx;
          if (offsetY < blockCanvas.height) {
            pdf.addPage();
            y = margin;
          } else {
            y += sliceHInPdf + blockGap;
          }
        }

        continue;
      }

      if (y + blockHInPdf > pageBottom) {
        pdf.addPage();
        y = margin;
      }

      pdf.addImage(
        blockCanvas.toDataURL('image/jpeg', 0.97),
        'JPEG',
        margin,
        y,
        contentW,
        blockHInPdf,
        undefined,
        'FAST',
      );
      y += blockHInPdf + blockGap;
    }
  } finally {
    document.body.removeChild(iframe);
  }

  // 5. Save
  const c  = report.crop.replace(/\s+/g, '_');
  const d  = report.district.replace(/\s+/g, '_');
  const st = report.state.replace(/\s+/g, '_');
  pdf.save(`AgriGPT_${c}_${d}_${st}_SuitabilityReport.pdf`);
}

