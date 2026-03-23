"use client";

import MovieRow from "@/components/MovieRow";
import Navbar from "@/components/Navbar";
import { FaPlay, FaCircleInfo, FaPlus } from "react-icons/fa6";
import { motion } from "framer-motion";
import { movies } from "@/data/movies";
import FreeTrial from "@/components/FreeTrial";
import Footer from "@/components/Footer";

export default function DramaCategoryPage() {
  const dramaMovies = movies.filter((movie) => movie.genre === "drama");

  return (
    <main className="min-h-screen bg-[#141414]">
      <Navbar />

      <section className="relative h-screen w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{ backgroundImage: `url('/drama-bg.jpg')` }}
        />

        <div className="absolute inset-0 bg-[#a5191922] bg-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />

        <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-16 max-w-3xl space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              Featured Category
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mt-4">
              DRAMA
            </h1>
            <p className="text-gray-300 text-lg mt-4 leading-relaxed">
              Emotional storytelling, powerful performances, and compelling narratives.
              Explore the best of Drama cinema on TiveesMedia.
            </p>

          </motion.div>
        </div>
      </section>

      <div className="pb-20 -mt-20 relative z-20">
        <MovieRow title="Trending Dramas" movies={dramaMovies} />

        <div className="mt-8">
          <MovieRow title="Award-Winning Dramas" movies={[...dramaMovies].reverse()} />
        </div>

        <div className="mt-8 px-6 md:px-16">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="text-2xl font-bold text-white">Not finding what you want?</h3>
              <p className="text-gray-400">Request a drama movie and we'll add it to the library.</p>
            </div>
            <button className="bg-[#e50000] text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
              Request Movie
            </button>
          </div>
        </div>

        <div className="mt-8">
          <MovieRow title="Classic Dramas" movies={dramaMovies} />
        </div>
      </div>

      <FreeTrial />

      <Footer />
    </main>
  );
}