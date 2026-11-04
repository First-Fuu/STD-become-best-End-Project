/**
 * InternFlow — Core Application Logic (Concise & Clean)
 */
const KEYS = { users: 'internflow_users', session: 'internflow_session', logs: 'internflow_logs', reports: 'internflow_reports', departments: 'internflow_departments', theme: 'internflow_theme' };
const ROLE = { student: 'นักเรียน / ผู้ฝึกงาน', teacher: 'อาจารย์นิเทศก์', admin: 'ผู้ดูแลระบบ' };
const DEFAULT_DEPARTMENTS = ['เทคโนโลยีธุรกิจดิจิทัล', 'คอมพิวเตอร์กราฟิก', 'การโรงแรม', 'การบัญชี', 'การตลาด', 'การเลขานุการ', 'สามัญสัมพันธ์', 'ภาษาต่างประเทศ'];

// Utility Helpers
const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];
const read = (k, fb = []) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const departments = () => read(KEYS.departments, DEFAULT_DEPARTMENTS);
const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const esc = s => { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; };
const formatDate = d => d ? new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' }).format(new Date(`${d}T00:00:00`)) : '';
const safeUrl = u => { try { const r = String(u || '').trim(); return r ? new URL(/^https?:\/\//i.test(r) ? r : `https://${r}`).href : ''; } catch { return ''; } };
const today = () => new Date().toISOString().slice(0, 10);
const currentUser = () => read(KEYS.users).find(u => u.id === read(KEYS.session, null)) || null;

// Toast & Theme
let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

function setTheme(theme) {
  document.body.classList.toggle('light', theme === 'light');
  localStorage.setItem(KEYS.theme, theme);
  const icon = theme === 'light' ? '☾' : '☼';
  if ($('#theme-toggle')) $('#theme-toggle').textContent = icon;
  if ($('#auth-theme-toggle')) $('#auth-theme-toggle').textContent = icon;
}

const initials = name => name.trim().split(/\s+/).slice(0, 2).map(v => v[0]).join('').toUpperCase() || '?';

// Auth Controls
function switchAuthTab(tab) {
  $('#login-panel')?.classList.toggle('hidden', tab !== 'login');
  $('#register-panel')?.classList.toggle('hidden', tab !== 'register');
  $$('[data-auth-tab]').forEach(btn => btn.classList.toggle('active', btn.dataset.authTab === tab));
}

function renderDepartmentOptions() {
  const sel = $('#register-department');
  if (sel) sel.innerHTML = '<option value="">เลือกแผนกวิชา / สาขา</option>' + departments().map(d => `<option value="${esc(d)}">${esc(d)}</option>`).join('');
}

renderDepartmentOptions();
$$('[data-auth-tab]').forEach(btn => btn.addEventListener('click', () => switchAuthTab(btn.dataset.authTab)));
$('#auth-theme-toggle')?.addEventListener('click', () => setTheme(document.body.classList.contains('light') ? 'dark' : 'light'));
$('#landing-scroll-top')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// Demo Logins
const DEMO_ACCOUNTS = {
  student: ['student@internflow.local', 'Student@InternFlow2026'],
  teacher: ['teacher@internflow.local', 'Teacher@InternFlow2026'],
  admin: ['admin@internflow.local', 'Admin@InternFlow2026']
};
$$('[data-demo]').forEach(btn => btn.addEventListener('click', () => {
  const [email, pwd] = DEMO_ACCOUNTS[btn.dataset.demo];
  switchAuthTab('login');
  $('#login-email').value = email; $('#login-password').value = pwd; $('#login-email').focus();
  toast(`กรอกข้อมูลบัญชี${btn.textContent.trim()} ให้แล้ว กดเข้าสู่ระบบได้เลย`);
}));

// Password Toggle & Auth Submit
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-password-toggle]');
  if (!btn) return;
  const input = $(`#${btn.dataset.passwordToggle}`);
  input.type = input.type === 'password' ? 'text' : 'password';
});

$('#login-form').addEventListener('submit', e => {
  e.preventDefault();
  const email = $('#login-email').value.trim().toLowerCase();
  const user = read(KEYS.users).find(u => u.email === email && u.password === $('#login-password').value);
  if (!user) return toast('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  save(KEYS.session, user.id); showApp();
});

$('#register-form').addEventListener('submit', e => {
  e.preventDefault();
  const email = $('#register-email').value.trim().toLowerCase();
  const users = read(KEYS.users);
  if (users.some(u => u.email === email)) return toast('อีเมลนี้ถูกใช้งานแล้ว');
  const user = { id: uid(), name: $('#register-name').value.trim(), email, department: $('#register-department').value, password: $('#register-password').value, role: 'student', createdAt: new Date().toISOString() };
  users.push(user); save(KEYS.users, users); save(KEYS.session, user.id);
  showApp(); toast('สร้างบัญชีสำเร็จแล้ว');
});

$('#logout-button').addEventListener('click', () => {
  localStorage.removeItem(KEYS.session);
  $('#app-screen').classList.add('hidden'); $('#auth-screen').classList.remove('hidden');
  $('#login-form').reset(); switchAuthTab('login');
});

$('.user-menu')?.addEventListener('click', () => { activeView = 'settings'; renderNav(); renderView(); });
$('#theme-toggle').addEventListener('click', () => setTheme(document.body.classList.contains('light') ? 'dark' : 'light'));

// Navigation Icons & Menu Definitions
const svg = p => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICONS = {
  home: svg('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),
  daily: svg('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'),
  reports: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>'),
  review: svg('<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'),
  logs: svg('<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>'),
  users: svg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
  departments: svg('<rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="22.01"/><line x1="15" y1="22" x2="15" y2="22.01"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><line x1="9" y1="18" x2="9" y2="18.01"/><line x1="15" y1="18" x2="15" y2="18.01"/>'),
  settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>')
};

const menus = {
  student: [['home', ICONS.home, 'ภาพรวม'], ['daily', ICONS.daily, 'บันทึกงานประจำวัน'], ['reports', ICONS.reports, 'รายงานประจำสัปดาห์'], ['settings', ICONS.settings, 'ตั้งค่าบัญชี']],
  teacher: [['home', ICONS.home, 'ภาพรวม'], ['review', ICONS.review, 'ตรวจรายงานนักเรียน'], ['logs', ICONS.logs, 'บันทึกงานนักเรียน'], ['settings', ICONS.settings, 'ตั้งค่าบัญชี']],
  admin: [['home', ICONS.home, 'ภาพรวมระบบ'], ['review', ICONS.review, 'จัดการรายงาน'], ['logs', ICONS.logs, 'บันทึกงานทั้งหมด'], ['users', ICONS.users, 'จัดการบัญชี'], ['departments', ICONS.departments, 'จัดการแผนกวิชา'], ['settings', ICONS.settings, 'ตั้งค่าบัญชี']]
};

const pageInfo = {
  home: ['ภาพรวมการฝึกงาน', 'ติดตามข้อมูลและสถานะล่าสุดได้ในที่เดียว'],
  daily: ['บันทึกงานประจำวัน', 'บันทึกภารกิจของคุณในแต่ละวัน'],
  reports: ['รายงานประจำสัปดาห์', 'ส่งรายงานและติดตามผลการตรวจ'],
  review: ['ตรวจรายงานนักเรียน', 'ให้ความเห็น อนุมัติ หรือส่งกลับเพื่อแก้ไข'],
  logs: ['บันทึกงานทั้งหมด', 'ดูแลและจัดการข้อมูลการปฏิบัติงานทุกบัญชี'],
  users: ['จัดการบัญชีผู้ใช้งาน', 'กำหนดบทบาทและดูแลสิทธิ์ในระบบ'],
  departments: ['จัดการแผนกวิชา', 'เพิ่ม ลบ และติดตามจำนวนผู้ใช้งานในแต่ละแผนก'],
  settings: ['ตั้งค่าบัญชี', 'อัปเดตข้อมูลโปรไฟล์และความปลอดภัยของบัญชี']
};

let activeView = 'home';
function showApp() {
  const user = currentUser();
  if (!user) { $('#app-screen').classList.add('hidden'); $('#auth-screen').classList.remove('hidden'); return; }
  $('#auth-screen').classList.add('hidden'); $('#app-screen').classList.remove('hidden');
  $('#user-name').textContent = user.name;
  $('#user-avatar').innerHTML = user.avatar ? `<img src="${user.avatar}" alt="รูปโปรไฟล์">` : initials(user.name);
  $('#current-role').textContent = user.department ? `${ROLE[user.role]} · ${user.department}` : ROLE[user.role];
  activeView = 'home'; renderNav(); renderView();
}

function renderNav() {
  const user = currentUser();
  $('#sidebar').innerHTML = menus[user.role].map(([id, icon, lbl]) => `<button class="nav-btn ${id === activeView ? 'active' : ''}" data-view="${id}"><span class="nav-icon">${icon}</span><span>${lbl}</span></button>`).join('');
  $$('[data-view]').forEach(btn => btn.addEventListener('click', () => { activeView = btn.dataset.view; renderNav(); renderView(); }));
}

function renderView() {
  const [title, sub] = pageInfo[activeView];
  $('#page-title').textContent = title; $('#page-subtitle').textContent = sub;
  $('#content').innerHTML = `<div class="view">${views[activeView]()}</div>`;
  bindView();
}

// Views
const views = {
  home() {
    const user = currentUser(), logs = read(KEYS.logs), reports = read(KEYS.reports);
    const ownLogs = logs.filter(l => l.userId === user.id), ownReports = reports.filter(r => r.userId === user.id);
    if (user.role === 'student') {
      const totalHours = ownLogs.reduce((s, l) => s + (Number(l.hours) || 8), 0), targetHours = 320;
      const percent = Math.min(100, Math.round((totalHours / targetHours) * 100));
      return `
        <div class="stats">
          <div class="stat"><div class="stat-label">ชั่วโมงฝึกงานสะสม</div><div class="stat-value stat-accent">${totalHours} <span style="font-size:1rem;font-weight:600;color:var(--muted);">/ ${targetHours} ชม.</span></div></div>
          <div class="stat"><div class="stat-label">บันทึกงานทั้งหมด</div><div class="stat-value">${ownLogs.length} วัน</div></div>
          <div class="stat"><div class="stat-label">รายงานที่ส่งแล้ว</div><div class="stat-value">${ownReports.length}</div></div>
          <div class="stat"><div class="stat-label">รอตรวจ / ให้แก้ไข</div><div class="stat-value">${ownReports.filter(r => r.status !== 'approved').length}</div></div>
        </div>
        <div class="card workplace-card">
          ${user.workplace ? `
            <div class="workplace-header">
              <div><span class="workplace-tag">สถานที่ฝึกงานปัจจุบัน</span><h3 class="workplace-title">${esc(user.workplace)}</h3></div>
              <div class="workplace-actions">
                ${safeUrl(user.workplaceMap) ? `<a href="${esc(safeUrl(user.workplaceMap))}" target="_blank" rel="noopener noreferrer" class="btn btn-small btn-map">เปิดแผนที่ Google Maps ↗</a>` : ''}
                <button class="btn btn-outline btn-small" data-go="settings">แก้ไขข้อมูล</button>
              </div>
            </div>
          ` : `
            <div class="workplace-empty">
              <div><strong>ยังไม่ได้ระบุสถานที่ฝึกงาน</strong><div style="font-size:.78rem;margin-top:2px;">ระบุชื่อบริษัทและลิงก์ Google Maps เพื่อให้อาจารย์ติดตามการฝึกงานได้</div></div>
              <button class="btn btn-primary btn-small" data-go="settings">+ ระบุสถานที่ฝึกงาน</button>
            </div>
          `}
          <div class="hours-progress-box">
            <div class="progress-meta"><span>ความคืบหน้าชั่วโมงฝึกงาน: <strong>${totalHours} ชม. (${percent}%)</strong> จากเป้าหมาย ${targetHours} ชม.</span><strong>${percent}%</strong></div>
            <div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div>
          </div>
        </div>
        <div class="card">
          <div class="card-title-row"><div><h2>สถานะรายงานล่าสุด</h2><p class="card-subtitle">ความเห็นจากอาจารย์จะปรากฏที่นี่</p></div><button class="btn btn-outline btn-small" data-go="reports">ดูรายงานทั้งหมด</button></div>
          ${renderReports(ownReports, false)}
        </div>`;
    }
    const students = read(KEYS.users).filter(u => u.role === 'student');
    return `
      <div class="stats">
        <div class="stat"><div class="stat-label">นักเรียนในระบบ</div><div class="stat-value stat-accent">${students.length}</div></div>
        <div class="stat"><div class="stat-label">รายงานรอตรวจ</div><div class="stat-value">${reports.filter(r => r.status === 'pending').length}</div></div>
        <div class="stat"><div class="stat-label">บันทึกงานทั้งหมด</div><div class="stat-value">${logs.length}</div></div>
      </div>
      <div class="card">
        <div class="card-title-row"><div><h2>${user.role === 'teacher' ? 'รายงานที่ต้องตรวจ' : 'รายการรายงานล่าสุด'}</h2><p class="card-subtitle">ตรวจสอบและติดตามความคืบหน้าได้รวดเร็ว</p></div><button class="btn btn-outline btn-small" data-go="review">ไปยังหน้ารายงาน</button></div>
        ${renderReports(reports.filter(r => r.status === 'pending').slice(0, 5), false, true)}
      </div>`;
  },

  daily() {
    return `
      <div class="card">
        <div class="card-title-row"><div><h2>เพิ่มบันทึกการปฏิบัติงาน</h2><p class="card-subtitle">ข้อมูลจะปรากฏในบัญชีของคุณเท่านั้น</p></div></div>
        <form id="daily-form">
          <div class="two-col">
            <div><label for="log-date">วันที่ปฏิบัติงาน <span class="required">*</span></label><input id="log-date" class="input" type="date" required value="${today()}"></div>
            <div><label for="log-location">แผนก / จุดที่ปฏิบัติงาน <span class="required">*</span></label><input id="log-location" class="input" maxlength="120" required placeholder="เช่น แผนกเทคโนโลยีสารสนเทศ"></div>
          </div>
          <div style="margin-top:15px">
            <label for="log-hours">วันนี้ฝึกงานกี่ชั่วโมง? <span class="required">*</span></label>
            <div class="hours-selector">
              <div class="hour-chips">${[4, 6, 7, 8, 9].map(h => `<button class="hour-chip ${h === 8 ? 'active' : ''}" type="button" data-hours="${h}">${h} ชม.</button>`).join('')}</div>
              <div class="hour-input-wrap"><input id="log-hours" class="input" type="number" min="0.5" max="24" step="0.5" required value="8"><span class="hour-unit">ชั่วโมง</span></div>
            </div>
          </div>
          <div style="margin-top:15px"><label for="log-detail">รายละเอียดงานที่ปฏิบัติ <span class="required">*</span></label><textarea id="log-detail" required maxlength="2000" placeholder="อธิบายงานที่รับผิดชอบ สิ่งที่ได้เรียนรู้ หรือปัญหาที่พบ..."></textarea></div>
          <div style="margin-top:15px"><label for="log-image">แนบรูปภาพประกอบ <span class="muted">(ไม่บังคับ, ไม่เกิน 10 MB)</span></label><input id="log-image" class="input" type="file" accept="image/*"><div id="image-preview-wrap" class="preview"><img id="image-preview" alt="ตัวอย่าง"></div></div>
          <div class="form-actions"><button class="btn btn-primary" type="submit">บันทึกข้อมูล</button></div>
        </form>
      </div>`;
  },

  reports() {
    const reports = read(KEYS.reports).filter(r => r.userId === currentUser().id);
    return `
      <div class="card">
        <div class="card-title-row"><div><h2>ส่งรายงานประจำสัปดาห์</h2><p class="card-subtitle">อาจารย์จะตรวจและแจ้งผลผ่านระบบ</p></div></div>
        <form id="report-form">
          <div><label for="report-week">สัปดาห์ที่ <span class="required">*</span></label><select id="report-week">${Array.from({ length: 16 }, (_, i) => `<option value="${i + 1}">สัปดาห์ที่ ${i + 1}</option>`).join('')}</select></div>
          <div style="margin-top:15px"><label for="report-summary">สรุปผลการทำงานและความรู้ที่ได้รับ <span class="required">*</span></label><textarea id="report-summary" required maxlength="3000" placeholder="สรุปงานที่ทำ ปัญหาที่พบ และสิ่งที่ได้เรียนรู้..."></textarea></div>
          <div style="margin-top:15px"><label for="report-link">ลิงก์ไฟล์หรือผลงาน <span class="muted">(ไม่บังคับ)</span></label><input id="report-link" class="input" type="url" maxlength="2000" placeholder="เช่น Google Drive หรือ GitHub"></div>
          <div class="form-actions"><button class="btn btn-primary" type="submit">ส่งรายงาน</button></div>
        </form>
      </div>
      <div class="card"><div class="card-title-row"><div><h2>รายงานของฉัน</h2><p class="card-subtitle">${reports.length} รายการ</p></div></div>${renderReports(reports, true)}</div>`;
  },

  review() {
    return `
      <div class="card">
        <div class="card-title-row"><div><h2>รายงานที่นักเรียนส่ง</h2><p class="card-subtitle">ระบุข้อเสนอแนะก่อนส่งกลับเพื่อแก้ไขได้</p></div></div>
        <div class="filter-bar">
          <input id="report-search" class="input" placeholder="ค้นหาชื่อ หรือเนื้อหา">
          <select id="report-dept-filter"><option value="all">ทุกแผนกวิชา</option>${departments().map(d => `<option value="${esc(d)}">${esc(d)}</option>`).join('')}</select>
          <select id="report-status-filter"><option value="all">ทุกสถานะ</option><option value="pending">รอตรวจ</option><option value="revision">รอแก้ไข</option><option value="approved">อนุมัติแล้ว</option></select>
        </div>
        <div id="review-list">${renderReviewReports()}</div>
      </div>`;
  },

  logs() {
    return `
      <div class="card">
        <div class="card-title-row"><div><h2>บันทึกงานทุกบัญชี</h2><p class="card-subtitle">ผู้ดูแลระบบสามารถลบรายการที่ไม่ถูกต้องได้</p></div></div>
        <div class="filter-bar"><input id="log-search" class="input" placeholder="ค้นหาชื่อ แผนก หรือรายละเอียด"><input id="log-date-filter" class="input" type="date"></div>
        <div id="admin-log-list">${renderLogs(read(KEYS.logs), true)}</div>
      </div>`;
  },

  settings() {
    const user = currentUser();
    return `
      <div class="settings-grid">
        <div class="card">
          <div class="card-title-row"><div><h2>ข้อมูลโปรไฟล์</h2><p class="card-subtitle">ข้อมูลนี้จะแสดงในส่วนหัวของระบบ</p></div></div>
          <form id="profile-form">
            <div class="avatar-edit-section">
              <div id="settings-avatar" class="avatar-large">${user.avatar ? `<img src="${user.avatar}" alt="โปรไฟล์">` : initials(user.name)}</div>
              <div class="avatar-edit-actions">
                <label for="profile-avatar">รูปโปรไฟล์</label>
                <div class="avatar-btn-row">
                  <input id="profile-avatar" class="input" type="file" accept="image/*">
                  ${user.avatar ? '<button class="btn btn-outline btn-small" type="button" id="remove-avatar">ลบรูป</button>' : ''}
                </div>
              </div>
            </div>
            <div style="margin-top:18px"><label for="profile-name">ชื่อที่แสดง <span class="required">*</span></label><input id="profile-name" class="input" required maxlength="80" value="${esc(user.name)}"></div>
            <div style="margin-top:15px"><label>อีเมล</label><div class="static-field">${esc(user.email)}</div></div>
            <div style="margin-top:15px"><label for="profile-department">แผนกวิชา / สาขา</label><select id="profile-department" class="input"><option value="">ไม่ระบุแผนก</option>${departments().map(d => `<option value="${esc(d)}" ${user.department === d ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select></div>
            ${user.role === 'student' ? `
              <div style="margin-top:15px"><label for="profile-workplace">สถานที่ฝึกงาน / ชื่อบริษัท</label><input id="profile-workplace" class="input" maxlength="160" value="${esc(user.workplace || '')}"></div>
              <div style="margin-top:15px"><label for="profile-workplace-map">ลิงก์ Google Maps</label><input id="profile-workplace-map" class="input" type="url" maxlength="2000" value="${esc(user.workplaceMap || '')}"></div>
            ` : ''}
            <div class="form-actions"><button class="btn btn-primary" type="submit">บันทึกโปรไฟล์</button></div>
          </form>
        </div>
        <div class="card">
          <div class="card-title-row"><div><h2>เปลี่ยนรหัสผ่าน</h2><p class="card-subtitle">ความปลอดภัยของบัญชีผู้ใช้</p></div></div>
          <form id="password-form" class="form-grid">
            <div><label for="current-password">รหัสผ่านปัจจุบัน <span class="required">*</span></label><input id="current-password" class="input" type="password" required></div>
            <div><label for="new-password">รหัสผ่านใหม่ <span class="required">*</span></label><input id="new-password" class="input" type="password" minlength="6" required></div>
            <div><label for="confirm-password">ยืนยันรหัสผ่านใหม่ <span class="required">*</span></label><input id="confirm-password" class="input" type="password" minlength="6" required></div>
            <div class="form-actions"><button class="btn btn-primary" type="submit">เปลี่ยนรหัสผ่าน</button></div>
          </form>
        </div>
      </div>`;
  },

  users() {
    const users = read(KEYS.users);
    return `
      <div class="card">
        <div class="card-title-row"><div><h2>บัญชีผู้ใช้</h2><p class="card-subtitle">ปรับเปลี่ยนบทบาท หรือเอาบัญชีออกจากระบบ</p></div><span class="role-pill">${users.length} บัญชี</span></div>
        <div class="table-wrap"><table>
          <thead><tr><th>ชื่อ</th><th>อีเมล</th><th>บทบาท</th><th>แผนก</th><th>วันที่สมัคร</th><th></th></tr></thead>
          <tbody>${users.map(u => `
            <tr>
              <td><b>${esc(u.name)}</b></td><td>${esc(u.email)}</td>
              <td><select class="role-select" data-user-role="${u.id}">${Object.entries(ROLE).map(([r, l]) => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${l}</option>`).join('')}</select></td>
              <td><select class="role-select" data-user-department="${u.id}"><option value="">ไม่ระบุแผนก</option>${departments().map(d => `<option value="${esc(d)}" ${u.department === d ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select></td>
              <td>${formatDate(u.createdAt.slice(0, 10))}</td>
              <td>${u.id === currentUser().id ? '<span class="muted">บัญชีคุณ</span>' : `<button class="btn btn-danger btn-small" data-delete-user="${u.id}">ลบ</button>`}</td>
            </tr>`).join('')}</tbody>
        </table></div>
      </div>`;
  },

  departments() {
    const depts = departments(), users = read(KEYS.users);
    return `
      <div class="card">
        <div class="card-title-row"><div><h2>เพิ่มแผนกวิชาใหม่</h2><p class="card-subtitle">สร้างแผนกวิชาเพื่อให้นักเรียนและอาจารย์เลือกสังกัด</p></div></div>
        <form id="add-dept-form" style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
          <div style="flex:1;min-width:240px;"><label for="new-dept-name">ชื่อแผนกวิชา / สาขา <span class="required">*</span></label><input id="new-dept-name" class="input" required maxlength="100"></div>
          <button class="btn btn-primary" type="submit">เพิ่มแผนกวิชา</button>
        </form>
      </div>
      <div class="card">
        <div class="card-title-row"><div><h2>รายการแผนกวิชาในระบบ</h2><p class="card-subtitle">ทั้งหมด ${depts.length} แผนกวิชา</p></div></div>
        <div class="table-wrap"><table>
          <thead><tr><th style="width:50px">ลำดับ</th><th>ชื่อแผนกวิชา</th><th>นักเรียน</th><th>อาจารย์</th><th>การจัดการ</th></tr></thead>
          <tbody>${depts.map((d, i) => `
            <tr>
              <td>${i + 1}</td><td><b>${esc(d)}</b></td>
              <td><span class="role-pill">${users.filter(u => u.role === 'student' && u.department === d).length} คน</span></td>
              <td><span class="role-pill">${users.filter(u => u.role === 'teacher' && u.department === d).length} คน</span></td>
              <td><button class="btn btn-danger btn-small" data-delete-dept="${esc(d)}">ลบ</button></td>
            </tr>`).join('')}</tbody>
        </table></div>
      </div>`;
  }
};

// Render Helpers
const userFor = id => read(KEYS.users).find(u => u.id === id);
const statusLabel = s => s === 'approved' ? 'อนุมัติแล้ว' : s === 'revision' ? 'ส่งกลับให้แก้ไข' : 'รอตรวจ';

function renderReports(reports, showDel = false, incStudent = false) {
  if (!reports.length) return '<div class="empty">ยังไม่มีรายงานในส่วนนี้</div>';
  return `<div class="list">${[...reports].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).map(r => {
    const stu = userFor(r.userId);
    return `
      <article class="entry">
        <div class="entry-body">
          <div class="entry-meta">
            ${incStudent && stu ? `<strong>${esc(stu.name)}</strong><span>•</span>` : ''}
            <strong>รายงานสัปดาห์ที่ ${esc(r.week)}</strong><span>•</span>
            <span>${formatDate(r.submittedAt.slice(0, 10))}</span>
            <span class="report-status ${r.status}">${statusLabel(r.status)}</span>
          </div>
          ${incStudent && stu?.workplace ? `<div style="margin:6px 0 2px;font-size:0.78rem;color:var(--muted);display:flex;align-items:center;gap:8px;"><span>ฝึกงานที่: ${esc(stu.workplace)}</span>${safeUrl(stu.workplaceMap) ? `<a href="${esc(safeUrl(stu.workplaceMap))}" target="_blank" class="link-chip" style="padding:2px 8px;font-size:0.72rem;">แผนที่ ↗</a>` : ''}</div>` : ''}
          <div class="entry-text">${esc(r.summary)}</div>
          ${safeUrl(r.link) ? `<div class="report-attachment"><a class="link-chip" href="${esc(safeUrl(r.link))}" target="_blank"><span>ไฟล์หรือผลงานที่แนบ</span><span class="link-chip-text">${esc(r.link)}</span><span class="external-icon">↗</span></a></div>` : ''}
          ${r.feedback ? `<div class="feedback"><b>ความเห็นจากอาจารย์:</b> ${esc(r.feedback)}</div>` : ''}
        </div>
        ${showDel ? `<div class="entry-actions"><button class="btn btn-danger btn-small" data-delete-report="${r.id}">ลบ</button></div>` : ''}
      </article>`;
  }).join('')}</div>`;
}

function renderReviewReports() {
  const query = $('#report-search')?.value.trim().toLowerCase() || '', status = $('#report-status-filter')?.value || 'all', dept = $('#report-dept-filter')?.value || 'all';
  const list = read(KEYS.reports).filter(r => {
    const stu = userFor(r.userId);
    return (dept === 'all' || stu?.department === dept) && (status === 'all' || r.status === status) && (`${stu?.name || ''} ${stu?.department || ''} ${r.summary} ${r.week}`).toLowerCase().includes(query);
  });
  if (!list.length) return '<div class="empty">ไม่พบรายงานตามเงื่อนไขที่เลือก</div>';
  return `<div class="list">${list.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).map(r => {
    const stu = userFor(r.userId);
    return `
      <article class="entry">
        <div class="entry-body">
          <div class="entry-meta"><strong>${esc(stu?.name || 'ไม่พบบัญชี')}</strong>${stu?.department ? `<span>•</span><span class="role-pill">${esc(stu.department)}</span>` : ''}<span>•</span><strong>สัปดาห์ที่ ${esc(r.week)}</strong><span class="report-status ${r.status}">${statusLabel(r.status)}</span></div>
          ${stu?.workplace ? `<div style="margin:6px 0 2px;font-size:0.78rem;color:var(--muted);display:flex;align-items:center;gap:8px;"><span>ฝึกงานที่: <strong>${esc(stu.workplace)}</strong></span>${safeUrl(stu.workplaceMap) ? `<a href="${esc(safeUrl(stu.workplaceMap))}" target="_blank" class="link-chip" style="padding:2px 8px;font-size:0.72rem;">แผนที่ Google Maps ↗</a>` : ''}</div>` : ''}
          <div class="entry-text">${esc(r.summary)}</div>
          ${safeUrl(r.link) ? `<div class="report-attachment"><a class="link-chip" href="${esc(safeUrl(r.link))}" target="_blank"><span>ไฟล์หรือผลงานที่แนบ</span><span class="link-chip-text">${esc(r.link)}</span><span class="external-icon">↗</span></a></div>` : ''}
          ${r.feedback ? `<div class="feedback"><b>ความเห็นเดิม:</b> ${esc(r.feedback)}</div>` : ''}
          <div class="review-controls">
            <div class="review-status-col">
              <label style="font-size:0.75rem;margin-bottom:4px;color:var(--muted);display:block;">สถานะรายงาน</label>
              <select data-review-status="${r.id}" class="input" style="padding:7px 10px;font-weight:600;"><option value="pending" ${r.status === 'pending' ? 'selected' : ''}>รอตรวจ</option><option value="approved" ${r.status === 'approved' ? 'selected' : ''}>อนุมัติรายงาน</option><option value="revision" ${r.status === 'revision' ? 'selected' : ''}>ส่งกลับให้แก้ไข</option></select>
            </div>
            <div class="review-feedback-col">
              <label style="font-size:0.75rem;margin-bottom:4px;color:var(--muted);display:block;">ข้อเสนอแนะถึงนักเรียน</label>
              <input class="input" data-review-feedback="${r.id}" maxlength="1000" value="${esc(r.feedback || '')}" placeholder="ระบุคำแนะนำ หรือเหตุผล...">
              <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;">
                <button type="button" class="btn btn-outline btn-small" data-quick-feedback="ผ่านเกณฑ์การฝึกงานเรียบร้อย บันทึกได้ดีมากครับ" data-target="${r.id}" data-set-status="approved" style="font-size:0.72rem;padding:3px 8px;">ผ่านเกณฑ์ดีมาก</button>
                <button type="button" class="btn btn-outline btn-small" data-quick-feedback="กรุณาเพิ่มเติมรายละเอียดของงานและสิ่งที่ได้เรียนรู้ให้ชัดเจนขึ้น" data-target="${r.id}" data-set-status="revision" style="font-size:0.72rem;padding:3px 8px;">ขอรายละเอียดเพิ่ม</button>
                <button type="button" class="btn btn-outline btn-small" data-quick-feedback="กรุณาตรวจสอบลิงก์ผลงานและเปิดสิทธิ์การเข้าถึง" data-target="${r.id}" data-set-status="revision" style="font-size:0.72rem;padding:3px 8px;">เช็กสิทธิ์ลิงก์</button>
              </div>
            </div>
            <div style="align-self:center;margin-top:16px;"><button class="btn btn-primary btn-small" data-save-review="${r.id}" style="padding:8px 14px;">บันทึกผลตรวจ</button></div>
          </div>
        </div>
      </article>`;
  }).join('')}</div>`;
}

function renderLogs(logs, admin = false) {
  if (!logs.length) return '<div class="empty">ยังไม่มีบันทึกงานในส่วนนี้</div>';
  return `<div class="list">${[...logs].sort((a, b) => b.date.localeCompare(a.date)).map(l => {
    const user = userFor(l.userId);
    return `
      <article class="entry">
        <div class="entry-photo">${l.image ? `<img src="${l.image}" alt="รูปภาพ" data-lightbox="${l.id}">` : 'ไม่มีรูป'}</div>
        <div class="entry-body">
          <div class="entry-meta">${admin ? `<strong>${esc(user?.name || 'ไม่พบบัญชี')}</strong><span>•</span>` : ''}<strong>${formatDate(l.date)}</strong><span class="hour-badge">${esc(l.hours || 8)} ชม.</span><span>•</span><span>${esc(l.location)}</span></div>
          <div class="entry-text">${esc(l.detail)}</div>
        </div>
        ${admin ? `<div class="entry-actions"><button class="btn btn-danger btn-small" data-delete-log="${l.id}">ลบ</button></div>` : ''}
      </article>`;
  }).join('')}</div>`;
}

// Bind Events
function bindView() {
  $$('[data-go]').forEach(btn => btn.addEventListener('click', () => { activeView = btn.dataset.go; renderNav(); renderView(); }));

  // Profile Form
  const profileForm = $('#profile-form');
  if (profileForm) {
    let curAvatar = currentUser().avatar || '';
    $('#profile-avatar').addEventListener('change', async e => {
      const f = e.target.files[0];
      if (!f || f.size > 10 * 1024 * 1024) return toast('ไฟล์ต้องไม่เกิน 10 MB');
      curAvatar = await fileToDataUrl(f);
      $('#settings-avatar').innerHTML = `<img src="${curAvatar}" alt="โปรไฟล์">`;
    });
    $('#remove-avatar')?.addEventListener('click', () => { curAvatar = ''; $('#profile-avatar').value = ''; $('#settings-avatar').textContent = initials(currentUser().name); });
    profileForm.addEventListener('submit', e => {
      e.preventDefault();
      const users = read(KEYS.users), u = users.find(x => x.id === currentUser().id);
      u.name = $('#profile-name').value.trim(); u.department = $('#profile-department').value;
      if ($('#profile-workplace')) { u.workplace = $('#profile-workplace').value.trim(); u.workplaceMap = safeUrl($('#profile-workplace-map')?.value); }
      u.avatar = curAvatar; save(KEYS.users, users);
      showApp(); activeView = 'settings'; renderNav(); renderView(); toast('บันทึกโปรไฟล์เรียบร้อยแล้ว');
    });
  }

  // Add / Delete Department
  $('#add-dept-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#new-dept-name').value.trim(), depts = departments();
    if (!name || depts.some(d => d.toLowerCase() === name.toLowerCase())) return toast('ชื่อแผนกไม่ถูกต้องหรือมีอยู่แล้ว');
    depts.push(name); save(KEYS.departments, depts); renderDepartmentOptions(); toast('เพิ่มแผนกวิชาเรียบร้อยแล้ว'); renderView();
  });
  $$('[data-delete-dept]').forEach(b => b.addEventListener('click', () => {
    const name = b.dataset.deleteDept;
    if (read(KEYS.users).some(u => u.department === name)) return toast('ยังลบไม่ได้ มีผู้ใช้งานในแผนกนี้');
    if (!confirm(`ต้องการลบแผนก “${name}” หรือไม่?`)) return;
    save(KEYS.departments, departments().filter(d => d !== name)); renderDepartmentOptions(); toast('ลบแผนกวิชาเรียบร้อยแล้ว'); renderView();
  }));

  // Password Form
  $('#password-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const users = read(KEYS.users), u = users.find(x => x.id === currentUser().id);
    if (u.password !== $('#current-password').value) return toast('รหัสผ่านปัจจุบันไม่ถูกต้อง');
    if ($('#new-password').value.length < 6 || $('#new-password').value !== $('#confirm-password').value) return toast('รหัสผ่านใหม่ไม่ตรงกันหรือสั้นกว่า 6 ตัวอักษร');
    u.password = $('#new-password').value; save(KEYS.users, users); e.target.reset(); toast('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
  });

  // Daily Form
  $('#log-image')?.addEventListener('change', async e => {
    const f = e.target.files[0];
    if (f && f.size <= 10 * 1024 * 1024) {
      const url = await fileToDataUrl(f);
      $('#image-preview').src = url; $('#image-preview-wrap').style.display = 'block'; $('#image-preview-wrap').dataset.image = url;
    }
  });
  $$('[data-hours]').forEach(btn => btn.addEventListener('click', () => {
    $('#log-hours').value = btn.dataset.hours; $$('[data-hours]').forEach(b => b.classList.toggle('active', b === btn));
  }));
  $('#daily-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const hours = Number($('#log-hours').value);
    if (!hours || hours < 0.5 || hours > 24) return toast('กรุณากรอกชั่วโมงระหว่าง 0.5 - 24');
    const logs = read(KEYS.logs);
    logs.push({ id: uid(), userId: currentUser().id, date: $('#log-date').value, hours, location: $('#log-location').value.trim(), detail: $('#log-detail').value.trim(), image: $('#image-preview-wrap').dataset.image || '', createdAt: new Date().toISOString() });
    save(KEYS.logs, logs); toast('บันทึกงานเรียบร้อยแล้ว'); activeView = 'home'; renderNav(); renderView();
  });

  // Report Form
  $('#report-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const reports = read(KEYS.reports);
    reports.push({ id: uid(), userId: currentUser().id, week: $('#report-week').value, summary: $('#report-summary').value.trim(), link: safeUrl($('#report-link').value), status: 'pending', feedback: '', submittedAt: new Date().toISOString() });
    save(KEYS.reports, reports); toast('ส่งรายงานให้อาจารย์ตรวจแล้ว'); renderView();
  });

  // Filters & Reviews
  ['#report-search', '#report-status-filter', '#report-dept-filter'].forEach(s => $(s)?.addEventListener('input', () => $('#review-list').innerHTML = renderReviewReports()));
  ['#log-search', '#log-date-filter'].forEach(s => $(s)?.addEventListener('input', () => {
    const q = $('#log-search').value.toLowerCase(), d = $('#log-date-filter').value;
    $('#admin-log-list').innerHTML = renderLogs(read(KEYS.logs).filter(l => (!d || l.date === d) && (`${userFor(l.userId)?.name || ''} ${l.location} ${l.detail}`).toLowerCase().includes(q)), true);
  }));

  $('#review-list')?.addEventListener('click', e => {
    const qBtn = e.target.closest('[data-quick-feedback]');
    if (qBtn) {
      $(`[data-review-feedback="${qBtn.dataset.target}"]`).value = qBtn.dataset.quickFeedback;
      $(`[data-review-status="${qBtn.dataset.target}"]`).value = qBtn.dataset.setStatus;
      return;
    }
    const saveBtn = e.target.closest('[data-save-review]');
    if (saveBtn) {
      const id = saveBtn.dataset.saveReview, reports = read(KEYS.reports), r = reports.find(x => x.id === id);
      if (r) { r.status = $(`[data-review-status="${id}"]`).value; r.feedback = $(`[data-review-feedback="${id}"]`).value.trim(); save(KEYS.reports, reports); toast(`บันทึกผลตรวจสัปดาห์ที่ ${r.week} แล้ว`); $('#review-list').innerHTML = renderReviewReports(); }
    }
  });

  // Delete Actions
  $$('[data-delete-log]').forEach(b => b.addEventListener('click', () => removeItem(KEYS.logs, b.dataset.deleteLog, 'บันทึกงาน')));
  $$('[data-delete-report]').forEach(b => b.addEventListener('click', () => removeItem(KEYS.reports, b.dataset.deleteReport, 'รายงาน')));
  $$('[data-delete-user]').forEach(b => b.addEventListener('click', () => {
    if (!confirm('ลบบัญชีนี้รวมถึงข้อมูลทั้งหมดหรือไม่?')) return;
    const id = b.dataset.deleteUser;
    save(KEYS.users, read(KEYS.users).filter(u => u.id !== id)); save(KEYS.logs, read(KEYS.logs).filter(l => l.userId !== id)); save(KEYS.reports, read(KEYS.reports).filter(r => r.userId !== id));
    toast('ลบบัญชีเรียบร้อยแล้ว'); renderView();
  }));

  $$('[data-user-role]').forEach(s => s.addEventListener('change', () => { const u = read(KEYS.users); u.find(x => x.id === s.dataset.userRole).role = s.value; save(KEYS.users, u); toast('ปรับบทบาทแล้ว'); }));
  $$('[data-user-department]').forEach(s => s.addEventListener('change', () => { const u = read(KEYS.users), item = u.find(x => x.id === s.dataset.userDepartment); item.department = s.value; save(KEYS.users, u); toast('ปรับแผนกแล้ว'); if (item.id === currentUser().id) showApp(); }));
  $$('[data-lightbox]').forEach(img => img.addEventListener('click', () => openLightbox(read(KEYS.logs).find(l => l.id === img.dataset.lightbox)?.image)));
}

function removeItem(key, id, lbl) {
  if (!confirm(`ต้องการลบ${lbl}นี้หรือไม่?`)) return;
  save(key, read(key).filter(i => i.id !== id)); toast(`ลบ${lbl}เรียบร้อยแล้ว`); renderView();
}
const fileToDataUrl = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
function openLightbox(img) {
  if (!img) return;
  $('#modal-root').innerHTML = `<div class="modal-backdrop" data-close-modal><div class="modal"><div class="modal-head"><h2>รูปภาพประกอบการทำงาน</h2><button class="icon-btn" data-close-modal>×</button></div><img class="lightbox-image" src="${img}" alt="รูปภาพ"></div></div>`;
  $$('[data-close-modal]').forEach(el => el.addEventListener('click', e => { if (e.target === el || e.target.closest('[data-close-modal]')) $('#modal-root').innerHTML = ''; }));
}

// 21st.dev Magnetic Physics & Parallax Engine
function initMagneticButtons() {
  $$('.magnetic').forEach(el => {
    let bounds;
    el.addEventListener('mouseenter', () => { bounds = el.getBoundingClientRect(); });
    el.addEventListener('mousemove', e => {
      if (!bounds) bounds = el.getBoundingClientRect();
      const x = e.clientX - bounds.left - bounds.width / 2, y = e.clientY - bounds.top - bounds.height / 2;
      if (window.gsap) gsap.to(el, { x: x * 0.35, y: y * 0.35, scale: 1.04, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
      else el.style.transform = `translate3d(${x * 0.3}px, ${y * 0.3}px, 0) scale(1.04)`;
    });
    el.addEventListener('mouseleave', () => {
      bounds = null;
      if (window.gsap) gsap.to(el, { x: 0, y: 0, scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.3)', overwrite: 'auto' });
      else el.style.transform = 'translate3d(0, 0, 0) scale(1)';
    });
  });
}

function initParallax() {
  if (!window.gsap || matchMedia('(pointer: coarse)').matches) return;
  const giant = $('.footer-giant-bg-text');
  if (!giant) return;
  window.addEventListener('mousemove', e => {
    const dx = (e.clientX / window.innerWidth - 0.5) * 2;
    const dy = (e.clientY / window.innerHeight - 0.5) * 2;
    gsap.to(giant, { x: dx * 6, y: dy * 6, duration: 1, ease: 'power2.out', overwrite: 'auto' });
  });
}

// Seed Demo Data
function seedDefaultAccounts() {
  const users = read(KEYS.users);
  const demos = [
    { id: 'admin-1', name: 'ผู้ดูแลระบบ by PT-FU', email: 'admin@internflow.local', password: 'Admin@InternFlow2026', role: 'admin', department: '', createdAt: new Date().toISOString() },
    { id: 'teacher-1', name: 'อาจารย์ปัณณรุจน์ สอนดีลบ', email: 'teacher@internflow.local', password: 'Teacher@InternFlow2026', role: 'teacher', department: '', createdAt: new Date().toISOString() },
    { id: 'student-1', name: 'นายฐานุปัติ นกกระตั่ว', email: 'student@internflow.local', password: 'Student@InternFlow2026', role: 'student', department: 'เทคโนโลยีธุรกิจดิจิทัล', workplace: 'บริษัท ดิจิทัล อินโนเวชั่น ซอฟต์แวร์ จำกัด', workplaceMap: 'https://maps.google.com/?q=Bangkok', createdAt: new Date().toISOString() }
  ];
  let changed = false;
  demos.forEach(d => { if (!users.some(u => u.email === d.email)) { users.push(d); changed = true; } });
  if (changed) save(KEYS.users, users);

  if (read(KEYS.reports).length === 0) {
    save(KEYS.reports, [
      { id: 'rep-1', userId: 'student-1', week: '1', summary: 'เข้าร่วมปฐมนิเทศที่สถานประกอบการ ศึกษาโครงสร้างองค์กร และเริ่มเรียนรู้ระบบงาน Frontend UI ร่วมกับพี่เลี้ยง', link: 'https://github.com/example/internship-project', status: 'pending', feedback: '', submittedAt: new Date(Date.now() - 864e5 * 4).toISOString() },
      { id: 'rep-2', userId: 'student-1', week: '2', summary: 'ออกแบบและเขียนโค้ดระบบบันทึกเวลาฝึกงานรายชั่วโมง และระบบปักหมุดแผนที่ Google Maps รองรับทุกอุปกรณ์', link: 'https://drive.google.com/sample', status: 'pending', feedback: '', submittedAt: new Date(Date.now() - 864e5 * 1).toISOString() }
    ]);
  }
  if (read(KEYS.logs).length === 0) {
    save(KEYS.logs, [{ id: 'log-1', userId: 'student-1', date: today(), hours: 8, location: 'บริษัท ดิจิทัล อินโนเวชั่น ซอฟต์แวร์ จำกัด', detail: 'พัฒนาและปรับปรุง UI หน้าเว็บแดชบอร์ดตามข้อเสนอแนะ พร้อมทดสอบความเข้ากันได้บนมือถือและ iPad', image: '', createdAt: new Date().toISOString() }]);
  }
}

// Boot
seedDefaultAccounts();
setTheme(localStorage.getItem(KEYS.theme) || 'dark');
showApp();
if (document.readyState === 'loading') { window.addEventListener('DOMContentLoaded', () => { initMagneticButtons(); initParallax(); }); }
else { initMagneticButtons(); initParallax(); }
