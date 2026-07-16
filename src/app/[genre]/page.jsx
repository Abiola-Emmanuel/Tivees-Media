"use client";

import { useState, useEffect, use } from "react";
import axios from "axios";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";


export default function GenrePage({ params }) {
  const { genre } = use(params);
  const router = useRouter();
  const [movies, setMovies] = useState([]);
  const [genreName, setGenreName] = useState("");
  const [backgroundImage, setBackgroundImage] = useState("");
  const [loading, setLoading] = useState(true);
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    const fetchMoviesByGenre = async () => {
      try {
        const authToken = localStorage.getItem("authToken");
        const response = await axios.get(
          `${url}/api/v1/users/users-moviesGenre`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          }
        );

        if (response.data.status === "SUCCESS") {
          const genreFormatted = genre
            .split("-")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          const category = response.data.categories.find(
            (cat) => cat.genre.toLowerCase() === genreFormatted.toLowerCase()
          );

          if (category && category.movies.length > 0) {
            setGenreName(category.genre);
            setMovies(category.movies);

            const randomMovie = category.movies[Math.floor(Math.random() * category.movies.length)];
            setBackgroundImage(randomMovie.posterUrl || randomMovie.backdrop);
          }
        }
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMoviesByGenre();
  }, [genre, url]);

  if (loading) return <div>Loading...</div>;

  return (
    <main className="min-h-screen bg-[#141414]">
      <Navbar />

      <section className="relative h-screen w-full overflow-hidden">
        {backgroundImage && (
          <Image
            src={backgroundImage}
            alt={genreName}
            fill
            priority
            className="object-cover brightness-75"
            sizes="100vw"
            quality={90}
          />
        )}

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
              {genreName.toUpperCase()}
            </h1>
            <p className="text-gray-300 text-lg mt-4 leading-relaxed">
              Explore the best of {genreName} cinema on TiveesMedia.
            </p>

          </motion.div>
        </div>
      </section>
      <div className="pb-20 -mt-20 relative z-20 w-[95%] mx-auto">
        <section className="w-full px-2 sm:px-4 md:px-6 py-5">
          <h2 className="text-white text-xl md:text-2xl font-semibold mb-6">
            {genreName} Movies
          </h2>

          {movies.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-8 text-center text-gray-400">
              No movies found for this genre.
            </div>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.1 }}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.5,
                    staggerChildren: 0.05
                  }
                }
              }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6"
            >
              {movies.map((movie) => {
                const movieId = movie._id || movie.id;

                return (
                  <motion.div
                    key={movieId}
                    variants={{
                      hidden: { opacity: 0, scale: 0.95 },
                      visible: { opacity: 1, scale: 1 }
                    }}
                    whileHover={{ y: -8 }}
                    onClick={() => router.push(`/movies/${movieId}`)}
                    className="cursor-pointer group"
                  >
                    <div className="relative w-full h-36 rounded-xl overflow-hidden bg-white/5">
                      <Image
                        src={movie.posterUrl || movie.poster || movie.backdrop || "/hero1.png"}
                        alt={movie.title || "Movie poster"}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-70" />

                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-white text-sm md:text-base font-semibold line-clamp-2">
                          {movie.title}
                        </h3>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </section>
      </div>

      <Footer />
    </main>
  );
}
