const fs = require('fs');

function fixFile(file) {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  if (code.includes('const [error, setError]') || !code.includes('setError')) return;
  code = code.replace(/const \[total, setTotal\] = useState\(0\)/, 'const [total, setTotal] = useState(0)\n  const [error, setError] = useState<string | null>(null)');
  if (!code.includes('const [error, setError]')) {
      code = code.replace(/const \[q, setQ\] = useState/, 'const [error, setError] = useState<string | null>(null)\n  const [q, setQ] = useState');
  }
  code = code.replace(/const \{ execute: (.+?), loading, error \} = useApi\(/, 'const { execute: $1, loading, error: apiError } = useApi(');
  code = code.replace(/\{error && \(/, '{(error || apiError) && (');
  code = code.replace(/<div className="pr-3">\{error\}<\/div>/, '<div className="pr-3">{error || apiError}</div>');
  fs.writeFileSync(file, code);
}

fixFile('apps/web/src/pages/Finances.tsx');
fixFile('apps/web/src/pages/Injuries.tsx');

