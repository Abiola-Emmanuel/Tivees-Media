"use client"
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaPhone, FaComment, FaCheckCircle } from 'react-icons/fa';
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Accordion from '@/components/Accordion';
import FreeTrial from '@/components/FreeTrial';
import Footer from '@/components/Footer';

const Support = () => {


  return (
    <>
      <Navbar />


      <div className="w-[95%] mt-30 mb-30 mx-auto flex gap-10 flex-col md:flex-row md:items-center">

        <div className=" mx-auto px-6 py-20  text-white flex flex-col md:flex-row gap-12 items-center">

          <div className=" space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold leading-tight">
                Welcome to our <br /> support page!
              </h1>
              <p className="text-gray-400 text-md">
                We're here to help you with any problems you may be having with our product.
              </p>
            </div>

            <div className="aspect-square w-full max-w-md rounded-2xl bg-[#1a1a1a] border border-white/10 overflow-hidden relative">
              <div className="h-full w-full flex items-center justify-center text-gray-600 italic">
                <Image
                  src={'/support.png'}
                  fill
                  alt='Support image'
                />
              </div>
            </div>
          </div>

          <div className="lg:w-3/5 w-full bg-[#0f0f0f] border border-white/5 rounded-2xl p-8 md:p-12 relative overflow-hidden">

            <form className="relative z-10 bg-black/06 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-3">
                <label className="font-normal">First Name</label>
                <input type="text" placeholder="Enter First Name"
                  className="bg-[#141414] border border-white/10 rounded-lg p-4 focus:outline-none  transition-colors" />
              </div>

              <div className="flex flex-col gap-3">
                <label className="font-normal">Last Name</label>
                <input type="text" placeholder="Enter Last Name"
                  className="bg-[#141414] border border-white/10 rounded-lg p-4 focus:outline-none  transition-colors" />
              </div>

              <div className="flex flex-col gap-3">
                <label className="font-normal">Email</label>
                <input type="email" placeholder="Enter your Email"
                  className="bg-[#141414] border border-white/10 rounded-lg p-4 focus:outline-none  transition-colors" />
              </div>

              <div className="flex flex-col gap-3">
                <label className="font-normal">Phone Number</label>
                <div className="flex gap-2">
                  <div className="bg-[#141414] border border-white/10 rounded-lg p-4 flex items-center gap-2 cursor-pointer">
                    <select>
                      <option className='bg-black'>🏁</option>
                      <option className='bg-black'>🏁</option>
                      <option className='bg-black'>🏁</option>
                    </select>
                  </div>
                  <input type="text" placeholder="Enter Phone Number"
                    className="flex-1 bg-[#141414] border border-white/10 rounded-lg p-4 focus:outline-none  transition-colors" />
                </div>
              </div>

              <div className="flex flex-col gap-3 md:col-span-2">
                <label className="font-normal">Message</label>
                <textarea rows="4" placeholder="Enter your Message"
                  className="bg-[#141414] border border-white/10 rounded-lg p-4 focus:outline-none  transition-colors resize-none"></textarea>
              </div>

              <div className="md:col-span-2 flex flex-col md:flex-row justify-between items-center gap-2 mt-4">
                <label className="flex items-center gap-3 text-gray-400 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 rounded border-white/10 bg-[#141414] accent-red-600" />
                  <p className='text-sm'>
                    I agree with Terms of Use and Privacy Policy
                  </p>
                </label>

                <button type="submit" className="w-[120x] bg-[#e50000] hover:bg-red-700 text-white font-normal text-sm py-2 px-2 rounded-lg transition-all active:scale-95">
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

      <Accordion />

      <FreeTrial />

      <Footer />

    </>
  )
}

export default Support