"use client"
import Image from 'next/image'
import Footer from '@/components/Footer'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import axios from 'axios'

const SignIn = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const router = useRouter()

  const url = 'https://tivess-be-89v3.onrender.com/api/v1'

  const handleLogin = async (e) => {
    e.preventDefault()

    // Validate form fields
    if (!email || !password) {
      alert('Please fill in all fields')
      return
    }

    try {
      const authToken = localStorage.getItem('authToken')

      const requestData = {
        email: email,
        password: password,
      }

      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {}

      const response = await axios.post(`${url}/users/login`, requestData, { headers })

      if (response.data.status === 'SUCCESS' && response.data.token) {
        localStorage.setItem('authToken', response.data.token)
        alert('Login successful!')
        router.push('/main')
      } else {
        alert('Login failed: ' + (response.data.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message)
      console.error('Error status:', error.response?.status)

      alert(error.response?.data?.message || 'Login failed. Please try again.')
    }
  }

  return (
    <>

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
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className='w-full h-10 sm:h-11 md:h-12 bg-[#E50000] text-white mt-4 sm:mt-5 md:mt-6 rounded-sm text-sm sm:text-base md:text-lg font-medium cursor-pointer'
              type='submit'
            >
              Log In
            </motion.button>

            <motion.p
              transition={{ duration: 0.3, delay: 0.4 }}
              className='text-neutral-500 text-center text-sm sm:text-base md:text-lg mt-4'
            >
              OR
            </motion.p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className='w-full h-10 sm:h-11 md:h-12 bg-[#80808066] text-white mt-4 sm:mt-5 md:mt-6 rounded-sm text-sm sm:text-base md:text-lg'
            >
              Sign In with Gmail
            </motion.button>

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
              <p className='text-white text-xs sm:text-sm cursor-pointer hover:underline font-medium'>Sign up now.</p>
            </motion.div>

            <motion.p
              className='text-neutral-500 text-xs sm:text-sm text-left mt-6'
            >
              This page is protected by Google reCAPTCHA to ensure you're not a bot.
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