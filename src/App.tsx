import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Download, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CanvasScene from './components/CanvasScene';
import { generateStory } from './lib/storyGenerator';
import { generateImagePrompt } from './lib/aiHooks';
import { initAudio, playPianoNote, playChord } from './lib/piano';

export default function App() {
  const isNightMode = false;
  const [story, setStory] = useState('');
  const [bgUrl, setBgUrl] = useState('');
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [triggerSnapshot, setTriggerSnapshot] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const isSoundEnabledRef = useRef(isSoundEnabled);
  useEffect(() => {
    isSoundEnabledRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

  const generateNewScene = useCallback(async () => {
    setIsGenerating(true);
    
    if (isSoundEnabledRef.current) {
      initAudio();
      playChord();
    }

    // Generate new story
    const newStory = generateStory();
    setStory(newStory);
    localStorage.setItem('lastStory', newStory);

    // Generate new background image based on story
    const newBg = await generateImagePrompt(newStory);
    setBgUrl(newBg);
    
    setIsGenerating(false);
  }, []);

  useEffect(() => {
    // Initial load
    const savedStory = localStorage.getItem('lastStory');
    if (savedStory) {
      setStory(savedStory);
      // Just use a random seed for initial load if we have a story
      setBgUrl(`https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/1920/1080`);
    } else {
      generateNewScene();
    }
  }, [generateNewScene]);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (!isSoundEnabledRef.current) return;
      
      // Don't play single notes if clicking on interactive buttons or settings panel
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('.settings-panel')) return;

      initAudio();
      // Pass the Y ratio (0 to 1) to determine pitch (higher on screen = higher pitch)
      const yRatio = e.clientY / window.innerHeight;
      playPianoNote(yRatio);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const toggleSound = () => {
    if (!isSoundEnabled) {
      initAudio();
      playChord();
    }
    setIsSoundEnabled(!isSoundEnabled);
  };

  const handleSnapshot = (dataUrl: string) => {
    const link = document.createElement('a');
    link.download = `anime-scene-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    setTriggerSnapshot(false);
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-1000 text-slate-800`}>
      <CanvasScene 
        bgUrl={bgUrl} 
        isNightMode={isNightMode} 
        triggerSnapshot={triggerSnapshot}
        onSnapshotReady={handleSnapshot}
      />

      {/* UI Overlay */}
      <div className="relative z-10 flex flex-col justify-between min-h-screen p-8 pointer-events-none">
        
        {/* Header */}
        <header className="flex justify-end items-start">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex gap-4 pointer-events-auto"
          >
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleSound}
              className="p-3 rounded-full bg-black/5 backdrop-blur-md border border-black/10 hover:bg-black/10 transition-colors"
              title="Toggle Audio"
            >
              {isSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </motion.button>
          </motion.div>
        </header>

        {/* Main Content (Story) */}
        <main className="max-w-xl mx-auto text-center pointer-events-auto mt-auto mb-12">
          <div className="px-6 py-4">
            <AnimatePresence mode="wait">
              <motion.p 
                key={story}
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                className="text-base md:text-lg font-serif font-semibold leading-snug tracking-normal italic select-none opacity-100 drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]"
              >
                "{story}"
              </motion.p>
            </AnimatePresence>
          </div>
        </main>

        {/* Footer Controls */}
        <motion.footer 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="flex justify-center gap-6 pointer-events-auto"
        >
          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: "rgba(0,0,0,0.1)" }}
            whileTap={{ scale: 0.95 }}
            onClick={generateNewScene}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-black/5 backdrop-blur-md border border-black/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span className="tracking-wider uppercase text-sm">Generate</span>
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: "rgba(0,0,0,0.1)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTriggerSnapshot(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-black/5 backdrop-blur-md border border-black/10 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span className="tracking-wider uppercase text-sm">Snapshot</span>
          </motion.button>
        </motion.footer>
      </div>

      {/* Easter Egg: Hidden text for designers */}
      <div className="fixed bottom-2 right-2 text-[10px] opacity-20 pointer-events-none font-mono">
        // AI-Ready Hooks Active. Awaiting LLM integration.
      </div>
    </div>
  );
}
