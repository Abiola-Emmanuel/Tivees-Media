"use client"
import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { CiSearch } from "react-icons/ci";
import { IoIosNotificationsOutline } from "react-icons/io";
import { HiMenuAlt3 } from "react-icons/hi";
import { IoClose } from "react-icons/io5";
import { useRouter } from 'next/navigation';
import { useEffect, useCallback } from 'react';
import { FaPlay } from 'react-icons/fa6'
import NavLinks from './NavLinks'

const Navbar = ({ onSearchClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const notificationRef = useRef(null);
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  }

  const closeMenu = () => {
    setIsMenuOpen(false);
  }

  const router = useRouter();

  const scrollToSearch = useCallback(() => {
    setTimeout(() => {
      const searchElement = document.getElementById('movie-search');
      const navbar = document.querySelector('nav');
      if (searchElement && navbar) {
        const navbarHeight = navbar.offsetHeight || 80;
        const searchTop = searchElement.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: searchTop - navbarHeight - 20,
          behavior: 'smooth'
        });
        searchElement.querySelector('input')?.focus();
      }
    }, 100);
  }, []);

  const handleSearchClick = () => {
    if (onSearchClick) {
      onSearchClick();
      return;
    }

    router.push('/movies');
    scrollToSearch();
  };

  const toggleNotifications = () => {
    setIsNotificationOpen((current) => !current);
  };

  const handleNotificationPlay = (notification) => {
    if (!notification?.movieId) {
      return;
    }

    setIsNotificationOpen(false);
    router.push(`/movies/${notification.movieId}`);
  };

  const isNotificationUnread = (notification) => notification.status?.toLowerCase() === 'unseen';

  const unreadCount = notifications.filter(isNotificationUnread).length;

  const formatNotificationDate = (dateValue) => {
    if (!dateValue) {
      return '';
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const fetchNotifications = useCallback(async ({ markAsSeen = false, logInitialResponse = false } = {}) => {
    const authToken = localStorage.getItem('authToken');

    try {
      setNotificationsLoading(true);
      setNotificationsError('');

      const response = await axios.get(`${url}/api/v1/users/notification`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      console.log('Notification response:', response);
      console.log('Notification response data:', response?.data);
      const fetchedNotifications = Array.isArray(response.data?.notifications) ? response.data.notifications : [];
      setNotifications(fetchedNotifications);

      if (markAsSeen && fetchedNotifications.some(isNotificationUnread)) {
        const patchResponse = await axios.patch(`${url}/api/v1/users/notification`, {
          status: 'seen'
        }, {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        });

        console.log('Notification mark-as-seen response:', patchResponse);
        console.log('Notification mark-as-seen response data:', patchResponse?.data);

        setNotifications((currentNotifications) => (
          currentNotifications.map((notification) => ({
            ...notification,
            status: 'seen'
          }))
        ));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotificationsError('Unable to load notifications.');
    } finally {
      setNotificationsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#movie-search') {
        scrollToSearch();
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [scrollToSearch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const subscriptionStatus = parsedUser?.subscriptionStatus || '';
        setIsSubscribed(subscriptionStatus.toLowerCase() === 'active');
      } catch (error) {
        console.error('Unable to parse stored user for navbar links:', error);
      }
    }

    fetchNotifications({ logInitialResponse: true });
  }, [fetchNotifications]);

  useEffect(() => {
    if (isNotificationOpen) {
      fetchNotifications({ markAsSeen: true });
    }
  }, [fetchNotifications, isNotificationOpen]);

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
              <NavLinks
                isSubscribed={isSubscribed}
                linkClassName='text-white hover:bg-[#1F1F1F] h-10 text-sm font-normal transition-colors flex justify-center items-center px-4 rounded-lg whitespace-nowrap'
                itemClassName='flex'
              />
            </div>

            {/* Right Icons */}
            <div className='flex items-center gap-3 md:gap-4'>
              <button
                type='button'
                onClick={handleSearchClick}
                className='flex text-white text-2xl cursor-pointer transition-colors hover:text-red-500 md:text-2xl'
                aria-label='Search movies'
              >
                <CiSearch />
              </button>
              <div ref={notificationRef} className='relative block'>
                <button
                  type='button'
                  onClick={toggleNotifications}
                  className='flex text-white text-xl md:text-2xl cursor-pointer hover:text-red-500 transition-colors'
                  aria-label='Show notifications'
                  aria-expanded={isNotificationOpen}
                >
                  <IoIosNotificationsOutline />
                  {unreadCount > 0 ? (
                    <span className='absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white'>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  ) : null}
                </button>

                <AnimatePresence>
                  {isNotificationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className='absolute right-0 top-9 w-96 rounded-xl border border-white/10 bg-[#0F0F0F] text-white shadow-2xl shadow-black/40'
                    >
                      <div className='flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3'>
                        <div>
                          <p className='text-sm font-semibold'>Notifications</p>
                          <p className='text-xs text-neutral-400'>
                            {unreadCount > 0 ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}` : 'All caught up'}
                          </p>
                        </div>
                        <div className='rounded-full border border-white/10 px-2.5 py-1 text-xs text-neutral-300'>
                          {notifications.length}
                        </div>
                      </div>

                      <div className='max-h-96 overflow-y-auto'>
                        {notificationsLoading ? (
                          <div className='px-4 py-8 text-center text-sm text-neutral-400'>
                            Loading notifications...
                          </div>
                        ) : notificationsError ? (
                          <div className='px-4 py-8 text-center text-sm text-red-100'>
                            {notificationsError}
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className='px-4 py-8 text-center text-sm text-neutral-400'>
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.slice(0, 8).map((notification) => {
                            const isUnread = isNotificationUnread(notification);

                            return (
                              <div
                                key={notification._id}
                                className='border-b border-white/10 px-4 py-3 last:border-b-0'
                              >
                                <div className='mb-2 flex items-start gap-3'>
                                  {notification.posterUrl ? (
                                    <div className='relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10'>
                                      <Image
                                        src={notification.posterUrl}
                                        alt={notification.title || 'Notification poster'}
                                        width={56}
                                        height={56}
                                        unoptimized
                                        className='h-full w-full object-cover'
                                        loading='lazy'
                                      />
                                      <div className='absolute inset-0 bg-black/45' />
                                      <button
                                        type='button'
                                        onClick={() => handleNotificationPlay(notification)}
                                        aria-label={`Play notification movie ${notification.title || ''}`.trim()}
                                        className='absolute inset-0 flex items-center justify-center'
                                      >
                                        <span className='flex h-7 w-7 items-center justify-center rounded-full bg-white/85 text-black shadow-lg transition hover:bg-white/75'>
                                          <FaPlay className='ml-0.5 h-3 w-3 font-light' />
                                        </span>
                                      </button>
                                    </div>
                                  ) : null}

                                  <div className='min-w-0 flex-1'>
                                    <div className='mb-1 flex items-start justify-between gap-3'>
                                      <div className='flex min-w-0 items-start gap-2'>
                                        {isUnread ? (
                                          <span className='mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500'></span>
                                        ) : null}
                                        <p className='line-clamp-1 text-sm font-medium'>
                                          {notification.title}
                                        </p>
                                      </div>
                                      <span className='shrink-0 text-[11px] text-neutral-500'>
                                        {formatNotificationDate(notification.createdAt || notification.timeAgo)}
                                      </span>
                                    </div>

                                    <p className='line-clamp-2 text-xs leading-5 text-neutral-400'>
                                      {notification.message}
                                    </p>

                                    <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${isUnread ? 'bg-red-500/10 text-red-100' : 'bg-white/5 text-neutral-400'}`}>
                                      {notification.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* {!notificationsLoading && notifications.length > 8 ? (
                        <div className='border-t border-white/10 px-4 py-3 text-center text-xs text-neutral-400'>
                          Showing 8 of {notifications.length} notifications
                        </div>
                      ) : null} */}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

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
                <NavLinks
                  isSubscribed={isSubscribed}
                  onClick={closeMenu}
                  renderItem={({ link, index, children }) => (
                    <motion.div
                      key={link.href}
                      custom={index}
                      variants={linkVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                    >
                      {children}
                    </motion.div>
                  )}
                  linkClassName="text-white text-2xl font-medium hover:text-red-500 transition-colors py-2 block"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar
