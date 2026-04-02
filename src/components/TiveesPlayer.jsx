import React, { useState } from 'react';
import { MdClose, MdShare, MdPerson, MdMessage } from 'react-icons/md';
import AttendeesPanel from './AttendesPanel';
import { useRouter } from 'next/navigation';
import CommentsPanel from './CommentsPanel';

const TiveesPlayer = ({ movie }) => {
  const router = useRouter();
  const [activePanel, setActivePanel] = useState(null);

  // Detailed debugging
  console.log("========== TIVEESPLAYER DEBUG ==========");
  console.log("Full movie object:", movie);
  console.log("Movie keys:", movie ? Object.keys(movie) : "No movie object");
  console.log("movie.uid:", movie?.uid);
  console.log("movie.videoUid:", movie?.videoUid);
  console.log("movie.cfid:", movie?.cfid);
  console.log("movie.streamEmbedUrl:", movie?.streamEmbedUrl);
  console.log("movie.iframeUrl:", movie?.iframeUrl);
  console.log("movie.embedUrl:", movie?.embedUrl);
  console.log("========================================");

  const videoUid = movie?.uid || movie?.videoUid || movie?.cfid || '';
  const iframeUrl = videoUid
    ? `https://iframe.videodelivery.net/${videoUid}?controls=true`
    : '';

  console.log("[TiveesPlayer] Selected Video UID:", videoUid);
  console.log("[TiveesPlayer] Iframe URL:", iframeUrl);

  return (
    <div className="relative w-full h-screen bg-black flex overflow-hidden font-sans text-white">

      <button
        onClick={() => router.back()}
        className="absolute top-6 left-6 z-20 cursor-pointer transition text-white hover:opacity-70"
      >
        ← Back
      </button>

      <div className="relative flex-1 flex flex-col justify-between p-6">
        <div className="flex justify-between items-start z-10">
          <div className="invisible" />
          <h2 className="text-sm font-medium opacity-80 uppercase tracking-widest text-center">
            {movie?.title || 'Loading...'}
          </h2>
          <button
            onClick={() => setActivePanel(null)}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
            <MdClose size={20} />
          </button>
        </div>

        {/* Video Player Container */}
        <div className="absolute inset-0 flex items-center justify-center z-0">
          {iframeUrl ? (
            <iframe
              src={iframeUrl}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
              allowFullScreen
              frameBorder="0"
              width="100%"
              height="100%"
              className="absolute inset-0"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black text-white/70">
              Video unavailable for this movie.
            </div>
          )}
        </div>

        <div className="z-10 flex flex-col gap-6">
          <div className="flex items-center gap-4">

            <div className="flex-1 flex flex-col items-end gap-5">
              <button className="p-2 hover:bg-white/10 rounded-lg transition"><MdShare size={22} /></button>

              <button
                onClick={() => setActivePanel(activePanel === 'attendees' ? null : 'attendees')}
                className="relative group p-2 hover:bg-white/10 rounded-lg transition"
              >
                <MdPerson size={22} />
                <span className="absolute -top-1 -right-1 bg-[#e50000] text-[10px] font-bold px-1.5 py-0.5 rounded-full">12</span>
              </button>

              <button
                onClick={() => setActivePanel(activePanel === 'comments' ? null : 'comments')}
                className="relative group p-2 hover:bg-white/10 rounded-lg transition"
              >
                <MdMessage size={22} />
                <span className="absolute -top-1 -right-1 bg-[#e50000] text-[10px] font-bold px-1.5 py-0.5 rounded-full">33</span>
              </button>
            </div>
          </div>
          {/* 
          <div className="flex items-center gap-4">
            <div className="flex-1 h-1.5 bg-white/30 rounded-full relative cursor-pointer group">
              <div className="absolute top-0 left-0 h-full w-[60%] bg-[#e50000] rounded-full" />
              <div className="absolute top-1/2 left-[60%] -translate-y-1/2 w-4 h-4 bg-[#e50000] rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform" />
            </div>
            <span className="text-xs font-mono opacity-60">0:00</span>
          </div> */}
        </div>
      </div>

      {activePanel && (
        <div className="w-80 h-full bg-black border-l border-white/10 flex flex-col animate-in slide-in-from-right duration-300">
          {activePanel === 'comments' ? <CommentsPanel /> : <AttendeesPanel />}
        </div>
      )}
    </div>
  );
};

export default TiveesPlayer;
