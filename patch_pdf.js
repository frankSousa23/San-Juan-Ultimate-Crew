import fs from 'fs';

const path = 'apps/web/src/lib/generateManualPdf.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/• Usuario Invitado \(guest@sigedivo\.com\): Modo muestra y solo lectura visible en la pantalla de login\./, '');
code = code.replace(/• Acceso Inmediato en Login: Cualquier persona puede ingresar con 1 clic como Invitado \(guest@sigedivo\.com\)\./, '');

fs.writeFileSync(path, code);
console.log('pdf patched!');
