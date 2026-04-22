// ============================================
//  PDF-GENERATOR.JS — KopKar MES
//  Client-side PDF Generation using jsPDF
// ============================================

// ─── PDF Generator for E-Statement ───
async function generateStatementPDF(options = {}) {
  const {
    type = 'simpanan', // simpanan, pinjaman, belanja
    month = new Date().getMonth() + 1,
    year = new Date().getFullYear(),
    transactions = []
  } = options;
  
  // Check if jsPDF is loaded
  if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
    showToast('❌ PDF library belum dimuat', 'toast-err');
    return;
  }
  
  const { jsPDF } = window.jspdf || jspdf;
  const doc = new jsPDF();
  
  // ─── Page Setup ───
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  let yPos = margin;
  
  // ─── Header ───
  // Logo placeholder (hexagon)
  doc.setFillColor(22, 163, 74); // Green
  doc.circle(margin + 5, yPos + 5, 5, 'F');
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.text('KOPERASI KARYAWAN', margin + 15, yPos + 8);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('PT. Mandiri Eka Semesta', margin + 15, yPos + 14);
  
  // Horizontal line
  yPos += 20;
  doc.setDrawColor(22, 163, 74);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 10;
  
  // ─── Document Title ───
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  
  let docTitle = '';
  if (type === 'simpanan') docTitle = 'LAPORAN MUTASI SIMPANAN';
  else if (type === 'pinjaman') docTitle = 'LAPORAN CICILAN PINJAMAN';
  else if (type === 'belanja') docTitle = 'LAPORAN TRANSAKSI BELANJA';
  
  doc.text(docTitle, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  
  // ─── Period Info ───
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const periodText = `Periode: ${monthNames[month - 1]} ${year}`;
  doc.text(periodText, pageWidth - margin, yPos, { align: 'right' });
  yPos += 5;
  
  // ─── User Info ───
  doc.setFontSize(9);
  doc.text(`NIK: ${USER.nik}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 4;
  doc.text(`Nama: ${USER.nama}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 4;
  doc.text(`Departemen: ${USER.dept}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 10;
  
  // ─── Table Header ───
  doc.setFillColor(22, 163, 74);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  
  const colX = [margin + 2, margin + 25, margin + 55, margin + 120, margin + 150];
  
  doc.text('Tanggal', colX[0], yPos + 5);
  doc.text('ID Transaksi', colX[1], yPos + 5);
  doc.text('Keterangan', colX[2], yPos + 5);
  doc.text('Jumlah', colX[3], yPos + 5);
  doc.text('Status', colX[4], yPos + 5);
  
  yPos += 10;
  
  // ─── Table Rows ───
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  
  if (!transactions.length) {
    doc.setTextColor(150, 150, 150);
    doc.text('Tidak ada transaksi pada periode ini', pageWidth / 2, yPos + 20, { align: 'center' });
  } else {
    let totalDebit = 0;
    let totalKredit = 0;
    
    transactions.forEach((t, index) => {
      // Check if need new page
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }
      
      // Alternating row background
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 6, 'F');
      }
      
      doc.text(t.tgl || '-', colX[0], yPos + 4);
      doc.text(t.id || '-', colX[1], yPos + 4);
      
      // Wrap long text
      const ketText = doc.splitTextToSize(t.ket || '-', 60);
      doc.text(ketText[0], colX[2], yPos + 4);
      
      doc.text(rp(t.jml || 0), colX[3], yPos + 4);
      doc.text(t.status || 'Selesai', colX[4], yPos + 4);
      
      if (t.jenis === 'Debit' || t.type === 'debit') totalDebit += (t.jml || 0);
      else totalKredit += (t.jml || 0);
      
      yPos += 6;
    });
    
    // ─── Summary ───
    yPos += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 7;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    
    if (type === 'simpanan') {
      doc.text('Total Setoran:', colX[2], yPos);
      doc.text(rp(totalKredit), colX[3], yPos);
      yPos += 5;
      doc.text('Total Penarikan:', colX[2], yPos);
      doc.text(rp(totalDebit), colX[3], yPos);
      yPos += 5;
      doc.setTextColor(22, 163, 74);
      doc.text('Saldo Akhir:', colX[2], yPos);
      doc.text(rp(totalKredit - totalDebit), colX[3], yPos);
    } else {
      doc.text('Total Transaksi:', colX[2], yPos);
      doc.setTextColor(22, 163, 74);
      doc.text(rp(totalKredit || totalDebit), colX[3], yPos);
    }
  }
  
  // ─── Footer ───
  yPos = pageHeight - 25;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120, 120, 120);
  
  const printDate = new Date().toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  doc.text(`Dicetak pada: ${printDate}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 4;
  doc.text('Dokumen ini sah tanpa tanda tangan basah', pageWidth / 2, yPos, { align: 'center' });
  yPos += 4;
  doc.text('KopKar MES - Sistem Koperasi Digital', pageWidth / 2, yPos, { align: 'center' });
  
  // ─── Page Numbers ───
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFontSize(8);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }
  
  // ─── Save PDF ───
  const fileName = `E-Statement_${type}_${monthNames[month - 1]}_${year}_${USER.nik}.pdf`;
  doc.save(fileName);
  
  return fileName;
}

// ─── Download Statement ───
async function downloadStatement(type, month, year) {
  showToast('⏳ Membuat dokumen PDF...', 'toast-info', 3000);
  
  // Get transactions based on type
  let transactions = [];
  
  if (type === 'simpanan') {
    transactions = MUTASI || [];
  } else if (type === 'pinjaman') {
    transactions = RW_CICILAN || [];
  } else if (type === 'belanja') {
    transactions = RW_BELANJA.map(t => ({
      tgl: t.tgl,
      id: t.id,
      ket: t.produk,
      jml: t.total,
      status: t.status
    })) || [];
  }
  
  // Filter by month/year if needed
  // (In real app, this would be done by backend query)
  
  try {
    const fileName = await generateStatementPDF({
      type,
      month,
      year,
      transactions
    });
    
    showToast(`✅ ${fileName} berhasil diunduh!`, 'toast-ok');
  } catch (error) {
    console.error('PDF generation error:', error);
    showToast('❌ Gagal membuat PDF', 'toast-err');
  }
}

// ─── Quick Download Shortcuts ───
function downloadSimpananStatement() {
  const now = new Date();
  downloadStatement('simpanan', now.getMonth() + 1, now.getFullYear());
}

function downloadPinjamanStatement() {
  const now = new Date();
  downloadStatement('pinjaman', now.getMonth() + 1, now.getFullYear());
}

function downloadBelanjaStatement() {
  const now = new Date();
  downloadStatement('belanja', now.getMonth() + 1, now.getFullYear());
}

// ─── Export Functions ───
window.generateStatementPDF = generateStatementPDF;
window.downloadStatement = downloadStatement;
window.downloadSimpananStatement = downloadSimpananStatement;
window.downloadPinjamanStatement = downloadPinjamanStatement;
window.downloadBelanjaStatement = downloadBelanjaStatement;
