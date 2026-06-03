const fs = require('fs');
let html = fs.readFileSync('dashboard.html', 'utf8');

// Fix 1: Use real filename in processFile upload log
html = html.replace(
  "    function processFile(file) {\r\n      if (typeof logActivity === 'function') logActivity('Uploads', `Uploaded customer_data.csv`);\r\n      window.rawUploadedFile = file;",
  "    function processFile(file) {\r\n      window.rawUploadedFile = file;\r\n      if (typeof logActivity === 'function') logActivity('Uploads', 'Uploaded ' + (file && file.name ? file.name : 'dataset'));"
);
html = html.replace(
  "    function processFile(file) {\n      if (typeof logActivity === 'function') logActivity('Uploads', `Uploaded customer_data.csv`);\n      window.rawUploadedFile = file;",
  "    function processFile(file) {\n      window.rawUploadedFile = file;\n      if (typeof logActivity === 'function') logActivity('Uploads', 'Uploaded ' + (file && file.name ? file.name : 'dataset'));"
);

// Fix 2: Analytics log - use actual filename if available
html = html.replace(
  "      if (typeof logActivity === 'function') logActivity('Analytics', 'Generated analytics report');",
  "      if (typeof logActivity === 'function') {\n        const _fn = (window.rawUploadedFile && window.rawUploadedFile.name) ? window.rawUploadedFile.name : 'dataset';\n        logActivity('Analytics', 'Generated analytics report for ' + _fn);\n      }"
);

// Fix 3: Reports log - use actual filename
html = html.replace(
  "      if (typeof logActivity === 'function') logActivity('Reports', 'Downloaded report');",
  "      if (typeof logActivity === 'function') {\n        const _fn2 = (window.rawUploadedFile && window.rawUploadedFile.name) ? window.rawUploadedFile.name : 'dataset';\n        logActivity('Reports', 'Downloaded report for ' + _fn2);\n      }"
);

// Fix 4: Export log - use actual filename
html = html.replace(
  "      if (typeof logActivity === 'function') logActivity('Exports', 'Exported cleaned dataset');",
  "      if (typeof logActivity === 'function') {\n        const _fn3 = (window.rawUploadedFile && window.rawUploadedFile.name) ? window.rawUploadedFile.name : 'dataset';\n        logActivity('Exports', 'Exported cleaned ' + _fn3);\n      }"
);

// Fix 5: Cleaning complete log - use actual filename
html = html.replace(
  "        if (typeof logActivity === 'function') logActivity('Cleaning Operations', 'Completed data cleaning');",
  "        if (typeof logActivity === 'function') {\n          const _fn4 = (window.rawUploadedFile && window.rawUploadedFile.name) ? window.rawUploadedFile.name : 'dataset';\n          logActivity('Cleaning Operations', 'Completed data cleaning on ' + _fn4);\n        }"
);

fs.writeFileSync('dashboard.html', html, 'utf8');
console.log('Done! All filename hooks updated.');
