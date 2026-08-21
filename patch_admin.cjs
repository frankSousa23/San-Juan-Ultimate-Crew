const fs = require('fs');
let code = fs.readFileSync('apps/web/src/pages/AdminUsers.tsx', 'utf8');

// Add teams state
code = code.replace(/const \[requests, setRequests\] = useState<any\[\]>\(\[\]\)/, 'const [requests, setRequests] = useState<any[]>([])\n  const [teams, setTeams] = useState<any[]>([])\n  const [teamSelection, setTeamSelection] = useState<Record<number, string>>({})');

// Fetch teams
code = code.replace(/const fetchUsers = async \(\) => {/g, 'const fetchTeams = async () => {\n    try {\n      const res = await http.get("/api/teams")\n      setTeams(res.data)\n    } catch(e) {}\n  }\n\n  const fetchUsers = async () => {');

// Call fetchTeams in useEffect
code = code.replace(/fetchUsers\(\)\n\s+fetchRequests\(\)/, 'fetchUsers()\n    fetchRequests()\n    fetchTeams()');

// Initialize teamSelection in fetchUsers
code = code.replace(/const newRoles: Record<number, Set<string>> = {}/, 'const newRoles: Record<number, Set<string>> = {}\n        const newTeams: Record<number, string> = {}');
code = code.replace(/newRoles\[u\.id\] = new Set\(u\.roles\)/, 'newRoles[u.id] = new Set(u.roles)\n          newTeams[u.id] = String(u.teamId || "")');
code = code.replace(/setRoles\(newRoles\)/, 'setRoles(newRoles)\n        setTeamSelection(newTeams)');

// Function to update team
const updateTeamFn = `
  const handleUpdateTeam = async (userId: number, teamIdStr: string) => {
    try {
      const parsedTeam = teamIdStr ? parseInt(teamIdStr) : null;
      await http.patch(\`/api/users/\${userId}/team\`, { teamId: parsedTeam });
      toast.show('Equipo actualizado correctamente', 'success');
      setTeamSelection(prev => ({ ...prev, [userId]: teamIdStr }));
      fetchUsers();
    } catch (err: any) {
      toast.show('Error al actualizar equipo', 'error');
    }
  }
`;
code = code.replace(/const handleAssignRole = async/, updateTeamFn + '\n  const handleAssignRole = async');

// Add select dropdown in the render table
const thReplacement = `
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipo</th>
`;
code = code.replace(/<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles<\/th>/, thReplacement);

const tdReplacement = `
                      <td className="px-4 py-4">
                        <select
                          className="mt-1 block w-full pl-3 pr-10 py-1 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                          value={teamSelection[u.id] || ""}
                          onChange={(e) => handleUpdateTeam(u.id, e.target.value)}
                        >
                          <option value="">[Sin Equipo]</option>
                          {teams.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </td>
`;
code = code.replace(/<td className="px-4 py-4 text-sm font-medium">[\s\S]*?<div className="flex gap-2">/, match => tdReplacement + match);

fs.writeFileSync('apps/web/src/pages/AdminUsers.tsx', code);
