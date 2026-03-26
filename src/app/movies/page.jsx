'use client'

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import CategoriesSection from '@/components/Categories'
import Footer from '@/components/Footer'
import FreeTrial from '@/components/FreeTrial'
import HeroCarousel from '@/components/HeroCarousel'
import { motion } from 'framer-motion'
import MovieRow from '@/components/MovieRow'
import { useRouter } from 'next/navigation'

const Movies = () => {
  const [movieCategories, setMovieCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const debounceTimerRef = useRef(null)
  const url = process.env.NEXT_PUBLIC_BACKEND_URL
  const router = useRouter()

  useEffect(() => {
    const fetchMoviesByCategory = async () => {
      try {
        const authToken = localStorage.getItem('authToken')
        const response = await axios.get(`${url}/api/v1/users/users-moviesCategory`, {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        })

        if (response.data.status === 'SUCCESS') {
          setMovieCategories(response.data.categories)
        }
        console.log(response);

      } catch (error) {
        console.error('Error fetching movies by category:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMoviesByCategory()
  }, [])

  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (query.trim() === '') {
      setSearchResults([])
      setShowResults(false)
      return
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(query)
    }, 500) // 500ms delay
  }

  const performSearch = async (query) => {
    try {
      setSearchLoading(true)
      const authToken = localStorage.getItem('authToken')
      const response = await axios.post(`${url}/api/v1/users/user-movieSearch`, {
        keyword: query.toLowerCase()
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      })

      if (response.data.status === 'SUCCESS') {
        setSearchResults(response.data.results || [])
        setShowResults(true)
      }
    } catch (error) {
      console.error('Error searching movies:', error)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const handleMovieSelect = (movieId) => {
    setSearchQuery('')
    setShowResults(false)
    setSearchResults([])
    router.push(`/movies/${movieId}`)
  }

  return (
    <>
      <HeroCarousel />


      <div className='relative w-[90%]  mx-auto my-30 '>

        <div className='flex gap-3 mb-8 relative'>
          <div className='flex-1 relative' id="movie-search">
            <input
              type='text'
              placeholder='Search movies...'
              value={searchQuery}
              onChange={handleSearchChange}
              className='w-full px-4 py-2 sm:py-2.5 md:py-3 rounded-lg  text-white placeholder-gray-400 border border-neutral-100 focus:outline-none focus:border-[#fff] transition-colors text-sm sm:text-base'
            />

            {showResults && (
              <div className='absolute top-full left-0 right-0 mt-2 bg-black border border-neutral-700 rounded-lg shadow-lg z-50 max-h-66 overflow-y-auto'>
                {searchLoading ? (
                  <div className='p-4 text-center text-gray-400'>
                    <div className='animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#E50000] mx-auto'></div>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className='p-4 text-center text-gray-400'>
                    No movies found
                  </div>
                ) : (
                  <ul>
                    {searchResults.map((movie) => (
                      <li
                        key={movie._id}
                        onClick={() => handleMovieSelect(movie._id)}
                        className='px-4 py-3 text-white hover:bg-neutral-700 cursor-pointer transition-colors border-b border-neutral-700 last:border-b-0'
                      >
                        {movie.title}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>


        </div>


        <div className='bg-[#E50000] flex items-center justify-center gap-2 text-white py-2 sm:py-2.5 md:py-2 px-5 sm:px-6 md:px-8 rounded-lg text-sm sm:text-base md:text-lg hover:bg-red-700 transition-colors w-20 absolute top-20 left-10'>Movies</div>


        <div>
          <CategoriesSection />
        </div>

        {loading ? (
          <div className='flex justify-center items-center h-96'>
            <div className='text-gray-400'>Loading movies...</div>
          </div>
        ) : movieCategories.length === 0 ? (
          <div className='flex justify-center items-center h-96'>
            <div className='text-gray-400'>No categories available</div>
          </div>
        ) : (
          <>
            {movieCategories.map((category) => (
              <MovieRow
                key={category.category}
                title={category.category}
                movies={category.movies.slice(0, 5)}
              />
            ))}
          </>
        )}
      </div>

      <FreeTrial />

      <Footer />

    </>
  )
}

export default Movies