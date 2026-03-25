"use client"
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { motion } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import axios from 'axios';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { FaArrowRight } from 'react-icons/fa6';

const CategoriesSection = () => {
  const router = useRouter();
  const swiperRef = useRef(null);
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGenres = async () => {
    try {
      const response = await axios.get(`${url}/api/v1/users/users-moviesGenre`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.data.status === 'SUCCESS') {
        const dynamicCategories = response.data.categories.map((category) => {
          const genreName = category.genre;
          const routeName = genreName.toLowerCase().replace(/\s+/g, '-');

          return {
            name: genreName,
            image1: `${routeName}-1.png`,
            image2: `${routeName}-2.png`,
            image3: `${routeName}-3.png`,
            image4: `${routeName}-4.png`,
            description: `Explore ${genreName} content`,
            route: `/${routeName}`
          };
        });

        setCategories(dynamicCategories);
      }
    } catch (error) {
      console.error('Error fetching genres:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenres();
  }, []);

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
    hidden: { y: 30 },
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
      viewport={{ once: false, amount: 0.2 }}
      variants={containerVariants}
      className="  overflow-hidden"
    >
      <div className="w-full mx-auto px-4 sm:px-6 md:px-8 py-5">
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-gray-400">Loading categories...</div>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-gray-400">No categories available</div>
          </div>
        ) : (
          <>
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
                {categories.map((category, index) => (
                  <SwiperSlide key={category.name}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      whileHover={{
                        y: -10,
                        transition: { duration: 0.2 }
                      }}
                      className="flex group cursor-pointer"
                      onClick={() => router.push(category.route)}
                    >
                      <div className={`
                        relative overflow-hidden rounded-2xl
                        w-full h-90 md:w-[300px] md:h-70 sm:h-96 md:h-80 
                        transition-all duration-300
                        flex flex-col
                      `}>
                        {/* Top Row - Two Images */}
                        <div className="flex w-full h-1/2 overflow-hidden">
                          <div className="relative w-1/2 overflow-hidden">
                            <Image
                              src={`/${category.image1}`}
                              alt={`${category.name} - top left`}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"

                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
                          </div>
                          <div className="relative w-1/2 overflow-hidden">
                            <Image
                              src={`/${category.image2}`}
                              alt={`${category.name} - top right`}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              sizes="(max-width: 640px) 50vw, (max-width: 768px) 25vw, (max-width: 1024px) 16.5vw, 12.5vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
                          </div>
                        </div>

                        {/* Bottom Row - Two Images */}
                        <div className="flex w-full h-1/2 overflow-hidden">
                          <div className="relative w-1/2 overflow-hidden">
                            <Image
                              src={`/${category.image3}`}
                              alt={`${category.name} - bottom left`}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              sizes="(max-width: 640px) 50vw, (max-width: 768px) 25vw, (max-width: 1024px) 16.5vw, 12.5vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          </div>
                          <div className="relative w-1/2 overflow-hidden">
                            <Image
                              src={`/${category.image4}`}
                              alt={`${category.name} - bottom right`}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              sizes="(max-width: 640px) 50vw, (max-width: 768px) 25vw, (max-width: 1024px) 16.5vw, 12.5vw"
                            />

                          </div>
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-60 group-hover:opacity-70 transition-opacity duration-300" />

                        <div className="absolute -bottom-5 left-0 right-0 p-4 md:p-6 transform translate-y-0 transition-transform duration-300 group-hover:-translate-y-2 z-10">
                          <h3 className="text-white flex justify-between items-center text-xl md:text-lg font-semibold mb-1 md:mb-2">
                            {category.name}

                            <FaArrowRight />
                          </h3>

                        </div>


                      </div>
                    </motion.div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </motion.div>
          </>
        )}

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

export default CategoriesSection;