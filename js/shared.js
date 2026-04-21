// ============================================
//  SHARED.JS — KopKar MES
//  Helper functions untuk semua role
// ============================================

// ─── Format Rupiah ───
function rp(num) {
  return 'Rp ' + (num || 0).toLocaleString('id-ID');
}

// ─── Format tanggal hari ini ───
function today() {
  return new Date().toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

// ─── Greeting berdasarkan jam ───
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11)  return 'Selamat pagi,';
  if (hour < 15)  return 'Selamat siang,';
  if (hour < 18)  return 'Selamat sore,';
  return 'Selamat malam,';
}

// ─── Toast notification ───
let _toastTimer;
function showToast(msg, cls = '', duration = 2800) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show ' + cls;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.className = 'toast', duration);
}

// ─── Auth guard — redirect jika belum login ───
function requireAuth() {
  const raw = sessionStorage.getItem('kmes_user');
  if (!raw) { location.href = '../index.html'; return null; }
  try { return JSON.parse(raw); }
  catch (e) { location.href = '../index.html'; return null; }
}

// ─── Auth guard dengan role check ───
function requireRole(role) {
  const user = requireAuth();
  if (!user) return null;
  if (user.role !== role) {
    // Salah role → redirect ke halaman yang sesuai
    if (user.role === 'admin') location.href = '../admin/dashboard.html';
    else location.href = '../karyawan/dashboard.html';
    return null;
  }
  return user;
}

// ─── Logout ───
function logout() {
  sessionStorage.removeItem('kmes_user');
  location.href = '../index.html';
}

// ─── Sidebar helpers ───
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sbOverlay').classList.add('show');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sbOverlay').classList.remove('show');
}

// ─── Section switcher ───
function showSec(id, secTitles) {
  const targetSection = document.getElementById(id);
  if (targetSection) {
    targetSection.style.opacity = '0.3';
    setTimeout(() => { targetSection.style.opacity = '1'; }, 400);
  }
  document.querySelectorAll('.sec').forEach(s => s.style.display = 'none');
  const el = document.getElementById(id);
  if (el) el.style.display = 'block';
  document.querySelectorAll('.nav-link').forEach(a =>
    a.classList.toggle('active', a.getAttribute('data-sec') === id)
  );
  const titleEl = document.getElementById('tbTitle');
  if (titleEl && secTitles && secTitles[id]) {
    titleEl.textContent = secTitles[id];
  }
  closeSidebar();
}

// ─── Shared mock data (PRODUCTS & PINJAMAN_DB dibagikan via window) ───
window.SHARED_PRODUCTS = [
  {kode:'BRG001',nama:'Kopi Kapal Api',    kat:'Minuman',   harga:15000,stok:48, emo:'☕'},
  {kode:'BRG002',nama:'Gula Pasir 1kg',    kat:'Sembako',   harga:14000,stok:32, emo:'🧂'},
  {kode:'BRG003',nama:'Sabun Lifebuoy',    kat:'Kebersihan',harga:7000, stok:60, emo:'🧼'},
  {kode:'BRG004',nama:'Mie Indomie Goreng',kat:'Snack',     harga:3500, stok:120,emo:'🍜'},
  {kode:'BRG005',nama:'Minyak Goreng 1L',  kat:'Sembako',   harga:17000,stok:25, emo:'🫙'},
  {kode:'BRG006',nama:'Teh Botol Sosro',   kat:'Minuman',   harga:5000, stok:72, emo:'🍵'},
  {kode:'BRG007',nama:'Sampo Rejoice',     kat:'Kebersihan',harga:12000,stok:15, emo:'🧴'},
  {kode:'BRG008',nama:'Beras Cap Jago 5kg',kat:'Sembako',   harga:65000,stok:10, emo:'🌾'},
  {kode:'BRG009',nama:'Chitato Sapi',      kat:'Snack',     harga:8000, stok:55, emo:'🥔'},
  {kode:'BRG010',nama:'Aqua 600ml',        kat:'Minuman',   harga:3000, stok:200,emo:'💧'},
  {kode:'BRG011',nama:'Detergen Rinso',    kat:'Kebersihan',harga:18000,stok:0,  emo:'🧽'},
  {kode:'BRG012',nama:'Wafer Tango Coklat',kat:'Snack',     harga:6000, stok:40, emo:'🍫'},
];

window.SHARED_PINJAMAN = [
  {id:'LN-0023',nik:'29226',nama:'Riski Hariyanto',tujuan:'Renovasi Rumah',    nominal:10000000,tenor:24,cicilan:481667,lunas:8, status:'active',  tgl:'2024-01-15'},
  {id:'LN-0031',nik:'2002', nama:'Siti Rahayu',    tujuan:'Biaya Pendidikan',  nominal:5000000, tenor:12,cicilan:260417,lunas:3, status:'pending', tgl:'2025-03-10'},
  {id:'LN-0028',nik:'2003', nama:'Ahmad Fauzi',    tujuan:'Modal Usaha',       nominal:8000000, tenor:18,cicilan:407778,lunas:18,status:'done',    tgl:'2023-06-01'},
  {id:'LN-0035',nik:'2004', nama:'Dewi Lestari',   tujuan:'Biaya Kesehatan',   nominal:3000000, tenor:6, cicilan:162500,lunas:0, status:'approved',tgl:'2025-04-10'},
  {id:'LN-0037',nik:'29226',nama:'Riski Hariyanto',tujuan:'Kebutuhan Keluarga',nominal:2000000, tenor:6, cicilan:108333,lunas:0, status:'pending', tgl:'2025-04-18'},
];

window.SHARED_RW_BELANJA = [
  {id:'#TRX-0035',tgl:'10 Apr 2025',produk:'Kopi x2, Gula 1kg',    total:44000, status:'Selesai'},
  {id:'#TRX-0028',tgl:'05 Apr 2025',produk:'Sabun x3',              total:19950, status:'Selesai'},
  {id:'#TRX-0021',tgl:'01 Apr 2025',produk:'Mie x5, Teh Botol x2', total:25650, status:'Selesai'},
];

window.SHARED_USERS = [
  {nik:'1001', nama:'Agus Susanto',    dept:'Manajemen',role:'admin',   status:'aktif'},
  {nik:'1002', nama:'Rina Marlina',    dept:'Manajemen',role:'admin',   status:'aktif'},
  {nik:'29226',nama:'Riski Hariyanto', dept:'Produksi', role:'karyawan',status:'aktif'},
  {nik:'2002', nama:'Siti Rahayu',     dept:'Keuangan', role:'karyawan',status:'aktif'},
  {nik:'2003', nama:'Ahmad Fauzi',     dept:'HRD',      role:'karyawan',status:'aktif'},
  {nik:'2004', nama:'Dewi Lestari',    dept:'Marketing',role:'karyawan',status:'aktif'},
  {nik:'2005', nama:'Rudi Hartono',    dept:'Produksi', role:'karyawan',status:'nonaktif'},
];

window.SHARED_SIMPANAN = {
  '29226':{ pokok:500000, wajib:2400000, sukarela:750000 },
  '2002': { pokok:500000, wajib:1800000, sukarela:300000 },
  '2003': { pokok:500000, wajib:1200000, sukarela:0 },
  '2004': { pokok:500000, wajib:900000,  sukarela:1200000 },
  '2005': { pokok:500000, wajib:600000,  sukarela:0 },
};

// ─── Shared sidebar HTML builder ───
function buildSidebarUser(user) {
  const initial = user.nama.charAt(0).toUpperCase();
  const sbAvatar = document.getElementById('sbAvatar');
  const tbAvatar = document.getElementById('tbAvatar');
  const sbUname  = document.getElementById('sbUname');
  const sbUrole  = document.getElementById('sbUrole');
  if (sbAvatar) sbAvatar.textContent = initial;
  if (tbAvatar) tbAvatar.textContent = initial;
  if (sbUname)  sbUname.textContent  = user.nama;
  if (sbUrole) {
    sbUrole.textContent = user.role === 'admin' ? 'Administrator' : 'Karyawan';
    sbUrole.className = 'sb-urole ' + user.role;
  }
}

// ─── Reset demo helper (triple-click logo) ───
let _resetCount = 0, _resetTimer = null;
function initResetFeature(resetFn) {
  document.querySelectorAll('.brand-hex, .brand-hex-sm').forEach(logo => {
    logo.style.cursor = 'pointer';
    logo.addEventListener('click', () => {
      _resetCount++;
      clearTimeout(_resetTimer);
      if (_resetCount === 3) {
        if (confirm('🔄 Reset semua data demo ke kondisi awal?\n\nSemua perubahan akan dikembalikan.')) {
          resetFn();
          showToast('✅ Data demo berhasil direset!', 'toast-ok');
        }
        _resetCount = 0;
      } else {
        _resetTimer = setTimeout(() => { _resetCount = 0; }, 1000);
      }
    });
  });
}

// ─── Service Worker registration ───
function registerSW(swPath) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(swPath)
        .then(r => console.log('[SW] Registered:', r.scope))
        .catch(e => console.warn('[SW] Error:', e));
    });
  }
}
