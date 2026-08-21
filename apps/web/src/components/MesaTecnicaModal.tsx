import React, { useEffect, useState } from 'react';
import { eventsApi, playersApi, adminUsersApi } from '../lib/api';
import { EventItem } from '../types/event';
import { Player } from '../types/player';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  event: EventItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

type MesaRole = 'DIRECTOR_MESA' | 'PLANILLERO_ANOTADOR' | 'CRONOMETRISTA' | 'VEEDOR_ESPIRITU' | 'DELEGADO_CAMPO' | 'STAFF_MESA';

const ROLE_DEFINITIONS: Record<MesaRole, { label: string; icon: string; desc: string }> = {
  DIRECTOR_MESA: { label: 'Director de Mesa', icon: '👑', desc: 'Máxima autoridad operativa del evento y resolución de discrepancias.' },
  PLANILLERO_ANOTADOR: { label: 'Planillero / Anotador Oficial', icon: '📝', desc: 'Responsable de asentar goles, asistencias y defensas en vivo.' },
  CRONOMETRISTA: { label: 'Cronometrista Oficial', icon: '⏱️', desc: 'Control del reloj de juego, tiempos fuera y silbatos reglamentarios.' },
  VEEDOR_ESPIRITU: { label: 'Veedor SOTG / Fair Play', icon: '🤝', desc: 'Supervisa el espíritu de juego y facilita la calificación final.' },
  DELEGADO_CAMPO: { label: 'Delegado de Campo', icon: '🚩', desc: 'Coordinación de conos, hidratación y estado del terreno.' },
  STAFF_MESA: { label: 'Staff de Apoyo', icon: '📋', desc: 'Asistencia general para logística y rotación de discos.' },
};

interface MemberRow {
  playerId?: number | null;
  userId?: number | null;
  name?: string;
  role: MesaRole;
  isCurrentShift?: boolean;
}

export default function MesaTecnicaModal({ event, isOpen, onClose, onUpdated }: Props) {
  const toasts = useToast();
  const { user, hasRole, hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [allUsers, setAllUsers] = useState<Array<{ id: number; email: string; name?: string; roles: string[] }>>([]);

  const [isAnnotatorLocked, setIsAnnotatorLocked] = useState(false);
  const [officialAnnotatorId, setOfficialAnnotatorId] = useState<number | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [annotatorsAudit, setAnnotatorsAudit] = useState<Array<{ id: number; name: string; email: string; annotationsCount: number }>>([]);

  // Shift Change state
  const [showShiftChangeModal, setShowShiftChangeModal] = useState(false);
  const [nextAnnotatorId, setNextAnnotatorId] = useState<number | null>(null);
  const [shiftReason, setShiftReason] = useState('');
  const [shifting, setShifting] = useState(false);

  const canManage = hasRole('admin') || hasRole('directiva') || hasRole('coach') || hasRole('captain') || hasPermission('events:manage');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, event.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mtData, playersRes, usersRes] = await Promise.allSettled([
        eventsApi.getMesaTecnica(event.id),
        playersApi.list(),
        adminUsersApi.list()
      ]);

      if (playersRes.status === 'fulfilled' && Array.isArray(playersRes.value)) {
        setAllPlayers(playersRes.value);
      }
      if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
        setAllUsers(usersRes.value);
      }

      if (mtData.status === 'fulfilled') {
        const d = mtData.value;
        setIsAnnotatorLocked(Boolean(d.isAnnotatorLocked));
        setOfficialAnnotatorId(d.officialAnnotatorId || null);
        setAnnotatorsAudit(d.annotatorsAudit || []);
        
        if (d.members && d.members.length > 0) {
          setMembers(d.members.map(m => ({
            playerId: m.playerId || null,
            name: m.playerName || '',
            role: (m.role as MesaRole) || 'PLANILLERO_ANOTADOR',
            isCurrentShift: Boolean(m.isCurrentShift)
          })));
        } else {
          // Initialize with suggested roles if empty
          setMembers([
            { role: 'DIRECTOR_MESA', name: '', playerId: null, isCurrentShift: false },
            { role: 'PLANILLERO_ANOTADOR', name: '', playerId: null, isCurrentShift: true },
            { role: 'CRONOMETRISTA', name: '', playerId: null, isCurrentShift: false },
            { role: 'VEEDOR_ESPIRITU', name: '', playerId: null, isCurrentShift: false }
          ]);
        }
      }
    } catch (err: any) {
      toasts.error(err?.message || 'Error al cargar datos de Mesa Técnica');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = () => {
    setMembers(prev => [
      ...prev,
      { role: 'STAFF_MESA', name: '', playerId: null, isCurrentShift: false }
    ]);
  };

  const handleRemoveMember = (index: number) => {
    setMembers(prev => prev.filter((_, i) => i !== index));
  };

  const handleMemberChange = (index: number, field: keyof MemberRow, value: any) => {
    setMembers(prev => {
      const next = [...prev];
      const updated = { ...next[index], [field]: value };
      
      // If playerId is selected, auto-fill name
      if (field === 'playerId' && value) {
        const found = allPlayers.find(p => p.id === Number(value));
        if (found) {
          updated.name = `${found.name}`.trim();
        }
      }
      next[index] = updated;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        isAnnotatorLocked,
        officialAnnotatorId,
        members: members.filter(m => m.playerId || (m.name && m.name.trim().length > 0)).map(m => ({
          playerId: m.playerId ? Number(m.playerId) : null,
          name: m.name?.trim(),
          role: m.role,
          isCurrentShift: Boolean(m.isCurrentShift)
        }))
      };

      await eventsApi.saveMesaTecnica(event.id, payload);
      toasts.success('Mesa Técnica actualizada con éxito');
      if (onUpdated) onUpdated();
      onClose();
    } catch (err: any) {
      toasts.error(err?.message || 'Error al guardar Mesa Técnica');
    } finally {
      setSaving(false);
    }
  };

  const handleShiftChange = async () => {
    if (!nextAnnotatorId) {
      toasts.error('Selecciona el nuevo responsable en turno');
      return;
    }
    setShifting(true);
    try {
      await eventsApi.shiftChangeMesaTecnica(event.id, {
        nextOfficialAnnotatorId: nextAnnotatorId,
        reason: shiftReason
      });
      toasts.success('Relevo de turno registrado con éxito');
      setShowShiftChangeModal(false);
      setShiftReason('');
      loadData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      toasts.error(err?.message || 'Error al realizar el relevo de turno');
    } finally {
      setShifting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-indigo-900">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📋</span>
              <h3 className="text-lg font-black tracking-tight">Designación de Mesa Técnica</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                {event.type}
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-0.5">
              Evento: <strong className="text-white">{event.title}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-gray-800">
          {loading ? (
            <div className="py-12 text-center text-gray-500 space-y-2">
              <div className="text-3xl animate-bounce">⏱️</div>
              <p className="text-xs font-semibold">Cargando responsables de mesa técnica...</p>
            </div>
          ) : (
            <>
              {/* Informative Banner */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-700 font-bold text-sm">Organización por Evento Especial</span>
                    <span className="px-2 py-0.5 bg-indigo-200 text-indigo-800 rounded font-black text-[10px]">
                      Específico de este Evento
                    </span>
                  </div>
                  <p className="text-xs text-indigo-900 leading-relaxed">
                    Los jugadores y miembros designados asumen la Mesa Técnica exclusivamente durante este evento o jornada. Al terminar, la categoría se reasigna para el próximo evento. Si un miembro debe jugar su partido, utiliza el botón de <strong>Relevo de Turno</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowShiftChangeModal(true)}
                  className="self-start sm:self-auto px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow whitespace-nowrap flex items-center gap-1.5 transition"
                >
                  <span>🔄</span>
                  <span>Relevo de Turno</span>
                </button>
              </div>

              {/* Security & Annotator Lock */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <span>🔒</span>
                  <span>Control y Bloqueo Oficial de Planilla</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Responsable Oficial con Turno Activo:
                    </label>
                    <select
                      value={officialAnnotatorId || ''}
                      onChange={e => setOfficialAnnotatorId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Sin responsable exclusivo (Abierto) --</option>
                      {allUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name ? `${u.name} (${u.email})` : u.email} [{u.roles.join(', ')}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3 pt-2 sm:pt-4">
                    <input
                      type="checkbox"
                      id="modal_annotator_lock"
                      checked={isAnnotatorLocked}
                      onChange={e => setIsAnnotatorLocked(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                    />
                    <label htmlFor="modal_annotator_lock" className="text-xs font-semibold text-gray-700 cursor-pointer">
                      Bloquear planillaje exclusivo a la Mesa Técnica y Administradores
                    </label>
                  </div>
                </div>
              </div>

              {/* Members List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">Cuerpo Designado para este Evento</h4>
                    <p className="text-xs text-gray-500">
                      Asigna a jugadores activos del club o a colaboradores externos / personal de apoyo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition flex items-center gap-1"
                  >
                    <span>+</span>
                    <span>Agregar Puesto</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {members.map((member, index) => (
                    <div
                      key={index}
                      className="p-3 bg-white border border-gray-200 rounded-xl shadow-xs hover:border-indigo-300 transition-colors flex flex-col sm:flex-row sm:items-center gap-3"
                    >
                      {/* Role selection */}
                      <div className="w-full sm:w-1/3">
                        <label className="block text-[10px] uppercase font-bold text-gray-500 mb-0.5">Función</label>
                        <select
                          value={member.role}
                          onChange={e => handleMemberChange(index, 'role', e.target.value as MesaRole)}
                          className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-slate-50 font-bold text-gray-800"
                        >
                          {Object.entries(ROLE_DEFINITIONS).map(([key, def]) => (
                            <option key={key} value={key}>
                              {def.icon} {def.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Player Select or Manual Name */}
                      <div className="w-full sm:w-1/3">
                        <label className="block text-[10px] uppercase font-bold text-gray-500 mb-0.5">Jugador del Club</label>
                        <select
                          value={member.playerId || ''}
                          onChange={e => handleMemberChange(index, 'playerId', e.target.value ? Number(e.target.value) : null)}
                          className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white"
                        >
                          <option value="">-- No es jugador / Externo --</option>
                          {allPlayers.map(p => (
                            <option key={p.id} value={p.id}>
                              #{p.number} {p.name} ({p.position})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Custom Name / External */}
                      <div className="w-full sm:w-1/4">
                        <label className="block text-[10px] uppercase font-bold text-gray-500 mb-0.5">Nombre / Apoyo</label>
                        <input
                          type="text"
                          value={member.name || ''}
                          onChange={e => handleMemberChange(index, 'name', e.target.value)}
                          placeholder="Nombre responsable..."
                          className="w-full px-2.5 py-1.5 border rounded-lg text-xs"
                        />
                      </div>

                      {/* Remove Button */}
                      <div className="pt-2 sm:pt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(index)}
                          className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 text-xs font-bold"
                          title="Eliminar puesto"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit List */}
              {annotatorsAudit.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="font-bold text-xs text-gray-700 uppercase mb-2">
                    Historial de Registros en Planilla durante este Evento
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {annotatorsAudit.map(a => (
                      <div key={a.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-gray-800">{a.name}</div>
                          <div className="text-[10px] text-gray-500">{a.email}</div>
                        </div>
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-800 font-black rounded-lg text-xs">
                          {a.annotationsCount} anotaciones
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl text-xs transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving || !canManage}
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {saving ? 'Guardando...' : 'Guardar Designación de Mesa'}
          </button>
        </div>
      </div>

      {/* Submodal: Shift Change */}
      {showShiftChangeModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔄</span>
                <h4 className="font-black text-gray-900 text-base">Relevo de Turno en Mesa</h4>
              </div>
              <button onClick={() => setShowShiftChangeModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <p className="text-xs text-gray-600">
              Permite transferir el control oficial de la planilla de forma inmediata (por ejemplo, si el planillero actual entra a jugar su partido).
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Nuevo Responsable de Planilla:</label>
                <select
                  value={nextAnnotatorId || ''}
                  onChange={e => setNextAnnotatorId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 border rounded-xl bg-white font-medium"
                >
                  <option value="">-- Seleccionar usuario --</option>
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email} [{u.roles.join(', ')}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Motivo del Relevo (Opcional):</label>
                <input
                  type="text"
                  value={shiftReason}
                  onChange={e => setShiftReason(e.target.value)}
                  placeholder="Ej: Entra a jugar semifinal, relevo reglamentario..."
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowShiftChangeModal(false)}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 font-bold rounded-lg text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={shifting || !nextAnnotatorId}
                onClick={handleShiftChange}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow disabled:opacity-50"
              >
                {shifting ? 'Transfiriendo...' : 'Confirmar Relevo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
