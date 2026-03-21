"use client";

import { useState } from "react";

const SubscriptionMobile = () => {
  const [activePlan, setActivePlan] = useState('Standard');

  const mobileViewplans = {
    Basic: {
      price: "₦1,200",
      trial: "7 Days",
      content: "Access to a wide selection of movies and shows, including some new releases.",
      devices: "Watch on one device simultaneously",
      family: "No",
      hdr: "No",
      dolby: "No",
      adFree: "No",
      offline: "No"
    },
    Standard: {
      price: "₦1,700",
      trial: "7 Days",
      content: "Access to a wider selection of movies and shows, including most new releases and exclusive content.",
      devices: "Watch on Two devices simultaneously",
      family: "5 family members.",
      hdr: "Yes",
      dolby: "Yes",
      adFree: "Yes",
      offline: "Yes, for select titles."
    },
    Premium: {
      price: "₦2,000",
      trial: "7 Days",
      content: "Access to a widest selection of movies and shows, including all new releases and Offline Viewing.",
      devices: "Watch on Four devices simultaneously",
      family: "6 family members.",
      hdr: "Yes",
      dolby: "Yes",
      adFree: "Yes",
      offline: "Yes, for all titles."
    }
  };

  const currentData = mobileViewplans[activePlan];

  return (
    <div className="md:hidden w-full px-4 py-8 bg-black/06 text-white font-sans">

      {/* Plan Selector Tabs */}
      <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-2 flex mb-6">
        {Object.keys(mobileViewplans).map((plan) => (
          <button
            key={plan}
            onClick={() => setActivePlan(plan)}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${activePlan === plan
              ? "bg-[#1f1f1f] text-white shadow-lg"
              : "text-gray-400 hover:text-gray-200"
              }`}
          >
            {plan}
          </button>
        ))}
      </div>

      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 space-y-8 relative overflow-hidden">

        <div className="relative z-10 grid grid-cols-2 gap-y-8">

          {/* Price & Trial Section */}
          <div>
            <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider">Price</p>
            <p className="text-lg font-semibold">{currentData.price}<span className="text-sm font-normal text-gray-400">/ month</span></p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider">Free Trial</p>
            <p className="text-lg font-semibold">{currentData.trial}</p>
          </div>

          {/* Full Width Content Section */}
          <div className="col-span-2">
            <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider">Content</p>
            <p className="text-sm text-gray-300 leading-relaxed">{currentData.content}</p>
          </div>

          {/* Technical Specs Grid */}
          <div className="col-span-2">
            <p className="text-gray-500 text-xs mb-2 uppercase tracking-wider">Devices</p>
            <p className="text-sm text-gray-300">{currentData.devices}</p>
          </div>

          <div>
            <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider">HDR</p>
            <p className="text-sm font-medium">{currentData.hdr}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider">Dolby Atmos</p>
            <p className="text-sm font-medium">{currentData.dolby}</p>
          </div>

          <div>
            <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider">Ad-Free</p>
            <p className="text-sm font-medium">{currentData.adFree}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider">Offline Viewing</p>
            <p className="text-sm font-medium">{currentData.offline}</p>
          </div>

          <div className="col-span-2">
            <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider">Family Sharing</p>
            <p className="text-sm font-medium">{currentData.family}</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SubscriptionMobile;