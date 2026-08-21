import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const DOCS_DIR = path.resolve('..', '..', 'docs')
const OUTPUT_PDF = path.join(DOCS_DIR, 'MANUAL_COMPLETO_SIGEDIVO.pdf')
const IMAGES_DIR = path.join(DOCS_DIR, 'images')

// Función para convertir imagen a base64
function getBase64Image(filename) {
  const filePath = path.join(IMAGES_DIR, filename)
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath)
    return `data:image/png;base64,${data.toString('base64')}`
  }
  return ''
}

const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Manual Completo del Sistema - SIGEDIVO (Sistema de Gestión para el Disco Volador)</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    @page {
      size: A4;
      margin: 20mm 15mm 20mm 15mm;
      @bottom-right {
        content: counter(page);
      }
    }

    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #1e293b;
      line-height: 1.6;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }

    .cover-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      page-break-after: always;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
      color: #ffffff;
      padding: 40px;
      border-radius: 12px;
    }

    .cover-title {
      font-size: 34px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 12px;
      color: #38bdf8;
    }

    .cover-subtitle {
      font-size: 20px;
      font-weight: 500;
      color: #e2e8f0;
      margin-bottom: 24px;
      max-width: 600px;
    }

    .cover-badge {
      display: inline-block;
      padding: 8px 16px;
      background: rgba(56, 189, 248, 0.2);
      border: 1px solid #38bdf8;
      border-radius: 9999px;
      font-size: 14px;
      font-weight: 600;
      color: #7dd3fc;
      margin-bottom: 30px;
    }

    .cover-meta {
      font-size: 14px;
      color: #94a3b8;
      margin-top: 40px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 20px;
      width: 80%;
    }

    h1, h2, h3 {
      color: #0f172a;
      font-weight: 700;
    }

    h1 {
      font-size: 24px;
      border-bottom: 2px solid #38bdf8;
      padding-bottom: 8px;
      margin-top: 36px;
      page-break-before: auto;
    }

    h2 {
      font-size: 18px;
      color: #1e293b;
      margin-top: 24px;
    }

    p {
      font-size: 13px;
      color: #334155;
      text-align: justify;
    }

    .screenshot-card {
      margin: 20px 0;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      page-break-inside: avoid;
    }

    .screenshot-card img {
      width: 100%;
      height: auto;
      display: block;
      border-bottom: 1px solid #e2e8f0;
    }

    .screenshot-caption {
      padding: 10px 14px;
      font-size: 12px;
      font-style: italic;
      color: #64748b;
      background: #ffffff;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 12px;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      text-align: left;
    }

    th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 600;
    }

    .callout {
      background: #f0fdf4;
      border-left: 4px solid #22c55e;
      padding: 12px 16px;
      border-radius: 4px;
      margin: 16px 0;
      font-size: 12px;
      color: #166534;
    }
  </style>
</head>
<body>

  <!-- PORTADA -->
  <div class="cover-page">
    <div class="cover-badge">RELEASE v1.0.0 OPEN SOURCE</div>
    <div class="cover-title">🏆 SIGEDIVO (Sistema de Gestión para el Disco Volador)</div>
    <div class="cover-subtitle">Manual Completo del Sistema, Guía de Usuario y Documentación Técnica</div>
    <p style="color: #cbd5e1; max-width: 500px; text-align: center;">Plataforma integral de gestión deportiva, estadísticas, live scoring táctil para torneos, finanzas y gobernanza del Disco Volador.</p>
    <div class="cover-meta">
      <strong>Autor:</strong> Frank Sousa<br>
      <strong>Contacto:</strong> frankalfonso1988@gmail.com<br>
      <strong>Trayectoria:</strong> Jugador de Ultimate Frisbee por más de 15 años<br>
      <strong>Ubicación:</strong> San Juan de los Morros, Estado Guárico, Venezuela<br>
      <strong>Impulsando:</strong> Asociación Guariqueña del Disco Volador (AGDV)<br>
      <strong>En apoyo a:</strong> Federación del Disco Volador de Venezuela (FDVV) & Asociación Aragüeña del Disco Volador (AADV)<br>
      <strong>Licencia:</strong> MIT License con Atribución Requerida
    </div>
  </div>

  <!-- SECCIÓN 1 -->
  <h1>1. Introducción y Contexto Deportivo</h1>
  <p>El sistema <strong>SIGEDIVO (Sistema de Gestión para el Disco Volador)</strong> es una solución tecnológica integral de software libre creada para modernizar, digitalizar y optimizar la administración, táctica y competencia en el <strong>Ultimate Frisbee / Disco Volador</strong>.</p>
  <p>Desarrollada por <strong>Frank Sousa</strong> tras más de 15 años de trayectoria compitiendo en ligas y torneos en Aragua, Carabobo, Yaracuy y diversas regiones de Venezuela, este proyecto tiene el objetivo primordial de impulsar y fundar la <strong>Asociación Guariqueña del Disco Volador (AGDV)</strong> en San Juan de los Morros y dotar a la comunidad deportiva nacional e internacional de una herramienta de clase mundial.</p>

  <!-- SECCIÓN 2 -->
  <h1>2. Autenticación y Matriz de Roles (RBAC)</h1>
  <p>El sistema implementa seguridad mediante JSON Web Tokens (JWT) y una matriz de Control de Acceso Basada en Roles con 6 perfiles diferenciados:</p>
  
  <table>
    <thead>
      <tr>
        <th>Rol</th>
        <th>Usuario Oficial</th>
        <th>Dorsal Vinculado</th>
        <th>Capacidades y Permisos Principales</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Admin</strong></td>
        <td><code>frankalfonso1988@gmail.com</code></td>
        <td>#1 Frank Sousa</td>
        <td>Superusuario: Control total, gestión de usuarios, finanzas y auditoría.</td>
      </tr>
      <tr>
        <td><strong>Captain</strong></td>
        <td><code>captain@sigedivo.com</code></td>
        <td>#2 Carlos Mendoza</td>
        <td>Capitán: Convocatorias O/D-Line, Live Scoring en vivo, asistencias y rivales.</td>
      </tr>
      <tr>
        <td><strong>Coach</strong></td>
        <td><code>coach@sigedivo.com</code></td>
        <td>#3 Eduardo Silva</td>
        <td>Entrenador: Libro de jugadas, pizarra táctica y recursos técnicos.</td>
      </tr>
      <tr>
        <td><strong>Treasurer</strong></td>
        <td><code>treasurer@sigedivo.com</code></td>
        <td>#4 Alejandro Ramos</td>
        <td>Tesorero: Cuentas bancarias, caja, transacciones y balances.</td>
      </tr>
      <tr>
        <td><strong>Player</strong></td>
        <td><code>player@sigedivo.com</code></td>
        <td>#5 Gabriel Torres</td>
        <td>Jugador: Roster, estadísticas, asistencia y mensajería en canales.</td>
      </tr>
      <tr>
        <td><strong>Guest</strong></td>
        <td><code>guest@sigedivo.com</code></td>
        <td>#6 Daniel Salazar</td>
        <td>Invitado: Modo lectura de roster y estadísticas globales.</td>
      </tr>
    </tbody>
  </table>

  <div class="screenshot-card">
    <img src="${getBase64Image('00_login.png')}" alt="Inicio de Sesión">
    <div class="screenshot-caption">Figura 2.1: Pantalla de inicio de sesión con autenticación segura JWT y manejo de estados.</div>
  </div>

  <!-- SECCIÓN 3 -->
  <h1>3. Dashboard Principal y Métricas</h1>
  <p>El Dashboard ofrece una visión panorámica instantánea con tarjetas de métricas en tiempo real, accesos rápidos a módulos clave y un resumen de las actividades deportivas y noticias recientes del club.</p>

  <div class="screenshot-card">
    <img src="${getBase64Image('01_dashboard.png')}" alt="Dashboard Principal">
    <div class="screenshot-caption">Figura 3.1: Panel de Control interactivo con KPIs de atletas, eventos y finanzas.</div>
  </div>

  <!-- SECCIÓN 4 -->
  <h1>4. Roster de Jugadores y Fichas Técnicas</h1>
  <p>Permite la gestión completa de la plantilla: dorsal único, posición en campo (Handler, Cutter, Hybrid), estatura, experiencia y estado físico (Activo, Lesionado, Inactivo).</p>

  <div class="screenshot-card">
    <img src="${getBase64Image('02_roster.png')}" alt="Roster de Jugadores">
    <div class="screenshot-caption">Figura 4.1: Vista del Roster principal con tarjetas de atletas y filtros instantáneos.</div>
  </div>

  <!-- SECCIÓN 5 -->
  <h1>5. Pizarra Táctica y Anotaciones en Vivo (Live Scoring)</h1>
  <p>Optimizada especialmente para uso táctil en el campo de juego durante torneos y partidos oficiales:</p>
  <ul>
    <li><strong>Marcador Sticky Superior:</strong> Marcador gigante en vivo siempre visible al scrollear.</li>
    <li><strong>Botones Táctiles Inmediatos:</strong> GOL (con selector de asistente o Callahan en 1 toque), DEFENSA (D) y TURNOVER.</li>
    <li><strong>Filtro por Líneas Tácticas:</strong> O-Line (Ofensiva), D-Line (Defensiva) y Flex.</li>
  </ul>

  <div class="screenshot-card">
    <img src="${getBase64Image('03_anotaciones_selector.png')}" alt="Selector de Anotaciones">
    <div class="screenshot-caption">Figura 5.1: Selector de partidos en vivo y torneos para registro de anotaciones.</div>
  </div>

  <div class="screenshot-card">
    <img src="${getBase64Image('14_anotaciones_movil_tactil.png')}" alt="Pizarra Móvil Táctil">
    <div class="screenshot-caption">Figura 5.2: Interfaz móvil táctil optimizada para teléfonos y tablets en campo de juego.</div>
  </div>

  <!-- SECCIÓN 6 -->
  <h1>6. Calendario, Torneos y Convocatorias</h1>
  <p>Administración jerárquica de torneos padres con partidos asociados por fases, convocatorias por líneas y control de asistencia.</p>

  <div class="screenshot-card">
    <img src="${getBase64Image('04_eventos_torneos.png')}" alt="Eventos y Torneos">
    <div class="screenshot-caption">Figura 6.1: Módulo de eventos, torneos y control de convocatorias.</div>
  </div>

  <!-- SECCIÓN 7 -->
  <h1>7. Módulo Financiero y Tesorería</h1>
  <p>Cuentas bancarias y caja chica, categorías de ingresos/egresos y cálculo automatizado de balance en centavos.</p>

  <div class="screenshot-card">
    <img src="${getBase64Image('05_finanzas.png')}" alt="Finanzas">
    <div class="screenshot-caption">Figura 7.1: Panel financiero con resumen de ingresos, egresos y balance neto.</div>
  </div>

  <!-- SECCIÓN 8 -->
  <h1>8. Control Médico de Lesiones y Readaptación</h1>
  <p>Seguimiento clínico de lesiones por severidad (Leve, Moderada, Grave) y fases de evolución deportiva.</p>

  <div class="screenshot-card">
    <img src="${getBase64Image('06_lesiones.png')}" alt="Lesiones">
    <div class="screenshot-caption">Figura 8.1: Historial médico y seguimiento de rehabilitación.</div>
  </div>

  <!-- SECCIÓN 9 -->
  <h1>9. Libro de Jugadas y Pizarra Táctica</h1>
  <p>Biblioteca estructurada de jugadas ofensivas y defensivas con explicaciones y diagramas tácticos.</p>

  <div class="screenshot-card">
    <img src="${getBase64Image('07_jugadas_tacticas.png')}" alt="Jugadas">
    <div class="screenshot-caption">Figura 9.1: Libro táctico y estrategias de juego.</div>
  </div>

  <!-- SECCIÓN 10 -->
  <h1>10. Scouting de Rivales</h1>
  <p>Análisis de equipos contrarios, fortalezas, debilidades y scouting de jugadores destacados.</p>

  <div class="screenshot-card">
    <img src="${getBase64Image('08_scouting_rivales.png')}" alt="Rivales">
    <div class="screenshot-caption">Figura 10.1: Módulo de análisis y scouting competitivo.</div>
  </div>

  <!-- SECCIÓN 11 -->
  <h1>11. Comunicaciones y Noticias Oficiales</h1>
  <p>Canales de chat internos por evento y publicación de comunicados y noticias oficiales del club.</p>

  <div class="screenshot-card">
    <img src="${getBase64Image('09_comunicaciones.png')}" alt="Comunicaciones">
    <div class="screenshot-caption">Figura 11.1: Canales de mensajería interna.</div>
  </div>

  <div class="screenshot-card">
    <img src="${getBase64Image('10_noticias.png')}" alt="Noticias">
    <div class="screenshot-caption">Figura 11.2: Portal de noticias oficiales y anuncios.</div>
  </div>

  <!-- SECCIÓN 12 -->
  <h1>12. Centro de Recursos y Reglamento WFDF</h1>
  <p>Repositorio de reglamentos oficiales de la WFDF, guías de entrenamiento y material descargable.</p>

  <div class="screenshot-card">
    <img src="${getBase64Image('11_recursos.png')}" alt="Recursos">
    <div class="screenshot-caption">Figura 12.1: Repositorio documental y reglamentario.</div>
  </div>

  <!-- SECCIÓN 13 -->
  <h1>13. Panel de Administración y Auditoría</h1>
  <p>Gobernanza del club: Aprobación de aspirantes (PENDING ➡️ APPROVED), asignación de roles y registro de auditoría.</p>

  <div class="screenshot-card">
    <img src="${getBase64Image('12_admin_usuarios.png')}" alt="Administración">
    <div class="screenshot-caption">Figura 13.1: Panel administrativo y solicitudes de acceso.</div>
  </div>

  <!-- SECCIÓN 14 -->
  <h1>14. Documentación de la API (Swagger / OpenAPI)</h1>
  <p>La API REST expone 20 módulos documentados de forma interactiva con OpenAPI 3.0 en <code>/api-docs</code>.</p>

  <div class="screenshot-card">
    <img src="${getBase64Image('13_swagger_api.png')}" alt="Swagger API">
    <div class="screenshot-caption">Figura 14.1: Especificación Swagger OpenAPI 3.0 con los 20 endpoints oficiales.</div>
  </div>

</body>
</html>
`

async function generatePDF() {
  console.log('📄 Generando PDF del manual completo...')
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  await page.setContent(htmlContent, { waitUntil: 'networkidle' })
  await page.pdf({
    path: OUTPUT_PDF,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '15mm',
      bottom: '15mm',
      left: '12mm',
      right: '12mm'
    }
  })

  await browser.close()
  console.log(`✅ ¡PDF generado con éxito en: ${OUTPUT_PDF}!`)
}

generatePDF().catch(err => {
  console.error('Error generando PDF:', err)
  process.exit(1)
})
