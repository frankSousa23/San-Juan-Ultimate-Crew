const fs = require('fs');
let schema = fs.readFileSync('apps/api/prisma/schema.prisma', 'utf8');

const teamModel = `
model Team {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  color       String?
  logoUrl     String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  users       User[]
  players     Player[]
  events      Event[]
}
`;

// Insert Team model before Feedback
schema = schema.replace('// Global System Feedback', teamModel + '\n// Global System Feedback');

// Add teamId to User
schema = schema.replace(/model User \{[\s\S]*?playerId Int\?/m, match => match.replace('playerId Int?', 'teamId       Int?\n  team         Team?      @relation(fields: [teamId], references: [id], onDelete: SetNull)\n\n  playerId Int?'));

// Add teamId to Player
schema = schema.replace(/model Player \{[\s\S]*?number     Int            @unique/m, match => match.replace('number     Int            @unique', 'number     Int            @unique\n  teamId     Int?\n  team       Team?          @relation(fields: [teamId], references: [id], onDelete: SetNull)'));

// Add teamId to Event
schema = schema.replace(/model Event \{[\s\S]*?title       String/m, match => match.replace('title       String', 'title       String\n  teamId      Int?\n  team        Team?       @relation(fields: [teamId], references: [id], onDelete: Cascade)'));

fs.writeFileSync('apps/api/prisma/schema.prisma', schema);
