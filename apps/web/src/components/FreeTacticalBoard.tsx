import React, { useRef, useState, useEffect } from 'react'

type ToolType = 'draw' | 'offense' | 'defense' | 'disc' | 'erase' | 'text';

interface DrawAction {
  type: ToolType;
  x: number;
  y: number;
  points?: {x: number, y: number}[];
  text?: string;
  color?: string;
}

export default function FreeTacticalBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [currentTool, setCurrentTool] = useState<ToolType>('draw')
  const [actions, setActions] = useState<DrawAction[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<{x: number, y: number}[]>([])
  
  // Resize canvas responsively
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (container && canvas) {
        const { width } = container.getBoundingClientRect();
        // Maintain a 2:1 aspect ratio similar to the field
        canvas.width = width;
        canvas.height = width * 0.5;
        redraw(actions);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size
    
    return () => window.removeEventListener('resize', handleResize);
  }, [actions]);

  const redraw = (drawActions: DrawAction[], ongoingPath?: {x: number, y: number}[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw field background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Grass
    ctx.fillStyle = '#065f46'; // emerald-800
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw Field Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Endzones
    ctx.moveTo(canvas.width * 0.15, 0);
    ctx.lineTo(canvas.width * 0.15, canvas.height);
    ctx.moveTo(canvas.width * 0.85, 0);
    ctx.lineTo(canvas.width * 0.85, canvas.height);
    // Brick marks
    ctx.moveTo(canvas.width * 0.35, canvas.height * 0.48);
    ctx.lineTo(canvas.width * 0.35, canvas.height * 0.52);
    ctx.moveTo(canvas.width * 0.65, canvas.height * 0.48);
    ctx.lineTo(canvas.width * 0.65, canvas.height * 0.52);
    ctx.stroke();

    // Draw all saved actions
    drawActions.forEach(action => {
      if (action.type === 'draw' && action.points && action.points.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = action.color || 'yellow';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.moveTo(action.points[0].x, action.points[0].y);
        for (let i = 1; i < action.points.length; i++) {
          ctx.lineTo(action.points[i].x, action.points[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw arrowhead
        const last = action.points[action.points.length - 1];
        const prev = action.points[action.points.length - 2] || action.points[0];
        const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
        ctx.beginPath();
        ctx.fillStyle = action.color || 'yellow';
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(last.x - 10 * Math.cos(angle - Math.PI / 6), last.y - 10 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(last.x - 10 * Math.cos(angle + Math.PI / 6), last.y - 10 * Math.sin(angle + Math.PI / 6));
        ctx.fill();

      } else if (action.type === 'offense') {
        ctx.beginPath();
        ctx.arc(action.x, action.y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = '#3b82f6'; // blue
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('O', action.x, action.y);
      } else if (action.type === 'defense') {
        ctx.beginPath();
        ctx.arc(action.x, action.y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = '#ef4444'; // red
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('X', action.x, action.y);
      } else if (action.type === 'disc') {
        ctx.beginPath();
        ctx.arc(action.x, action.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // Draw ongoing path
    if (ongoingPath && ongoingPath.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = 'yellow';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.moveTo(ongoingPath[0].x, ongoingPath[0].y);
      for (let i = 1; i < ongoingPath.length; i++) {
        ctx.lineTo(ongoingPath[i].x, ongoingPath[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent scrolling when touching canvas
    if ('touches' in e && e.cancelable) e.preventDefault();
    
    const pos = getPos(e);
    
    if (currentTool === 'draw') {
      setIsDrawing(true);
      setCurrentPath([pos]);
    } else if (currentTool === 'offense' || currentTool === 'defense' || currentTool === 'disc') {
      const newAction: DrawAction = { type: currentTool, x: pos.x, y: pos.y };
      const newActions = [...actions, newAction];
      setActions(newActions);
      redraw(newActions);
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if ('touches' in e && e.cancelable) e.preventDefault();
    
    const pos = getPos(e);
    const newPath = [...currentPath, pos];
    setCurrentPath(newPath);
    redraw(actions, newPath);
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath.length > 1) {
      const newAction: DrawAction = { type: 'draw', x: 0, y: 0, points: currentPath, color: 'yellow' };
      const newActions = [...actions, newAction];
      setActions(newActions);
      redraw(newActions);
    }
    setCurrentPath([]);
  };

  const undo = () => {
    const newActions = actions.slice(0, -1);
    setActions(newActions);
    redraw(newActions);
  };

  const clear = () => {
    if (confirm('¿Limpiar toda la pizarra?')) {
      setActions([]);
      redraw([]);
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-gray-900">Pizarra Educativa Libre</h3>
          <p className="text-xs text-gray-500 mt-1">Dibuja rutas, coloca atacantes (O), defensores (X) y el disco para explicar conceptos rápidos.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 text-sm">
            <button
              onClick={() => setCurrentTool('draw')}
              className={`px-3 py-1.5 rounded-md font-bold transition-colors flex items-center gap-1 ${currentTool === 'draw' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              〰️ Ruta
            </button>
            <button
              onClick={() => setCurrentTool('offense')}
              className={`px-3 py-1.5 rounded-md font-bold transition-colors flex items-center gap-1 ${currentTool === 'offense' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              🔵 O (Ataque)
            </button>
            <button
              onClick={() => setCurrentTool('defense')}
              className={`px-3 py-1.5 rounded-md font-bold transition-colors flex items-center gap-1 ${currentTool === 'defense' ? 'bg-white text-rose-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              🔴 X (Defensa)
            </button>
            <button
              onClick={() => setCurrentTool('disc')}
              className={`px-3 py-1.5 rounded-md font-bold transition-colors flex items-center gap-1 ${currentTool === 'disc' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              ⚪ Disco
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={undo} disabled={actions.length === 0} className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-sm font-bold disabled:opacity-50">
              ↩️ Deshacer
            </button>
            <button onClick={clear} className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-sm font-bold">
              🗑️ Limpiar
            </button>
          </div>
        </div>
      </div>
      
      <div ref={containerRef} className="w-full relative touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className="w-full h-auto cursor-crosshair rounded-xl border-2 border-gray-800 shadow-inner block"
          style={{ touchAction: 'none' }}
        />
      </div>
    </div>
  )
}
