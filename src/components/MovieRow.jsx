"use client"
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { motion } from 'framer-motion';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { FaArrowRight } from 'react-icons/fa6';

const MovieRow = ({ title, movies }) => {
  const router = useRouter();
  const swiperRef = useRef(null);

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
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={containerVariants}
      className="  overflow-hidden"
    >



      <div className="w-full mx-auto px-4 sm:px-6 md:px-8 py-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-xl md:text-2xl font-semibold">
            {title}
          </h2>

        </div>

        <div className="flex  justify-end gap-3 items-center mb-6">
          <button
            onClick={() => swiperRef.current?.slidePrev()}
            className="w-10 h-10 rounded-lg cursor-pointer bg-white/10 hover:bg-red-600 text-white flex items-center justify-center transition-all duration-300 hover:scale-110"
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => swiperRef.current?.slideNext()}
            className="w-10 h-10 rounded-lg cursor-pointer bg-white/10  text-white flex items-center justify-center transition-all duration-300 hover:scale-110"
            aria-label="Next slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <motion.div variants={itemVariants}>
          <Swiper
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={20}
            slidesPerView={1}
            pagination={{ clickable: true }}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 3,
                spaceBetween: 25,
              },
              1024: {
                slidesPerView: 4,
                spaceBetween: 30,
              },
              1280: {
                slidesPerView: 5,
                spaceBetween: 30,
              },
            }}
            className="categories-swiper"
          >
            {movies.map((movie, index) => (
              <SwiperSlide key={movie.id}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ y: -10 }}
                  onClick={() => router.push(`/movies/${movie.id}`)}
                  className="cursor-pointer group"
                >
                  <div className="relative w-full h-80 rounded-xl overflow-hidden">

                    <Image
                      src={movie.poster}
                      alt={movie.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-70" />

                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white text-sm md:text-base font-semibold">
                        {movie.title}
                      </h3>
                    </div>

                  </div>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>

      </div>

      {/* Custom Swiper Styles - Hide default navigation */}
      <style jsx>{`
        :global(.categories-swiper) {
          padding-bottom: 3rem !important;
        }
        
        /* Hide default navigation buttons */
        :global(.categories-swiper .swiper-button-next),
        :global(.categories-swiper .swiper-button-prev) {
          display: none !important;
        }
        
        :global(.categories-swiper .swiper-pagination-bullet) {
          background: #666;
          opacity: 0.5;
        }
        
        :global(.categories-swiper .swiper-pagination-bullet-active) {
          background: #E50000;
          opacity: 1;
        }
        
        @media (max-width: 640px) {
          :global(.categories-swiper .swiper-pagination) {
            bottom: 0 !important;
          }
        }
      `}</style>
    </motion.section>
  );
};

export default MovieRow;