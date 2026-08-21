const fs = require('fs');
let code = fs.readFileSync('generate_roles_pdf.mjs', 'utf8');

code = code.replace(
  /San Juan Ultimate Crew - Roles, Permisos y Vistas/g,
  'SIGEDIVO - Arquitectura Multi-Equipo, Roles, Permisos y Vistas'
);

code = code.replace(
  /San Juan Ultimate Crew Tech Staff/g,
  'SIGEDIVO Tech Staff (Frank Sousa)'
);

if (!code.includes('Aislamiento de Datos por Equipo')) {
  code = code.replace(
    /doc\.fontSize\(16\)\.fillColor\(PRIMARY\)\.text\('1\. Arquitectura General y Jerarquía', \{ underline: true \}\);/,
    `doc.fontSize(16).fillColor(PRIMARY).text('1. Arquitectura Multi-Equipo y Jerarquía', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor(TEXT_DARK).text('SIGEDIVO implementa un aislamiento de datos lógico (Multi-Tenant) mediante el ID de Equipo (teamId). Todos los usuarios, exceptuando al Administrador Global, operan dentro del ecosistema de su propio equipo, garantizando la privacidad de las métricas, roster y finanzas.');
  doc.moveDown(1);`
  );
  
  fs.writeFileSync('generate_roles_pdf.mjs', code);
}
