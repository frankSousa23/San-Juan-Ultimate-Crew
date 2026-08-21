const fs = require('fs');
let code = fs.readFileSync('apps/api/src/routes/auth.ts', 'utf8');

code = code.replace(/const roleNamesTemp = userData\?\.roles \|\| \[\];\n  const token = signToken\(\{ sub: user\.id, email: user\.email, teamId: user\.teamId, roles: roleNamesTemp \}\)\n  const audit = createAuditHelper\(req\)\n  await audit\.log\('LOGIN', 'User', user\.id, \{ email: user\.email \}\)\n  const userData = await getUserWithPermissions\(user\.id\)/, 'const userData = await getUserWithPermissions(user.id)\n  const roleNamesTemp = userData?.roles || [];\n  const token = signToken({ sub: user.id, email: user.email, teamId: userData?.user?.teamId, roles: roleNamesTemp })\n  const audit = createAuditHelper(req)\n  await audit.log(\'LOGIN\', \'User\', user.id, { email: user.email })');

fs.writeFileSync('apps/api/src/routes/auth.ts', code);
