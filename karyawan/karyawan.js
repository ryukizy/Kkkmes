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
    cont.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted)">Belum ada pengajuan pinjaman.</div>';
    return;
  }
  cont.innerHTML = mine.map(p => {
    const sisa = p.nominal - (p.lunas * p.cicilan);
    const pct  = Math.round((p.lunas / p.tenor) * 100);
    const statusBadge = p.status === 'active' ? 'badge-warn' : p.status === 'pending' ? 'badge-pending' : p.status === 'approved' ? 'badge-ok' : 'badge-done';
    const statusLabel = p.status === 'active' ? 'Aktif' : p.status === 'pending' ? 'Menunggu' : p.status === 'approved' ? 'Disetujui' : 'Lunas';
    return `
      <div class="pcard">
        <div class="pcard-head">
          <div style="flex:1">
            <div class="pcard-id">${p.id}</div>
            <div class="pcard-tujuan">${p.tujuan}</div>
          </div>
          <span class="badge ${statusBadge}">${statusLabel}</span>
        </div>
        <div class="pcard-body">
          <div class="pcard-row"><span>Nominal Pinjaman</span><strong>${rp(p.nominal)}</strong></div>
          <div class="pcard-row"><span>Cicilan/bulan</span><strong>${rp(p.cicilan)}</strong></div>
          <div class="pcard-row"><span>Tenor</span><strong>${p.tenor} bulan</strong></div>
          ${p.status === 'active' || p.status === 'done' ? `<div class="pcard-row"><span>Sisa Hutang</span><strong style="color:var(--primary)">${rp(sisa)}</strong></div>` : ''}
        </div>
        ${p.status === 'active' || p.status === 'done' ? `
        <div class="pcard-prog">
          <div class="pprog-label"><span>Lunas ${p.lunas}/${p.tenor}</span><span>${pct}%</span></div>
          <div class="pprog-bar"><div class="pprog-fill" style="width:${pct}%"></div></div>
        </div>` : ''}
      </div>
    `;
  }).join('');
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
    hint: 'Maksimum Rp 750.000 · Hanya 1× per bulan',
    tenors: null,       // tidak dicicil — potong gaji 1× di periode berjalan
    lumpSum: true,      // lunas sekaligus saat gajian
    bunga: 0,           // 0% (sosial/darurat)
    bankMode: false,
  },
  reguler: {
    label: '💳 Pinjaman Reguler',
    color: 'cat--reguler',
    maxNominal: 7500000,
    hint: 'Maksimum Rp 7.500.000 · Bunga 1%/bulan',
    tenors: [3, 6, 12, 18, 24],
    bunga: 0.01,
    bankMode: false,
  },
  barang: {
    label: '📦 Pinjaman Barang',
    color: 'cat--barang',
    maxNominal: 5000000,
    hint: 'Maksimum Rp 5.000.000 · Sertakan nota pembelian',
    tenors: [3, 6, 12],
    bunga: 0.01,
    bankMode: false,
  },
  mandiri: {
    label: '🏦 Dana Koperasi Mandiri',
    color: 'cat--mandiri',
    maxNominal: 50000000,
    hint: 'Maksimum Rp 50.000.000 · Persetujuan pengurus diperlukan',
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
    bunga: null,        // mengikuti bank
    bankMode: true,
  },
};

let selectedLoanCategory = null;
let selectedBank = '';

function selectLoanCategory(cat) {
  selectedLoanCategory = cat;
  selectedBank = '';
  const cfg = LOAN_CATEGORIES[cat];

  // Toggle step 1 → 2
  document.getElementById('loan-step-1').hidden = true;
  document.getElementById('loan-step-2').hidden = false;

  // Title & sub
  document.getElementById('loanFormTitle').textContent = cfg.label.replace(/^\S+\s/, '');
  document.getElementById('loanFormSub').textContent   = cfg.hint;

  // Badge kategori
  const badge = document.getElementById('loanSelectedBadge');
  badge.className = 'loan-selected-badge ' + cfg.color;
  badge.innerHTML = cfg.label;

  // Alerts
  document.getElementById('loan-alert-emergency').hidden = (cat !== 'emergency');
  document.getElementById('loan-alert-bank').hidden      = (cat !== 'bank');

  // Bank selector
  document.getElementById('fieldBankGroup').hidden = !cfg.bankMode;
  document.getElementById('loanBank').value = '';
  document.querySelectorAll('.bank-btn').forEach(b => b.classList.remove('selected'));

  // Nominal hint
  document.getElementById('loanNominalHint').textContent = cfg.hint;
  document.getElementById('loanNominal').value = '';
  document.getElementById('loanTujuan').value  = '';

  // Set input placeholder
  const nomEl = document.getElementById('loanNominal');
  if (cat === 'bank') {
    nomEl.placeholder = '50.000.000';
  } else {
    nomEl.placeholder = Math.floor(cfg.maxNominal / 2).toLocaleString('id-ID');
  }

  // Tenor field — sembunyikan untuk emergency (lunas 1x potong gaji)
  const isLumpSum = !!cfg.lumpSum;
  document.getElementById('fieldTenor').hidden  = isLumpSum;
  document.getElementById('simResult').hidden   = isLumpSum;
  document.getElementById('loanEmergencyInfo').hidden = !isLumpSum;

  if (!isLumpSum) {
    // Tenor buttons untuk kategori non-emergency
    selectedTenor = cfg.tenors[0];
    const tenorWrap = document.getElementById('tenorOptions');
    tenorWrap.innerHTML = cfg.tenors.map((t, i) =>
      `<button type="button" class="tenor-btn${i === 0 ? ' active' : ''}" onclick="setTenor(this,${t})">${t} bln</button>`
    ).join('');
    // Reset simulasi & amort
    updateSimulasi();
    amortOpen = false;
    const at = document.getElementById('amortTable');
    if (at) { at.hidden = true; at.innerHTML = ''; }
  }

  // Submit label
  const sbtn = document.getElementById('loanSubmitBtn');
  if (sbtn) sbtn.textContent = cat === 'bank' ? 'Kirim Permohonan' : 'Ajukan Pinjaman';

  document.getElementById('kpt-ajukan').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function backToLoanCategories() {
  document.getElementById('loan-step-1').hidden = false;
  document.getElementById('loan-step-2').hidden = true;
}

function selectBank(btn, bankName) {
  selectedBank = bankName;
  document.getElementById('loanBank').value = bankName;
  document.querySelectorAll('.bank-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

// ─── LOAN SUBMISSION ───
function submitLoan(e) {
  e.preventDefault();
  const cfg     = LOAN_CATEGORIES[selectedLoanCategory];
  const nominal = getLoanNominalValue();
  const tujuan  = document.getElementById('loanTujuan').value.trim();

  // Validasi kategori bank harus pilih bank
  if (cfg.bankMode && !selectedBank) {
    showToast('⚠️ Pilih bank mitra terlebih dahulu', 'toast-warn');
    return;
  }

  // Validasi nominal
  if (nominal <= 0) {
    showToast('⚠️ Masukkan nominal pinjaman', 'toast-warn');
    return;
  }
  if (nominal > cfg.maxNominal) {
    showToast(`⚠️ Melebihi batas maksimum kategori ini`, 'toast-warn');
    return;
  }
  if (cfg.minNominal && nominal < cfg.minNominal) {
    showToast(`⚠️ Minimal Rp ${cfg.minNominal.toLocaleString('id-ID')} untuk kategori ini`, 'toast-warn');
    return;
  }

  const isLumpSum = !!cfg.lumpSum;
  const tenor   = isLumpSum ? 1 : selectedTenor;
  const bunga   = cfg.bunga ?? 0.009;
  const cicilan = isLumpSum ? nominal : Math.round((nominal * (1 + bunga * tenor)) / tenor);
  const newId   = 'LN-' + String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0');
  const katLabel = cfg.bankMode ? `Bank ${selectedBank}` : cfg.label.replace(/^\S+\s/, '');

  PINJAMAN_DB.push({
    id: newId, nik: USER.nik, nama: USER.nama,
    tujuan: `[${katLabel}] ${tujuan}`,
    nominal, tenor, cicilan, lunas: 0,
    status: 'pending', tgl: today(),
    kategori: selectedLoanCategory,
  });

  renderPinjamanStatus();
  showToast(`✓ Pinjaman ${newId} berhasil diajukan!`, 'toast-ok');
  document.getElementById('loanForm').reset();
  backToLoanCategories();
  setTimeout(() => setKarPinTab(
    document.querySelector('.ptab'),
    'kpt-status'
  ), 800);
}

function setTenor(btn, t) {
  selectedTenor = t;
  document.querySelectorAll('.tenor-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  updateSimulasi();
}

function updateSimulasi() {
  const nominal = getLoanNominalValue() || 0;
  const cfg     = selectedLoanCategory ? LOAN_CATEGORIES[selectedLoanCategory] : null;
  const bunga   = cfg ? (cfg.bunga ?? 0.009) : 0.01;
  const cicilan = nominal > 0 ? Math.round((nominal * (1 + bunga * selectedTenor)) / selectedTenor) : 0;
  const total   = cicilan * selectedTenor;
  const setIfEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  setIfEl('simNominal', rp(nominal));
  setIfEl('simTenor',   selectedTenor + ' bulan');
  setIfEl('simCicilan', rp(cicilan));
  setIfEl('simTotal',   rp(total));

  // Warning 40% — pakai estimasi gaji dari simpanan wajib × 10 (dummy)
  const simp    = SIMPANAN_DB[USER.nik] || {};
  const estGaji = (simp.wajib || 200000) * 10; // estimasi kasar
  const warn40  = document.getElementById('sim40Warning');
  if (warn40) warn40.hidden = !(nominal > 0 && cicilan > estGaji * 0.4);
}

function toggleAmort() {
  amortOpen = !amortOpen;
  const el = document.getElementById('amortTable');
  el.hidden = !amortOpen;
  if (amortOpen) {
    const cfg     = selectedLoanCategory ? LOAN_CATEGORIES[selectedLoanCategory] : null;
    const bunga   = cfg ? (cfg.bunga ?? 0.009) : 0.01;
    const nominal = getLoanNominalValue() || 0;
    const cicilan = nominal > 0 ? Math.round((nominal * (1 + bunga * selectedTenor)) / selectedTenor) : 0;
    let sisa = nominal;
    let html = '<table class="tbl"><thead><tr><th>Bln</th><th>Cicilan</th><th>Sisa</th></tr></thead><tbody>';
    for (let i = 1; i <= selectedTenor; i++) {
      sisa = Math.max(0, sisa - cicilan);
      html += `<tr><td>${i}</td><td>${rp(cicilan)}</td><td>${rp(sisa)}</td></tr>`;
    }
    html += '</tbody></table>';
    el.innerHTML = html;
  }
}

// ─── PINJAMAN TAB ───
function setKarPinTab(btn, tabId) {
  document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  ['kpt-status', 'kpt-ajukan'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  });
  const t = document.getElementById(tabId);
  if (t) t.hidden = false;
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
