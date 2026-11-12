import { access } from 'node:fs/promises';
try { await access('www/index.html'); console.log('Web assets ready in www/'); }
catch { console.error('www/index.html not found'); process.exit(1); }
