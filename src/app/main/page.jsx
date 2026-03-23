"use client"
import React, { useState } from 'react';
import { motion } from 'framer-motion'
import CategoriesSection from '@/components/Categories';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import { FaPlay } from "react-icons/fa6";
import {
  FaMobile,
  FaTabletAlt,
  FaTv,
  FaLaptop,
  FaGamepad,
  FaVrCardboard
} from 'react-icons/fa';
import Accordion from '@/components/Accordion';
import FreeTrial from '@/components/FreeTrial';
import Link from 'next/link';
import { useRouter } from 'next/navigation';


const Main = () => {
  const router = useRouter();

  const [billing, setBilling] = useState("monthly");


  const devices = [
    {
      name: "Smartphones",
      icon: <FaMobile className="text-4xl md:text-5xl" />,
      description: "TiveesMedia is optimized for both Android and iOS smartphones. Download our app from the Google Play Store or the Apple App Store.",
      platforms: ["Android", "iOS"],
      image: "/smartphone.png"
    },
    {
      name: "Tablet",
      icon: <FaTabletAlt className="text-4xl md:text-5xl" />,
      description: "TiveesMedia is optimized for both Android and iOS smartphones. Download our app from the Google Play Store or the Apple App Store.",
      platforms: ["Android", "iOS"],
      image: "/tablet.png"
    },
    {
      name: "Smart TV",
      icon: <FaTv className="text-4xl md:text-5xl" />,
      description: "TiveesMedia is optimized for both Android and iOS smartphones. Download our app from the Google Play Store or the Apple App Store.",
      platforms: ["Android TV", "Apple TV"],
      image: "/smarttv.png"
    },
    {
      name: "Laptops",
      icon: <FaLaptop className="text-4xl md:text-5xl" />,
      description: "TiveesMedia is optimized for both Android and iOS smartphones. Download our app from the Google Play Store or the Apple App Store.",
      platforms: ["Windows", "MacOS"],
      image: "/laptop.png"
    },
    {
      name: "Gaming Consoles",
      icon: <FaGamepad className="text-4xl md:text-5xl" />,
      description: "TiveesMedia is optimized for both Android and iOS smartphones. Download our app from the Google Play Store or the Apple App Store.",
      platforms: ["PlayStation", "Xbox"],
      image: "/console.png"
    },
    {
      name: "VR Headsets",
      icon: <FaVrCardboard className="text-4xl md:text-5xl" />,
      description: "TiveesMedia is optimized for both Android and iOS smartphones. Download our app from the Google Play Store or the Apple App Store.",
      platforms: ["Oculus", "HTC Vive"],
      image: "/vr.png"
    }
  ];

  const startSubscription = () => {
    router.push('/subscriptions');
  }


  const plans = [
    {
      name: "Monthly Plan",
      monthly: 1200,
      yearly: 10000,
      description:
        "Enjoy an extensive library of movies and shows, featuring a range of content, including recently released titles.",
    },
    {
      name: "Yearly Plan",
      monthly: 2000,
      yearly: 18000,
      description:
        "Access to a widest selection of movies and shows, including all new releases and Offline Viewing",
    },
  ];


  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    },
    hover: {
      y: -8,
      transition: { duration: 0.2 }
    }
  };


  return (
    <>

      <div className='relative  w-full h-[100vh] flex flex-col'>

        <Navbar />

        <div className=' absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-5 flex items-center justify-center'>
          <FaPlay
            onClick={() => router.push('/movies')}
            className='text-[#f5032f66] text-6xl sm:text-7xl md:text-8xl cursor-pointer hover:text-[#fe2d5366] transition-colors' />
        </div>

        <div className='absolute top-0 left-0 right-0 h-1/2 bg-[#1414148d] z-2'></div>

        <div className='absolute bottom-0 left-0 right-0 h-1/2 bg-[#14141488] z-2'></div>

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
            loading='eager'
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
      </div>

      {/* Hero Text Section  */}
      <div className='flex flex-col justify-center items-center gap-3 sm:gap-4 md:gap-5 z-10 w-[90%] mx-auto -translate-y-10 sm:-translate-y-12 md:-translate-y-15 text-center'>
        <h1 className='text-white font-normal text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[48px] leading-[130%] sm:leading-[140%] md:leading-[150%]'>
          The Best Streaming Experience
        </h1>
        <p className='text-[#CDD0D5] font-normal leading-[150%] text-xs sm:text-sm md:text-base lg:text-[16px] max-w-4xl mx-auto'>
          TiveesMedia is the best streaming experience for watching your favorite movies and shows on demand, anytime, anywhere. With TiveesMedia, you can enjoy a wide variety of content, including the latest blockbusters, classic movies, popular TV shows, and more. You can also create your own watchlists, so you can easily find the content you want to watch.
        </p>
        <Link
          href={'/movies'}
          className='bg-[#E50000] flex items-center gap-2 text-white py-2 sm:py-2.5 md:py-3 px-5 sm:px-6 md:px-8 rounded-lg text-sm sm:text-base md:text-lg hover:bg-red-700 transition-colors'>
          <FaPlay className='text-xs sm:text-sm md:text-base' /> Start Watching Now
        </Link>
      </div>



      <div className='w-[90%] mx-auto mt-8 sm:mt-10 md:mt-12 lg:mt-16'>
        {/* Header with Controls */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:justify-between md:items-end md:ml-6">
          <div className="flex flex-col text-left items-start mb-6 md:mb-0">
            <motion.h2
              variants={itemVariants}
              className="text-white text-3xl leading-[150%] sm:text-4xl md:text-2xl lg:text-3xl mb-4"
            >
              Explore our wide variety of <span className="text-white">categories</span>
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-left text-[#999999] text-sm sm:text-base md:text-lg max-w-3xl leading-relaxed"
            >
              Whether you're looking for a comedy to make you laugh, a drama to make you think,
              or a documentary to learn something new
            </motion.p>
          </div>

        </motion.div>
        <CategoriesSection />
      </div>


      {/* We provide section  */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        className="py-12 sm:py-16 md:py-20 lg:py-24 w-[90%] md:w-full mx-auto"
      >
        <div className="container mx-auto px-2 sm:px-6 md:px-8">
          {/* Header  */}
          <motion.div variants={itemVariants} className="flex flex-col text-left items-start mb-8 sm:mb-12 md:mb-16 lg:mb-20">
            <motion.h2
              variants={itemVariants}
              className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-[130%] sm:leading-[140%] md:leading-[150%] mb-3 sm:mb-4"
            >
              We Provide you streaming experience across various devices
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-[#999999] text-sm sm:text-base md:text-lg max-w-3xl leading-relaxed"
            >
              With TiveesMedia, you can enjoy your favorite movies and TV shows anytime, anywhere.
              Our platform is designed to be compatible with a wide range of devices.
            </motion.p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8"
          >
            {devices.map((device, index) => (
              <motion.div
                key={device.name}
                variants={cardVariants}
                whileHover="hover"
                className="group h-full"
              >
                <div className="bg-[#0f0f0f] bg-[linear-gradient(to_top_right,rgba(15,15,15,1)_65%,rgba(229,0,0,0.1)_100%)] rounded-2xl border border-[#333] transition-all duration-300 cursor-pointer p-5 sm:p-6 md:p-8 flex flex-col justify-center h-full ">
                  <motion.div
                    className="text-red-500 mb-3 sm:mb-4 md:mb-6 bg-[#141414] border border-[#333] rounded-lg p-3 sm:p-4 self-start"
                    transition={{ duration: 0.2 }}
                  >
                    {device.icon && React.cloneElement(device.icon, { className: "text-xl sm:text-2xl md:text-3xl" })}
                  </motion.div>

                  <h3 className="text-white text-lg sm:text-xl md:text-2xl font-normal mb-2 sm:mb-3 md:mb-4">
                    {device.name}
                  </h3>

                  <p className="text-gray-400 text-xs sm:text-sm md:text-base leading-relaxed">
                    {device.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* FAQs  */}

      <Accordion />


      {/* Choose Plan  */}
      <div className="text-white py-12 sm:py-14 md:py-16 px-4 sm:px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 sm:mb-10 md:mb-12 gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-2 sm:mb-3">
              Choose the plan that's right for you
            </h2>
            <p className="text-gray-400 text-sm sm:text-base max-w-xl">
              Join TiveesMedia and select from our flexible subscription options
              tailored to suit your viewing preferences. Get ready for non-stop
              entertainment!
            </p>
          </div>

          <div className="bg-[#111] border border-[#333] rounded-lg p-1 flex self-start md:self-auto">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm transition ${billing === "monthly"
                ? "bg-[#1a1a1a] text-white"
                : "text-gray-400"
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm transition ${billing === "yearly"
                ? "bg-[#1a1a1a] text-white"
                : "text-gray-400"
                }`}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
          {plans.map((plan, index) => {
            const price =
              billing === "monthly" ? plan.monthly : plan.yearly;

            return (
              <div
                key={index}
                className="relative bg-black/10 border border-black/15 rounded-2xl p-5 sm:p-6 md:p-8 overflow-hidden flex flex-col"
              >
                <div className="absolute inset-0 bg-black/10 opacity-80"></div>

                <div className="relative z-10 flex flex-col h-full">
                  <h3 className="text-lg sm:text-xl md:text-2xl mb-2 sm:mb-3">{plan.name}</h3>

                  <p className="text-neutral-400 text-sm sm:text-base mb-4 sm:mb-6">
                    {plan.description}
                  </p>

                  <div className="mb-6 sm:mb-8">
                    <span className="text-2xl sm:text-3xl font-semibold">
                      ₦{price.toLocaleString()}
                    </span>
                    <span className="text-gray-400 text-sm ml-1">
                      /{billing === "monthly" ? "month" : "year"}
                    </span>
                  </div>

                  <div className="flex gap-3 sm:gap-4 mt-auto">
                    <button
                      onClick={startSubscription}
                      className="flex-1 bg-black/40 py-2 sm:py-2.5 md:py-3 rounded-lg hover:bg-[#1a1a1a] transition cursor-pointer text-sm sm:text-base">
                      Start Free Trial
                    </button>
                    <button
                      onClick={startSubscription}
                      className="flex-1 bg-red-600 hover:bg-red-700 py-2 sm:py-2.5 md:py-3 rounded-lg transition cursor-pointer text-sm sm:text-base">
                      Choose Plan
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <FreeTrial />


      <Footer />

    </>
  )
}

export default Main