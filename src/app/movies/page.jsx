'use client'

import CategoriesSection from '@/components/Categories'
import Footer from '@/components/Footer'
import FreeTrial from '@/components/FreeTrial'
import HeroCarousel from '@/components/HeroCarousel'
import { motion } from 'framer-motion'
import Image from 'next/image'

const Movies = () => {
  return (
    <>
      <HeroCarousel />

      {/* movies in different categories */}

      <div className='relative w-[90%]  mx-auto my-30 '>

        <div className='bg-[#E50000] flex items-center justify-center gap-2 text-white py-2 sm:py-2.5 md:py-2 px-5 sm:px-6 md:px-8 rounded-lg text-sm sm:text-base md:text-lg hover:bg-red-700 transition-colors w-20 absolute -top-5 left-10'>Movies</div>


        <div>
          <CategoriesSection />
        </div>

        <div className='py-8'>
          <h2 className='text-white text-2xl font-semibold md:ml-8'>Popular Top 10 In Genres</h2>

          <CategoriesSection />
        </div>

        <div className='py-8'>
          <h2 className='text-white text-2xl font-semibold md:ml-8'>Trending Now</h2>

          <CategoriesSection />
        </div>

        <div className='py-8'>
          <h2 className='text-white text-2xl font-semibold md:ml-8'>New Releases</h2>

          <CategoriesSection />
        </div>

        <div className='py-8'>
          <h2 className='text-white text-2xl font-semibold md:ml-8'>Must-Watch Movies</h2>

          <CategoriesSection />
        </div>

      </div>

      <FreeTrial />

      <Footer />

    </>
  )
}

export default Movies