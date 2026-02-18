import { useEffect, useRef, useState } from 'react'
import CafeMarker from './components/CafeMarker'

function App() {
  const mapRef = useRef(null)
  const [map, setMap] = useState(null)
  const [markerLib, setMarkerLib] = useState(null)
  const [cafes, setCafes] = useState([])
  const [scanning, setScanning] = useState(false)
  const isInitialLoad = useRef(false)

  // Función para descargar el JSON
  const downloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cafes, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `mapeo_cafes_${cafes.length}_items.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // FUNCIÓN PARA ESCANEAR LA ZONA ACTUAL
  const scanCurrentView = async () => {
    if (!map) return;
    setScanning(true);

    try {
      const { Place } = await window.google.maps.importLibrary("places");
      const currentCenter = map.getCenter();

      const { places } = await Place.searchByText({
        textQuery: 'cafetería',
        fields: ['id', 'displayName', 'location', 'rating', 'userRatingCount', 'photos', 'googleMapsURI'],
        // CAMBIO AQUÍ:
        locationRestriction: map.getBounds(), // Usa el rectángulo exacto de tu pantalla
        maxResultCount: 20,
      });

      if (places && places.length > 0) {
        setCafes((prevCafes) => {
          // Usamos un Map temporal para asegurar que no haya IDs duplicados
          const cache = new Map();
          prevCafes.forEach(c => cache.set(c.id, c));
          
          places.forEach(p => {
            cache.set(p.id, {
              id: p.id,
              nombre: p.displayName,
              pos: { lat: p.location.lat(), lng: p.location.lng() },
              rating: p.rating,
              reviews: p.userRatingCount,
              link: p.googleMapsURI,
              imageUrl: p.photos?.[0]?.getURI({ maxWidth: 400 }) || null,
            });
          });
          
          return Array.from(cache.values());
        });
      }
    } catch (error) {
      console.error("Error al escanear zona:", error);
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

        const center = { lat: 20.9753, lng: -89.6178 };

        const mapInstance = new Map(mapRef.current, {
          center: center,
          zoom: 14,
          mapId: '383293d592cd3fce17f51410', 
          disableDefaultUI: false,
        });

        setMap(mapInstance);
        setMarkerLib({ AdvancedMarkerElement });
      } catch (error) {
        console.error("Error inicializando mapa:", error);
      }
    };

    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyD6Vdvl-ITAKJPpHIq4NCDTSKFcIe3dcZs&v=beta&libraries=places`;
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, []);

  return (
    <main className="h-full w-full relative bg-gray-100">
      {/* Panel de Control */}
      <div className="absolute top-6 left-6 z-20 bg-white p-6 rounded-2xl shadow-2xl w-72 border border-blue-100">
        <h2 className="text-xl font-bold text-gray-800 mb-1">☕️ Café Scanner</h2>
        <p className="text-xs text-blue-500 font-mono mb-4">MODO MANUAL POR ZONA</p>
        
        <div className="bg-blue-50 p-3 rounded-xl mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-600">Total capturado:</span>
            <span className="text-lg font-bold text-blue-800">{cafes.length}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            onClick={scanCurrentView}
            disabled={scanning}
            className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${
              scanning ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {scanning ? "BUSCANDO..." : "ESCANEAR ESTA ZONA"}
          </button>

          <button 
            onClick={downloadJSON}
            disabled={cafes.length === 0}
            className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-30 shadow-md"
          >
            DESCARGAR JSON
          </button>
        </div>
        
        <p className="mt-4 text-[10px] text-gray-400 leading-tight">
          * Mueve el mapa a una zona y presiona "Escanear" para acumular cafeterías.
        </p>
      </div>

      <div id="map" ref={mapRef} className="h-screen w-full" />
      
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