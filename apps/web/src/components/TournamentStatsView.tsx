import React, { useEffect, useState } from 'react';
import { http, eventsApi } from '../lib/api';

type TournamentStat = {
  playerId: number;
  playerName: string;
  playerNumber: number;
  goals: number;
  assists: number;
  defenses: number;
  turnovers: number;
  drops: number;
};

type TournamentStatsResponse = {
  matchesPlayed: number;
  goals: number;
  assists: number;
  defenses: number;
  playerStats: TournamentStat[];
};

export default function TournamentStatsView() {
  const [tournaments, setTournaments] = useState<{id: number, title: string}[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<number | null>(null);
  const [stats, setStats] = useState<TournamentStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch tournaments
    eventsApi.list().then(res => {
      const ts = res.filter(e => e.type === 'TOURNAMENT').sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
      setTournaments(ts);
      if (ts.length > 0) {
        setSelectedTournament(ts[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedTournament) return;
    setLoading(true);
    http.get<TournamentStatsResponse>(`/api/stats/tournament/${selectedTournament}`)
      .then(res => {
        setStats(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedTournament]);

  return (
    <div className="bg-white rounded-lg shadow mt-8">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
          <h3 className="font-semibold text-lg">Estadísticas por Torneo</h3>
        </div>
        
        {tournaments.length > 0 ? (
          <select 
            value={selectedTournament || ''} 
            onChange={(e) => setSelectedTournament(Number(e.target.value))}
            className="w-full md:w-1/2 px-3 py-2 border rounded-lg"
          >
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        ) : (
          <p className="text-gray-500">No hay torneos disponibles.</p>
        )}
      </div>

      {loading && <div className="p-6 text-center text-gray-500">Cargando estadísticas del torneo...</div>}

      {!loading && stats && (
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-indigo-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-indigo-700">{stats.matchesPlayed}</div>
              <div className="text-xs text-indigo-900 uppercase font-semibold">Partidos Jugados</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-700">{stats.goals}</div>
              <div className="text-xs text-green-900 uppercase font-semibold">Goles Totales</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-700">{stats.assists}</div>
              <div className="text-xs text-blue-900 uppercase font-semibold">Asistencias</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-700">{stats.defenses}</div>
              <div className="text-xs text-purple-900 uppercase font-semibold">Defensas (D's)</div>
            </div>
          </div>

          <h4 className="font-medium text-gray-800 mb-3">Rendimiento por Jugador</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Jugador</th>
                  <th className="px-4 py-3 text-center">Goles</th>
                  <th className="px-4 py-3 text-center">Asist.</th>
                  <th className="px-4 py-3 text-center">D's</th>
                  <th className="px-4 py-3 text-center">Turnovers</th>
                  <th className="px-4 py-3 text-center">Drops</th>
                </tr>
              </thead>
              <tbody>
                {stats.playerStats.length > 0 ? stats.playerStats.map(p => (
                  <tr key={p.playerId} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <span className="text-gray-400 mr-2">#{p.playerNumber}</span>
                      {p.playerName}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-green-600">{p.goals > 0 ? p.goals : '-'}</td>
                    <td className="px-4 py-3 text-center font-semibold text-blue-600">{p.assists > 0 ? p.assists : '-'}</td>
                    <td className="px-4 py-3 text-center font-semibold text-purple-600">{p.defenses > 0 ? p.defenses : '-'}</td>
                    <td className="px-4 py-3 text-center text-red-500">{p.turnovers > 0 ? p.turnovers : '-'}</td>
                    <td className="px-4 py-3 text-center text-orange-500">{p.drops > 0 ? p.drops : '-'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No hay estadísticas de jugadores registradas para este torneo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
