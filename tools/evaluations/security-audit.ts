import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

async function runSecurityAudit() {
  console.log('🛡️ Iniciando Auditoría de Seguridad (RBAC & IDOR)...\n');

  // Para esta prueba, probaremos el aislamiento de privilegios
  // Verificando que un atleta regular (player) no pueda acceder a recursos de administrador.
  
  let playerToken = '';
  let adminToken = '';
  
  try {
    const playerRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'player@sigedivo.com',
      password: 'password123'
    });
    playerToken = playerRes.data.token;
    
    const adminRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'frankalfonso1988@gmail.com',
      password: 'admin123'
    });
    adminToken = adminRes.data.token;
    
    console.log('✅ Sesiones de prueba iniciadas (Player y Admin).');
  } catch (err: any) {
    console.error('❌ Error iniciando sesión. Asegúrate de que el API esté corriendo y la BD poblada.', err.message);
    process.exit(1);
  }

  const playerClient = axios.create({
    headers: { Authorization: `Bearer ${playerToken}` },
    validateStatus: () => true // Para no arrojar excepciones con 403
  });

  const adminClient = axios.create({
    headers: { Authorization: `Bearer ${adminToken}` },
    validateStatus: () => true
  });

  let fails = 0;

  console.log('\n--- PRUEBA 1: Escalada de Privilegios (Escalation) ---');
  console.log('Intentando que el Jugador asigne permisos de Admin a sí mismo...');
  
  const usersRes = await adminClient.get(`${API_URL}/users`);
  const playerUser = usersRes.data.data?.find((u: any) => u.email === 'player@sigedivo.com');
  
  if (playerUser) {
    const updateRoleRes = await playerClient.put(`${API_URL}/users/${playerUser.id}/roles`, {
      roles: ['admin']
    });
    
    if (updateRoleRes.status === 403 || updateRoleRes.status === 401) {
      console.log('✅ ÉXITO: El sistema bloqueó la escalada de privilegios (403/401)');
    } else {
      console.error(`❌ VULNERABILIDAD DETECTADA: El usuario no privilegiado pudo cambiar sus roles (Status ${updateRoleRes.status})`);
      fails++;
    }
  } else {
    console.log('⚠️ No se pudo aislar al usuario player. Omitiendo.');
  }

  console.log('\n--- PRUEBA 2: Referencia Directa a Objetos (IDOR) ---');
  console.log('Intentando que el Jugador borre un evento del sistema (requiere admin/manage)...');
  
  // Tomar el evento ID 1
  const deleteEventRes = await playerClient.delete(`${API_URL}/events/1`);
  if (deleteEventRes.status === 403 || deleteEventRes.status === 401) {
    console.log('✅ ÉXITO: El sistema bloqueó la manipulación IDOR del evento (403/401)');
  } else {
    console.error(`❌ VULNERABILIDAD DETECTADA: El usuario no autorizado pudo borrar el evento (Status ${deleteEventRes.status})`);
    fails++;
  }

  console.log('\n--- PRUEBA 3: Finanzas protegidas ---');
  console.log('Intentando que el Jugador lea transacciones financieras...');
  
  const financesRes = await playerClient.get(`${API_URL}/transactions`);
  if (financesRes.status === 403 || financesRes.status === 401) {
    console.log('✅ ÉXITO: Finanzas bloqueadas para no autorizados (403/401)');
  } else {
    console.error(`❌ VULNERABILIDAD DETECTADA: El usuario no autorizado leyó las finanzas (Status ${financesRes.status})`);
    fails++;
  }

  console.log('\n=== RESUMEN DE LA AUDITORÍA ===');
  if (fails === 0) {
    console.log('🛡️  SISTEMA SEGURO: Cero vulnerabilidades RBAC/IDOR detectadas.');
  } else {
    console.log(`🚨 SISTEMA VULNERABLE: Se encontraron ${fails} brechas de seguridad.`);
  }
}

runSecurityAudit();
