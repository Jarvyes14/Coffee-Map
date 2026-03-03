import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, ExternalLink, Coffee, Heart, CheckCircle2, Clock, Edit3, Save } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

function CafePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [cafe, setCafe] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estados de iteracción del usuario
  const [interactionId, setInteractionId] = useState(null);
  const [isVisited, setIsVisited] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [inWaitlist, setInWaitlist] = useState(false);
  
  // Reseña y Rating
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [savingInteraction, setSavingInteraction] = useState(false);

  useEffect(() => {
    const fetchCafeAndInteraction = async () => {
      setLoading(true);
      // 1. Cargar datos de la cafetería
      const { data: cafeData, error: cafeError } = await supabase
        .from('cafes')
        .select('*')
        .eq('id', id)
        .single();

      if (!cafeError && cafeData) {
        setCafe(cafeData);
      }

      // 2. Cargar interacción del usuario actual con esta cafetería
      if (user && cafeData) {
        const { data: interData, error: interError } = await supabase
          .from('user_cafes')
          .select('*')
          .eq('user_id', user.id)
          .eq('cafe_id', cafeData.id)
          .maybeSingle();

        if (!interError && interData) {
          setInteractionId(interData.id);
          setIsVisited(interData.is_visited || false);
          setIsFavorite(interData.is_favorite || false);
          setInWaitlist(interData.in_waitlist || false);
          setRating(interData.rating || 0);
          setReviewText(interData.review_text || '');
        }
      }
      setLoading(false);
    };

    fetchCafeAndInteraction();
  }, [id, user]);

  // Función unificada para guardar interacciones en la base de datos
  const saveInteraction = async (updates) => {
    if (!user || !cafe) return;
    setSavingInteraction(true);
    
    try {
      
      const payload = {
        user_id: user.id,
        cafe_id: cafe.id,
        is_visited: typeof updates.isVisited === 'boolean' ? updates.isVisited : isVisited,
        is_favorite: typeof updates.isFavorite === 'boolean' ? updates.isFavorite : isFavorite,
        in_waitlist: typeof updates.inWaitlist === 'boolean' ? updates.inWaitlist : inWaitlist,
        rating: typeof updates.rating === 'number' ? updates.rating : (rating === 0 ? null : rating),
        review_text: updates.reviewText !== undefined ? updates.reviewText : reviewText,
        updated_at: new Date().toISOString()
      };

      if (interactionId) {
        // Actualizar registro existente
        await supabase
          .from('user_cafes')
          .update(payload)
          .eq('id', interactionId);
      } else {
        // Crear nuevo registro
        const { data, error } = await supabase
          .from('user_cafes')
          .insert([payload])
          .select()
          .single();
          
        if (!error && data) {
          setInteractionId(data.id);
        }
      }
    } catch (e) {
      console.error("Error al guardar iteracción", e);
    } finally {
      setSavingInteraction(false);
    }
  };

  // Handlers para Toggles
  const toggleVisited = () => {
    setIsVisited(!isVisited);
    saveInteraction({ isVisited: !isVisited });
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    saveInteraction({ isFavorite: !isFavorite });
  };

  const toggleWaitlist = () => {
    setInWaitlist(!inWaitlist);
    saveInteraction({ inWaitlist: !inWaitlist });
  };

  const handleSaveReview = () => {
    setIsEditingReview(false);
    saveInteraction({ rating, reviewText });
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#1D1A15] flex flex-col items-center justify-center">  
        <div className="w-10 h-10 border-4 border-[#372821] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[#E6DAC1]/50">Cargando la cafetería...</p>
      </div>
    );
  }

  if (!cafe) {
    return (
      <div className="h-screen w-full bg-[#1D1A15] flex flex-col items-center justify-center p-4">
        <p className="text-xl text-gray-500 mb-4">Cafetería no encontrada</p>        
        <button onClick={() => navigate('/')} className="bg-[#372821] text-[#E6DAC1] px-6 py-3 rounded-full font-bold">
          Volver al mapa
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#1D1A15] flex flex-col relative pb-10">
      {/* Botón de regreso flotante */}
      <button onClick={() => navigate(-1)} className="fixed top-6 left-6 z-50 w-10 h-10 rounded-full bg-black/70 backdrop-blur-md hover:bg-black/80 flex items-center justify-center transition-colors shadow-lg">
        <ArrowLeft className="text-[#E6DAC1]" size={24} />
      </button>

      {/* Mitad superior: Imagen */}
      <div className="h-[40vh] w-full relative shrink-0">
        {cafe.image_url ? (
          <img src={cafe.image_url} alt={cafe.nombre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#372821]/10">
            <Coffee className="text-[#372821]/30" size={80} />
          </div>
        )}
        <div className="absolute bottom-0 left-0 w-full h-24 bg-linear-to-t from-[#1D1A15] to-transparent"></div>
      </div>

      {/* Mitad inferior principal */}
      <div className="flex flex-col -mt-10 relative z-10 px-4">
        <div className="bg-[#27201A] rounded-4xl p-6 shadow-xl w-full border border-white/5 mb-6">
          <h1 className="text-2xl font-black text-[#E6DAC1] mb-2 leading-tight uppercase font-lancelot truncate">
            {cafe.nombre}
          </h1>

          <div className="flex items-center gap-4 mt-2 mb-4 w-fit">
              <div className="flex items-center gap-1 bg-[#372821] px-3 py-1.5 rounded-full">
                  <Star className="text-yellow-500 fill-yellow-500" size={16} />        
                  <span className="font-bold text-[#E6DAC1]">{cafe.rating || 'N/A'}</span>
              </div>
              <span className="text-[#E6DAC1]/50 text-sm font-medium">
                  {cafe.reviews || 0} reseñas globales
              </span>
          </div>
          
          {/* Botones de acción rápida */}
          <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={toggleVisited} 
                className={`flex flex-col items-center py-3 rounded-2xl transition-colors ${isVisited ? 'bg-[#4B6B40]/20 text-[#8BC34A] border border-[#8BC34A]/50' : 'bg-[#372821] text-[#E6DAC1]/50'}`}
              >
                  <CheckCircle2 size={24} className="mb-1" />
                  <span className="text-xs font-bold">Fui</span>
              </button>
              <button 
                onClick={toggleFavorite} 
                className={`flex flex-col items-center py-3 rounded-2xl transition-colors ${isFavorite ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-[#372821] text-[#E6DAC1]/50'}`}
              >
                  <Heart size={24} className={`mb-1 ${isFavorite ? 'fill-current' : ''}`} />
                  <span className="text-xs font-bold">Me gusta</span>
              </button>
              <button 
                onClick={toggleWaitlist} 
                className={`flex flex-col items-center py-3 rounded-2xl transition-colors ${inWaitlist ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'bg-[#372821] text-[#E6DAC1]/50'}`}
              >
                  <Clock size={24} className="mb-1" />
                  <span className="text-xs font-bold">Ir luego</span>
              </button>
          </div>
        </div>

        {/* Sección de Reseña del Usuario */}
        <div className="bg-[#27201A] rounded-4xl p-6 shadow-xl w-full border border-white/5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-[#E6DAC1] text-lg">Mi Reseña</h3>
            {!isEditingReview && (
              <button onClick={() => setIsEditingReview(true)} className="text-[#E6DAC1]/50 hover:text-[#E6DAC1]">
                <Edit3 size={18} />
              </button>
            )}
          </div>

          {isEditingReview ? (
            <div className="flex flex-col gap-4">
              <div className="flex gap-2 justify-center py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star}
                    size={32}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className={`cursor-pointer transition-all ${star <= (hoverRating || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-[#372821] fill-[#372821]'}`}
                  />
                ))}
              </div>
              
              <textarea 
                value={reviewText} 
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="¿Qué tal estuvo el café? ¿Y el internet?..."
                className="w-full bg-[#1D1A15] text-[#E6DAC1] p-4 rounded-2xl outline-none min-h-30 resize-none border border-white/5 focus:border-[#E6DAC1]/30"
              />
              
              <div className="flex gap-3 mt-2">
                <button 
                  onClick={() => setIsEditingReview(false)} 
                  className="flex-1 py-3 text-[#E6DAC1]/50 font-bold hover:bg-[#372821] rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveReview}
                  className="flex-1 bg-[#372821] hover:bg-[#493A33] text-[#E6DAC1] py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border border-white/10"
                >
                  <Save size={18} /> Guardar
                </button>                 
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {rating > 0 ? (
                <div className="flex gap-1 mb-3 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star}
                      size={20}
                      className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-[#372821] fill-[#372821]'}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-[#E6DAC1]/30 text-sm mb-4">Aún no has calificado este lugar</p>
              )}
              
              {reviewText ? (
                <p className="text-[#E6DAC1] text-sm bg-[#1D1A15] p-4 rounded-2xl border border-white/5 italic text-center">
                  "{reviewText}"
                </p>
              ) : (
                <button onClick={() => setIsEditingReview(true)} className="w-full py-4 border-2 border-dashed border-[#372821] hover:border-[#372821]/80 rounded-2xl text-[#E6DAC1]/40 font-bold text-sm transition-colors">
                  Escribir reseña...
                </button>
              )}
            </div>
          )}
        </div>

        {/* Apartado Original: Google Maps */}
        {cafe.link && (
            <a href={cafe.link} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-3 p-4 rounded-2xl bg-[#372821] hover:bg-[#493A33] transition-colors text-[#E6DAC1] border border-white/5">
            <MapPin size={24} className="shrink-0 text-blue-400" />
            <span className="font-bold">Ver en Google Maps</span>
            <ExternalLink size={18} className="ml-auto opacity-50" />
            </a>
        )}
      </div>
    </main>
  );
}

export default CafePage;