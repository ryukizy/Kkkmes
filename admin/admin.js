// ============================================
//  ADMIN.JS — FULL + MOBILE BOTTOM NAV + TAMBAH BARANG & PENGGUNA
// ============================================

const USER = requireRole('admin');
if (!USER) throw new Error('Unauthorized');

let PRODUCTS = JSON.parse(JSON.stringify(window.SHARED_PRODUCTS));
let PINJAMAN_DB = JSON.parse(JSON.stringify(window.SHARED_PINJAMAN));
const USERS_DATA = window.SHARED_USERS;

let DEPOSIT_SALDO = 4850000;
window.PPOB_TRANSACTIONS = [/* data PPOB seperti sebelumnya */];
window.PPOB_PRODUCTS = [/* data produk PPOB seperti sebelumnya */];

const SEC_TITLES = { /* sama seperti sebelumnya */ };

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

  // Navigation (sidebar + bottom nav)
  document.querySelectorAll('.nav-link, .bottom-nav-mobile a').forEach(a => {
    a.addEventListener('click', e => {
      const s = a.getAttribute('data-sec') || a.getAttribute('onclick').match(/'([^']+)'/)[1];
      if (s) showSec(s, SEC_TITLES);
    });
  });

  // Event listeners lainnya (hamBtn, logout, formBarang, dll)
  document.getElementById('hamBtn').addEventListener('click', openSidebar);
  document.getElementById('sbClose').addEventListener('click', closeSidebar);
  document.getElementById('sbOverlay').addEventListener('click', closeSidebar);
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('formBarang').addEventListener('submit', saveBarang);
  document.getElementById('formTambahBarang').addEventListener('submit', tambahBarangBaru);
  document.getElementById('formTambahPengguna').addEventListener('submit', tambahPenggunaBaru);

  showSec('adm-home', SEC_TITLES);
  startActivitySimulation();
  initResetFeature(resetDemoData);
}

// === KELOLA BARANG (TAMBAH BARU) ===
function renderBarang(list) {
  const b = document.getElementById('tbodyBarang');
  b.innerHTML = list.map((p, i) => `<tr><td>\( {i+1}</td><td> \){p.emo} \( {p.nama}</td><td> \){p.kat}</td><td>\( {rp(p.harga)}</td><td> \){p.stok}</td><td><button class="btn-s btn-edit" onclick="editBarang('${p.kode}')">Edit</button></td></tr>`).join('');
}

function showTambahBarangModal() {
  document.getElementById('modalTambahBarang').style.display = 'flex';
}
function hideTambahBarangModal() {
  document.getElementById('modalTambahBarang').style.display = 'none';
}
function tambahBarangBaru(e) {
  e.preventDefault();
  const nama = document.getElementById('newBrgNama').value;
  const kat = document.getElementById('newBrgKat').value;
  const harga = parseInt(document.getElementById('newBrgHarga').value);
  const stok = parseInt(document.getElementById('newBrgStok').value);
  
  PRODUCTS.push({kode: 'BRG' + Date.now().toString().slice(-4), nama, kat, harga, stok, emo: '📦'});
  renderBarang(PRODUCTS);
  hideTambahBarangModal();
  showToast('✅ Barang baru berhasil ditambahkan!', 'toast-ok');
}

// === KELOLA PENGGUNA (TAMBAH BARU) ===
function renderUsers() {
  const b = document.getElementById('tbUsers');
  b.innerHTML = USERS_DATA.map((u, i) => `<tr><td>\( {i+1}</td><td> \){u.nik}</td><td>\( {u.nama}</td><td> \){u.dept}</td><td><span class="badge \( {u.role==='admin'?'badge-primary':'badge-ok'}"> \){u.role}</span></td><td><span class="badge \( {u.status==='aktif'?'badge-ok':'badge-muted'}"> \){u.status}</span></td><td><button onclick="toggleStatus('${u.nik}')" class="btn-s">Ubah Status</button></td></tr>`).join('');
}

function showTambahPenggunaModal() {
  document.getElementById('modalTambahPengguna').style.display = 'flex';
}
function hideTambahPenggunaModal() {
  document.getElementById('modalTambahPengguna').style.display = 'none';
}
function tambahPenggunaBaru(e) {
  e.preventDefault();
  const nik = document.getElementById('newUserNik').value;
  const nama = document.getElementById('newUserNama').value;
  const dept = document.getElementById('newUserDept').value;
  const role = document.getElementById('newUserRole').value;
  
  USERS_DATA.unshift({nik, nama, dept, role, status: 'aktif'});
  renderUsers();
  hideTambahPenggunaModal();
  showToast('✅ Pengguna baru berhasil ditambahkan!', 'toast-ok');
}

window.toggleStatus = function(nik) {
  const user = USERS_DATA.find(u => u.nik === nik);
  if (user) {
    user.status = user.status === 'aktif' ? 'nonaktif' : 'aktif';
    renderUsers();
    showToast('Status diperbarui', 'toast-ok');
  }
};

// === PPOB, CHARTS, SIMULASI, dll. (sama seperti kode sebelumnya) ===
/* ... (semua fungsi renderPPOBOverview, renderPPOBRiwayat, showPPOBSimulasiModal, dll tetap sama) ... */

init();
