const fs = require('fs');
let code = fs.readFileSync('apps/web/src/lib/generateManualPdf.ts', 'utf8');

if (!code.includes('Múltiples Equipos y Aislamiento de Datos')) {
  code = code.replace(
    /'capitanes, entrenadores, anotadores e invitados del sistema SIGEDIVO\.',/,
    `'capitanes, entrenadores, anotadores e invitados del sistema SIGEDIVO.',
    '',
    '• Múltiples Equipos y Aislamiento de Datos: SIGEDIVO soporta la convivencia de múltiples',
    'equipos en una misma plataforma. Cada usuario opera exclusivamente dentro del contexto',
    'de su equipo (Open, Femenino, Mixto), protegiendo la privacidad de los datos operativos.',`
  );
  fs.writeFileSync('apps/web/src/lib/generateManualPdf.ts', code);
}
