

import React from 'react'
import { FaCopy, FaPlay } from 'react-icons/fa';
import { FaLink } from 'react-icons/fa6';
import { LuTvMinimal } from 'react-icons/lu';

interface BtnProps {
    title: string;
    onClick?: () => void
}

export const SolidMainPlayBtn = ({ title, onClick, ...props }: BtnProps) => {
  return (
    <button 
        {...props}
        onClick={onClick} 
        className="w-full bg-[#E50000] flex items-center gap-2 cursor-pointer text-white px-4 py-3 rounded-md text-base font-medium transition-colors duration-200"
    >
        <FaPlay />
        {title}
    </button>
  )
}

export const SolidWatchBtn = ({ title, onClick, ...props }: BtnProps) => {
  return (
    <button 
        {...props}
        onClick={onClick} 
        className="w-full bg-white flex items-center gap-2 cursor-pointer text-neutral-900 px-4 py-3 rounded-md text-base font-medium transition-colors duration-200"
    >
        <LuTvMinimal className='text-lg'/>
        {title}
    </button>
  )
}


export const SolidCopyBtn = ({ title, onClick, ...props }: BtnProps) => {
  return (
    <button 
        {...props}
        onClick={onClick} 
        className="w-full bg-white flex justify-center m-auto items-center gap-2 cursor-pointer text-neutral-900 px-4 py-3 rounded-md text-base font-medium transition-colors duration-200"
    >
        <FaLink className='text-lg'/>
        {title}
    </button>
  )
}


export const SolidMainBtn = ({ title, onClick, ...props }: BtnProps) => {
  return (
    <button 
        {...props}
        onClick={onClick} 
        className="w-full bg-[#E50000] cursor-pointer text-white px-4 py-3 rounded-md text-base font-medium transition-colors duration-200"
    >
        {title}
    </button>
  )
}


export const OutlineBtn = ({ title, onClick, ...props }: BtnProps) => {
  return (
    <button 
        {...props}
        onClick={onClick} 
        className="w-full border border-neutral-700 cursor-pointer text-white px-4 py-3 rounded-md text-base font-medium transition-colors duration-200"
    >
        {title}
    </button>
  )
}
