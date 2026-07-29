"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import axios from "axios";
import { useRequireCurrentUser } from '@/hooks/useRequireCurrentUser';
const PayButton = dynamic(() => import("@/components/PaystackButton"), {
  ssr: false,
});

const Subscription = () => {
  const { isAuthenticated, currentUser, setCurrentUser } = useRequireCurrentUser();
  const [plans, setPlans] = useState([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [plansError, setPlansError] = useState("")

  const url = process.env.NEXT_PUBLIC_BACKEND_URL


  const [paymentStatus, setPaymentStatus] = useState("");
  const userSubscriptionStatus = currentUser?.subscriptionStatus || "";
  const hasActiveSubscription = userSubscriptionStatus.toLowerCase() === "active";

  useEffect(() => {
    if (isAuthenticated !== true) {
      return
    }

    const fetchPlans = async () => {
      const authToken = localStorage.getItem('authToken')
      setPlansLoading(true)
      setPlansError("")

      try {
        const response = await axios.get(`${url}/api/v1/users/payments`, {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        })

        setPlans(Array.isArray(response.data?.paymentPlans) ? response.data.paymentPlans : [])
        console.log(response.data)
      } catch (err) {
        console.error('Error fetching payment plans', err)
        setPlansError("Unable to load payment plans. Please try again.")
      } finally {
        setPlansLoading(false)
      }
    }

    fetchPlans()
  }, [isAuthenticated, url])

  if (isAuthenticated !== true) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <h2 className="text-2xl font-bold">Redirecting</h2>
        <p className="text-gray-400">You need to sign in to access this page</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-[95%] mx-auto">
        <Navbar />

        <div className="text-white py-12 sm:py-14 mt-30 md:py-16 px-4 sm:px-6 md:px-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 sm:mb-10 md:mb-12 gap-6">
            <div className=" text-center w-full">
              <h2 className="text-2xl  sm:text-3xl md:text-4xl font-semibold mb-2 sm:mb-3">
                Choose the plan that&apos;s right for you
              </h2>
              <p className="text-gray-400 text-sm sm:text-base mx-auto max-w-xl">
                Join TiveesMedia and select from our flexible subscription options
                tailored to suit your viewing preferences. Get ready for non-stop
                entertainment!
              </p>
            </div>
          </div>

          {paymentStatus ? (
            <div className="mb-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200">
              {paymentStatus}
            </div>
          ) : null}

          <div className="lg:w-[50%] lg:mx-auto">
            {plansLoading ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-8 text-center text-gray-400">
                Loading payment plans...
              </div>
            ) : plansError ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-8 text-center text-red-100">
                {plansError}
              </div>
            ) : plans.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-8 text-center text-gray-400">
                No active payment plans are available right now.
              </div>
            ) : (
              plans.map((plan) => {
                const features = Array.isArray(plan.features) ? plan.features : [];
                const durationLabel = plan.durationInDays === 1 ? "day" : "days";

                return (
                  <div
                    key={plan._id}
                    className="relative bg-black/10 border border-white/10 rounded-2xl p-5 sm:p-6 md:p-8 overflow-hidden flex flex-col"
                  >
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg sm:text-xl md:text-2xl mb-1">{plan.name}</h3>
                          <p className="text-neutral-400 text-sm sm:text-base">
                            Valid for {plan.durationInDays} {durationLabel}
                          </p>
                        </div>

                        {currentUser ? (
                          <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${hasActiveSubscription
                            ? "border-green-500/40 bg-green-500/10 text-green-100"
                            : "border-white/10 bg-white/5 text-neutral-400"
                            }`}>
                            {hasActiveSubscription ? "Active" : "Inactive"}
                          </span>
                        ) : null}
                      </div>

                      <div className="mb-6 sm:mb-8">
                        <span className="text-2xl sm:text-3xl font-semibold">
                          NGN {Number(plan.price || 0).toLocaleString()}
                        </span>
                        <span className="text-gray-400 text-sm ml-1">
                          / {plan.durationInDays} {durationLabel}
                        </span>
                      </div>

                      {features.length > 0 ? (
                        <ul className="mb-6 space-y-3 text-sm sm:text-base text-neutral-300">
                          {features.map((feature) => (
                            <li key={feature} className="flex gap-3">
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500"></span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      <div className="flex gap-3 sm:gap-4 mt-auto">
                        <PayButton
                          amount={plan.price}
                          planName={plan.name}
                          onStatusChange={setPaymentStatus}
                          onSubscriptionChange={setCurrentUser}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* <div className="hidden md:block max-w-7xl mx-auto px-4 py-16 text-white font-sans">
          <div className="mb-10 max-w-4xl">
            <h2 className="text-white text-2xl mb-4">Compare our plans and find the right one for you</h2>
            <p className="text-gray-400 text-md">
              TiveesMedia offers three different plans to fit your needs: Basic, Standard, and Premium. Compare the features of each plan and choose the one that&apos;s right for you.
            </p>
          </div>

          <div className="border border-white/10 rounded-3xl overflow-hidden">
            <div className="grid grid-cols-4 border-b border-white/10 bg-[#0f0f0f]">
              <div className="p-6 font-normal text-xl">Features</div>
              <div className="p-6 font-normal text-xl">Basic</div>
              <div className="p-6 font-normal text-xl flex items-center gap-3">
                Standard
                <span className="bg-[#e50000] text-[10px] uppercase tracking-wider px-2 py-1 rounded">Popular</span>
              </div>
              <div className="p-6 font-bold text-xl">Premium</div>
            </div>

            <div className="grid grid-cols-4 border-b border-white/10 text-gray-400">
              <div className="p-6">Price</div>
              <div className="p-6 text-white">₦1,200/ month</div>
              <div className="p-6 text-white">₦1,700/ month</div>
              <div className="p-6 text-white">₦2,000/ month</div>
            </div>

            <div className="grid grid-cols-4 border-b border-white/10 text-gray-400 text-sm leading-relaxed">
              <div className="p-6">Content</div>
              <div className="p-6">Access to a wide selection of movies and shows, including some new releases.</div>
              <div className="p-6">Access to a wider selection of movies and shows, including most new releases and exclusive content.</div>
              <div className="p-6">Access to a widest selection of movies and shows, including all new releases and Offline Viewing.</div>
            </div>

            <div className="grid grid-cols-4 border-b border-white/10 text-gray-400">
              <div className="p-6">Devices</div>
              <div className="p-6">Watch on one device simultaneously</div>
              <div className="p-6">Watch on Two devices simultaneously</div>
              <div className="p-6">Watch on Four devices simultaneously</div>
            </div>

            <div className="grid grid-cols-4 border-b border-white/10 text-gray-400">
              <div className="p-6">Free Trial</div>
              <div className="p-6">7 Days</div>
              <div className="p-6">7 Days</div>
              <div className="p-6">7 Days</div>
            </div>

            <div className="grid grid-cols-4 border-b border-white/10 text-gray-400">
              <div className="p-6">HDR</div>
              <div className="p-6">No</div>
              <div className="p-6">Yes</div>
              <div className="p-6">Yes</div>
            </div>

            <div className="grid grid-cols-4 border-b border-white/10 text-gray-400">
              <div className="p-6">Dolby Atmos</div>
              <div className="p-6">No</div>
              <div className="p-6">Yes</div>
              <div className="p-6">Yes</div>
            </div>

            <div className="grid grid-cols-4 border-b border-white/10 text-gray-400">
              <div className="p-6">Ad-Free</div>
              <div className="p-6">No</div>
              <div className="p-6">Yes</div>
              <div className="p-6">Yes</div>
            </div>

            <div className="grid grid-cols-4 border-b border-white/10 text-gray-400">
              <div className="p-6">Offline Viewing</div>
              <div className="p-6">No</div>
              <div className="p-6">Yes, for selected titles</div>
              <div className="p-6">Yes for all titles</div>
            </div>

            <div className="grid grid-cols-4 text-gray-400">
              <div className="p-6">Family Sharing</div>
              <div className="p-6">No</div>
              <div className="p-6">Yes, up to 5 family members</div>
              <div className="p-6">Yes, up to 6 family members</div>
            </div>
          </div>
        </div> */}
        {/* 
        <SubscriptionMobile />
        <FreeTrial /> */}
      </div >

      <Footer />
    </>
  );
};

export default Subscription;
