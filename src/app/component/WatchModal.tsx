import React from 'react';
import { SolidCopyBtn, SolidMainBtn } from './btns/AllBtns';
// import { OutlineBtn, SolidMainBtn, SolidWhiteBtn } from './btns';

const WatchModal = ({ isOpen, onClose }:any) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with blur */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0">
        <div 
          className={`bg-neutral-950 border border-[#DBFF00]/10 rounded-3xl lg:p-10 p-4 max-w-xl w-full mx-4 relative transform transition-all duration-300 ease-in-out ${
            isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
          }`}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 cursor-pointer hover:text-white transition-colors duration-200"
            aria-label="Close modal"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>

          {/* Modal content */}
          <div className="text-left">
            <div className="mb-6 pt-10">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-3 lg:pt-5 pt-14">
                        Create WatchParty Name
                    </h2>
                    <input type="text" required placeholder='WatchParty Name: ' className='bg-neutral-900 mt-1 w-full p-4 border border-neutral-800 rounded-lg'/>
                </div>

                <div className='pt-10'>
                    <p className='text-base'>Invite Friends</p>
                    <p className='text-sm text-neutral-400'>Generate a link or invite other Users directly to join your WatchParty. </p>
                </div>
            </div>

            <div className='flex lg:flex-row flex-col gap-3 justify-center m-auto lg:w-full w-[80%] pb-6'>
                <div className='w-full'>
                    <SolidCopyBtn title='Copy Link'/>
                </div>
                <div className='w-full'>
                    <SolidMainBtn title='Create WatchParty'/>
                </div>
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
};

export default WatchModal;