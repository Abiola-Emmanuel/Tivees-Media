'use client'

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import CategoriesSection from '@/components/Categories'
import Footer from '@/components/Footer'
import FreeTrial from '@/components/FreeTrial'
import HeroCarousel from '@/components/HeroCarousel'
import MovieRow from '@/components/MovieRow'
import { useRouter } from 'next/navigation'
import { CiSearch } from 'react-icons/ci'
import { IoClose } from 'react-icons/io5'
import { useRequireCurrentUser } from '@/hooks/useRequireCurrentUser'

const normalizeMovieTags = (payload = []) => {
  if (!Array.isArray(payload)) {
    return []
  }

  return payload
    .map((item) => {
      const title = item?.tag || item?.tags || item?.category || item?.name || ''
      const movies = Array.isArray(item?.movies) ? item.movies : []

      if (!title || movies.length === 0) {
        return null
      }

      return {
        category: title,
        movies
      }
    })
    .filter(Boolean)
}

const Movies = () => {
  const [movieCategories, setMovieCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { isAuthenticated } = useRequireCurrentUser()
  const debounceTimerRef = useRef(null)
  const searchInputRef = useRef(null)
  const url = process.env.NEXT_PUBLIC_BACKEND_URL
  const router = useRouter()


  useEffect(() => {
    if (isAuthenticated !== true) {
      return
    }

    const fetchMoviesByTag = async () => {
      try {
        const authToken = localStorage.getItem('authToken')
        const headers = {
          Authorization: `Bearer ${authToken}`
        }

        const response = await axios.get(`${url}/api/v1/users/users-moviesTag`, {
          headers
        })

        const normalizedTags = normalizeMovieTags(
          response.data?.tags || response.data?.data?.tags || response.data?.data
        )

        if (normalizedTags.length > 0) {
          setMovieCategories(normalizedTags)
          return
        }

        // const fallbackResponse = await axios.get(`${url}/api/v1/users/users-moviesGenre`, {
        //   headers
        // })

        // const fallbackCategories = normalizeMovieCategories(
        //   fallbackResponse.data?.categories ||
        //   fallbackResponse.data?.genres ||
        //   fallbackResponse.data?.data?.categories ||
        //   fallbackResponse.data?.data
        // )

        // if (fallbackCategories.length > 0) {
        //   setMovieCategories(fallbackCategories)
        // }
      } catch (error) {
        console.error('Error fetching movies by tag:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMoviesByTag()
  }, [isAuthenticated, url])

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus()
    }
  }, [isSearchOpen])

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
    setIsSearchOpen(false)
    setShowResults(false)
    setSearchResults([])
    router.push(`/movies/${movieId}`)
  }

  const handleCloseSearch = () => {
    setIsSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
    setShowResults(false)
  }

  const handleToggleSearch = () => {
    if (isSearchOpen) {
      handleCloseSearch()
      return
    }

    setIsSearchOpen(true)
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (isAuthenticated !== true) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <h2 className="text-2xl font-bold">Redirecting</h2>
        <p className="text-gray-400">You need to sign in to access this page</p>
      </div>
    );
  }

  return (
    <>
      <section className='relative'>
        <HeroCarousel onSearchClick={handleToggleSearch} />

        {isSearchOpen && (
          <>
            <button
              type='button'
              aria-label='Close search overlay'
              onClick={handleCloseSearch}
              className='absolute inset-0 z-30 cursor-default bg-black/45 backdrop-blur-[1px]'
            />

            <div
              id="movie-search"
              className='absolute left-1/2 top-24 z-40 w-[90%] max-w-2xl -translate-x-1/2 sm:top-28 md:top-32'
            >
              <div className='relative'>
                <CiSearch className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-white/70' />
                <input
                  ref={searchInputRef}
                  type='text'
                  placeholder='Search movies, shows, genres...'
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className='w-full rounded-2xl border border-white/20 bg-black/45 py-3 pl-12 pr-12 text-sm text-white shadow-2xl shadow-black/40 outline-none backdrop-blur-md transition-all placeholder:text-white/55 focus:border-white/55 focus:bg-black/65 sm:py-3.5 sm:text-base'
                />
                <button
                  type='button'
                  onClick={handleCloseSearch}
                  className='absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white'
                  aria-label='Close search'
                >
                  <IoClose className='text-xl' />
                </button>

                {showResults && (
                  <div className='absolute left-0 right-0 top-full z-50 mt-3 max-h-72 overflow-y-auto rounded-2xl border border-white/15 bg-[#080808]/95 shadow-2xl shadow-black/50 backdrop-blur-md'>
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
                            className='cursor-pointer border-b border-white/10 px-4 py-3 text-sm text-white transition-colors last:border-b-0 hover:bg-white/10 sm:text-base'
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
          </>
        )}
      </section>


      <div className='relative w-[95%]  mx-auto my-30 '>

        <div className='bg-[#E50000] flex items-center justify-center gap-2 text-white py-2 sm:py-2.5 md:py-2 px-5 sm:px-6 md:px-8 rounded-lg text-sm sm:text-base md:text-lg hover:bg-red-700 transition-colors w-20 absolute top-10 left-10'>Movies</div>


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
            <div id="tags"></div>
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
