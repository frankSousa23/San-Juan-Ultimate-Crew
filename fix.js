const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    let p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.ts')) {
      let c = fs.readFileSync(p, 'utf8');
      if (c.includes('frankalfonso1988@gmail.com') || c.includes('admin123')) {
        fs.writeFileSync(p, c.replace(/admin@example\.com/g, 'frankalfonso1988@gmail.com').replace(/admin123/g, '123456'));
        console.log('Updated ' + p);
      }
    }
  });
}

walk('apps/api/src');
walk('apps/api/prisma');
