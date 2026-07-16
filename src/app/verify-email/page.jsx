"use client"

import Image from 'next/image'
import Footer from '@/components/Footer'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL

const getReadableErrorMessage = (error, fallbackMessage) => {
  const responseData = error?.response?.data

  if (typeof responseData === 'string') {
    if (responseData.includes('Internal Server Error')) {
      return 'The email verification endpoint returned a 500 error. Please check the server logs.'
    }

    return responseData
  }

  return responseData?.message || fallbackMessage
}

const VerifyEmail = () => {
  const [email, setEmail] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoadedEmail, setHasLoadedEmail] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const url = `${API_BASE_URL}/api/v1`
  const canSubmit = Boolean(email) && authCode.length === 6 && !isLoading

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const emailParam = params.get('email')?.trim() || ''
    setEmail(emailParam)
    setHasLoadedEmail(true)
  }, [])

  useEffect(() => {
    const authToken = localStorage.getItem('authToken')
    const userString = localStorage.getItem('user')

    if (authToken && userString) {
      router.push('/movies')
    }
  }, [router])

  const handleCodeChange = (e) => {
    setAuthCode(e.target.value.replace(/\D/g, '').slice(0, 6))
    setMessage('')
  }

  const handleVerifyEmail = async (e) => {
    e.preventDefault()

    if (!canSubmit) {
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const response = await axios.post(`${url}/users/verify-email`, {
        email,
        authCode,
      })

      if (response.data.status === 'SUCCESS') {
        setIsVerified(true)
        setMessage('')
        setTimeout(() => {
          router.push('/login')
        }, 1200)
        return
      }

      setMessage(response.data.message || 'Email verification was not completed.')
    } catch (error) {
      console.error('Email verification error:', error.response?.data || error.message)
      setMessage(
        getReadableErrorMessage(error, 'Email verification failed. Please check the code and try again.')
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className='relative'>
        <div className='relative bg-black w-full h-[100vh] flex flex-col'>
          <div className='absolute top-0 left-0 right-0 h-1/2 bg-[#141414a9] z-2'></div>
          <div className='absolute bottom-0 left-0 right-0 h-1/2 bg-[#1414149b] z-2'></div>

          <div className='relative w-full h-40'>
            <Image src={'/hero3.png'} fill alt='Hero Image' className='absolute w-full h-full object-cover' />
          </div>

          <div className='relative w-full h-40'>
            <Image src={'/hero2.png'} fill alt='Hero Image' className='absolute w-full h-full object-cover' />
          </div>

          <div className='relative w-full h-40'>
            <Image src={'/hero1.png'} fill alt='Hero Image' className='absolute w-full h-full object-cover' />
          </div>

          <div className='relative w-full h-40'>
            <Image src={'/hero4.png'} fill alt='Hero Image' className='absolute w-full h-full object-cover' />
          </div>

          <div className='relative w-full h-40'>
            <Image src={'/hero3.png'} fill alt='Hero Image' className='absolute w-full h-full object-cover' />
          </div>

          <div className='hidden md:flex relative w-full h-40'>
            <Image src={'/hero2.png'} fill alt='Hero Image' className='absolute w-full h-full object-cover' />
          </div>
        </div>

        <motion.form
          className='bg-black/80 z-4 rounded-sm absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] sm:w-96 md:w-104 lg:w-120 pt-8 sm:pt-10 md:pt-12 pb-8 sm:pb-10 md:pb-12 pl-6 sm:pl-8 md:pl-12 lg:pl-16 pr-6 sm:pr-8 md:pr-12 lg:pr-16'
          onSubmit={handleVerifyEmail}
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
              Verify Email
            </motion.h1>

            {!hasLoadedEmail ? (
              <motion.p
                className='text-neutral-400 text-xs sm:text-sm mt-3 leading-relaxed'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                Loading verification details...
              </motion.p>
            ) : email ? (
              <>
                <motion.p
                  className='text-neutral-400 text-xs sm:text-sm mt-3 leading-relaxed'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  Enter the 6 digit verification code sent to {email}.
                </motion.p>

                <motion.input
                  type='text'
                  inputMode='numeric'
                  autoComplete='one-time-code'
                  placeholder='Verification code'
                  className='w-full h-10 sm:h-11 md:h-12 bg-[#33333353] text-white mt-4 sm:mt-5 md:mt-6 border-1 rounded-sm px-4 text-center text-lg sm:text-xl tracking-[0.35em]'
                  value={authCode}
                  onChange={handleCodeChange}
                  maxLength={6}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                />

                <motion.button
                  whileHover={{ scale: canSubmit ? 1.02 : 1, y: canSubmit ? -2 : 0 }}
                  whileTap={{ scale: canSubmit ? 0.98 : 1 }}
                  className='w-full h-10 sm:h-11 md:h-12 bg-[#E50000] text-white mt-4 sm:mt-5 md:mt-6 rounded-sm text-sm sm:text-base md:text-lg font-medium cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed'
                  type='submit'
                  disabled={!canSubmit || isVerified}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                >
                  {isVerified ? 'Email verified, please login' : isLoading ? 'Verifying...' : 'Confirm Code'}
                </motion.button>
              </>
            ) : (
              <>
                <motion.p
                  className='text-neutral-400 text-xs sm:text-sm mt-3 leading-relaxed'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  We could not find an email address for this verification session. Please sign up again.
                </motion.p>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className='w-full h-10 sm:h-11 md:h-12 bg-[#E50000] text-white mt-4 sm:mt-5 md:mt-6 rounded-sm text-sm sm:text-base md:text-lg font-medium cursor-pointer'
                  type='button'
                  onClick={() => router.push('/sign-in')}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  Back to Sign Up
                </motion.button>
              </>
            )}

            {message ? (
              <motion.p
                className='mt-3 text-center text-xs sm:text-sm text-red-400'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {message}
              </motion.p>
            ) : null}

            <motion.div
              className='flex items-center gap-1 sm:gap-2 mt-4 flex-wrap'
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              <p className='text-white text-xs sm:text-sm'>Already verified?</p>
              <p
                onClick={() => router.push('/login')}
                className='text-white text-xs sm:text-sm cursor-pointer hover:underline font-medium'
              >
                Login
              </p>
            </motion.div>
          </motion.div>
        </motion.form>
      </div>

      <Footer />
    </>
  )
}

export default VerifyEmail
