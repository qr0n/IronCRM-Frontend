'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { XMarkIcon } from '@heroicons/react/24/outline';

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
}

interface Property {
  id: number;
  street_address: string;
  town: string;
  parish_name: string;
}

interface Client {
  id: number;
  client_name: string;
}

interface Agent {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

interface EditViewingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  viewing: Viewing;
}

export function EditViewingModal({ isOpen, onClose, onSuccess, viewing }: EditViewingModalProps) {
  const [formData, setFormData] = useState({
    property_listing: '',
    client: '',
    agent: '',
    viewing_datetime: '',
    status: 'SCHEDULED' as 'SCHEDULED' | 'COMPLETED' | 'CANCELED',
    notes: '',
  });
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
      if (viewing) {
        setFormData({
          property_listing: viewing.property_listing.toString(),
          client: viewing.client.toString(),
          agent: viewing.agent.toString(),
          viewing_datetime: formatDateTimeForInput(viewing.viewing_datetime),
          status: viewing.status,
          notes: viewing.notes || '',
        });
      }
    }
  }, [isOpen, viewing]);

  const formatDateTimeForInput = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const fetchDropdownData = async () => {
    try {
      const [propertiesRes, clientsRes, agentsRes] = await Promise.all([
        api.get('/properties/listings/'),
        api.get('/clients/'),
        api.get('/users/users/'),
      ]);

      setProperties(propertiesRes.data.results || propertiesRes.data);
      setClients(clientsRes.data.results || clientsRes.data);
      setAgents(agentsRes.data.results || agentsRes.data);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const data = {
        ...formData,
        property_listing: parseInt(formData.property_listing),
        client: parseInt(formData.client),
        agent: parseInt(formData.agent),
        viewing_datetime: new Date(formData.viewing_datetime).toISOString(),
      };

      await api.put(`/viewings/${viewing.id}/`, data);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating viewing:', error);
      setError(error.response?.data?.detail || 'Failed to update viewing');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.property_listing) {
      newErrors.property_listing = 'Property is required';
    }
    if (!formData.client) {
      newErrors.client = 'Client is required';
    }
    if (!formData.agent) {
      newErrors.agent = 'Agent is required';
    }
    if (!formData.viewing_datetime) {
      newErrors.viewing_datetime = 'Viewing date and time is required';
    } else {
      // Check if the viewing is in the past
      const viewingDate = new Date(formData.viewing_datetime);
      const now = new Date();
      if (viewingDate < now) {
        newErrors.viewing_datetime = 'Viewing date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Edit Viewing
          </h3>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="property_listing" className="block text-sm font-medium text-gray-700 mb-1">
              Property *
            </label>
            <select
              id="property_listing"
              name="property_listing"
              value={formData.property_listing}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.property_listing ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select Property</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.street_address}, {property.town}
                </option>
              ))}
            </select>
            {errors.property_listing && (
              <p className="text-red-500 text-sm mt-1">{errors.property_listing}</p>
            )}
          </div>

          <div>
            <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
              Client *
            </label>
            <select
              id="client"
              name="client"
              value={formData.client}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.client ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select Client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.client_name}
                </option>
              ))}
            </select>
            {errors.client && (
              <p className="text-red-500 text-sm mt-1">{errors.client}</p>
            )}
          </div>

          <div>
            <label htmlFor="agent" className="block text-sm font-medium text-gray-700 mb-1">
              Agent *
            </label>
            <select
              id="agent"
              name="agent"
              value={formData.agent}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.agent ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select Agent</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.first_name} {agent.last_name} ({agent.username})
                </option>
              ))}
            </select>
            {errors.agent && (
              <p className="text-red-500 text-sm mt-1">{errors.agent}</p>
            )}
          </div>

          <div>
            <label htmlFor="viewing_datetime" className="block text-sm font-medium text-gray-700 mb-1">
              Date & Time *
            </label>
            <input
              type="datetime-local"
              id="viewing_datetime"
              name="viewing_datetime"
              value={formData.viewing_datetime}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.viewing_datetime ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.viewing_datetime && (
              <p className="text-red-500 text-sm mt-1">{errors.viewing_datetime}</p>
            )}
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELED">Canceled</option>
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes about the viewing..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Viewing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
