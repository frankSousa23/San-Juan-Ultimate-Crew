import fs from 'fs';
const mapContent = fs.readFileSync('dist/server.cjs.map', 'utf8');
const map = JSON.parse(mapContent);
for (let i = 0; i < map.sources.length; i++) {
  if (map.sources[i].includes('mockDb.ts')) {
    const sourceCode = map.sourcesContent[i];
    fs.writeFileSync('apps/api/src/lib/mockDb.ts', sourceCode);
    console.log('Recovered from: ' + map.sources[i]);
    process.exit(0);
  }
}
console.log('Not found in sourcemap');
