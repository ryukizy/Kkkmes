/**
 * ppob.js — KopKar MES
 * Layanan PPOB: Pulsa, Paket Data, Token PLN
 * Mode: Full Mock (no backend)
 *
 * Dependency: shared.js (rp, showToast, USER)
 * Load order: shared.js → ppob.js → karyawan.js
 */

// ─────────────────────────────────────────────
// 1. DATA PRODUK MOCK
// ─────────────────────────────────────────────

const PPOB_PROVIDERS = {
  telkomsel: {
    label: 'Telkomsel',
    color: '#e4002b',
    prefixes: ['0811','0812','0813','0821','0822','0823','0851','0852','0853'],
  },
  indosat: {
    label: 'Indosat',
    color: '#f7941d',
    prefixes: ['0814','0815','0816','0855','0856','0857','0858'],
  },
  xl: {
    label: 'XL',
    color: ['0817','0818','0819','0859','0877','0878'],
    prefixes: ['0817','0818','0819','0859','0877','0878'],
    color: '#0050a0',
  },
  tri: {
    label: 'Tri (3)',
    color: '#8b1f8b',
    prefixes: ['0895','0896','0897','0898','0899'],
  },
  smartfren: {
    label: 'Smartfren',
    color: '#e2001a',
    prefixes: ['0881','0882','0883','0884','0885','0886','0887','0888','0889'],
  },
};

const PPOB_PULSA_NOMINAL = [
  { nominal: 5000,   harga: 6000  },
  { nominal: 10000,  harga: 11500 },
  { nominal: 20000,  harga: 21500 },
  { nominal: 25000,  harga: 26500 },
  { nominal: 50000,  harga: 52000 },
  { nominal: 100000, harga: 102500 },
];

const PPOB_PAKET_DATA = {
  telkomsel: [
    { id: 'tsel-1gb',  label: '1 GB',   masa: '7 hari',   harga: 15000 },
    { id: 'tsel-3gb',  label: '3 GB',   masa: '30 hari',  harga: 35000 },
    { id: 'tsel-6gb',  label: '6 GB',   masa: '30 hari',  harga: 60000 },
    { id: 'tsel-12gb', label: '12 GB',  masa: '30 hari',  harga: 100000 },
    { id: 'tsel-25gb', label: '25 GB',  masa: '30 hari',  harga: 175000 },
  ],
  indosat: [
    { id: 'im3-2gb',   label: '2 GB',   masa: '30 hari',  harga: 20000 },
    { id: 'im3-5gb',   label: '5 GB',   masa: '30 hari',  harga: 45000 },
    { id: 'im3-10gb',  label: '10 GB',  masa: '30 hari',  harga: 80000 },
    { id: 'im3-20gb',  label: '20 GB',  masa: '30 hari',  harga: 130000 },
  ],
  xl: [
    { id: 'xl-1gb',    label: '1.3 GB', masa: '7 hari',   harga: 13000 },
    { id: 'xl-5gb',    label: '5 GB',   masa: '30 hari',  harga: 50000 },
    { id: 'xl-10gb',   label: '10 GB',  masa: '30 hari',  harga: 90000 },
  ],
  tri: [
    { id: 'tri-2gb',   label: '2 GB',   masa: '30 hari',  harga: 18000 },
    { id: 'tri-6gb',   label: '6 GB',   masa: '30 hari',  harga: 45000 },
    { id: 'tri-14gb',  label: '14 GB',  masa: '30 hari',  harga: 80000 },
  ],
  smartfren: [
    { id: 'sf-3gb',    label: '3 GB',   masa: '30 hari',  harga: 25000 },
    { id: 'sf-8gb',    label: '8 GB',   masa: '30 hari',  harga: 55000 },
  ],
};

const PPOB_PLN_PELANGGAN_MOCK = {
  '521100000001': { nama: 'AGUS SUSANTO',    tarif: 'R1/900VA',  daya: '900 VA'  },
  '521100000002': { nama: 'RINA MARLINA',    tarif: 'R1/1300VA', daya: '1300 VA' },
  '521100000003': { nama: 'RISKI HARIYANTO', tarif: 'R2/2200VA', daya: '2200 VA' },
  '521100000004': { nama: 'SITI RAHAYU',     tarif: 'R1/900VA',  daya: '900 VA'  },
  '521100000005': { nama: 'AHMAD FAUZI',     tarif: 'R1/1300VA', daya: '1300 VA' },
};

const PPOB_PLN_NOMINAL = [
  { nominal: 20000,  kwh: '~5.8 kWh',  harga: 22500  },
  { nominal: 50000,  kwh: '~14.5 kWh', harga: 52500  },
  { nominal: 100000, kwh: '~29 kWh',   harga: 102500 },
  { nominal: 200000, kwh: '~58 kWh',   harga: 202500 },
  { nominal: 500000, kwh: '~145 kWh',  harga: 502500 },
];

// ─────────────────────────────────────────────
// 2. STATE PPOB
// ─────────────────────────────────────────────

const PPOB_STATE = {
  activeTab: 'pulsa',

  pulsa: {
    nomor: '',
    provider: null,
    selectedNominal: null, // { nominal, harga }
  },

  data: {
    nomor: '',
    provider: null,
    selectedPaket: null, // paket object
  },

  pln: {
    idpel: '',
    pelanggan: null,  // { nama, tarif, daya }
    selectedNominal: null, // { nominal, kwh, harga }
  },
};

// Riwayat transaksi — persisten selama sesi
if (!window.PPOB_TRANSACTIONS) {
  window.PPOB_TRANSACTIONS = [];
}

// ─────────────────────────────────────────────
// 3. INIT
// ─────────────────────────────────────────────

function initPPOB() {
  ppobRenderPulsaNominal();
  ppobRenderRiwayat();
}

// ─────────────────────────────────────────────
// 4. TAB SWITCHING
// ─────────────────────────────────────────────

function ppobSwitchTab(tab) {
  PPOB_STATE.activeTab = tab;

  // Update tab buttons
  document.querySelectorAll('.ppob-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  // Show/hide panels
  ['pulsa', 'data', 'pln'].forEach(t => {
    const panel = document.getElementById(`ppob-panel-${t}`);
    if (panel) panel.style.display = t === tab ? 'block' : 'none';
  });

  // Render konten tab yang baru dibuka
  if (tab === 'data' && PPOB_STATE.data.provider) {
    ppobRenderPaketData(PPOB_STATE.data.provider);
  }
  if (tab === 'pln') {
    ppobRenderPLNNominal();
  }
}

// ─────────────────────────────────────────────
// 5. PROVIDER DETECTION
// ─────────────────────────────────────────────

function ppobDetectProvider(value, tab) {
  // Format nomor saat mengetik
  const cleaned = value.replace(/\D/g, '').slice(0, 12);
  const state = PPOB_STATE[tab];
  state.nomor = cleaned;

  // Deteksi provider dari prefix 4 digit
  let detectedKey = null;
  if (cleaned.length >= 4) {
    const prefix4 = cleaned.slice(0, 4);
    for (const [key, prov] of Object.entries(PPOB_PROVIDERS)) {
      if (prov.prefixes.includes(prefix4)) {
        detectedKey = key;
        break;
      }
    }
  }

  state.provider = detectedKey;

  // Update badge
  const badge = document.getElementById(`${tab}-provider-badge`);
  if (badge) {
    if (detectedKey) {
      const prov = PPOB_PROVIDERS[detectedKey];
      badge.textContent = prov.label;
      badge.style.background = prov.color;
      badge.style.color = '#fff';
      badge.classList.add('detected');
    } else {
      badge.textContent = '–';
      badge.style.background = '';
      badge.style.color = '';
      badge.classList.remove('detected');
    }
  }

  // Reset pilihan produk jika provider berubah
  if (tab === 'pulsa') {
    state.selectedNominal = null;
    ppobRenderPulsaNominal();
    ppobUpdatePulsaSummary();
  } else if (tab === 'data') {
    state.selectedPaket = null;
    if (detectedKey) {
      ppobRenderPaketData(detectedKey);
    } else {
      const list = document.getElementById('data-paket-list');
      if (list) list.innerHTML = '<p class="ppob-hint">Masukkan nomor untuk melihat paket tersedia</p>';
    }
    ppobUpdateDataSummary();
  }
}

// ─────────────────────────────────────────────
// 6. PULSA
// ─────────────────────────────────────────────

function ppobRenderPulsaNominal() {
  const grid = document.getElementById('pulsa-nominal-grid');
  if (!grid) return;

  grid.innerHTML = PPOB_PULSA_NOMINAL.map(item => `
    <button
      class="ppob-nominal-btn ${PPOB_STATE.pulsa.selectedNominal?.nominal === item.nominal ? 'selected' : ''}"
      onclick="ppobSelectPulsaNominal(${item.nominal}, ${item.harga})"
    >
      <span class="ppob-nominal-val">${rp(item.nominal)}</span>
      <span class="ppob-nominal-harga">${rp(item.harga)}</span>
    </button>
  `).join('');
}

function ppobSelectPulsaNominal(nominal, harga) {
  PPOB_STATE.pulsa.selectedNominal = { nominal, harga };
  ppobRenderPulsaNominal();
  ppobUpdatePulsaSummary();
}

function ppobUpdatePulsaSummary() {
  const s = PPOB_STATE.pulsa;
  const summary = document.getElementById('pulsa-summary');
  const btnBayar = document.getElementById('btn-pulsa-bayar');
  const isReady = s.nomor.length >= 10 && s.provider && s.selectedNominal;

  if (summary) {
    summary.style.display = isReady ? 'block' : 'none';
    if (isReady) {
      document.getElementById('sum-pulsa-nomor').textContent    = ppobFormatPhone(s.nomor);
      document.getElementById('sum-pulsa-provider').textContent = PPOB_PROVIDERS[s.provider].label;
      document.getElementById('sum-pulsa-nominal').textContent  = rp(s.selectedNominal.nominal);
      document.getElementById('sum-pulsa-total').textContent    = rp(s.selectedNominal.harga);
    }
  }

  if (btnBayar) btnBayar.disabled = !isReady;
}

// ─────────────────────────────────────────────
// 7. PAKET DATA
// ─────────────────────────────────────────────

function ppobRenderPaketData(providerKey) {
  const list = document.getElementById('data-paket-list');
  if (!list) return;

  const pakets = PPOB_PAKET_DATA[providerKey];
  if (!pakets) {
    list.innerHTML = '<p class="ppob-hint">Paket tidak tersedia untuk provider ini</p>';
    return;
  }

  list.innerHTML = pakets.map(p => `
    <button
      class="ppob-paket-item ${PPOB_STATE.data.selectedPaket?.id === p.id ? 'selected' : ''}"
      onclick='ppobSelectPaket(${JSON.stringify(p)})'
    >
      <div class="ppob-paket-left">
        <span class="ppob-paket-size">${p.label}</span>
        <span class="ppob-paket-masa">${p.masa}</span>
      </div>
      <span class="ppob-paket-price">${rp(p.harga)}</span>
    </button>
  `).join('');
}

function ppobSelectPaket(paket) {
  PPOB_STATE.data.selectedPaket = paket;
  ppobRenderPaketData(PPOB_STATE.data.provider);
  ppobUpdateDataSummary();
}

function ppobUpdateDataSummary() {
  const s = PPOB_STATE.data;
  const summary = document.getElementById('data-summary');
  const btnBayar = document.getElementById('btn-data-bayar');
  const isReady  = s.nomor.length >= 10 && s.provider && s.selectedPaket;

  if (summary) {
    summary.style.display = isReady ? 'block' : 'none';
    if (isReady) {
      document.getElementById('sum-data-nomor').textContent    = ppobFormatPhone(s.nomor);
      document.getElementById('sum-data-provider').textContent = PPOB_PROVIDERS[s.provider].label;
      document.getElementById('sum-data-paket').textContent    = `${s.selectedPaket.label} / ${s.selectedPaket.masa}`;
      document.getElementById('sum-data-total').textContent    = rp(s.selectedPaket.harga);
    }
  }

  if (btnBayar) btnBayar.disabled = !isReady;
}

// ─────────────────────────────────────────────
// 8. PLN TOKEN
// ─────────────────────────────────────────────

let _plnCheckTimeout = null;

function ppobCheckPLN(value) {
  const cleaned = value.replace(/\D/g, '').slice(0, 13);
  PPOB_STATE.pln.idpel    = cleaned;
  PPOB_STATE.pln.pelanggan = null;

  const infoCard = document.getElementById('pln-info-card');
  if (infoCard) infoCard.style.display = 'none';

  // Debounce 500ms
  clearTimeout(_plnCheckTimeout);
  if (cleaned.length < 11) {
    ppobUpdatePLNSummary();
    return;
  }

  _plnCheckTimeout = setTimeout(() => {
    // Cek mock DB
    const pel = PPOB_PLN_PELANGGAN_MOCK[cleaned];
    if (pel) {
      PPOB_STATE.pln.pelanggan = pel;
      document.getElementById('pln-nama').textContent  = pel.nama;
      document.getElementById('pln-tarif').textContent = `${pel.tarif} / ${pel.daya}`;
      if (infoCard) infoCard.style.display = 'flex';
      showToast(`✅ Pelanggan ditemukan: ${pel.nama}`, 'ok');
    } else {
      showToast('ID Pelanggan tidak ditemukan', 'err');
    }
    ppobUpdatePLNSummary();
  }, 500);
}

function ppobRenderPLNNominal() {
  const grid = document.getElementById('pln-nominal-grid');
  if (!grid) return;

  grid.innerHTML = PPOB_PLN_NOMINAL.map(item => `
    <button
      class="ppob-nominal-btn ppob-pln-btn ${PPOB_STATE.pln.selectedNominal?.nominal === item.nominal ? 'selected' : ''}"
      onclick="ppobSelectPLNNominal(${item.nominal}, '${item.kwh}', ${item.harga})"
    >
      <span class="ppob-nominal-val">${rp(item.nominal)}</span>
      <span class="ppob-nominal-kwh">${item.kwh}</span>
      <span class="ppob-nominal-harga">${rp(item.harga)}</span>
    </button>
  `).join('');
}

function ppobSelectPLNNominal(nominal, kwh, harga) {
  PPOB_STATE.pln.selectedNominal = { nominal, kwh, harga };
  ppobRenderPLNNominal();
  ppobUpdatePLNSummary();
}

function ppobUpdatePLNSummary() {
  const s = PPOB_STATE.pln;
  const summary  = document.getElementById('pln-summary');
  const btnBayar = document.getElementById('btn-pln-bayar');
  const isReady  = s.idpel.length >= 11 && s.pelanggan && s.selectedNominal;

  if (summary) {
    summary.style.display = isReady ? 'block' : 'none';
    if (isReady) {
      document.getElementById('sum-pln-idpel').textContent   = s.idpel;
      document.getElementById('sum-pln-nama').textContent    = s.pelanggan.nama;
      document.getElementById('sum-pln-nominal').textContent = `${rp(s.selectedNominal.nominal)} (${s.selectedNominal.kwh})`;
      document.getElementById('sum-pln-total').textContent   = rp(s.selectedNominal.harga);
    }
  }

  if (btnBayar) btnBayar.disabled = !isReady;
}

// ─────────────────────────────────────────────
// 9. PROSES PEMBAYARAN
// ─────────────────────────────────────────────

function ppobBayar(tab) {
  const btn = document.getElementById(`btn-${tab}-bayar`);
  if (btn) {
    btn.disabled    = true;
    btn.textContent = 'Memproses…';
  }

  // Simulasi delay transaksi (1–2 detik)
  const delay = 1000 + Math.random() * 800;

  setTimeout(() => {
    const trx = ppobBuildTrx(tab);

    if (trx) {
      window.PPOB_TRANSACTIONS.unshift(trx); // prepend agar terbaru di atas
      ppobRenderRiwayat();

      if (tab === 'pln') {
        ppobShowTokenResult(trx.token);
        showToast('🎉 Token berhasil dibeli!', 'ok');
      } else {
        showToast(`✅ ${trx.label} berhasil dikirim ke ${ppobFormatPhone(trx.nomor)}`, 'ok');
        ppobResetForm(tab);
      }
    } else {
      showToast('Transaksi gagal. Coba lagi.', 'err');
    }

    if (btn) {
      btn.disabled    = false;
      btn.textContent = tab === 'pln' ? 'Beli Token' : 'Bayar Sekarang';
    }
  }, delay);
}

function ppobBuildTrx(tab) {
  const now    = new Date();
  const id     = `PPOB-${Date.now().toString().slice(-6)}`;
  const tglStr = now.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
  const jamStr = now.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });

  if (tab === 'pulsa') {
    const s = PPOB_STATE.pulsa;
    if (!s.selectedNominal || !s.provider) return null;
    return {
      id, tab, tgl: `${tglStr} ${jamStr}`,
      icon: '📱',
      label: `Pulsa ${PPOB_PROVIDERS[s.provider].label} ${rp(s.selectedNominal.nominal)}`,
      nomor: s.nomor,
      harga: s.selectedNominal.harga,
      status: 'sukses',
    };
  }

  if (tab === 'data') {
    const s = PPOB_STATE.data;
    if (!s.selectedPaket || !s.provider) return null;
    return {
      id, tab, tgl: `${tglStr} ${jamStr}`,
      icon: '🌐',
      label: `Paket Data ${PPOB_PROVIDERS[s.provider].label} ${s.selectedPaket.label}`,
      nomor: s.nomor,
      harga: s.selectedPaket.harga,
      status: 'sukses',
    };
  }

  if (tab === 'pln') {
    const s = PPOB_STATE.pln;
    if (!s.selectedNominal || !s.pelanggan) return null;
    const token = ppobGeneratePLNToken();
    return {
      id, tab, tgl: `${tglStr} ${jamStr}`,
      icon: '⚡',
      label: `Token PLN ${rp(s.selectedNominal.nominal)}`,
      nomor: s.idpel,
      nama: s.pelanggan.nama,
      harga: s.selectedNominal.harga,
      kwh: s.selectedNominal.kwh,
      token,
      status: 'sukses',
    };
  }

  return null;
}

function ppobGeneratePLNToken() {
  // Generate 20-digit random token format XXXX-XXXX-XXXX-XXXX-XXXX
  const seg = () => Math.floor(1000 + Math.random() * 9000).toString();
  return `${seg()}-${seg()}-${seg()}-${seg()}-${seg()}`;
}

function ppobShowTokenResult(token) {
  const wrap = document.getElementById('pln-token-result');
  const code = document.getElementById('pln-token-code');
  if (wrap && code) {
    code.textContent   = token;
    wrap.style.display = 'block';
    wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function ppobResetForm(tab) {
  if (tab === 'pulsa') {
    PPOB_STATE.pulsa = { nomor: '', provider: null, selectedNominal: null };
    const inp = document.getElementById('pulsa-nomor');
    if (inp) inp.value = '';
    ppobDetectProvider('', 'pulsa');
    ppobRenderPulsaNominal();
    ppobUpdatePulsaSummary();
  }
  if (tab === 'data') {
    PPOB_STATE.data = { nomor: '', provider: null, selectedPaket: null };
    const inp = document.getElementById('data-nomor');
    if (inp) inp.value = '';
    ppobDetectProvider('', 'data');
    ppobUpdateDataSummary();
    const list = document.getElementById('data-paket-list');
    if (list) list.innerHTML = '<p class="ppob-hint">Masukkan nomor untuk melihat paket tersedia</p>';
  }
  if (tab === 'pln') {
    PPOB_STATE.pln = { idpel: '', pelanggan: null, selectedNominal: null };
    const inp = document.getElementById('pln-idpel');
    if (inp) inp.value = '';
    const ic = document.getElementById('pln-info-card');
    if (ic) ic.style.display = 'none';
    ppobRenderPLNNominal();
    ppobUpdatePLNSummary();
    setTimeout(() => {
      const tr = document.getElementById('pln-token-result');
      if (tr) tr.style.display = 'none';
    }, 5000);
  }
}

// ─────────────────────────────────────────────
// 10. RENDER RIWAYAT
// ─────────────────────────────────────────────

function ppobRenderRiwayat() {
  const list  = document.getElementById('ppob-riwayat-list');
  const count = document.getElementById('ppob-trx-count');
  if (!list) return;

  const trxs = window.PPOB_TRANSACTIONS;

  if (count) count.textContent = `${trxs.length} transaksi`;

  if (trxs.length === 0) {
    list.innerHTML = `
      <div class="ppob-empty-state">
        <span class="ppob-empty-icon">🧾</span>
        <p>Belum ada transaksi PPOB</p>
      </div>`;
    return;
  }

  list.innerHTML = trxs.map(t => `
    <div class="ppob-trx-item">
      <span class="ppob-trx-icon">${t.icon}</span>
      <div class="ppob-trx-info">
        <span class="ppob-trx-label">${t.label}</span>
        <span class="ppob-trx-meta">
          ${t.nama ? t.nama + ' · ' : ''}
          ${t.tab === 'pln' ? t.nomor : ppobFormatPhone(t.nomor)} · ${t.tgl}
        </span>
        ${t.token ? `<span class="ppob-trx-token">Token: ${t.token}</span>` : ''}
      </div>
      <div class="ppob-trx-right">
        <span class="ppob-trx-harga">${rp(t.harga)}</span>
        <span class="badge-ok">${t.status}</span>
      </div>
    </div>
  `).join('');
}

// ─────────────────────────────────────────────
// 11. HELPERS
// ─────────────────────────────────────────────

function ppobFormatPhone(num) {
  // Format: 0812-3456-7890
  const d = num.replace(/\D/g, '');
  if (d.length <= 4)  return d;
  if (d.length <= 8)  return `${d.slice(0,4)}-${d.slice(4)}`;
  return `${d.slice(0,4)}-${d.slice(4,8)}-${d.slice(8)}`;
}
