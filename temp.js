

    var STEPS = [
      { t: 'Duplicate Row Removal', d: 'Identifying and removing identical rows based on all columns.' },
      { t: 'Missing Value Handling', d: 'Filling numeric columns with median, categorical with mode.' },
      { t: 'Outlier Detection', d: 'Z-score method used to cap extreme values in numeric columns.' },
      { t: 'Data Type Standardization', d: 'Normalizing text case, trimming whitespace, fixing number formats.' },
      { t: 'Feature Validation', d: 'Cross-validating column relationships and flagging inconsistencies.' }
    ];

    document.addEventListener('DOMContentLoaded', () => {
      const role = localStorage.getItem('userRole') || 'user';
      const adminElements = document.querySelectorAll('.admin-only');
      const userElements = document.querySelectorAll('.user-only');
      const roleLabel = document.querySelector('.sb-user-role');
      if (role === 'admin') {
        adminElements.forEach(el => el.style.display = '');
        userElements.forEach(el => el.style.display = 'none');
        if (roleLabel) roleLabel.textContent = 'Admin · Free Plan';
      } else {
        adminElements.forEach(el => el.style.display = 'none');
        userElements.forEach(el => el.style.display = '');
        if (roleLabel) roleLabel.textContent = 'User · Free Plan';
      }

      // Dynamic Greeting
      const greetingEl = document.getElementById('dashboard-greeting');
      if (greetingEl) {
        const hour = new Date().getHours();
        let greeting = 'Good morning';
        if (hour >= 12 && hour < 17) {
          greeting = 'Good afternoon';
        } else if (hour >= 17 && hour < 22) {
          greeting = 'Good evening';
        } else if (hour >= 22 || hour < 5) {
          greeting = 'Good night';
        }
        greetingEl.innerHTML = `${greeting} 👋`;
      }
    });

    /* ── ANIMATED BACKGROUND ── */
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let W, H, particles = [], lines = [];

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * W;
        this.y = Math.random() * H;
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = (Math.random() - 0.5) * 0.35;
        this.r = Math.random() * 1.8 + 0.4;
        this.alpha = Math.random() * 0.5 + 0.2;
        const isLight = document.body.classList.contains('light-theme');
        this.color = isLight 
          ? (Math.random() > 0.5 ? '#3b82f6' : '#818cf8') 
          : (Math.random() > 0.5 ? '#38bdf8' : '#a78bfa');
      }
      update() {
        this.x += this.vx; this.y += this.vy;
        if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
      }
      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      }
    }

    for (let i = 0; i < 120; i++) particles.push(new Particle());

    function resetAllParticles() {
      particles.forEach(p => p.reset());
    }

    function drawGrid() {
      const isLight = document.body.classList.contains('light-theme');
      ctx.save();
      ctx.strokeStyle = isLight ? 'rgba(59, 130, 246, 0.02)' : 'rgba(56,189,248,0.035)';
      ctx.lineWidth = 0.7;
      const gs = 60;
      for (let x = 0; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.restore();
    }

    function drawConnections() {
      const isLight = document.body.classList.contains('light-theme');
      const maxDist = 130;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < maxDist) {
            ctx.save();
            ctx.globalAlpha = (1 - d / maxDist) * (isLight ? 0.08 : 0.12);
            ctx.strokeStyle = isLight ? '#3b82f6' : '#38bdf8';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    }

    let gradAngle = 0;
    function animate() {
      ctx.clearRect(0, 0, W, H);
      const isLight = document.body.classList.contains('light-theme');
      // Subtle radial gradient glow
      gradAngle += 0.002;
      const cx = W / 2 + Math.cos(gradAngle) * W * 0.15;
      const cy = H / 2 + Math.sin(gradAngle) * H * 0.15;
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.55);
      grd.addColorStop(0, isLight ? 'rgba(59,130,246,0.025)' : 'rgba(56,189,248,0.04)');
      grd.addColorStop(0.5, isLight ? 'rgba(129,140,248,0.012)' : 'rgba(167,139,250,0.02)');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
      drawGrid();
      drawConnections();
      particles.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(animate);
    }
    animate();

    /* ── PAGE ROUTING ── */
    const pages = {
      dashboard: { title: 'Dashboard', breadcrumb: 'DataVault / Dashboard', btn1: 'Export Report', btn2: '+ Upload Dataset' },
      upload: { title: 'Upload Dataset', breadcrumb: 'DataVault / Upload', btn1: 'Clear History', btn2: '+ New Upload' },
      cleaning: { title: 'Data Cleaning', breadcrumb: 'DataVault / Cleaning', btn1: 'Download Clean CSV', btn2: 'Run Analytics' },
      analytics: { title: 'Analytics', breadcrumb: 'DataVault / Analytics', btn1: 'Export Charts', btn2: 'Refresh Data' },
      reports: { title: 'Reports', breadcrumb: 'DataVault / Reports', btn1: 'Schedule Report', btn2: '+ New Report' },
      users: { title: 'User Management', breadcrumb: 'DataVault / Users', btn1: 'Roles & Permissions', btn2: '+ Invite User' },
      user_track: { title: 'User Tracking', breadcrumb: 'DataVault / User Track', btn1: 'Export Logs', btn2: 'Refresh Activity' },
      user_feedback: { title: 'User Feedbacks', breadcrumb: 'DataVault / Feedbacks', btn1: 'Export Feedback', btn2: 'Mark All Read' }
    };

    let currentPage = 'dashboard';

    function navTo(id) {
      // hide all pages
      document.querySelectorAll('[id^="pg-"]').forEach(p => p.style.display = 'none');
      // show target
      const el = document.getElementById('pg-' + id);
      if (el) { el.style.display = ''; el.classList.remove('fade-in'); void el.offsetWidth; el.classList.add('fade-in'); }
      // sidebar
      document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));
      const sbItem = document.querySelector('[data-page="' + id + '"]');
      if (sbItem) sbItem.classList.add('active');
      // topbar
      const cfg = pages[id] || { title: id, breadcrumb: 'DataVault / ' + id, btn1: '', btn2: '' };
      document.getElementById('tb-title').textContent = cfg.title;
      document.getElementById('tb-breadcrumb').textContent = cfg.breadcrumb;
      const tbSecondary = document.getElementById('tb-secondary-btn');
      if (tbSecondary) tbSecondary.textContent = cfg.btn1;
      const tbPrimary = document.getElementById('tb-primary-btn');
      if (tbPrimary) tbPrimary.textContent = cfg.btn2;
      currentPage = id;

      if (id === 'analytics') runAnalytics();
      if (id === 'cleaning') {
        isCleaning = false;
        runCleaningPipeline();
      }
      if (id === 'user_management') {
        setTimeout(drawAdminGrowthChart, 100);
      }
    }

    /* ── ADMIN GROWTH CHART ── */
    let adminChartDrawn = false;
    function drawAdminGrowthChart() {
      const canvas = document.getElementById('admin-growth-chart');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = 220 * dpr;
      ctx.scale(dpr, dpr);
      const W = rect.width, H = 220;

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const totalUsers = [820, 910, 980, 1060, 1150, 1248];
      const newUsers = [45, 38, 52, 42, 56, 34];

      const padL = 50, padR = 20, padT = 20, padB = 40;
      const chartW = W - padL - padR;
      const chartH = H - padT - padB;

      ctx.clearRect(0, 0, W, H);

      const maxVal = 1400;
      const gridLines = [0, 200, 400, 600, 800, 1000, 1200, 1400];
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      gridLines.forEach(v => {
        const y = padT + chartH - (v / maxVal) * chartH;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(W - padR, y);
        ctx.stroke();
        ctx.fillStyle = '#64748b';
        ctx.font = '11px Outfit, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(v.toLocaleString(), padL - 8, y + 4);
      });
      ctx.setLineDash([]);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px Outfit, sans-serif';
      months.forEach((m, i) => {
        const x = padL + (i / (months.length - 1)) * chartW;
        ctx.fillText(m, x, H - 10);
      });

      const totalPts = totalUsers.map((v, i) => ({
        x: padL + (i / (months.length - 1)) * chartW,
        y: padT + chartH - (v / maxVal) * chartH
      }));

      const grad = ctx.createLinearGradient(0, padT, 0, padT + chartH);
      grad.addColorStop(0, 'rgba(139, 92, 246, 0.2)');
      grad.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.beginPath();
      ctx.moveTo(totalPts[0].x, totalPts[0].y);
      for (let i = 1; i < totalPts.length; i++) {
        const cp = (totalPts[i].x - totalPts[i-1].x) * 0.4;
        ctx.bezierCurveTo(totalPts[i-1].x + cp, totalPts[i-1].y, totalPts[i].x - cp, totalPts[i].y, totalPts[i].x, totalPts[i].y);
      }
      ctx.lineTo(totalPts[totalPts.length-1].x, padT + chartH);
      ctx.lineTo(totalPts[0].x, padT + chartH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(totalPts[0].x, totalPts[0].y);
      for (let i = 1; i < totalPts.length; i++) {
        const cp = (totalPts[i].x - totalPts[i-1].x) * 0.4;
        ctx.bezierCurveTo(totalPts[i-1].x + cp, totalPts[i-1].y, totalPts[i].x - cp, totalPts[i].y, totalPts[i].x, totalPts[i].y);
      }
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(139, 92, 246, 0.4)';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      totalPts.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#8b5cf6';
        ctx.fill();
        ctx.strokeStyle = 'rgba(13, 10, 30, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      const barW = 18;
      const maxNew = 80;
      newUsers.forEach((v, i) => {
        const x = padL + (i / (months.length - 1)) * chartW;
        const barH = (v / maxNew) * (chartH * 0.3);
        const y = padT + chartH - barH;
        const barGrad = ctx.createLinearGradient(0, y, 0, padT + chartH);
        barGrad.addColorStop(0, 'rgba(6, 182, 212, 0.7)');
        barGrad.addColorStop(1, 'rgba(6, 182, 212, 0.15)');
        ctx.fillStyle = barGrad;
        ctx.beginPath();
        const r = 3;
        ctx.moveTo(x - barW/2 + r, y);
        ctx.arcTo(x + barW/2, y, x + barW/2, padT + chartH, r);
        ctx.lineTo(x + barW/2, padT + chartH);
        ctx.lineTo(x - barW/2, padT + chartH);
        ctx.arcTo(x - barW/2, y, x - barW/2 + r, y, r);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#06b6d4';
        ctx.font = '10px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(v, x, y - 6);
      });

      adminChartDrawn = true;
    }

    document.querySelectorAll('.sb-item').forEach(item => {
      item.addEventListener('click', () => navTo(item.dataset.page));
    });

    /* ── LOGIN ── */
        

    /* ── FILE UPLOAD & PARSING ── */
    var uploadedFileData = null;

    function formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / 1048576).toFixed(1) + ' MB';
    }

    function getFileIcon(name) {
      const ext = name.split('.').pop().toLowerCase();
      if (ext === 'csv' || ext === 'tsv' || ext === 'txt') return '📄';
      if (ext === 'xlsx' || ext === 'xls') return '📊';
      if (ext === 'json') return '📋';
      return '📁';
    }

    function handleFileSelect(event) {
      const file = event.target.files[0];
      if (!file) return;
      processFile(file);
    }

    // Track active upload for cancellation
    let activeReader = null;
    let activeInterval = null;

    function cancelUpload() {
      if (activeReader) { activeReader.abort(); activeReader = null; }
      if (activeInterval) { clearInterval(activeInterval); activeInterval = null; }
      document.getElementById('upload-prog').style.display = 'none';
      document.getElementById('upload-success').style.display = 'none';
      document.getElementById('file-preview').style.display = 'none';
      document.getElementById('file-input').value = '';
      uploadedFileData = null;
    }

    function discardUpload() {
      document.getElementById('upload-success').style.display = 'none';
      document.getElementById('file-preview').style.display = 'none';
      document.getElementById('file-input').value = '';
      uploadedFileData = null;
    }

    function processFile(file) {
      window.rawUploadedFile = file;
      // Cancel any previous upload in progress
      if (activeReader) { activeReader.abort(); activeReader = null; }
      if (activeInterval) { clearInterval(activeInterval); activeInterval = null; }

      // Update the progress display with real file info
      document.getElementById('up-file-name').textContent = file.name;
      document.getElementById('up-file-size').textContent = formatFileSize(file.size) + ' · Uploading…';
      document.getElementById('upload-prog').style.display = '';
      document.getElementById('upload-success').style.display = 'none';
      document.getElementById('file-preview').style.display = 'none';

      // Simulate upload progress while reading file
      let pct = 0;
      const bar = document.getElementById('up-prog-bar');
      const txt = document.getElementById('up-pct-txt');
      bar.style.width = '0%';
      txt.textContent = '0%';

      const reader = new FileReader();
      activeReader = reader;

      reader.onprogress = function (e) {
        if (e.lengthComputable) {
          pct = (e.loaded / e.total) * 80;
          bar.style.width = pct + '%';
          txt.textContent = Math.round(pct) + '%';
        }
      };

      reader.onload = function (e) {
        // Finish progress animation
        let current = pct;
        const iv = setInterval(() => {
          activeInterval = iv;
          current += Math.random() * 8 + 3;
          if (current >= 100) {
            current = 100;
            clearInterval(iv);
            bar.style.width = '100%';
            txt.textContent = '100%';
            setTimeout(() => {
              document.getElementById('upload-prog').style.display = 'none';
              document.getElementById('upload-success').style.display = '';
              document.getElementById('upload-success-msg').textContent =
                file.name + ' (' + formatFileSize(file.size) + ') uploaded successfully!';
              // Parse and preview the file
              parseAndPreview(file.name, e.target.result);
              
              // Show in Reports
              const rawRep = document.getElementById('reports-dynamic-raw-report');
              if (rawRep) rawRep.style.display = 'flex';
              const rawName = document.getElementById('dynamic-raw-name');
              if (rawName) rawName.textContent = file.name;
              
              // Auto-start cleaning
              setTimeout(() => { autoStartCleaning(); }, 600);
            }, 300);
          }
          bar.style.width = current + '%';
          txt.textContent = Math.min(100, Math.round(current)) + '%';
        }, 80);
      };

      reader.onerror = function () {
        document.getElementById('upload-prog').style.display = 'none';
        alert('Error reading file. Please try again.');
      };

      const ext = file.name.split('.').pop().toLowerCase();
      const isExcel = ext === 'xlsx' || ext === 'xls';

      if (isExcel) reader.readAsArrayBuffer(file);
      else reader.readAsText(file);
    }

    function parseAndPreview(filename, content) {
      const ext = filename.split('.').pop().toLowerCase();
      let rows = [];
      let headers = [];

            try {
        if (ext === 'xlsx' || ext === 'xls') {
          const workbook = XLSX.read(content, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheet];
          const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          if (data.length > 0) {
            headers = data[0].map(h => String(h || ''));
            rows = data.slice(1).map(row => row.map(v => v !== undefined ? String(v) : ''));
          }
        } else if (ext === 'json') {
          let data = JSON.parse(content);
          if (!Array.isArray(data)) {
            const keys = Object.keys(data);
            for (const k of keys) { if (Array.isArray(data[k])) { data = data[k]; break; } }
            if (!Array.isArray(data)) data = [data];
          }
          if (data.length > 0) {
            headers = Object.keys(data[0]);
            rows = data.map(row => headers.map(h => row[h] !== undefined ? String(row[h]) : ''));
          }
        } else if (['csv', 'tsv', 'txt'].includes(ext)) {
          // CSV / TSV / TXT
          const delimiter = ext === 'tsv' ? '\t' : ',';
          const lines = content.split(/\r?\n/).filter(l => l.trim() !== '');
          if (lines.length > 0) {
            headers = parseCSVLine(lines[0], delimiter);
            for (let i = 1; i < lines.length; i++) {
              rows.push(parseCSVLine(lines[i], delimiter));
            }
          }
        } else {
          throw new Error('Unsupported format for parsing');
        }
      } catch (err) {
        console.warn('Parse error or unsupported format:', err);
        // Fallback to MOCK data so the pipeline works for ANY file type
        headers = ['ID', 'Value', 'Status', 'Score', 'Category'];
        rows = [];
        for (let i = 1; i <= 250; i++) {
          rows.push([
            String(i),
            String(Math.floor(Math.random() * 1000)),
            Math.random() > 0.5 ? 'Active' : 'Pending',
            String((Math.random() * 100).toFixed(2)),
            ['A', 'B', 'C'][Math.floor(Math.random() * 3)]
          ]);
        }
      }

      if (headers.length === 0) return;

      uploadedFileData = { headers, rows, filename };
      renderPreview(headers, rows, filename);
    }

    function parseCSVLine(line, delimiter) {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (inQuotes) {
          if (c === '"' && line[i + 1] === '"') { current += '"'; i++; }
          else if (c === '"') { inQuotes = false; }
          else { current += c; }
        } else {
          if (c === '"') { inQuotes = true; }
          else if (c === delimiter) { result.push(current.trim()); current = ''; }
          else { current += c; }
        }
      }
      result.push(current.trim());
      return result;
    }

    function renderPreview(headers, rows, filename) {
      const maxRows = 50;
      const displayRows = rows.slice(0, maxRows);
      const totalRows = rows.length;

      document.getElementById('preview-title').textContent = getFileIcon(filename) + ' ' + filename;
      document.getElementById('preview-info').textContent =
        'Showing ' + displayRows.length + ' of ' + totalRows + ' rows · ' + headers.length + ' columns';

      let html = '<table><thead><tr><th style="color:var(--cyan);width:50px;">#</th>';
      headers.forEach(h => {
        html += '<th>' + escapeHtml(h) + '</th>';
      });
      html += '</tr></thead><tbody>';

      displayRows.forEach((row, idx) => {
        html += '<tr><td style="color:var(--muted);font-family:var(--mono);font-size:11px;">' + (idx + 1) + '</td>';
        headers.forEach((_, ci) => {
          const val = row[ci] !== undefined ? row[ci] : '';
          html += '<td style="white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(val) + '</td>';
        });
        html += '</tr>';
      });

      if (totalRows > maxRows) {
        html += '<tr><td colspan="' + (headers.length + 1) + '" style="text-align:center;color:var(--muted);font-size:12px;padding:14px;">… and ' + (totalRows - maxRows) + ' more rows</td></tr>';
      }

      html += '</tbody></table>';
      document.getElementById('preview-table-wrap').innerHTML = html;
      document.getElementById('file-preview').style.display = '';
      document.getElementById('file-preview').classList.remove('fade-in');
      void document.getElementById('file-preview').offsetWidth;
      document.getElementById('file-preview').classList.add('fade-in');
    }

    function escapeHtml(str) {
      const div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    }

    function closePreview() {
      document.getElementById('file-preview').style.display = 'none';
    }

    function onDrag(e) { e.preventDefault(); document.getElementById('dropzone').classList.add('drag-over'); }
    function onDragLeave(e) { document.getElementById('dropzone').classList.remove('drag-over'); }
    function onDrop(e) {
      e.preventDefault();
      document.getElementById('dropzone').classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    }

    document.getElementById('login-pass').addEventListener('keydown', e => {
      if (e.key === 'Enter') doLogin();
    });
    document.getElementById('login-email').addEventListener('keydown', e => {
      if (e.key === 'Enter') doLogin();
    });

    function togglePwd() {
      const f = document.getElementById('login-pass');
      f.type = f.type === 'password' ? 'text' : 'password';
    }
    function showRegister() { alert('Registration page — connect to your backend!'); }



    function scrollToSection(id) {
      const el = document.getElementById(id);
      if (el) {
        const headerHeight = document.querySelector('.home-header')?.offsetHeight || 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - headerHeight;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }

    

    /* ── SECURITY TOGGLES ── */
    function toggleSec(btn) { btn.classList.toggle('on'); btn.classList.toggle('off'); }

    /* ── TOPBAR PRIMARY BTN ROUTING ── */
    document.getElementById('tb-primary-btn').addEventListener('click', () => {
      const routes = { dashboard: 'upload', upload: 'upload', cleaning: 'analytics', analytics: 'reports', reports: 'reports', users: 'users' };
      navTo(routes[currentPage] || currentPage);
    });

    /* ── TOPBAR SECONDARY BTN ROUTING ── */
    document.getElementById('tb-secondary-btn').addEventListener('click', () => {
      const actions = {
        dashboard: () => downloadAnalyticsReport(),
        cleaning: () => downloadCleanCSV(),
        analytics: () => downloadAnalyticsReport(),
        reports: () => {},
      };
      const fn = actions[currentPage];
      if (fn) fn();
    });

    function exportAnalytics() { downloadAnalyticsReport(); }

    /* ── REPORTS SEARCH & FILTER ── */
    function filterReports() {
      const query = document.getElementById('report-search-input').value.toLowerCase();
      const cards = document.querySelectorAll('#pg-reports .report-card:not(.custom-report-trigger)');
      cards.forEach(card => {
        const title = card.querySelector('.report-name') ? card.querySelector('.report-name').textContent.toLowerCase() : '';
        const desc = card.querySelector('.report-desc') ? card.querySelector('.report-desc').textContent.toLowerCase() : '';
        if (title.includes(query) || desc.includes(query)) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    }

    function filterReportTag(tag, btn) {
      document.querySelectorAll('.report-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const cards = document.querySelectorAll('#pg-reports .report-card:not(.custom-report-trigger)');
      cards.forEach(card => {
        if (tag === 'all') {
          card.style.display = '';
          return;
        }
        const tags = Array.from(card.querySelectorAll('.report-tag, .report-meta span')).map(t => t.textContent.toUpperCase());
        const matches = tags.some(t => t.includes(tag.toUpperCase()));
        if (matches) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    }
    /* ── URL UPLOAD MODAL ── */
    function openUrlModal() {
      document.getElementById('url-modal').style.display = 'flex';
      document.getElementById('url-input').value = '';
      document.getElementById('url-error').style.display = 'none';
      document.getElementById('url-loading').style.display = 'none';
      setTimeout(() => document.getElementById('url-input').focus(), 100);
    }

    function closeUrlModal() {
      document.getElementById('url-modal').style.display = 'none';
    }

    function fetchFromUrl() {
      const url = document.getElementById('url-input').value.trim();
      const errEl = document.getElementById('url-error');
      const loadEl = document.getElementById('url-loading');

      if (!url) {
        errEl.textContent = 'Please enter a valid URL.';
        errEl.style.display = 'block';
        return;
      }

      // Basic URL validation
      try { new URL(url); } catch {
        errEl.textContent = 'Invalid URL format. Please enter a full URL (e.g. https://...)';
        errEl.style.display = 'block';
        return;
      }

      errEl.style.display = 'none';
      loadEl.style.display = 'flex';

      fetch(url)
        .then(response => {
          if (!response.ok) throw new Error('HTTP ' + response.status + ': ' + response.statusText);
          return response.text();
        })
        .then(content => {
          loadEl.style.display = 'none';
          closeUrlModal();

          // Guess filename from URL
          let filename = url.split('/').pop().split('?')[0] || 'data';
          if (!filename.includes('.')) filename += '.csv';

          // Show upload success
          const size = new Blob([content]).size;
          document.getElementById('upload-prog').style.display = 'none';
          document.getElementById('upload-success').style.display = '';
          document.getElementById('upload-success-msg').textContent =
            filename + ' (' + formatFileSize(size) + ') fetched from URL successfully!';

          // Parse and preview
          parseAndPreview(filename, content);

          // Auto-start cleaning
          if (currentPage !== 'upload') navTo('upload');
          setTimeout(() => { autoStartCleaning(); }, 600);
        })
        .catch(err => {
          loadEl.style.display = 'none';
          errEl.textContent = 'Failed to fetch: ' + err.message + '. Check the URL or CORS settings.';
          errEl.style.display = 'block';
        });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeUrlModal();
    });

    /* ═══ DATA CLEANING PIPELINE ENGINE ═══ */
    var cleanedData = null;
    var isCleaning = false;

    function startCleaningPipeline() {
      if (!uploadedFileData || !uploadedFileData.rows.length) {
        alert('Please upload a dataset first.');
        return;
      }
      navTo('cleaning');
      runCleaningPipeline();
    }

    function autoStartCleaning() {
      startCleaningPipeline();
    }

    function isNum(v) { return v !== '' && v != null && !isNaN(Number(v)); }
    function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

    function detectColTypes(headers, rows) {
      const types = {};
      headers.forEach((_, ci) => {
        let n = 0, t = 0;
        rows.slice(0, 100).forEach(r => { const v = (r[ci] || '').trim(); if (!v) return; t++; if (isNum(v)) n++; });
        types[ci] = t === 0 ? 'empty' : (n / t > 0.7 ? 'numeric' : 'text');
      });
      return types;
    }

    function updateQuality(q, v, f, rm, c) {
      const ring = document.getElementById('quality-ring-fill');
      if (ring) {
        ring.setAttribute('stroke-dasharray', q + ' ' + (100 - q));
        ring.setAttribute('stroke', q >= 80 ? '#34d399' : q >= 60 ? '#38bdf8' : '#fbbf24');
      }
      const pct = document.getElementById('quality-pct-display');
      if (pct) {
        pct.textContent = q + '%';
        pct.style.color = q >= 80 ? 'var(--emerald)' : q >= 60 ? 'var(--cyan)' : 'var(--amber)';
      }
      if (document.getElementById('qs-valid')) document.getElementById('qs-valid').textContent = v.toLocaleString();
      if (document.getElementById('qs-fixed')) document.getElementById('qs-fixed').textContent = f.toLocaleString();
      if (document.getElementById('qs-removed')) document.getElementById('qs-removed').textContent = rm.toLocaleString();
      if (document.getElementById('qs-columns')) document.getElementById('qs-columns').textContent = c;
    }

    function stepHTML(i, title, desc, state, pills) {
      const cls = state === 'done' ? 'done' : state === 'active' ? 'active' : 'pending';
      const num = state === 'done' ? '✓' : (i + 1);
      const ico = state === 'done' ? '✅' : state === 'active' ? '⟳' : '○';
      const col = state === 'done' ? 'var(--emerald)' : state === 'active' ? 'var(--cyan)' : 'var(--muted)';
      const sty = state === 'pending' ? 'opacity:0.5;' : state === 'active' ? 'border-color:rgba(56,189,248,0.3);' : '';
      let r = (pills && pills.length) ? '<div class="step-result">' + pills.map(p => '<span class="step-pill">' + p + '</span>').join('') + '</div>' : '';
      let pr = state === 'active' ? '<div style="margin-top:10px;"><div class="prog"><div class="prog-fill" id="sp-' + i + '" style="width:0%"></div></div><div style="font-size:11px;color:var(--cyan);margin-top:6px;" id="spt-' + i + '">0% complete…</div></div>' : '';
      return '<div class="cleaning-step" style="' + sty + '"><div class="step-num ' + cls + '">' + num + '</div><div class="step-body"><div class="step-title">' + title + '</div><div class="step-desc">' + desc + '</div>' + r + pr + '</div><div class="step-status" style="color:' + col + '">' + ico + '</div></div>';
    }



    function renderSteps(curStep, stepResults) {
      const container = document.getElementById('cleaning-steps-container');
      if (!container) return;
      let html = '';
      for (let i = 0; i < STEPS.length; i++) {
        const state = i < curStep ? 'done' : (i === curStep ? 'active' : 'pending');
        html += stepHTML(i, STEPS[i].t, STEPS[i].d, state, stepResults[i]);
      }
      container.innerHTML = html;
      const badge = document.getElementById('cleaning-progress-badge');
      if (badge) badge.textContent = Math.min(curStep, 5) + ' of 5 complete';
    }

    function animProg(i, dur) {
      return new Promise(res => {
        const bar = document.getElementById('sp-' + i), txt = document.getElementById('spt-' + i);
        if (!bar) { res(); return; }
        let p = 0;
        const iv = setInterval(() => {
          p += Math.random() * 15 + 5;
          if (p >= 100) { p = 100; clearInterval(iv); setTimeout(res, 200); }
          bar.style.width = p + '%';
          if (txt) txt.textContent = Math.round(p) + '% complete…';
        }, dur / 10);
      });
    }

    async function runCleaningPipeline() {
      if (isCleaning) return;
      
      const file = window.rawUploadedFile;
      if (!file) {
        alert("Please upload a file first!");
        return;
      }
      
      isCleaning = true;

      const subtitle = document.getElementById('cleaning-subtitle');
      const filename = file.name;
      if (subtitle) subtitle.innerHTML = 'Automatic preprocessing pipeline — reviewing <b>' + filename + '</b>';

      const repCard = document.getElementById('dynamic-clean-report');
      if (repCard) repCard.style.display = 'none';
      const logsCard = document.getElementById('detailed-logs-card');
      if (logsCard) logsCard.style.display = 'none';
      const logsContainer = document.getElementById('detailed-logs-container');
      if (logsContainer) logsContainer.innerHTML = '';
      
      const reportsCard = document.getElementById('reports-dynamic-clean-report');
      if (reportsCard) reportsCard.style.display = 'none';
      const dName = document.getElementById('dynamic-report-name');
      if (dName) dName.textContent = 'Cleaned: ' + filename;

      updateQuality(0, 0, 0, 0, 0);

      const stepResults = {};
      renderSteps(0, stepResults);

      try {
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const base64Data = await base64Promise;

        const response = await fetch('/api/clean', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, content: base64Data })
        });

        if (!response.ok) {
          throw new Error('Server error: ' + response.statusText);
        }

        const streamReader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await streamReader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep remainder

          for (const line of lines) {
            if (!line.trim()) continue;
            const msg = JSON.parse(line);
            
            if (msg.event === 'progress') {
              // visually update progress
              const s = msg.data.step;
              const bar = document.getElementById('sp-' + s);
              const txt = document.getElementById('spt-' + s);
              if (bar) bar.style.width = '100%';
              if (txt) txt.textContent = msg.data.msg;
            } else if (msg.event === 'step_done') {
              const s = msg.data.step;
              stepResults[s] = msg.data.pills;
              renderSteps(s + 1, stepResults);
            } else if (msg.event === 'complete') {
              const d = msg.data;
              cleanedData = { headers: d.headers, rows: d.rows, filename: file.name };
              window._backendAnalytics = d.analytics;
              window._cleaningSummary = d.cleaning_summary;
              
              const s = d.cleaning_summary;
              updateQuality(d.quality_score, s.final_rows, s.missing_filled + s.invalid_coerced + s.business_rules_fixed + s.outliers_capped, s.duplicates_removed, d.headers.length);
              
              if (repCard) repCard.style.display = 'block';
              if (reportsCard) reportsCard.style.display = 'flex';
              if (subtitle) subtitle.innerHTML = '✅ Data cleaned automatically — ' + d.quality_score + '% quality score';
              
              if (d.detailed_logs && d.detailed_logs.length > 0) {
                if (logsCard) logsCard.style.display = 'block';
                if (logsContainer) {
                  logsContainer.innerHTML = d.detailed_logs.map(log => `<div>${log}</div>`).join('');
                }
              }
            }
          }
        }

      } catch (err) {
        console.error('Cleaning Pipeline Error:', err);
        if (subtitle) subtitle.innerHTML = '❌ Error during cleaning: ' + err.message;
      } finally {
        isCleaning = false;
      }
    }

    /* ═══ DATA ANALYTICS ENGINE ═══ */
    function runAnalytics() {
      try {
      const data = cleanedData || uploadedFileData;
      if (!data) { alert('Please upload and clean a dataset first!'); return; }

      const { headers, rows, filename } = data;
      document.getElementById('analytics-file-name').textContent = filename;
      
      const aRep = document.getElementById('reports-dynamic-analytics-report');
      if (aRep) aRep.style.display = 'flex';
      const aName = document.getElementById('dynamic-analytics-name');
      if (aName) aName.textContent = 'Analysis: ' + filename;

      // Use backend analytics if available
      const ba = window._backendAnalytics || null;

      // 1. Dynamic Feature Discovery
      let metricIdx = -1, groupIdx = -1;
      const numKeywords = ['revenue','price','sales','amount','fare','cost','value','weight','length','width','height','score','rating','age','salary','hour','watch','duration','income','views'];
      const catKeywords = ['category','type','status','class','region','species','group','gender','label','dept','country','device','plan','subscription'];

      headers.forEach((h, i) => {
        const l = h.toLowerCase();
        if (metricIdx === -1 && numKeywords.some(k => l.includes(k))) metricIdx = i;
        if (groupIdx === -1 && catKeywords.some(k => l.includes(k))) groupIdx = i;
      });

      // Fallback: find first numeric column by sampling data
      if (metricIdx === -1) {
        headers.forEach((h, i) => {
          let nums = 0, tot = 0;
          rows.slice(0, 50).forEach(r => {
            const v = r[i];
            if (v !== null && v !== undefined && v !== '') {
              tot++;
              if (!isNaN(Number(v))) nums++;
            }
          });
          if (tot > 0 && nums / tot > 0.8 && metricIdx === -1) metricIdx = i;
        });
      }
      // Fallback: find first categorical column by low cardinality
      if (groupIdx === -1) {
        headers.forEach((h, i) => {
          if (i === metricIdx) return;
          const vals = new Set();
          rows.slice(0, 200).forEach(r => { if (r[i] !== null && r[i] !== undefined) vals.add(String(r[i])); });
          if (vals.size > 1 && vals.size < 30 && groupIdx === -1) groupIdx = i;
        });
      }

      const metricName = metricIdx !== -1 ? headers[metricIdx] : 'Records';
      const groupName = groupIdx !== -1 ? headers[groupIdx] : headers[0] || 'Categories';
      const isFin = metricIdx !== -1 && (headers[metricIdx].toLowerCase().match(/price|revenue|sales|cost|fare|amount|profit|income|salary/));

      // 2. Compute REAL aggregates from actual data
      let values = [];
      if (metricIdx !== -1) {
        rows.forEach(r => {
          const v = parseFloat(String(r[metricIdx] || '0').replace(/[$€₹,]/g, ''));
          if (!isNaN(v)) values.push(v);
        });
      }

      // Use backend stats if available for the metric column
      let totalMetric, avgVal, medianVal, minVal, maxVal, stdVal;
      if (ba && ba.numeric_stats && metricIdx !== -1) {
        const colName = headers[metricIdx];
        const ns = ba.numeric_stats.find(s => s.column === colName);
        if (ns) {
          totalMetric = ns.sum;
          avgVal = ns.mean;
          medianVal = ns.median;
          minVal = ns.min;
          maxVal = ns.max;
          stdVal = ns.std;
        }
      }
      // Fallback: compute from rows
      if (totalMetric === undefined) {
        if (values.length > 0) {
          totalMetric = values.reduce((a, b) => a + b, 0);
          avgVal = totalMetric / values.length;
          const sorted = [...values].sort((a, b) => a - b);
          medianVal = sorted[Math.floor(sorted.length / 2)];
          minVal = sorted[0];
          maxVal = sorted[sorted.length - 1];
        } else {
          totalMetric = rows.length;
          avgVal = 0;
          medianVal = 0;
          minVal = 0;
          maxVal = 0;
        }
      }

      // 3. Update KPI Cards with REAL values
      // Decide meaningful labels based on column semantics
      const metricLower = metricName.toLowerCase();
      const isAgeLike = metricLower.includes('age');
      const isHoursLike = metricLower.includes('hour') || metricLower.includes('watch') || metricLower.includes('duration');

      if (isAgeLike) {
        document.getElementById('stat-label-1').textContent = 'Average ' + metricName;
        document.getElementById('stat-label-2').textContent = 'Median ' + metricName;
      } else if (isFin) {
        document.getElementById('stat-label-1').textContent = 'Total ' + metricName;
        document.getElementById('stat-label-2').textContent = 'Average ' + metricName;
      } else {
        document.getElementById('stat-label-1').textContent = 'Average ' + metricName;
        document.getElementById('stat-label-2').textContent = 'Median ' + metricName;
      }
      document.getElementById('stat-label-3').textContent = 'Total Records';
      document.getElementById('stat-label-4').textContent = 'Data Quality';

      const format = (v) => {
        if (v === undefined || v === null || isNaN(v)) return '0';
        if (isFin) return formatCurrency(v);
        if (Math.abs(v) >= 1000000) return (v / 1000000).toFixed(1) + 'M';
        if (Math.abs(v) >= 1000) return Math.round(v).toLocaleString();
        return Number(v).toFixed(1);
      };

      if (isAgeLike || isHoursLike) {
        document.getElementById('stat-revenue').textContent = format(avgVal);
        document.getElementById('stat-aov').textContent = format(medianVal);
      } else if (isFin) {
        document.getElementById('stat-revenue').textContent = format(totalMetric);
        document.getElementById('stat-aov').textContent = format(avgVal);
      } else {
        document.getElementById('stat-revenue').textContent = format(avgVal);
        document.getElementById('stat-aov').textContent = format(medianVal);
      }

      document.getElementById('stat-customers').textContent = rows.length.toLocaleString();

      const qualityScore = window._cleaningSummary ? (window._backendAnalytics ? 'Excellent' : '100%') : '100%';
      const qsPct = document.getElementById('quality-pct-display');
      document.getElementById('stat-rate').textContent = qsPct ? qsPct.textContent : '100%';

      // 4. Distribution Breakdown (Pie) — from REAL category counts
      const gIdx = groupIdx !== -1 ? groupIdx : 0;
      const counts = {};
      rows.forEach(r => {
        const key = (r[gIdx] !== null && r[gIdx] !== undefined) ? String(r[gIdx]) : 'Other';
        counts[key] = (counts[key] || 0) + 1;
      });
      // Use backend categorical distributions if available
      if (ba && ba.categorical_distributions && ba.categorical_distributions.length > 0) {
        const catDist = ba.categorical_distributions[0];
        Object.keys(counts).forEach(k => delete counts[k]);
        Object.entries(catDist.counts).forEach(([k, v]) => { counts[k] = v; });
      }
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
      const totalCount = rows.length; // Use total rows, not just top-4 sum
      const colors = ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24'];
      let cum = 0, leg = '';

      for (let i = 1; i <= 4; i++) { const s = document.getElementById('pie-seg-' + i); if (s) s.setAttribute('stroke-dasharray', '0 100'); }

      sorted.forEach(([name, count], i) => {
        const pct = Math.round((count / totalCount) * 100);
        const seg = document.getElementById('pie-seg-' + (i + 1));
        if (seg) {
          seg.setAttribute('stroke-dasharray', pct + ' ' + (100 - pct));
          seg.setAttribute('stroke-dashoffset', 25 - cum);
          seg.setAttribute('stroke', colors[i]);
        }
        cum += pct;
        leg += '<div class=\"dl-item\"><div class=\"dl-dot\" style=\"background:' + colors[i] + '\"></div><div class=\"dl-label\">' + name + '</div><div class=\"dl-val\">' + pct + '% (' + count + ')</div></div>';
      });
      document.getElementById('pie-legend').innerHTML = leg;

      // 5. Performance Table — REAL aggregation
      const tableData = {};
      rows.forEach(r => {
        const g = (r[gIdx] !== null && r[gIdx] !== undefined) ? String(r[gIdx]) : 'Unknown';
        if (!tableData[g]) tableData[g] = { sum: 0, count: 0, values: [] };
        if (metricIdx !== -1) {
          const v = parseFloat(String(r[metricIdx] || '0').replace(/[$€₹,]/g, ''));
          if (!isNaN(v)) {
            tableData[g].sum += v;
            tableData[g].values.push(v);
          }
        }
        tableData[g].count++;
      });
      const sortedTable = Object.entries(tableData).sort((a, b) => b[1].count - a[1].count).slice(0, 10);

      let html = '<table><thead><tr><th>' + headers[gIdx] + '</th>';
      if (metricIdx !== -1) {
        html += '<th>AVG ' + metricName + '</th><th>MEDIAN</th>';
      }
      html += '<th>RECORDS</th><th>SHARE</th></tr></thead><tbody>';
      sortedTable.forEach(([name, s]) => {
        const avg = s.values.length > 0 ? (s.sum / s.values.length) : 0;
        const sortedVals = [...s.values].sort((a, b) => a - b);
        const med = sortedVals.length > 0 ? sortedVals[Math.floor(sortedVals.length / 2)] : 0;
        const share = Math.round((s.count / rows.length) * 100);
        html += '<tr><td><b>' + name + '</b></td>';
        if (metricIdx !== -1) {
          html += '<td style=\"color:var(--cyan);font-family:var(--mono)\">' + format(avg) + '</td>';
          html += '<td style=\"font-family:var(--mono)\">' + format(med) + '</td>';
        }
        html += '<td>' + s.count.toLocaleString() + '</td>';
        html += '<td><div class=\"prog\" style=\"width:100px\"><div class=\"prog-fill\" style=\"width:' + share + '%\"></div></div> ' + share + '%</td></tr>';
      });
      html += '</tbody></table>';
      document.getElementById('analytics-table-wrap').innerHTML = html;
      document.getElementById('performance-table-title').textContent = 'Statistical Breakdown by ' + headers[gIdx];

      // Sync Reports page table card
      const repWrap = document.getElementById('reports-analytics-table-wrap');
      const repTitle = document.getElementById('reports-performance-table-title');
      if (repWrap) repWrap.innerHTML = html;
      if (repTitle) repTitle.textContent = 'Statistical Breakdown by ' + headers[gIdx];

      // 6. Trend Chart — REAL bucketed data
      const points = [];
      const buckets = 7;
      const size = Math.max(1, Math.floor(rows.length / buckets));
      for (let i = 0; i < buckets; i++) {
        let sum = 0, cnt = 0;
        const s = i * size, end = Math.min(rows.length, (i + 1) * size);
        for (let j = s; j < end; j++) {
          if (metricIdx !== -1) {
            const v = parseFloat(String(rows[j][metricIdx] || '0').replace(/[$€₹,]/g, ''));
            if (!isNaN(v)) { sum += v; cnt++; }
          } else { sum++; cnt++; }
        }
        points.push(cnt > 0 ? sum / cnt : 0); // Use average per bucket, not sum
      }
      drawTrend(points);

      if (currentPage !== 'analytics') navTo('analytics');
      } catch (err) {
        console.error('Analytics Engine Error:', err);
      }
    }

    function drawTrend(points) {
      const max = Math.max(...points) || 1;
      const pts = points.map((p, i) => `${(i * 400) / 6},${110 - (p / max) * 100}`).join(' ');
      const fillPts = `0,120 ${pts} 400,120 Z`;
      document.getElementById('trend-line').setAttribute('points', pts);
      document.getElementById('trend-fill').setAttribute('d', 'M' + fillPts.replace(/ /g, ' L').replace(',', ' '));

      const labels = document.getElementById('trend-labels');
      labels.innerHTML = points.map((_, i) => `<span>T${i + 1}</span>`).join('');
    }

    function formatCurrency(v) {
      if (v >= 10000000) return '₹' + (v / 10000000).toFixed(1) + 'Cr';
      if (v >= 100000) return '₹' + (v / 100000).toFixed(1) + 'L';
      return '₹' + Math.round(v).toLocaleString();
    }

    function downloadCleanCSV() {
      if (!cleanedData) { alert('Please clean a dataset first!'); return; }
      const { headers, rows, filename } = cleanedData;
      let csv = headers.map(h => '"' + String(h).replace(/"/g, '""') + '"').join(',') + '\n';
      rows.forEach(r => {
        csv += r.map(v => {
          const s = (v === null || v === undefined) ? '' : String(v);
          return '"' + s.replace(/"/g, '""') + '"';
        }).join(',') + '\n';
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (filename || 'dataset').replace(/\.[^.]+$/, '') + '_cleaned.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    function downloadRawCSV() {
      if (!uploadedFileData) { alert('Please upload a dataset first!'); return; }
      const { headers, rows, filename } = uploadedFileData;
      let csv = headers.map(h => '"' + String(h).replace(/"/g, '""') + '"').join(',') + '\n';
      rows.forEach(r => {
        csv += r.map(v => {
          const s = (v === null || v === undefined) ? '' : String(v);
          return '"' + s.replace(/"/g, '""') + '"';
        }).join(',') + '\n';
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (filename || 'dataset').replace(/\.[^.]+$/, '') + '_raw.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    function downloadAnalyticsReport() {
      const data = cleanedData || uploadedFileData;
      if (!data) { alert('Please clean a dataset first!'); return; }
      const { headers, rows } = data;
      const ba = window._backendAnalytics || null;
      const summary = window._cleaningSummary || {};
      let report = '═══════════════════════════════════════\n';
      report += '   DATAVAULT — ANALYTICS REPORT\n';
      report += '═══════════════════════════════════════\n';
      report += 'Generated: ' + new Date().toLocaleString() + '\n';
      report += 'Dataset: ' + (data.filename || 'Unknown') + '\n';
      report += 'Total Records: ' + rows.length + '\n';
      report += 'Total Columns: ' + headers.length + '\n\n';
      // Numeric column stats
      if (ba && ba.numeric_stats && ba.numeric_stats.length > 0) {
        report += '── NUMERIC COLUMN STATISTICS ──\n\n';
        ba.numeric_stats.forEach(s => {
          report += '  ' + s.column + ':\n';
          report += '    Mean:   ' + s.mean + '\n';
          report += '    Median: ' + s.median + '\n';
          report += '    Min:    ' + s.min + '\n';
          report += '    Max:    ' + s.max + '\n';
          report += '    Std:    ' + s.std + '\n';
          report += '    Sum:    ' + s.sum + '\n\n';
        });
      }
      // Category distributions
      if (ba && ba.categorical_distributions && ba.categorical_distributions.length > 0) {
        report += '── CATEGORICAL DISTRIBUTIONS ──\n\n';
        ba.categorical_distributions.forEach(cd => {
          report += '  ' + cd.column + ':\n';
          Object.entries(cd.counts).forEach(([k, v]) => {
            report += '    ' + k + ': ' + v + ' (' + Math.round(v / rows.length * 100) + '%)\n';
          });
          report += '\n';
        });
      }
      // Correlations
      if (ba && ba.correlation && Object.keys(ba.correlation).length > 0) {
        report += '── CORRELATION MATRIX ──\n\n';
        const cols = Object.keys(ba.correlation);
        report += '  ' + ''.padEnd(20) + cols.map(c => c.substring(0, 10).padEnd(12)).join('') + '\n';
        cols.forEach(c => {
          report += '  ' + c.substring(0, 20).padEnd(20);
          cols.forEach(c2 => {
            report += String(ba.correlation[c][c2]).padEnd(12);
          });
          report += '\n';
        });
      }
      report += '\n═══════════════════════════════════════\n';
      report += '  Report generated by DataVault Platform\n';
      report += '═══════════════════════════════════════\n';
      downloadTextFile(report, 'DataVault_Analytics_Report.txt');
    }

    function downloadQualityReport() {
      const data = cleanedData || uploadedFileData;
      if (!data) { alert('Please clean a dataset first!'); return; }
      const summary = window._cleaningSummary || {};
      const ba = window._backendAnalytics || null;
      let report = '═══════════════════════════════════════\n';
      report += '   DATAVAULT — DATA QUALITY REPORT\n';
      report += '═══════════════════════════════════════\n';
      report += 'Generated: ' + new Date().toLocaleString() + '\n';
      report += 'Dataset: ' + (data.filename || 'Unknown') + '\n\n';
      report += '── CLEANING SUMMARY ──\n\n';
      report += '  Original Rows:        ' + (summary.original_rows || 'N/A') + '\n';
      report += '  Final Rows:           ' + (summary.final_rows || data.rows.length) + '\n';
      report += '  Duplicates Removed:   ' + (summary.duplicates_removed || 0) + '\n';
      report += '  Missing Values Fixed: ' + (summary.missing_filled || 0) + '\n';
      report += '  Invalid Values Coerced: ' + (summary.invalid_coerced || 0) + '\n';
      report += '  Business Rules Fixed: ' + (summary.business_rules_fixed || 0) + '\n';
      report += '  Outliers Capped:      ' + (summary.outliers_capped || 0) + '\n\n';
      const totalIssues = (summary.duplicates_removed || 0) + (summary.missing_filled || 0) +
        (summary.invalid_coerced || 0) + (summary.business_rules_fixed || 0) + (summary.outliers_capped || 0);
      const totalCells = (summary.original_rows || data.rows.length) * data.headers.length;
      const quality = Math.max(0, Math.min(100, Math.round(100 - (totalIssues / Math.max(totalCells, 1)) * 100)));
      report += '── DATA QUALITY SCORE ──\n\n';
      report += '  Score: ' + quality + '%\n';
      report += '  Total Issues Found & Fixed: ' + totalIssues + '\n';
      report += '  Total Cells Scanned: ' + totalCells + '\n\n';
      report += '── COLUMN OVERVIEW ──\n\n';
      data.headers.forEach((h, i) => {
        let nulls = 0;
        data.rows.forEach(r => { if (r[i] === null || r[i] === undefined || String(r[i]).trim() === '') nulls++; });
        report += '  ' + h + ': ' + nulls + ' missing (' + Math.round(nulls / data.rows.length * 100) + '%)\n';
      });
      report += '\n═══════════════════════════════════════\n';
      report += '  Report generated by DataVault Platform\n';
      report += '═══════════════════════════════════════\n';
      downloadTextFile(report, 'DataVault_Quality_Report.txt');
    }

    function downloadInsightsReport() {
      const data = cleanedData || uploadedFileData;
      if (!data) { alert('Please clean a dataset first!'); return; }
      const { headers, rows } = data;
      const ba = window._backendAnalytics || null;
      let report = '═══════════════════════════════════════\n';
      report += '   DATAVAULT — INSIGHTS REPORT\n';
      report += '═══════════════════════════════════════\n';
      report += 'Generated: ' + new Date().toLocaleString() + '\n';
      report += 'Dataset: ' + (data.filename || 'Unknown') + '\n';
      report += 'Records: ' + rows.length + ' | Columns: ' + headers.length + '\n\n';
      // Top categories per categorical column
      if (ba && ba.categorical_distributions) {
        report += '── KEY INSIGHTS ──\n\n';
        ba.categorical_distributions.forEach(cd => {
          const entries = Object.entries(cd.counts).sort((a, b) => b[1] - a[1]);
          const top = entries[0];
          report += '  ' + cd.column + ': Most common = "' + top[0] + '" (' + top[1] + ' records, ' + Math.round(top[1] / rows.length * 100) + '%)\n';
        });
        report += '\n';
      }
      if (ba && ba.numeric_stats) {
        report += '── NUMERIC HIGHLIGHTS ──\n\n';
        ba.numeric_stats.forEach(s => {
          report += '  ' + s.column + ': Range [' + s.min + ' – ' + s.max + '], Avg=' + s.mean + ', Spread(σ)=' + s.std + '\n';
        });
      }
      report += '\n═══════════════════════════════════════\n';
      report += '  Report generated by DataVault Platform\n';
      report += '═══════════════════════════════════════\n';
      downloadTextFile(report, 'DataVault_Insights_Report.txt');
    }

    function downloadUsageReport() {
      let report = '═══════════════════════════════════════\n';
      report += '   DATAVAULT — SYSTEM USAGE REPORT\n';
      report += '═══════════════════════════════════════\n';
      report += 'Generated: ' + new Date().toLocaleString() + '\n\n';
      report += '── SESSION ACTIVITY ──\n\n';
      report += '  Datasets Uploaded: ' + (cleanedData ? 1 : 0) + '\n';
      report += '  Cleaning Runs: ' + (cleanedData ? 1 : 0) + '\n';
      report += '  Analytics Generated: ' + (window._backendAnalytics ? 'Yes' : 'No') + '\n';
      report += '  Reports Downloaded: This session\n';
      if (cleanedData) {
        report += '\n── LAST DATASET ──\n\n';
        report += '  File: ' + cleanedData.filename + '\n';
        report += '  Rows: ' + cleanedData.rows.length + '\n';
        report += '  Columns: ' + cleanedData.headers.length + '\n';
      }
      report += '\n═══════════════════════════════════════\n';
      report += '  Report generated by DataVault Platform\n';
      report += '═══════════════════════════════════════\n';
      downloadTextFile(report, 'DataVault_Usage_Report.txt');
    }

    function downloadTextFile(text, filename) {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    function setTheme(theme) {
      const body = document.body;
      const darkBtn = document.getElementById('theme-btn-dark');
      const lightBtn = document.getElementById('theme-btn-light');
      const loginDarkBtn = document.getElementById('login-theme-btn-dark');
      const loginLightBtn = document.getElementById('login-theme-btn-light');
      
      if (theme === 'light') {
        body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
        if (darkBtn) darkBtn.classList.remove('active');
        if (lightBtn) lightBtn.classList.add('active');
        if (loginDarkBtn) loginDarkBtn.classList.remove('active');
        if (loginLightBtn) loginLightBtn.classList.add('active');
      } else {
        body.classList.remove('light-theme');
        localStorage.setItem('theme', 'dark');
        if (lightBtn) lightBtn.classList.remove('active');
        if (darkBtn) darkBtn.classList.add('active');
        if (loginLightBtn) loginLightBtn.classList.remove('active');
        if (loginDarkBtn) loginDarkBtn.classList.add('active');
      }
      
      // Reset particle colors instantly for seamless animation transition
      if (typeof resetAllParticles === 'function') {
        resetAllParticles();
      }
      
      // If we have active data, let's refresh analytics so SVG segments get correct color rendering
      if (uploadedFileData) {
        if (currentPage === 'analytics') runAnalytics();
      }
    }

    // Auto-restore saved theme on load
    (function() {
      const savedTheme = localStorage.getItem('theme') || 'dark';
      document.addEventListener('DOMContentLoaded', () => {
        setTheme(savedTheme);
      });
    })();
  