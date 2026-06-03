const fs = require('fs');
let html = fs.readFileSync('dashboard.html', 'utf8');

// Replace initDummyActivities to always clear stale data and use hardcoded "03 Jun 2026"
const oldInit = `    function initDummyActivities(force = false) {
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
    }`;

const newInit = `    function initDummyActivities(force) {
      // Canonical dummy dataset — always shown as the base history
      const dummyData = [
        { type: 'Reports',             action: 'Downloaded report',                          status: 'Success', date: '03 Jun 2026', time: '11:02 AM', icon: '⬇️' },
        { type: 'Exports',             action: 'Exported cleaned dataset',                   status: 'Success', date: '03 Jun 2026', time: '10:50 AM', icon: '📤' },
        { type: 'Analytics',           action: 'Generated analytics report',                 status: 'Success', date: '03 Jun 2026', time: '10:44 AM', icon: '📈' },
        { type: 'Cleaning Operations', action: 'Started data cleaning on customer_data.csv', status: 'Success', date: '03 Jun 2026', time: '10:42 AM', icon: '🧹' },
        { type: 'Uploads',             action: 'Uploaded customer_data.csv',                 status: 'Success', date: '03 Jun 2026', time: '10:35 AM', icon: '☁️' }
      ];

      let stored = localStorage.getItem('datavault_user_activities');
      let activities = stored ? JSON.parse(stored) : [];

      // Check if dummy data with valid icons is already present
      const hasValidDummy = activities.some(function(a){ return a && a.icon && a.date === '03 Jun 2026'; });

      if (force || !hasValidDummy) {
        // Strip out any old stale dummy entries (those without icons or with wrong date)
        const realActivities = activities.filter(function(a){
          return a && a.icon && a.date !== '03 Jun 2026';
        });
        // Real user actions at top, dummy history at bottom
        const combined = realActivities.concat(dummyData);
        localStorage.setItem('datavault_user_activities', JSON.stringify(combined));
      }
    }`;

if (html.includes('function initDummyActivities(force = false)')) {
  html = html.replace(oldInit, newInit);
  console.log('Replaced initDummyActivities');
} else {
  console.log('ERROR: Could not find initDummyActivities to replace!');
  console.log('Searching for partial match...');
  const idx = html.indexOf('function initDummyActivities');
  if (idx !== -1) {
    console.log('Found at index:', idx);
    console.log('Surrounding text:', html.substring(idx, idx + 200));
  }
  process.exit(1);
}

fs.writeFileSync('dashboard.html', html, 'utf8');
console.log('Done!');
