'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { NewViewingModal } from '@/components/forms/NewViewingModal';
import { EditViewingModal } from '@/components/forms/EditViewingModal';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  PlusIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  HomeIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Viewing {
  id: number;
  property_listing: number;
  property_address: string;
  client: number;
  client_name: string;
  agent: number;
  agent_name: string;
  viewing_datetime: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELED';
  notes: string;
  created_at: string;
}

interface Agent {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

export default function ViewingsPage() {
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [filteredViewings, setFilteredViewings] = useState<Viewing[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewViewingModal, setShowNewViewingModal] = useState(false);
  const [showEditViewingModal, setShowEditViewingModal] = useState(false);
  const [selectedViewing, setSelectedViewing] = useState<Viewing | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    agent: '',
    dateRange: ''
  });

  useEffect(() => {
    fetchViewings();
    fetchAgents();
  }, []);

  useEffect(() => {
    filterViewings();
  }, [viewings, searchQuery, filters]);

  const fetchViewings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/viewings/');
      setViewings(response.data);
    } catch (error) {
      console.error('Error fetching viewings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await api.get('/users/users/');
      setAgents(response.data);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const filterViewings = () => {
    let filtered = [...viewings];

    // Search by property address, client name, or agent name
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(viewing =>
        viewing.property_address.toLowerCase().includes(query) ||
        viewing.client_name.toLowerCase().includes(query) ||
        viewing.agent_name.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filters.status) {
      filtered = filtered.filter(viewing => 
        viewing.status === filters.status
      );
    }

    if (filters.agent) {
      filtered = filtered.filter(viewing => 
        viewing.agent === parseInt(filters.agent)
      );
    }

    if (filters.dateRange) {
      const today = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filtered = filtered.filter(viewing => {
            const viewingDate = new Date(viewing.viewing_datetime);
            return viewingDate.toDateString() === today.toDateString();
          });
          break;
        case 'this_week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          filtered = filtered.filter(viewing => {
            const viewingDate = new Date(viewing.viewing_datetime);
            return viewingDate >= weekStart && viewingDate <= weekEnd;
          });
          break;
        case 'upcoming':
          filtered = filtered.filter(viewing => {
            const viewingDate = new Date(viewing.viewing_datetime);
            return viewingDate > today;
          });
          break;
        case 'past':
          filtered = filtered.filter(viewing => {
            const viewingDate = new Date(viewing.viewing_datetime);
            return viewingDate < today;
          });
          break;
      }
    }

    // Sort by viewing date (newest first)
    filtered.sort((a, b) => new Date(b.viewing_datetime).getTime() - new Date(a.viewing_datetime).getTime());

    setFilteredViewings(filtered);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      agent: '',
      dateRange: ''
    });
    setSearchQuery('');
  };

  const updateViewingStatus = async (viewingId: number, newStatus: string) => {
    try {
      await api.patch(`/viewings/${viewingId}/`, { status: newStatus });
      fetchViewings(); // Refresh the list
    } catch (error) {
      console.error('Error updating viewing status:', error);
    }
  };

  const handleEditViewing = (viewing: Viewing) => {
    setSelectedViewing(viewing);
    setShowEditViewingModal(true);
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAgentName = (agentId: number) => {
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      return agent.first_name && agent.last_name 
        ? `${agent.first_name} ${agent.last_name}`
        : agent.username;
    }
    return 'Unknown Agent';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Viewings</h1>
          <p className="text-gray-600">Manage property viewings and appointments</p>
        </div>
        <button 
          onClick={() => setShowNewViewingModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Schedule Viewing
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by property, client, or agent..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${ 
              showFilters 
                ? 'bg-blue-50 border-blue-300 text-blue-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="h-5 w-5" />
            Filters
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELED">Canceled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
              <select
                value={filters.agent}
                onChange={(e) => handleFilterChange('agent', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Agents</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.first_name && agent.last_name 
                      ? `${agent.first_name} ${agent.last_name}`
                      : agent.username}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Dates</option>
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredViewings.length} of {viewings.length} viewings
      </div>

      {/* Viewings List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="space-y-0">
          {filteredViewings.map((viewing) => {
            const dateTime = formatDateTime(viewing.viewing_datetime);
            return (
              <div key={viewing.id} className="border-b border-gray-200 p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    {/* Property and Time */}
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <HomeIcon className="h-5 w-5 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {viewing.property_address}
                          </h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <CalendarDaysIcon className="h-4 w-4" />
                            {dateTime.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            {dateTime.time}
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(viewing.status)}`}>
                        {viewing.status.toLowerCase().replace('_', ' ')}
                      </span>
                    </div>

                    {/* Client and Agent */}
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        <span>Client: <span className="font-medium text-gray-900">{viewing.client_name}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        <span>Agent: <span className="font-medium text-gray-900">{viewing.agent_name}</span></span>
                      </div>
                    </div>

                    {/* Notes */}
                    {viewing.notes && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        <strong>Notes:</strong> {viewing.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {viewing.status === 'SCHEDULED' && (
                      <>
                        <button
                          onClick={() => updateViewingStatus(viewing.id, 'COMPLETED')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Mark as Completed"
                        >
                          <CheckIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => updateViewingStatus(viewing.id, 'CANCELED')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancel Viewing"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => handleEditViewing(viewing)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Viewing"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredViewings.length === 0 && (
          <div className="text-center py-12">
            <CalendarDaysIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <div className="text-gray-500 mb-4">No viewings found</div>
            {searchQuery || Object.values(filters).some(f => f) ? (
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear filters to see all viewings
              </button>
            ) : (
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Schedule your first viewing
              </button>
            )}
          </div>
        )}
      </div>

      {/* New Viewing Modal */}
      <NewViewingModal
        isOpen={showNewViewingModal}
        onClose={() => setShowNewViewingModal(false)}
        onSuccess={() => {
          fetchViewings(); // Refresh the viewings list
        }}
      />

      {/* Edit Viewing Modal */}
      {selectedViewing && (
        <EditViewingModal
          isOpen={showEditViewingModal}
          onClose={() => {
            setShowEditViewingModal(false);
            setSelectedViewing(null);
          }}
          onSuccess={() => {
            fetchViewings(); // Refresh the viewings list
            setShowEditViewingModal(false);
            setSelectedViewing(null);
          }}
          viewing={selectedViewing}
        />
      )}
    </div>
  );
}
