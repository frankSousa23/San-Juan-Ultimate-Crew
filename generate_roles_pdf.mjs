import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';

const outputDir = path.resolve('apps/web/public');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'SIGEDIVO_Manual_de_Usuario_y_Roles.pdf');
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 40, bottom: 40, left: 40, right: 40 },
  info: {
    Title: 'SIGEDIVO - Arquitectura Multi-Equipo, Roles, Permisos y Vistas',
    Author: 'SIGEDIVO Tech Staff (Frank Sousa)',
    Subject: 'Documentación Arquitectura de Roles y Vistas',
  }
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Primary Palette
const PRIMARY = '#1E3A8A'; // Deep Navy Blue
const SECONDARY = '#0284C7'; // Sky Blue
const ACCENT = '#0F172A'; // Slate 900
const TEXT_DARK = '#334155'; // Slate 700
const BG_HEADER = '#F1F5F9'; // Light Slate
const CARD_BG = '#F8FAFC'; // Off-white
const BORDER_COLOR = '#CBD5E1';

// Helpers
function drawSectionHeader(title, y) {
  doc.rect(40, y, 515, 26).fill(PRIMARY);
  doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold').text(title, 50, y + 7);
  doc.fillColor(TEXT_DARK);
  return y + 36;
}

// ---------------- HEADER ----------------
doc.rect(40, 40, 515, 60).fill('#0F172A');
doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold').text('SAN JUAN ULTIMATE CREW', 55, 52);
doc.fontSize(11).font('Helvetica').text('Guía Ejecutiva: Roles, Permisos y Mapa de Vistas del Sistema', 55, 75);
doc.fontSize(8).text(`Actualizado: ${new Date().toLocaleDateString('es-ES')}`, 430, 55, { align: 'right', width: 115 });

let curY = 115;

// ---------------- INTRO / RESUMEN ----------------
curY = drawSectionHeader('1. RESUMEN ARQUITECTÓNICO DEL CONTROL DE ACCESO', curY);

doc.fontSize(9.5).font('Helvetica').fillColor(TEXT_DARK).text(
  'El sistema SIGEDIVO implementa un modelo jerárquico de control de acceso basado en roles (RBAC). Permite segmentar responsabilidades de gestión de la directiva, táctica de entrenadores, liderazgo en cancha y participación deportiva de los atletas.',
  40, curY, { width: 515, align: 'justify', lineGap: 3 }
);

curY += 45;

// ---------------- MATRIZ DE ROLES ----------------
curY = drawSectionHeader('2. MATRIZ DE ROLES Y PERMISOS CLAVE', curY);

const rolesData = [
  {
    name: 'ADMIN (Administrador / Directiva)',
    level: 'Nivel: Total (Acceso Absoluto)',
    desc: 'Control total de la plataforma. Puede crear y editar usuarios, auditar acciones del sistema, gestionar la tesorería/finanzas, planificar eventos, administrar jugadas y canales de chat.',
    bg: '#EFF6FF',
    badgeBg: '#1E40AF',
  },
  {
    name: 'COACH (Entrenador / Staff Técnico)',
    level: 'Nivel: Alto (Área Deportiva)',
    desc: 'Gestión táctica y física del plantel. Diseña y edita el Playbook (pizarra táctica), convoca y pasa lista en eventos, registra lesiones y analiza estadísticas grupales e individuales.',
    bg: '#F0FDF4',
    badgeBg: '#166534',
  },
  {
    name: 'CAPITÁN (Liderazgo en Cancha)',
    level: 'Nivel: Medio (Liderazgo y Feedback)',
    desc: 'Articulador en el campo. Diseña jugadas sugeridas, registra retroalimentación de partidos, apoya la asistencia a entrenamientos, consulta datos de rivales y coordina al equipo.',
    bg: '#FEFCE8',
    badgeBg: '#854D0E',
  },
  {
    name: 'JUGADOR (Atleta del Plantel)',
    level: 'Nivel: Estándar (Participación)',
    desc: 'Acceso centrado en su actividad deportiva. Confirma asistencia a eventos (RSVP), consulta el Playbook asignado, reporta molestias o lesiones, ve sus métricas y participa en chats.',
    bg: '#F8FAFC',
    badgeBg: '#475569',
  },
  {
    name: 'INVITADO / PÚBLICO',
    level: 'Nivel: Lectura General',
    desc: 'Visitantes no autenticados o miembros sin rol asignado. Tienen acceso exclusivo a las noticias públicas, reglamento del club y calendario general sin datos sensibles.',
    bg: '#F8FAFC',
    badgeBg: '#64748B',
  }
];

rolesData.forEach(r => {
  doc.rect(40, curY, 515, 48).fillAndStroke(r.bg, BORDER_COLOR);
  
  // Badge
  doc.rect(48, curY + 6, 175, 16).fill(r.badgeBg);
  doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold').text(r.name, 52, curY + 10);
  
  // Level
  doc.fillColor(SECONDARY).fontSize(8.5).font('Helvetica-Bold').text(r.level, 230, curY + 10);
  
  // Desc
  doc.fillColor(TEXT_DARK).fontSize(8).font('Helvetica').text(r.desc, 48, curY + 25, { width: 495, lineGap: 1.5 });
  
  curY += 53;
});

// ---------------- NUEVA PÁGINA ----------------
doc.addPage();
let p2Y = 40;

p2Y = drawSectionHeader('3. MAPA DE VISTAS Y MATRIZ DE ACCESIBILIDAD', p2Y);

// Table Header
doc.rect(40, p2Y, 515, 20).fill('#E2E8F0');
doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold');
doc.text('MÓDULO / VISTA', 48, p2Y + 6);
doc.text('JUGADOR', 240, p2Y + 6, { width: 55, align: 'center' });
doc.text('CAPITÁN', 305, p2Y + 6, { width: 55, align: 'center' });
doc.text('COACH', 370, p2Y + 6, { width: 55, align: 'center' });
doc.text('ADMIN', 435, p2Y + 6, { width: 55, align: 'center' });
p2Y += 20;

const views = [
  { name: 'Noticias y Reglamento', jug: 'Lectura', cap: 'Lectura', coa: 'Lectura', adm: 'Total' },
  { name: 'Calendario y Convocatorias', jug: 'Confirmar', cap: 'Gestionar', coa: 'Gestionar', adm: 'Total' },
  { name: 'Pizarra Táctica (Playbook)', jug: 'Lectura', cap: 'Diseñar', coa: 'Diseñar', adm: 'Total' },
  { name: 'Estadísticas y Rivales', jug: 'Propias', coa: 'Equipo', cap: 'Equipo', adm: 'Total' },
  { name: 'Registro de Lesiones', jug: 'Reportar', cap: 'Consultar', coa: 'Gestionar', adm: 'Total' },
  { name: 'Chat y Mensajería', jug: 'Canal Atleta', cap: 'Canal Equipo', coa: 'Staff y Equipo', adm: 'Total' },
  { name: 'Finanzas y Tesorería', jug: 'Restringido', cap: 'Restringido', coa: 'Solo Consulta', adm: 'Total' },
  { name: 'Usuarios, Roles y Auditoría', jug: 'Restringido', cap: 'Restringido', coa: 'Restringido', adm: 'Total' },
];

views.forEach((v, idx) => {
  const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
  doc.rect(40, p2Y, 515, 22).fillAndStroke(rowBg, '#E2E8F0');
  
  doc.fillColor(TEXT_DARK).fontSize(8.5).font('Helvetica-Bold').text(v.name, 48, p2Y + 6);
  doc.font('Helvetica').fontSize(8);
  
  // Columns
  const formatCell = (val) => {
    if (val === 'Total') return { color: '#166534', bold: true };
    if (val === 'Restringido') return { color: '#991B1B', bold: false };
    return { color: '#1E40AF', bold: false };
  };

  const cells = [
    { text: v.jug, x: 240 },
    { text: v.cap, x: 305 },
    { text: v.coa, x: 370 },
    { text: v.adm, x: 435 }
  ];

  cells.forEach(c => {
    const f = formatCell(c.text);
    doc.fillColor(f.color);
    if (f.bold) doc.font('Helvetica-Bold'); else doc.font('Helvetica');
    doc.text(c.text, c.x, p2Y + 6, { width: 55, align: 'center' });
  });

  p2Y += 22;
});

p2Y += 15;

// ---------------- DIAGRAMA DE FLUJO ----------------
p2Y = drawSectionHeader('4. DIAGRAMA DE FLUJO DE DECISIÓN DE ACCESO', p2Y);

doc.rect(40, p2Y, 515, 145).fillAndStroke('#F8FAFC', BORDER_COLOR);

// Step 1: Input
doc.rect(190, p2Y + 12, 190, 24).fillAndStroke('#1E3A8A', '#0F172A');
doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold').text('Usuario Ingresa a la Aplicación', 190, p2Y + 19, { width: 190, align: 'center' });

// Arrow down
doc.strokeColor('#64748B').lineWidth(1.5);
doc.moveTo(285, p2Y + 36).lineTo(285, p2Y + 48).stroke();

// Step 2: Decision
doc.rect(180, p2Y + 48, 210, 24).fillAndStroke('#F1F5F9', '#3B82F6');
doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold').text('¿Sesión Autenticada con Token?', 180, p2Y + 55, { width: 210, align: 'center' });

// Branch Left: No
doc.strokeColor('#64748B').moveTo(180, p2Y + 60).lineTo(110, p2Y + 60).lineTo(110, p2Y + 82).stroke();
doc.rect(50, p2Y + 82, 120, 48).fillAndStroke('#FEF2F2', '#EF4444');
doc.fillColor('#991B1B').fontSize(7.5).font('Helvetica-Bold').text('NO: Acceso Público', 50, p2Y + 88, { width: 120, align: 'center' });
doc.fillColor('#334155').fontSize(7).font('Helvetica').text('• Noticias públicas\n• Reglamento del club\n• Login / Registro', 55, p2Y + 100, { width: 110 });

// Branch Right: Yes
doc.strokeColor('#64748B').moveTo(390, p2Y + 60).lineTo(450, p2Y + 60).lineTo(450, p2Y + 82).stroke();
doc.rect(380, p2Y + 82, 150, 48).fillAndStroke('#ECFDF5', '#10B981');
doc.fillColor('#065F46').fontSize(7.5).font('Helvetica-Bold').text('SÍ: Menú según Rol', 380, p2Y + 88, { width: 150, align: 'center' });
doc.fillColor('#334155').fontSize(7).font('Helvetica').text('• Deporte: Playbook, Asistencia\n• Liderazgo: Rivales, Stats\n• Gestión: Finanzas, Auditoría', 385, p2Y + 100, { width: 140 });

p2Y += 158;

// ---------------- CHECKLIST DE AUDITORÍA ----------------
p2Y = drawSectionHeader('5. CHECKLIST DE PUNTOS CRÍTICOS A REVISAR', p2Y);

const checklist = [
  '1. Verificación de Rutas Frontend: Validar que componentes protegidos utilicen guardias de permisos antes de renderizar vistas privadas.',
  '2. Protección de Endpoints Backend: Asegurar que middlewares como requireAuth y annotationAccess validen roles en rutas de finanzas y usuarios.',
  '3. Consistencia de Base de Datos: Confirmar que la tabla Roles / UserRoles en Prisma/PostgreSQL mantenga sincronizados los permisos con la UI.'
];

checklist.forEach((item) => {
  doc.rect(40, p2Y, 515, 24).fillAndStroke('#FFFFFF', '#E2E8F0');
  doc.fillColor(TEXT_DARK).fontSize(8).font('Helvetica').text(item, 50, p2Y + 7, { width: 495 });
  p2Y += 28;
});

// Finalize
doc.end();

writeStream.on('finish', () => {
  console.log('PDF Generated Successfully at:', outputPath);
});
