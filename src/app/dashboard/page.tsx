'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  totalProperties: number;
  activeListings: number;
  totalClients: number;
  scheduledViewings: number;
}

interface CommissionStats {
  total_sales_count: number;
  total_sales_value: number;
  total_company_commission: number;
  total_agent_commission: number;
  commission_percentage: number;
  agent_split_percentage: number;
  agent_percentage_of_sale: number;
  recent_sales: Array<{
    id: number;
    address: string;
    sale_price: number;
    agent_commission: number;
    status: string;
    updated_at: string;
  }>;
}

interface RecentActivity {
  id: number;
  type: 'property' | 'client' | 'viewing';
  description: string;
  created_at: string;
}

interface UpcomingViewing {
  id: number;
  property_address: string;
  client_name: string;
  viewing_datetime: string;
  status: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    activeListings: 0,
    totalClients: 0,
    scheduledViewings: 0,
  });
  const [commissionStats, setCommissionStats] = useState<CommissionStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [upcomingViewings, setUpcomingViewings] = useState<UpcomingViewing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch basic data first
      const [properties, clients, viewings] = await Promise.all([
        api.get('/properties/listings/'),
        api.get('/clients/'),
        api.get('/viewings/'),
      ]);

      const propertiesData = properties.data.results || properties.data;
      const clientsData = clients.data.results || clients.data;
      const viewingsData = viewings.data.results || viewings.data;
      
      // Calculate stats
      setStats({
        totalProperties: propertiesData.length || 0,
        activeListings: propertiesData.filter((p: any) => p.status === 'LISTED').length || 0,
        totalClients: clientsData.length || 0,
        scheduledViewings: viewingsData.filter((v: any) => 
          v.status === 'SCHEDULED' && new Date(v.viewing_datetime) > new Date()
        ).length || 0,
      });

      // Fetch commission stats separately with error handling
      // 🔐 SECURITY FIX: Only managers and admins should access commission stats
      if (currentUser?.role && ['MANAGER', 'ADMIN'].includes(currentUser.role)) {
        try {
          const commissions = await api.get('/properties/listings/commission_stats/');
          setCommissionStats(commissions.data);
        } catch (commissionError) {
          console.error('Error fetching commission stats:', commissionError);
          // Set default commission stats
          setCommissionStats({
            total_sales_count: 0,
            total_sales_value: 0,
            total_company_commission: 0,
            total_agent_commission: 0,
            commission_percentage: 5,
            agent_split_percentage: 55,
            agent_percentage_of_sale: 2.75,
            recent_sales: []
          });
        }
      } else {
        // For agents: Don't fetch commission stats, set limited default
        setCommissionStats({
          total_sales_count: 0,
          total_sales_value: 0,
          total_company_commission: 0,
          total_agent_commission: 0,
          commission_percentage: 5,
          agent_split_percentage: 55,
          agent_percentage_of_sale: 2.75,
          recent_sales: []
        });
      }

      // Recent Activity - combine recent properties, clients, and viewings
      const recentActivities: RecentActivity[] = [];
      
      // Add recent properties
      propertiesData.slice(0, 3).forEach((property: any) => {
        recentActivities.push({
          id: property.id,
          type: 'property',
          description: `New property listed: ${property.street_address}`,
          created_at: property.created_at,
        });
      });

      // Add recent clients
      clientsData.slice(0, 2).forEach((client: any) => {
        recentActivities.push({
          id: client.id,
          type: 'client',
          description: `New client added: ${client.client_name}`,
          created_at: client.created_at,
        });
      });

      // Add recent viewings
      viewingsData.slice(0, 2).forEach((viewing: any) => {
        recentActivities.push({
          id: viewing.id,
          type: 'viewing',
          description: `Viewing scheduled: ${viewing.property_address}`,
          created_at: viewing.created_at,
        });
      });

      // Sort by date and take top 3
      recentActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecentActivity(recentActivities.slice(0, 3));

      // Upcoming Viewings - scheduled viewings in the future
      const upcoming = viewingsData
        .filter((v: any) => v.status === 'SCHEDULED' && new Date(v.viewing_datetime) > new Date())
        .sort((a: any, b: any) => new Date(a.viewing_datetime).getTime() - new Date(b.viewing_datetime).getTime())
        .slice(0, 3);
      
      setUpcomingViewings(upcoming);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Properties',
      value: stats.totalProperties,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      icon: '🏠',
      description: 'Properties in portfolio'
    },
    {
      title: 'Active Listings',
      value: stats.activeListings,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      icon: '📋',
      description: 'Available for sale'
    },
    {
      title: 'Total Clients',
      value: stats.totalClients,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      icon: '👥',
      description: 'Active client base'
    },
    {
      title: 'Scheduled Viewings',
      value: stats.scheduledViewings,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      icon: '📅',
      description: 'Upcoming appointments'
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map((i) => (
            <div key={i} className="card p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-gray-200 rounded-lg animate-pulse mr-4"></div>
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Commission Stats Skeleton */}
        <div className="card p-6">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map((i) => (
              <div key={i} className="bg-gray-50 p-4 rounded-lg">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {currentUser?.first_name || currentUser?.username}! Here's your business overview.
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className={`card p-6 hover:shadow-xl transition-all duration-300 border-l-4 ${stat.bgColor} hover:scale-105`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color} text-white text-lg mr-3 shadow-md`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-xs text-gray-500">{stat.description}</p>
                  </div>
                </div>
                <p className={`text-3xl font-bold ${stat.textColor} ml-11`}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Commission Statistics */}
      {(currentUser?.role && ['MANAGER', 'ADMIN'].includes(currentUser.role)) && (
        <div className="card p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              💰 Commission Analytics
            </h3>
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              {currentUser.role} View
            </div>
          </div>
          {commissionStats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-md border border-green-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-green-600 font-medium">Total Sales</p>
                    <span className="text-green-500 text-xl">📈</span>
                  </div>
                  <p className="text-2xl font-bold text-green-800">
                    ${commissionStats.total_sales_value.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {commissionStats.total_sales_count} properties sold
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border border-blue-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-blue-600 font-medium">Agent Commissions</p>
                    <span className="text-blue-500 text-xl">💼</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-800">
                    ${commissionStats.total_agent_commission.toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {commissionStats.agent_percentage_of_sale.toFixed(2)}% of sales
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border border-purple-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-purple-600 font-medium">Company Commission</p>
                    <span className="text-purple-500 text-xl">🏢</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-800">
                    ${commissionStats.total_company_commission.toLocaleString()}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    {commissionStats.commission_percentage}% of sales
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border border-orange-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-orange-600 font-medium">Split Rate</p>
                    <span className="text-orange-500 text-xl">⚖️</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-800">
                    {commissionStats.agent_split_percentage}%
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    of company commission
                  </p>
                </div>
              </div>
            
            {commissionStats.recent_sales.length > 0 ? (
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  🎉 Recent Sales Performance
                </h4>
                <div className="space-y-3">
                  {commissionStats.recent_sales.map((sale) => (
                    <div key={sale.id} className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{sale.address}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-600">
                            💰 ${sale.sale_price.toLocaleString()}
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            {sale.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600 text-lg">
                          +${sale.agent_commission.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(sale.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-white rounded-lg shadow-md">
                <div className="text-6xl mb-4">🎯</div>
                <p className="text-lg font-medium mb-2 text-gray-900">Ready to Close Your First Sale?</p>
                <p className="text-sm text-gray-600 max-w-md mx-auto">
                  Your commission statistics and sales performance will appear here once you start closing deals.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 bg-white rounded-lg shadow-md">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading commission analytics...</p>
            <p className="text-gray-500 text-sm mt-1">Calculating your performance data</p>
          </div>
        )}
        </div>
      )}

      {/* Quick Actions & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            ⚡ Quick Actions
          </h3>
          <div className="space-y-3">
            <button 
              onClick={() => router.push('/dashboard/properties')}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-md flex items-center justify-center"
            >
              🏠 Add New Property
            </button>
            <button 
              onClick={() => router.push('/dashboard/clients')}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-md flex items-center justify-center"
            >
              👥 Add New Client
            </button>
            <button 
              onClick={() => router.push('/dashboard/viewings')}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-md flex items-center justify-center"
            >
              📅 Schedule Viewing
            </button>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            📊 Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                  <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                    activity.type === 'property' ? 'bg-green-500' :
                    activity.type === 'client' ? 'bg-blue-500' : 'bg-orange-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 leading-relaxed">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <div className="text-2xl mb-2">🔄</div>
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            🗓️ Upcoming Viewings
          </h3>
          <div className="space-y-3">
            {upcomingViewings.length > 0 ? (
              upcomingViewings.map((viewing) => (
                <div key={viewing.id} className="border-l-4 border-orange-500 bg-white pl-4 pr-3 py-3 rounded-r-lg shadow-sm">
                  <p className="font-medium text-gray-900 text-sm">{viewing.property_address}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-600 flex items-center">
                      🕐 {new Date(viewing.viewing_datetime).toLocaleDateString()} at{' '}
                      {new Date(viewing.viewing_datetime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center">
                      👤 with {viewing.client_name}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <div className="text-2xl mb-2">📅</div>
                <p className="text-sm">No upcoming viewings</p>
                <p className="text-xs text-gray-400 mt-1">Schedule your first viewing!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
