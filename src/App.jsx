import { useEffect, useRef, useState } from 'react'
import CafeMarker from './components/CafeMarker'
import { useAuth } from './context/AuthContext'
import { supabase } from './supabase'

function App() {
  const { logout } = useAuth();
  const mapRef = useRef(null)
  const [map, setMap] = useState(null)
  const [markerLib, setMarkerLib] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loggingOut, setLoggingOut] = useState(false)
  const isInitialLoad = useRef(false)

  const [cafes, setCafes] = useState([]);

  // Cargar cafeterías desde Supabase al iniciar
  useEffect(() => {
    const fetchCafes = async () => {
      const { data, error } = await supabase
        .from('cafes')
        .select('*');
      
      if (error) {
        console.error('Error cargando cafeterías:', error);
        showToast("❌ Error al cargar las cafeterías.");
      } else if (data) {
        // Formatear los datos para que coincidan con la estructura que espera el mapa
        const formattedCafes = data.map(cafe => ({
          id: cafe.id,
          nombre: cafe.nombre,
          pos: { lat: cafe.lat, lng: cafe.lng },
          rating: cafe.rating,
          reviews: cafe.reviews,
          link: cafe.link,
          imageUrl: cafe.image_url
        }));
        setCafes(formattedCafes);
      }
    };

    fetchCafes();
  }, []);

  const showToast = (message) => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  const scanCurrentView = async () => {
    if (!map) return;
    setScanning(true);

    try {
      const { Place } = await window.google.maps.importLibrary("places");
      const currentCenter = map.getCenter();

      const { places } = await Place.searchByText({
        textQuery: 'cafetería',
        fields: ['id', 'displayName', 'location', 'rating', 'userRatingCount', 'photos', 'googleMapsURI'],
        locationBias: currentCenter,
        maxResultCount: 20,
      });

      if (places && places.length > 0) {
        const nuevosParaAgregar = [];
        const idsExistentes = new Set(cafes.map(c => c.id));

        const localesProcesados = places.map(p => ({
          id: p.id,
          nombre: p.displayName,
          pos: { lat: p.location.lat(), lng: p.location.lng() },
          rating: p.rating,
          reviews: p.userRatingCount,
          link: p.googleMapsURI,
          imageUrl: p.photos?.[0]?.getURI({ maxWidth: 400 }) || null,
        }));

        localesProcesados.forEach(lp => {
          if (!idsExistentes.has(lp.id)) {
            nuevosParaAgregar.push(lp);
          }
        });

        if (nuevosParaAgregar.length > 0) {
          // Preparar datos para Supabase
          const cafesParaSupabase = nuevosParaAgregar.map(cafe => ({
            id: cafe.id,
            nombre: cafe.nombre,
            lat: cafe.pos.lat,
            lng: cafe.pos.lng,
            rating: cafe.rating,
            reviews: cafe.reviews,
            link: cafe.link,
            image_url: cafe.imageUrl
          }));

          // Insertar en Supabase
          const { error: insertError } = await supabase
            .from('cafes')
            .insert(cafesParaSupabase);

          if (insertError) {
            console.error('Error guardando en Supabase:', insertError);
            showToast("❌ Error al guardar las nuevas cafeterías.");
          } else {
            // Actualizar estado local solo si se guardó en la BD
            setCafes(prev => [...prev, ...nuevosParaAgregar]);

            nuevosParaAgregar.forEach((cafe, index) => {
              setTimeout(() => {
                showToast(`✨ ¡Nueva! "${cafe.nombre}" guardada.`);
              }, index * 600);
            });
          }
        } else {
          showToast("📍 No hay nada nuevo en esta zona.");
        }
      }
    } catch (error) {
      console.error(error);
      showToast("❌ Error en la conexión.");
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    if (isInitialLoad.current) return;
    isInitialLoad.current = true;

    const initMap = async () => {
      try {
        const { Map } = await window.google.maps.importLibrary("maps");
        const { AdvancedMarkerElement } = await window.google.maps.importLibrary("marker");

        const mapInstance = new Map(mapRef.current, {
          center: { lat: 20.9753, lng: -89.6178 },
          zoom: 14,
          mapId: '383293d592cd3fce17f51410',
          disableDefaultUI: true,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          rotateControl: false,
          cameraControl: false,
        });

        setMap(mapInstance);
        setMarkerLib({ AdvancedMarkerElement });
      } catch (error) { console.error(error); }
    };

    if (!window.google) {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        showToast("❌ Falta VITE_GOOGLE_MAPS_API_KEY en .env");
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=beta&libraries=places`;
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, []);

  return (
    <main className="h-full w-full relative bg-gray-100 overflow-hidden">
      <style>{`
        @keyframes slideIn {
          0% { transform: translateX(120%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>

      <div className="absolute top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {notifications.map((n) => (
          <div key={n.id} className="bg-black/85 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 animate-slide-in pointer-events-auto min-w-[280px]">
            <span className="text-lg">☕️</span>
            <p className="text-sm font-medium tracking-tight">{n.message}</p>
          </div>
        ))}
      </div>

      <button className="absolute top-6 left-6 z-30 w-10 h-10 rounded-full bg-[#372821] hover:bg-gray-100 shadow-lg transition-all active:scale-95 flex items-center justify-center">
        <span className="text-md text-[#E6DAC1]">☰</span>
      </button>

      <button className="absolute top-6 right-6 z-30 w-10 h-10 rounded-full bg-[#372821] hover:bg-gray-100 shadow-lg transition-all active:scale-95 flex items-center justify-center">
        <span className="text-xl text-[#E6DAC1]">👤</span>
      </button>

      {/*Este elemento es para pruebas y desarrollo, no forma parte de la UI final, pero tampoco debe ser eliminado o modificado */}
      <div className="hidden absolute top-6/11 left-6 z-20 bg-white/95 backdrop-blur-sm p-6 rounded-3xl shadow-2xl w-80 border border-gray-100">
        <h2 className="text-2xl font-black text-gray-900 mb-1">Mérida DB</h2>
        <div className="flex items-center gap-2 mb-6">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Conectado a Supabase</p>
        </div>
        
        <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 flex justify-around">
          <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase font-bold">Total Acumulado</p>
            <p className="text-3xl font-black text-gray-800">{cafes.length}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={scanCurrentView} 
            disabled={scanning}
            className={`w-full font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${scanning ? 'bg-gray-200 text-gray-400' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            {scanning ? "ESCANEANDO..." : "ESCANEAR Y GUARDAR"}
          </button>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className={`w-full font-bold py-3 rounded-2xl transition-all ${loggingOut ? 'bg-gray-200 text-gray-400' : 'bg-red-600 hover:bg-red-700 text-white'}`}
          >
            {loggingOut ? 'CERRANDO...' : 'CERRAR SESIÓN'}
          </button>
        </div>
      </div>

      <div id="map" ref={mapRef} className="h-screen w-full" />

      <div 
        className="absolute inset-0 pointer-events-none bg-[#372821]/30" 
        style={{ zIndex: 1, mixBlendMode: 'sepia' }} 
      />

      {map && markerLib && cafes.map((cafe) => (
        <CafeMarker
          key={cafe.id}
          map={map}
          markerLib={markerLib}
          position={cafe.pos}
          title={cafe.nombre}
        />
      ))}
    </main>
  );
}

export default App;