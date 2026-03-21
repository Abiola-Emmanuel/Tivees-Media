"use client"

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import { motion } from 'framer-motion';
import { FaPlay, FaPlus, FaVolumeHigh } from 'react-icons/fa6';
import { AiOutlineLike } from "react-icons/ai";
import Image from 'next/image';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import Navbar from '@/components/Navbar';

function HeroCarousel() {
  const slides = [
    {
      title: "AVENGERS: ENDGAME",
      bg: "/mv-hero1.webp",
      desc: "With the help of remaining allies, the Avengers must assemble once more in order to undo Thanos's actions and undo the chaos to the universe, no matter",
    },
    {
      title: "Whistle",
      bg: "/mv-hero2.webp",
      desc: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the ",
    },
    {
      title: "Wuthering Heights",
      bg: "/mv-hero3.webp",
      desc: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    },
  ];

  const textVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, delay: 0.3 }
    },
    hover: {
      scale: 1.05,
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.95
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <Navbar />
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        spaceBetween={0}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 6500, disableOnInteraction: false }}
        loop
        effect="fade"
        fadeEffect={{ crossFade: true }}
        className="h-full w-full"
      >
        {slides.map((slide, idx) => (
          <SwiperSlide key={idx}>
            <div className="relative w-full h-full">
              {/* Background Image */}
              <Image
                src={slide.bg}
                alt={slide.title}
                fill
                priority={idx === 0}
                className="object-cover brightness-75"
                sizes="100vw"
                quality={90}
              />

              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <div className="absolute bottom-0 inset-0 bg-gradient-to-r from-black/5 to-transparent" />

              <motion.div
                initial="hidden"
                animate="visible"
                variants={textVariants}
                className="absolute bottom-20 left-0 right-0 p-6 sm:p-8 z-10 text-center  flex flex-col gap-2 items-center justify-center"
              >
                <div className="max-w-4xl">
                  <motion.h1
                    variants={textVariants}
                    className="text-white text-3xl sm:text-4xl md:text-2xl  xl:text-7xl font-semibold mb-3 sm:mb-4 leading-[1.2]"
                  >
                    {slide.title}
                  </motion.h1>
                </div>

                <div className="max-w-3xl">
                  <motion.p
                    variants={textVariants}
                    className="text-neutral-400 text-sm sm:text-lg md:text-md font-normal hidden md:flex mb-3 sm:mb-4 leading-[1.2]"
                  >
                    {slide.desc}
                  </motion.p>
                </div>

                <div className='flex items-center gap-3'>
                  <button className='text-white bg-[#E50000] py-2 sm:py-2.5 md:py-2 px-5 sm:px-6 md:px-8 rounded-lg text-sm sm:text-base md:text-lg hover:bg-red-700 transition-colors flex items-center gap-2 bg-'>
                    <FaPlay />
                    Play Now
                  </button>

                  <button className='bg-black p-3 hover:bg-black/40 cursor-pointer rounded-lg'>
                    <FaPlus className='text-white' />
                  </button>

                  <button className='bg-black p-3 hover:bg-black/40 cursor-pointer rounded-lg'>
                    <AiOutlineLike className='text-white' />
                  </button>

                  <button className='bg-black p-3 hover:bg-black/40 cursor-pointer rounded-lg'>
                    <FaVolumeHigh className='text-white' />
                  </button>
                </div>





              </motion.div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Swiper Styles */}
      <style jsx>{`
        :global(.swiper-button-next),
        :global(.swiper-button-prev) {
          color: white !important;
          background: rgba(0, 0, 0, 0.98);
          width: 10px !important;
          height: 10px !important;
          border-radius: 20%;
          padding: 10px !important;
          transition: all 0.3s ease;
          top: auto !important;
          bottom: 20px !important;
        }
        
        :global(.swiper-button-prev) {
          left: 20px !important;
          right: auto !important;
        }
        
        :global(.swiper-button-next) {
          right: 20px !important;
          left: auto !important;
        }
        
        :global(.swiper-button-next:hover),
        :global(.swiper-button-prev:hover) {
          background: rgba(229, 0, 0, 0.8) !important;
          color: white !important;
        }
        
        :global(.swiper-button-next:after),
        :global(.swiper-button-prev:after) {
          font-size: 8px !important;
        }
        
        :global(.swiper-pagination-bullet) {
          background: rgba(255, 255, 255, 0.5) !important;
          width: 8px !important;
          height: 8px !important;
          transition: all 0.3s ease;
        }
        
        :global(.swiper-pagination-bullet-active) {
          background: #E50000 !important;
          width: 24px !important;
          border-radius: 4px !important;
        }
        
        @media (max-width: 640px) {
          :global(.swiper-button-next),
          :global(.swiper-button-prev) {
            display: none !important;
          }
          
          :global(.swiper-pagination-bullet) {
            width: 6px !important;
            height: 6px !important;
          }
          
          :global(.swiper-pagination-bullet-active) {
            width: 18px !important;
          }
        }
        
        @media (min-width: 768px) {
          :global(.swiper-button-next),
          :global(.swiper-button-prev) {
            width: 40px !important;
            height: 40px !important;
            bottom: 30px !important;
          }
          
          :global(.swiper-button-prev) {
            left: 30px !important;
          }
          
          :global(.swiper-button-next) {
            right: 30px !important;
          }
          
          :global(.swiper-button-next:after),
          :global(.swiper-button-prev:after) {
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default HeroCarousel;