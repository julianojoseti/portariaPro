import { UserCheck } from 'lucide-react';

export default function VisitorsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Visitantes</h1>
        <p className="text-gray-500 text-sm mt-1">Cadastro e histórico de visitantes</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-20">
        <UserCheck className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500">Módulo de visitantes em desenvolvimento.</p>
        <p className="text-gray-400 text-sm mt-1">Use a tela de Portaria para registrar visitantes em tempo real.</p>
      </div>
    </div>
  );
}
