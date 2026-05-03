import { jsPDF } from 'jspdf';
import { bengaliFont } from './src/lib/bengaliFont.js';
try {
  const doc = new jsPDF();
  doc.addFileToVFS('NotoSansBengali.ttf', bengaliFont);
  doc.addFont('NotoSansBengali.ttf', 'NotoSansBengali', 'normal');
  doc.addFont('NotoSansBengali.ttf', 'NotoSansBengali', 'bold');
  doc.setFont('NotoSansBengali', 'bold');
  doc.text('RentFlow', 20, 25);
  console.log("SUCCESS");
} catch(e) {
  console.error("ERROR:", e);
}
