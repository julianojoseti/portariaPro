import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, DoorOpen, Loader2, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function SelectCondominiumPage() {
  const { condominiums, selectCondominium, logout, user } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSelect = async (id: string) => {
    setLoading(id);
    setError('');
    try {
      await selectCondominium(id);
      navigate('/dashboard');
    } catch {
      setError('Não foi possível selecionar o condomínio. Tente novamente.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <DoorOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Selecione o Condomínio</h1>
            <p className="text-gray-500 text-sm mt-1">Olá, {user?.name}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {condominiums.map((condo) => (
              <button
                key={condo.id}
                onClick={() => handleSelect(condo.id)}
                disabled={!!loading}
                className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-60 text-left"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium text-gray-900">{condo.name}</span>
                {loading === condo.id && (
                  <Loader2 className="w-4 h-4 animate-spin ml-auto text-blue-600" />
                )}
              </button>
            ))}
          </div>

          {condominiums.length === 0 && (
            <p className="text-center text-gray-500 text-sm mt-4">
              Nenhum condomínio disponível para sua conta.
            </p>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={async () => { await logout(); navigate('/login'); }}
              className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors py-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
