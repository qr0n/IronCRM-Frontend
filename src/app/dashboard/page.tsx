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
      color: 'bg-blue-500',
      icon: '🏠',
    },
    {
      title: 'Active Listings',
      value: stats.activeListings,
      color: 'bg-green-500',
      icon: '📋',
    },
    {
      title: 'Total Clients',
      value: stats.totalClients,
      color: 'bg-purple-500',
      icon: '👥',
    },
    {
      title: 'Scheduled Viewings',
      value: stats.scheduledViewings,
      color: 'bg-orange-500',
      icon: '📅',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Welcome back! Here's what's happening with your real estate business.
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color} text-white text-2xl mr-4`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Commission Statistics */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          💰 Commission Statistics
        </h3>
        {commissionStats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Total Sales</p>
                <p className="text-2xl font-bold text-green-800">
                  ${commissionStats.total_sales_value.toLocaleString()}
                </p>
                <p className="text-xs text-green-600">
                  {commissionStats.total_sales_count} properties sold
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Your Commissions</p>
                <p className="text-2xl font-bold text-blue-800">
                  ${commissionStats.total_agent_commission.toLocaleString()}
                </p>
                <p className="text-xs text-blue-600">
                  {commissionStats.agent_percentage_of_sale.toFixed(2)}% of sales
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Company Commission</p>
                <p className="text-2xl font-bold text-purple-800">
                  ${commissionStats.total_company_commission.toLocaleString()}
                </p>
                <p className="text-xs text-purple-600">
                  {commissionStats.commission_percentage}% of sales
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-600 font-medium">Your Split</p>
                <p className="text-2xl font-bold text-orange-800">
                  {commissionStats.agent_split_percentage}%
                </p>
                <p className="text-xs text-orange-600">
                  of company commission
                </p>
              </div>
            </div>
            
            {commissionStats.recent_sales.length > 0 ? (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Recent Sales</h4>
                <div className="space-y-2">
                  {commissionStats.recent_sales.map((sale) => (
                    <div key={sale.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-gray-900">{sale.address}</p>
                        <p className="text-sm text-gray-600">
                          ${sale.sale_price.toLocaleString()} • {sale.status}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">
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
              <div className="text-center py-6 text-gray-500">
                <p className="text-lg font-medium mb-2">No sales yet</p>
                <p className="text-sm">
                  Your commission statistics will appear here once you close your first sale.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading commission statistics...</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => router.push('/dashboard/properties')}
              className="w-full btn-primary text-left"
            >
              + Add New Property
            </button>
            <button 
              onClick={() => router.push('/dashboard/clients')}
              className="w-full btn-secondary text-left"
            >
              + Add New Client
            </button>
            <button 
              onClick={() => router.push('/dashboard/viewings')}
              className="w-full btn-secondary text-left"
            >
              + Schedule Viewing
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3 text-sm text-gray-600">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    activity.type === 'property' ? 'bg-green-500' :
                    activity.type === 'client' ? 'bg-blue-500' : 'bg-orange-500'
                  }`}></div>
                  <span>{activity.description}</span>
                </div>
              ))
            ) : (
              <div className="text-gray-500">No recent activity</div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Viewings</h3>
          <div className="space-y-3 text-sm">
            {upcomingViewings.length > 0 ? (
              upcomingViewings.map((viewing) => (
                <div key={viewing.id} className="border-l-4 border-blue-500 pl-3">
                  <p className="font-medium">{viewing.property_address}</p>
                  <p className="text-gray-600">
                    {new Date(viewing.viewing_datetime).toLocaleDateString()} at{' '}
                    {new Date(viewing.viewing_datetime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-gray-500 text-xs">with {viewing.client_name}</p>
                </div>
              ))
            ) : (
              <div className="text-gray-500">No upcoming viewings</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
