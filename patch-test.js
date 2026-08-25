const fs = require('fs');
const content = fs.readFileSync('apps/api/src/eventParticipants.test.ts', 'utf8');

const importPrisma = "import { prisma } from './lib/prisma.js'\n";
let newContent = content;
if (!content.includes('import { prisma }')) {
  newContent = importPrisma + content;
}

newContent = newContent.replace('beforeAll(async () => {', 
`beforeAll(async () => {
    // Seed test data
    const ev = await prisma.event.create({
      data: { title: 'Test Event for Participants', type: 'TRAINING', startsAt: new Date() }
    })
    const pl = await prisma.player.create({
      data: { name: 'Test Player for Participants', number: 99, position: 'HANDLER' }
    })
`);

fs.writeFileSync('apps/api/src/eventParticipants.test.ts', newContent);
