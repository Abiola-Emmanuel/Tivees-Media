"use client"

import { useParams } from "next/navigation"
import Image from "next/image";
import FreeTrial from "@/components/FreeTrial";
import Footer from "@/components/Footer";
import { FaLink, FaVideo, FaUsers } from "react-icons/fa6";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import axios from "axios";

const WatchParty = () => {
  const params = useParams();
  const router = useRouter();
  const [partyName, setPartyName] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [partyId, setPartyId] = useState(null);
  const [cfid, setCfid] = useState(null);
  const [streamEmbedUrl, setStreamEmbedUrl] = useState(null);
  const [creatingParty, setCreatingParty] = useState(false);
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        const response = await axios.get(`${url}/api/v1/users/movies/${params.id}`, {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        });

        if (response.data.status === 'SUCCESS') {
          console.log(response);
          setMovie(response.data.movie);

        } else {
          setError('Movie not found');
        }
      } catch (err) {
        console.error('Error fetching movie details:', err);
        setError('Failed to load movie details');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchMovieDetails();
    }
  }, [params.id, url]);

  const handleCopyLink = () => {
    if (partyId && cfid) {
      const userString = localStorage.getItem('user');
      const user = userString ? JSON.parse(userString) : null;
      const userId = user?._id;
      const shareUrl = `${window.location.origin}/watchparty/play?partyId=${partyId}&cfid=${cfid}&userId=${userId}`;
      navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } else {
      alert('Please create a watch party first');
    }
  };

  const handleCreateParty = async () => {
    const authToken = localStorage.getItem('authToken');
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;
    const userId = user?._id;

    console.log('=== Creating Watch Party ===');
    console.log('movieId:', movie._id);
    console.log('hostId (userId):', userId);
    console.log('name (partyName):', partyName);
    console.log('movie.uid:', movie.uid);
    console.log('authToken:', authToken ? 'Present' : 'Missing');

    if (!partyName.trim()) {
      alert('Please enter a watch party name');
      return;
    }

    try {
      setCreatingParty(true);

      const response = await axios.post(`${url}/api/v1/users/watchparty/${movie.uid}`, {
        movieId: movie._id,
        hostId: userId,
        name: partyName
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      if (response.data.status === 'SUCCESS') {
        setPartyId(response.data.watchParty._id);

        // Extract cfid from shareLink
        const shareLink = response.data.shareLink;
        const cfidMatch = shareLink.match(/cfid=([^&]+)/);
        if (cfidMatch) {
          setCfid(cfidMatch[1]);
        }

        // Store the stream embed URL
        if (response.data.streamEmbedUrl) {
          setStreamEmbedUrl(response.data.streamEmbedUrl);
        }
      }
    } catch (err) {
      console.error('Error creating watch party:', err);
      console.error('Response data:', err.response?.data);
      console.error('Response status:', err.response?.status);
      console.error('Request payload:', {
        movieId: movie._id,
        hostId: userId,
        name: partyName
      });
      alert(`Failed to create watch party: ${err.response?.data?.message || err.message}`);
    } finally {
      setCreatingParty(false);
    }
  };

  const handleStartWatching = () => {
    if (partyId && cfid) {
      const userString = localStorage.getItem('user');
      const user = userString ? JSON.parse(userString) : null;
      const userId = user?._id;
      const playUrl = `/watchparty/play?partyId=${partyId}&cfid=${cfid}&userId=${userId}`;
      router.push(playUrl);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <>
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full h-screen flex flex-col items-center justify-center bg-black gap-4"
        >
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E50000]'></div>
          <p className="text-gray-400">Loading movie...</p>
        </motion.div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full h-screen flex flex-col items-center justify-center bg-black gap-4"
        >
          <p className="text-white text-lg">❌ {error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-[#E50000] text-white rounded-lg hover:bg-red-700 transition"
          >
            Go Back
          </button>
        </motion.div>
      ) : movie ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >

          <div className="w-full h-screen relative overflow-hidden">

            <Navbar />


            <button
              onClick={() => router.back()}
              className="absolute top-20 left-6 z-20  cursor-pointer transition text-white"
            >
              ← Back
            </button>

            <Image
              src={movie.backdrop || movie.posterUrl}
              fill
              alt={movie.title}
              className="object-cover scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="absolute bottom-0 left-0 right-0 pb-16 md:pb-24 px-4 md:px-8"
            >
              <div className="container mx-auto">
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold"
                >
                  {movie.title}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-gray-300 text-sm sm:text-base md:text-lg mt-2"
                >
                  Start a Watch Party and enjoy together
                </motion.p>
              </div>
            </motion.div>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="w-[90%] mx-auto pt-16 md:pt-20 pb-8">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  <FaVideo className="text-red-500 text-2xl" />
                  <h1 className="font-semibold text-white text-xl md:text-2xl">
                    Create WatchParty Name
                  </h1>
                </div>
                <input
                  type="text"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="Enter WatchParty Name"
                  className="border border-[#333] bg-[#1a1a1a] text-white py-3 md:py-4 px-4 rounded-xl w-full placeholder-[#666] focus:outline-none focus:border-white transition-colors"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="w-[90%] mx-auto py-8 pb-16 md:pb-20">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  <FaUsers className="text-red-500 text-2xl" />
                  <div className="flex flex-col gap-1">
                    <h1 className="font-semibold text-white text-xl md:text-2xl">
                      Invite Friends
                    </h1>
                    <p className="text-gray-400 text-sm md:text-base">
                      Generate link or invite other users directly to join your WatchParty
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateParty}
                    disabled={!partyName.trim() || creatingParty}
                    className="bg-[#DF1C41] text-white py-3 px-6 rounded-xl w-full font-medium transition-all duration-300 shadow-lg hover:shadow-red-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {creatingParty ? 'Creating...' : 'Create WatchParty'}
                  </motion.button>

                  {partyId && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCopyLink}
                        className="flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 py-3 px-6 rounded-xl w-full font-medium transition-all duration-300"
                      >
                        <FaLink className="text-lg" />
                        {isCopied ? "Link Copied!" : "Copy Link"}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleStartWatching}
                        className="bg-green-600 text-white py-3 px-6 rounded-xl w-full font-medium transition-all duration-300 shadow-lg hover:shadow-green-500/25"
                      >
                        Start Watching
                      </motion.button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full h-screen flex items-center justify-center bg-black"
        >
          <p className="text-white text-lg">Movie not found.</p>
        </motion.div>
      )}

      <FreeTrial />
      <Footer />
    </>
  )
}

export default WatchParty