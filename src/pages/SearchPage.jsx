import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Coffee, Star } from 'lucide-react';
import { supabase } from '../supabase';

function SearchPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [cafes, setCafes] = useState([]);
  const [allCafes, setAllCafes] = useState([]); // Guardar todas las cafeterías para la búsqueda
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);

  // Obtener ubicación del usuario
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error obteniendo ubicación:", error);
          setLocationError(true); // Si hay error, permitimos cargar sin ubicación
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError(true); // Si no soporta geolocalización
    }
  }, []);

  // Función para calcular distancia usando la fórmula de Haversine
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distancia en km
  };

  useEffect(() => {
    // No cargar cafeterías hasta tener la ubicación o saber que falló
    if (!userLocation && !locationError) return;

    const fetchCafes = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('cafes')
        .select('*');

      if (!error && data) {
        let processedCafes = data;

        // Si tenemos la ubicación del usuario, calculamos distancias
        if (userLocation) {
          processedCafes = data.map(cafe => ({
            ...cafe,
            distance: calculateDistance(
              userLocation.lat, 
              userLocation.lng, 
              cafe.lat, 
              cafe.lng
            )
          }));
        }

        // Guardamos todas las cafeterías (con o sin distancia) para la búsqueda global
        setAllCafes(processedCafes);

        // Para la vista inicial (sin búsqueda), ordenamos por distancia y limitamos a 20
        const nearbyCafes = [...processedCafes]
          .sort((a, b) => (a.distance || 0) - (b.distance || 0))
          .slice(0, 20);
          
        setCafes(nearbyCafes);
      }
      setLoading(false);
    };

    fetchCafes();
  }, [userLocation, locationError]); // Se ejecuta cuando obtenemos ubicación o falla

  // Si hay texto de búsqueda, filtramos sobre TODAS las cafeterías y limitamos a 5. 
  // Si no hay texto, mostramos solo las 20 más cercanas.
  const displayedCafes = searchQuery.trim() !== '' 
    ? allCafes.filter(cafe => cafe.nombre.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 4)
    : cafes;

return (
    <main className="h-full w-full bg-[#1D1A15] flex flex-col">
        {/* Header */}
        <header className="p-4 pt-6 z-10 flex flex-col items-center gap-3">
            {/* Buttons */}
            <div className="w-full flex items-center gap-4 mb-6">
                    <button 
                    onClick={() => navigate('/')}
                    className="w-10 h-10 rounded-full bg-[#372821] hover:bg-[#372821]/50 flex items-center justify-center transition-colors"
                    >
                    <ArrowLeft className="text-[#E6DAC1]" size={24} />
                    </button>
            </div>

            {/* Text */}
            <h2 className="text-md italic text-[#E6DAC1]">
                    Encuentra tu nueva cafetería favorita
            </h2>

            {/* Search Bar */}
            <div className="flex-1 relative w-full">
                <input 
                    type="text" 
                    placeholder="Buscar cafeterías..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#372821] text-[#E6DAC1] placeholder-[#E6DAC1]/50 rounded-full py-3 px-4 pl-10 outline-none focus:ring-2 focus:ring-[#E6DAC1]/50 transition-all"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#E6DAC1]/50">
                    <Search size={20} />
                </span>
            </div>
        </header>

        {/* Lista de resultados */}
        <section className="flex-1 overflow-y-auto pr-2 pl-6">
            <h2 className="text-lg font-bold text-[#E6DAC1] mb-6">
                {searchQuery ? 'Resultados de búsqueda' : 'Cafeterías cercanas'}
            </h2>

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-4 border-[#372821] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : displayedCafes.length > 0 ? (
                <div className="flex flex-col gap-8">
                    {displayedCafes.map(cafe => (
                        <div 
                            key={cafe.id} 
                            onClick={() => navigate(`/cafe/${cafe.id}`)}
                            className="max-h-23 bg-[#493A33] rounded-3xl shadow-sm flex gap-4 items-center cursor-pointer hover:bg-gray-50 transition-colors active:scale-[0.98]"
                        >
                            {cafe.image_url ? (
                                <img src={cafe.image_url} alt={cafe.nombre} className="min-w-25 max-w-25 h-25 rounded-3xl -ml-4 object-cover bg-gray-200" />
                            ) : (
                                <div className="w-16 h-16 rounded-xl bg-gray-200 flex items-center justify-center">
                                    <Coffee className="text-[#E6DAC1]" size={28} />
                                </div>
                            )}
                            <div className="flex-1 pr-4">
                                <h3 className="font-bold text-[#E6DAC1] line-clamp-2">{cafe.nombre}</h3>
                                <div className="flex items-center gap-1 mt-1">
                                    <Star className="text-yellow-500 fill-yellow-500" size={14} />
                                    <span className="text-sm font-medium text-[#E6DAC1]/50">{cafe.rating || 'N/A'}</span>
                                    <span className="text-xs text-gray-400">({cafe.reviews || 0})</span>
                                    {cafe.distance !== undefined && (
                                        <span className="text-xs text-[#E6DAC1]/40 ml-auto">
                                            {cafe.distance < 1 
                                                ? `${Math.round(cafe.distance * 1000)}m` 
                                                : `${cafe.distance.toFixed(1)}km`}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 text-gray-500">
                    No se encontraron cafeterías.
                </div>
            )}
        </section>
    </main>
);
}

export default SearchPage;
