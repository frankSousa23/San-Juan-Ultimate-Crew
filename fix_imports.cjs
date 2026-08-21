const fs = require('fs');
let code = fs.readFileSync('apps/web/src/features/profile/components/ProfileOverview.tsx', 'utf8');

code = code.replace(/import \{ useAuth \} from '\.\.\/\.\.\/\.\.\/\.\.\/contexts\/AuthContext'/g, "import { useAuth } from '../../../contexts/AuthContext'");
code = code.replace(/import \{ myRoleRequestsApi \} from '\.\.\/\.\.\/\.\.\/\.\.\/lib\/api'/g, "import { myRoleRequestsApi } from '../../../lib/api'");

fs.writeFileSync('apps/web/src/features/profile/components/ProfileOverview.tsx', code);
