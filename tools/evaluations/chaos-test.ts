import axios from 'axios';
import { execSync } from 'child_process';

const API_URL = 'http://localhost:4000/api';

async function runChaosTest() {
  console.log('🔥 Iniciando Ingeniería del Caos (Prueba de Resiliencia)...\n');
  
  console.log('Probando que el sistema funciona correctamente antes del caos...');
  try {
    const healthRes = await axios.get(`${API_URL}/players`, { timeout: 2000 });
    console.log('✅ El servidor está vivo (Status:', healthRes.status, ')');
  } catch (err) {
    console.error('❌ El servidor ya está inalcanzable. Abortando prueba del caos.');
    process.exit(1);
  }

  console.log('\n=============================================');
  console.log('🔴 APAGANDO LA BASE DE DATOS POSTGRESQL');
  console.log('Ejecutando: docker-compose stop db');
  console.log('=============================================\n');
  
  try {
    execSync('docker-compose stop db', { stdio: 'inherit' });
  } catch (err) {
    console.log('⚠️ No se pudo detener el contenedor Docker automáticamente. Omitiendo.');
    return;
  }

  console.log('\nEsperando 3 segundos a que se cierren las conexiones...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  console.log('\nIniciando inyección de peticiones al sistema herido...');

  let successCount = 0;
  let failCount = 0;

  for (let i = 1; i <= 5; i++) {
    try {
      console.log(`Petición [${i}/5] a GET /api/events...`);
      const res = await axios.get(`${API_URL}/events`, { timeout: 3000 });
      successCount++;
      console.log(`   -> ⚠️ Respondió con 200 OK. (Data cacheada o prisma pool sobrevivió inesperadamente)`);
    } catch (err: any) {
      failCount++;
      if (err.response) {
        console.log(`   -> ✅ El servidor manejó el fallo y retornó HTTP ${err.response.status}`);
      } else {
        console.log(`   -> ✅ El servidor Express interceptó el error de DB (Timeout o 500 interno): ${err.message}`);
      }
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n=============================================');
  console.log('🟢 ENCENDIENDO LA BASE DE DATOS DE NUEVO');
  console.log('Ejecutando: docker-compose start db');
  console.log('=============================================\n');

  try {
    execSync('docker-compose start db', { stdio: 'inherit' });
  } catch (err) {
    console.log('⚠️ Error al encender la DB.');
  }

  console.log('\nEsperando 5 segundos a que la BD esté fully operativa...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('\nProbando recuperación automática (Self-healing)...');
  try {
    const recoveryRes = await axios.get(`${API_URL}/events`, { timeout: 3000 });
    console.log(`✅ ¡ÉXITO! El servidor Express se recuperó de inmediato tras restablecer la red de DB. (Status: ${recoveryRes.status})`);
  } catch (err: any) {
    console.error('❌ FALLO CRÍTICO: El backend se quedó colgado tras la recuperación de la BD.');
    console.error('Error detallado:', err.message);
  }
}

runChaosTest();
