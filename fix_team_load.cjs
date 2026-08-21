const fs = require('fs');
let code = fs.readFileSync('apps/web/src/pages/AdminUsers.tsx', 'utf8');

const oldLoad = `      const data = await usersApi.list(status)
      setUsers(data)`;

const newLoad = `      const data = await usersApi.list(status)
      setUsers(data)
      const dataTeams = await http.get('/api/teams')
      setTeams(dataTeams.data)`;

code = code.replace(oldLoad, newLoad);
fs.writeFileSync('apps/web/src/pages/AdminUsers.tsx', code);
