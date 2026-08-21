const fs = require('fs');
let code = fs.readFileSync('apps/web/src/pages/Rivals.tsx', 'utf8');

code = code.replace(/const \{ execute: loadRivals, loading, error \} = useApi\(/, 'const { execute: loadRivals, loading, error: apiError } = useApi(');
code = code.replace(/\{error && \(/, '{(error || apiError) && (');
code = code.replace(/<div className="pr-3">\{error\}<\/div>/, '<div className="pr-3">{error || apiError}</div>');

fs.writeFileSync('apps/web/src/pages/Rivals.tsx', code);
