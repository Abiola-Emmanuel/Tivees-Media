"use client"
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaPhone, FaComment, FaCheckCircle } from 'react-icons/fa';
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Accordion from '@/components/Accordion';
import FreeTrial from '@/components/FreeTrial';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const Support = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const url = `${API_BASE_URL}/api/v1`;

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const userString = localStorage.getItem('user');

    if (!authToken || !userString) {
      setIsAuthenticated(false);
      router.push('/sign-in');
      return;
    }

    setIsAuthenticated(true);
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSuccessMessage('');
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const authToken = localStorage.getItem('authToken');
      const response = await axios.post(`${url}/users/support`, formData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      setSuccessMessage(response.data.message);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        message: '',
      });
    } catch (error) {
      console.error('Support request error:', error.response?.data || error.message);
      setErrorMessage(
        error.response?.data?.message || 'Unable to send your message. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated === false) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <h2 className="text-2xl font-bold">Redirecting</h2>
        <p className="text-gray-400">You need to sign in to access this page</p>
      </div>
    );
  }

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

            <form onSubmit={handleSubmit} className="relative z-10 bg-black/06 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-3">
                <label className="font-normal">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter First Name"
                  className="bg-[#141414] border border-white/10 rounded-lg p-4 focus:outline-none  transition-colors" />
              </div>

              <div className="flex flex-col gap-3">
                <label className="font-normal">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter Last Name"
                  className="bg-[#141414] border border-white/10 rounded-lg p-4 focus:outline-none  transition-colors" />
              </div>

              <div className="flex flex-col gap-3">
                <label className="font-normal">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your Email"
                  className="bg-[#141414] border border-white/10 rounded-lg p-4 focus:outline-none  transition-colors" />
              </div>

              <div className="flex flex-col gap-3">
                <label className="font-normal">Phone Number</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter Phone Number"
                    className="flex-1 bg-[#141414] border border-white/10 rounded-lg p-4 focus:outline-none  transition-colors" />
                </div>
              </div>

              <div className="flex flex-col gap-3 md:col-span-2">
                <label className="font-normal">Message</label>
                <textarea
                  rows="4"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Enter your Message"
                  className="bg-[#141414] border border-white/10 rounded-lg p-4 focus:outline-none  transition-colors resize-none"></textarea>
              </div>

              {successMessage ? (
                <p className="md:col-span-2 text-sm text-green-400">{successMessage}</p>
              ) : null}

              {errorMessage ? (
                <p className="md:col-span-2 text-sm text-red-400">{errorMessage}</p>
              ) : null}

              <div className="md:col-span-2 flex flex-col md:flex-row justify-between items-center gap-2 mt-4">
                <label className="flex items-center gap-3 text-gray-400 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 rounded border-white/10 bg-[#141414] accent-red-600" />
                  <p className='text-sm'>
                    I agree with Terms of Use and Privacy Policy
                  </p>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-[120px] bg-[#e50000] hover:bg-red-700 text-white font-normal text-sm py-2 px-2 rounded-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
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
