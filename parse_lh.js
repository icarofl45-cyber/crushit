const fs = require('fs');
if (!fs.existsSync('report.json')) {
  console.log('report.json not found yet.');
  process.exit(0);
}
const report = JSON.parse(fs.readFileSync('report.json', 'utf8'));
const lcp = report.audits['largest-contentful-paint-element'];
if (lcp && lcp.details && lcp.details.items) {
  console.log('LCP Element:');
  console.log(JSON.stringify(lcp.details.items[0], null, 2));
} else {
  console.log('LCP element info not found.');
}
