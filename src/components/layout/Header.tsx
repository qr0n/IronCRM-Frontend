'use client';

import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from './NotificationBell';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">IR</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">IronCRM</h1>
                <p className="text-xs text-gray-500 -mt-1">Real Estate Platform</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <NotificationBell />
            
            <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
              <div className="h-8 w-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-sm">
                {user?.first_name?.[0] || user?.username?.[0] || 'U'}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {user?.first_name && user?.last_name 
                    ? `${user.first_name} ${user.last_name}` 
                    : user?.username}
                </span>
                <span className="text-xs text-gray-500 capitalize">
                  {user?.role?.toLowerCase() || 'User'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
