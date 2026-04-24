// ============================================
//  KARYAWAN.JS v3 — KopKar MES
//  Karyawan-only logic: Simpanan, Pinjaman, Belanja, Keranjang, Riwayat
// ============================================

// ─── Auth guard ───
const USER = requireRole('karyawan');
if (!USER) throw new Error('Unauthorized');

// ─── State (deep copy from shared) ───
let PRODUCTS    = JSON.parse(JSON.stringify(window.SHARED_PRODUCTS));
let PINJAMAN_DB = JSON.parse(JSON.stringify(window.SHARED_PINJAMAN));
let RW_BELANJA  = JSON.parse(JSON.stringify(window.SHARED_RW_BELANJA));
const SIMPANAN_DB = window.SHARED_SIMPANAN;
const SHU_RATE    = 0.12;

const RW_CICILAN = [
  {id:'#CIC-024',tgl:'01 Apr 2025',ket:'Cicilan LN-0023 (ke-9)',  jml:481667,status:'Lunas'},
  {id:'#CIC-023',tgl:'01 Mar 2025',ket:'Cicilan LN-0023 (ke-8)',  jml:481667,status:'Lunas'},
  {id:'#CIC-022',tgl:'01 Feb 2025',ket:'Cicilan LN-0023 (ke-7)',  jml:481667,status:'Lunas'},
];
const MUTASI = [
  {tgl:'01 Apr 2025',ket:'Simpanan Wajib Bulan April',jenis:'Wajib',   jml:200000},
  {tgl:'15 Mar 2025',ket:'Setoran Sukarela',           jenis:'Sukarela',jml:250000},
  {tgl:'01 Mar 2025',ket:'Simpanan Wajib Bulan Maret', jenis:'Wajib',   jml:200000},
  {tgl:'10 Feb 2025',ket:'Setoran Sukarela',           jenis:'Sukarela',jml:500000},
  {tgl:'01 Feb 2025',ket:'Simpanan Wajib Bulan Feb',   jenis:'Wajib',   jml:200000},
];

// ─── Section titles ───
const SEC_TITLES = {
  'kar-home':      'Beranda',
  'kar-simpanan':  'Saldo Simpanan',
  'kar-pinjaman':  'Pinjaman',
  'kar-katalog':   'Katalog Belanja',
  'kar-keranjang': 'Keranjang',
  'kar-riwayat':   'Riwayat',
  'kar-ppob':      'Layanan PPOB',
  'kar-profil':    'Profil & Akun',
  'kar-tentang':   'Tentang Koperasi',
};

// ─── Cart state ───
let cart = [];
let activeFilter  = 'semua';
let selectedTenor = 6;
let amortOpen     = false;

// ─── INIT ───
function init() {
  buildSidebarUser(USER);

  const greet = getGreeting();
  const gEl = document.getElementById('karGreet');
  const nEl = document.getElementById('karName');
  if (gEl) gEl.textContent = greet;
  if (nEl) nEl.textContent  = USER.nama;
  // karSub dihapus dari hero card (sudah di-redesign menjadi satu kartu unified)

  // Profil page
  const profilAvatar = document.getElementById('profilAvatar');
  const profilName   = document.getElementById('profilName');
  const profilDept   = document.getElementById('profilDept');
  const profilNIK    = document.getElementById('profilNIK');
  const initial      = USER.nama.charAt(0).toUpperCase();
  if (profilAvatar) profilAvatar.textContent = initial;
  if (profilName)   profilName.textContent   = USER.nama;
  if (profilDept)   profilDept.textContent   = USER.dept;
  if (profilNIK)    profilNIK.textContent    = USER.nik;

  const profilLogout = document.getElementById('profilLogoutBtn');
  if (profilLogout) profilLogout.onclick = logout;

  // Render all widgets
  renderSaldoWidget();
  initSimpananCarousel();   // ← auto-scroll + swipe carousel
  renderKarPinjamanWidget();
  renderKarTxWidget();
  renderKatalog(PRODUCTS);
  renderPinjamanStatus();
  renderMutasi();
  renderRwBelanja();
  renderRwCicilan();

  // Nav links (sidebar)
  document.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const s = a.getAttribute('data-sec');
      if (s) _showSec(s);
    });
  });

  document.getElementById('hamBtn').addEventListener('click', openSidebar);
  document.getElementById('sbClose').addEventListener('click', closeSidebar);
  document.getElementById('sbOverlay').addEventListener('click', closeSidebar);
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('loanForm').addEventListener('submit', submitLoan);

  // Bottom nav
  const bottomNav = document.getElementById('navKaryawanBottom');
  if (bottomNav) bottomNav.hidden = false;

  _showSec('kar-home');
  initResetFeature(resetDemoData);
  initPWA();
}

// ─── Wrapped showSec to sync bottom nav ───
function _showSec(id) {
  showSec(id, SEC_TITLES);
  document.querySelectorAll('.bn-item[data-sec]').forEach(b =>
    b.classList.toggle('active', b.dataset.sec === id)
  );
  if (id === 'kar-keranjang') renderCart();
  if (id === 'kar-simpanan')  renderSaldoDetail();
}

// ─── Reset demo ───
function resetDemoData() {
  PRODUCTS    = JSON.parse(JSON.stringify(window.SHARED_PRODUCTS));
  PINJAMAN_DB = JSON.parse(JSON.stringify(window.SHARED_PINJAMAN));
  RW_BELANJA  = JSON.parse(JSON.stringify(window.SHARED_RW_BELANJA));
  cart = [];
  renderSaldoWidget();
  renderKarPinjamanWidget();
  renderKarTxWidget();
  renderKatalog(PRODUCTS);
  renderPinjamanStatus();
  renderRwBelanja();
  updateCartUI();
}

// ─── SIMPANAN ───
function getSimpanan() {
  const base  = SIMPANAN_DB[USER.nik] || { pokok:500000, wajib:600000, sukarela:0 };
  const total = base.pokok + base.wajib + base.sukarela;
  const shu   = Math.round(total * SHU_RATE);
  return { ...base, total, shu };
}

function renderSaldoWidget() {
  const s = getSimpanan();
  const setIfEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  setIfEl('totalSaldo',    rp(s.total));
  // NIK tidak ditampilkan di kartu hijau (sudah dihapus dari HTML)
  setIfEl('simpPok',       rp(s.pokok));
  setIfEl('simpWaj',       rp(s.wajib));
  setIfEl('simpSuk',       rp(s.sukarela));
  setIfEl('simpSHU',       rp(s.shu));
  // Sync kartu clone di carousel
  setIfEl('simpPokClone',  rp(s.pokok));
  setIfEl('simpWajClone',  rp(s.wajib));
  setIfEl('simpSukClone',  rp(s.sukarela));
  setIfEl('simpSHUClone',  rp(s.shu));

  // Limit pinjaman (2x simpanan)
  const limit  = s.total * 2;
  const active = PINJAMAN_DB.find(p => p.nik === USER.nik && p.status === 'active');
  const used   = active ? Math.max(0, active.nominal - active.lunas * active.cicilan) : 0;
  const pct    = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const lv = document.getElementById('shcLimitVal');
  const lf = document.getElementById('shcLimitFill');
  if (lv) lv.textContent   = rp(limit - used);
  if (lf) lf.style.width   = pct + '%';

  if (active) {
    const pct2 = Math.round((active.lunas / active.tenor) * 100);
    const pl = document.getElementById('wPinjamanProgLbl');
    const pp = document.getElementById('wPinjamanProgPct');
    const pf = document.getElementById('wPinjamanProgFill');
    if (pl) pl.textContent = `Lunas ${active.lunas}/${active.tenor} cicilan`;
    if (pp) pp.textContent = pct2 + '%';
    if (pf) pf.style.width = pct2 + '%';
  }

  // Render tx list on home
  renderKarTxList();
}

function renderSaldoDetail() {
  const s = getSimpanan();
  const setIfEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  setIfEl('detPok', rp(s.pokok));
  setIfEl('detWaj', rp(s.wajib));
  setIfEl('detSuk', rp(s.sukarela));
  setIfEl('detTot', rp(s.total));
  setIfEl('detSHU', rp(s.shu));
}

// ─── PINJAMAN WIDGET (Home) ───
function renderKarPinjamanWidget() {
  const mine   = PINJAMAN_DB.filter(p => p.nik === USER.nik);
  const valEl  = document.getElementById('widPinjamanVal');
  const ketEl  = document.getElementById('widPinjamanKet');
  if (!valEl) return;
  if (!mine.length) {
    valEl.textContent = 'Rp 0';
    if (ketEl) ketEl.textContent = 'Tidak ada pinjaman';
    return;
  }
  const active = mine.find(p => p.status === 'active');
  if (active) {
    const sisa = active.nominal - (active.lunas * active.cicilan);
    valEl.textContent = rp(sisa);
    if (ketEl) ketEl.textContent = `Sisa ${active.tenor - active.lunas} bulan`;
  } else {
    valEl.textContent = 'Rp 0';
    if (ketEl) ketEl.textContent = mine[0].status === 'pending' ? 'Menunggu approval' : 'Lunas';
  }
}

// ─── TX WIDGET (Home summary numbers) ───
function renderKarTxWidget() {
  const cnt = RW_BELANJA.length;
  const sum = RW_BELANJA.reduce((s, t) => s + t.total, 0);
  const cntEl = document.getElementById('widTxCnt');
  const valEl = document.getElementById('widTxVal');
  if (cntEl) cntEl.textContent = cnt + ' transaksi';
  if (valEl) valEl.textContent = rp(sum);
}

// ─── TX LIST (Home card list) ───
function renderKarTxList() {
  const el = document.getElementById('karTxList');
  if (!el) return;
  if (!RW_BELANJA.length) {
    el.innerHTML = '<div class="tx-empty">Belum ada transaksi.</div>';
    return;
  }
  const total = RW_BELANJA.reduce((s, t) => s + t.total, 0);
  const list  = RW_BELANJA.slice(0, 3);
  const ico = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="16" height="16"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`;
  el.innerHTML = list.map((t, i) => `
    <div class="tx-item${i === list.length - 1 ? ' tx-item--last' : ''}">
      <div class="tx-icon">${ico}</div>
      <div class="tx-info">
        <div class="tx-name">${t.produk}</div>
        <div class="tx-date">${t.tgl} · ${t.id}</div>
      </div>
      <div class="tx-amount">${rp(t.total)}</div>
    </div>`).join('') +
    `<div class="tx-footer">
      <span class="tx-footer-lbl">Total Belanja Bulan Ini</span>
      <span class="tx-footer-val">${rp(total)}</span>
    </div>`;
}

// ─── PINJAMAN STATUS (full page) ───
function renderPinjamanStatus() {
  const cont = document.getElementById('myPinjamanCont');
  if (!cont) return;
  const mine = PINJAMAN_DB.filter(p => p.nik === USER.nik);
  if (!mine.length) {
    cont.innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:var(--muted)">
        <div style="margin-bottom:12px;opacity:.35"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" width="48" height="48"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>
        <p>Belum ada pengajuan pinjaman.</p>
        <button class="btn-prim" style="margin-top:14px" onclick="setKarPinTab(null,'kpt-ajukan')">Ajukan Sekarang</button>
      </div>`;
    return;
  }

  // Map kategori ke warna badge
  const katColors = {
    emergency: 'badge-err',
    reguler  : 'badge-ok',
    barang   : 'badge-blue',
    mandiri  : 'badge-teal',
    bank     : 'badge-warn',
  };

  cont.innerHTML = mine.map(p => {
    const sisa = Math.max(0, p.nominal - (p.lunas * p.cicilan));
    const pct  = p.tenor > 0 ? Math.round((p.lunas / p.tenor) * 100) : 0;

    const statusBadge = {
      active  : 'badge-warn',
      pending : 'badge-pending',
      approved: 'badge-ok',
      done    : 'badge-done',
      rejected: 'badge-err',
    }[p.status] || 'badge-muted';

    const statusLabel = {
      active  : 'Aktif',
      pending : 'Menunggu',
      approved: 'Disetujui',
      done    : 'Lunas',
      rejected: 'Ditolak',
    }[p.status] || p.status;

    const isLumpSum = p.tenor === 1 && p.kategori === 'emergency';
    const katBadge  = katColors[p.kategori] || 'badge-muted';
    const katCfg    = LOAN_CATEGORIES[p.kategori];
    const katLabel  = katCfg ? katCfg.label : '';

    // ── Detail panel: hanya tampil saat accordion dibuka ──
    const detailRows = `
      <div class="pcard-body">
        <div class="pcard-row"><span>Nominal Pinjaman</span><strong>${rp(p.nominal)}</strong></div>
        <div class="pcard-row">
          <span>${isLumpSum ? 'Metode Bayar' : 'Cicilan/bulan'}</span>
          <strong>${isLumpSum ? 'Potong gaji 1×' : rp(p.cicilan)}</strong>
        </div>
        ${!isLumpSum ? `<div class="pcard-row"><span>Tenor</span><strong>${p.tenor} bulan</strong></div>` : ''}
        ${(p.status === 'active' || p.status === 'done') && !isLumpSum
          ? `<div class="pcard-row"><span>Sisa Hutang</span><strong style="color:var(--primary)">${rp(sisa)}</strong></div>`
          : ''}
      </div>
      ${(p.status === 'active' || p.status === 'done') && !isLumpSum ? `
      <div class="pcard-prog">
        <div class="pprog-label"><span>Lunas ${p.lunas}/${p.tenor}</span><span>${pct}%</span></div>
        <div class="pprog-bar"><div class="pprog-fill" style="width:${pct}%"></div></div>
      </div>` : ''}
    `;

    // Ikon chevron untuk tombol toggle
    const chevronSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>`;

    return `
      <div class="pcard">
        <div class="pcard-head">
          <div style="flex:1">
            <div class="pcard-id">${p.id}</div>
            <div class="pcard-tujuan">${p.tujuan}</div>
            ${katLabel ? `<div style="margin-top:4px"><span class="badge ${katBadge}" style="font-size:10px">${katLabel}</span></div>` : ''}
            <button
              class="pcard-toggle"
              aria-expanded="false"
              onclick="togglePcardDetail(this)"
            >
              Lihat Detail ${chevronSvg}
            </button>
          </div>
          <span class="badge ${statusBadge}">${statusLabel}</span>
        </div>
        <div class="pcard-detail">
          ${detailRows}
        </div>
      </div>
    `;
  }).join('');
}

// ─── Toggle accordion detail pinjaman ───
function togglePcardDetail(btn) {
  const detail = btn.closest('.pcard').querySelector('.pcard-detail');
  if (!detail) return;
  const isOpen = detail.classList.contains('open');
  if (isOpen) {
    detail.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = `Lihat Detail <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>`;
  } else {
    detail.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    btn.innerHTML = `Tutup <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>`;
  }
}

// ─── MUTASI ───
function renderMutasi() {
  const b = document.getElementById('tbMutasi');
  if (!b) return;
  b.innerHTML = MUTASI.map((m, i) => `<tr>
    <td>${i + 1}</td>
    <td>${m.tgl}</td>
    <td>${m.ket}</td>
    <td><span class="badge ${m.jenis === 'Wajib' ? 'badge-warn' : 'badge-ok'}">${m.jenis}</span></td>
    <td style="font-weight:700;color:var(--primary)">${rp(m.jml)}</td>
  </tr>`).join('');
}

// ─── LOAN CATEGORIES CONFIG ───
const LOAN_CATEGORIES = {
  emergency: {
    label: '🚨 Pinjaman Emergency',
    color: 'cat--emergency',
    maxNominal: 750000,
    minNominal: 50000,
    hint: 'Maksimum Rp 750.000 · Hanya 1× per bulan · Tanpa bunga',
    tenors: null,       // tidak dicicil — potong gaji 1× saat gajian
    lumpSum: true,
    bunga: 0,
    bankMode: false,
  },
  reguler: {
    label: '💳 Pinjaman Reguler',
    color: 'cat--reguler',
    maxNominal: 7500000,
    minNominal: 500000,
    hint: 'Maksimum Rp 7.500.000 · Bunga 1%/bulan',
    tenors: [3, 6, 12, 18, 24],
    bunga: 0.01,
    bankMode: false,
  },
  barang: {
    label: '📦 Pinjaman Barang',
    color: 'cat--barang',
    maxNominal: 5000000,
    minNominal: 500000,
    hint: 'Maksimum Rp 5.000.000 · Sertakan nota pembelian',
    tenors: [3, 6, 12],
    bunga: 0.01,
    bankMode: false,
  },
  mandiri: {
    label: '🏦 Dana Koperasi Mandiri',
    color: 'cat--mandiri',
    maxNominal: 50000000,
    minNominal: 5000000,
    hint: 'Maksimum Rp 50.000.000 · Persetujuan pengurus & RAT',
    tenors: [6, 12, 24, 36, 48, 60],
    bunga: 0.01,
    bankMode: false,
  },
  bank: {
    label: '🏛️ Pinjaman Bank Luar',
    color: 'cat--bank',
    maxNominal: 200000000,
    minNominal: 50000000,
    hint: 'Rp 50.000.000 – Rp 200.000.000 · Syarat & bunga sesuai bank',
    tenors: [12, 24, 36, 60, 120],
    bunga: null,        // mengikuti ketentuan bank masing-masing
    bankMode: true,
  },
};

let selectedLoanCategory = null;
let selectedBank         = '';

// ─── Helper: baca nilai nominal dari input (strip titik pemisah ribuan) ───
function getLoanNominalValue() {
  const raw = (document.getElementById('loanNominal')?.value || '').replace(/\./g, '').trim();
  const num = parseInt(raw, 10);
  return isNaN(num) ? 0 : num;
}

// ─── Helper: format angka ribuan saat mengetik — TANPA kursor lompat ───
//
// Strategi: lacak posisi kursor berdasarkan INDEX DIGIT MURNI (bukan posisi char).
//
//   "12.345.678"  kursor di posisi 6 (setelah '4')
//    → prefix sebelum kursor = "12.345"
//    → digit murni di prefix  = "12345"  → rawIndex = 5
//
//   Setelah format ulang, telusuri string baru sampai rawIndex digit ke-5:
//    "12.345.678"  → digit ke-5 ada di posisi 6 → kursor = 6  ✓
//
//   Backspace di posisi 6 hapus '4':  raw → "1235678"
//    → formatted = "1.235.678"
//    → rawIndex sebelum backspace = 5, setelah hapus satu char rawIndex efektif = 4
//    → digit ke-4 di "1.235.678" ada di posisi 5 → kursor = 5  ✓
//
function formatLoanNominal(input) {
  const prev      = input.value;
  const cursorPos = input.selectionStart ?? prev.length;

  // Hitung berapa digit MURNI ada di sebelah kiri kursor (rawIndex)
  let rawIndex = 0;
  for (let i = 0; i < cursorPos; i++) {
    if (prev[i] >= '0' && prev[i] <= '9') rawIndex++;
  }

  // Strip non-digit, format ulang
  const digits    = prev.replace(/\D/g, '');
  if (!digits) { input.value = ''; updateSimulasi(); return; }
  const formatted = parseInt(digits, 10).toLocaleString('id-ID');
  input.value     = formatted;

  // Cari posisi kursor baru: setelah digit ke-rawIndex di string terformat
  let count     = 0;
  let newCursor = formatted.length; // default: akhir string
  for (let i = 0; i < formatted.length; i++) {
    if (formatted[i] >= '0' && formatted[i] <= '9') {
      count++;
      if (count === rawIndex) { newCursor = i + 1; break; }
    }
  }
  // rawIndex = 0 → kursor di awal
  if (rawIndex === 0) newCursor = 0;

  try { input.setSelectionRange(newCursor, newCursor); } catch(_) {}
  updateSimulasi();
}

// ─── Pilih kategori → tampilkan Step 2 ───
function selectLoanCategory(cat) {
  selectedLoanCategory = cat;
  selectedBank = '';

  const cfg = LOAN_CATEGORIES[cat];
  if (!cfg) return;

  // Transisi step 1 → step 2
  const s1 = document.getElementById('loan-step-1');
  const s2 = document.getElementById('loan-step-2');
  if (s1) s1.hidden = true;
  if (s2) s2.hidden = false;

  // Title & subtitle
  const titleEl = document.getElementById('loanFormTitle');
  const subEl   = document.getElementById('loanFormSub');
  // Hapus emoji di depan label untuk judul
  if (titleEl) titleEl.textContent = cfg.label.replace(/^\S+\s/, '');
  if (subEl)   subEl.textContent   = cfg.hint;

  // Badge kategori terpilih
  const badge = document.getElementById('loanSelectedBadge');
  if (badge) {
    badge.className = 'loan-selected-badge ' + cfg.color;
    badge.innerHTML = cfg.label;
  }

  // Alert spesifik per jenis
  const alertEm   = document.getElementById('loan-alert-emergency');
  const alertBank = document.getElementById('loan-alert-bank');
  if (alertEm)   alertEm.hidden   = (cat !== 'emergency');
  if (alertBank) alertBank.hidden = (cat !== 'bank');

  // Bank selector — hanya tampil untuk kategori bank
  const bankGroup = document.getElementById('fieldBankGroup');
  const loanBank  = document.getElementById('loanBank');
  if (bankGroup) bankGroup.hidden = !cfg.bankMode;
  if (loanBank)  loanBank.value   = '';
  document.querySelectorAll('.bank-btn').forEach(b => b.classList.remove('selected'));
  selectedBank = '';

  // Reset nominal & tujuan
  const nomEl  = document.getElementById('loanNominal');
  const tujEl  = document.getElementById('loanTujuan');
  if (nomEl) {
    nomEl.value = '';
    // Placeholder sesuai kategori
    const midVal = cat === 'bank'
      ? '50.000.000'
      : Math.floor(cfg.maxNominal / 2).toLocaleString('id-ID');
    nomEl.placeholder = midVal;
  }
  if (tujEl) tujEl.value = '';

  // Hint batas nominal
  const hintEl = document.getElementById('loanNominalHint');
  if (hintEl) hintEl.textContent = cfg.hint;

  // Emergency: sembunyikan tenor & simulasi, tampilkan info lump-sum
  const isLumpSum = !!cfg.lumpSum;
  const fieldTenor  = document.getElementById('fieldTenor');
  const simResult   = document.getElementById('simResult');
  const emInfo      = document.getElementById('loanEmergencyInfo');
  const warn40      = document.getElementById('sim40Warning');

  if (fieldTenor)  fieldTenor.hidden  = isLumpSum;
  if (simResult)   simResult.hidden   = isLumpSum;
  if (emInfo)      emInfo.hidden      = !isLumpSum;
  if (warn40)      warn40.hidden      = true;

  if (!isLumpSum) {
    // Bangun tombol tenor sesuai kategori
    selectedTenor = cfg.tenors[0];
    const tenorWrap = document.getElementById('tenorOptions');
    if (tenorWrap) {
      tenorWrap.innerHTML = cfg.tenors.map((t, i) =>
        `<button type="button" class="tenor-btn${i === 0 ? ' active' : ''}" onclick="setTenor(this,${t})">${t} bln</button>`
      ).join('');
    }
    // Reset simulasi & jadwal angsuran
    updateSimulasi();
    amortOpen = false;
    const at = document.getElementById('amortTable');
    if (at) { at.hidden = true; at.innerHTML = ''; }
  }

  // Label tombol submit
  const sbtn = document.getElementById('loanSubmitBtn');
  if (sbtn) sbtn.textContent = (cat === 'bank') ? 'Kirim Permohonan' : 'Ajukan Pinjaman';

  // Scroll ke form
  const kptAjukan = document.getElementById('kpt-ajukan');
  if (kptAjukan) kptAjukan.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Kembali ke pilihan kategori ───
function backToLoanCategories() {
  const s1 = document.getElementById('loan-step-1');
  const s2 = document.getElementById('loan-step-2');
  if (s1) s1.hidden = false;
  if (s2) s2.hidden = true;
  selectedLoanCategory = null;
  selectedBank = '';
}

// ─── Pilih bank mitra ───
function selectBank(btn, bankName) {
  selectedBank = bankName;
  const loanBank = document.getElementById('loanBank');
  if (loanBank) loanBank.value = bankName;
  document.querySelectorAll('.bank-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

// ─── SUBMIT PINJAMAN ───
function submitLoan(e) {
  e.preventDefault();

  // Guard: pastikan kategori sudah dipilih
  if (!selectedLoanCategory) {
    showToast('⚠️ Pilih kategori pinjaman terlebih dahulu', 'toast-warn');
    return;
  }

  const cfg     = LOAN_CATEGORIES[selectedLoanCategory];
  const nominal = getLoanNominalValue();
  const tujuan  = (document.getElementById('loanTujuan')?.value || '').trim();

  // Validasi: bank harus pilih bank mitra
  if (cfg.bankMode && !selectedBank) {
    showToast('⚠️ Pilih bank mitra terlebih dahulu', 'toast-warn');
    document.getElementById('fieldBankGroup')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // Validasi nominal
  if (!nominal || nominal <= 0) {
    showToast('⚠️ Masukkan nominal pinjaman', 'toast-warn');
    document.getElementById('loanNominal')?.focus();
    return;
  }
  if (cfg.minNominal && nominal < cfg.minNominal) {
    showToast(`⚠️ Minimal ${rp(cfg.minNominal)} untuk kategori ini`, 'toast-warn');
    return;
  }
  if (nominal > cfg.maxNominal) {
    showToast(`⚠️ Melebihi batas maksimum ${rp(cfg.maxNominal)}`, 'toast-warn');
    return;
  }

  // Validasi tujuan
  if (!tujuan) {
    showToast('⚠️ Masukkan tujuan / keterangan pinjaman', 'toast-warn');
    document.getElementById('loanTujuan')?.focus();
    return;
  }

  // Hitung cicilan
  const isLumpSum = !!cfg.lumpSum;
  const tenor     = isLumpSum ? 1 : selectedTenor;
  const bunga     = cfg.bunga ?? 0.009; // fallback 0.9%/bln jika null (bank)
  const cicilan   = isLumpSum
    ? nominal
    : Math.round((nominal * (1 + bunga * tenor)) / tenor);

  // Buat ID unik
  const newId    = 'LN-' + String(Date.now()).slice(-4).padStart(4, '0') +
                   String(Math.floor(Math.random() * 90) + 10);
  const katLabel = cfg.bankMode
    ? `Bank ${selectedBank}`
    : cfg.label.replace(/^\S+\s/, '');

  // Simpan ke DB lokal
  PINJAMAN_DB.push({
    id      : newId,
    nik     : USER.nik,
    nama    : USER.nama,
    tujuan  : `[${katLabel}] ${tujuan}`,
    nominal,
    tenor,
    cicilan,
    lunas   : 0,
    status  : 'pending',
    tgl     : today(),
    kategori: selectedLoanCategory,
  });

  // UI feedback
  renderPinjamanStatus();
  renderKarPinjamanWidget();
  showToast(`✓ ${katLabel} ${newId} berhasil diajukan!`, 'toast-ok');

  // Reset form & kembali ke step 1
  document.getElementById('loanForm')?.reset();
  backToLoanCategories();

  // Kembali ke tab Status setelah toast selesai
  setTimeout(() => {
    const statusTab = document.querySelector('.ptab[onclick*="kpt-status"]');
    if (statusTab) setKarPinTab(statusTab, 'kpt-status');
  }, 900);
}

// ─── Set tenor aktif ───
function setTenor(btn, t) {
  selectedTenor = t;
  document.querySelectorAll('.tenor-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  updateSimulasi();

  // ── FIX: Jika jadwal angsuran sedang terbuka, render ulang otomatis ──
  if (amortOpen) renderAmortTable();
}

// ─── Render tabel amortisasi (bisa dipanggil kapan saja) ───
function renderAmortTable() {
  const el = document.getElementById('amortTable');
  if (!el) return;

  const cfg = selectedLoanCategory ? LOAN_CATEGORIES[selectedLoanCategory] : null;
  if (!cfg || cfg.lumpSum) {
    el.innerHTML = '';
    el.hidden = true;
    amortOpen = false;
    return;
  }

  const nominal = getLoanNominalValue() || 0;
  if (nominal <= 0) {
    el.innerHTML = '<p style="text-align:center;color:var(--muted);padding:12px">Masukkan nominal terlebih dahulu</p>';
    return;
  }

  const bunga   = cfg.bunga ?? 0.009;
  const cicilan = Math.round((nominal * (1 + bunga * selectedTenor)) / selectedTenor);
  let sisa = nominal;
  let html = '<table class="tbl"><thead><tr><th>Bln</th><th>Cicilan</th><th>Sisa</th></tr></thead><tbody>';
  for (let i = 1; i <= selectedTenor; i++) {
    sisa = Math.max(0, sisa - cicilan);
    html += `<tr><td>${i}</td><td>${rp(cicilan)}</td><td>${rp(sisa)}</td></tr>`;
  }
  html += '</tbody></table>';
  el.innerHTML = html;
}

// ─── Update simulasi cicilan real-time ───
function updateSimulasi() {
  // Jangan jalankan simulasi jika tidak ada kategori atau kategori lump-sum
  if (!selectedLoanCategory) return;
  const cfg = LOAN_CATEGORIES[selectedLoanCategory];
  if (!cfg || cfg.lumpSum) return;

  const nominal = getLoanNominalValue() || 0;
  const bunga   = cfg.bunga ?? 0.009;
  const cicilan = nominal > 0
    ? Math.round((nominal * (1 + bunga * selectedTenor)) / selectedTenor)
    : 0;
  const total = cicilan * selectedTenor;

  const setIfEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  setIfEl('simNominal', rp(nominal));
  setIfEl('simTenor',   selectedTenor + ' bulan');
  setIfEl('simCicilan', rp(cicilan));
  setIfEl('simTotal',   rp(total));

  // Warning jika cicilan > 40% estimasi gaji
  const simp    = SIMPANAN_DB[USER.nik] || {};
  const estGaji = (simp.wajib || 200000) * 10;
  const warn40  = document.getElementById('sim40Warning');
  if (warn40) warn40.hidden = !(nominal > 0 && cicilan > estGaji * 0.4);
}

// ─── Toggle jadwal angsuran ───
function toggleAmort() {
  amortOpen = !amortOpen;
  const el = document.getElementById('amortTable');
  if (!el) return;
  el.hidden = !amortOpen;

  // ── FIX: Selalu render ulang saat dibuka — tangkap perubahan tenor & nominal ──
  if (amortOpen) renderAmortTable();
}

// ─── PINJAMAN TAB ───
function setKarPinTab(btn, tabId) {
  // btn bisa null jika dipanggil programatis — cari tab yang sesuai sebagai fallback
  if (!btn) btn = document.querySelector(`.ptab[onclick*="${tabId}"]`);
  if (!btn) return;

  document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');

  ['kpt-status', 'kpt-ajukan'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  });

  const target = document.getElementById(tabId);
  if (target) target.hidden = false;

  // Saat pindah ke tab "Ajukan", pastikan mulai dari Step 1
  if (tabId === 'kpt-ajukan') {
    const s1 = document.getElementById('loan-step-1');
    const s2 = document.getElementById('loan-step-2');
    if (s1) s1.hidden = false;
    if (s2) s2.hidden = true;
    selectedLoanCategory = null;
    selectedBank = '';
  }
}

// ─── KATALOG ───
function renderKatalog(list) {
  const g = document.getElementById('prodGrid');
  if (!g) return;
  const fl = activeFilter === 'semua' ? list : list.filter(p => p.kat === activeFilter);
  if (!fl.length) {
    g.innerHTML = `<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--muted)">Produk tidak ditemukan.</div>`;
    return;
  }
  g.innerHTML = fl.map(p => `
    <div class="prod-card">
      <div class="prod-img">${p.emo}</div>
      <div class="prod-body">
        <div class="prod-cat">${p.kat}</div>
        <div class="prod-name">${p.nama}</div>
        <div class="prod-price">${rp(p.harga)}</div>
        <div class="prod-stok">${p.stok === 0 ? '❌ Habis' : `✅ Stok: ${p.stok}`}</div>
      </div>
      <div class="prod-foot">
        <button class="btn-add" ${p.stok === 0 ? 'disabled' : ''} onclick="addToCart('${p.kode}')">
          ${p.stok === 0 ? 'Habis' : '+ Keranjang'}
        </button>
      </div>
    </div>
  `).join('');
}

function setFtab(btn, kat) {
  activeFilter = kat;
  document.querySelectorAll('.ftab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderKatalog(PRODUCTS);
}

function filterKatalog(q) {
  renderKatalog(PRODUCTS.filter(p => p.nama.toLowerCase().includes(q.toLowerCase())));
}

// ─── KERANJANG ───
function addToCart(kode) {
  const p  = PRODUCTS.find(x => x.kode === kode);
  if (!p) return;
  const ex = cart.find(c => c.kode === kode);
  if (ex) {
    if (ex.qty >= p.stok) { showToast('Stok tidak cukup!', 'toast-err'); return; }
    ex.qty++;
  } else { cart.push({ ...p, qty: 1 }); }
  updateCartUI();
  showToast(`${p.nama} ditambahkan ke keranjang ✓`, 'toast-ok');
}

function updateCartUI() {
  const total = cart.reduce((s, c) => s + c.qty, 0);
  const amt   = cart.reduce((s, c) => s + c.harga * c.qty, 0);
  const cntEl = document.getElementById('cartCnt');
  if (cntEl) cntEl.textContent = total;

  const fab = document.getElementById('cartFab');
  if (fab) {
    const wasHidden = fab.hidden;
    fab.hidden = (total === 0); // sembunyikan sepenuhnya jika keranjang kosong
    if (!fab.hidden) {
      // Trigger ulang animasi masuk saat FAB pertama muncul (ada item baru)
      if (wasHidden) {
        fab.classList.remove('cart-fab--pop');
        void fab.offsetWidth; // reflow trick
        fab.classList.add('cart-fab--pop');
      }
      const fabTxt = document.getElementById('cartFabTxt');
      const fabAmt = document.getElementById('cartFabAmt');
      if (fabTxt) fabTxt.textContent = total + ' item';
      if (fabAmt) fabAmt.textContent = rp(amt);
    }
  }

  // Sync badge di bottom nav
  const bb = document.getElementById('bnCartBadge');
  if (bb) { bb.textContent = total; bb.hidden = (total === 0); }
}

function renderCart() {
  const col    = document.getElementById('cartItemsCol');
  const sumCol = document.getElementById('cartSumCol');
  const empty  = document.getElementById('emptyCart');
  if (!col) return;

  col.querySelectorAll('.cart-item').forEach(i => i.remove());

  if (!cart.length) {
    empty.style.display = 'block';
    if (sumCol) sumCol.hidden = true;
    return;
  }
  empty.style.display = 'none';
  if (sumCol) sumCol.hidden = false;

  cart.forEach(item => {
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <div class="ci-icon">${item.emo}</div>
      <div class="ci-info">
        <div class="ci-name">${item.nama}</div>
        <div class="ci-price">${rp(item.harga)} / pcs</div>
      </div>
      <div class="ci-ctrl">
        <button class="qty-btn" onclick="chgQty('${item.kode}',-1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="chgQty('${item.kode}',1)">+</button>
        <button class="ci-del" onclick="removeCart('${item.kode}')">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
        </button>
      </div>
    `;
    col.insertBefore(el, empty);
  });

  const sub  = cart.reduce((s, c) => s + c.harga * c.qty, 0);
  const disc = Math.round(sub * 0.05);
  const tot  = sub - disc;
  const setIfEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  setIfEl('cSubtotal', rp(sub));
  setIfEl('cDiscount', '- ' + rp(disc));
  setIfEl('cTotal',    rp(tot));
}

function chgQty(kode, delta) {
  const item = cart.find(c => c.kode === kode);
  const prod = PRODUCTS.find(p => p.kode === kode);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(c => c.kode !== kode);
  else if (prod && item.qty > prod.stok) { item.qty = prod.stok; showToast('Stok maksimum', 'toast-err'); }
  updateCartUI(); renderCart();
}

function removeCart(kode) {
  cart = cart.filter(c => c.kode !== kode);
  updateCartUI(); renderCart();
  showToast('Item dihapus ✓', 'toast-ok');
}

function checkout() {
  if (!cart.length) return;
  showToast('⏳ Memproses checkout...', 'toast-info');
  setTimeout(() => {
    const sub = cart.reduce((s, c) => s + c.harga * c.qty, 0);
    const tot = sub - Math.round(sub * 0.05);
    cart.forEach(item => {
      const p = PRODUCTS.find(x => x.kode === item.kode);
      if (p) p.stok = Math.max(0, p.stok - item.qty);
    });
    const txId = '#TRX-' + String(Math.floor(Math.random() * 9000) + 1000);
    RW_BELANJA.unshift({
      id: txId, tgl: today(),
      produk: cart.map(c => `${c.nama} x${c.qty}`).join(', '),
      total: tot, status: 'Selesai'
    });
    cart = [];
    updateCartUI(); renderCart(); renderKatalog(PRODUCTS);
    renderKarTxWidget(); renderKarTxList(); renderRwBelanja();
    showToast(`✅ Checkout ${txId} berhasil!`, 'toast-ok');
    setTimeout(() => _showSec('kar-riwayat'), 1400);
  }, 800);
}

// ─── RIWAYAT ───
function setRtab(btn, tabId) {
  document.querySelectorAll('.rtab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  ['rt-belanja', 'rt-cicilan'].forEach(id => document.getElementById(id).style.display = 'none');
  document.getElementById(tabId).style.display = 'block';
}

function renderRwBelanja() {
  const b = document.getElementById('tbRwBelanja');
  if (!b) return;
  b.innerHTML = RW_BELANJA.map((t, i) => `<tr>
    <td>${i + 1}</td>
    <td>${t.tgl}</td>
    <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.produk}</td>
    <td style="font-weight:700;color:var(--primary)">${rp(t.total)}</td>
    <td><span class="badge badge-ok">${t.status}</span></td>
  </tr>`).join('');
}

function renderRwCicilan() {
  const b = document.getElementById('tbRwCicilan');
  if (!b) return;
  b.innerHTML = RW_CICILAN.map((t, i) => `<tr>
    <td>${i + 1}</td>
    <td>${t.tgl}</td>
    <td>${t.ket}</td>
    <td style="font-weight:700">${rp(t.jml)}</td>
    <td><span class="badge badge-ok">${t.status}</span></td>
  </tr>`).join('');
}

// ─── SIMPANAN CAROUSEL (auto-scroll infinite + swipe) ───
function initSimpananCarousel() {
  const wrap  = document.getElementById('simpCarouselWrap');
  const track = document.getElementById('simpCarouselTrack');
  if (!wrap || !track) return;

  // Kecepatan scroll px/frame (60fps ≈ 36px/detik). Naikkan untuk lebih cepat.
  const SPEED = 0.6;

  let offset    = 0;    // posisi translateX saat ini (selalu positif)
  let halfWidth = 0;    // lebar satu set (4 kartu real) → titik wrap seamless
  let isPaused  = false;
  let isDragging   = false;
  let dragStartX   = 0;
  let dragStartOff = 0;

  // ── 1. Hitung lebar satu set (4 kartu real, bukan clone) ────────────
  function calcHalf() {
    // Ambil hanya kartu REAL (tidak aria-hidden) untuk pengukuran akurat
    const realCards = Array.from(
      track.querySelectorAll('.simp-carousel-card:not([aria-hidden])')
    );
    if (!realCards.length) return;

    const gap = parseFloat(getComputedStyle(track).columnGap ||
                           getComputedStyle(track).gap || '10');
    let w = 0;
    realCards.forEach(c => { w += c.getBoundingClientRect().width; });
    // total lebar = jumlah lebar kartu + gap di ANTARA kartu + 1 gap setelah kartu terakhir
    // (kartu terakhir set real langsung bertemu kartu pertama clone, jadi butuh 1 gap ekstra)
    halfWidth = w + gap * realCards.length;
  }

  // ── 2. Loop RAF — auto-scroll + seamless wrap ────────────────────────
  function tick() {
    if (!isPaused && !isDragging && halfWidth > 0) {
      offset += SPEED;
      if (offset >= halfWidth) offset -= halfWidth; // lompat seamless
      track.style.transform = `translateX(${-offset}px)`;
    }
    requestAnimationFrame(tick);
  }

  // ── 3. Drag / swipe handlers ─────────────────────────────────────────
  function onDragStart(clientX) {
    isDragging        = true;
    isPaused          = true;
    dragStartX        = clientX;
    dragStartOff      = offset;
    track.style.transition = 'none';
    wrap.style.cursor      = 'grabbing';
  }

  function onDragMove(clientX) {
    if (!isDragging) return;
    let next = dragStartOff + (dragStartX - clientX);
    // Wrap infinitely agar swipe mundur juga terasa mulus
    if (halfWidth > 0) {
      next = ((next % halfWidth) + halfWidth) % halfWidth;
    }
    offset = next;
    track.style.transform = `translateX(${-offset}px)`;
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging        = false;
    isPaused          = false;
    wrap.style.cursor = 'grab';
  }

  // Touch (mobile swipe)
  wrap.addEventListener('touchstart',  e => onDragStart(e.touches[0].clientX), { passive: true });
  wrap.addEventListener('touchmove',   e => onDragMove(e.touches[0].clientX),  { passive: true });
  wrap.addEventListener('touchend',    onDragEnd);
  wrap.addEventListener('touchcancel', onDragEnd);

  // Mouse drag (desktop)
  wrap.addEventListener('mousedown', e => { e.preventDefault(); onDragStart(e.clientX); });
  window.addEventListener('mousemove', e => { if (isDragging) onDragMove(e.clientX); });
  window.addEventListener('mouseup',   onDragEnd);

  // Pause on hover saat TIDAK sedang drag (desktop UX)
  wrap.addEventListener('mouseenter', () => { if (!isDragging) isPaused = true;  });
  wrap.addEventListener('mouseleave', () => { if (!isDragging) isPaused = false; });

  // Recalc saat resize (orientasi HP berubah, dll.)
  window.addEventListener('resize', () => requestAnimationFrame(calcHalf));

  // Mulai setelah 2 frame agar layout sudah terhitung
  requestAnimationFrame(() => requestAnimationFrame(() => {
    calcHalf();
    wrap.style.cursor = 'grab';
    requestAnimationFrame(tick);
  }));
}

// ─── PWA Install ───
let _deferredPWAPrompt = null;
function initPWA() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  function setPWAVisible(show) {
    const row = document.getElementById('pwaInstallRow');
    const dot = document.getElementById('bnPwaDot');
    if (row) row.hidden = !show;
    if (dot) dot.hidden = !show;
  }
  if (isStandalone) {
    setPWAVisible(false);
  } else {
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      _deferredPWAPrompt = e;
      setPWAVisible(true);
    });
    window.addEventListener('appinstalled', () => {
      _deferredPWAPrompt = null;
      setPWAVisible(false);
      showToast('✅ Aplikasi berhasil dipasang!', 'toast-ok');
    });
  }

  window.triggerPWAInstall = async function() {
    if (!_deferredPWAPrompt) {
      showToast('ℹ️ Gunakan menu browser → "Tambah ke Layar Utama"', 'toast-info', 4000);
      return;
    }
    _deferredPWAPrompt.prompt();
    const { outcome } = await _deferredPWAPrompt.userChoice;
    if (outcome === 'accepted') { _deferredPWAPrompt = null; setPWAVisible(false); }
  };
}

// ─── START ───
init();
registerSW('../sw.js');

// ══════════════════════════════════════════════════
//  MODAL LAYANAN — Buka/Tutup Bottom Sheet
// ══════════════════════════════════════════════════

/**
 * Buka bottom sheet modal pilihan layanan.
 * Dipanggil oleh tombol "Layanan" di bottom nav.
 */
function bukaModalLayanan() {
  const overlay = document.getElementById('layananOverlay');
  if (!overlay) return;
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}

/**
 * Tutup modal layanan.
 * Dipanggil langsung (tombol ✕) atau via klik overlay.
 * Parameter `e` opsional — jika ada, hanya tutup jika klik di luar sheet.
 */
function tutupModalLayanan(e) {
  const overlay = document.getElementById('layananOverlay');
  const sheet   = document.getElementById('layananSheet');
  if (!overlay) return;

  // Jika dipanggil dari klik overlay, pastikan bukan klik di dalam sheet
  if (e && sheet && sheet.contains(e.target)) return;

  // Animasi keluar
  overlay.style.animation = 'layanan-bg-out .2s ease both';
  if (sheet) sheet.style.animation = 'sheet-down .24s cubic-bezier(.55,0,.45,1) both';

  setTimeout(() => {
    overlay.classList.remove('show');
    overlay.style.animation = '';
    if (sheet) sheet.style.animation = '';
    document.body.style.overflow = '';
  }, 220);
}

/**
 * Dipanggil saat user memilih salah satu kartu layanan.
 * Tutup modal lalu navigasi ke section yang dipilih.
 * @param {string} secId — 'kar-katalog' atau 'kar-ppob'
 */
function pilihLayanan(secId) {
  tutupModalLayanan();          // animasi tutup
  setTimeout(() => {
    _showSec(secId);            // pindah section setelah animasi selesai
  }, 240);
}
