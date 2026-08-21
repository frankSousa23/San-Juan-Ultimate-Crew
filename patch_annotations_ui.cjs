const fs = require('fs');
let code = fs.readFileSync('apps/web/src/components/LiveAnnotationsTable.tsx', 'utf8');

const optimisticAdd = `
      // Optimistic UI Update
      const optimisticAnn = {
        id: Date.now(), // Temp ID
        eventId: payload.eventId,
        type: payload.type,
        playerId: payload.playerId || null,
        relatedPlayerId: payload.relatedPlayerId || null,
        teamSide: payload.teamSide || null,
        opponentPlayerName: payload.opponentPlayerName || null,
        opponentTeamName: payload.opponentTeamName || null,
        timestamp: payload.timestamp,
        createdAt: new Date().toISOString()
      };
      setAnnotations(prev => [optimisticAnn, ...prev]);
      
      // Async API call without blocking the UI
      annotationsApi.create(payload).then(() => {
        loadData();
        toasts.success(typeLabel);
      }).catch((err) => {
        toasts.error(err?.response?.data?.error || 'No se pudo registrar la anotación');
        loadData();
      });
      return; // Early return to avoid old blocking logic
`;

if (!code.includes('// Optimistic UI Update')) {
  code = code.replace(
    /await annotationsApi\.create\(payload\)\n\s*await loadData\(\)\n\s*toasts\.success\(typeLabel\)/,
    optimisticAdd
  );
  fs.writeFileSync('apps/web/src/components/LiveAnnotationsTable.tsx', code);
}
