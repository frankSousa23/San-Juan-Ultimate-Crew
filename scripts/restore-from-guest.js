import fs from 'fs';

const guestCode = fs.readFileSync('apps/api/src/lib/guestDemoData.ts', 'utf8');
let mockDb = fs.readFileSync('apps/api/src/lib/mockDb.ts', 'utf8');

function extractArray(name) {
  const regex = new RegExp(`export const ${name} = \\[(\\s*\\{.*?\\}?,?\\s*)+\\]`, 's');
  const match = guestCode.match(regex);
  if (match) {
    let content = match[0].replace(`export const ${name} = [`, '').replace(/\]$/, '');
    return content;
  }
  return null;
}

function replaceMockArray(name, guestArrayName, idKey) {
  const content = extractArray(guestArrayName);
  if (content) {
    // some guest data have references like GUEST_PLAYERS[0]. We need to remove them or fix them.
    // e.g. player: GUEST_PLAYERS[11] -> we just remove relation objects since mockDb findMany doesn't need them in the seed array
    let cleanContent = content.replace(/,\s*[a-zA-Z]+:\s*GUEST_[A-Z]+\[\d+\]/g, '');
    cleanContent = cleanContent.replace(/now\.getTime\(\)/g, 'new Date().getTime()');
    
    const regex = new RegExp(`this\\.${name} = \\[[^\\]]*\\];`, 'm');
    mockDb = mockDb.replace(regex, `this.${name} = [${cleanContent}];`);
    
    // update nextId
    // find max id
    let maxId = 0;
    const idRegex = /id:\s*(\d+)/g;
    let match;
    while ((match = idRegex.exec(cleanContent)) !== null) {
      if (parseInt(match[1]) > maxId) maxId = parseInt(match[1]);
    }
    const nextIdRegex = new RegExp(`this\\.nextId\\['${idKey}'\\] = \\d+;`);
    mockDb = mockDb.replace(nextIdRegex, `this.nextId['${idKey}'] = ${maxId + 1};`);
  }
}

replaceMockArray('accounts', 'GUEST_ACCOUNTS', 'account');
replaceMockArray('categories', 'GUEST_CATEGORIES', 'category');
replaceMockArray('transactions', 'GUEST_TRANSACTIONS', 'transaction');
replaceMockArray('plays', 'GUEST_PLAYS', 'play');
replaceMockArray('resources', 'GUEST_RESOURCES', 'resource');
replaceMockArray('injuries', 'GUEST_INJURIES', 'injury');

fs.writeFileSync('apps/api/src/lib/mockDb.ts', mockDb);
console.log('Restored from guestDemoData.ts');

