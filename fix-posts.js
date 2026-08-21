import fs from 'fs';
let mockDb = fs.readFileSync('apps/api/src/lib/mockDb.ts', 'utf8');

mockDb = mockDb.replace(/this\.newsPosts = \[\s*\{[^]*?\];/m, `this.newsPosts = [
  {
    id: 1,
    title: '🏆 ¡Bienvenidos a SIGEDIVO - San Juan Ultimate Crew! Guía Rápida del Sistema',
    content: \`¡Saludos a todos los atletas y miembros de **San Juan Ultimate Crew**!
Esta plataforma ha sido diseñada para optimizar nuestra gestión deportiva, táctica y organizativa. A continuación, les compartimos los puntos clave para el uso diario:

1. **📅 Calendario y Convocatorias (RSVP)**: Ingresen a la sección de *Eventos* para confirmar su disponibilidad (Asistiré / Pendiente / No podré) antes de cada entrenamiento y partido. Esto permite a los entrenadores y capitanes definir las líneas de juego (Línea O / Línea D).
2. **📋 Pizarra Táctica (Playbook)**: Consulten las jugadas oficiales (*Vertical Stack*, *Horizontal Stack*, *Defensa en Zona Cup* y *Dome*) para llegar al campo con la estrategia clara.
3. **💰 Transparencia Financiera**: En el módulo de *Finanzas* pueden revisar el balance general del club, aportes de membresía, compra de discos reglamentarios y presupuesto de torneos.
4. **📚 Recursos y Reglamento**: En la sección de *Recursos* tienen acceso al reglamento oficial de la **WFDF**, la guía de **Espíritu de Juego (SOTG)** y manuales de preparación técnica.
5. **💬 Canales de Chat**: Manténganse conectados en los canales de mensajería para coordinar traslados y resolver dudas con capitanes y cuerpo técnico.

*¡A darlo todo en la cancha con el mejor Espíritu de Juego!*\`,
    isImportant: true,
    isPinned: true,
    category: 'Anuncios',
    createdAt: new Date(new Date().getTime() - 86400000 * 1).toISOString(),
    updatedAt: new Date(new Date().getTime() - 86400000 * 1).toISOString(),
    authorId: 1
  }
];`);

mockDb = mockDb.replace(/this\.nextId\['newsPost'\] = \d+;/, "this.nextId['newsPost'] = 2;");
mockDb = mockDb.replace(/author: GUEST_PLAYERS\[0\];/, ""); // just in case it's lingering

fs.writeFileSync('apps/api/src/lib/mockDb.ts', mockDb);
console.log('Fixed posts');
