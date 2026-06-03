const fs = require('fs');
let html = fs.readFileSync('dashboard.html', 'utf8');

// 1. Remove all filter buttons except "All Activities" in the HTML
html = html.replace(
  `            <button class="btn primary sm" onclick="filterActivityLog('all', this)" id="filter-btn-all">All Activities</button>
            <button class="btn outline sm" onclick="filterActivityLog('Uploads', this)">Uploads</button>
            <button class="btn outline sm" onclick="filterActivityLog('Cleaning Operations', this)">Cleaning Operations</button>
            <button class="btn outline sm" onclick="filterActivityLog('Analytics', this)">Analytics</button>
            <button class="btn outline sm" onclick="filterActivityLog('Reports', this)">Reports</button>
            <button class="btn outline sm" onclick="filterActivityLog('Downloads', this)">Downloads</button>
            <button class="btn outline sm" onclick="filterActivityLog('Exports', this)">Exports</button>`,
  `            <button class="btn primary sm" onclick="filterActivityLog('all', this)" id="filter-btn-all">All Activities</button>`
);

// 2. Remove Cleaning Ops stat card
html = html.replace(
  `            <div class="card hover-glow" style="padding:20px;border-top:2px solid #a78bfa;background:linear-gradient(180deg,rgba(167,139,250,0.03),var(--surface1));">
              <div style="font-size:10px;font-weight:600;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Cleaning Ops</div>
              <div id="activity-stat-cleaning" style="font-size:32px;font-weight:700;color:var(--text);">0</div>
            </div>`,
  ''
);
// Also handle the line ending variant
html = html.replace(
  `            <div class="card hover-glow" style="padding:20px;border-top:2px solid #a78bfa;background:linear-gradient(180deg,rgba(167,139,250,0.03),var(--surface1));">\r\n              <div style="font-size:10px;font-weight:600;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Cleaning Ops</div>\r\n              <div id="activity-stat-cleaning" style="font-size:32px;font-weight:700;color:var(--text);">0</div>\r\n            </div>`,
  ''
);

// 3. Update grid from g-4 to g-3 for Activity Log summary cards
// This is tricky — do it only in the pg-activity_log section
const activityLogStart = html.indexOf('id="pg-activity_log"');
const activityLogEnd = html.indexOf('<!-- ── USERS ── -->', activityLogStart);
const activityLogSection = html.substring(activityLogStart, activityLogEnd);
const fixedSection = activityLogSection.replace(
  '<div class="grid g-4" style="margin-bottom:24px;">',
  '<div class="grid g-3" style="margin-bottom:24px;">'
);
html = html.substring(0, activityLogStart) + fixedSection + html.substring(activityLogEnd);

// 4. Remove Bharathi name from greeting
html = html.replace(
  'Good morning, Bharathi 👋</h2>',
  'Good morning 👋</h2>'
);
html = html.replace(
  '`<span style="background:linear-gradient(90deg,#fff,#94a3b8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${greeting}, Bharathi</span>',
  '`<span style="background:linear-gradient(90deg,#fff,#94a3b8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${greeting}</span>'
);

// 5. Inject the full Activity Log JS block right before </script>
const activityLogJS = `
    /* ── ACTIVITY LOG ── */
    function logActivity(type, action, status) {
      status = status || 'Success';
      let activities = JSON.parse(localStorage.getItem('datavault_user_activities') || '[]');
      const now = new Date();
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const fDate = String(now.getDate()).padStart(2,'0') + ' ' + months[now.getMonth()] + ' ' + now.getFullYear();
      const fTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      const icons = {
        'Uploads': '☁️',
        'Cleaning Operations': '🧹',
        'Analytics': '📈',
        'Reports': '📋',
        'Downloads': '⬇️',
        'Exports': '📤'
      };

      activities.unshift({
        type: type,
        action: action,
        status: status,
        date: fDate,
        time: fTime,
        icon: icons[type] || '⚡',
        timestamp: now.getTime()
      });
      
      localStorage.setItem('datavault_user_activities', JSON.stringify(activities));
      if (typeof currentPage !== 'undefined' && currentPage === 'activity_log') {
        renderActivityLog();
      }
    }

    let currentActivityFilter = 'all';

    function filterActivityLog(type, btnElement) {
      currentActivityFilter = type;
      if (btnElement) {
        var btns = btnElement.parentElement.querySelectorAll('.btn');
        for (var i = 0; i < btns.length; i++) {
          btns[i].classList.remove('primary');
          btns[i].classList.add('outline');
        }
        btnElement.classList.remove('outline');
        btnElement.classList.add('primary');
      }
      renderActivityLog();
    }

    function renderActivityLog() {
      var stored = localStorage.getItem('datavault_user_activities');
      var activities = stored ? JSON.parse(stored) : [];
      
      var elTotal = document.getElementById('activity-stat-total');
      var elUploads = document.getElementById('activity-stat-uploads');
      var elReports = document.getElementById('activity-stat-reports');
      
      if (elTotal) elTotal.textContent = activities.length;
      if (elUploads) elUploads.textContent = activities.filter(function(a){ return a && a.type === 'Uploads'; }).length;
      if (elReports) elReports.textContent = activities.filter(function(a){ return a && a.type === 'Reports'; }).length;

      var toShow = activities;
      if (currentActivityFilter !== 'all') {
        toShow = activities.filter(function(a){ return a && a.type === currentActivityFilter; });
      }

      var feed = document.getElementById('activity-log-feed');
      if (!feed) return;
      
      if (toShow.length === 0) {
        feed.innerHTML = '<div style="text-align:center;padding:60px 20px;"><div style="font-size:40px;margin-bottom:16px;">📋</div><div style="color:var(--muted);font-size:15px;">No activities found.</div></div>';
        return;
      }

      var html = '';
      for (var i = 0; i < toShow.length; i++) {
        var a = toShow[i];
        if (!a || typeof a !== 'object') continue;
        var badgeCls = a.status === 'Success' ? 'done' : 'err';
        var isFirst = i === 0;
        var borderStyle = isFirst ? 'border:1px solid rgba(56,189,248,0.15);' : 'border:1px solid rgba(255,255,255,0.05);';
        html += '<div style="display:flex;gap:16px;align-items:flex-start;padding:18px 20px;background:rgba(255,255,255,0.02);border-radius:12px;' + borderStyle + 'transition:transform 0.2s,box-shadow 0.2s;" onmouseover="this.style.transform=\\'translateY(-1px)\\';this.style.boxShadow=\\'0 4px 20px rgba(0,0,0,0.2)\\'" onmouseout="this.style.transform=\\'\\';this.style.boxShadow=\\'\\'">'; 
        html += '<div style="width:44px;height:44px;border-radius:12px;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;border:1px solid rgba(255,255,255,0.06);">' + (a.icon || '⚡') + '</div>';
        html += '<div style="flex:1;min-width:0;">';
        html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;gap:12px;">';
        html += '<div style="font-weight:600;color:var(--text);font-size:14px;line-height:1.4;">' + (a.action || 'Unknown Action') + '</div>';
        html += '<div style="font-size:11px;color:var(--muted);white-space:nowrap;flex-shrink:0;">' + (a.date || '') + ', ' + (a.time || '') + '</div>';
        html += '</div>';
        html += '<div style="display:flex;align-items:center;gap:8px;">';
        html += '<span class="badge ' + badgeCls + '" style="font-size:10px;padding:3px 8px;">' + (a.status || 'Success') + '</span>';
        html += '<span style="font-size:11px;color:var(--muted);">' + (a.type || 'System') + '</span>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
      }
      feed.innerHTML = html;
    }

    function initDummyActivities(force) {
      var stored = localStorage.getItem('datavault_user_activities');
      var activities = stored ? JSON.parse(stored) : [];
      
      // Always reset to clean dummy data to avoid stale/broken entries
      var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      var now = new Date();
      // Use exactly 03 Jun 2026 as the date for dummy data
      var fDate = '03 Jun 2026';
      
      var dummyData = [
        { type: 'Reports',   action: 'Downloaded report',                          status: 'Success', date: fDate, time: '11:02 AM', icon: '⬇️',  timestamp: now.getTime() - 1000 },
        { type: 'Exports',   action: 'Exported cleaned dataset',                   status: 'Success', date: fDate, time: '10:50 AM', icon: '📤', timestamp: now.getTime() - 2000 },
        { type: 'Analytics', action: 'Generated analytics report',                 status: 'Success', date: fDate, time: '10:44 AM', icon: '📈', timestamp: now.getTime() - 3000 },
        { type: 'Cleaning Operations', action: 'Started data cleaning on customer_data.csv', status: 'Success', date: fDate, time: '10:42 AM', icon: '🧹', timestamp: now.getTime() - 4000 },
        { type: 'Uploads',   action: 'Uploaded customer_data.csv',                 status: 'Success', date: fDate, time: '10:35 AM', icon: '☁️', timestamp: now.getTime() - 5000 }
      ];

      // Check if dummy data is already present (and not stale/broken)
      var hasDummy = activities.length > 0 && activities[0].date && activities[0].icon;
      
      if (!hasDummy || force) {
        // Keep any real user activities (from upload/cleaning/etc.) prepended, dummy goes at end
        var realActivities = activities.filter(function(a){ return a && a.timestamp && a.timestamp > now.getTime() - 86400000; });
        var combined = realActivities.concat(dummyData);
        localStorage.setItem('datavault_user_activities', JSON.stringify(combined));
      }
    }

    document.addEventListener('DOMContentLoaded', function() {
      // Seed dummy data on first load
      initDummyActivities(false);
    });

`;

// Inject before </script>
if (!html.includes('function logActivity(')) {
  html = html.replace('  </script>', activityLogJS + '  </script>');
}

// Fix the navTo activity_log handler to call renderActivityLog after data init
html = html.replace(
  "      if (id === 'activity_log') {\r\n        renderActivityLog();\r\n      }",
  "      if (id === 'activity_log') {\r\n        initDummyActivities(false);\r\n        setTimeout(renderActivityLog, 80);\r\n      }"
);
html = html.replace(
  "      if (id === 'activity_log') {\n        renderActivityLog();\n      }",
  "      if (id === 'activity_log') {\n        initDummyActivities(false);\n        setTimeout(renderActivityLog, 80);\n      }"
);

fs.writeFileSync('dashboard.html', html, 'utf8');
console.log('Done! Activity Log dummy data fix applied.');
