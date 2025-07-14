'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ClientSearchBar } from '@/components/search/ClientSearchBar';
import { NewClientModal } from '@/components/forms/NewClientModal';
import { EditClientModal } from '@/components/forms/EditClientModal';
import NotesModal from '@/components/NotesModal';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface Client {
  id: number;
  client_name: string;
  email: string;
  phone_number: string;
  area_of_interest_parish: number;
  area_of_interest_parish_name: string;
  area_of_interest_towns: string;
  budget_tier: number;
  budget_tier_name: string;
  mode_of_purchase: string;
  pre_qual_completed: boolean;
  last_contacted: string;
  created_at: string;
}

interface ClientSearchParams {
  query?: string;
  parish?: number;
  budgetTier?: number;
  preQualified?: boolean;
  modeOfPurchase?: 'MORTGAGE' | 'CASH';
  lastContactedDays?: number;
}

interface Parish {
  id: number;
  name: string;
}

interface BudgetTier {
  id: number;
  display_name: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [budgetTiers, setBudgetTiers] = useState<BudgetTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState<ClientSearchParams>({});
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleSearch = (params: ClientSearchParams) => {
    setSearchParams(params);
    fetchClients(params);
  };

  const fetchClients = async (searchParams?: ClientSearchParams) => {
    try {
      setLoading(true);
      const response = await api.get('/clients/', { params: searchParams });
      setClients(response.data);
      setFilteredClients(response.data); // Set filtered clients directly from backend
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParishes = async () => {
    try {
      const response = await api.get('/settings/parishes/');
      setParishes(response.data);
    } catch (error) {
      console.error('Error fetching parishes:', error);
    }
  };

  const fetchBudgetTiers = async () => {
    try {
      const response = await api.get('/settings/budget-tiers/');
      setBudgetTiers(response.data);
    } catch (error) {
      console.error('Error fetching budget tiers:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setShowEditClientModal(true);
  };

  const handleDeleteClient = async (clientId: number) => {
    if (confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      try {
        await api.delete(`/clients/${clientId}/`);
        fetchClients(); // Refresh the list
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Failed to delete client. Please try again.');
      }
    }
  };

  useEffect(() => {
    fetchClients();
    fetchParishes();
    fetchBudgetTiers();
  }, []);

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
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600">Manage your client database</p>
        </div>
        <button 
          onClick={() => setShowNewClientModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Add Client
        </button>
      </div>

      {/* Search and Filters */}
      <ClientSearchBar
        onSearch={handleSearch}
        parishes={parishes}
        budgetTiers={budgetTiers}
      />

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredClients.length} of {clients.length} clients
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Area of Interest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Contacted
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {client.client_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {client.mode_of_purchase && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {client.mode_of_purchase}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {client.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <EnvelopeIcon className="h-4 w-4 mr-2" />
                          {client.email}
                        </div>
                      )}
                      {client.phone_number && (
                        <div className="flex items-center text-sm text-gray-600">
                          <PhoneIcon className="h-4 w-4 mr-2" />
                          {client.phone_number}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.area_of_interest_parish_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.budget_tier_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      client.pre_qual_completed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {client.pre_qual_completed ? 'Pre-qualified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(client.last_contacted)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          setSelectedClient(client);
                          setShowNotesModal(true);
                        }}
                        className="text-green-600 hover:text-green-800 p-1 hover:bg-green-50 rounded transition-colors"
                        title="View/Add notes"
                      >
                        <DocumentTextIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleEditClient(client)}
                        className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-colors"
                        title="Edit client"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClient(client.id)}
                        className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                        title="Delete client"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No clients found</div>
            {Object.keys(searchParams).length > 0 ? (
              <button
                onClick={() => handleSearch({})}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear filters to see all clients
              </button>
            ) : (
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Add your first client
              </button>
            )}
          </div>
        )}
      </div>

      {/* New Client Modal */}
      <NewClientModal
        isOpen={showNewClientModal}
        onClose={() => setShowNewClientModal(false)}
        onSuccess={() => {
          fetchClients(); // Refresh the client list
        }}
      />

      {/* Edit Client Modal */}
      {selectedClient && (
        <EditClientModal
          isOpen={showEditClientModal}
          onClose={() => {
            setShowEditClientModal(false);
            setSelectedClient(null);
          }}
          onSuccess={() => {
            fetchClients(); // Refresh the client list
            setShowEditClientModal(false);
            setSelectedClient(null);
          }}
          client={selectedClient}
          parishes={parishes}
          budgetTiers={budgetTiers}
        />
      )}

      {/* Notes Modal */}
      {selectedClient && (
        <NotesModal
          isOpen={showNotesModal}
          onClose={() => {
            setShowNotesModal(false);
            setSelectedClient(null);
          }}
          objectType="client"
          objectId={selectedClient.id}
          objectName={selectedClient.client_name}
          modelName="client"
          appLabel="clients"
        />
      )}
    </div>
  );
}
