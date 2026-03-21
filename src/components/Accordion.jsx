"use client";

import Link from "next/link";
import { useState } from "react";

const Accordion = () => {

  const [activeIndex, setActiveIndex] = useState(null);

  const toggle = (index) => {
    setActiveIndex(index === activeIndex ? null : index);
  };

  const faqs = [
    {
      id: "01",
      question: "What is TiveesMedia?",
      answer:
        "StreamVibe is a streaming service that allows you to watch movies and shows on demand.",
    },
    {
      id: "02",
      question: "How much does TiveesMedia cost?",
      answer: "Pricing varies depending on your plan.",
    },
    {
      id: "03",
      question: "What content is available on TiveesMedia?",
      answer: "We offer movies, series, and exclusive content.",
    },
    {
      id: "04",
      question: "How can I watch TiveesMedia?",
      answer: "Available on mobile, web, and smart TVs.",
    },
    {
      id: "05",
      question: "How do i sign up for TiveesMedia?",
      answer: "You can sign up on our website or through our mobile app. Just click the 'Sign Up' button and follow the instructions to create your account.",
    },
    {
      id: "06",
      question: "What is the TiveesMedia free trial?",
      answer: "We offer a 7-day free trial for new users.",
    },
    {
      id: "07",
      question: "How do I contact TiveesMEdia customer support?",
      answer: "You can contact our customer support team through our website or mobile app.",
    },
    {
      id: "08",
      question: "What are the TiveesMedia payment methods?",
      answer: "We accept all major credit cards and PayPal.",
    },
  ];

  return (

    <div className="text-white py-8 sm:py-10 md:py-12 mb-8 px-4 sm:px-6 md:px-8 w-[90%] md:w-full mx-auto">
      <div className='flex flex-col md:flex-row justify-between mb-8 sm:mb-10 md:mb-12 lg:mb-15 gap-6'>
        <div className='flex flex-col'>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-4 sm:mb-6 md:mb-8 lg:mb-10">
            Frequently Asked Questions
          </h2>
          <p className='max-w-2xl text-neutral-400 text-sm sm:text-base'>Got questions? We've got answers! Check out our FAQ section to find answers to the most common questions about StreamVibe.</p>
        </div>

        <Link
          href='/support'
          className='bg-[#E50000] text-white py-3 sm:py-3.5 md:py-[14px] px-4 sm:px-5 md:px-[20px] rounded-md self-start mt-4 sm:mt-5 md:mt-0 md:self-end text-sm sm:text-base whitespace-nowrap'>
          Ask a Question
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
        {faqs.map((faq, index) => {
          const isOpen = index === activeIndex;

          return (
            <div
              key={faq.id}
              className={`pb-3 sm:pb-4 border-b border-transparent bg-gradient-to-r from-[rgba(229,0,0,0)] via-[rgba(229,0,0,1)] to-[rgba(229,0,0,0)] bg-[length:100%_1px] bg-no-repeat bg-bottom`}
            >
              <div
                onClick={() => toggle(index)}
                className="flex items-center justify-between py-4 cursor-pointer gap-3"
              >
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                  <div className="bg-[#1a1a1a] px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm">
                    {faq.id}
                  </div>
                  <h3 className="text-sm sm:text-base md:text-lg font-medium">
                    {faq.question}
                  </h3>
                </div>
                <span className="text-xl sm:text-2xl">
                  {isOpen ? "−" : "+"}
                </span>
              </div>

              <div
                className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-40 mt-2 sm:mt-3" : "max-h-0"}`}
              >
                <p className="text-gray-400 text-xs sm:text-sm pl-8 sm:pl-10 md:pl-12">
                  {faq.answer}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>

  )
}

export default Accordion