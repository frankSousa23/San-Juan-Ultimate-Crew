const fs = require('fs');
const path = require('path');
const recPath = path.join(__dirname, 'docs', 'RECOMENDACIONES.md');

if (fs.existsSync(recPath)) {
  let content = fs.readFileSync(recPath, 'utf8');
  content = content.replace(
    /soporte multi-asociación/i,
    'escalado horizontal del actual soporte Multi-Equipo a un modelo jerárquico (Liga -> Asociación -> Club -> Equipo)'
  );
  
  if(!content.includes('El sistema ya cuenta con aislamiento Multi-Equipo')) {
    content = content.replace(/## 1\./, '## Estado Actual: Multi-Equipo Implementado\nEl sistema ya cuenta con aislamiento Multi-Equipo funcional (a nivel de `teamId`), lo que permite que múltiples clubes o categorías convivan en una misma base de datos con privacidad total.\n\n## 1.');
  }

  fs.writeFileSync(recPath, content);
}
