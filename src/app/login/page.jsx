"use client"
import Image from 'next/image'
import Script from 'next/script'
import Footer from '@/components/Footer'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

const getReadableErrorMessage = (error, fallbackMessage) => {
  const responseData = error?.response?.data

  if (typeof responseData === 'string') {
    if (responseData.includes('Internal Server Error')) {
      return 'The backend Google auth endpoint returned a 500 error. Please check the server logs.'
    }

    return responseData
  }

  return responseData?.message || fallbackMessage
}

const SignIn = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleReady, setIsGoogleReady] = useState(false)
  const [googleError, setGoogleError] = useState('')
  const googleButtonRef = useRef(null)

  const router = useRouter()

  const url = `${API_BASE_URL}/api/v1`

  const handleGoogleResponse = useEffectEvent(async (response) => {
    const token = response?.credential

    if (!token) {
      setGoogleError('Google did not return a valid credential. Please try again.')
      return
    }

    setIsLoading(true)
    setGoogleError('')

    try {
      const googleResponse = await axios.post(
        `${url}/users/googleAuth`,
        { token },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (googleResponse.data.status === 'SUCCESS' && googleResponse.data.token) {
        localStorage.setItem('authToken', googleResponse.data.token)

        if (googleResponse.data.user) {
          localStorage.setItem('user', JSON.stringify(googleResponse.data.user))
        }

        router.push('/main')
        return
      }

      setGoogleError(googleResponse.data.message || 'Google sign-in was not completed.')
    } catch (error) {
      console.error('Google login error:', error.response?.data || error.message)
      setGoogleError(getReadableErrorMessage(error, 'Google sign-in failed. Please try again.'))
    } finally {
      setIsLoading(false)
    }
  })

  useEffect(() => {
    if (!isGoogleReady || !googleButtonRef.current || typeof window === 'undefined') {
      return
    }

    if (!window.google?.accounts?.id) {
      setGoogleError('Google Sign-In failed to load. Please refresh and try again.')
      return
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    })

    window.google.accounts.id.renderButton(googleButtonRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      width: googleButtonRef.current.offsetWidth || 400,
    })

    return () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel()
      }
    }
  }, [isGoogleReady])

  const handleLogin = async (e) => {
    e.preventDefault()

    setGoogleError('')

    if (!email || !password) {
      return
    }

    setIsLoading(true)

    try {
      const requestData = {
        email: email,
        password: password,
      }

      const response = await axios.post(`${url}/users/login`, requestData)


      if (response.data.status === 'SUCCESS' && response.data.token) {
        localStorage.setItem('authToken', response.data.token)

        // Store user data if returned in login response (in 'data' field)
        if (response.data.data) {
          localStorage.setItem('user', JSON.stringify(response.data.data))
        } else {
          console.warn('Login response did not include user data. User information not stored in localStorage.')
        }

        router.push('/main')
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message)
      console.error('Error status:', error.response?.status)
      setGoogleError(
        getReadableErrorMessage(error, 'Login failed. Please check your details and try again.')
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setIsGoogleReady(true)}
        onError={() =>
          setGoogleError('Google Sign-In script could not be loaded. Please try again later.')
        }
      />

      <div className=' relative'>

        <div className='relative bg-black w-full h-[100vh] flex flex-col'>

          <div className='absolute top-0 left-0 right-0 h-1/2 bg-[#141414a9]  z-2'></div>

          <div className='absolute bottom-0 left-0 right-0 h-1/2 bg-[#1414149b]  z-2'></div>

          <div className='relative w-full h-40 '>
            <Image
              src={'/hero3.png'}
              fill
              alt='Hero Image'
              className='absolute w-full h-full object-cover'
            />
          </div>

          <div className='relative w-full h-40 '>
            <Image
              src={'/hero2.png'}
              fill
              alt='Hero Image'
              className='absolute w-full h-full object-cover'
            />
          </div>

          <div className='relative w-full h-40 '>
            <Image
              src={'/hero1.png'}
              fill
              alt='Hero Image'
              className='absolute w-full h-full object-cover'
            />
          </div>

          <div className='relative w-full h-40 '>
            <Image
              src={'/hero4.png'}
              fill
              alt='Hero Image'
              className='absolute w-full h-full object-cover'
            />
          </div>


          <div className='relative w-full h-40 '>
            <Image
              src={'/hero3.png'}
              fill
              alt='Hero Image'
              className=' absolute w-full h-full object-cover'
            />
          </div>

          <div className='hidden md:flex relative w-full h-40 '>
            <Image
              src={'/hero2.png'}
              fill
              alt='Hero Image'
              className='absolute w-full h-full object-cover'
            />
          </div>
        </div>

        {/* sign up modal */}
        <motion.form
          className='bg-black/80 z-4 rounded-sm absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
    w-[90%] sm:w-96 md:w-104 lg:w-120
    pt-8 sm:pt-10 md:pt-12 pb-8 sm:pb-10 md:pb-12 
    pl-6 sm:pl-8 md:pl-12 lg:pl-16 
    pr-6 sm:pr-8 md:pr-12 lg:pr-16'
          onSubmit={handleLogin}
        >

          <motion.div
            className='w-full sm:w-[320px] md:w-[336px] lg:w-[352px] mx-auto'
          >

            <motion.h1
              className='font-bold text-white text-2xl sm:text-3xl md:text-[31.6px]'
            >
              Login
            </motion.h1>

            <motion.input
              type="email"
              placeholder='Email '
              className='w-full h-10 sm:h-11 md:h-12 bg-[#33333353] text-white mt-4 sm:mt-5 md:mt-6 border-1 rounded-sm pl-4 text-sm sm:text-base'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />


            <motion.input
              type="password"
              placeholder='Password'
              className='w-full h-10 sm:h-11 md:h-12 bg-[#33333353] text-white mt-4 sm:mt-5 md:mt-6 border-1 rounded-sm pl-4 text-sm sm:text-base'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <motion.button
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className='w-full h-10 sm:h-11 md:h-12 bg-[#E50000] text-white mt-4 sm:mt-5 md:mt-6 rounded-sm text-sm sm:text-base md:text-lg font-medium cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed'
              type='submit'
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </motion.button>

            <motion.p
              transition={{ duration: 0.3, delay: 0.4 }}
              className='text-neutral-500 text-center text-sm sm:text-base md:text-lg mt-4'
            >
              OR
            </motion.p>

            <div className='mt-4 sm:mt-5 md:mt-6'>
              <div
                ref={googleButtonRef}
                className='flex min-h-10 sm:min-h-11 md:min-h-12 w-full items-center justify-center overflow-hidden rounded-sm'
              />
            </div>

            {googleError ? (
              <motion.p className='mt-3 text-center text-xs sm:text-sm text-red-400'>
                {googleError}
              </motion.p>
            ) : null}

            <motion.p
              whileHover={{ scale: 1.05 }}
              className='text-white text-center text-sm sm:text-base md:text-lg mt-4 cursor-pointer hover:underline'
            >
              Forgot password?
            </motion.p>

            <motion.div
              className='flex items-center gap-2 mt-4'
            >
              <input type="checkbox" className='w-4 h-4' />
              <p className='text-white text-sm sm:text-base'>Remember me</p>
            </motion.div>

            <motion.div
              className='flex items-center gap-1 sm:gap-2 mt-4 flex-wrap'
            >
              <p className='text-white text-xs sm:text-sm'>New to TiveesMedia?</p>
              <p
                onClick={() => router.push('/sign-in')}
                className='text-white text-xs sm:text-sm cursor-pointer hover:underline font-medium'>Sign up now.</p>
            </motion.div>

            <motion.p
              className='text-neutral-500 text-xs sm:text-sm text-left mt-6'
            >
              This page is protected by Google reCAPTCHA to ensure you&apos;re not a bot.
            </motion.p>

            <motion.p
              whileHover={{ scale: 1.02 }}
              className='text-blue-500 text-xs sm:text-sm text-left mt-1 cursor-pointer hover:underline'
            >
              Learn more
            </motion.p>

          </motion.div>

        </motion.form>
      </div>

      <Footer />
    </>
  )
}

export default SignIn
