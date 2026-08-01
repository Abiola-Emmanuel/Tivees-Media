"use client"

import Image from 'next/image'
import Footer from '@/components/Footer'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa'
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL

const getReadableErrorMessage = (error, fallbackMessage) => {
  const responseData = error?.response?.data

  if (typeof responseData === 'string') {
    return responseData
  }

  return responseData?.message || responseData?.error || fallbackMessage
}

const ForgotPasswordPage = () => {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const url = `${API_BASE_URL}/api/v1`

  const runResetRequest = async (endpoint, payload, fallbackMessage) => {
    setErrorMessage('')
    setSuccessMessage('')
    setIsLoading(true)

    try {
      const response = await axios.post(`${url}${endpoint}`, payload, {
        headers: { 'Content-Type': 'application/json' },
      })
      const message = response.data?.message || fallbackMessage

      if (response.data?.status !== 'SUCCESS') {
        setErrorMessage(message || fallbackMessage)
        return null
      }

      setSuccessMessage(message)
      return response.data
    } catch (error) {
      console.error('Password reset error:', error.response?.data || error.message)
      setErrorMessage(getReadableErrorMessage(error, fallbackMessage))
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestCode = async (event) => {
    event.preventDefault()

    if (!email.trim()) {
      setErrorMessage('Please enter the email address on your account.')
      setSuccessMessage('')
      return
    }

    const data = await runResetRequest(
      '/users/forgot-password',
      { email: email.trim() },
      'If an account exists with that email, a reset code has been sent.'
    )

    if (data) {
      setCurrentStep(2)
    }
  }

  const handleVerifyCode = async (event) => {
    event.preventDefault()

    if (!code.trim()) {
      setErrorMessage('Please enter the reset code sent to your email.')
      setSuccessMessage('')
      return
    }

    const data = await runResetRequest(
      '/users/verify-reset-code',
      { email: email.trim(), code: code.trim() },
      'Reset code verified successfully.'
    )

    if (data) {
      setCurrentStep(3)
    }
  }

  const handleResetPassword = async (event) => {
    event.preventDefault()

    if (!newPassword) {
      setErrorMessage('Please enter your new password.')
      setSuccessMessage('')
      return
    }

    const data = await runResetRequest(
      '/users/reset-password',
      { email: email.trim(), code: code.trim(), newPassword },
      'Password reset successfully.'
    )

    if (data) {
      router.push('/login')
    }
  }

  const stepTitle =
    currentStep === 1 ? 'Reset Password' : currentStep === 2 ? 'Verify Code' : 'New Password'
  const stepDescription =
    currentStep === 1
      ? 'Enter your email address to request a reset code.'
      : currentStep === 2
        ? 'Enter the code that was sent to your email.'
        : 'Create a new password for your account.'

  return (
    <>
      <div className='relative'>
        <div className='relative bg-black w-full h-[100vh] flex flex-col'>
          <div className='absolute top-0 left-0 right-0 h-1/2 bg-[#141414a9] z-2'></div>
          <div className='absolute bottom-0 left-0 right-0 h-1/2 bg-[#1414149b] z-2'></div>

          {['/hero3.png', '/hero2.png', '/hero1.png', '/hero4.png', '/hero3.png'].map((src, index) => (
            <div key={`${src}-${index}`} className='relative w-full h-40'>
              <Image
                src={src}
                fill
                alt='Hero Image'
                className='absolute w-full h-full object-cover'
              />
            </div>
          ))}

          <div className='hidden md:flex relative w-full h-40'>
            <Image
              src={'/hero2.png'}
              fill
              alt='Hero Image'
              className='absolute w-full h-full object-cover'
            />
          </div>
        </div>

        <motion.form
          className='bg-black/80 z-4 rounded-sm absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
    w-[90%] sm:w-96 md:w-104 lg:w-120
    pt-8 sm:pt-10 md:pt-12 pb-8 sm:pb-10 md:pb-12 
    pl-6 sm:pl-8 md:pl-12 lg:pl-16 
    pr-6 sm:pr-8 md:pr-12 lg:pr-16'
          onSubmit={
            currentStep === 1
              ? handleRequestCode
              : currentStep === 2
                ? handleVerifyCode
                : handleResetPassword
          }
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
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
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            >
              {stepTitle}
            </motion.h1>

            <p className='mt-2 text-sm text-neutral-400'>{stepDescription}</p>

            {currentStep === 1 ? (
              <motion.input
                type='email'
                placeholder='Email'
                className='w-full h-10 sm:h-11 md:h-12 bg-[#33333353] text-white mt-4 sm:mt-5 md:mt-6 border-1 rounded-sm pl-4 text-sm sm:text-base'
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              />
            ) : null}

            {currentStep === 2 ? (
              <motion.input
                type='text'
                inputMode='numeric'
                placeholder='Reset Code'
                className='w-full h-10 sm:h-11 md:h-12 bg-[#33333353] text-white mt-4 sm:mt-5 md:mt-6 border-1 rounded-sm pl-4 text-sm sm:text-base'
                value={code}
                onChange={(event) => setCode(event.target.value)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              />
            ) : null}

            {currentStep === 3 ? (
              <motion.div
                className='relative mt-4 sm:mt-5 md:mt-6'
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder='New Password'
                  className='w-full h-10 sm:h-11 md:h-12 bg-[#33333353] text-white border-1 rounded-sm pl-4 pr-12 text-sm sm:text-base'
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
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
            ) : null}

            {successMessage ? (
              <motion.p
                className='mt-3 text-center text-xs sm:text-sm text-green-400'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {successMessage}
              </motion.p>
            ) : null}

            {errorMessage ? (
              <motion.p
                className='mt-3 text-center text-xs sm:text-sm text-red-400'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {errorMessage}
              </motion.p>
            ) : null}

            <motion.button
              whileHover={{ scale: isLoading ? 1 : 1.02, y: isLoading ? 0 : -2 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className='w-full h-10 sm:h-11 md:h-12 bg-[#E50000] text-white mt-4 sm:mt-5 md:mt-6 rounded-sm text-sm sm:text-base md:text-lg font-medium cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed'
              type='submit'
              disabled={isLoading}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              {isLoading
                ? 'Please wait...'
                : currentStep === 1
                  ? 'Send Reset Code'
                  : currentStep === 2
                    ? 'Verify Code'
                    : 'Reset Password'}
            </motion.button>

            <motion.p
              whileHover={{ scale: 1.05 }}
              onClick={() => router.push('/login')}
              className='text-white text-center text-sm sm:text-base md:text-lg mt-4 cursor-pointer hover:underline'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              Back to login
            </motion.p>
          </motion.div>
        </motion.form>
      </div>

      <Footer />
    </>
  )
}

export default ForgotPasswordPage