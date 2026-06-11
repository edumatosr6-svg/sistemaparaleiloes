import { useState, useEffect } from 'react';
import { Maximize2, Volume2, VolumeX, Play, Settings, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LivePlayerProps {
  url?: string;
  isLive?: boolean;
  isStreamingActive?: boolean;
  isPlaying?: boolean;
}

export function LivePlayer({ 
  url, 
  isLive = true, 
  isStreamingActive = true,
  isPlaying: initialIsPlaying = true 
}: LivePlayerProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(initialIsPlaying);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    setIsPlaying(initialIsPlaying);
  }, [initialIsPlaying]);

  // Simple video ID extraction for YouTube
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && (match[2].length === 11 || match[2].length === 12)) ? match[2] : null;
  };

  const videoId = url ? getYoutubeId(url) : null;
  const sanitizedUrl = url && !url.startsWith('http') ? `https://${url}` : url;

  if (!isStreamingActive || !url) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-brand-950 via-brand-900 to-black p-8 text-center rounded-xl border border-brand-800 shadow-2xl min-h-[300px]">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-brand-500/20 blur-2xl rounded-full animate-pulse" />
          <div className="size-24 rounded-full border-4 border-brand-800/50 flex items-center justify-center relative bg-brand-950/50 backdrop-blur-md">
            <Play className="size-10 text-brand-500 fill-brand-500 ml-1" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-black text-white uppercase tracking-widest italic">Transmissão Offline</h3>
          <p className="text-brand-400 font-bold uppercase tracking-[0.3em] text-[10px] animate-pulse">
            {!url ? 'Aguardando início da transmissão...' : 'O leiloeiro pausou o sinal de vídeo'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video md:aspect-auto md:h-full bg-black rounded-xl overflow-hidden shadow-2xl group border border-brand-800">
      {videoId ? (
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=1&modestbranding=1&rel=0&playsinline=1&showinfo=0`}
          title="Live Stream"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : sanitizedUrl?.includes('.m3u8') ? (
        <video
          className="w-full h-full object-cover"
          src={sanitizedUrl}
          autoPlay
          muted={isMuted}
          controls
          playsInline
        />
      ) : (
        <video
          className="w-full h-full object-cover"
          src={sanitizedUrl}
          autoPlay={isPlaying}
          muted={isMuted}
          controls
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}

      {/* Unmute Overlay (For browsers that block autoplay with sound) */}
      {isMuted && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <Button
            variant="outline"
            className="pointer-events-auto bg-black/60 backdrop-blur-md border-white/20 text-white hover:bg-black/80 rounded-full px-6 py-2 flex items-center gap-2 animate-bounce"
            onClick={() => {
              setIsMuted(false);
              setHasInteracted(true);
            }}
          >
            <VolumeX className="size-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Ativar Som</span>
          </Button>
        </div>
      )}

      {/* Overlay Controls */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="size-5 fill-white" /> : <Play className="size-5 fill-white" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </Button>

            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-red-600 animate-pulse" />
              <span className="text-white text-xs font-bold uppercase tracking-wider">AO VIVO</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => {
              const el = document.querySelector('.aspect-video');
              if (el?.requestFullscreen) el.requestFullscreen();
            }}>
              <Maximize2 className="size-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Live Badge (Always visible) */}
      {isLive && (
        <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded flex items-center gap-1.5 shadow-lg z-20">
          <div className="size-1.5 rounded-full bg-white animate-pulse" />
          LIVE
        </div>
      )}
    </div>
  );
}
