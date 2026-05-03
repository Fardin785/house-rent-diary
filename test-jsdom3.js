import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: "http://localhost/" });
global.window = dom.window;
global.document = dom.window.document;

import { jsPDF } from 'jspdf';
import { bengaliFont } from './src/lib/bengaliFont.js';

try {
  const doc = new jsPDF();
  doc.addFileToVFS('NotoSansBengali.ttf', bengaliFont);
  doc.addFont('NotoSansBengali.ttf', 'NotoSansBengali', 'normal');
  doc.addFont('NotoSansBengali.ttf', 'NotoSansBengali', 'bold');
  let y = 20;

  doc.setFont('NotoSansBengali', 'normal');
  doc.text("হ্যালো", 25, y);
  
  const out = doc.output('arraybuffer');
  console.log("Success! Output size:", out.byteLength);
} catch(e) {
  console.error("ERROR in file generation:", e.message, e.stack);
}
