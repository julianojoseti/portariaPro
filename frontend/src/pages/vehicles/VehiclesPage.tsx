import { Car } from 'lucide-react';

export default function VehiclesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Veículos</h1>
        <p className="text-gray-500 text-sm mt-1">Cadastro de veículos de moradores</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-20">
        <Car className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500">Módulo de veículos em desenvolvimento.</p>
      </div>
    </div>
  );
}
