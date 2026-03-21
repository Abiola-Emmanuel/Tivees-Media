import { motion } from 'framer-motion';
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,

} from 'react-icons/fa';

const Footer = () => {
  const footerSections = {
    main: {
      title: "Home",
      links: [
        { name: "Categories", icon: null, href: "#" },
        { name: "Devices", href: "#" },
        { name: "Pricing", href: "#" },
        { name: "FAQ", href: "#" }
      ]
    },
    movies: {
      title: "Movies",
      links: [
        { name: "Genres", href: "#" },
        { name: "Trending", href: "#" },
        { name: "New Release", href: "#" },
        { name: "Popular", href: "#" }
      ]
    },
    shows: {
      title: "Shows",
      links: [
        { name: "Genres", href: "#" },
        { name: "Trending", href: "#" },
        { name: "New Release", href: "#" },
      ]
    },
    support: {
      title: "Support",
      links: [
        { name: "Contact Us", href: "#" }
      ]
    },
    subscription: {
      title: "Subscription",
      links: [
        { name: "Plans", href: "#" },
        { name: "Features", icon: null, href: "#" }
      ]
    }
  };

  const socialIcons = [
    { icon: <FaFacebook size={20} />, name: "Facebook", href: "#", color: "hover:text-white" },
    { icon: <FaTwitter size={20} />, name: "Twitter", href: "#", color: "hover:text-white" },
    { icon: <FaInstagram size={20} />, name: "Instagram", href: "#", color: "hover:text-white" },
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const linkVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    },
    hover: {
      scale: 1.05,
      x: 5,
      transition: { duration: 0.2 }
    }
  };

  const socialIconVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 }
    },
    hover: {
      scale: 1.2,
      rotate: 5,
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.95
    }
  };

  return (
    <motion.footer
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={containerVariants}
      className="bg-black text-white pt-30 pb-6 mt-auto"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          <motion.div variants={itemVariants}>
            <motion.h3
              variants={itemVariants}
              className="font-bold text-lg mb-4 text-white relative inline-block"
            >
              {footerSections.main.title}
            </motion.h3>
            <ul className="space-y-2">
              {footerSections.main.links.map((link, idx) => (
                <motion.li
                  key={link.name}
                  variants={linkVariants}
                  whileHover="hover"
                  custom={idx}
                >
                  <a
                    href={link.href}
                    className="text-neutral-300 hover:text-white transition-colors duration-200 text-sm flex items-center"
                  >
                    {link.name}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={itemVariants}>
            <motion.h3
              variants={itemVariants}
              className="font-bold text-lg mb-4 text-white"
            >
              {footerSections.movies.title}
            </motion.h3>
            <ul className="space-y-2">
              {footerSections.movies.links.map((link) => (
                <motion.li
                  key={link.name}
                  variants={linkVariants}
                  whileHover="hover"
                >
                  <a href={link.href} className="text-neutral-300 hover:text-white transition-colors duration-200 text-sm flex items-center">
                    {link.name}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={itemVariants}>
            <motion.h3
              variants={itemVariants}
              className="font-bold text-lg mb-4 text-white"
            >
              {footerSections.shows.title}
            </motion.h3>
            <ul className="space-y-2">
              {footerSections.shows.links.map((link) => (
                <motion.li
                  key={link.name}
                  variants={linkVariants}
                  whileHover="hover"
                >
                  <a href={link.href} className="text-neutral-300 hover:text-white transition-colors duration-200 text-sm flex items-center">
                    {link.name}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={itemVariants}>
            <motion.h3
              variants={itemVariants}
              className="font-bold text-lg mb-4 text-white"
            >
              {footerSections.support.title}
            </motion.h3>
            <ul className="space-y-2">
              {footerSections.support.links.map((link) => (
                <motion.li
                  key={link.name}
                  variants={linkVariants}
                  whileHover="hover"
                >
                  <a href={link.href} className="text-neutral-300 hover:text-white transition-colors duration-200 text-sm flex items-center">
                    {link.name}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={itemVariants}>
            <motion.h3
              variants={itemVariants}
              className="font-bold text-lg mb-4 text-white"
            >
              {footerSections.subscription.title}
            </motion.h3>
            <ul className="space-y-2">
              {footerSections.subscription.links.map((link) => (
                <motion.li
                  key={link.name}
                  variants={linkVariants}
                  whileHover="hover"
                >
                  <a href={link.href} className="text-neutral-300 hover:text-white transition-colors duration-200 text-sm flex items-center">
                    {link.name}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={itemVariants}>
            <motion.h3
              variants={itemVariants}
              className="font-bold text-lg mb-4 text-white"
            >
              Connect With Us
            </motion.h3>
            <div className="flex flex-wrap gap-3">
              {socialIcons.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  variants={socialIconVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className={`text-neutral-400 ${social.color} transition-colors duration-200 bg-neutral-800 p-2 rounded-lg hover:bg-black`}
                  aria-label={social.name}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          variants={itemVariants}
          className="border-t border-neutral-500 pt-6 mt-6"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <motion.p
              variants={itemVariants}
              className="text-neutral-400 text-sm text-center md:text-left"
            >
              © {new Date().getFullYear()} TiveesMedia, All Rights Reserved
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-wrap justify-center gap-4 md:gap-6"
            >
              {["Terms of Use", "Privacy Policy", "Cookie Policy"].map((policy, idx) => (
                <motion.a
                  key={policy}
                  href="#"
                  variants={linkVariants}
                  whileHover="hover"
                  className="text-neutral-400 hover:text-white text-sm transition-colors duration-200"
                >
                  {policy}
                </motion.a>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default Footer;