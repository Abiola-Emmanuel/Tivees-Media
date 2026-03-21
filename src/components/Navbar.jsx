"use client"
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CiSearch } from "react-icons/ci";
import { IoIosNotificationsOutline } from "react-icons/io";
import { HiMenuAlt3 } from "react-icons/hi";
import { IoClose } from "react-icons/io5";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/main' },
    { name: 'Movies', href: '/movies' },
    { name: 'Support', href: '/support' },
    { name: 'Subscriptions', href: '/subscriptions' },
  ]

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  }

  const closeMenu = () => {
    setIsMenuOpen(false);
  }

  // Menu animation variants
  const menuVariants = {
    hidden: { opacity: 0, x: '100%' },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: "easeInOut"
      }
    },
    exit: {
      opacity: 0,
      x: '100%',
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  }

  const linkVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3
      }
    })
  }

  return (
    <>
      <nav className='fixed top-0 left-0 right-0 z-50 w-full '>
        <div className='container mx-auto px-4 sm:px-6 md:px-8'>
          <div className='flex items-center justify-between h-16 md:h-20'>

            {/* Logo */}
            <Link href="/main" className='relative w-[100px] h-10 md:h-12'>
              <Image
                src={'/logo.png'}
                fill
                alt='Logo'
                className='object-contain'
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <div className='hidden md:flex bg-[#0F0F0F] rounded-lg items-center justify-between px-2 py-2 gap-1'>
              {navLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className='text-white hover:bg-[#1F1F1F] h-10 text-sm font-normal transition-colors flex justify-center items-center px-4 rounded-lg whitespace-nowrap'
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Right Icons */}
            <div className='flex items-center gap-3 md:gap-4'>
              <CiSearch className='text-white hidden md:flex text-xl md:text-2xl cursor-pointer hover:text-red-500 transition-colors' />
              <IoIosNotificationsOutline className='text-white hidden md:flex text-xl md:text-2xl cursor-pointer hover:text-red-500 transition-colors' />

              {/* Hamburger Menu Button - Visible on mobile */}
              <button
                onClick={toggleMenu}
                className='md:hidden bg-black border-black/15 p-3 rounded-lg text-white hover:text-red-500 transition-colors'
                aria-label="Toggle menu"
              >
                <HiMenuAlt3 className='text-2xl' />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={menuVariants}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg md:hidden"
          >
            <button
              onClick={closeMenu}
              className="absolute top-5 right-5 text-white hover:text-red-500 transition-colors z-10"
              aria-label="Close menu"
            >
              <IoClose className="text-3xl" />
            </button>

            <div className="flex flex-col items-center justify-center h-full">
              <div className='relative w-[120px] h-12 mb-12'>
                <Image
                  src={'/logo.png'}
                  fill
                  alt='Logo'
                  className='object-contain'
                />
              </div>

              {/* Navigation Links */}
              <div className="flex flex-col items-center gap-6">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={index}
                    custom={index}
                    variants={linkVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                  >
                    <Link
                      href={link.href}
                      onClick={closeMenu}
                      className="text-white text-2xl font-medium hover:text-red-500 transition-colors py-2 block"
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar