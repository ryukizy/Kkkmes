// ============================================
//  LOGIN.JS v3 — KopKar MES
//  Updated routing: admin → /admin/, karyawan → /karyawan/
// ============================================

// Redirect jika sudah login
const _existing = sessionStorage.getItem('kmes_user');
if (_existing) {
  try {
    const u = JSON.parse(_existing);
    location.href = u.role === 'admin' ? 'admin/dashboard.html' : 'karyawan/dashboard.html';
  } catch(e) { sessionStorage.removeItem('kmes_user'); }
}

const ACCOUNTS = [
  { nik:'1001',  password:'admin123',    nama:'Agus Susanto',    role:'admin',    dept:'Manajemen' },
  { nik:'1002',  password:'admin456',    nama:'Rina Marlina',    role:'admin',    dept:'Manajemen' },
  { nik:'29226', password:'karyawan123', nama:'Riski Hariyanto', role:'karyawan', dept:'Produksi'  },
  { nik:'2002',  password:'karyawan456', nama:'Siti Rahayu',     role:'karyawan', dept:'Keuangan'  },
  { nik:'2003',  password:'karyawan789', nama:'Ahmad Fauzi',     role:'karyawan', dept:'HRD'       },
];

// Toggle password visibility
document.getElementById('togglePw').addEventListener('click', () => {
  const inp  = document.getElementById('password');
  const show = document.getElementById('eyeShow');
  const hide = document.getElementById('eyeHide');
  if (inp.type === 'password') {
    inp.type = 'text';
    show.style.display = 'none';
    hide.style.display = '';
  } else {
    inp.type = 'password';
    show.style.display = '';
    hide.style.display = 'none';
  }
});

// Fill demo credentials
function fillDemo(nik, pw) {
  document.getElementById('nik').value      = nik;
  document.getElementById('password').value = pw;
  document.getElementById('nik').focus();
}

// Login submit
document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const nik  = document.getElementById('nik').value.trim();
  const pass = document.getElementById('password').value;
  const err  = document.getElementById('errBox');
  const btn  = document.getElementById('submitBtn');

  // Loading state
  document.getElementById('btnLabel').style.display = 'none';
  document.getElementById('btnSpin').style.display  = 'flex';
  document.getElementById('btnArrow').style.display = 'none';
  btn.disabled = true;
  err.style.display = 'none';

  setTimeout(() => {
    const acc = ACCOUNTS.find(a => a.nik === nik && a.password === pass);
    if (acc) {
      sessionStorage.setItem('kmes_user', JSON.stringify({
        nik: acc.nik, nama: acc.nama, role: acc.role, dept: acc.dept,
        loginAt: new Date().toISOString()
      }));
      // ── ROUTING: Admin → admin/, Karyawan → karyawan/ ──
      if (acc.role === 'admin') {
        location.href = 'admin/dashboard.html';
      } else {
        location.href = 'karyawan/dashboard.html';
      }
    } else {
      document.getElementById('errText').textContent = 'NIK atau Password salah. Silakan coba lagi.';
      err.style.display = 'flex';
      const card = document.querySelector('.login-card');
      card.style.animation = 'none';
      card.offsetHeight;
      card.style.animation = 'shake 0.4s ease';
      document.getElementById('btnLabel').style.display = '';
      document.getElementById('btnSpin').style.display  = 'none';
      document.getElementById('btnArrow').style.display = '';
      btn.disabled = false;
    }
  }, 650);
});

const s = document.createElement('style');
s.textContent = `@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}`;
document.head.appendChild(s);
