import fs from 'fs';
let code = fs.readFileSync('apps/api/src/lib/guestDemoData.ts', 'utf8');
code = code.replace(/export function isGuestRequest\(req: Request\): boolean \{\s*return false;\s*const user/, 'export function isGuestRequest(req: Request): boolean {\n  const user');
fs.writeFileSync('apps/api/src/lib/guestDemoData.ts', code);
