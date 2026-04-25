// ============================================
//  ADMIN.JS — KopKar MES (FULL + PPOB + SIMULASI TRANSAKSI)
// ============================================

const USER = requireRole('admin');
if (!USER) throw new Error('Unauthorized');

let PRODUCTS = JSON.parse(JSON.stringify(window.SHARED_PRODUCTS));
let PINJAMAN_DB = JSON.parse(JSON.stringify(window.SHARED_PINJAMAN));
const USERS_DATA = window.SHARED_USERS;

let DEPOSIT_SALDO = 4850000;

window.PPOB_TRANSACTIONS = [
  {id:'PP-20250425-001', waktu:'25 Apr 13:45', nama:'Riski Hariyanto', layanan:'Pulsa Telkomsel 50rb', nominal:50000, hargaJual:51000, status:'sukses'},
  {id:'PP-20250425-002', waktu:'25 Apr 11:20', nama:'Siti Rahayu', layanan:'Token PLN 50k', nominal:50000, hargaJual:50250, status:'sukses'},
  {id:'PP-20250424-015', waktu:'24 Apr 17:10', nama:'Ahmad Fauzi', layanan:'Paket Data 10GB', nominal:25000, hargaJual:27000, status:'sukses'},
  {id:'PP-20250424-014', waktu:'24 Apr 09:05', nama:'Dewi Lestari', layanan:'Pulsa XL 25rb', nominal:25000, hargaJual:25500, status:'sukses'}
];

window.PPOB_PRODUCTS = [
  {nama:'Pulsa Telkomsel 50rb', modal:49000, jual:51000, margin:2000},
  {nama:'Pulsa XL 25rb', modal:24000, jual:25500, margin:1500},
  {nama:'Token PLN 50k', modal:49750, jual:50250, margin:500},
  {nama:'Paket Data Telkomsel 10GB', modal:24000, jual:27000, margin:3000}
];

const SEC_TITLES = {
  'adm-home': 'Beranda',
  'adm-barang': 'Kelola Barang',
  'adm-pengguna': 'Kelola Pengguna',
  'adm-pinjaman': 'Approval Pinjaman',
  'adm-ppob': 'PPOB Overview',
  'adm-ppob-riwayat': 'Riwayat Transaksi PPOB',
  'adm-ppob-produk': 'Produk & Margin PPOB',
  'adm-ppob-deposit': 'Manajemen Deposit',
  'adm-laporan': 'Laporan'
};

const ACTIVITY_TEMPLATES = [
  { msg: '{nama} baru saja melakukan setoran sukarela Rp {amount}', icon: '💰' },
  { msg: 'Stok {produk} menipis (tersisa {stok} unit)', icon: '⚠️' },
  { msg: '{nama} mengajukan pinjaman Rp {amount}', icon: '📝' },
  { msg: 'Transaksi belanja #{trx} senilai Rp {amount} berhasil', icon: '🛒' },
  { msg: 'Cicilan #{cic} dari {nama} telah dibayarkan', icon: '✅' },
  { msg: 'Transaksi PPOB #{id} berhasil', icon: '📡' }
];
let activityInterval = null;

function startActivitySimulation() {
  activityInterval = setInterval(() => {
    const template = ACTIVITY_TEMPLATES[Math.floor(Math.random() * ACTIVITY_TEMPLATES.length)];
    const karyawan = USERS_DATA.filter(u => u.role === 'karyawan')[Math.floor(Math.random() * 4)];
    const produk = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    const msg = template.msg
      .replace('{nama}', karyawan.nama)
      .replace('{amount}', rp((Math.floor(Math.random() * 10) + 1) * 50000))
      .replace('{produk}', produk.nama)
      .replace('{stok}', Math.floor(Math.random() * 15) + 1)
      .replace('{trx}', String(Math.floor(Math.random() * 9000) + 1000))
      .replace('{cic}', String(Math.floor(Math.random() * 100) + 1))
      .replace('{id}', 'PP-' + Math.floor(Math.random() * 9000));
    showToast(template.icon + ' ' + msg, 'toast-info', 4000);
  }, (Math.random() * 30000) + 45000);
}

function init() {
  buildSidebarUser(USER);

  const greet = getGreeting();
  document.getElementById('admGreet').textContent = greet;
  document.getElementById('admName').textContent = USER.nama;

  renderAdminOverview();
  renderBarang(PRODUCTS);
  renderUsers();
  renderApproval();
  renderPPOBOverview();
  renderPPOBRiwayat();
  renderPPOBProduk();

  initCharts();

  document.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const s = a.getAttribute('data-sec');
      if (s) showSec(s, SEC_TITLES);
    });
  });

  document.getElementById('hamBtn').addEventListener('click', openSidebar);
  document.getElementById('sbClose').addEventListener('click', closeSidebar);
  document.getElementById('sbOverlay').addEventListener('click', closeSidebar);
  document.getElementById('logoutBtn').addEventListener('click', () => {
    clearInterval(activityInterval);
    logout();
  });

  document.getElementById('formBarang').addEventListener('submit', saveBarang);

  showSec('adm-home', SEC_TITLES);
  startActivitySimulation();
  initResetFeature(resetDemoData);
}

function resetDemoData() {
  PRODUCTS = JSON.parse(JSON.stringify(window.SHARED_PRODUCTS));
  PINJAMAN_DB = JSON.parse(JSON.stringify(window.SHARED_PINJAMAN));
  DEPOSIT_SALDO = 4850000;
  window.PPOB_TRANSACTIONS = [ /* data awal di atas */ ];
  renderAdminOverview();
  renderBarang(PRODUCTS);
  renderUsers();
  renderApproval();
  renderPPOBOverview();
  renderPPOBRiwayat();
  renderPPOBProduk();
  showToast('✅ Semua data demo direset!', 'toast-ok');
}

// === OVERVIEW ===
function renderAdminOverview() {
  const totalPinjam = PINJAMAN_DB.reduce((s, p) => s + p.nominal, 0);
  const aktif = PINJAMAN_DB.filter(p => p.status === 'active').length;
  const pending = PINJAMAN_DB.filter(p => p.status === 'pending').length;

  document.getElementById('adm-total-pinjam').textContent = rp(totalPinjam);
  document.getElementById('adm-aktif').textContent = aktif + ' pinjaman';
  document.getElementById('adm-pending').textContent = pending + ' menunggu';
  const pb = document.getElementById('admPendingBadge');
  if (pb) pb.textContent = pending;
}

// === CHARTS ===
function initCharts() {
  if (typeof Chart === 'undefined') return setTimeout(initCharts, 500);

  const ctxOmset = document.getElementById('chartOmset');
  if (ctxOmset && !ctxOmset._chartInited) {
    ctxOmset._chartInited = true;
    new Chart(ctxOmset, { type: 'line', data: { labels: ['Jan','Feb','Mar','Apr','Mei','Jun'], datasets: [{ label: 'Omset (juta)', data: [2.5,3.1,2.8,3.5,4.2,3.9], borderColor: '#16a34a', backgroundColor: 'rgba(22,163,74,0.1)', tension: 0.4, fill: true }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: val => 'Rp ' + val + 'M' } } } } });
  }

  const ctxPinjaman = document.getElementById('chartPinjaman');
  if (ctxPinjaman && !ctxPinjaman._chartInited) {
    ctxPinjaman._chartInited = true;
    const active = PINJAMAN_DB.filter(p => p.status === 'active').length;
    const pending = PINJAMAN_DB.filter(p => p.status === 'pending').length;
    const done = PINJAMAN_DB.filter(p => p.status === 'done').length;
    new Chart(ctxPinjaman, { type: 'doughnut', data: { labels: ['Aktif','Menunggu','Lunas'], datasets: [{ data: [active,pending,done], backgroundColor: ['#16a34a','#f59e0b','#3b82f6'] }] }, options: { responsive: true, plugins: { legend: { position: 'bottom' } } } });
  }
}

// === BARANG, USERS, APPROVAL, LAPORAN (fungsi lama tetap) ===
function renderBarang(list) { /* sama seperti file lama kamu */ }
function editBarang(kode) { /* sama seperti file lama kamu */ }
function closeBarangModal() { /* sama */ }
function saveBarang(e) { /* sama */ }
function renderUsers() { /* sama */ }
function renderApproval() { /* sama */ }
function handleApproval(id, action, btn) { /* sama */ }
function exportPDF(type) { /* sama */ }

// === PPOB FUNCTIONS ===
function renderPPOBOverview() {
  document.getElementById('deposit-saldo').textContent = rp(DEPOSIT_SALDO);
  document.getElementById('deposit-total').textContent = rp(DEPOSIT_SALDO);
  document.getElementById('trx-hari-ini').textContent = '28';
  document.getElementById('keuntungan-hari').textContent = rp(87500);

  const ctx = document.getElementById('chartPPOB');
  if (ctx && !ctx._chartInited) {
    ctx._chartInited = true;
    new Chart(ctx, { type: 'bar', data: { labels: ['19','20','21','22','23','24','25'], datasets: [{ label: 'Transaksi', data: [12,19,15,22,18,25,28], backgroundColor: '#16a34a' }] }, options: { responsive: true, plugins: { legend: { display: false } } } });
  }
}

function renderPPOBRiwayat() {
  const tbody = document.getElementById('tbodyPPOBRiwayat');
  tbody.innerHTML = window.PPOB_TRANSACTIONS.map(t => `<tr><td>${t.waktu}</td><td>${t.nama}</td><td>${t.layanan}</td><td>${rp(t.nominal)}</td><td>${rp(t.hargaJual)}</td><td><span class="badge badge-ok">Sukses</span></td></tr>`).join('');
}

function renderPPOBProduk() {
  const tbody = document.getElementById('tbodyPPOBProduk');
  tbody.innerHTML = window.PPOB_PRODUCTS.map((p, i) => `<tr><td>${p.nama}</td><td>${rp(p.modal)}</td><td>${rp(p.jual)}</td><td style="color:#16a34a;font-weight:700">${rp(p.margin)}</td><td><button class="btn-s btn-edit" onclick="editPPOBProduct(${i})">Edit</button></td></tr>`).join('');
}

window.topupDepositDemo = function() {
  const amount = prompt('Masukkan jumlah top-up deposit (Rp):', '5000000');
  if (amount && !isNaN(amount)) {
    DEPOSIT_SALDO += parseInt(amount);
    renderPPOBOverview();
    showToast(`✅ Deposit Rp ${parseInt(amount).toLocaleString('id-ID')} berhasil ditambahkan!`, 'toast-ok');
  }
};

window.editPPOBProduct = function(index) {
  const p = window.PPOB_PRODUCTS[index];
  const jualBaru = prompt(`Harga Jual baru untuk "${p.nama}" (sekarang ${rp(p.jual)}):`, p.jual);
  if (jualBaru && !isNaN(jualBaru)) {
    p.jual = parseInt(jualBaru);
    p.margin = p.jual - p.modal;
    renderPPOBProduk();
    showToast('✅ Margin diperbarui!', 'toast-ok');
  }
};

// === SIMULASI TRANSAKSI PPOB ===
let simulasiModalHTML = `
<div id="modalSimulasiPPOB" class="modal-overlay" style="display:none">
  <div class="modal-box" style="max-width:420px">
    <div class="modal-hd">
      <h3>🔄 Simulasi Transaksi PPOB</h3>
      <button class="modal-x" onclick="hidePPOBSimulasiModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="field-grp">
        <label>Pilih Layanan</label>
        <div class="field-box"><select id="simulasiLayanan" style="width:100%"></select></div>
      </div>
      <div class="field-grp">
        <label>Nama Anggota</label>
        <div class="field-box"><input type="text" id="simulasiNama" value="Riski Hariyanto"></div>
      </div>
      <div class="modal-ft">
        <button onclick="hidePPOBSimulasiModal()" class="btn-sec">Batal</button>
        <button onclick="prosesSimulasiPPOB()" class="btn-prim">Proses Transaksi</button>
      </div>
    </div>
  </div>
</div>`;

window.showPPOBSimulasiModal = function() {
  if (!document.getElementById('modalSimulasiPPOB')) document.body.insertAdjacentHTML('beforeend', simulasiModalHTML);
  const select = document.getElementById('simulasiLayanan');
  select.innerHTML = window.PPOB_PRODUCTS.map((p, i) => `<option value="${i}">${p.nama}</option>`).join('');
  document.getElementById('modalSimulasiPPOB').style.display = 'flex';
};

window.hidePPOBSimulasiModal = function() {
  const modal = document.getElementById('modalSimulasiPPOB');
  if (modal) modal.style.display = 'none';
};

window.prosesSimulasiPPOB = function() {
  const index = parseInt(document.getElementById('simulasiLayanan').value);
  const produk = window.PPOB_PRODUCTS[index];
  const nama = document.getElementById('simulasiNama').value || 'Anggota';

  DEPOSIT_SALDO -= produk.modal;

  const waktu = new Date().toLocaleString('id-ID', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'});
  window.PPOB_TRANSACTIONS.unshift({
    id: 'PP-' + Date.now().toString().slice(-6),
    waktu: waktu,
    nama: nama,
    layanan: produk.nama,
    nominal: produk.modal,
    hargaJual: produk.jual,
    status: 'sukses'
  });

  renderPPOBOverview();
  renderPPOBRiwayat();
  hidePPOBSimulasiModal();
  showToast(`✅ Simulasi ${produk.nama} berhasil!<br>Keuntungan +Rp ${produk.margin.toLocaleString('id-ID')}`, 'toast-ok');
};

// JALANKAN
init();
