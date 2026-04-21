// ============================================
//  ADMIN.JS v3 — KopKar MES
//  Admin-only logic: Barang, Pengguna, Approval, Laporan, Charts
// ============================================

// ─── Auth guard ───
const USER = requireRole('admin');
if (!USER) throw new Error('Unauthorized');

// ─── State from shared data (deep copy for mutation) ───
let PRODUCTS   = JSON.parse(JSON.stringify(window.SHARED_PRODUCTS));
let PINJAMAN_DB = JSON.parse(JSON.stringify(window.SHARED_PINJAMAN));
const USERS_DATA = window.SHARED_USERS;

// ─── Section titles ───
const SEC_TITLES = {
  'adm-home':     'Beranda',
  'adm-barang':   'Kelola Barang',
  'adm-pengguna': 'Kelola Pengguna',
  'adm-pinjaman': 'Approval Pinjaman',
  'adm-laporan':  'Laporan',
};

// ─── Real-time activity simulation ───
const ACTIVITY_TEMPLATES = [
  { msg: '{nama} baru saja melakukan setoran sukarela Rp {amount}', icon: '💰' },
  { msg: 'Stok {produk} menipis (tersisa {stok} unit)', icon: '⚠️' },
  { msg: '{nama} mengajukan pinjaman Rp {amount}', icon: '📝' },
  { msg: 'Transaksi belanja #{trx} senilai Rp {amount} berhasil', icon: '🛒' },
  { msg: 'Cicilan #{cic} dari {nama} telah dibayarkan', icon: '✅' },
];
let activityInterval = null;

function startActivitySimulation() {
  activityInterval = setInterval(() => {
    const template  = ACTIVITY_TEMPLATES[Math.floor(Math.random() * ACTIVITY_TEMPLATES.length)];
    const karyawan  = USERS_DATA.filter(u => u.role === 'karyawan')[Math.floor(Math.random() * 4)];
    const produk    = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    const msg = template.msg
      .replace('{nama}',   karyawan.nama)
      .replace('{amount}', rp((Math.floor(Math.random() * 10) + 1) * 50000))
      .replace('{produk}', produk.nama)
      .replace('{stok}',   Math.floor(Math.random() * 15) + 1)
      .replace('{trx}',    String(Math.floor(Math.random() * 9000) + 1000))
      .replace('{cic}',    String(Math.floor(Math.random() * 100) + 1));
    showToast(template.icon + ' ' + msg, 'toast-info', 4000);
  }, (Math.random() * 30000) + 45000);
}

// ─── INIT ───
function init() {
  buildSidebarUser(USER);

  const greet = getGreeting();
  const gEl = document.getElementById('admGreet');
  const nEl = document.getElementById('admName');
  if (gEl) gEl.textContent = greet;
  if (nEl) nEl.textContent  = USER.nama;

  // Render all admin data
  renderAdminOverview();
  renderBarang(PRODUCTS);
  renderUsers();
  renderApproval();
  initCharts();

  // Nav links
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

// ─── Reset demo ───
function resetDemoData() {
  PRODUCTS    = JSON.parse(JSON.stringify(window.SHARED_PRODUCTS));
  PINJAMAN_DB = JSON.parse(JSON.stringify(window.SHARED_PINJAMAN));
  renderAdminOverview();
  renderBarang(PRODUCTS);
  renderUsers();
  renderApproval();
}

// ─── OVERVIEW ───
function renderAdminOverview() {
  const totalPinjam = PINJAMAN_DB.reduce((s, p) => s + p.nominal, 0);
  const aktif       = PINJAMAN_DB.filter(p => p.status === 'active').length;
  const pending     = PINJAMAN_DB.filter(p => p.status === 'pending').length;

  const tp = document.getElementById('adm-total-pinjam');
  const ak = document.getElementById('adm-aktif');
  const pe = document.getElementById('adm-pending');
  const pb = document.getElementById('admPendingBadge');
  if (tp) tp.textContent = rp(totalPinjam);
  if (ak) ak.textContent = aktif + ' pinjaman';
  if (pe) pe.textContent = pending + ' menunggu';
  if (pb) pb.textContent = pending;
}

// ─── CHARTS (Chart.js) ───
function initCharts() {
  if (typeof Chart === 'undefined') {
    // Retry once Chart.js loads
    setTimeout(initCharts, 500);
    return;
  }

  // Tren Omset Bulanan
  const ctxOmset = document.getElementById('chartOmset');
  if (ctxOmset && !ctxOmset._chartInited) {
    ctxOmset._chartInited = true;
    new Chart(ctxOmset, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
        datasets: [{
          label: 'Omset (juta)',
          data: [2.5, 3.1, 2.8, 3.5, 4.2, 3.9],
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22, 163, 74, 0.1)',
          tension: 0.4, fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { callback: val => 'Rp ' + val + 'M' } } }
      }
    });
  }

  // Distribusi Status Pinjaman
  const ctxPinjaman = document.getElementById('chartPinjaman');
  if (ctxPinjaman && !ctxPinjaman._chartInited) {
    ctxPinjaman._chartInited = true;
    const active  = PINJAMAN_DB.filter(p => p.status === 'active').length;
    const pending = PINJAMAN_DB.filter(p => p.status === 'pending').length;
    const done    = PINJAMAN_DB.filter(p => p.status === 'done').length;
    new Chart(ctxPinjaman, {
      type: 'doughnut',
      data: {
        labels: ['Aktif', 'Menunggu', 'Lunas'],
        datasets: [{ data: [active, pending, done], backgroundColor: ['#16a34a', '#f59e0b', '#3b82f6'] }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
  }
}

// ─── BARANG ───
function renderBarang(list) {
  const b = document.getElementById('tbodyBarang');
  if (!b) return;
  b.innerHTML = list.map((p, i) => `<tr>
    <td>${i + 1}</td>
    <td>${p.emo} ${p.nama}</td>
    <td>${p.kat}</td>
    <td>${rp(p.harga)}</td>
    <td>${p.stok === 0 ? '<span class="badge badge-err">Habis</span>' : p.stok}</td>
    <td><button class="btn-s btn-edit" onclick="editBarang('${p.kode}')">Edit</button></td>
  </tr>`).join('');
}

function editBarang(kode) {
  const p = PRODUCTS.find(x => x.kode === kode);
  if (!p) return;
  document.getElementById('brgKode').value  = p.kode;
  document.getElementById('brgNama').value  = p.nama;
  document.getElementById('brgKat').value   = p.kat;
  document.getElementById('brgHarga').value = p.harga;
  document.getElementById('brgStok').value  = p.stok;
  document.getElementById('modalBarang').classList.add('show');
}

function closeBarangModal() {
  document.getElementById('modalBarang').classList.remove('show');
  document.getElementById('formBarang').reset();
}

function saveBarang(e) {
  e.preventDefault();
  const kode = document.getElementById('brgKode').value;
  const p = PRODUCTS.find(x => x.kode === kode);
  if (p) {
    p.nama  = document.getElementById('brgNama').value;
    p.kat   = document.getElementById('brgKat').value;
    p.harga = parseInt(document.getElementById('brgHarga').value);
    p.stok  = parseInt(document.getElementById('brgStok').value);
  }
  renderBarang(PRODUCTS);
  closeBarangModal();
  showToast('Barang berhasil diupdate ✓', 'toast-ok');
}

// ─── PENGGUNA ───
function renderUsers() {
  const b = document.getElementById('tbUsers');
  if (!b) return;
  b.innerHTML = USERS_DATA.map((u, i) => `<tr>
    <td>${i + 1}</td>
    <td>${u.nik}</td>
    <td>${u.nama}</td>
    <td>${u.dept}</td>
    <td><span class="badge ${u.role === 'admin' ? 'badge-primary' : 'badge-ok'}">${u.role}</span></td>
    <td><span class="badge ${u.status === 'aktif' ? 'badge-ok' : 'badge-muted'}">${u.status}</span></td>
  </tr>`).join('');
}

// ─── APPROVAL PINJAMAN ───
function renderApproval() {
  const cont = document.getElementById('approvalList');
  if (!cont) return;
  const pending = PINJAMAN_DB.filter(p => p.status === 'pending' || p.status === 'approved');
  if (!pending.length) {
    cont.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted)">Tidak ada pengajuan menunggu.</div>';
    return;
  }
  cont.innerHTML = pending.map(p => {
    const u = USERS_DATA.find(x => x.nik === p.nik);
    return `
      <div class="appr-card">
        <div class="appr-head">
          <div style="flex:1">
            <div class="appr-id">${p.id}</div>
            <div class="appr-nama">${p.nama} <span class="appr-dept">(${u ? u.dept : 'N/A'})</span></div>
          </div>
          <span class="badge ${p.status === 'approved' ? 'badge-ok' : 'badge-pending'}">
            ${p.status === 'approved' ? 'Disetujui' : 'Menunggu'}
          </span>
        </div>
        <div class="appr-body">
          <div class="appr-row"><span>Tujuan</span><strong>${p.tujuan}</strong></div>
          <div class="appr-row"><span>Nominal</span><strong>${rp(p.nominal)}</strong></div>
          <div class="appr-row"><span>Tenor</span><strong>${p.tenor} bulan</strong></div>
          <div class="appr-row"><span>Cicilan/bulan</span><strong>${rp(p.cicilan)}</strong></div>
          <div class="appr-row"><span>Tanggal Pengajuan</span><strong>${p.tgl}</strong></div>
        </div>
        ${p.status === 'pending' ? `
        <div class="appr-foot">
          <button class="btn-appr-reject" onclick="handleApproval('${p.id}','reject')">Tolak</button>
          <button class="btn-appr-ok" onclick="handleApproval('${p.id}','approve',this)">
            <span class="appr-btn-label">Setujui Pinjaman</span>
            <span class="appr-btn-spin" style="display:none">
              <svg class="spin-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:20px;height:20px">
                <circle cx="12" cy="12" r="10" stroke-opacity="0.2"/>
                <path d="M12 2a10 10 0 0110 10" class="sp"/>
              </svg>
            </span>
          </button>
        </div>` : '<div class="appr-foot" style="justify-content:center;padding:12px;color:var(--success)">✓ Pinjaman telah disetujui</div>'}
      </div>
    `;
  }).join('');
}

function handleApproval(id, action, btn) {
  const p = PINJAMAN_DB.find(x => x.id === id);
  if (!p) return;

  if (btn && action === 'approve') {
    const label = btn.querySelector('.appr-btn-label');
    const spin  = btn.querySelector('.appr-btn-spin');
    if (label) label.style.display = 'none';
    if (spin)  spin.style.display  = 'flex';
    btn.disabled = true;
    setTimeout(() => {
      p.status = 'approved';
      renderApproval();
      renderAdminOverview();
      showToast(`✓ Pinjaman ${id} disetujui`, 'toast-ok');
    }, 800);
  } else {
    p.status = action === 'approve' ? 'approved' : 'rejected';
    renderApproval();
    renderAdminOverview();
    showToast(
      action === 'approve' ? `✓ Pinjaman ${id} disetujui` : `Pinjaman ${id} ditolak`,
      action === 'approve' ? 'toast-ok' : 'toast-err'
    );
  }
}

// ─── LAPORAN ───
function exportPDF(type) {
  showToast('⏳ Menyiapkan laporan...', 'toast-info');
  setTimeout(() => {
    const name = type === 'admin' ? 'Laporan_Admin_KopKar.pdf' : 'Struk_Transaksi.pdf';
    showToast('✅ ' + name + ' siap diunduh!', 'toast-ok');
  }, 1200);
}

// ─── START ───
init();
