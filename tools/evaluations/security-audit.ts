import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

async function runSecurityAudit() {
  console.log('🛡️ Iniciando Auditoría de Seguridad (RBAC & IDOR)...\n');

  // Para esta prueba, necesitaremos los tokens
  // Como no podemos extraerlos tan fácil, vamos a iniciar sesión directamente
  // Usaremos el guest y el admin que creamos en el seed masivo.
  
  let guestToken = '';
  let adminToken = '';
  
  try {
    const guestRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'guest@sigedivo.com',
      password: 'admin123' // La que seteamos en el seed
    });
    guestToken = guestRes.data.token;
    
    const adminRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'frankalfonso1988@gmail.com',
      password: 'admin123'
    });
    adminToken = adminRes.data.token;
    
    console.log('✅ Sesiones de prueba iniciadas (Guest y Admin).');
  } catch (err) {
    console.error('❌ Error iniciando sesión. Asegúrate de que el API esté corriendo y la BD poblada.', err.message);
    process.exit(1);
  }

  const guestClient = axios.create({
    headers: { Authorization: `Bearer ${guestToken}` },
    validateStatus: () => true // Para no arrojar excepciones con 403
  });

  const adminClient = axios.create({
    headers: { Authorization: `Bearer ${adminToken}` },
    validateStatus: () => true
  });

  let fails = 0;

  console.log('\n--- PRUEBA 1: Escalada de Privilegios (Escalation) ---');
  console.log('Intentando que el Guest asigne permisos de Admin a sí mismo...');
  
  // Asumimos que ID 3 es el guest (guest@sigedivo.com)
  const usersRes = await adminClient.get(`${API_URL}/users`);
  const guestUser = usersRes.data.data?.find((u: any) => u.email === 'guest@sigedivo.com');
  
  if (guestUser) {
    const updateRoleRes = await guestClient.put(`${API_URL}/users/${guestUser.id}/roles`, {
      roles: ['admin']
    });
    
    if (updateRoleRes.status === 403 || updateRoleRes.status === 401) {
      console.log('✅ ÉXITO: El sistema bloqueó la escalada de privilegios (403/401)');
    } else {
      console.error(`❌ VULNERABILIDAD DETECTADA: El guest pudo cambiar sus roles (Status ${updateRoleRes.status})`);
      fails++;
    }
  } else {
    console.log('⚠️ No se pudo aislar al usuario guest. Omitiendo.');
  }

  console.log('\n--- PRUEBA 2: Referencia Directa a Objetos (IDOR) ---');
  console.log('Intentando que el Guest borre un evento del sistema (requiere admin/manage)...');
  
  // Tomar el evento ID 1
  const deleteEventRes = await guestClient.delete(`${API_URL}/events/1`);
  if (deleteEventRes.status === 403 || deleteEventRes.status === 401) {
    console.log('✅ ÉXITO: El sistema bloqueó la manipulación IDOR del evento (403/401)');
  } else {
    console.error(`❌ VULNERABILIDAD DETECTADA: El guest pudo borrar el evento (Status ${deleteEventRes.status})`);
    fails++;
  }

  console.log('\n--- PRUEBA 3: Finanzas protegidas ---');
  console.log('Intentando que el Guest lea transacciones financieras...');
  
  const financesRes = await guestClient.get(`${API_URL}/transactions`);
  if (financesRes.status === 403 || financesRes.status === 401) {
    console.log('✅ ÉXITO: Finanzas bloqueadas para no autorizados (403/401)');
  } else {
    console.error(`❌ VULNERABILIDAD DETECTADA: El guest leyó las finanzas (Status ${financesRes.status})`);
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
