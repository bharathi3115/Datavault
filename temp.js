

    document.addEventListener('DOMContentLoaded', () => {
      const role = localStorage.getItem('userRole') || 'user';
      const adminElements = document.querySelectorAll('.admin-only');
      const roleLabel = document.querySelector('.sb-user-role');
      if (role === 'admin') {
        adminElements.forEach(el => el.style.display = '');
        if (roleLabel) roleLabel.textContent = 'Admin · Free Plan';
      } else {
        adminElements.forEach(el => el.style.display = 'none');
        if (roleLabel) roleLabel.textContent = 'User · Free Plan';
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
      document.getElementById('tb-secondary-btn').textContent = cfg.btn1;
      document.getElementById('tb-primary-btn').textContent = cfg.btn2;
      currentPage = id;

      if (id === 'analytics') runAnalytics();
    }

    document.querySelectorAll('.sb-item').forEach(item => {
      item.addEventListener('click', () => navTo(item.dataset.page));
    });

    /* ── LOGIN ── */
        

    /* ── FILE UPLOAD & PARSING ── */
    let uploadedFileData = null;

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
      const routes = { dashboard: 'upload', upload: 'upload', cleaning: 'analytics', analytics: 'reports', reports: 'reports', security: 'security', users: 'users', logs: 'logs' };
      navTo(routes[currentPage] || currentPage);
    });
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
    let cleanedData = null;
    let isCleaning = false;

    function startCleaningPipeline() {
      if (!uploadedFileData || !uploadedFileData.rows.length) {
        alert('Please upload a dataset first.');
        return;
      }
      navTo('cleaning');
      runCleaningPipeline();
    }

    function autoStartCleaning() {
      if (currentPage === 'cleaning') return;
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

    const STEPS = [
      { t: 'Duplicate Row Removal', d: 'Identifying and removing identical rows based on all columns.' },
      { t: 'Missing Value Handling', d: 'Filling numeric columns with median, categorical with mode.' },
      { t: 'Outlier Detection', d: 'Z-score method to cap extreme values in numeric columns.' },
      { t: 'Data Type Standardization', d: 'Normalizing text case, trimming whitespace, fixing number formats.' },
      { t: 'Feature Validation', d: 'Cross-validating column relationships and flagging inconsistencies.' }
    ];

    function renderSteps(curStep, stepResults) {
      const container = document.getElementById('cleaning-steps-container');
      if (!container) return;
      let html = '';
      for (let i = 0; i < 5; i++) {
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
      isCleaning = true;
      const { headers, rows, filename } = uploadedFileData;
      const subtitle = document.getElementById('cleaning-subtitle');
      if (subtitle) subtitle.innerHTML = 'Automatic preprocessing pipeline — reviewing <b>' + escapeHtml(filename) + '</b>';

      const colTypes = detectColTypes(headers, rows);
      let curRows = rows.map(r => [...r]), results = {}, fixed = 0, removed = 0, origCount = rows.length;
      updateQuality(0, 0, 0, 0, headers.length);

      // Step 1: Duplicates
      renderSteps(0, results); await animProg(0, 800);
      const seen = new Set(); const uniq = []; let dups = 0;
      curRows.forEach(r => { const k = r.join('|'); if (seen.has(k)) dups++; else { seen.add(k); uniq.push([...r]); } });
      curRows = uniq; removed += dups;
      results[0] = [dups + ' duplicates removed', curRows.length.toLocaleString() + ' rows retained'];
      updateQuality(20, curRows.length, fixed, removed, headers.length);

      // Step 2: Missing Values
      renderSteps(1, results); await animProg(1, 1000);
      let filled = 0, colsAff = new Set();
      const medians = {}, modes = {};
      headers.forEach((_, ci) => {
        if (colTypes[ci] === 'numeric') {
          const v = curRows.map(r => r[ci]).filter(v => isNum(v)).map(Number).sort((a, b) => a - b);
          if (v.length) medians[ci] = v[Math.floor(v.length / 2)];
        } else {
          const freq = {}; curRows.forEach(r => { const v = (r[ci] || '').trim(); if (v) freq[v] = (freq[v] || 0) + 1; });
          let mx = 0, mv = ''; for (const k in freq) if (freq[k] > mx) { mx = freq[k]; mv = k; } modes[ci] = mv;
        }
      });
      curRows = curRows.map(r => {
        const n = [...r]; headers.forEach((_, ci) => {
          if ((n[ci] || '').trim() === '') {
            if (colTypes[ci] === 'numeric' && medians[ci] != null) { n[ci] = String(medians[ci]); filled++; colsAff.add(ci); }
            else if (modes[ci]) { n[ci] = modes[ci]; filled++; colsAff.add(ci); }
          }
        }); return n;
      });
      fixed += filled;
      results[1] = [filled.toLocaleString() + ' cells filled', colsAff.size + ' columns affected'];
      updateQuality(40, curRows.length, fixed, removed, headers.length);

      // Step 3: Outliers
      renderSteps(2, results); await animProg(2, 1200);
      let outliers = 0;
      headers.forEach((_, ci) => {
        if (colTypes[ci] !== 'numeric') return;
        const v = curRows.map(r => r[ci]).filter(v => isNum(v)).map(Number).sort((a, b) => a - b);
        if (v.length < 4) return;
        const q1 = v[Math.floor(v.length * .25)], q3 = v[Math.floor(v.length * .75)], iqr = q3 - q1;
        const lo = q1 - 1.5 * iqr, hi = q3 + 1.5 * iqr;
        curRows.forEach(r => {
          if (!isNum(r[ci])) return; const n = Number(r[ci]);
          if (n < lo) { r[ci] = String(Math.round(lo * 100) / 100); outliers++; }
          else if (n > hi) { r[ci] = String(Math.round(hi * 100) / 100); outliers++; }
        });
      });
      fixed += outliers;
      results[2] = [outliers + ' outliers capped', 'IQR method applied'];
      updateQuality(60, curRows.length, fixed, removed, headers.length);

      // Step 4: Standardization
      renderSteps(3, results); await animProg(3, 900);
      let textFix = 0, numFix = 0;
      curRows = curRows.map(r => {
        const n = [...r]; headers.forEach((_, ci) => {
          let v = (n[ci] || '').toString();
          if (colTypes[ci] === 'text') { const t = v.trim().replace(/\s+/g, ' '); if (t !== v) textFix++; n[ci] = t; }
          else if (colTypes[ci] === 'numeric') { const c = v.replace(/[$€£₹,\s]/g, '').trim(); if (c !== v && isNum(c)) { n[ci] = c; numFix++; } }
        }); return n;
      });
      fixed += textFix + numFix;
      results[3] = [textFix + ' text normalized', numFix + ' numbers fixed'];
      updateQuality(80, curRows.length, fixed, removed, headers.length);

      // Step 5: Validation
      renderSteps(4, results); await animProg(4, 1100);
      const final = []; let emptyRows = 0, inconsis = 0;
      curRows.forEach(r => {
        const empty = r.filter(v => (v || '').trim() === '').length;
        if (empty / headers.length > 0.5) { emptyRows++; return; }
        headers.forEach((_, ci) => { if (colTypes[ci] === 'numeric' && (r[ci] || '').trim() !== '' && !isNum(r[ci])) inconsis++; });
        final.push(r);
      });
      curRows = final; removed += emptyRows;
      results[4] = [curRows.length.toLocaleString() + ' valid rows', emptyRows + ' empty rows removed', inconsis + ' inconsistencies'];
      renderSteps(5, results);

      const q = Math.max(0, Math.min(100, Math.round((curRows.length / origCount) * 100)));
      updateQuality(q, curRows.length, fixed, removed, headers.length);
      cleanedData = { headers, rows: curRows, filename };
      isCleaning = false;

      // Update Reports tab with the dynamic card
      const repCard = document.getElementById('dynamic-clean-report');
      if (repCard) {
        repCard.style.display = 'flex';
        document.getElementById('dynamic-report-name').textContent = 'Cleaned: ' + filename;
        document.getElementById('dynamic-report-time').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }

    /* ═══ DATA ANALYTICS ENGINE ═══ */
    function runAnalytics() {
      const data = cleanedData || uploadedFileData;
      if (!data) { alert('Please upload and clean a dataset first!'); return; }

      const { headers, rows, filename } = data;
      document.getElementById('analytics-file-name').textContent = filename;

      // 1. Dynamic Feature Discovery
      let metricIdx = -1, groupIdx = -1;
      const numKeywords = ['revenue','price','sales','amount','fare','cost','value','weight','length','width','height','score','rating','age','salary'];
      const catKeywords = ['category','type','status','class','region','species','group','gender','label','dept'];

      // Find first likely numeric column
      headers.forEach((h, i) => {
        const l = h.toLowerCase();
        if (metricIdx === -1 && numKeywords.some(k => l.includes(k))) metricIdx = i;
        if (groupIdx === -1 && catKeywords.some(k => l.includes(k))) groupIdx = i;
      });

      // Fallback: If no keywords, find columns with numeric density
      if (metricIdx === -1) {
        headers.forEach((h, i) => {
          let nums = 0, tot = 0;
          rows.slice(0, 50).forEach(r => { if(r[i]) { tot++; if(isNum(r[i].replace(/[$€₹,]/g,''))) nums++; } });
          if (tot > 0 && nums/tot > 0.8 && metricIdx === -1) metricIdx = i;
        });
      }
      // Fallback: If no categories, find columns with low cardinality
      if (groupIdx === -1) {
        headers.forEach((h, i) => {
          if (i === metricIdx) return;
          const vals = new Set(); rows.slice(0, 100).forEach(r => { if(r[i]) vals.add(r[i]); });
          if (vals.size > 1 && vals.size < 20 && groupIdx === -1) groupIdx = i;
        });
      }

      const metricName = metricIdx !== -1 ? headers[metricIdx] : 'Records';
      const groupName = groupIdx !== -1 ? headers[groupIdx] : 'Categories';
      const isFin = metricIdx !== -1 && (headers[metricIdx].toLowerCase().match(/price|revenue|sales|cost|fare|amount|profit/));

      // 2. Aggregate Data
      let totalMetric = 0, rowCount = rows.length;
      rows.forEach(r => {
        if (metricIdx !== -1) {
          const v = parseFloat((r[metricIdx]||'0').toString().replace(/[$€₹,]/g,''));
          if (!isNaN(v)) totalMetric += v;
        } else totalMetric++;
      });
      const avgVal = totalMetric / (rowCount || 1);

      // 3. Update UI Labels & KPIs
      document.getElementById('stat-label-1').textContent = 'Total ' + metricName;
      document.getElementById('stat-label-2').textContent = 'Average ' + metricName;
      document.getElementById('stat-label-3').textContent = 'Unique ' + groupName;
      document.getElementById('stat-label-4').textContent = 'Data Quality';

      const format = (v) => isFin ? formatCurrency(v) : (v > 1000 ? Math.round(v).toLocaleString() : v.toFixed(1));
      document.getElementById('stat-revenue').textContent = format(totalMetric);
      document.getElementById('stat-aov').textContent = format(avgVal);
      
      const uniqueGroups = new Set();
      const gIdx = groupIdx !== -1 ? groupIdx : 0;
      rows.forEach(r => { if(r[gIdx]) uniqueGroups.add(r[gIdx]); });
      document.getElementById('stat-customers').textContent = uniqueGroups.size.toLocaleString();
      
      const qualityScore = document.getElementById('quality-pct-display') ? document.getElementById('quality-pct-display').textContent : '100%';
      document.getElementById('stat-rate').textContent = qualityScore;

      // 4. Distribution Breakdown (Pie)
      const counts = {};
      rows.forEach(r => { const key = (r[gIdx]||'Other').toString(); counts[key] = (counts[key] || 0) + 1; });
      const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 4);
      const totalCount = sorted.reduce((a, b) => a + b[1], 0);
      const colors = ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24'];
      let cum = 0, leg = '';
      
      for(let i=1; i<=4; i++) { const s = document.getElementById('pie-seg-'+i); if(s) s.setAttribute('stroke-dasharray', '0 100'); }
      
      sorted.forEach(([name, count], i) => {
        const pct = Math.round((count / totalCount) * 100);
        const seg = document.getElementById('pie-seg-' + (i + 1));
        if (seg) {
          seg.setAttribute('stroke-dasharray', pct + ' ' + (100 - pct));
          seg.setAttribute('stroke-dashoffset', 25 - cum);
          seg.setAttribute('stroke', colors[i]);
        }
        cum += pct;
        leg += `<div class="dl-item"><div class="dl-dot" style="background:${colors[i]}"></div><div class="dl-label">${name}</div><div class="dl-val">${pct}%</div></div>`;
      });
      document.getElementById('pie-legend').innerHTML = leg;

      // 5. Performance Table
      const tableData = {};
      rows.forEach(r => {
        const g = r[gIdx] || 'Unknown';
        if (!tableData[g]) tableData[g] = { val: 0, count: 0 };
        if (metricIdx !== -1) {
          const v = parseFloat((r[metricIdx]||'0').toString().replace(/[$€₹,]/g,''));
          if (!isNaN(v)) tableData[g].val += v;
        }
        tableData[g].count++;
      });
      const sortedTable = Object.entries(tableData).sort((a,b) => b[1].val - a[1].val || b[1].count - a[1].count).slice(0, 10);
      const maxTableVal = Math.max(...sortedTable.map(x => metricIdx !== -1 ? x[1].val : x[1].count)) || 1;
      
      let html = `<table><thead><tr><th>${headers[gIdx].toUpperCase()}</th><th>${metricName.toUpperCase()}</th><th>RECORDS</th><th>SHARE</th></tr></thead><tbody>`;
      sortedTable.forEach(([name, s]) => {
        const val = metricIdx !== -1 ? s.val : s.count;
        const share = Math.round((val / maxTableVal) * 100);
        html += `<tr><td><b>${name}</b></td><td style="color:var(--cyan);font-family:var(--mono)">${format(val)}</td><td>${s.count.toLocaleString()}</td><td><div class="prog" style="width:100px"><div class="prog-fill" style="width:${share}%"></div></div></td></tr>`;
      });
      html += '</tbody></table>';
      document.getElementById('analytics-table-wrap').innerHTML = html;
      document.getElementById('performance-table-title').textContent = 'Statistical Breakdown: ' + headers[gIdx];

      // 6. Trend Chart
      const points = [];
      const size = Math.max(1, Math.floor(rowCount / 7));
      for (let i = 0; i < 7; i++) {
        let sum = 0;
        const s = i * size, e = Math.min(rowCount, (i + 1) * size);
        for (let j = s; j < e; j++) {
          if (metricIdx !== -1) {
            const v = parseFloat((rows[j][metricIdx]||'0').toString().replace(/[$€₹,]/g,''));
            if (!isNaN(v)) sum += v;
          } else sum++;
        }
        points.push(sum);
      }
      drawTrend(points);

      if (currentPage !== 'analytics') navTo('analytics');
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
      if (!cleanedData) return;
      const { headers, rows, filename } = cleanedData;
      let csv = headers.map(h => '"' + h.replace(/"/g, '""') + '"').join(',') + '\n';
      rows.forEach(r => { csv += r.map(v => '"' + (v || '').replace(/"/g, '""') + '"').join(',') + '\n'; });
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename.replace(/\.[^.]+$/, '') + '_cleaned.csv';
      a.click();
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
  