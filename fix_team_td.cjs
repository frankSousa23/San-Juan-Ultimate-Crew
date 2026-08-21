const fs = require('fs');
let code = fs.readFileSync('apps/web/src/pages/AdminUsers.tsx', 'utf8');

const oldBlock = `                  </div>
                </td>
                <td className="px-4 py-2">
                  <input`;

const newBlock = `                  </div>
                </td>
                <td className="px-4 py-2">
                  <select
                    className="border rounded px-2 py-1 text-sm w-full"
                    value={teamSelection[u.id] || (u.teamId ? String(u.teamId) : '')}
                    onChange={async (e) => {
                      const newTeamId = e.target.value ? Number(e.target.value) : null;
                      setTeamSelection(prev => ({ ...prev, [u.id]: e.target.value }));
                      try {
                        await http.put(\`/api/users/\${u.id}/team\`, { teamId: newTeamId });
                        toast.showSuccessToast('Equipo asignado correctamente');
                        load();
                      } catch (err: any) {
                        toast.showErrorToast(err?.response?.data?.error || 'Error al asignar equipo');
                      }
                    }}
                  >
                    <option value="">Sin equipo</option>
                    {teams.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <input`;

code = code.replace(oldBlock, newBlock);
fs.writeFileSync('apps/web/src/pages/AdminUsers.tsx', code);
