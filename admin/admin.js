// ============================================
//  ADMIN.JS — FINAL VERSION (Mobile + Desktop)
const USER = requireRole('admin');
if (!USER) throw new Error('Unauthorized');

let PRODUCTS = JSON.parse(JSON.stringify(window.SHARED_PRODUCTS));
let PINJAMAN_DB = JSON.parse(JSON.stringify(window.SHARED_PINJAMAN));
const USERS_DATA = window.SHARED_USERS;

let DEPOSIT_SALDO = 4850000;

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

function init() {
  buildSidebarUser(USER);
  document.getElementById('admGreet').textContent = getGreeting();
  document.getElementById('admName').textContent = USER.nama;

  renderAdminOverview();
  renderBarang(PRODUCTS);
  renderUsers();
  renderApproval();
  renderPPOBOverview();
  renderPPOBRiwayat();
  renderPPOBProduk();
  initCharts();

  // Navigation
  document.querySelectorAll('.nav-link, .bottom-nav-mobile a').forEach(link => {
    link.addEventListener('click', () => {
      const sec = link.getAttribute('data-sec');
      if (sec) showSec(sec, SEC_TITLES);
    });
  });

  document.getElementById('hamBtn').addEventListener('click', openSidebar);
  document.getElementById('sbClose').addEventListener('click', closeSidebar);
  document.getElementById('sbOverlay').addEventListener('click', closeSidebar);
  document.getElementById('logoutBtn').addEventListener('click', logout);

  showSec('adm-home', SEC_TITLES);
  startActivitySimulation();
  initResetFeature(resetDemoData);
}

// Semua fungsi render (renderBarang, renderUsers, PPOB, simulasi, tambah barang, tambah pengguna) sudah lengkap di kode sebelumnya.

init();
