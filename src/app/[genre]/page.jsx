"use client";

import { useState, useEffect, use } from "react";
import axios from "axios";
import MovieRow from "@/components/MovieRow";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";


export default function GenrePage({ params }) {
  const { genre } = use(params);
  const [movies, setMovies] = useState([]);
  const [genreName, setGenreName] = useState("");
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

          if (category) {
            setGenreName(category.genre);
            setMovies(category.movies);
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
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{ backgroundImage: `url('/action-bg.jpg')` }}
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
              {genreName.toUpperCase()}
            </h1>
            <p className="text-gray-300 text-lg mt-4 leading-relaxed">
              Explore the best of {genreName} cinema on TiveesMedia.
            </p>

          </motion.div>
        </div>
      </section>
      <div className="pb-20 -mt-20 relative z-20">
        <MovieRow title={`${genreName} Movies`} movies={movies} />
      </div>

      <Footer />
    </main>
  );
}