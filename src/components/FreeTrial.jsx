import Image from "next/image"
import Link from "next/link"

const FreeTrial = () => {
  return (

    <div className='relative border-2 border-[#262626] w-[90%] h-80 sm:h-72 md:h-64 lg:h-60 mb-8 sm:mb-10 md:mb-12 mx-auto mt-20 overflow-hidden'>
      <div className='absolute inset-0 h-full bg-gradient-to-r from-black/80 to-[#a5191988] z-10'></div>

      <div className='relative w-full h-[25%]'>
        <Image
          src={'/hero3.png'}
          fill
          alt='Hero Image'
          className='absolute w-full h-full object-cover'
        />
      </div>

      <div className='relative w-full h-[25%]'>
        <Image
          src={'/hero2.png'}
          fill
          alt='Hero Image'
          className='absolute w-full h-full object-cover'
        />
      </div>

      <div className='relative w-full h-[25%]'>
        <Image
          src={'/hero1.png'}
          fill
          alt='Hero Image'
          className='absolute w-full h-full object-cover'
        />
      </div>

      <div className='relative w-full h-[25%]'>
        <Image
          src={'/hero4.png'}
          fill
          alt='Hero Image'
          className='absolute w-full h-full object-cover'
        />
      </div>

      <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col text-center md:text-left md:flex-row items-center justify-between gap-4 sm:gap-5 md:gap-6 w-[90%] mx-auto'>
        <div className='flex flex-col gap-1 sm:gap-2'>
          <h2 className='text-white font-semibold text-xl sm:text-2xl md:text-3xl lg:text-[28px] leading-[140%] sm:leading-[150%]'>
            Start your free trial today!
          </h2>
          <p className='text-neutral-300 text-xs sm:text-sm md:text-base max-w-xl'>
            This is a clear and concise call to action that encourages users to sign up for a free trial of TiveesMedia
          </p>
        </div>

        <Link
          href='/subscriptions'
          className='bg-[#E50000] text-white py-2.5 sm:py-3 md:py-[14px] px-4 sm:px-5 md:px-[20px] rounded-md text-sm sm:text-base whitespace-nowrap hover:bg-red-700 transition-colors'>
          Start a Free Trial
        </Link>
      </div>
    </div>

  )
}

export default FreeTrial