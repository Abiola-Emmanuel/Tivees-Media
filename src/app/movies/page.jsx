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

        <div className='bg-[#E50000] flex items-center justify-center gap-2 text-white py-2 sm:py-2.5 md:py-2 px-5 sm:px-6 md:px-8 rounded-lg text-sm sm:text-base md:text-lg hover:bg-red-700 transition-colors w-20 absolute -top-5 left-10'>Movies</div>


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