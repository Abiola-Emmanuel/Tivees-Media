'use client';

import { useState, useEffect, use, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { FaPlay } from 'react-icons/fa6';
import { AiFillLike, AiOutlineLike } from "react-icons/ai";
import { MdAirplay, MdCheckCircle, MdError } from "react-icons/md";
import { AiOutlineStar, AiFillStar } from 'react-icons/ai';
import Navbar from '@/components/Navbar';
import FreeTrial from '@/components/FreeTrial';
import { CiCalendar } from "react-icons/ci";
import { BiComment, BiSend, BiSmile, BiImage } from 'react-icons/bi';
import { MdOutlineTranslate } from "react-icons/md";
import Footer from '@/components/Footer';

export default function MoviePage({ params }) {
  const { id } = use(params);
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isStartingWatch, setIsStartingWatch] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(null);
  const [likeNotification, setLikeNotification] = useState(null);
  const likeNotificationTimeoutRef = useRef(null);
  const router = useRouter();
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const authToken = localStorage.getItem("authToken");
        const response = await axios.get(
          `${url}/api/v1/users/movies/${id}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          }
        );

        console.log("Movie details response:", response);

        if (response.data.status === "SUCCESS") {
          setMovie(response.data.movie);
          const initialLikesCount =
            response.data.movie?.likesCount ??
            response.data.movie?.likes?.length ??
            response.data.movie?.likes;

          if (typeof initialLikesCount === 'number') {
            setLikesCount(initialLikesCount);
          }
        }



      } catch (err) {
        console.error("Movie details error response:", {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          url: err.config?.url,
          method: err.config?.method,
        });
        setError(
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to load movie details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMovieDetails();
    }
  }, [id, url]);

  useEffect(() => {
    const fetchReviews = async () => {
      const authToken = localStorage.getItem("authToken");
      try {
        const reviewsResponse = await axios.get(
          `${url}/api/v1/users/getReviews/${id}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          }
        );

        if (reviewsResponse.data.status === "SUCCESS") {
          setReviews(reviewsResponse.data.reviews);
        }
      } catch (reviewErr) {
        console.log("Reviews endpoint not available");
        setReviews([]);
      }
    }

    fetchReviews();
  }, [id, url]);

  useEffect(() => {
    return () => {
      if (likeNotificationTimeoutRef.current) {
        window.clearTimeout(likeNotificationTimeoutRef.current);
      }
    };
  }, []);

  const showLikeNotification = (message, type = 'success') => {
    if (likeNotificationTimeoutRef.current) {
      window.clearTimeout(likeNotificationTimeoutRef.current);
    }

    setLikeNotification({ message, type });
    likeNotificationTimeoutRef.current = window.setTimeout(() => {
      setLikeNotification(null);
    }, 3500);
  };

  const handleLikeMovie = async () => {
    if (!movie?._id || isLiking) {
      return;
    }

    const authToken = localStorage.getItem("authToken");
    const userString = localStorage.getItem("user");
    const user = userString ? JSON.parse(userString) : null;
    const userId = user?._id;

    if (!authToken || !userId) {
      showLikeNotification('Sign in to like movies.', 'error');
      router.push('/sign-in');
      return;
    }

    try {
      setIsLiking(true);

      const response = await axios.post(
        `${url}/api/v1/users/users-movieLike`,
        {
          movieId: movie._id,
          userId
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      if (response.data.status === 'SUCCESS') {
        setIsLiked(true);
        if (typeof response.data.likesCount === 'number') {
          setLikesCount(response.data.likesCount);
        }
        showLikeNotification('Movie liked!', 'success');
        return;
      }

      if (response.data.message === 'You have already liked this movie.') {
        setIsLiked(true);
        showLikeNotification('Already liked.', 'error');
        return;
      }

      showLikeNotification(response.data.message || 'Like failed.', 'error');
    } catch (err) {
      const apiMessage = err.response?.data?.message;

      if (apiMessage === 'You have already liked this movie.') {
        setIsLiked(true);
        showLikeNotification('Already liked.', 'error');
        return;
      }

      console.error('Error liking movie:', err);
      showLikeNotification(apiMessage || 'Like failed. Try again.', 'error');
    } finally {
      setIsLiking(false);
    }
  };

  const handleStartSoloWatch = async () => {
    if (!movie?._id || isStartingWatch) {
      return;
    }

    const authToken = localStorage.getItem("authToken");

    if (!authToken) {
      showLikeNotification('Sign in to watch movies.', 'error');
      router.push('/sign-in');
      return;
    }

    try {
      setIsStartingWatch(true);

      const sessionResponse = await axios.post(
        `${url}/api/v1/users/watch-session/start`,
        {
          movieId: movie._id,
          isPlaying: true
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      console.log('Solo watch session started:', sessionResponse.data);

      const sessionId = sessionResponse.data?.sessionId || sessionResponse.data?.session?.id;
      const sessionIdParam = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
      router.push(`/player-page/${movie._id}${sessionIdParam}`);
    } catch (err) {
      console.error('Error starting solo watch session:', err);
      showLikeNotification(err.response?.data?.message || 'Could not start movie. Try again.', 'error');
    } finally {
      setIsStartingWatch(false);
    }
  };

  const RatingStars = ({ rating, interactive = false, onRatingChange, onHover }) => {
    return (
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRatingChange?.(star)}
            onMouseEnter={() => interactive && onHover?.(star)}
            onMouseLeave={() => interactive && onHover?.(0)}
            className={`transition-all duration-200 ${interactive ? 'cursor-pointer transform hover:scale-110' : 'cursor-default'}`}
          >
            {(interactive ? hoverRating || rating : rating) >= star ? (
              <AiFillStar className="text-[#e50000] drop-shadow-glow" size={32} />
            ) : (
              <AiOutlineStar className="text-gray-500" size={32} />
            )}
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Navbar />
        <p className="text-white">Loading movie details...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <p>{error || 'Movie not found'}</p>
        </div>
      </div>
    );
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
        {likeNotification && (
          <div className="fixed right-4 top-6 z-50 w-fit max-w-[calc(100vw-2rem)] animate-in slide-in-from-top-3 fade-in duration-200">
            <div
              className={`flex min-w-52 items-center gap-3 rounded-xl border px-3 py-2.5 shadow-2xl backdrop-blur-md ${likeNotification.type === 'success'
                ? 'border-green-400/30 bg-black/85 text-green-100 shadow-green-950/30'
                : 'border-red-400/30 bg-black/85 text-red-100 shadow-red-950/30'
                }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${likeNotification.type === 'success'
                  ? 'bg-green-500/20 text-green-300'
                  : 'bg-red-500/20 text-red-300'
                  }`}
              >
                {likeNotification.type === 'success' ? <MdCheckCircle size={20} /> : <MdError size={20} />}
              </span>
              <p className="text-sm font-semibold leading-none">{likeNotification.message}</p>
            </div>
          </div>
        )}

        <Navbar />

        <button
          onClick={() => router.back()}
          className="absolute top-20 left-6 z-20  cursor-pointer transition"
        >
          ← Back
        </button>

        <div className="relative w-full h-screen">

          <Image
            src={movie.posterUrl}
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
                <span>{movie.releaseDate}</span>
                <span>•</span>
                <span>{movie.duration} min</span>
                <span>•</span>
                <span className="capitalize">{movie.genre}</span>
              </div>

              <p className="text-gray-300 mb-6 max-w-xl line-clamp-3">
                {movie.description.replace(/<[^>]*>/g, '')}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleStartSoloWatch}
                  disabled={isStartingWatch}
                  className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60">
                  <FaPlay />
                  {isStartingWatch ? 'Starting...' : 'Play Now'}
                </button>
                <button
                  onClick={() => router.push(`/watchparty/${movie._id}`)}
                  className="bg-white text-black hover:bg-white/80 px-6 py-3 rounded-lg flex items-center gap-2">
                  <MdAirplay />
                  Create Watch Party
                </button>

                <button
                  onClick={handleLikeMovie}
                  disabled={isLiking}
                  className={`flex items-center gap-2 rounded-lg p-3 transition disabled:cursor-not-allowed disabled:opacity-60 ${isLiked
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-white/10 hover:bg-white/20'
                    }`}
                  aria-label={isLiked ? 'Movie liked' : 'Like movie'}
                  title={isLiked ? 'Movie liked' : 'Like movie'}
                >
                  {isLiked ? <AiFillLike /> : <AiOutlineLike />}
                  {typeof likesCount === 'number' && (
                    <span className="text-sm font-medium">{likesCount}</span>
                  )}
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      </div>

      <div className="w-full  mx-auto p-4 md:p-8 bg-[#141414] text-white font-sans grid grid-cols-1 md:grid-cols-12 gap-8">

        <div className="md:col-span-8 space-y-8">

          <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 md:p-10">
            <h3 className="text-gray-400 font-medium mb-4">Description</h3>
            <p className="text-lg leading-relaxed">
              {movie.description.replace(/<[^>]*>/g, '')}
            </p>
          </div>

          <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 md:p-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-gray-400 font-medium">Information</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-gray-500 text-sm mb-2">Category</p>
                <p className="text-white">{movie.category}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-2">Duration</p>
                <p className="text-white">{movie.duration} minutes</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-2">Status</p>
                <p className="text-white capitalize">{movie.status}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 md:p-10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-gray-400 font-medium">Reviews</h3>
              <button
                onClick={() => router.push(`/review/${movie._id}`)}
                className="bg-[#1a1a1a] border border-white/10 px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-white/5 transition-all text-sm">
                <span>+</span> Add Your Review
              </button>

            </div>

            <div className="text-center max-h-66 overflow-y-auto py-8">
              {reviews.map((review, index) => (
                <div key={index} className="bg-[#0f0f0f] border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <RatingStars rating={review.rating} />
                      </div>
                      <p className="text-sm text-gray-500">
                        {review.user?.email || 'Anonymous'} • {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                  </div>
                  <p className="text-gray-300 leading-relaxed">{review.review}</p>
                </div>
              ))}

            </div>
          </div>
        </div>

        <div className="md:col-span-4 bg-[#0f0f0f] border border-white/10 rounded-2xl p-8 space-y-10 h-fit">

          <section>
            <p className="text-gray-500 flex items-center gap-2 mb-2 text-sm">
              <CiCalendar /> Released Year</p>
            <p className="text-xl font-semibold">{movie.releaseDate}</p>
          </section>

          <section>
            <p className="text-gray-500 flex items-center gap-2 mb-3 text-sm">
              <MdOutlineTranslate /> Duration</p>
            <p className="text-xl font-semibold">{movie.duration} min</p>
          </section>

          <section>
            <p className="text-gray-500 flex items-center gap-2 mb-3 text-sm">Genres</p>
            <div className="flex gap-2">
              <span className="px-4 py-2 bg-[#141414] border border-white/10 rounded-lg text-sm">{movie.genre}</span>
            </div>
          </section>

          <section>
            <p className="text-gray-500 flex items-center gap-2 mb-3 text-sm">Category</p>
            <div className="flex gap-2">
              <span className="px-4 py-2 bg-[#141414] border border-white/10 rounded-lg text-sm">{movie.category}</span>
            </div>
          </section>

          <section>
            <p className="text-gray-500 flex items-center gap-2 mb-3 text-sm">Status</p>
            <p className="text-white capitalize">{movie.status}</p>
          </section>

        </div>
      </div>

      <FreeTrial />

      <Footer />

    </>

  );
}
