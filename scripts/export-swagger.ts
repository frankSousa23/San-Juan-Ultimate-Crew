import fs from 'fs';
import path from 'path';
import { swaggerSpec } from '../apps/api/src/lib/swagger.js';

const outputPath = path.resolve(process.cwd(), 'swagger-postman.json');
fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));

console.log(`Swagger JSON exportado a: ${outputPath}`);
