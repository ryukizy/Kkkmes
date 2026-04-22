// ============================================
//  PPOB.JS — KopKar MES
//  Layanan PPOB: Pulsa, Paket Data, Token Listrik
// ============================================

// ─── Mock PPOB Products Database ───
const PPOB_PRODUCTS = {
  telkomsel_pulsa: [
    { code: 'TSP5',   name: 'Pulsa Rp 5.000',   price: 6000,   admin: 500 },
    { code: 'TSP10',  name: 'Pulsa Rp 10.000',  price: 11000,  admin: 500 },
    { code: 'TSP20',  name: 'Pulsa Rp 20.000',  price: 20500,  admin: 500 },
    { code: 'TSP25',  name: 'Pulsa Rp 25.000',  price: 25500,  admin: 500 },
    { code: 'TSP50',  name: 'Pulsa Rp 50.000',  price: 50000,  admin: 500 },
    { code: 'TSP100', name: 'Pulsa Rp 100.000', price: 99000,  admin: 500 },
  ],
  xl_pulsa: [
    { code: 'XLP5',   name: 'Pulsa Rp 5.000',   price: 6000,   admin: 500 },
    { code: 'XLP10',  name: 'Pulsa Rp 10.000',  price: 10500,  admin: 500 },
    { code: 'XLP25',  name: 'Pulsa Rp 25.000',  price: 25000,  admin: 500 },
    { code: 'XLP50',  name: 'Pulsa Rp 50.000',  price: 49500,  admin: 500 },
    { code: 'XLP100', name: 'Pulsa Rp 100.000', price: 98500,  admin: 500 },
  ],
  indosat_pulsa: [
    { code: 'IDP5',   name: 'Pulsa Rp 5.000',   price: 6000,   admin: 500 },
    { code: 'IDP10',  name: 'Pulsa Rp 10.000',  price: 10500,  admin: 500 },
    { code: 'IDP25',  name: 'Pulsa Rp 25.000',  price: 24500,  admin: 500 },
    { code: 'IDP50',  name: 'Pulsa Rp 50.000',  price: 49000,  admin: 500 },
    { code: 'IDP100', name: 'Pulsa Rp 100.000', price: 97500,  admin: 500 },
  ],
  telkomsel_data: [
    { code: 'TSD1',  name: '1GB 7 Hari',    price: 13000,  admin: 500 },
    { code: 'TSD2',  name: '2GB 14 Hari',   price: 25000,  admin: 500 },
    { code: 'TSD3',  name: '3GB 30 Hari',   price: 35000,  admin: 500 },
    { code: 'TSD5',  name: '5GB 30 Hari',   price: 52000,  admin: 500 },
    { code: 'TSD10', name: '10GB 30 Hari',  price: 95000,  admin: 500 },
    { code: 'TSD25', name: '25GB 30 Hari',  price: 125000, admin: 1000 },
  ],
  xl_data: [
    { code: 'XLD1',  name: '1GB 7 Hari',    price: 12000,  admin: 500 },
    { code: 'XLD2',  name: '2GB 15 Hari',   price: 23000,  admin: 500 },
    { code: 'XLD3',  name: '3GB 30 Hari',   price: 33000,  admin: 500 },
    { code: 'XLD5',  name: '5GB 30 Hari',   price: 50000,  admin: 500 },
    { code: 'XLD10', name: '10GB 30 Hari',  price: 90000,  admin: 500 },
  ],
  pln: [
    { code: 'PLN20',  name: 'Token Rp 20.000',  price: 20000, admin: 1500 },
    { code: 'PLN50',  name: 'Token Rp 50.000',  price: 50000, admin: 1500 },
    { code: 'PLN100', name: 'Token Rp 100.000', price: 100000, admin: 1500 },
    { code: 'PLN200', name: 'Token Rp 200.000', price: 200000, admin: 1500 },
    { code: 'PLN500', name: 'Token Rp 500.000', price: 500000, admin: 1500 },
  ]
};

// ─── Mock Transaction History ───
let PPOB_TRANSACTIONS = [
  {
    id: 'PPOB-0012',
    type: 'pulsa',
    provider: 'Telkomsel',
    target: '081234567890',
    product: 'Pulsa Rp 20.000',
    amount: 20500,
    payment: 'simpanan_sukarela',
    status: 'success',
    date: '15 Apr 2025',
    token: null
  },
  {
    id: 'PPOB-0008',
    type: 'pln',
    provider: 'PLN',
    target: '123456789012',
    product: 'Token Rp 50.000',
    amount: 51500,
    payment: 'limit_belanja',
    status: 'success',
    date: '10 Apr 2025',
    token: '1234-5678-9012-3456-7890'
  }
];

// ─── State ───
let selectedPPOBType = 'pulsa';
let selectedProvider = 'telkomsel';
let selectedProduct  = null;

// ─── Provider Detection ───
function detectProvider(phoneNumber) {
  const prefixes = {
    telkomsel: ['0811', '0812', '0813', '0821', '0822', '0823', '0851', '0852', '0853'],
    xl: ['0817', '0818', '0819', '0859', '0877', '0878'],
    indosat: ['0814', '0815', '0816', '0855', '0856', '0857', '0858'],
    three: ['0895', '0896', '0897', '0898', '0899'],
    smartfren: ['0881', '0882', '0883', '0884', '0885', '0886', '0887', '0888', '0889']
  };
  
  const cleaned = phoneNumber.replace(/\D/g, '');
  const prefix = cleaned.substring(0, 4);
  
  for (const [provider, list] of Object.entries(prefixes)) {
    if (list.includes(prefix)) return provider;
  }
  return null;
}

// ─── Render Products ───
function renderPPOBProducts() {
  const key = selectedProvider + '_' + selectedPPOBType;
  const products = PPOB_PRODUCTS[key] || [];
  const container = document.getElementById('ppobProductGrid');
  
  if (!container) return;
  
  if (!products.length) {
    container.innerHTML = '<p style="text-align:center;color:var(--muted);padding:40px">Tidak ada produk tersedia</p>';
    return;
  }
  
  container.innerHTML = products.map(p => {
    const total = p.price + p.admin;
    const isSelected = selectedProduct?.code === p.code;
    return `
      <div class="ppob-product-card ${isSelected ? 'selected' : ''}" onclick="selectPPOBProduct('${p.code}')">
        <div class="ppob-prod-name">${p.name}</div>
        <div class="ppob-prod-price">${rp(total)}</div>
        <div class="ppob-prod-detail">Harga: ${rp(p.price)}<br>Admin: ${rp(p.admin)}</div>
      </div>
    `;
  }).join('');
}

// ─── Select Product ───
function selectPPOBProduct(code) {
  const key = selectedProvider + '_' + selectedPPOBType;
  const products = PPOB_PRODUCTS[key] || [];
  selectedProduct = products.find(p => p.code === code);
  renderPPOBProducts();
  updatePPOBSummary();
}

// ─── Update Summary ───
function updatePPOBSummary() {
  const summaryEl = document.getElementById('ppobSummary');
  if (!summaryEl || !selectedProduct) {
    if (summaryEl) summaryEl.style.display = 'none';
    return;
  }
  
  const total = selectedProduct.price + selectedProduct.admin;
  summaryEl.style.display = 'block';
  summaryEl.innerHTML = `
    <div class="ppob-summary-row">
      <span>Produk:</span>
      <strong>${selectedProduct.name}</strong>
    </div>
    <div class="ppob-summary-row">
      <span>Harga:</span>
      <strong>${rp(selectedProduct.price)}</strong>
    </div>
    <div class="ppob-summary-row">
      <span>Biaya Admin:</span>
      <strong>${rp(selectedProduct.admin)}</strong>
    </div>
    <div class="ppob-summary-row total">
      <span>Total Bayar:</span>
      <strong>${rp(total)}</strong>
    </div>
  `;
}

// ─── Switch PPOB Type ───
function switchPPOBType(type) {
  selectedPPOBType = type;
  selectedProduct = null;
  
  // Update tab active state
  document.querySelectorAll('.ppob-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.ppob-tab[data-type="${type}"]`)?.classList.add('active');
  
  // Show/hide sections
  document.querySelectorAll('.ppob-section').forEach(s => s.style.display = 'none');
  document.getElementById('ppob-' + type)?.style.display = 'block';
  
  renderPPOBProducts();
}

// ─── Switch Provider ───
function switchProvider(provider) {
  selectedProvider = provider;
  selectedProduct = null;
  
  document.querySelectorAll('.provider-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.provider-btn[data-provider="${provider}"]`)?.classList.add('active');
  
  renderPPOBProducts();
}

// ─── Phone Input Handler ───
function handlePhoneInput(input) {
  const phone = input.value.replace(/\D/g, '');
  
  if (phone.length >= 4) {
    const provider = detectProvider(phone);
    if (provider && ['telkomsel', 'xl', 'indosat'].includes(provider)) {
      switchProvider(provider);
      showToast(`Provider terdeteksi: ${provider.toUpperCase()}`, 'toast-info', 2000);
    }
  }
}

// ─── Process PPOB Purchase ───
async function processPPOB() {
  const type = selectedPPOBType;
  
  // Validation
  let target = '';
  if (type === 'pulsa' || type === 'data') {
    target = document.getElementById('ppob_phone')?.value.trim();
    if (!target || target.length < 10) {
      showToast('Nomor HP tidak valid', 'toast-err');
      return;
    }
  } else if (type === 'pln') {
    target = document.getElementById('ppob_pln_id')?.value.trim();
    if (!target || target.length < 11) {
      showToast('ID Pelanggan PLN tidak valid', 'toast-err');
      return;
    }
  }
  
  if (!selectedProduct) {
    showToast('Pilih produk terlebih dahulu', 'toast-err');
    return;
  }
  
  const paymentMethod = document.getElementById('ppob_payment')?.value || 'simpanan_sukarela';
  const total = selectedProduct.price + selectedProduct.admin;
  
  // Check balance
  const simpanan = getSimpanan();
  if (paymentMethod === 'simpanan_sukarela' && simpanan.sukarela < total) {
    showToast('Saldo simpanan sukarela tidak cukup', 'toast-err');
    return;
  }
  
  // Confirmation
  const providerName = selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1);
  const confirmMsg = `Konfirmasi pembelian:\n\n${selectedProduct.name}\n${providerName} - ${target}\n\nTotal: ${rp(total)}\n\nLanjutkan?`;
  
  if (!confirm(confirmMsg)) return;
  
  // Show loading
  showToast('⏳ Memproses transaksi...', 'toast-info', 5000);
  
  // Simulate API call
  setTimeout(() => {
    // Mock success response
    const trxId = 'PPOB-' + String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0');
    const token = type === 'pln' ? generatePLNToken() : null;
    
    // Add to transaction history
    PPOB_TRANSACTIONS.unshift({
      id: trxId,
      type,
      provider: providerName,
      target,
      product: selectedProduct.name,
      amount: total,
      payment: paymentMethod,
      status: 'success',
      date: today(),
      token
    });
    
    // Deduct balance (in real app, this would be done by backend)
    if (paymentMethod === 'simpanan_sukarela') {
      SIMPANAN_DB[USER.nik].sukarela -= total;
      renderSaldoWidget();
    }
    
    // Show success with token
    if (token) {
      showPLNTokenModal(trxId, token, total);
    } else {
      showToast(`✅ Transaksi ${trxId} berhasil!`, 'toast-ok');
    }
    
    // Reset form
    resetPPOBForm();
    
    // Refresh history if on that section
    renderPPOBHistory();
    
  }, 2000);
}

// ─── Generate Mock PLN Token ───
function generatePLNToken() {
  const segments = [];
  for (let i = 0; i < 5; i++) {
    segments.push(String(Math.floor(Math.random() * 10000)).padStart(4, '0'));
  }
  return segments.join('-');
}

// ─── Show PLN Token Modal ───
function showPLNTokenModal(trxId, token, amount) {
  const modal = document.getElementById('plnTokenModal');
  if (!modal) return;
  
  document.getElementById('plnTrxId').textContent = trxId;
  document.getElementById('plnTokenCode').textContent = token;
  document.getElementById('plnAmount').textContent = rp(amount);
  
  modal.classList.add('show');
}

function closePLNTokenModal() {
  document.getElementById('plnTokenModal')?.classList.remove('show');
}

function copyPLNToken() {
  const token = document.getElementById('plnTokenCode').textContent;
  navigator.clipboard.writeText(token).then(() => {
    showToast('✅ Token berhasil disalin!', 'toast-ok');
  });
}

// ─── Reset Form ───
function resetPPOBForm() {
  selectedProduct = null;
  const phoneInput = document.getElementById('ppob_phone');
  const plnInput = document.getElementById('ppob_pln_id');
  if (phoneInput) phoneInput.value = '';
  if (plnInput) plnInput.value = '';
  renderPPOBProducts();
  updatePPOBSummary();
}

// ─── Render PPOB History ───
function renderPPOBHistory() {
  const tbody = document.getElementById('tbPPOBHistory');
  if (!tbody) return;
  
  if (!PPOB_TRANSACTIONS.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--muted)">Belum ada transaksi PPOB</td></tr>';
    return;
  }
  
  tbody.innerHTML = PPOB_TRANSACTIONS.map((t, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${t.date}</td>
      <td>
        <div style="font-weight:600">${t.id}</div>
        <div style="font-size:0.85rem;color:var(--muted)">${t.product}</div>
      </td>
      <td>${t.provider}</td>
      <td>${t.target}</td>
      <td style="font-weight:700;color:var(--primary)">${rp(t.amount)}</td>
      <td>
        <span class="badge ${t.status === 'success' ? 'badge-ok' : t.status === 'pending' ? 'badge-pending' : 'badge-err'}">
          ${t.status === 'success' ? 'Berhasil' : t.status === 'pending' ? 'Proses' : 'Gagal'}
        </span>
      </td>
      <td>
        ${t.token ? `<button class="btn-s" onclick="showTokenDetail('${t.id}')">Lihat Token</button>` : '-'}
      </td>
    </tr>
  `).join('');
}

function showTokenDetail(trxId) {
  const t = PPOB_TRANSACTIONS.find(x => x.id === trxId);
  if (!t || !t.token) return;
  
  alert(`Token PLN:\n\n${t.token}\n\nSalin dan masukkan ke meteran listrik Anda.`);
}

// ─── Init PPOB ───
function initPPOB() {
  // Set default tab
  switchPPOBType('pulsa');
  
  // Render initial products
  renderPPOBProducts();
  
  // Render history
  renderPPOBHistory();
}

// Export functions for global access
window.switchPPOBType = switchPPOBType;
window.switchProvider = switchProvider;
window.handlePhoneInput = handlePhoneInput;
window.selectPPOBProduct = selectPPOBProduct;
window.processPPOB = processPPOB;
window.closePLNTokenModal = closePLNTokenModal;
window.copyPLNToken = copyPLNToken;
window.showTokenDetail = showTokenDetail;
window.initPPOB = initPPOB;
