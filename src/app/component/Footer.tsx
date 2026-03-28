import React from 'react';
import { FaFacebookF, FaTwitter, FaLinkedinIn } from 'react-icons/fa';

const Footer = () => {
  const footerLinks = {
    home: [
      { label: 'Categories', href: '#' },
      { label: 'Devices', href: '#' },
      { label: 'Pricing', href: '#' },
      { label: 'FAQ', href: '#' }
    ],
    movies: [
      { label: 'Genres', href: '#' },
      { label: 'Trending', href: '#' },
      { label: 'New Release', href: '#' },
      { label: 'Popular', href: '#' }
    ],
    shows: [
      { label: 'Genres', href: '#' },
      { label: 'Trending', href: '#' },
      { label: 'New Release', href: '#' },
      { label: 'Popular', href: '#' }
    ],
    support: [
      { label: 'Contact Us', href: '#' }
    ],
    subscription: [
      { label: 'Plans', href: '#' },
      { label: 'Features', href: '#' }
    ]
  };

  const socialLinks = [
    { icon: <FaFacebookF />, href: '#', label: 'Facebook' },
    { icon: <FaTwitter />, href: '#', label: 'Twitter' },
    { icon: <FaLinkedinIn />, href: '#', label: 'LinkedIn' }
  ];

  const legalLinks = [
    { label: 'Terms of Use', href: '#' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Cookie Policy', href: '#' }
  ];

  return (
    <footer className="bg-black border-t border-gray-900">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Home Column */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Home</h3>
            <ul className="space-y-2">
              {footerLinks.home.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Movies Column */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Movies</h3>
            <ul className="space-y-2">
              {footerLinks.movies.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Shows Column */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Shows</h3>
            <ul className="space-y-2">
              {footerLinks.shows.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Subscription Column */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Subscription</h3>
            <ul className="space-y-2">
              {footerLinks.subscription.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect With Us Column */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Connect With Us</h3>
            <div className="flex gap-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 bg-neutral-900 hover:bg-red-600 rounded-lg flex items-center justify-center text-white transition-colors"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Bar */}
      <div className="border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <p className="text-gray-500 text-sm">
              ©2025 TiveesMedia, All Rights Reserved
            </p>

            {/* Legal Links */}
            <div className="flex gap-6">
              {legalLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="text-gray-500 hover:text-white transition-colors text-sm"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;