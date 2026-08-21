const fs = require('fs');
let code = fs.readFileSync('apps/web/src/services/analyticsService.tsx', 'utf8');

code = code.replace(/this\.trackEvent\('interaction', 'click', this\.getElementInfo\(event\.target as Element\)\)/, 'this.trackEvent(\'interaction\', \'click\', JSON.stringify(this.getElementInfo(event.target as Element)))');
code = code.replace(/this\.trackEvent\('interaction', 'scroll', \{ scrollY: window\.scrollY \}\)/, 'this.trackEvent(\'interaction\', \'scroll\', JSON.stringify({ scrollY: window.scrollY }))');
code = code.replace(/this\.trackEvent\('form', 'submit', \{ formId: form\.id, formClass: form\.className \}\)/, 'this.trackEvent(\'form\', \'submit\', JSON.stringify({ formId: form.id, formClass: form.className }))');
code = code.replace(/this\.trackEvent\('error', 'javascript', \{\n\s+message: event\.message,\n\s+filename: event\.filename,\n\s+lineno: event\.lineno,\n\s+colno: event\.colno,\n\s+\}\)/, 'this.trackEvent(\'error\', \'javascript\', JSON.stringify({ message: event.message, filename: event.filename, lineno: event.lineno, colno: event.colno }))');
code = code.replace(/this\.trackEvent\('page', 'visibility_change', \{ visible: !document\.hidden \}\)/, 'this.trackEvent(\'page\', \'visibility_change\', JSON.stringify({ visible: !document.hidden }))');
code = code.replace(/entry\.value/g, '(entry as any).value');

fs.writeFileSync('apps/web/src/services/analyticsService.tsx', code);
