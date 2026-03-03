import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Settings, Coffee, Star, MapPin, Heart, ArrowLeft, LogOut, Camera, Loader2 } from 'lucide-react';
import BottomNav from '../components/BottomNav';

function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [visitedPlaces, setVisitedPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchProfileData = async () => {
      setLoading(true);
      try {
        // 1. Obtener datos del perfil principal
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        // 2. Obtener todas las interacciones de este usuario con cafeterías
        const { data: interactionsData, error: interactionsError } = await supabase
          .from('user_cafes')
          .select('*')
          .eq('user_id', user.id);

        let stats = { visited: 0, favorites: 0, reviews: 0, waiting_list: 0, rateds: 0 };
        let fetchedVisitedPlaces = [];
        
        if (!interactionsError && interactionsData) {
            stats = {
                visited: interactionsData.filter(i => i.is_visited).length,
                favorites: interactionsData.filter(i => i.is_favorite).length,
                waiting_list: interactionsData.filter(i => i.in_waitlist).length,
                reviews: interactionsData.filter(i => i.review_text && i.review_text.trim() !== '').length,
                rateds: interactionsData.filter(i => i.rating && i.rating > 0).length,
            };

            const visitedInteractions = interactionsData.filter(i => i.is_visited);
            if (visitedInteractions.length > 0) {
                const cafeIds = visitedInteractions.map(i => i.cafe_id);
                const { data: cafesData } = await supabase
                    .from('cafes')
                    .select('*')
                    .in('id', cafeIds);
                
                if (cafesData) {
                    fetchedVisitedPlaces = visitedInteractions.map(inter => {
                        const cafe = cafesData.find(c => c.id === inter.cafe_id);
                        return { ...inter, cafe };
                    }).filter(i => i.cafe);
                }
            }
        }

        setVisitedPlaces(fetchedVisitedPlaces);

        if (!profileError && profileData) {
          setProfile({
            ...profileData,
            stats: stats
          });
        } else {
            // Fallback si no hay perfil en dB aun
            setProfile({
                username: user.user_metadata?.username || "Usuario Coffee",
                avatar_url: `https://api.dicebear.com/7.x/miniavs/svg?seed=${user.email}`,
                stats: stats
            });
        }
      } catch (err) {
        console.error("Error al cargar perfil", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const uploadAvatar = async (event) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Debes seleccionar una imagen para subir.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const updates = {
        id: user.id,
        avatar_url: data.publicUrl,
        username: profile.username
      };

      let { error } = await supabase.from('profiles').upsert(updates);

      if (error) {
        throw error;
      }
      
      setProfile({ ...profile, avatar_url: data.publicUrl });
    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading || !profile) {
    return (
        <div className="h-full w-full bg-[#1D1A15] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#372821] border-t-[#E6DAC1] rounded-full animate-spin"></div>
        </div>
    );
  }

  return (
    <main className="h-full w-full bg-[#1D1A15] flex flex-col relative overflow-hidden">
      
      {/* HEADER */}
      <div className="px-6 pt-10 pb-4 flex justify-between items-center z-10">
        <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="text-[#E6DAC1]" size={24} />
        </button>
        <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-full hover:bg-white/10 transition-colors relative">
            <Settings className="text-[#E6DAC1]" size={24} />
            
            {/* Pequeño menú de settings temporal */}
            {showSettings && (
                <div className="absolute top-12 right-0 bg-[#372821] rounded-2xl p-2 shadow-2xl border border-white/10 min-w-37.5">
                    <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-400 font-bold hover:bg-white/5 rounded-xl flex items-center gap-2"
                    >
                        <LogOut size={16} /> Salir
                    </button>
                </div>
            )}
        </button>
      </div>

      <section className="flex-1 overflow-y-auto pb-24">
        {/* AVATAR & INFO */}
        <div className="flex flex-col items-center mt-2 px-6">
            <div className="relative w-28 h-28 mb-4">
                <div className="w-full h-full rounded-full border-4 border-[#372821] bg-[#493A33] overflow-hidden shadow-xl">
                    <img 
                        src={profile.avatar_url || `https://api.dicebear.com/7.x/miniavs/svg?seed=${profile.username}`} 
                        alt="Profile" 
                        className={`w-full h-full object-cover ${uploading ? 'opacity-50' : ''}`} 
                    />
                </div>
                
                {/* Upload Button overlay */}
                <label className="absolute bottom-0 right-0 bg-[#372821] border-2 border-[#1D1A15] p-2 rounded-full cursor-pointer hover:bg-[#493A33] transition-colors shadow-lg z-10 w-10 h-10 flex items-center justify-center">
                  {uploading ? (
                    <Loader2 className="text-[#E6DAC1] animate-spin" size={16} />
                  ) : (
                    <Camera className="text-[#E6DAC1]" size={16} />
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={uploadAvatar} 
                    disabled={uploading}
                    className="hidden" 
                  />
                </label>
            </div>
            <h1 className="text-3xl font-black text-[#E6DAC1] mb-1 font-lancelot tracking-wider">{profile.username}</h1>
        </div>

        {/* LUGARES VISITADOS (Horizontal Scroll) */}
        <div className="mt-10">
            <div className="flex justify-between items-end px-6 mb-4">
                <h2 className="text-[#E6DAC1] font-bold text-xl">Lugares Visitados</h2>
                <span className="text-sm font-bold text-[#E6DAC1]/50">{profile.stats.visited}</span>
            </div>
            
            <div className="w-full overflow-x-auto pb-4 hide-scrollbar">
                <div className="flex gap-4 px-6 w-max">
                    {visitedPlaces.length > 0 ? visitedPlaces.map((visit) => (
                        <div 
                          key={visit.id} 
                          onClick={() => navigate(`/cafe/${visit.cafe_id}`)}
                          className="w-30 h-30 p-1 rounded-2xl bg-[#372821] shadow-lg flex flex-col overflow-hidden border border-white/5 shrink-0 flex-none snap-start cursor-pointer hover:bg-[#493A33] transition-colors"
                        >
                            <div className="h-full w-full flex items-center justify-center relative">
                                {visit.cafe.image_url ? (
                                    <img src={visit.cafe.image_url} alt={visit.cafe.nombre} className="w-full h-full rounded-2xl object-cover" />
                                ) : (
                                    <Coffee className="text-[#E6DAC1]/30" size={32} />
                                )}
                            </div>
                            <div className="hidden h-1/3 p-3 flex flex-col justify-center">
                                <p className="text-[#E6DAC1] font-bold text-sm truncate">{visit.cafe.nombre}</p>
                            </div>
                        </div>
                    )) : (
                        <div className="w-[80vw] h-32 flex flex-col items-center justify-center border-2 border-dashed border-[#372821] rounded-3xl shrink-0 flex-none">
                            <span className="text-[#E6DAC1]/50 font-bold text-sm">Aún no has visitado cafeterías</span>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* CONTADORES (Grid 2x2) */}
        <div className="px-6 mt-6 pb-10">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#372821] rounded-3xl p-5 flex flex-col items-center justify-center shadow-lg border border-white/5 cursor-pointer hover:bg-[#493A33] transition-colors">
                    <Heart className="text-red-400 mb-2" size={28} />
                    <span className="text-2xl font-black text-[#E6DAC1]">{profile.stats.favorites}</span>
                    <span className="text-xs text-[#E6DAC1]/50 font-bold uppercase tracking-widest mt-1">Favoritos</span>
                </div>
                
                <div className="bg-[#372821] rounded-3xl p-5 flex flex-col items-center justify-center shadow-lg border border-white/5 cursor-pointer hover:bg-[#493A33] transition-colors">
                    <Star className="text-yellow-400 mb-2" size={28} />
                    <span className="text-2xl font-black text-[#E6DAC1]">{profile.stats.reviews}</span>
                    <span className="text-xs text-[#E6DAC1]/50 font-bold uppercase tracking-widest mt-1">Reviews</span>
                </div>

                <div className="bg-[#372821] rounded-3xl p-5 flex flex-col items-center justify-center shadow-lg border border-white/5 cursor-pointer hover:bg-[#493A33] transition-colors">
                    <Coffee className="text-orange-300 mb-2" size={28} />
                    <span className="text-2xl font-black text-[#E6DAC1]">{profile.stats.waiting_list}</span>
                    <span className="text-xs text-[#E6DAC1]/50 font-bold uppercase tracking-widest mt-1">Por visitar</span>
                </div>

                <div className="bg-[#372821] rounded-3xl p-5 flex flex-col items-center justify-center shadow-lg border border-white/5 cursor-pointer hover:bg-[#493A33] transition-colors">
                    <span className="font-lancelot text-3xl font-bold text-blue-400 mb-1">R</span>
                    <span className="text-2xl font-black text-[#E6DAC1]">{profile.stats.rateds}</span>
                    <span className="text-xs text-[#E6DAC1]/50 font-bold uppercase tracking-widest mt-1">Clasificados</span>
                </div>
            </div>
        </div>
      </section>

      {/* Navegacion bottom para poder volver al mapa u otras secciones sin usar la flecha */}
      <BottomNav />

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
      `}</style>
    </main>
  );
}

export default ProfilePage;