const fs = require('fs');

function createPdf() {
  const content = `
%PDF-1.4
1 0 obj
<<
  /Type /Catalog
  /Pages 2 0 R
>>
endobj
2 0 obj
<<
  /Type /Pages
  /Kids [3 0 R 4 0 R]
  /Count 2
>>
endobj
3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 595.28 841.89]
  /Contents 5 0 R
  /Resources <<
    /Font <<
      /F1 7 0 R
      /F2 8 0 R
    >>
  >>
>>
endobj
4 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 595.28 841.89]
  /Contents 6 0 R
  /Resources <<
    /Font <<
      /F1 7 0 R
      /F2 8 0 R
    >>
  >>
>>
endobj
7 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica-Bold
>>
endobj
8 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica
>>
endobj
`;
}
