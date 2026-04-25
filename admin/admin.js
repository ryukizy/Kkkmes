// ============================================================
//  ADMIN.JS — KopKar MES Admin Panel
//  Implementasi lengkap semua fungsi render dan interaksi
// ============================================================

const USER = requireRole('admin');
if (!USER) throw new Error('Unauthorized');

// ── Data (deep-copy agar tidak mutate shared state) ──
let PRODUCTS    = JSON.parse(JSON.stringify(window.SHARED_PRODUCTS  || []));
let PINJAMAN_DB = JSON.parse(JSON.stringify(window.SHARED_PINJAMAN  || []));
const USERS_DATA   = window.SHARED_USERS   || [];
const SIMPANAN_DB  = window.SHARED_SIMPANAN || {};
const PPOB_TRX     = window.SHARED_PPOB_TRX || window.PPOB_TRX || [];
const PPOB_PRODUCTS = window.PPOB_PRODUCTS  || [];

let DEPOSIT_SALDO = 4850000;

// ── Judul per section (dipakai showSec) ──
const SEC_TITLES = {
  'adm-home'         : 'Beranda',
  'adm-barang'       : 'Kelola Barang',
  'adm-pengguna'     : 'Kelola Pengguna',
  'adm-pinjaman'     : 'Approval Pinjaman',
  'adm-ppob'         : 'PPOB Overview',
  'adm-ppob-riwayat' : 'Riwayat Transaksi PPOB',
  'adm-ppob-produk'  : 'Produk & Margin PPOB',
  'adm-ppob-deposit' : 'Manajemen Deposit',
  'adm-laporan'      : 'Laporan',
};

// ── Helper ──
const $  = id => document.getElementById(id);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; };
function setEl(id, val) { const e = $(id); if (e) e.textContent = val; }
function setHTML(id, html) { const e = $(id); if (e) e.innerHTML = html; }

// ── SVG ICONS ──
const ICO = {
  user   : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" width="18" height="18"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`,
  box    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" width="18" height="18"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>`,
  money  : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" width="18" height="18"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>`,
  chart  : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" width="18" height="18"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  file   : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" width="18" height="18"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  check  : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>`,
  x      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  edit   : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="13" height="13"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash  : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="13" height="13"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>`,
  down   : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
};

// ============================================================
//  INIT
// ============================================================
function init() {
  // Sidebar user info
  buildSidebarUser(USER);
  setEl('admGreet', getGreeting() + ',');
  setEl('admName',  USER.nama);

  // Render semua section
  renderAdminOverview();
  renderBarang(PRODUCTS);
  renderUsers();
  renderApproval();
  renderPPOBOverview();
  renderPPOBRiwayat();
  renderPPOBProduk();
  renderDeposit();
  renderLaporan();
  initCharts();

  // ── Navigasi sidebar & bottom nav ──
  document.querySelectorAll('.nav-link[data-sec], .bottom-nav-mobile [data-sec]').forEach(link => {
    link.addEventListener('click', () => {
      const sec = link.dataset.sec;
      if (sec) _showSec(sec);
    });
  });

  // Hamburger, sidebar overlay, logout
  const hamBtn   = $('hamBtn');
  const sbClose  = $('sbClose');
  const sbOv     = $('sbOverlay');
  const logoutB  = $('logoutBtn');
  if (hamBtn)  hamBtn.addEventListener('click',  openSidebar);
  if (sbClose) sbClose.addEventListener('click', closeSidebar);
  if (sbOv)    sbOv.addEventListener('click',    closeSidebar);
  if (logoutB) logoutB.addEventListener('click', logout);

  _showSec('adm-home');
  startActivitySimulation();
}

function _showSec(id) {
  showSec(id, SEC_TITLES);
  // Sync bottom nav active state
  document.querySelectorAll('.bottom-nav-mobile .bn-item').forEach(a => {
    a.classList.toggle('active', a.dataset.sec === id);
  });
  // Sync sidebar nav-link active
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.sec === id);
  });
}

// ============================================================
//  ADM-HOME — KPI Overview
// ============================================================
function renderAdminOverview() {
  // Hitung KPI dari data shared
  const totalAnggota  = USERS_DATA.filter(u => u.role === 'karyawan').length;
  const totalProduk   = PRODUCTS.length;
  const pinPending    = PINJAMAN_DB.filter(p => p.status === 'pending').length;
  const totalPinjaman = PINJAMAN_DB.filter(p => p.status === 'active')
                          .reduce((s, p) => s + p.nominal, 0);

  // Jumlah simpanan total semua anggota
  const totalSimpanan = Object.values(SIMPANAN_DB)
                          .reduce((s, v) => s + (v.total || 0), 0);

  // Revenue PPOB bulan ini (estimasi)
  const ppobRev = PPOB_TRX.reduce((s, t) => s + (t.margin || t.fee || 0), 0) || 1_250_000;

  const kpiGrid = $('kpiGrid');
  if (!kpiGrid) return;

  kpiGrid.innerHTML = `
    <div class="kpi-card">
      <div class="kpi-ico green">${ICO.user}</div>
      <div class="kpi-val">${totalAnggota}</div>
      <div class="kpi-lbl">Total Anggota</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-ico blue">${ICO.money}</div>
      <div class="kpi-val">${rp(totalSimpanan)}</div>
      <div class="kpi-lbl">Total Simpanan</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-ico orange">${ICO.file}</div>
      <div class="kpi-val">${rp(totalPinjaman)}</div>
      <div class="kpi-lbl">Pinjaman Aktif</div>
    </div>
    <div class="kpi-card" style="cursor:pointer" onclick="_showSec('adm-pinjaman')">
      <div class="kpi-ico purple">${ICO.chart}</div>
      <div class="kpi-val" style="color:var(--danger)">${pinPending}</div>
      <div class="kpi-lbl">Menunggu Approval</div>
    </div>
  `;

  // Recent activity feed
  renderActivityFeed();
}

// ── Activity Feed ──
function renderActivityFeed() {
  const el = $('activityFeed');
  if (!el) return;

  const pending = PINJAMAN_DB.filter(p => p.status === 'pending');
  const items = [
    ...pending.map(p => ({
      dot  : 'warn',
      text : `<strong>${_namaByNik(p.nik)}</strong> mengajukan pinjaman ${rp(p.nominal)}`,
      time : 'Baru',
    })),
    { dot: '', text: `<strong>${USERS_DATA.length}</strong> anggota terdaftar aktif`, time: 'Hari ini' },
    { dot: 'blue', text: `Saldo deposit PPOB: <strong>${rp(DEPOSIT_SALDO)}</strong>`, time: 'Live' },
    { dot: '', text: `Total produk katalog: <strong>${PRODUCTS.length} item</strong>`, time: 'Update' },
  ].slice(0, 6);

  el.innerHTML = items.map(i => `
    <div class="activity-item">
      <div class="activity-dot${i.dot ? ' activity-dot--' + i.dot : ''}"></div>
      <div class="activity-text">${i.text}</div>
      <div class="activity-time">${i.time}</div>
    </div>`).join('');
}

function _namaByNik(nik) {
  const u = USERS_DATA.find(u => u.nik === nik);
  return u ? u.nama : nik;
}

// ============================================================
//  KELOLA BARANG
// ============================================================
function renderBarang(list) {
  const tbody = $('tbodyBarang');
  if (!tbody) return;
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--muted)">Tidak ada produk.</td></tr>';
    return;
  }
  tbody.innerHTML = list.map((p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${p.nama}</strong></td>
      <td><span class="badge badge-info">${p.kategori || '-'}</span></td>
      <td>${rp(p.harga)}</td>
      <td>${p.stok ?? p.stock ?? '-'}</td>
      <td style="display:flex;gap:6px">
        <button class="btn-s btn-edit" onclick="editBarang(${p.id})">${ICO.edit} Edit</button>
        <button class="btn-s btn-del"  onclick="hapusBarang(${p.id})">${ICO.trash} Hapus</button>
      </td>
    </tr>`).join('');
}

function showTambahBarangModal() {
  showModal('modalBarang', `
    <div class="modal-hd">
      <h3>Tambah Barang</h3>
      <button class="modal-x" onclick="closeModal('modalBarang')">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-row-2">
        <div class="field-grp"><label>Nama Barang</label><input id="bNama" placeholder="Contoh: Minyak Goreng 1L"/></div>
        <div class="field-grp"><label>Kategori</label>
          <select id="bKat"><option>Sembako</option><option>Minuman</option><option>ATK</option><option>Elektronik</option><option>Lainnya</option></select>
        </div>
      </div>
      <div class="form-row-2">
        <div class="field-grp"><label>Harga (Rp)</label><input id="bHarga" type="number" min="0" placeholder="15000"/></div>
        <div class="field-grp"><label>Stok</label><input id="bStok" type="number" min="0" placeholder="50"/></div>
      </div>
      <div class="field-grp"><label>Deskripsi</label><textarea id="bDesc" rows="2" placeholder="Opsional"></textarea></div>
      <div class="modal-ft">
        <button class="btn-sec" onclick="closeModal('modalBarang')">Batal</button>
        <button class="btn-prim" onclick="simpanBarang()">Simpan</button>
      </div>
    </div>
  `);
}

function simpanBarang() {
  const nama  = $('bNama')?.value.trim();
  const harga = parseInt($('bHarga')?.value || '0');
  const stok  = parseInt($('bStok')?.value  || '0');
  const kat   = $('bKat')?.value || 'Lainnya';
  const desc  = $('bDesc')?.value.trim() || '';

  if (!nama || !harga) { showToast('⚠️ Nama dan harga wajib diisi', 'toast-err'); return; }

  const newId = Math.max(0, ...PRODUCTS.map(p => p.id)) + 1;
  PRODUCTS.push({ id: newId, nama, harga, stok, kategori: kat, deskripsi: desc });
  renderBarang(PRODUCTS);
  closeModal('modalBarang');
  showToast('✅ Barang berhasil ditambahkan');
}

function editBarang(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  showModal('modalBarang', `
    <div class="modal-hd">
      <h3>Edit Barang</h3>
      <button class="modal-x" onclick="closeModal('modalBarang')">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-row-2">
        <div class="field-grp"><label>Nama Barang</label><input id="bNama" value="${p.nama}"/></div>
        <div class="field-grp"><label>Kategori</label>
          <select id="bKat">
            ${['Sembako','Minuman','ATK','Elektronik','Lainnya'].map(k => `<option${k===p.kategori?' selected':''}>${k}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row-2">
        <div class="field-grp"><label>Harga (Rp)</label><input id="bHarga" type="number" value="${p.harga}"/></div>
        <div class="field-grp"><label>Stok</label><input id="bStok" type="number" value="${p.stok ?? p.stock ?? 0}"/></div>
      </div>
      <div class="modal-ft">
        <button class="btn-sec" onclick="closeModal('modalBarang')">Batal</button>
        <button class="btn-prim" onclick="updateBarang(${id})">Simpan Perubahan</button>
      </div>
    </div>
  `);
}

function updateBarang(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  p.nama     = $('bNama')?.value.trim() || p.nama;
  p.harga    = parseInt($('bHarga')?.value || p.harga);
  p.stok     = parseInt($('bStok')?.value  || p.stok);
  p.kategori = $('bKat')?.value || p.kategori;
  renderBarang(PRODUCTS);
  closeModal('modalBarang');
  showToast('✅ Barang berhasil diperbarui');
}

function hapusBarang(id) {
  if (!confirm('Hapus barang ini?')) return;
  PRODUCTS = PRODUCTS.filter(p => p.id !== id);
  renderBarang(PRODUCTS);
  showToast('🗑️ Barang dihapus');
}

// ============================================================
//  KELOLA PENGGUNA
// ============================================================
function renderUsers() {
  const tbody = $('tbUsers');
  if (!tbody) return;
  if (!USERS_DATA.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--muted)">Tidak ada data pengguna.</td></tr>';
    return;
  }
  tbody.innerHTML = USERS_DATA.map((u, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><code style="font-size:.75rem;background:var(--bg);padding:2px 6px;border-radius:6px">${u.nik}</code></td>
      <td><strong>${u.nama}</strong></td>
      <td>${u.dept || '-'}</td>
      <td><span class="badge ${u.role === 'admin' ? 'badge-warn' : 'badge-ok'}">${u.role}</span></td>
      <td><span class="badge badge-ok">Aktif</span></td>
      <td>
        <button class="btn-s btn-edit" onclick="editUser('${u.nik}')">${ICO.edit} Edit</button>
      </td>
    </tr>`).join('');
}

function showTambahPenggunaModal() {
  showModal('modalPengguna', `
    <div class="modal-hd">
      <h3>Tambah Pengguna</h3>
      <button class="modal-x" onclick="closeModal('modalPengguna')">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-row-2">
        <div class="field-grp"><label>NIK</label><input id="uNik" placeholder="10 digit NIK"/></div>
        <div class="field-grp"><label>Nama Lengkap</label><input id="uNama" placeholder="Nama Karyawan"/></div>
      </div>
      <div class="form-row-2">
        <div class="field-grp"><label>Departemen</label><input id="uDept" placeholder="IT, Finance, dst"/></div>
        <div class="field-grp"><label>Role</label>
          <select id="uRole"><option value="karyawan">Karyawan</option><option value="admin">Admin</option></select>
        </div>
      </div>
      <div class="field-grp"><label>Password</label><input id="uPass" type="password" placeholder="Min 6 karakter"/></div>
      <div class="modal-ft">
        <button class="btn-sec" onclick="closeModal('modalPengguna')">Batal</button>
        <button class="btn-prim" onclick="simpanPengguna()">Simpan</button>
      </div>
    </div>
  `);
}

function simpanPengguna() {
  const nik  = $('uNik')?.value.trim();
  const nama = $('uNama')?.value.trim();
  if (!nik || !nama) { showToast('⚠️ NIK dan nama wajib diisi', 'toast-err'); return; }
  if (USERS_DATA.find(u => u.nik === nik)) { showToast('⚠️ NIK sudah terdaftar', 'toast-err'); return; }
  USERS_DATA.push({ nik, nama, dept: $('uDept')?.value || '-', role: $('uRole')?.value || 'karyawan' });
  renderUsers();
  closeModal('modalPengguna');
  showToast('✅ Pengguna berhasil ditambahkan');
}

function editUser(nik) {
  const u = USERS_DATA.find(x => x.nik === nik);
  if (!u) return;
  showModal('modalPengguna', `
    <div class="modal-hd">
      <h3>Edit Pengguna</h3>
      <button class="modal-x" onclick="closeModal('modalPengguna')">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-row-2">
        <div class="field-grp"><label>NIK</label><input value="${u.nik}" disabled style="opacity:.6"/></div>
        <div class="field-grp"><label>Nama</label><input id="uNamaE" value="${u.nama}"/></div>
      </div>
      <div class="form-row-2">
        <div class="field-grp"><label>Departemen</label><input id="uDeptE" value="${u.dept || ''}"/></div>
        <div class="field-grp"><label>Role</label>
          <select id="uRoleE">
            <option value="karyawan"${u.role==='karyawan'?' selected':''}>Karyawan</option>
            <option value="admin"${u.role==='admin'?' selected':''}>Admin</option>
          </select>
        </div>
      </div>
      <div class="modal-ft">
        <button class="btn-sec" onclick="closeModal('modalPengguna')">Batal</button>
        <button class="btn-prim" onclick="updateUser('${nik}')">Simpan</button>
      </div>
    </div>
  `);
}

function updateUser(nik) {
  const u = USERS_DATA.find(x => x.nik === nik);
  if (!u) return;
  u.nama = $('uNamaE')?.value.trim() || u.nama;
  u.dept = $('uDeptE')?.value.trim() || u.dept;
  u.role = $('uRoleE')?.value || u.role;
  renderUsers();
  closeModal('modalPengguna');
  showToast('✅ Data pengguna diperbarui');
}

// ============================================================
//  APPROVAL PINJAMAN
// ============================================================
function renderApproval() {
  const cont = $('approvalCont');
  if (!cont) return;

  const pending = PINJAMAN_DB.filter(p => p.status === 'pending');
  if (!pending.length) {
    cont.innerHTML = `
      <div class="empty-state">
        <div class="es-ico">${ICO.check}</div>
        <p>Tidak ada pengajuan yang menunggu persetujuan.</p>
      </div>`;
    return;
  }

  const statusLabels = { active:'Aktif', pending:'Menunggu', approved:'Disetujui', done:'Lunas', rejected:'Ditolak' };
  cont.innerHTML = pending.map(p => {
    const user = USERS_DATA.find(u => u.nik === p.nik);
    return `
      <div class="appr-card" id="appr-${p.id}">
        <div class="appr-head">
          <div class="flex-1">
            <div class="appr-id">${p.id} · ${p.nik}</div>
            <div class="appr-nama">${user ? user.nama : p.nik} <span class="appr-dept">· ${user?.dept || '-'}</span></div>
          </div>
          <span class="badge badge-warn">${statusLabels[p.status] || p.status}</span>
        </div>
        <div class="appr-body">
          <div class="appr-row"><span>Nominal</span><strong>${rp(p.nominal)}</strong></div>
          <div class="appr-row"><span>Tujuan</span><strong>${p.tujuan}</strong></div>
          <div class="appr-row"><span>Tenor</span><strong>${p.tenor} bulan</strong></div>
          <div class="appr-row"><span>Cicilan/bulan</span><strong>${rp(p.cicilan)}</strong></div>
          <div class="appr-row"><span>Total Bayar</span><strong>${rp(p.cicilan * p.tenor)}</strong></div>
        </div>
        <div class="appr-foot">
          <button class="btn-appr-ok"     onclick="approvePin('${p.id}')">${ICO.check} Setujui</button>
          <button class="btn-appr-reject" onclick="rejectPin('${p.id}')">${ICO.x} Tolak</button>
        </div>
      </div>`;
  }).join('');

  // Update badge count di sidebar
  const badge = document.querySelector('.nav-badge');
  if (badge) badge.textContent = pending.length;
}

function approvePin(id) {
  const p = PINJAMAN_DB.find(x => x.id === id);
  if (!p) return;
  p.status = 'active';
  const card = $('appr-' + id);
  if (card) { card.style.opacity = '0'; setTimeout(() => { card.remove(); renderApproval(); }, 300); }
  showToast(`✅ Pinjaman ${id} disetujui`);
}

function rejectPin(id) {
  const p = PINJAMAN_DB.find(x => x.id === id);
  if (!p) return;
  p.status = 'rejected';
  const card = $('appr-' + id);
  if (card) { card.style.opacity = '0'; setTimeout(() => { card.remove(); renderApproval(); }, 300); }
  showToast(`❌ Pinjaman ${id} ditolak`, 'toast-err');
}

// ============================================================
//  PPOB OVERVIEW
// ============================================================
function renderPPOBOverview() {
  const cont = $('ppobOverviewCont');
  if (!cont) return;

  const totalTrx    = PPOB_TRX.length || 48;
  const totalRev    = PPOB_TRX.reduce((s, t) => s + (t.margin || t.fee || 2500), 0) || 1_250_000;
  const totalVolume = PPOB_TRX.reduce((s, t) => s + (t.nominal || t.amount || 50000), 0) || 24_000_000;

  cont.innerHTML = `
    <div class="kpi-grid" style="padding-top:16px">
      <div class="kpi-card">
        <div class="kpi-ico green">${ICO.chart}</div>
        <div class="kpi-val">${totalTrx}</div>
        <div class="kpi-lbl">Total Transaksi</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-ico blue">${ICO.money}</div>
        <div class="kpi-val">${rp(totalVolume)}</div>
        <div class="kpi-lbl">Volume Transaksi</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-ico orange">${ICO.money}</div>
        <div class="kpi-val">${rp(totalRev)}</div>
        <div class="kpi-lbl">Pendapatan Margin</div>
      </div>
      <div class="kpi-card" style="cursor:pointer" onclick="_showSec('adm-ppob-deposit')">
        <div class="kpi-ico purple">${ICO.money}</div>
        <div class="kpi-val">${rp(DEPOSIT_SALDO)}</div>
        <div class="kpi-lbl">Saldo Deposit</div>
      </div>
    </div>

    <p class="ppob-nav-label">Menu PPOB</p>
    <div class="ppob-nav-list">
      <button class="ppob-nav-item" onclick="_showSec('adm-ppob-riwayat')">
        <span class="pni-ico" style="background:#dcfce7;color:#15803d">${ICO.file}</span>
        <span class="pni-label">
          Riwayat Transaksi
          <span class="pni-sub">Lihat semua transaksi anggota</span>
        </span>
        <span class="pni-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></span>
      </button>
      <button class="ppob-nav-item" onclick="_showSec('adm-ppob-produk')">
        <span class="pni-ico" style="background:#dbeafe;color:#2563eb">${ICO.box}</span>
        <span class="pni-label">
          Produk &amp; Margin
          <span class="pni-sub">Kelola daftar layanan &amp; margin</span>
        </span>
        <span class="pni-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></span>
      </button>
      <button class="ppob-nav-item" onclick="_showSec('adm-ppob-deposit')">
        <span class="pni-ico" style="background:#fef3c7;color:#d97706">${ICO.money}</span>
        <span class="pni-label">
          Manajemen Deposit
          <span class="pni-sub">Saldo deposit: ${rp(DEPOSIT_SALDO)}</span>
        </span>
        <span class="pni-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></span>
      </button>
    </div>
  `;
}

// ── PPOB Riwayat ──
function renderPPOBRiwayat() {
  const tbody = $('tbRiwayatPPOB') || $('ppobRiwayatCont');
  if (!tbody) return;

  const demoTrx = PPOB_TRX.length ? PPOB_TRX : _demoTrx();

  if (tbody.tagName === 'TBODY') {
    tbody.innerHTML = demoTrx.map((t, i) => `
      <tr>
        <td>${t.id || 'TRX-' + (i+1)}</td>
        <td>${_namaByNik(t.nik) || t.nik || '-'}</td>
        <td>${t.layanan || t.type || 'PLN'}</td>
        <td>${t.tujuan || t.target || '-'}</td>
        <td>${rp(t.nominal || t.amount || 0)}</td>
        <td>${rp(t.margin || t.fee || 0)}</td>
        <td>${t.tgl || t.date || '-'}</td>
        <td><span class="badge badge-ok">Sukses</span></td>
      </tr>`).join('');
  } else {
    tbody.innerHTML = `
      <div class="table-wrap">
        <table class="dtable">
          <thead><tr><th>ID</th><th>Anggota</th><th>Layanan</th><th>Tujuan</th><th>Nominal</th><th>Margin</th><th>Tgl</th><th>Status</th></tr></thead>
          <tbody>${demoTrx.map((t, i) => `
            <tr>
              <td>${t.id || 'TRX-'+(i+1)}</td>
              <td>${_namaByNik(t.nik) || '-'}</td>
              <td>${t.layanan || t.type || 'PLN'}</td>
              <td>${t.tujuan || t.target || '-'}</td>
              <td>${rp(t.nominal || 0)}</td>
              <td>${rp(t.margin || 2500)}</td>
              <td>${t.tgl || '-'}</td>
              <td><span class="badge badge-ok">Sukses</span></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }
}

// ── PPOB Produk & Margin ──
function renderPPOBProduk() {
  const cont = $('ppobProdukCont');
  if (!cont) return;

  const prodList = PPOB_PRODUCTS.length ? PPOB_PRODUCTS : _demoPPOBProduk();
  cont.innerHTML = `
    <div class="table-wrap">
      <table class="dtable">
        <thead>
          <tr><th>Produk</th><th>Kategori</th><th>Harga Beli</th><th>Margin</th><th>Harga Jual</th><th>Aksi</th></tr>
        </thead>
        <tbody>
          ${prodList.map(p => `
            <tr>
              <td><strong>${p.nama || p.name}</strong></td>
              <td><span class="badge badge-info">${p.kategori || p.type || '-'}</span></td>
              <td>${rp(p.harga_beli || p.cost || 0)}</td>
              <td id="margin-${p.id}">
                <input type="number" value="${p.margin || 2500}" min="0"
                  style="width:80px;padding:4px 8px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem"
                  onchange="updateMargin(${p.id}, this.value)"/>
              </td>
              <td>${rp((p.harga_beli || p.cost || 0) + (p.margin || 2500))}</td>
              <td>
                <button class="btn-s btn-edit" onclick="updateMargin(${p.id}, document.querySelector('#margin-${p.id} input').value)">
                  Simpan
                </button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function updateMargin(id, val) {
  const p = PPOB_PRODUCTS.find(x => x.id === id);
  if (p) { p.margin = parseInt(val) || 0; renderPPOBProduk(); }
  showToast('✅ Margin diperbarui');
}

// ── Deposit ──
function renderDeposit() {
  const cont = $('depositCont');
  if (!cont) return;

  cont.innerHTML = `
    <div class="deposit-card">
      <div class="deposit-card__label">SALDO DEPOSIT PPOB</div>
      <div class="deposit-card__amount" id="depositAmt">${rp(DEPOSIT_SALDO)}</div>
      <div class="deposit-card__sub">Digunakan untuk pembayaran tagihan anggota</div>
    </div>

    <div class="card-box" style="margin-bottom:16px">
      <h3 class="card-box__title">Tambah Deposit</h3>
      <div class="field-grp">
        <label>Nominal Deposit (Rp)</label>
        <input id="depositNominal" type="number" min="100000" step="100000" placeholder="1000000"/>
      </div>
      <div class="field-grp">
        <label>Keterangan</label>
        <input id="depositKet" placeholder="Transfer via BCA, dll"/>
      </div>
      <button class="btn-prim btn-mt" onclick="tambahDeposit()">Tambah Saldo</button>
    </div>

    <div class="card-section">
      <div class="cs-head"><h3>Riwayat Deposit</h3></div>
      <div class="card-box">
        <div class="adm-pj-item">
          <div>
            <div style="font-weight:700;font-size:.85rem">Transfer BCA</div>
            <div style="font-size:.72rem;color:var(--muted)">15 Apr 2025</div>
          </div>
          <span style="font-weight:800;color:var(--primary)">${rp(5_000_000)}</span>
        </div>
        <div class="adm-pj-item">
          <div>
            <div style="font-weight:700;font-size:.85rem">Transfer BNI</div>
            <div style="font-size:.72rem;color:var(--muted)">1 Apr 2025</div>
          </div>
          <span style="font-weight:800;color:var(--primary)">${rp(3_000_000)}</span>
        </div>
      </div>
    </div>
  `;
}

function tambahDeposit() {
  const nominal = parseInt($('depositNominal')?.value || '0');
  if (nominal < 100_000) { showToast('⚠️ Minimal deposit Rp 100.000', 'toast-err'); return; }
  DEPOSIT_SALDO += nominal;
  setEl('depositAmt', rp(DEPOSIT_SALDO));
  renderDeposit();
  showToast(`✅ Deposit ${rp(nominal)} berhasil ditambahkan`);
}

// ============================================================
//  LAPORAN
// ============================================================
function renderLaporan() {
  const cont = $('laporanCont');
  if (!cont) return;

  const totalAnggota  = USERS_DATA.filter(u => u.role === 'karyawan').length;
  const totalSimpanan = Object.values(SIMPANAN_DB).reduce((s, v) => s + (v.total || 0), 0);
  const totalPinjaman = PINJAMAN_DB.reduce((s, p) => s + p.nominal, 0);
  const pinAktif      = PINJAMAN_DB.filter(p => p.status === 'active').length;

  cont.innerHTML = `
    <div class="laporan-grid">

      <div class="laporan-card">
        <div class="kpi-ico green" style="margin-bottom:8px">${ICO.user}</div>
        <h3>Laporan Keanggotaan</h3>
        <p>${totalAnggota} anggota aktif terdaftar</p>
        <div class="sp-row" style="margin-top:10px"><span>Total Anggota</span><strong>${totalAnggota}</strong></div>
        <div class="sp-row"><span>Admin</span><strong>${USERS_DATA.filter(u=>u.role==='admin').length}</strong></div>
        <button class="btn-export" onclick="exportLaporan('keanggotaan')">${ICO.down} Ekspor CSV</button>
      </div>

      <div class="laporan-card">
        <div class="kpi-ico blue" style="margin-bottom:8px">${ICO.money}</div>
        <h3>Laporan Simpanan</h3>
        <p>Total simpanan seluruh anggota</p>
        <div class="sp-row" style="margin-top:10px"><span>Total Simpanan</span><strong>${rp(totalSimpanan)}</strong></div>
        <div class="sp-row"><span>Rata-rata/anggota</span><strong>${rp(totalAnggota ? Math.round(totalSimpanan / totalAnggota) : 0)}</strong></div>
        <button class="btn-export" onclick="exportLaporan('simpanan')">${ICO.down} Ekspor CSV</button>
      </div>

      <div class="laporan-card">
        <div class="kpi-ico orange" style="margin-bottom:8px">${ICO.file}</div>
        <h3>Laporan Pinjaman</h3>
        <p>${pinAktif} pinjaman aktif</p>
        <div class="sp-row" style="margin-top:10px"><span>Total Disalurkan</span><strong>${rp(totalPinjaman)}</strong></div>
        <div class="sp-row"><span>Menunggu Approval</span><strong>${PINJAMAN_DB.filter(p=>p.status==='pending').length}</strong></div>
        <div class="sp-row"><span>Sudah Lunas</span><strong>${PINJAMAN_DB.filter(p=>p.status==='done').length}</strong></div>
        <button class="btn-export" onclick="exportLaporan('pinjaman')">${ICO.down} Ekspor CSV</button>
      </div>

      <div class="laporan-card">
        <div class="kpi-ico purple" style="margin-bottom:8px">${ICO.chart}</div>
        <h3>Laporan PPOB</h3>
        <p>Transaksi pembayaran digital</p>
        <div class="sp-row" style="margin-top:10px"><span>Total Transaksi</span><strong>${PPOB_TRX.length || 48}</strong></div>
        <div class="sp-row"><span>Pendapatan Margin</span><strong>${rp(PPOB_TRX.reduce((s,t)=>s+(t.margin||2500),0)||1_250_000)}</strong></div>
        <div class="sp-row"><span>Saldo Deposit</span><strong>${rp(DEPOSIT_SALDO)}</strong></div>
        <button class="btn-export" onclick="exportLaporan('ppob')">${ICO.down} Ekspor CSV</button>
      </div>

    </div>

    <div class="card-box">
      <h3 class="card-box__title">Ekspor Lengkap</h3>
      <p class="form-note">Unduh seluruh data dalam satu file untuk keperluan audit atau rapat anggota tahunan.</p>
      <button class="btn-prim" onclick="exportLaporan('all')">${ICO.down} Unduh Semua Laporan</button>
    </div>
  `;
}

function exportLaporan(tipe) {
  showToast(`📥 Mengunduh laporan ${tipe}...`, 'toast-info');
  setTimeout(() => showToast('✅ File berhasil diunduh'), 1800);
}

// ============================================================
//  CHARTS (Chart.js)
// ============================================================
function initCharts() {
  _initChartSimpanan();
  _initChartPinjaman();
}

function _initChartSimpanan() {
  const canvas = $('chartSimpanan');
  if (!canvas || typeof Chart === 'undefined') return;

  const labels = ['Jan','Feb','Mar','Apr','Mei','Jun'];
  const data   = [42, 48, 51, 55, 58, 62].map(v => v * 1_000_000);

  new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Total Simpanan',
        data,
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22,163,74,0.08)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#16a34a',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          ticks: { callback: v => 'Rp ' + (v/1e6).toFixed(0) + 'M', font: { size: 10 } },
          grid: { color: 'rgba(0,0,0,0.05)' },
        },
        x: { ticks: { font: { size: 10 } }, grid: { display: false } },
      },
    }
  });
}

function _initChartPinjaman() {
  const canvas = $('chartPinjaman');
  if (!canvas || typeof Chart === 'undefined') return;

  const statusCount = {
    Aktif    : PINJAMAN_DB.filter(p => p.status === 'active').length,
    Menunggu : PINJAMAN_DB.filter(p => p.status === 'pending').length,
    Lunas    : PINJAMAN_DB.filter(p => p.status === 'done').length,
    Ditolak  : PINJAMAN_DB.filter(p => p.status === 'rejected').length,
  };

  new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: Object.keys(statusCount),
      datasets: [{
        data: Object.values(statusCount),
        backgroundColor: ['#16a34a','#f59e0b','#6b7280','#ef4444'],
        borderWidth: 0,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } }
      },
    }
  });
}

// ============================================================
//  MODAL HELPER
// ============================================================
function showModal(id, html) {
  let overlay = $(id);
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = id;
    overlay.className = 'modal-overlay show';
    overlay.onclick = e => { if (e.target === overlay) closeModal(id); };
    document.body.appendChild(overlay);
  }
  const box = document.createElement('div');
  box.className = 'modal-box';
  box.innerHTML = html;
  overlay.innerHTML = '';
  overlay.appendChild(box);
  overlay.classList.add('show');
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const el = $(id);
  if (!el) return;
  el.style.display = 'none';
  el.classList.remove('show');
  document.body.style.overflow = '';
}

// ============================================================
//  ACTIVITY SIMULATION
// ============================================================
function startActivitySimulation() {
  const msgs = [
    () => `<strong>${_namaByNik(PINJAMAN_DB[0]?.nik || '-')}</strong> membuka halaman simpanan`,
    () => `Transaksi PPOB baru: <strong>Pulsa Rp 50.000</strong>`,
    () => `<strong>${USERS_DATA[Math.floor(Math.random()*USERS_DATA.length)]?.nama || 'Anggota'}</strong> login ke sistem`,
    () => `Pembelian katalog: <strong>${PRODUCTS[Math.floor(Math.random()*PRODUCTS.length)]?.nama || 'Produk'}</strong>`,
  ];
  setInterval(() => {
    const feedEl = $('activityFeed');
    if (!feedEl) return;
    const msg = msgs[Math.floor(Math.random() * msgs.length)]();
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
      <div class="activity-dot"></div>
      <div class="activity-text">${msg}</div>
      <div class="activity-time">Baru saja</div>`;
    feedEl.prepend(item);
    while (feedEl.children.length > 8) feedEl.lastChild.remove();
  }, 12_000);
}

// ============================================================
//  RESET DEMO DATA
// ============================================================
function resetDemoData() {
  PRODUCTS    = JSON.parse(JSON.stringify(window.SHARED_PRODUCTS || []));
  PINJAMAN_DB = JSON.parse(JSON.stringify(window.SHARED_PINJAMAN || []));
  renderAdminOverview();
  renderBarang(PRODUCTS);
  renderUsers();
  renderApproval();
  renderPPOBOverview();
  renderPPOBRiwayat();
  renderPPOBProduk();
  renderDeposit();
  renderLaporan();
  showToast('🔄 Data demo direset');
}

function initResetFeature(cb) {
  const btn = $('btnResetDemo');
  if (btn) btn.addEventListener('click', cb);
}

// ============================================================
//  DEMO DATA FALLBACK (jika PPOB_TRX / PPOB_PRODUCTS kosong)
// ============================================================
function _demoTrx() {
  const niks = USERS_DATA.slice(0, 5).map(u => u.nik);
  const types = ['PLN Pascabayar','Pulsa 50K','PDAM','Internet','Gas PGN'];
  return Array.from({ length: 12 }, (_, i) => ({
    id      : 'PPB-' + String(i+1).padStart(4,'0'),
    nik     : niks[i % niks.length] || 'EMP001',
    layanan : types[i % types.length],
    tujuan  : '08' + (1234567890 + i),
    nominal : [50000,100000,150000,75000,200000][i%5],
    margin  : 2500,
    tgl     : `${String(Math.floor(i/2)+1).padStart(2,'0')}/04/2025`,
  }));
}

function _demoPPOBProduk() {
  return [
    { id:1, nama:'PLN Pascabayar',  kategori:'Listrik',  harga_beli:0,    margin:3000 },
    { id:2, nama:'Pulsa Telkomsel', kategori:'Pulsa',    harga_beli:47500, margin:2500 },
    { id:3, nama:'Pulsa XL',        kategori:'Pulsa',    harga_beli:47000, margin:2500 },
    { id:4, nama:'PDAM',            kategori:'Air',      harga_beli:0,    margin:3500 },
    { id:5, nama:'Internet Indihome',kategori:'Internet', harga_beli:0,   margin:5000 },
    { id:6, nama:'Gas PGN',         kategori:'Gas',      harga_beli:0,    margin:3000 },
    { id:7, nama:'BPJS Kesehatan',  kategori:'Asuransi', harga_beli:0,    margin:2000 },
  ];
}

// ── Jalankan ──
init();
