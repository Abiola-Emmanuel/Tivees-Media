'use client';

import { movies } from '@/data/movies';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { FaPlay, FaPlus, FaVolumeHigh } from 'react-icons/fa6';
import { AiOutlineLike } from "react-icons/ai";
import { MdAirplay } from "react-icons/md";
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import FreeTrial from '@/components/FreeTrial';
import { CiCalendar } from "react-icons/ci";
import { MdOutlineTranslate } from "react-icons/md";
import Footer from '@/components/Footer';

export default function MoviePage() {
  const params = useParams();
  const router = useRouter();
  const movie = movies.find((m) => m.id === params.id);

  if (!movie) {
    return <div className='text-white'>Movie not found</div>
  }

  const textVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <>

      <div className="relative w-full min-h-screen bg-black text-white">

        <Navbar />

        <button
          onClick={() => router.back()}
          className="absolute top-20 left-6 z-20  cursor-pointer transition"
        >
          ← Back
        </button>

        <div className="relative w-full h-screen">

          <Image
            src={movie.backdrop}
            alt={movie.title}
            fill
            className="object-cover brightness-50"
            priority
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

          <motion.div
            initial="hidden"
            animate="visible"
            variants={textVariants}
            className="absolute bottom-10 left-0 right-0 px-6 md:px-12"
          >
            <div className="max-w-3xl">

              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                {movie.title}
              </h1>

              <div className="flex gap-4 text-sm text-gray-300 mb-4">
                <span>{movie.year}</span>
                <span>•</span>
                <span>{movie.duration}</span>
                <span>•</span>
                <span className="capitalize">{movie.genre}</span>
              </div>

              <p className="text-gray-300 mb-6 max-w-xl">
                {movie.description}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg flex items-center gap-2">
                  <FaPlay />
                  Play Now
                </button>
                <button
                  onClick={() => router.push(`/watchparty?movieId=${movie.id}`)}
                  className="bg-white text-black hover:bg-white/80 px-6 py-3 rounded-lg flex items-center gap-2">
                  <MdAirplay />
                  Create Watch Party
                </button>

                <button className="bg-white/10 p-3 rounded-lg hover:bg-white/20">
                  <FaPlus />
                </button>

                <button className="bg-white/10 p-3 rounded-lg hover:bg-white/20">
                  <AiOutlineLike />
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 bg-[#141414] text-white font-sans grid grid-cols-1 md:grid-cols-12 gap-8">

        <div className="md:col-span-8 space-y-8">

          <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 md:p-10">
            <h3 className="text-gray-400 font-medium mb-4">Description</h3>
            <p className="text-lg leading-relaxed">
              {movie.description}
            </p>
          </div>

          <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 md:p-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-gray-400 font-medium">Cast</h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              <div className="flex-shrink-0 relative w-24 h-24 rounded-xl overflow-hidden border border-white/5 italic text-[10px] flex items-center justify-center text-gray-500">
                <Image
                  src={movie.cast1}
                  fill
                  alt="Cast 1"
                  className="object-cover"
                />
              </div>
              <div className="flex-shrink-0 relative w-24 h-24 rounded-xl overflow-hidden border border-white/5 italic text-[10px] flex items-center justify-center text-gray-500">
                <Image
                  src={movie.cast2}
                  fill
                  alt="Cast 2"
                  className="object-cover"
                />
              </div>
              <div className="flex-shrink-0 relative w-24 h-24 rounded-xl overflow-hidden border border-white/5 italic text-[10px] flex items-center justify-center text-gray-500">
                <Image
                  src={movie.cast3}
                  fill
                  alt="Cast 3"
                  className="object-cover"
                />
              </div>
              <div className="flex-shrink-0 relative w-24 h-24 rounded-xl overflow-hidden border border-white/5 italic text-[10px] flex items-center justify-center text-gray-500">
                <Image
                  src={movie.cast4}
                  fill
                  alt="Cast 4"
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 md:p-10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-gray-400 font-medium">Reviews</h3>
              <button className="bg-[#1a1a1a] border border-white/10 px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-white/5 transition-all text-sm">
                <span>+</span> Add Your Review
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Aniket Roy</p>
                    <p className="text-gray-500 text-xs">From India</p>
                  </div>
                  <div className="bg-[#1a1a1a] border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1">
                    <span className="text-red-600 text-xs">★★★★☆</span>
                    <span className="text-xs">4.5</span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  This movie was recommended to me by a very dear friend who went for the movie by herself. I went to the cinemas to watch but had a houseful board so couldn't watch it.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-4 bg-[#0f0f0f] border border-white/10 rounded-2xl p-8 space-y-10 h-fit">

          <section>
            <p className="text-gray-500 flex items-center gap-2 mb-2 text-sm">
              <CiCalendar /> Released Year</p>
            <p className="text-xl font-semibold">{movie.year}</p>
          </section>

          <section>
            <p className="text-gray-500 flex items-center gap-2 mb-3 text-sm">
              <MdOutlineTranslate /> Available Language</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-4 py-2 bg-[#141414] border border-white/10 rounded-lg text-sm">{movie.language}</span>
            </div>
          </section>

          <section>
            <p className="text-gray-500 flex items-center gap-2 mb-3 text-sm"><span className="opacity-50 italic">★</span> Ratings</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#141414] border border-white/10 p-4 rounded-xl">
                <p className="text-sm font-medium mb-2">IMDb</p>
                <div className="flex items-center gap-2">
                  <span className="text-red-600">★★★★☆</span>
                  <span className="text-sm">4.5</span>
                </div>
              </div>
              <div className="bg-[#141414] border border-white/10 p-4 rounded-xl">
                <p className="text-sm font-medium mb-2">StreamVibe</p>
                <div className="flex items-center gap-2">
                  <span className="text-red-600">★★★★☆</span>
                  <span className="text-sm">4</span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <p className="text-gray-500 flex items-center gap-2 mb-3 text-sm">Genres</p>
            <div className="flex gap-2">
              <span className="px-4 py-2 bg-[#141414] border border-white/10 rounded-lg text-sm">{movie.genre}</span>
            </div>
          </section>

          <section className="space-y-6">
            <div>
              <p className="text-gray-500 text-sm mb-3">Director</p>
              <div className="bg-[#141414] border border-white/10 p-3 rounded-xl flex items-center gap-3">
                <div className="relative w-12 h-12 bg-gray-700 rounded-lg flex-shrink-0 overflow-hidden">
                  <Image
                    src={movie.director1}
                    fill
                    alt="Director"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">{movie.director1Name}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-3">Music</p>
              <div className="bg-[#141414] border border-white/10 p-3 rounded-xl flex items-center gap-3">
                <div className="relative w-12 h-12 bg-gray-700 rounded-lg flex-shrink-0 overflow-hidden">
                  <Image
                    src={movie.director2}
                    fill
                    alt="Director"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">{movie.director2Name}</p>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>

      <FreeTrial />

      <Footer />

    </>

  );
}
