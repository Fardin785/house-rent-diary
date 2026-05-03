import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { formatMonth, DEMAND_CHARGE, METER_RENT } from './utils';

export async function downloadPDF(record, tenant, t) {
  if (!record || !tenant || !t) return;

  const tName = tenant.name || 'Unknown';
  const tFlat = tenant.flat || '—';

  // Use the translation system to format month correctly if it exists, otherwise fallback to utils formatMonth
  const monthMapEn = { 1: "January", 2: "February", 3: "March", 4: "April", 5: "May", 6: "June", 7: "July", 8: "August", 9: "September", 10: "October", 11: "November", 12: "December" };
  const monthMapBn = { 1: "জানুয়ারি", 2: "ফেব্রুয়ারি", 3: "মার্চ", 4: "এপ্রিল", 5: "মে", 6: "জুন", 7: "জুলাই", 8: "আগস্ট", 9: "সেপ্টেম্বর", 10: "অক্টোবর", 11: "নভেম্বর", 12: "ডিসেম্বর" };
  
  let formattedMonth = formatMonth(record.month);
  if (record.month && record.month.includes('-')) {
    const [yr, mnth] = record.month.split('-');
    const mNum = parseInt(mnth, 10);
    const resolvedName = document.documentElement.lang === 'bn' || localStorage.getItem('i18nextLng') === 'bn' ? monthMapBn[mNum] : monthMapEn[mNum];
    if (resolvedName) formattedMonth = `${resolvedName} ${yr}`;
  }

  const billHtml = `
    <div style="width: 210mm; min-height: 297mm; background: white; font-family: Inter, system-ui, sans-serif; color: #1e1e1e; position: relative;">
      <!-- Header -->
      <div style="background-color: #6366f1; color: white; padding: 25px 30px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <h1 style="margin: 0; font-size: 32px; font-weight: 700;">${t('brand')}</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">${t('pdf.title')}</p>
          </div>
          <div style="text-align: right; font-size: 13px; opacity: 0.85;">
            ${t('pdf.generated')} ${new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
      
      <!-- Content -->
      <div style="padding: 35px 30px;">
        <!-- Bill Details -->
        <h2 style="font-size: 18px; margin: 0 0 20px 0; color: #111; font-weight: 700;">${t('pdf.billDetails')}</h2>
        <div style="display: grid; grid-template-columns: 160px 1fr; gap: 12px; font-size: 15px; margin-bottom: 35px;">
          <div style="color: #6b7280;">${t('pdf.tenantName')}</div>
          <div style="font-weight: 600;">${tName}</div>
          <div style="color: #6b7280;">${t('pdf.flatRoom')}</div>
          <div>${tFlat}</div>
          <div style="color: #6b7280;">${t('pdf.month')}</div>
          <div style="font-weight: 600;">${formattedMonth}</div>
        </div>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 0 0 30px 0;" />

        <!-- Electricity Details -->
        <h2 style="font-size: 18px; margin: 0 0 20px 0; color: #111; font-weight: 700;">${t('pdf.elecDetails')}</h2>
        <div style="display: grid; grid-template-columns: 160px 1fr; gap: 12px; font-size: 15px; margin-bottom: 35px;">
          <div style="color: #6b7280;">${t('pdf.prevReading')}</div>
          <div>${record.previous_reading} kWh</div>
          <div style="color: #6b7280;">${t('pdf.currReading')}</div>
          <div>${record.current_reading} kWh</div>
          <div style="color: #6b7280;">${t('pdf.unitsConsumed')}</div>
          <div style="font-weight: 600;">${record.unit} kWh</div>
          <div style="color: #6b7280;">${t('pdf.demandCharge')}</div>
          <div>${DEMAND_CHARGE} BDT</div>
          <div style="color: #6b7280;">${t('pdf.meterRent')}</div>
          <div>${METER_RENT} BDT</div>
          <div style="color: #6b7280;">${t('pdf.vat')}</div>
          <div>${t('pdf.included')}</div>
          <div style="color: #6b7280;">${t('pdf.elecBill')}</div>
          <div style="font-weight: 600;">${(record.electricity_bill || 0).toFixed(2)} BDT</div>
        </div>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 0 0 30px 0;" />

        <!-- Payment Summary -->
        <h2 style="font-size: 18px; margin: 0 0 20px 0; color: #111; font-weight: 700;">${t('pdf.paymentSummary')}</h2>
        <div style="display: grid; grid-template-columns: 160px 1fr; gap: 12px; font-size: 15px; margin-bottom: 15px;">
          <div style="color: #6b7280;">${t('pdf.monthlyRent')}</div>
          <div>${(record.rent || 0).toFixed(2)} BDT</div>
          <div style="color: #6b7280;">${t('pdf.elecBill')}</div>
          <div>${(record.electricity_bill || 0).toFixed(2)} BDT</div>
        </div>

        <div style="background-color: #f3f4f6; padding: 15px 20px; margin: 20px -20px; border-radius: 6px; display: grid; grid-template-columns: 140px 1fr; font-size: 16px; font-weight: 700;">
          <div>${t('pdf.total')}</div>
          <div>${(record.total || 0).toFixed(2)} BDT</div>
        </div>

        <div style="display: grid; grid-template-columns: 160px 1fr; gap: 12px; font-size: 15px; margin-top: 20px;">
          <div style="color: #6b7280;">${t('pdf.amountPaid')}</div>
          <div>${(record.paid || 0).toFixed(2)} BDT</div>
          <div style="color: #6b7280;">${record.due > 0 ? t('pdf.dueAmount') : t('pdf.status')}</div>
          <div style="font-weight: 700; color: ${record.due > 0 ? '#ef4444' : '#22c55e'};">
            ${record.due > 0 ? `${(record.due || 0).toFixed(2)} BDT` : t('pdf.fullyPaid')}
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="position: absolute; bottom: 30px; left: 0; width: 100%; text-align: center; color: #9ca3af; font-size: 12px;">
        ${t('pdf.footer')}
      </div>
    </div>
  `;

  // Attach to DOM temporarily so html2canvas can render it with actual browser engine
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px'; // off-screen
  container.style.top = '-9999px';
  container.innerHTML = billHtml;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container.firstElementChild, {
      scale: 1.5, // Reduced slightly from 2 to save data, still extremely crisp
      useCORS: true,
      logging: false
    });
    
    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/jpeg', 0.85); // Added JPEG compression
    // A4 size: 210 x 297 mm
    const pdf = new jsPDF('p', 'mm', 'a4', true);
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    // Calculate aspect ratio height
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // Use FAST compression natively
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    pdf.save(`Bill_${tName.replace(/\s+/g, '_')}_${record.month}.pdf`);
  } catch (err) {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    console.error("PDF generation error:", err);
  }
}
