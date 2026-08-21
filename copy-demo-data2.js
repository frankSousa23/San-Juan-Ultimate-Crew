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

const content = extractArray('GUEST_POSTS');
if (content) {
  // some guest data have references like GUEST_PLAYERS[0]. We need to remove them.
  let cleanContent = content.replace(/,\s*[a-zA-Z]+:\s*GUEST_[A-Z]+\[\d+\]/g, '');
  cleanContent = cleanContent.replace(/now\.getTime\(\)/g, 'new Date().getTime()');
  // Add authorId: 1
  cleanContent = cleanContent.replace(/isPinned:\s*(true|false),/g, '$& authorId: 1,');
  
  // Replace the block in mockDb.ts
  const regex = new RegExp(`this\\.newsPosts = \\[[\\s\\S]*?\\];`, 'm');
  if (regex.test(mockDb)) {
    mockDb = mockDb.replace(regex, `this.newsPosts = [${cleanContent}];`);
  } else {
    console.log(`Could not find this.newsPosts in mockDb.ts`);
  }
  
  let maxId = 0;
  const idRegex = /id:\s*(\d+)/g;
  let match;
  while ((match = idRegex.exec(cleanContent)) !== null) {
    if (parseInt(match[1]) > maxId) maxId = parseInt(match[1]);
  }
  const nextIdRegex = new RegExp(`this\\.nextId\\['newsPost'\\] = \\d+;`);
  mockDb = mockDb.replace(nextIdRegex, `this.nextId['newsPost'] = ${maxId + 1};`);
  
  fs.writeFileSync('apps/api/src/lib/mockDb.ts', mockDb);
  console.log('Restored posts to mockDb.ts successfully.');
}

