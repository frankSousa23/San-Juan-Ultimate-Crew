const fs = require('fs');

let inputCode = fs.readFileSync('apps/web/src/components/Input.tsx', 'utf8');
inputCode = inputCode.replace(/size\?: "sm" \| "md" \| "lg"/g, 'inputSize?: "sm" | "md" | "lg"');
inputCode = inputCode.replace(/size ===/g, 'inputSize ===');
inputCode = inputCode.replace(/size \{/g, 'inputSize {');
inputCode = inputCode.replace(/value=\{value\}/, 'value={value as string}');
inputCode = inputCode.replace(/size\?: 'sm' \| 'md' \| 'lg'/g, 'inputSize?: "sm" | "md" | "lg"');
fs.writeFileSync('apps/web/src/components/Input.tsx', inputCode);

let btnCode = fs.readFileSync('apps/web/src/components/Button.tsx', 'utf8');
btnCode = btnCode.replace(/variant="outline"/g, '');
fs.writeFileSync('apps/web/src/components/Button.tsx', btnCode);

let optCode = fs.readFileSync('apps/web/src/services/networkOptimization.ts', 'utf8');
optCode = optCode.replace(/return JSON\.parse\(cached\.data\)/g, 'return JSON.parse(cached.data) as unknown as T');
optCode = optCode.replace(/return this\.executeRequest<T>\(request, this\.generateRequestId\(request\)\)/g, 'return this.executeRequest<any>(request, this.generateRequestId(request))');
fs.writeFileSync('apps/web/src/services/networkOptimization.ts', optCode);

let profileCode = fs.readFileSync('apps/web/src/features/profile/components/ProfileOverview.tsx', 'utf8');
profileCode = profileCode.replace(/role =>/g, '(role: any) =>');
profileCode = profileCode.replace(/prev =>/g, '(prev: any) =>');
profileCode = profileCode.replace(/usersApi\.togglePlayerRole/g, 'handleTogglePlayerRole');
fs.writeFileSync('apps/web/src/features/profile/components/ProfileOverview.tsx', profileCode);

let annFormCode = fs.readFileSync('apps/web/src/features/events/components/AnnotationForm.tsx', 'utf8');
annFormCode = annFormCode.replace(/onSubmit\(\{\n\s*playerId: /g, 'onSubmit({ eventId: 0, playerId: ');
fs.writeFileSync('apps/web/src/features/events/components/AnnotationForm.tsx', annFormCode);

console.log('done');
