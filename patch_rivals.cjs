const fs = require('fs');
let code = fs.readFileSync('apps/web/src/pages/Rivals.tsx', 'utf8');

code = code.replace(/const \[total, setTotal\] = useState\(0\)/, 'const [total, setTotal] = useState(0)\n  const [error, setError] = useState<string | null>(null)');

fs.writeFileSync('apps/web/src/pages/Rivals.tsx', code);
