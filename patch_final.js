const fs = require('fs');
let html = fs.readFileSync('dashboard.html', 'utf8');

// 1. Re-apply patch.js changes for Activity Log
html = html.replace(
  '<div class="sb-item" data-page="reports">\n            <span class="sb-icon">📋</span> Reports\n          </div>\n        </div>',
  '<div class="sb-item" data-page="reports">\n            <span class="sb-icon">📋</span> Reports\n          </div>\n          <div class="sb-item" data-page="activity_log">\n            <span class="sb-icon">🕒</span> Activity Log\n          </div>\n        </div>'
);
html = html.replace(
  '<div class="sb-item" data-page="reports">\r\n            <span class="sb-icon">📋</span> Reports\r\n          </div>\r\n        </div>',
  '<div class="sb-item" data-page="reports">\r\n            <span class="sb-icon">📋</span> Reports\r\n          </div>\r\n          <div class="sb-item" data-page="activity_log">\r\n            <span class="sb-icon">🕒</span> Activity Log\r\n          </div>\r\n        </div>'
);

html = html.replace(
  '        <!-- ── USERS ── -->',
  `        <!-- ── ACTIVITY LOG ── -->
        <div id="pg-activity_log" class="fade-in" style="display:none;">
          <div class="section-head">
            <div>
              <h2>Activity Log</h2>
              <p>Chronological history of all your actions on the DataVault platform.</p>
            </div>
            <button class="tb-btn primary" onclick="initDummyActivities(true)">+ Load Dummy Data</button>
          </div>
          
          <div class="grid g-3" style="margin-bottom:24px;">
            <div class="card hover-glow" style="padding:20px;border-top:2px solid #38bdf8;background:linear-gradient(180deg,rgba(56,189,248,0.03),var(--surface1));">
              <div style="font-size:10px;font-weight:600;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Total Activities</div>
              <div id="activity-stat-total" style="font-size:32px;font-weight:700;color:var(--text);">0</div>
            </div>
            <div class="card hover-glow" style="padding:20px;border-top:2px solid #10b981;background:linear-gradient(180deg,rgba(16,185,129,0.03),var(--surface1));">
              <div style="font-size:10px;font-weight:600;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Uploads</div>
              <div id="activity-stat-uploads" style="font-size:32px;font-weight:700;color:var(--text);">0</div>
            </div>
            <div class="card hover-glow" style="padding:20px;border-top:2px solid #f59e0b;background:linear-gradient(180deg,rgba(245,158,11,0.03),var(--surface1));">
              <div style="font-size:10px;font-weight:600;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Reports Generated</div>
              <div id="activity-stat-reports" style="font-size:32px;font-weight:700;color:var(--text);">0</div>
            </div>
          </div>

          <div style="display:flex;gap:10px;margin-bottom:24px;flex-wrap:wrap;">
            <button class="btn primary sm" onclick="filterActivityLog('all', this)" id="filter-btn-all">All Activities</button>
          </div>

          <div class="card" style="padding:24px;">
            <div id="activity-log-feed" style="display:flex;flex-direction:column;gap:16px;"></div>
          </div>
        </div>

        <!-- ── USERS ── -->`
);

// Routing object
html = html.replace(
  "      reports: { title: 'Reports', breadcrumb: 'DataVault / Reports', btn1: 'Schedule Report', btn2: '+ New Report' },",
  "      reports: { title: 'Reports', breadcrumb: 'DataVault / Reports', btn1: 'Schedule Report', btn2: '+ New Report' },\n      activity_log: { title: 'Activity Log', breadcrumb: 'DataVault / Activity Log', btn1: 'Export Log', btn2: 'Clear Log' },"
);

// navTo
html = html.replace(
  "      if (id === 'feedback_overview') {\n        setTimeout(drawFeedbackOverviewCharts, 300);\n      }\n    }",
  "      if (id === 'feedback_overview') {\n        setTimeout(drawFeedbackOverviewCharts, 300);\n      }\n      if (id === 'activity_log') {\n        renderActivityLog();\n      }\n    }"
);
html = html.replace(
  "      if (id === 'feedback_overview') {\r\n        setTimeout(drawFeedbackOverviewCharts, 300);\r\n      }\r\n    }",
  "      if (id === 'feedback_overview') {\r\n        setTimeout(drawFeedbackOverviewCharts, 300);\r\n      }\r\n      if (id === 'activity_log') {\r\n        renderActivityLog();\r\n      }\r\n    }"
);

// Hooks
html = html.replace(
  "    function discardUpload() {\n      document.getElementById('upload-success').style.display = 'none';",
  "    function discardUpload() {\n      if (window.rawUploadedFile && typeof logActivity === 'function') logActivity('Uploads', `Deleted dataset ${window.rawUploadedFile.name}`);\n      document.getElementById('upload-success').style.display = 'none';"
);
html = html.replace(
  "    function discardUpload() {\r\n      document.getElementById('upload-success').style.display = 'none';",
  "    function discardUpload() {\r\n      if (window.rawUploadedFile && typeof logActivity === 'function') logActivity('Uploads', `Deleted dataset ${window.rawUploadedFile.name}`);\r\n      document.getElementById('upload-success').style.display = 'none';"
);

html = html.replace(
  "    function processFile(file) {\n      window.rawUploadedFile = file;",
  "    function processFile(file) {\n      if (typeof logActivity === 'function') logActivity('Uploads', `Uploaded customer_data.csv`);\n      window.rawUploadedFile = file;"
);
html = html.replace(
  "    function processFile(file) {\r\n      window.rawUploadedFile = file;",
  "    function processFile(file) {\r\n      if (typeof logActivity === 'function') logActivity('Uploads', `Uploaded customer_data.csv`);\r\n      window.rawUploadedFile = file;"
);

html = html.replace(
  "    function startCleaningPipeline() {\n      if (!uploadedFileData || !uploadedFileData.rows.length) {\n        alert('Please upload a dataset first.');\n        return;\n      }\n      navTo('cleaning');",
  "    function startCleaningPipeline() {\n      if (!uploadedFileData || !uploadedFileData.rows.length) {\n        alert('Please upload a dataset first.');\n        return;\n      }\n      if (typeof logActivity === 'function') logActivity('Cleaning Operations', `Started data cleaning on customer_data.csv`);\n      navTo('cleaning');"
);
html = html.replace(
  "    function startCleaningPipeline() {\r\n      if (!uploadedFileData || !uploadedFileData.rows.length) {\r\n        alert('Please upload a dataset first.');\r\n        return;\r\n      }\r\n      navTo('cleaning');",
  "    function startCleaningPipeline() {\r\n      if (!uploadedFileData || !uploadedFileData.rows.length) {\r\n        alert('Please upload a dataset first.');\r\n        return;\r\n      }\r\n      if (typeof logActivity === 'function') logActivity('Cleaning Operations', `Started data cleaning on customer_data.csv`);\r\n      navTo('cleaning');"
);

html = html.replace(
  "              }\n            }\n          }\n        }\n\n      } catch (err) {",
  "              }\n            }\n          }\n        }\n        if (typeof logActivity === 'function') logActivity('Cleaning Operations', 'Completed data cleaning');\n      } catch (err) {"
);
html = html.replace(
  "              }\r\n            }\r\n          }\r\n        }\r\n\r\n      } catch (err) {",
  "              }\r\n            }\r\n          }\r\n        }\r\n        if (typeof logActivity === 'function') logActivity('Cleaning Operations', 'Completed data cleaning');\r\n      } catch (err) {"
);

html = html.replace(
  "    function runAnalytics() {\n      try {\n      const data = cleanedData || uploadedFileData;\n      if (!data) { alert('Please upload and clean a dataset first!'); return; }\n\n      const { headers, rows, filename } = data;",
  "    function runAnalytics() {\n      try {\n      const data = cleanedData || uploadedFileData;\n      if (!data) { alert('Please upload and clean a dataset first!'); return; }\n      if (typeof logActivity === 'function') logActivity('Analytics', 'Generated analytics report');\n      const { headers, rows, filename } = data;"
);
html = html.replace(
  "    function runAnalytics() {\r\n      try {\r\n      const data = cleanedData || uploadedFileData;\r\n      if (!data) { alert('Please upload and clean a dataset first!'); return; }\r\n\r\n      const { headers, rows, filename } = data;",
  "    function runAnalytics() {\r\n      try {\r\n      const data = cleanedData || uploadedFileData;\r\n      if (!data) { alert('Please upload and clean a dataset first!'); return; }\r\n      if (typeof logActivity === 'function') logActivity('Analytics', 'Generated analytics report');\r\n      const { headers, rows, filename } = data;"
);

html = html.replace(
  "    function downloadCleanCSV() {\n      if (!cleanedData) { alert('Please clean a dataset first!'); return; }\n      const { headers, rows, filename } = cleanedData;",
  "    function downloadCleanCSV() {\n      if (!cleanedData) { alert('Please clean a dataset first!'); return; }\n      if (typeof logActivity === 'function') logActivity('Exports', 'Exported cleaned dataset');\n      const { headers, rows, filename } = cleanedData;"
);
html = html.replace(
  "    function downloadCleanCSV() {\r\n      if (!cleanedData) { alert('Please clean a dataset first!'); return; }\r\n      const { headers, rows, filename } = cleanedData;",
  "    function downloadCleanCSV() {\r\n      if (!cleanedData) { alert('Please clean a dataset first!'); return; }\r\n      if (typeof logActivity === 'function') logActivity('Exports', 'Exported cleaned dataset');\r\n      const { headers, rows, filename } = cleanedData;"
);

html = html.replace(
  "    function downloadRawCSV() {\n      if (!uploadedFileData) { alert('Please upload a dataset first!'); return; }\n      const { headers, rows, filename } = uploadedFileData;",
  "    function downloadRawCSV() {\n      if (!uploadedFileData) { alert('Please upload a dataset first!'); return; }\n      if (typeof logActivity === 'function') logActivity('Downloads', 'Downloaded raw dataset');\n      const { headers, rows, filename } = uploadedFileData;"
);
html = html.replace(
  "    function downloadRawCSV() {\r\n      if (!uploadedFileData) { alert('Please upload a dataset first!'); return; }\r\n      const { headers, rows, filename } = uploadedFileData;",
  "    function downloadRawCSV() {\r\n      if (!uploadedFileData) { alert('Please upload a dataset first!'); return; }\r\n      if (typeof logActivity === 'function') logActivity('Downloads', 'Downloaded raw dataset');\r\n      const { headers, rows, filename } = uploadedFileData;"
);

html = html.replace(
  "    function downloadAnalyticsReport() {\n      const data = cleanedData || uploadedFileData;\n      if (!data) { alert('Please clean a dataset first!'); return; }\n      const { headers, rows } = data;",
  "    function downloadAnalyticsReport() {\n      const data = cleanedData || uploadedFileData;\n      if (!data) { alert('Please clean a dataset first!'); return; }\n      if (typeof logActivity === 'function') logActivity('Reports', 'Downloaded report');\n      const { headers, rows } = data;"
);
html = html.replace(
  "    function downloadAnalyticsReport() {\r\n      const data = cleanedData || uploadedFileData;\r\n      if (!data) { alert('Please clean a dataset first!'); return; }\r\n      const { headers, rows } = data;",
  "    function downloadAnalyticsReport() {\r\n      const data = cleanedData || uploadedFileData;\r\n      if (!data) { alert('Please clean a dataset first!'); return; }\r\n      if (typeof logActivity === 'function') logActivity('Reports', 'Downloaded report');\r\n      const { headers, rows } = data;"
);

const jsLogic = `
    /* ── ACTIVITY LOG ── */
    function logActivity(type, action, status = 'Success') {
      let activities = JSON.parse(localStorage.getItem('datavault_user_activities') || '[]');
      const now = new Date();
      const m = now.toLocaleString('default', { month: 'short' });
      const d = String(now.getDate()).padStart(2, '0');
      const y = now.getFullYear();
      const fDate = \`\${d} \${m} \${y}\`;
      const fTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      let icon = '⚡';
      if (type === 'Uploads') icon = '☁️';
      if (type === 'Cleaning Operations') icon = '🧹';
      if (type === 'Analytics') icon = '📈';
      if (type === 'Reports') icon = '📋';
      if (type === 'Downloads') icon = '⬇️';
      if (type === 'Exports') icon = '📤';

      activities.unshift({
        type, action, status, date: fDate, time: fTime, icon, timestamp: now.getTime()
      });
      
      localStorage.setItem('datavault_user_activities', JSON.stringify(activities));
      if (currentPage === 'activity_log') renderActivityLog();
    }

    let currentActivityFilter = 'all';

    function filterActivityLog(type, btnElement) {
      currentActivityFilter = type;
      if (btnElement) {
        btnElement.parentElement.querySelectorAll('.btn').forEach(btn => {
          btn.classList.remove('primary');
          btn.classList.add('outline');
        });
        btnElement.classList.remove('outline');
        btnElement.classList.add('primary');
      }
      renderActivityLog();
    }

    function renderActivityLog() {
      let activities = JSON.parse(localStorage.getItem('datavault_user_activities') || '[]');
      
      const elTotal = document.getElementById('activity-stat-total');
      const elUploads = document.getElementById('activity-stat-uploads');
      const elReports = document.getElementById('activity-stat-reports');
      
      if (elTotal) elTotal.textContent = activities.length;
      if (elUploads) elUploads.textContent = activities.filter(a => a.type === 'Uploads').length;
      if (elReports) elReports.textContent = activities.filter(a => a.type === 'Reports').length;

      if (currentActivityFilter !== 'all') {
        activities = activities.filter(a => a.type === currentActivityFilter);
      }

      const feed = document.getElementById('activity-log-feed');
      if (!feed) return;
      feed.innerHTML = '';

      if (activities.length === 0) {
        feed.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted);">No activities found.</div>';
        return;
      }

      try {
        activities.forEach(a => {
          if (!a || typeof a !== 'object') return;
          const badgeCls = a.status === 'Success' ? 'done' : 'err';
          feed.innerHTML += \`
            <div style="display:flex;gap:16px;align-items:flex-start;padding:16px;background:rgba(255,255,255,0.02);border-radius:12px;border:1px solid rgba(255,255,255,0.05);transition:transform 0.2s;">
              <div style="width:40px;height:40px;border-radius:12px;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">
                \${a.icon || '⚡'}
              </div>
              <div style="flex:1;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                  <div style="font-weight:600;color:var(--text);font-size:15px;">\${a.action || 'Unknown Action'}</div>
                  <div style="font-size:12px;color:var(--muted);">\${a.date || ''}, \${a.time || ''}</div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                  <span class="badge \${badgeCls}" style="font-size:11px;padding:4px 8px;">\${a.status || 'Success'}</span>
                  <span style="font-size:12px;color:var(--muted);">\${a.type || 'System'}</span>
                </div>
              </div>
            </div>
          \`;
        });
      } catch (err) {
        feed.innerHTML = \`<div style="color:#ef4444;padding:20px;">Render Error: \${err.message}</div>\`;
      }
    }

    function initDummyActivities(force = false) {
      let activities = JSON.parse(localStorage.getItem('datavault_user_activities') || '[]');
      const hasDummy = activities.some(a => a && a.action === 'Downloaded report');
      
      if (force || !hasDummy) {
        const now = new Date();
        const m = now.toLocaleString('default', { month: 'short' });
        const d = String(now.getDate()).padStart(2, '0');
        const y = now.getFullYear();
        const fDate = \`\${d} \${m} \${y}\`;
        const dummyData = [
          { type: 'Reports', action: 'Downloaded report', status: 'Success', date: fDate, time: '11:02 AM', icon: '⬇️', timestamp: now.getTime() - 1000 },
          { type: 'Exports', action: 'Exported cleaned dataset', status: 'Success', date: fDate, time: '10:50 AM', icon: '📤', timestamp: now.getTime() - 2000 },
          { type: 'Analytics', action: 'Generated analytics report', status: 'Success', date: fDate, time: '10:44 AM', icon: '📈', timestamp: now.getTime() - 3000 },
          { type: 'Cleaning Operations', action: 'Started data cleaning on customer_data.csv', status: 'Success', date: fDate, time: '10:42 AM', icon: '🧹', timestamp: now.getTime() - 4000 },
          { type: 'Uploads', action: 'Uploaded customer_data.csv', status: 'Success', date: fDate, time: '10:35 AM', icon: '☁️', timestamp: now.getTime() - 5000 }
        ];
        
        if (force) {
          localStorage.setItem('datavault_user_activities', JSON.stringify(dummyData));
        } else {
          const combined = [...activities, ...dummyData];
          localStorage.setItem('datavault_user_activities', JSON.stringify(combined));
        }
      }
      
      if (typeof currentPage !== 'undefined' && currentPage === 'activity_log') {
        renderActivityLog();
      }
    }

    document.addEventListener('DOMContentLoaded', () => {
      initDummyActivities();
    });
`;

if (!html.includes('function logActivity(')) {
  html = html.replace('  </script>', jsLogic + '\n  </script>');
}

// FIX REMOVE BHARATHI
html = html.replace(
  '<h2 id="user-dashboard-greeting" style="font-size:26px;font-weight:700;background:linear-gradient(90deg,#fff,#94a3b8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Good morning, Bharathi 👋</h2>',
  '<h2 id="user-dashboard-greeting" style="font-size:26px;font-weight:700;background:linear-gradient(90deg,#fff,#94a3b8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Good morning 👋</h2>'
);

html = html.replace(
  '           userGreetingEl.innerHTML = `<span style="background:linear-gradient(90deg,#fff,#94a3b8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${greeting}, Bharathi</span> <span style="display: inline-block; transform-origin: 70% 70%; animation: wave 2s infinite; font-size: 0.9em;">👋</span>`;',
  '           userGreetingEl.innerHTML = `<span style="background:linear-gradient(90deg,#fff,#94a3b8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${greeting}</span> <span style="display: inline-block; transform-origin: 70% 70%; animation: wave 2s infinite; font-size: 0.9em;">👋</span>`;'
);


fs.writeFileSync('dashboard.html', html, 'utf8');
console.log('Successfully updated dashboard.html');
