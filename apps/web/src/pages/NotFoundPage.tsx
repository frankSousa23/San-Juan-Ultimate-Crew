import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface NotFoundPageProps {
  code?: string | number;
  title?: string;
  message?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  code = '404',
  title = 'Página No Encontrada',
  message = 'Lo sentimos, la página o recurso que buscas no existe o ha sido movido.',
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-8 sm:p-10 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-4xl shadow-inner border border-blue-100 dark:border-blue-900/50">
          🥏
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-mono text-sm font-bold rounded-full">
            Estado {code}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            🏠 Ir al Inicio
          </Link>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-xl border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-2"
          >
            ↩️ Volver Atrás
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-400 dark:text-slate-500">
          SIGEDIVO • Sistema de Gestión para el Disco Volador
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
