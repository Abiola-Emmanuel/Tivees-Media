"use client"
import Image from 'next/image'
import Script from 'next/script'
import Footer from '@/components/Footer'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa'
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
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [number, setNumber] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleReady, setIsGoogleReady] = useState(false)
  const [googleError, setGoogleError] = useState('')
  const googleButtonRef = useRef(null)

  const router = useRouter()

  const url = `${API_BASE_URL}/api/v1`

  useEffect(() => {
    const authToken = localStorage.getItem('authToken')
    const userString = localStorage.getItem('user')

    if (authToken && userString) {
      router.push('/movies')
    }
  }, [router])

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

      setGoogleError(googleResponse.data.message || 'Google sign-up was not completed.')
    } catch (error) {
      console.error('Google sign-up error:', error.response?.data || error.message)
      setGoogleError(getReadableErrorMessage(error, 'Google sign-up failed. Please try again.'))
    } finally {
      setIsLoading(false)
    }
  })

  useEffect(() => {
    if (!isGoogleReady || !googleButtonRef.current || typeof window === 'undefined') {
      return
    }

    if (!window.google?.accounts?.id) {
      setGoogleError('We could not load the Google sign-up button. Check your connection, turn off any blocker, then refresh this page.')
      return
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    })

    googleButtonRef.current.innerHTML = ''

    window.google.accounts.id.renderButton(googleButtonRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signup_with',
      shape: 'rectangular',
      width: googleButtonRef.current.offsetWidth || 400,
    })

    return () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel()
      }
    }
  }, [isGoogleReady])

  const handleSignUp = async (e) => {
    e.preventDefault()

    setGoogleError('')

    if (!name || !email || !number || !password) {
      return
    }

    setIsLoading(true)

    try {
      const response = await axios.post(`${url}/users/signup`, {
        name: name,
        email: email,
        phone: number,
        password: password,
      })

      console.log('Email sign-up response:', response.data)

      if (response.data.status === 'PENDING_VERIFICATION') {
        router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`)
      }
    } catch (error) {
      console.error('Sign up error:', error.response?.data || error.message)
      setGoogleError(
        getReadableErrorMessage(error, 'Sign up failed. Please check your details and try again.')
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
          setGoogleError('We could not load the Google sign-up button. Check your connection, turn off any blocker, then refresh this page.')
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
          onSubmit={handleSignUp}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >

          <motion.div
            className='w-full sm:w-[320px] md:w-[336px] lg:w-[352px] mx-auto'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >

            <motion.h1
              className='font-bold text-white text-2xl sm:text-3xl md:text-[31.6px]'
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              Sign Up
            </motion.h1>

            <motion.input
              type="text"
              placeholder='Full Name'
              className='w-full h-10 sm:h-11 md:h-12 bg-[#33333353] text-white mt-4 sm:mt-5 md:mt-6 border-1 rounded-sm pl-4 text-sm sm:text-base'
              value={name}
              onChange={(e) => setName(e.target.value)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            // whileFocus={{ scale: 1.02, borderColor: "#E50000" }}
            />

            <motion.input
              type="email"
              placeholder='Email '
              className='w-full h-10 sm:h-11 md:h-12 bg-[#33333353] text-white mt-4 sm:mt-5 md:mt-6 border-1 rounded-sm pl-4 text-sm sm:text-base'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            // whileFocus={{ scale: 1.02, borderColor: "#E50000" }}
            />

            <motion.input
              type="number"
              placeholder='Phone Number'
              className='w-full h-10 sm:h-11 md:h-12 bg-[#33333353] text-white mt-4 sm:mt-5 md:mt-6 border-1 rounded-sm pl-4 text-sm sm:text-base'
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            // whileFocus={{ scale: 1.02, borderColor: "#E50000" }}
            />

            <motion.div
              className='relative mt-4 sm:mt-5 md:mt-6'
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder='Password'
                className='w-full h-10 sm:h-11 md:h-12 bg-[#33333353] text-white border-1 rounded-sm pl-4 pr-12 text-sm sm:text-base'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type='button'
                className='absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-white focus:outline-none'
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
              </button>
            </motion.div>

            <motion.button
              whileHover={{ scale: isLoading ? 1 : 1.02, y: isLoading ? 0 : -2 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className='w-full h-10 sm:h-11 md:h-12 bg-[#E50000] text-white mt-4 sm:mt-5 md:mt-6 rounded-sm text-sm sm:text-base md:text-lg font-medium cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed'
              type='submit'
              disabled={isLoading}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
            >
              {isLoading ? 'Signing up...' : 'Sign Up'}
            </motion.button>

            <motion.p
              className='text-neutral-500 text-center text-sm sm:text-base md:text-lg mt-4'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.9 }}
            >
              OR
            </motion.p>

            <motion.div
              className='mt-4 sm:mt-5 md:mt-6'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.0 }}
            >
              <div
                ref={googleButtonRef}
                className='flex min-h-10 sm:min-h-11 md:min-h-12 w-full items-center justify-center overflow-hidden rounded-sm'
              />
            </motion.div>

            {googleError ? (
              <motion.p
                className='mt-3 text-center text-xs sm:text-sm text-red-400'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {googleError}
              </motion.p>
            ) : null}

            <motion.p
              whileHover={{ scale: 1.05 }}
              onClick={() => router.push('/forgot-password')}
              className='text-white text-center text-sm sm:text-base md:text-lg mt-4 cursor-pointer hover:underline'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.1 }}
            >
              Forgot password?
            </motion.p>

            <motion.div
              className='flex items-center gap-2 mt-4'
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 1.2 }}
            >
              <input type="checkbox" className='w-4 h-4' />
              <p className='text-white text-sm sm:text-base'>Remember me</p>
            </motion.div>

            <motion.div
              className='flex items-center gap-1 sm:gap-2 mt-4 flex-wrap'
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 1.3 }}
            >
              <p className='text-white text-xs sm:text-sm'>Already have an account?</p>
              <p
                onClick={() => router.push('/login')}
                className='text-white text-xs sm:text-sm cursor-pointer hover:underline font-medium'>Login</p>
            </motion.div>

            <motion.p
              className='text-neutral-500 text-xs sm:text-sm text-left mt-6'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.4 }}
            >
              This page is protected by Google reCAPTCHA to ensure you&apos;re not a bot.
            </motion.p>

            <motion.p
              whileHover={{ scale: 1.02 }}
              className='text-blue-500 text-xs sm:text-sm text-left mt-1 cursor-pointer hover:underline'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.5 }}
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
