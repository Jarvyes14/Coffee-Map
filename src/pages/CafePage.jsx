import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, ExternalLink, Coffee } from 'lucide-react';
import { supabase } from '../supabase';

function CafePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cafe, setCafe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCafe = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('cafes')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        setCafe(data);
      }
      setLoading(false);
    };

    fetchCafe();
  }, [id]);

  if (loading) {
    return (
      <div className="h-screen w-full bg-gray-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#372821] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!cafe) {
    return (
      <div className="h-screen w-full bg-gray-100 flex flex-col items-center justify-center p-4">
        <p className="text-xl text-gray-600 mb-4">Cafetería no encontrada</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-[#372821] text-[#E6DAC1] px-6 py-3 rounded-full font-bold"
        >
          Volver al mapa
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#1D1A15] flex flex-col">
      {/* Botón de regreso flotante */}
      <button 
        onClick={() => navigate(-1)}
        className="fixed top-6 left-6 z-50 w-6 h-6 rounded-md bg-black/70 backdrop-blur-md hover:bg-black/60 flex items-center justify-center transition-colors"
      >
        <ArrowLeft className="text-white" size={12} />
      </button>

      {/* Mitad superior: Imagen */}
      <div className="h-[50vh] w-auto relative shrink-0">
        {cafe.image_url ? (
          <img 
            src={cafe.image_url} 
            alt={cafe.nombre} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#372821]/10">
            <Coffee className="text-[#372821]/30" size={80} />
          </div>
        )}
      </div>

      {/* Mitad inferior: Información */}
      <div className="flex flex-col -mt-18 relative z-10 items-center">
        <div className="bg-[#372821]/95 rounded-3xl p-6 shadow-xl">
          <h1 className="text-2xl font-black text-gray-200 mb-2 leading-tight">
            {cafe.nombre}
          </h1>
        </div>

        <div className="flex items-center gap-8 mt-4 w-fit">
            <div className="flex items-center gap-1 bg-[#372821] px-3 py-1.5 rounded-full">
                <Star className="text-yellow-500 fill-yellow-500" size={18} />
                <span className="font-bold text-yellow-700 w-min">{cafe.rating || 'N/A'}</span>
            </div>
            <span className="text-gray-500 text-sm font-medium">
                {cafe.reviews || 0} reseñas
            </span>
        </div>  
        <div className="space-y-4">
        {cafe.link && (
            <a 
            href={cafe.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 m-4 rounded-full bg-[#372821] hover:bg-blue-100 transition-colors text-white font-semibold"
            >
            <MapPin size={24} className="shrink-0" />
            <span>Ver en Google Maps</span>
            <ExternalLink size={18} className="ml-auto opacity-50" />
            </a>
        )}

        {/* Aquí se pueden agregar más apartados en el futuro (horarios, menú, etc.) */}
        <div className="p-4 rounded-2xl bg-[#372821] m-4">
            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
            <Coffee size={18} />
            Sobre este lugar
            </h3>
            <p className="text-white text-sm leading-relaxed">
            Información detallada sobre la cafetería próximamente. Aquí podrás ver horarios, especialidades y reseñas de otros usuarios.
            </p>
        </div>
        </div>
    </div>
    </main>
  );
}

export default CafePage;
