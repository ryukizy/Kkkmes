// ============================================
//  HELPDESK.JS — KopKar MES
//  FAQ & Contact Admin Functionality
// ============================================

// ─── FAQ Database ───
const FAQ_DATA = [
  {
    category: 'Simpanan',
    items: [
      {
        q: 'Bagaimana cara menambah simpanan sukarela?',
        a: 'Simpanan sukarela dapat ditambahkan melalui:<br>1. Potongan gaji otomatis (hubungi HRD)<br>2. Setoran tunai ke kantor koperasi<br>3. Transfer ke rekening koperasi BCA 1234567890'
      },
      {
        q: 'Kapan SHU dibagikan?',
        a: 'SHU (Sisa Hasil Usaha) dibagikan setiap tahun setelah Rapat Anggota Tahunan (RAT), biasanya di bulan Januari-Februari. Besaran SHU dihitung berdasarkan total simpanan dan partisipasi transaksi anggota selama 1 tahun.'
      },
      {
        q: 'Apakah simpanan bisa ditarik kapan saja?',
        a: 'Simpanan Pokok: Hanya bisa ditarik saat resign/pensiun<br>Simpanan Wajib: Bisa ditarik dengan persetujuan pengurus<br>Simpanan Sukarela: Bisa ditarik sewaktu-waktu dengan mengajukan form penarikan'
      },
      {
        q: 'Bagaimana cara cek saldo simpanan?',
        a: 'Anda dapat cek saldo simpanan melalui:<br>1. Menu "Saldo Simpanan" di aplikasi ini<br>2. Minta print-out buku tabungan di kantor koperasi<br>3. Unduh E-Statement di menu Riwayat'
      }
    ]
  },
  {
    category: 'Pinjaman',
    items: [
      {
        q: 'Bagaimana cara mengajukan pinjaman?',
        a: 'Untuk mengajukan pinjaman:<br>1. Masuk ke menu "Pinjaman"<br>2. Klik tombol "Ajukan Pinjaman Baru"<br>3. Isi nominal, tenor, dan tujuan penggunaan<br>4. Verifikasi dengan PIN 6 digit<br>5. Tunggu persetujuan dari admin (maksimal 3 hari kerja)'
      },
      {
        q: 'Berapa maksimal pinjaman yang bisa diajukan?',
        a: 'Maksimal pinjaman adalah 3x dari total simpanan Anda. Contoh: Jika total simpanan Rp 5.000.000, maka maksimal pinjaman Rp 15.000.000.'
      },
      {
        q: 'Berapa bunga pinjaman?',
        a: 'Bunga pinjaman koperasi adalah 1% per bulan (flat). Jauh lebih rendah dibanding bank atau pinjaman online yang bisa mencapai 3-5% per bulan.'
      },
      {
        q: 'Bagaimana cara pelunasan pinjaman?',
        a: 'Cicilan dipotong otomatis dari gaji setiap bulan. Untuk pelunasan dipercepat, Anda bisa:<br>1. Hubungi admin koperasi<br>2. Hitung sisa pokok + bunga<br>3. Bayar ke rekening koperasi<br>4. Konfirmasi bukti transfer'
      }
    ]
  },
  {
    category: 'Belanja',
    items: [
      {
        q: 'Bagaimana cara berbelanja di koperasi?',
        a: 'Berbelanja sangat mudah:<br>1. Masuk ke menu "Belanja Koperasi"<br>2. Pilih produk dan tambahkan ke keranjang<br>3. Checkout dan pilih metode pembayaran<br>4. Ambil barang di kantor koperasi dengan menunjukkan ID transaksi'
      },
      {
        q: 'Apakah ada batasan belanja?',
        a: 'Ya, setiap anggota memiliki limit belanja bulanan sebesar Rp 3.000.000. Limit akan reset setiap tanggal 1 bulan berikutnya.'
      },
      {
        q: 'Apakah harga di koperasi lebih murah?',
        a: 'Ya! Koperasi membeli barang dalam jumlah besar sehingga harga lebih murah 5-15% dibanding toko retail. Plus ada diskon otomatis 5% untuk anggota.'
      }
    ]
  },
  {
    category: 'PPOB',
    items: [
      {
        q: 'Apa itu layanan PPOB?',
        a: 'PPOB (Payment Point Online Bank) adalah layanan pembayaran online untuk:<br>• Pulsa & Paket Data semua operator<br>• Token Listrik PLN<br>• Tagihan pascabayar (segera hadir)<br>Pembayaran bisa pakai Simpanan Sukarela atau Limit Belanja.'
      },
      {
        q: 'Apakah ada biaya admin PPOB?',
        a: 'Ya, ada biaya admin kecil:<br>• Pulsa/Data: Rp 500<br>• Token Listrik: Rp 1.500<br>Biaya ini lebih murah dibanding konter pulsa biasa.'
      },
      {
        q: 'Bagaimana jika transaksi PPOB gagal?',
        a: 'Jika transaksi gagal:<br>1. Saldo akan otomatis dikembalikan dalam 5-10 menit<br>2. Cek status di menu "Riwayat PPOB"<br>3. Jika lebih dari 1 jam belum kembali, hubungi admin'
      }
    ]
  },
  {
    category: 'Akun & Keamanan',
    items: [
      {
        q: 'Bagaimana cara mengatur PIN?',
        a: 'Untuk keamanan transaksi, Anda perlu mengatur PIN 6 digit:<br>1. Masuk ke menu "Profil"<br>2. Klik "Atur PIN"<br>3. Masukkan PIN baru (6 digit angka)<br>4. Konfirmasi PIN<br>Jangan bagikan PIN ke siapapun!'
      },
      {
        q: 'Lupa password, bagaimana?',
        a: 'Untuk reset password:<br>1. Hubungi admin koperasi via WhatsApp<br>2. Verifikasi identitas (NIK + Nama)<br>3. Admin akan reset password dan kirim password baru<br>4. Ganti password segera setelah login'
      },
      {
        q: 'Apakah data saya aman?',
        a: 'Keamanan data adalah prioritas kami:<br>• Semua data terenkripsi<br>• Koneksi menggunakan HTTPS<br>• PIN tidak disimpan dalam bentuk plain text<br>• Akses hanya untuk anggota terdaftar'
      }
    ]
  }
];

// ─── Contact Info ───
const CONTACT_INFO = {
  whatsapp: '6281234567890', // Ganti dengan nomor asli
  email: 'admin@kopkarmes.com',
  office: 'Gedung Kantor PT. MES Lantai 2',
  hours: 'Senin-Jumat: 08:00-16:00 WIB'
};

// ─── Render FAQ ───
function renderFAQ() {
  const container = document.getElementById('faqContainer');
  if (!container) return;
  
  container.innerHTML = FAQ_DATA.map((section, sectionIndex) => `
    <div class="faq-section">
      <h3 class="faq-section-title">${section.category}</h3>
      <div class="faq-accordion">
        ${section.items.map((item, itemIndex) => {
          const id = `faq-${sectionIndex}-${itemIndex}`;
          return `
            <div class="faq-item" id="${id}">
              <button class="faq-question" onclick="toggleFAQ('${id}')">
                ${item.q}
                <svg class="faq-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                </svg>
              </button>
              <div class="faq-answer">
                <p>${item.a}</p>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');
}

// ─── Toggle FAQ Item ───
function toggleFAQ(itemId) {
  const item = document.getElementById(itemId);
  if (!item) return;
  
  const answer = item.querySelector('.faq-answer');
  const icon = item.querySelector('.faq-icon');
  const isActive = item.classList.contains('active');
  
  // Close all other FAQs in the same section (accordion behavior)
  const section = item.closest('.faq-section');
  section.querySelectorAll('.faq-item').forEach(otherItem => {
    if (otherItem !== item) {
      otherItem.classList.remove('active');
      const otherAnswer = otherItem.querySelector('.faq-answer');
      const otherIcon = otherItem.querySelector('.faq-icon');
      if (otherAnswer) otherAnswer.style.maxHeight = '0';
      if (otherIcon) otherIcon.style.transform = 'rotate(0)';
    }
  });
  
  // Toggle current item
  if (isActive) {
    item.classList.remove('active');
    answer.style.maxHeight = '0';
    icon.style.transform = 'rotate(0)';
  } else {
    item.classList.add('active');
    answer.style.maxHeight = answer.scrollHeight + 'px';
    icon.style.transform = 'rotate(180deg)';
  }
}

// ─── Search FAQ ───
function searchFAQ(query) {
  if (!query || query.length < 2) {
    renderFAQ();
    return;
  }
  
  const container = document.getElementById('faqContainer');
  if (!container) return;
  
  const lowerQuery = query.toLowerCase();
  let foundCount = 0;
  
  container.innerHTML = FAQ_DATA.map((section, sectionIndex) => {
    const matchedItems = section.items.filter(item => 
      item.q.toLowerCase().includes(lowerQuery) || 
      item.a.toLowerCase().includes(lowerQuery)
    );
    
    if (!matchedItems.length) return '';
    
    foundCount += matchedItems.length;
    
    return `
      <div class="faq-section">
        <h3 class="faq-section-title">${section.category}</h3>
        <div class="faq-accordion">
          ${matchedItems.map((item, itemIndex) => {
            const id = `faq-search-${sectionIndex}-${itemIndex}`;
            // Highlight search term
            const highlightedQ = item.q.replace(
              new RegExp(query, 'gi'),
              match => `<mark>${match}</mark>`
            );
            return `
              <div class="faq-item" id="${id}">
                <button class="faq-question" onclick="toggleFAQ('${id}')">
                  ${highlightedQ}
                  <svg class="faq-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                  </svg>
                </button>
                <div class="faq-answer">
                  <p>${item.a}</p>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
  
  if (foundCount === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 20px">
        <div style="font-size:3rem;margin-bottom:16px">🔍</div>
        <h3 style="color:var(--text);margin-bottom:8px">Tidak ditemukan</h3>
        <p style="color:var(--muted)">Coba kata kunci lain atau hubungi admin untuk bantuan</p>
        <button class="btn-prim" onclick="contactAdminWhatsApp()" style="margin-top:20px">
          💬 Hubungi Admin
        </button>
      </div>
    `;
  }
}

// ─── Contact Admin via WhatsApp ───
function contactAdminWhatsApp(topic = '') {
  const phoneNumber = CONTACT_INFO.whatsapp;
  
  let message = `Halo Admin KopKar MES,\n\n`;
  message += `Saya ${USER.nama} (NIK: ${USER.nik})\n`;
  message += `Departemen: ${USER.dept}\n\n`;
  
  if (topic) {
    message += `Perihal: ${topic}\n\n`;
  }
  
  message += `Saya butuh bantuan terkait:\n`;
  message += `[Silakan tulis pertanyaan Anda di sini]\n\n`;
  message += `Terima kasih.`;
  
  const encodedMessage = encodeURIComponent(message);
  const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  
  window.open(whatsappURL, '_blank');
  
  // Log contact attempt
  logHelpdeskContact('whatsapp', topic);
}

// ─── Contact via Email ───
function contactAdminEmail(topic = '') {
  const email = CONTACT_INFO.email;
  const subject = topic || 'Bantuan KopKar MES';
  
  let body = `Halo Admin,\n\n`;
  body += `Nama: ${USER.nama}\n`;
  body += `NIK: ${USER.nik}\n`;
  body += `Departemen: ${USER.dept}\n\n`;
  body += `Saya membutuhkan bantuan terkait:\n`;
  body += `[Silakan tulis pertanyaan Anda di sini]\n\n`;
  body += `Terima kasih.\n`;
  
  const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoLink;
  
  logHelpdeskContact('email', topic);
}

// ─── Show Contact Options Modal ───
function showContactModal() {
  const modal = document.getElementById('contactModal');
  if (!modal) return;
  
  modal.classList.add('show');
}

function closeContactModal() {
  const modal = document.getElementById('contactModal');
  if (!modal) return;
  
  modal.classList.remove('show');
}

// ─── Log Helpdesk Contact ───
function logHelpdeskContact(method, topic) {
  const log = {
    timestamp: new Date().toISOString(),
    nik: USER.nik,
    nama: USER.nama,
    method,
    topic,
    user_agent: navigator.userAgent
  };
  
  // In real app, send to backend for analytics
  console.log('Helpdesk Contact:', log);
  
  // Store locally for demo
  const logs = JSON.parse(localStorage.getItem('helpdesk_logs') || '[]');
  logs.unshift(log);
  localStorage.setItem('helpdesk_logs', JSON.stringify(logs.slice(0, 100)));
}

// ─── Render Contact Info ───
function renderContactInfo() {
  const container = document.getElementById('contactInfoContainer');
  if (!container) return;
  
  container.innerHTML = `
    <div class="contact-info-grid">
      <div class="contact-info-card">
        <div class="cic-icon">📞</div>
        <h4>WhatsApp</h4>
        <p>Chat langsung dengan admin</p>
        <button class="btn-prim" onclick="contactAdminWhatsApp()">
          <svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          Chat Sekarang
        </button>
      </div>
      
      <div class="contact-info-card">
        <div class="cic-icon">✉️</div>
        <h4>Email</h4>
        <p>${CONTACT_INFO.email}</p>
        <button class="btn-sec" onclick="contactAdminEmail()">Kirim Email</button>
      </div>
      
      <div class="contact-info-card">
        <div class="cic-icon">🏢</div>
        <h4>Kantor</h4>
        <p>${CONTACT_INFO.office}</p>
        <p style="font-size:0.85rem;color:var(--muted);margin-top:8px">${CONTACT_INFO.hours}</p>
      </div>
    </div>
  `;
}

// ─── Quick Help Topics ───
const QUICK_HELP_TOPICS = [
  { icon: '💰', title: 'Simpanan', keywords: 'simpanan saldo tarik setor' },
  { icon: '💵', title: 'Pinjaman', keywords: 'pinjaman cicilan bunga' },
  { icon: '🛒', title: 'Belanja', keywords: 'belanja toko produk' },
  { icon: '📱', title: 'PPOB', keywords: 'pulsa token listrik' },
  { icon: '🔐', title: 'Akun & PIN', keywords: 'password pin akun' }
];

function renderQuickHelp() {
  const container = document.getElementById('quickHelpContainer');
  if (!container) return;
  
  container.innerHTML = `
    <div class="quick-help-grid">
      ${QUICK_HELP_TOPICS.map(topic => `
        <button class="quick-help-btn" onclick="searchFAQ('${topic.keywords.split(' ')[0]}')">
          <span class="qh-icon">${topic.icon}</span>
          <span class="qh-title">${topic.title}</span>
        </button>
      `).join('')}
    </div>
  `;
}

// ─── Init Helpdesk ───
function initHelpdesk() {
  renderFAQ();
  renderContactInfo();
  renderQuickHelp();
  
  // Setup search input
  const searchInput = document.getElementById('faqSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchFAQ(e.target.value);
    });
  }
}

// ─── Export Functions ───
window.renderFAQ = renderFAQ;
window.toggleFAQ = toggleFAQ;
window.searchFAQ = searchFAQ;
window.contactAdminWhatsApp = contactAdminWhatsApp;
window.contactAdminEmail = contactAdminEmail;
window.showContactModal = showContactModal;
window.closeContactModal = closeContactModal;
window.initHelpdesk = initHelpdesk;
