import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, ContactShadows, Loader } from '@react-three/drei';
import * as THREE from 'three';
import BatuSerembanModel from '../components/BatuSerembanModel';
import { useLanguage } from '../context/LanguageContext';

const BATIK_PATHS = [
    "/textures/batik1.jpg", 
    "/textures/batik2.jpg", 
    "/textures/batik3.jpg", 
    "/textures/batik4.jpg", 
    "/textures/batik5.jpg", 
    "/textures/batik6.jpg", 
    "/textures/batik7.jpg", 
];

const HeroScene = () => {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.getElapsedTime() * 0.1; 
    }
  });

  const GLOBAL_SCALE = 0.5; 

  return (
    <group ref={group}>
      <BatuSerembanModel position={[0, 0, 0]} rotation={[0, Math.PI / 4, 0]} texturePath={BATIK_PATHS[0]} scale={GLOBAL_SCALE * 1.4} fallbackColor="#ea580c" />
      <BatuSerembanModel position={[2.2, 1.2, 0]} rotation={[1, 1, 0]} texturePath={BATIK_PATHS[1]} scale={GLOBAL_SCALE} fallbackColor="#06b6d4" />
      <BatuSerembanModel position={[-2.2, -1.2, 0]} rotation={[0, 1, 1]} texturePath={BATIK_PATHS[2]} scale={GLOBAL_SCALE} fallbackColor="#d946ef" />
      <BatuSerembanModel position={[0, 2.2, 1.2]} rotation={[1, 0, 1]} texturePath={BATIK_PATHS[3]} scale={GLOBAL_SCALE} fallbackColor="#facc15" />
      <BatuSerembanModel position={[0, -2.2, -1.2]} rotation={[1, 1, 1]} texturePath={BATIK_PATHS[4]} scale={GLOBAL_SCALE} fallbackColor="#84cc16" />
      <BatuSerembanModel position={[1.5, -0.5, 1.8]} rotation={[0, 0, 1]} texturePath={BATIK_PATHS[5]} scale={GLOBAL_SCALE * 0.8} fallbackColor="#3b82f6" />
      <BatuSerembanModel position={[-1.5, 0.5, -1.8]} rotation={[1, 0, 0]} texturePath={BATIK_PATHS[6]} scale={GLOBAL_SCALE * 0.8} fallbackColor="#ef4444" />
    </group>
  );
};

interface HomeProps {
  onStart: () => void;
}

const Home: React.FC<HomeProps> = ({ onStart }) => {
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { t, lang } = useLanguage();

  // --- NEW: Force Voice Selection Logic ---
  const handleSpeak = () => {
    // 1. Cancel any current speech
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const text = t('home_desc'); 
    const utterance = new SpeechSynthesisUtterance(text);
    
    // 2. Get all available voices on the device
    const voices = window.speechSynthesis.getVoices();

    if (lang === 'bm') {
        utterance.lang = 'ms-MY';
        
        // Strategy: 
        // 1. Try to find an exact Malay voice (ms-MY)
        // 2. If not found, try Indonesian (id-ID) because it sounds 99% like Malay and is more common on Android/Windows
        const specificVoice = voices.find(v => v.lang === 'ms-MY' || v.lang === 'ms_MY') 
                           || voices.find(v => v.lang === 'id-ID' || v.lang === 'id_ID');
        
        if (specificVoice) {
            utterance.voice = specificVoice;
        }
    } else {
        utterance.lang = 'en-US';
        // Optional: Prefer a standard English voice if you want
        const engVoice = voices.find(v => v.lang === 'en-US');
        if (engVoice) utterance.voice = engVoice;
    }

    utterance.rate = 0.9; 
    utterance.onend = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Ensure voices are loaded (Chrome sometimes loads them asynchronously)
  useEffect(() => {
    window.speechSynthesis.getVoices();
    return () => window.speechSynthesis.cancel();
  }, []);

  return (
    <div className="min-h-screen bg-heritage-black text-white relative flex flex-col">
      <div className="h-24"></div>
      <section className="flex-1 flex flex-col md:flex-row items-center justify-center px-8 md:px-24 gap-12 md:gap-0 pb-32">
        <div className="relative z-10 w-full md:w-1/2 text-center md:text-left mt-10 md:mt-0 order-1 md:order-1">
          <div className="inline-block border border-heritage-orange px-4 py-1 rounded-full text-heritage-orange text-xs font-bold tracking-widest mb-6 uppercase animate-pulse">
            {t('home_subtitle')}
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-heritage-cream mb-6 leading-tight drop-shadow-lg">
            {t('home_title_1')} <br/><span className="text-heritage-orange">{t('home_title_2')}</span>
          </h1>
          <p className="text-lg text-heritage-gray mb-8 font-light max-w-lg mx-auto md:mx-0 drop-shadow-md">
            {t('home_desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <button onClick={onStart} className="bg-heritage-orange hover:bg-orange-700 text-white px-8 py-4 transition-all duration-300 font-bold tracking-wider uppercase shadow-lg flex items-center justify-center gap-2 cursor-pointer z-50 relative">
              <span>{t('home_btn_start')}</span>
            </button>
            <button onClick={() => setShowHistoryModal(true)} className="bg-zinc-800/50 hover:bg-zinc-700 border border-white/10 text-white px-8 py-4 transition-all duration-300 font-bold tracking-wider uppercase backdrop-blur-sm cursor-pointer z-50 relative">
              {t('home_btn_history')}
            </button>
          </div>
        </div>

        <div className="w-full md:w-1/2 h-[500px] md:h-[80vh] relative z-0 mt-8 md:mt-0 order-2 md:order-2">
            <Canvas shadows camera={{ position: [0, 0, 8], fov: 45 }}>
                <ambientLight intensity={3.0} /> 
                <spotLight position={[10, 10, 10]} angle={0.2} penumbra={1} intensity={2.0} />
                <pointLight position={[-10, -5, -5]} color="#ffffff" intensity={1} /> 
                
                <Suspense fallback={null}>
                   <HeroScene />
                </Suspense>
                
                <ContactShadows resolution={512} scale={20} blur={2} opacity={0.4} far={10} color="#000000" />
                <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
                <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
            </Canvas>
            <Loader />
        </div>
      </section>

      <div className="fixed bottom-0 left-0 w-full bg-heritage-dark/90 backdrop-blur-md border-t border-heritage-orange/20 p-4 z-40 flex items-center justify-between md:justify-center gap-4">
         <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-heritage-gray'}`}></div>
            <span className="text-sm font-serif text-heritage-cream">{t('home_audio_text')}</span>
         </div>
         <button onClick={handleSpeak} className="flex items-center gap-2 bg-heritage-orange/20 text-heritage-orange border border-heritage-orange/50 px-4 py-2 rounded-full hover:bg-heritage-orange hover:text-white transition-all text-xs font-bold uppercase tracking-wide cursor-pointer">
            {isSpeaking ? t('home_audio_stop') : t('home_audio_listen')}
         </button>
      </div>

      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-heritage-dark border border-heritage-orange/30 p-8 max-w-2xl w-full rounded-2xl relative shadow-2xl max-h-[80vh] overflow-y-auto">
                <button onClick={() => setShowHistoryModal(false)} className="absolute top-4 right-4 text-heritage-gray hover:text-white transition-colors cursor-pointer">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <h2 className="text-3xl font-serif text-heritage-orange mb-6">{t('hist_title')}</h2>
                <div className="space-y-6 text-heritage-cream leading-relaxed">
                    <div><p>{t('hist_intro')}</p></div>
                    
                    <div>
                        <h3 className="text-lg font-bold text-white mb-2">{t('hist_section_1')}</h3>
                        <ul className="list-none space-y-1 text-heritage-gray">
                            <li>• {t('hist_p1_ancient')}</li>
                            <li>• {t('hist_p1_historical')}</li>
                            <li>• {t('hist_p1_modern')}</li>
                        </ul>
                    </div>

                    <div className="bg-heritage-orange/10 p-4 rounded-r-lg border-l-4 border-heritage-orange">
                        <h3 className="text-lg font-bold text-white mb-2">{t('hist_section_sewing')}</h3>
                        <p className="text-heritage-gray text-sm italic">{t('hist_p_sewing')}</p>
                    </div>

                    <div className="mt-4 border-t border-white/10 pt-4">
                        <h3 className="text-lg font-bold text-heritage-gold mb-2">{t('hist_section_2')}</h3>
                        <p className="text-sm text-heritage-gray leading-relaxed">{t('hist_p2')}</p>
                    </div>
                </div>
                <div className="mt-8 flex justify-end">
                    <button onClick={() => setShowHistoryModal(false)} className="px-6 py-2 bg-heritage-orange text-white font-bold rounded hover:bg-orange-700 transition-colors cursor-pointer">{t('hist_close')}</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Home;