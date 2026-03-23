'use client'

import CategoriesSection from '@/components/Categories'
import Footer from '@/components/Footer'
import FreeTrial from '@/components/FreeTrial'
import HeroCarousel from '@/components/HeroCarousel'
import { motion } from 'framer-motion'
import { movies } from '@/data/movies'
import MovieRow from '@/components/MovieRow'
const Movies = () => {

  const trendingMovies = movies.filter((m) => m.trending);

  const top10Movies = movies.filter((m) => m.top10);

  const newReleases = movies.filter((m) => m.newRelease);

  const mustWatch = movies.filter((m) => m.mustWatch);

  return (
    <>
      <HeroCarousel />


      <div className='relative w-[90%]  mx-auto my-30 '>

        <div className='flex gap-3 mb-8'>
          <input
            type='text'
            placeholder='Search movies...'
            className='flex-1 px-4 py-2 sm:py-2.5 md:py-3 rounded-lg  text-white placeholder-gray-400 border border-neutral-100 focus:outline-none focus:border-[#fff] transition-colors text-sm sm:text-base'
          />
          <button className='bg-[#E50000] text-white px-6 sm:px-8 py-2 sm:py-2.5 md:py-3 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base font-medium'>
            Search
          </button>
        </div>


        <div className='bg-[#E50000] flex items-center justify-center gap-2 text-white py-2 sm:py-2.5 md:py-2 px-5 sm:px-6 md:px-8 rounded-lg text-sm sm:text-base md:text-lg hover:bg-red-700 transition-colors w-20 absolute top-20 left-10'>Movies</div>


        <div>
          <CategoriesSection />
        </div>

        <MovieRow title="Trending Now" movies={trendingMovies.slice(0, 5)} />
        <MovieRow title="Top 10 In Genres" movies={top10Movies.slice(0, 5)} />
        <MovieRow title="New Releases" movies={newReleases.slice(0, 5)} />
        <MovieRow title="Must-Watch Movies" movies={mustWatch.slice(0, 5)} />
      </div>

      <FreeTrial />

      <Footer />

    </>
  )
}

export default Movies