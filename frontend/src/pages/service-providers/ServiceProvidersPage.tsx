import { Wrench } from 'lucide-react';

export default function ServiceProvidersPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Prestadores de Serviço</h1>
        <p className="text-gray-500 text-sm mt-1">Controle de prestadores e fornecedores</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-20">
        <Wrench className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500">Módulo de prestadores em desenvolvimento.</p>
        <p className="text-gray-400 text-sm mt-1">Use a tela de Portaria para registrar prestadores em tempo real.</p>
      </div>
    </div>
  );
}
