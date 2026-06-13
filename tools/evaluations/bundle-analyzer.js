const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📦 Iniciando Análisis del Bundle de Producción (UX Performance)...\n');

try {
  // Construir la aplicación web usando la configuración de vite
  console.log('Compilando el frontend (vite build)...');
  execSync('npm --workspace apps/web run build', { stdio: 'inherit' });
  
  const distPath = path.join(__dirname, '../../apps/web/dist/assets');
  let totalSize = 0;
  
  const files = fs.readdirSync(distPath);
  console.log(`\n🔍 Archivos generados en dist/assets (${files.length} archivos):`);
  
  files.forEach(file => {
    const stats = fs.statSync(path.join(distPath, file));
    const sizeKb = (stats.size / 1024).toFixed(2);
    totalSize += stats.size;
    
    // Alertar si algún chunk es mayor a 500KB (Práctica recomendada para conexiones lentas)
    if (stats.size > 500 * 1024) {
      console.log(`❌ [PESADO] ${file}: ${sizeKb} KB`);
    } else {
      console.log(`✅ [OK] ${file}: ${sizeKb} KB`);
    }
  });
  
  const totalMb = (totalSize / (1024 * 1024)).toFixed(2);
  console.log('\n=== RESULTADO FINAL DEL BUNDLE ===');
  console.log(`Peso total del Javascript y CSS inicial a descargar: ${totalMb} MB`);
  
  if (totalSize > 2 * 1024 * 1024) { // Más de 2MB
    console.log('⚠️ ADVERTENCIA: La aplicación pesa más de 2MB. Los tiempos de carga en dispositivos móviles con 3G podrían superar los 5 segundos.');
  } else {
    console.log('🚀 EXCELENTE: La aplicación es suficientemente liviana para cargas rápidas en entornos móviles (Canchas de juego sin WiFi).');
  }
} catch (error) {
  console.error('Error analizando el bundle:', error.message);
}
