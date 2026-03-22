"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import SubscriptionMobile from "@/components/SubscriptionMobile";
import FreeTrial from "@/components/FreeTrial";
import Footer from "@/components/Footer";

const Subscription = () => {

  const [billing, setBilling] = useState("monthly");


  const plans = [
    {
      name: "Basic Plan",
      monthly: 1200,
      yearly: 10000,
      description:
        "Enjoy an extensive library of movies and shows, featuring a range of content, including recently released titles.",
    },
    {
      name: "Standard Plan",
      monthly: 1700,
      yearly: 18000,
      description:
        "Access to a widest selection of movies and shows, including all new releases and Offline Viewing",
    },
    {
      name: "Premium Plan",
      monthly: 2000,
      yearly: 18000,
      description:
        "Access to a widest selection of movies and shows, including all new releases and Offline Viewing",
    },
  ];

  const [activePlan, setActivePlan] = useState('Standard');

  const mobileViewplans = {
    Basic: {
      price: "₦1,200/ month",
      content: "Access to a wide selection of movies and shows, including some new releases.",
      devices: "Watch on one device simultaneously",
      family: "No"
    },
    Standard: {
      price: "₦1,700/ month",
      content: "Access to a wider selection of movies and shows, including most new releases and exclusive content.",
      devices: "Watch on Two devices simultaneously",
      family: "5 family members."
    },
    Premium: {
      price: "₦2,000/ month",
      content: "Access to a widest selection of movies and shows, including all new releases and Offline Viewing.",
      devices: "Watch on Four devices simultaneously",
      family: "6 family members."
    }
  };


  const startSubscription = () => {
    router.push('/subscriptions');
  }




  return (
    <>
      <div className="w-[95%] mx-auto">

        <Navbar />


        <div className="text-white py-12 sm:py-14 mt-30 md:py-16 px-4 sm:px-6 md:px-10">
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

          <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
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

        <div className="hidden md:block max-w-7xl mx-auto px-4 py-16  text-white font-sans">
          <div className="mb-10 max-w-4xl">
            <h2 className="text-white text-2xl mb-4">Compare our plans and find the right one for you</h2>
            <p className="text-gray-400 text-md">
              TiveesMedia offers three different plans to fit your needs: Basic, Standard, and Premium. Compare the features of each plan and choose the one that's right for you.
            </p>
          </div>

          <div className="border border-white/10 rounded-3xl  overflow-hidden ">

            <div className="grid grid-cols-4  border-b border-white/10 bg-[#0f0f0f]">
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
              <div className="p-6"> Dolby Atmos</div>
              <div className="p-6">No</div>
              <div className="p-6">Yes</div>
              <div className="p-6">Yes</div>
            </div>

            <div className="grid grid-cols-4 border-b border-white/10 text-gray-400">
              <div className="p-6"> Ad-Free</div>
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
        </div>

        <SubscriptionMobile />

        <FreeTrial />
      </div>

      <Footer />
    </>
  )
}

export default Subscription