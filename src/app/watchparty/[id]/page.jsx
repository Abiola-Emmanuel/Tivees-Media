"use client"

import { useParams } from "next/navigation"
import { movies } from "@/data/movies";
import Image from "next/image";
import FreeTrial from "@/components/FreeTrial";
import Footer from "@/components/Footer";
import { FaLink, FaVideo, FaUsers } from "react-icons/fa6";
import { motion } from "framer-motion";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";

const WatchParty = () => {
  const params = useParams();
  const router = useRouter();
  const [partyName, setPartyName] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const movie = movies.find((m) => m.id === params.id);

  const handleCopyLink = () => {
    alert('Copied')
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
      {movie ? (
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
              src={movie.backdrop}
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
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 py-3 px-6 rounded-xl w-full font-medium transition-all duration-300"
                  >
                    <FaLink className="text-lg" />
                    {isCopied ? "Link Copied!" : "Copy Link"}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-[#DF1C41] text-white py-3 px-6 rounded-xl w-full font-medium transition-all duration-300 shadow-lg hover:shadow-red-500/25"
                  >
                    Create WatchParty
                  </motion.button>
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