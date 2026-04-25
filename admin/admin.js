// ============================================
//  ADMIN.JS — KopKar MES (dengan PPOB Module)
// ============================================

// Auth guard
const USER = requireRole('admin');
if (!USER) throw new Error('Unauthorized');

// State
let PRODUCTS = JSON.parse(JSON.stringify(window.SHARED_PRODUCTS));
let PINJAMAN_DB = JSON.parse(JSON.stringify(window.SHARED_PINJAMAN));
const USERS_DATA = window.SHARED_USERS;

// PPOB Mock Data
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
  {nama:'Paket Data Telkomsel 10GB', modal:24000, jual:27000, margin:3000},
];

// Section titles
const SEC_TITLES = {
  'adm-home': 'Beranda',
  'adm-barang': 'Kelola Barang',
  'adm-pengguna': 'Kelola Pengguna',
  'adm-pinjaman': 'Approval Pinjaman',
  'adm-ppob': 'PPOB Overview',
  'adm-ppob-riwayat': 'Riwayat Transaksi PPOB',
  'adm-ppob-produk': 'Produk & Margin PPOB',
  'adm-ppob-deposit': 'Manajemen Deposit',
  'adm-laporan': 'Laporan',
};

// Activity simulation
const ACTIVITY_TEMPLATES = [ /* ... sama seperti sebelumnya ... */ ];
let activityInterval = null;

function startActivitySimulation() {
  activityInterval = setInterval(() => {
    // ... (kode simulasi activity tetap sama) ...
    showToast('📡 Transaksi PPOB baru masuk!', 'toast-info', 3500);
  }, 45000);
}

// INIT
function init() {
  buildSidebarUser(USER);

  const greet = getGreeting();
  document.getElementById('admGreet').textContent = greet;
  document.getElementById('admName').textContent = USER.nama;

  // Render semua
  renderAdminOverview();
  renderBarang(PRODUCTS);
  renderUsers();
  renderApproval();
  renderPPOBOverview();
  renderPPOBRiwayat();
  renderPPOBProduk();

  initCharts();

  // Navigation
  document.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const s = a.getAttribute('data-sec');
      if (s) showSec(s, SEC_TITLES);
    });
  });

  // Event listeners
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

// PPOB RENDER FUNCTIONS
function renderPPOBOverview() {
  document.getElementById('deposit-saldo').textContent = rp(DEPOSIT_SALDO);
  document.getElementById('deposit-total').textContent = rp(DEPOSIT_SALDO);
  document.getElementById('trx-hari-ini').textContent = '28';
  document.getElementById('keuntungan-hari').textContent = rp(87500);

  // Chart PPOB
  const ctx = document.getElementById('chartPPOB');
  if (ctx && !ctx._chartInited) {
    ctx._chartInited = true;
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['19', '20', '21', '22', '23', '24', '25'],
        datasets: [{
          label: 'Transaksi',
          data: [12, 19, 15, 22, 18, 25, 28],
          backgroundColor: '#16a34a',
          borderColor: '#15803d',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }
}

function renderPPOBRiwayat() {
  const tbody = document.getElementById('tbodyPPOBRiwayat');
  tbody.innerHTML = window.PPOB_TRANSACTIONS.map(t => `
    <tr>
      <td>${t.waktu}</td>
      <td>${t.nama}</td>
      <td>${t.layanan}</td>
      <td>${rp(t.nominal)}</td>
      <td>${rp(t.hargaJual)}</td>
      <td><span class="badge badge-ok">Sukses</span></td>
    </tr>
  `).join('');
}

function renderPPOBProduk() {
  const tbody = document.getElementById('tbodyPPOBProduk');
  tbody.innerHTML = window.PPOB_PRODUCTS.map((p, i) => `
    <tr>
      <td>${p.nama}</td>
      <td>${rp(p.modal)}</td>
      <td>${rp(p.jual)}</td>
      <td style="color:#16a34a; font-weight:700;">${rp(p.margin)}</td>
      <td><button class="btn-s btn-edit" onclick="editPPOBProduct('${i}')">Edit</button></td>
    </tr>
  `).join('');
}

window.topupDepositDemo = function() {
  const amount = prompt('Masukkan jumlah top-up deposit (dalam Rupiah):', '5000000');
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

// Fungsi-fungsi lama (renderAdminOverview, renderBarang, renderUsers, renderApproval, initCharts, saveBarang, dll) tetap sama seperti file admin.js lama kamu
// (Saya tidak ulang di sini agar tidak terlalu panjang, tapi kamu bisa copy dari file lama kamu dan tetap pakai)

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

// Jalankan
init();
