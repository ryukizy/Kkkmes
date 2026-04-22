// ============================================
//  SIGNATURE.JS — KopKar MES
//  E-Signature & PIN Authentication
// ============================================

// ─── Canvas Signature Setup ───
let signatureCanvas = null;
let signatureCtx = null;
let isDrawing = false;
let hasSignature = false;

function initSignatureCanvas(canvasId = 'signatureCanvas') {
  signatureCanvas = document.getElementById(canvasId);
  if (!signatureCanvas) return;
  
  signatureCtx = signatureCanvas.getContext('2d');
  signatureCtx.strokeStyle = '#000';
  signatureCtx.lineWidth = 2;
  signatureCtx.lineCap = 'round';
  signatureCtx.lineJoin = 'round';
  
  // Mouse events
  signatureCanvas.addEventListener('mousedown', startDrawing);
  signatureCanvas.addEventListener('mousemove', draw);
  signatureCanvas.addEventListener('mouseup', stopDrawing);
  signatureCanvas.addEventListener('mouseout', stopDrawing);
  
  // Touch events for mobile
  signatureCanvas.addEventListener('touchstart', handleTouchStart);
  signatureCanvas.addEventListener('touchmove', handleTouchMove);
  signatureCanvas.addEventListener('touchend', stopDrawing);
}

function startDrawing(e) {
  isDrawing = true;
  hasSignature = true;
  const rect = signatureCanvas.getBoundingClientRect();
  signatureCtx.beginPath();
  signatureCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function draw(e) {
  if (!isDrawing) return;
  const rect = signatureCanvas.getBoundingClientRect();
  signatureCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
  signatureCtx.stroke();
}

function stopDrawing() {
  isDrawing = false;
  signatureCtx.beginPath();
}

function handleTouchStart(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent('mousedown', {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  signatureCanvas.dispatchEvent(mouseEvent);
}

function handleTouchMove(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent('mousemove', {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  signatureCanvas.dispatchEvent(mouseEvent);
}

function clearSignature() {
  if (!signatureCanvas || !signatureCtx) return;
  signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
  hasSignature = false;
}

function getSignatureData() {
  if (!signatureCanvas || !hasSignature) return null;
  return signatureCanvas.toDataURL('image/png');
}

// ─── PIN Input Handler ───
function initPINInput() {
  const pinInputs = document.querySelectorAll('.pin-digit');
  
  pinInputs.forEach((input, index) => {
    // Auto-focus next input on fill
    input.addEventListener('input', (e) => {
      const value = e.target.value;
      
      // Only allow numbers
      if (!/^\d$/.test(value)) {
        e.target.value = '';
        return;
      }
      
      // Move to next input
      if (value.length === 1 && index < pinInputs.length - 1) {
        pinInputs[index + 1].focus();
      }
    });
    
    // Backspace handling
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        pinInputs[index - 1].focus();
        pinInputs[index - 1].value = '';
      }
    });
    
    // Paste handling
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = e.clipboardData.getData('text').replace(/\D/g, '');
      
      for (let i = 0; i < Math.min(pasteData.length, pinInputs.length - index); i++) {
        pinInputs[index + i].value = pasteData[i];
      }
      
      const lastFilledIndex = Math.min(index + pasteData.length, pinInputs.length - 1);
      pinInputs[lastFilledIndex].focus();
    });
  });
}

function getPINValue() {
  const pinInputs = document.querySelectorAll('.pin-digit');
  let pin = '';
  pinInputs.forEach(input => {
    pin += input.value || '';
  });
  return pin;
}

function clearPIN() {
  document.querySelectorAll('.pin-digit').forEach(input => {
    input.value = '';
  });
  document.querySelector('.pin-digit')?.focus();
}

function validatePIN(pin) {
  return /^\d{6}$/.test(pin);
}

// ─── PIN Modal Management ───
function showPINModal(options = {}) {
  const {
    title = '🔐 Verifikasi PIN',
    message = 'Masukkan PIN 6 digit untuk melanjutkan',
    requireSignature = false,
    onSubmit = null
  } = options;
  
  const modal = document.getElementById('pinModal');
  if (!modal) {
    console.error('PIN Modal not found');
    return;
  }
  
  // Update content
  const titleEl = modal.querySelector('.pin-modal-title');
  const messageEl = modal.querySelector('.pin-modal-message');
  const signatureSection = modal.querySelector('.signature-section');
  
  if (titleEl) titleEl.textContent = title;
  if (messageEl) messageEl.textContent = message;
  if (signatureSection) {
    signatureSection.style.display = requireSignature ? 'block' : 'none';
  }
  
  // Clear previous input
  clearPIN();
  clearSignature();
  
  // Store callback
  modal._onSubmit = onSubmit;
  modal._requireSignature = requireSignature;
  
  // Show modal
  modal.classList.add('show');
  
  // Focus first PIN input
  setTimeout(() => {
    document.querySelector('.pin-digit')?.focus();
  }, 100);
}

function closePINModal() {
  const modal = document.getElementById('pinModal');
  if (!modal) return;
  
  modal.classList.remove('show');
  clearPIN();
  clearSignature();
  modal._onSubmit = null;
}

async function submitPINModal() {
  const modal = document.getElementById('pinModal');
  if (!modal) return;
  
  const pin = getPINValue();
  
  // Validate PIN
  if (!validatePIN(pin)) {
    showToast('PIN harus 6 digit angka', 'toast-err');
    return;
  }
  
  // Check signature if required
  if (modal._requireSignature && !hasSignature) {
    showToast('Tanda tangan digital diperlukan', 'toast-err');
    return;
  }
  
  // Get signature data
  const signatureData = modal._requireSignature ? getSignatureData() : null;
  
  // Call callback if exists
  if (typeof modal._onSubmit === 'function') {
    try {
      const result = await modal._onSubmit({ pin, signatureData });
      if (result !== false) {
        closePINModal();
      }
    } catch (error) {
      console.error('PIN submission error:', error);
      showToast('Terjadi kesalahan', 'toast-err');
    }
  } else {
    closePINModal();
  }
}

// ─── PIN Verification (Mock) ───
async function verifyPIN(pin) {
  // In real app, this would call backend API
  // For demo, we'll use a mock PIN: 123456
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock: Accept 123456 or any 6-digit PIN for demo
      const isValid = pin === '123456' || /^\d{6}$/.test(pin);
      resolve({
        success: isValid,
        message: isValid ? 'PIN valid' : 'PIN salah'
      });
    }, 500);
  });
}

// ─── PIN Setup ───
function showSetupPINModal() {
  const modal = document.getElementById('setupPINModal');
  if (!modal) return;
  
  clearPIN();
  modal.classList.add('show');
  
  setTimeout(() => {
    document.querySelector('#setupPINModal .pin-digit')?.focus();
  }, 100);
}

function closeSetupPINModal() {
  const modal = document.getElementById('setupPINModal');
  if (!modal) return;
  
  modal.classList.remove('show');
  clearPIN();
  
  // Clear confirm PIN
  document.querySelectorAll('.pin-confirm-digit').forEach(input => {
    input.value = '';
  });
}

async function submitSetupPIN() {
  const pinInputs = document.querySelectorAll('#setupPINModal .pin-digit');
  const confirmInputs = document.querySelectorAll('.pin-confirm-digit');
  
  let pin = '';
  let confirmPin = '';
  
  pinInputs.forEach(input => { pin += input.value || ''; });
  confirmInputs.forEach(input => { confirmPin += input.value || ''; });
  
  // Validate
  if (!validatePIN(pin)) {
    showToast('PIN harus 6 digit angka', 'toast-err');
    return;
  }
  
  if (pin !== confirmPin) {
    showToast('PIN tidak cocok', 'toast-err');
    return;
  }
  
  // Show loading
  showToast('⏳ Menyimpan PIN...', 'toast-info');
  
  // Mock API call
  setTimeout(() => {
    // In real app, save to backend
    localStorage.setItem('user_pin', pin); // Demo only!
    
    showToast('✅ PIN berhasil diatur!', 'toast-ok');
    closeSetupPINModal();
  }, 1000);
}

// ─── Digital Approval Log ───
function logDigitalApproval(data) {
  const log = {
    timestamp: new Date().toISOString(),
    nik: USER.nik,
    nama: USER.nama,
    type: data.type,
    reference_id: data.reference_id,
    has_signature: !!data.signatureData,
    ip_address: 'mock-ip', // In real app, get from backend
    user_agent: navigator.userAgent
  };
  
  // In real app, send to backend
  console.log('Digital Approval Logged:', log);
  
  // Store locally for demo
  const logs = JSON.parse(localStorage.getItem('approval_logs') || '[]');
  logs.unshift(log);
  localStorage.setItem('approval_logs', JSON.stringify(logs.slice(0, 50))); // Keep last 50
  
  return log;
}

// ─── Export Functions ───
window.initSignatureCanvas = initSignatureCanvas;
window.clearSignature = clearSignature;
window.getSignatureData = getSignatureData;
window.initPINInput = initPINInput;
window.getPINValue = getPINValue;
window.clearPIN = clearPIN;
window.validatePIN = validatePIN;
window.showPINModal = showPINModal;
window.closePINModal = closePINModal;
window.submitPINModal = submitPINModal;
window.verifyPIN = verifyPIN;
window.showSetupPINModal = showSetupPINModal;
window.closeSetupPINModal = closeSetupPINModal;
window.submitSetupPIN = submitSetupPIN;
window.logDigitalApproval = logDigitalApproval;
