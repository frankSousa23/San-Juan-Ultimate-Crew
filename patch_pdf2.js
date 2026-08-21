import fs from 'fs';

const path = 'apps/web/src/lib/generateManualPdf.ts';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('guest@sigedivo.com')) {
  code = code.replace(
    /doc\.text\('• Administrador \(frankalfonso1988@gmail\.com\): Acceso total, finanzas, usuarios, auditoría y control de sistema\.', margin \+ 12, 175\)/,
    `doc.text('• Administrador (frankalfonso1988@gmail.com): Acceso total, finanzas, usuarios, auditoría y control de sistema.', margin + 12, 175)
  doc.text('• Usuario Invitado (guest@sigedivo.com): Modo muestra y solo lectura visible en la pantalla de login.', margin + 12, 182)`
  );

  code = code.replace(
    /doc\.text\('• Dashboard con métricas y alertas automáticas\.', margin \+ 6, 396\)/,
    `doc.text('• Dashboard con métricas y alertas automáticas.', margin + 6, 396)
  
  doc.setFont('helvetica', 'bold')
  doc.text('Usuarios y Demostración:', margin, 410)
  doc.setFont('helvetica', 'normal')
  const demoText = [
    '• Acceso Inmediato en Login: Cualquier persona puede ingresar con 1 clic como Invitado (guest@sigedivo.com).'
  ]
  doc.text(demoText, margin + 6, 417)`
  );

  fs.writeFileSync(path, code);
  console.log('pdf guest lines restored');
} else {
  console.log('pdf already has guest lines');
}
