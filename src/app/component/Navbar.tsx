'use client'

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { RiCloseLargeLine, RiMenu4Fill, RiSearchLine, RiNotification3Line } from "react-icons/ri";
import Link from 'next/link';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      <nav className="w-full backdrop-blur-xl bg-black/30  shadow-lg z-40 fixed">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className='shrink-0'>
              <Link href={'/'} onClick={handleLinkClick}>
                <Image 
                    src={'/assets/logo1.png'}
                    style={{borderRadius: 6}}
                    alt='Betamind logo'
                    width={40}
                    height={0}
                    priority
                    className='object-cover'
                    unoptimized
                />
              </Link>
            </div>

            {/* Desktop Navigation Links - Center */}
            <div className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
              <Link 
                href='/' 
                className="text-white hover:text-gray-300 transition-colors duration-200 text-sm font-medium"
              >
                Home
              </Link>
              <Link 
                href='/movies' 
                className="text-white hover:text-gray-300 transition-colors duration-200 text-sm font-medium"
              >
                Movies & Shows
              </Link>
              <Link 
                href='/support' 
                className="text-white hover:text-gray-300 transition-colors duration-200 text-sm font-medium"
              >
                Support
              </Link>
              <Link 
                href='/subscription' 
                className="text-white hover:text-gray-300 transition-colors duration-200 text-sm font-medium"
              >
                Subscriptions
              </Link>
            </div>

            {/* Desktop Right Icons */}
            <div className="hidden md:flex items-center space-x-4">
              <button 
                className="p-2 rounded-full hover:bg-white/10 transition-all duration-200"
                aria-label="Search"
              >
                <RiSearchLine />
              </button>
              <button 
                className="p-2 rounded-full hover:bg-white/10 transition-all duration-200"
                aria-label="Notifications"
              >
                <RiNotification3Line />
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg text-white transition-all duration-200 hover:bg-white/10"
                aria-label="Toggle menu"
              >
                <RiMenu4Fill/>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay */}
      <div
        className={`fixed inset-0 backdrop-blur-sm bg-black/60 z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Mobile Drawer Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] backdrop-blur-2xl bg-black shadow-2xl z-50 md:hidden transform transition-transform duration-300 ease-in-out border-l border-white/10 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <div>
            <Link href='/' onClick={handleLinkClick}>
              <Image 
                  src={'/assets/logo1.png'}
                  style={{borderRadius: 6}}
                  alt='Betamind logo'
                  width={50}
                  height={0}
                  priority
                  unoptimized
              />
            </Link>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg text-white hover:bg-white/10 transition-all duration-200"
            aria-label="Close menu"
          >
            <RiCloseLargeLine />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="overflow-y-auto h-[calc(100%-4rem)] p-4">
          {/* Mobile Icons */}
          <div className="flex space-x-3 pb-4 mb-4 border-b border-white/10">
            <button 
              className="flex-1 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 flex items-center justify-center"
              aria-label="Search"
            >
              <RiSearchLine />
              <span className="ml-2 text-white text-sm">Search</span>
            </button>
            <button 
              className="flex-1 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 flex items-center justify-center"
              aria-label="Notifications"
            >
              <RiNotification3Line />
              <span className="ml-2 text-white text-sm">Alerts</span>
            </button>
          </div>

          {/* Mobile Navigation Links */}
          <div className="space-y-2">
            <Link 
              href='/' 
              onClick={handleLinkClick}
              className="block w-full text-left text-white hover:bg-white/10 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200"
            >
              Home
            </Link>
            <Link 
              href='/movies' 
              onClick={handleLinkClick}
              className="block w-full text-left text-white hover:bg-white/10 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200"
            >
              Movies & Shows
            </Link>
            <Link 
              href='/support' 
              onClick={handleLinkClick}
              className="block w-full text-left text-white hover:bg-white/10 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200"
            >
              Support
            </Link>
            <Link 
              href='/subscription' 
              onClick={handleLinkClick}
              className="block w-full text-left text-white hover:bg-white/10 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200"
            >
              Subscriptions
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;