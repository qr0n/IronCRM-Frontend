'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  UsersIcon, 
  CalendarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Properties', href: '/dashboard/properties', icon: BuildingOfficeIcon },
  { name: 'Clients', href: '/dashboard/clients', icon: UsersIcon },
  { name: 'Viewings', href: '/dashboard/viewings', icon: CalendarIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800 shadow-xl">
        <div className="flex items-center flex-shrink-0 px-4 mb-8">
          <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">IR</span>
          </div>
          <div className="ml-3">
            <span className="text-xl font-bold text-white">IronCRM</span>
            <p className="text-xs text-gray-300 -mt-1">Real Estate Platform</p>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col">
          <nav className="flex-1 px-2 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    ${isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }
                    group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105
                  `}
                >
                  <item.icon
                    className={`
                      ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}
                      mr-3 flex-shrink-0 h-5 w-5
                    `}
                    aria-hidden="true"
                  />
                  {item.name}
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-blue-300 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="flex-shrink-0 border-t border-gray-700 p-4">
          <div className="flex-shrink-0 w-full group block">
            <div className="flex items-center bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-colors">
              <div className="h-10 w-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center shadow-md">
                <span className="text-sm font-medium text-white">
                  {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                </span>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white">
                  {user?.first_name && user?.last_name 
                    ? `${user.first_name} ${user.last_name}` 
                    : user?.username}
                </p>
                <p className="text-xs text-gray-400 capitalize mb-2">
                  {user?.role?.toLowerCase() || 'User'}
                </p>
                <button
                  onClick={logout}
                  className="flex items-center text-xs font-medium text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="mr-1 h-3 w-3" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
