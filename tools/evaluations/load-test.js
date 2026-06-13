const autocannon = require('autocannon');
const path = require('path');
const fs = require('fs');

async function runLoadTest() {
  console.log('🚀 Iniciando prueba de carga y estrés con Autocannon...');
  
  // Obtenemos un token de admin leyendo el estado de playwright
  let token = '';
  try {
    const authStatePath = path.join(__dirname, '../../apps/web/tests/.auth/admin.json');
    const authData = JSON.parse(fs.readFileSync(authStatePath, 'utf8'));
    // En Playwright localStorage, el token está guardado. Buscamos el token:
    const origin = authData.origins[0];
    const tokenItem = origin.localStorage.find(i => i.name === 'sjuc.auth.token');
    if (tokenItem) {
      token = tokenItem.value;
      console.log('✅ Token de Admin obtenido para las peticiones autenticadas.');
    } else {
      console.warn('⚠️ No se encontró el token en el archivo de auth. Usando sin auth.');
    }
  } catch (err) {
    console.warn('⚠️ No se pudo leer el archivo de autenticación. Asegúrate de haber corrido las pruebas E2E una vez.');
  }

  const instance = autocannon({
    url: 'http://localhost:4000',
    connections: 100, // 100 concurrent users
    pipelining: 1,
    duration: 10, // 10 seconds of load
    requests: [
      {
        method: 'GET',
        path: '/api/events',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      },
      {
        method: 'GET',
        path: '/api/attendance',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      }
    ]
  }, console.log);

  autocannon.track(instance, { renderProgressBar: true });

  instance.on('done', (result) => {
    console.log('\n📊 Resultados de la Prueba de Carga:');
    console.log(`Peticiones Exitosas (2xx): ${result['2xx']}`);
    console.log(`Errores (5xx/4xx): ${result.non2xx}`);
    console.log(`Latencia Media: ${result.latency.mean} ms`);
    console.log(`Latencia P99: ${result.latency.p99} ms`);
    console.log(`Throughput: ${result.requests.average} req/sec`);
    
    if (result.non2xx > 0) {
      console.log('\n❌ ADVERTENCIA: Hubo errores durante la prueba. Revisa los logs del servidor para identificar colapsos.');
    } else {
      console.log('\n✅ ÉXITO: El servidor manejó la carga sin errores de HTTP.');
    }
  });
}

runLoadTest();
