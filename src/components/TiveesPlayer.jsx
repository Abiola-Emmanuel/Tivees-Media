import React from 'react';
import { useRouter } from 'next/navigation';
import { MdClose } from 'react-icons/md';

const TiveesPlayer = ({ movie }) => {
  const router = useRouter();


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
            onClick={() => router.back()}
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
      </div>
    </div>
  );
};

export default TiveesPlayer;
