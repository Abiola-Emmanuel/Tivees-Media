'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { 
  Home, 
  Settings, 
  FileText, 
  Video, 
  BarChart3, 
  Cog,
  LogOut,
  Menu,
  X,
  Users
} from 'lucide-react';

const menuItems = [
  { icon: Home, label: 'Home', href: '/admin' },
  { icon: Settings, label: 'Content', href: '/admin/content' },
  { icon: Users, label: 'Users', href: '/admin/users' },
  { icon: FileText, label: 'Subscription', href: '/admin/subscription' },
  { icon: Video, label: 'Watchparty', href: '/admin/watchparty' },
  { icon: BarChart3, label: 'Insights', href: '/admin/insights' },
  { icon: Cog, label: 'Settings', href: '/admin/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-4 md:p-6 border-b border-gray-800">
        <Link href="/admin" className="flex items-center space-x-3" onClick={() => setIsMobileMenuOpen(false)}>
          <Image
            src="/assets/logo1.png"
            alt="TiveesMedia Logo"
            width={32}
            height={32}
            className="rounded"
            unoptimized
          />
          <span className="text-white font-semibold text-base md:text-lg">TiveesMedia</span>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-3 md:p-4">
        <ul className="space-y-1 md:space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            // Check if pathname matches exactly or starts with the href (for nested routes)
            // Special case for /admin to only match exactly, not all /admin/* routes
            const isActive = item.href === '/admin' 
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/');
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center space-x-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-[#2a2a2a] text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-[#242424]'
                    }
                  `}
                >
                  <Icon 
                    size={18} 
                    className={`flex-shrink-0 ${isActive ? 'text-red-500' : 'inherit'}`}
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sign Out */}
      <div className="p-3 md:p-4 border-t border-gray-800">
        <Link
          href="/admin/signout"
          onClick={() => setIsMobileMenuOpen(false)}
          className="flex items-center space-x-3 px-3 md:px-4 py-2.5 md:py-3 text-gray-400 hover:text-white transition-colors"
        >
          <LogOut size={18} className="flex-shrink-0" />
          <span className="text-sm font-medium">Sign out</span>
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile/Tablet Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-[#1a1a1a] border border-gray-800 text-white p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile/Tablet Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar (only on lg and above) */}
      <aside className="hidden lg:flex w-64 bg-[#1a1a1a] border-r border-gray-800 flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile/Tablet Sidebar Drawer */}
      <aside
        className={`
          lg:hidden fixed top-0 left-0 h-full w-64 bg-[#1a1a1a] border-r border-gray-800 flex flex-col z-50
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

