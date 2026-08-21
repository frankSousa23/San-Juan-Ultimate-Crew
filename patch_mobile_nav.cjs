const fs = require('fs');
let code = fs.readFileSync('apps/web/src/components/Layout.tsx', 'utf8');

const bottomNav = `
      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 w-full bg-white border-t flex justify-around items-center h-16 z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <Link to="/" className={\`flex flex-col items-center justify-center w-full h-full \${isActive('/') ? 'text-blue-600' : 'text-gray-500'}\`}>
            <span className="text-xl mb-0.5">🏠</span>
            <span className="text-[10px] font-medium">Inicio</span>
          </Link>
          <Link to="/eventos" className={\`flex flex-col items-center justify-center w-full h-full \${isActive('/eventos') ? 'text-blue-600' : 'text-gray-500'}\`}>
            <span className="text-xl mb-0.5">📅</span>
            <span className="text-[10px] font-medium">Eventos</span>
          </Link>
          <Link to="/roster" className={\`flex flex-col items-center justify-center w-full h-full \${isActive('/roster') ? 'text-blue-600' : 'text-gray-500'}\`}>
            <span className="text-xl mb-0.5">👥</span>
            <span className="text-[10px] font-medium">Roster</span>
          </Link>
          <Link to="/anotaciones" className={\`flex flex-col items-center justify-center w-full h-full \${isActive('/anotaciones') ? 'text-blue-600' : 'text-gray-500'}\`}>
            <span className="text-xl mb-0.5">🎯</span>
            <span className="text-[10px] font-medium">Pizarra</span>
          </Link>
      </nav>
    </div>
  )
}
`;

if (!code.includes('Mobile Bottom Tab Bar')) {
  // Update padding bottom in main
  code = code.replace(
    /<main className="flex-1 p-4 sm:p-4 lg:p-6 overflow-x-hidden">/,
    '<main className="flex-1 p-4 sm:p-4 lg:p-6 pb-20 sm:pb-20 lg:pb-6 overflow-x-hidden">'
  );

  code = code.replace(
    /    <\/div>\n  \)\n}/,
    bottomNav
  );
  fs.writeFileSync('apps/web/src/components/Layout.tsx', code);
}
