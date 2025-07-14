'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Property {
  id: number;
  street_address: string;
  town: string;
  parish_name: string;
}

interface Client {
  id: number;
  client_name: string;
  email: string;
}

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

interface NewViewingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ViewingFormData {
  property_listing: number | '';
  client: number | '';
  agent: number | '';
  viewing_datetime: string;
  notes: string;
}

export function NewViewingModal({ isOpen, onClose, onSuccess }: NewViewingFormProps) {
  const [formData, setFormData] = useState<ViewingFormData>({
    property_listing: '',
    client: '',
    agent: '',
    viewing_datetime: '',
    notes: ''
  });
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setDefaultDateTime();
    }
  }, [isOpen]);

  const setDefaultDateTime = () => {
    // Set default to tomorrow at 10 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const isoString = tomorrow.toISOString().slice(0, 16); // Format for datetime-local input
    setFormData(prev => ({
      ...prev,
      viewing_datetime: isoString
    }));
  };

  const fetchData = async () => {
    try {
      const [propertiesRes, clientsRes, agentsRes] = await Promise.all([
        api.get('/properties/listings/'),
        api.get('/clients/'),
        api.get('/users/users/')
      ]);
      
      setProperties(propertiesRes.data);
      setClients(clientsRes.data);
      setAgents(agentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        property_listing: parseInt(formData.property_listing.toString()),
        client: parseInt(formData.client.toString()),
        agent: parseInt(formData.agent.toString()),
        viewing_datetime: formData.viewing_datetime,
        notes: formData.notes || '',
        status: 'SCHEDULED'
      };

      await api.post('/viewings/', submitData);
      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error creating viewing:', error);
      if (error.response?.data) {
        const apiErrors: Record<string, string> = {};
        Object.keys(error.response.data).forEach(key => {
          if (Array.isArray(error.response.data[key])) {
            apiErrors[key] = error.response.data[key][0];
          } else {
            apiErrors[key] = error.response.data[key];
          }
        });
        setErrors(apiErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      property_listing: '',
      client: '',
      agent: '',
      viewing_datetime: '',
      notes: ''
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const formatPropertyDisplay = (property: Property) => {
    return `${property.street_address}, ${property.town}, ${property.parish_name}`;
  };

  const formatAgentDisplay = (agent: User) => {
    return agent.first_name && agent.last_name 
      ? `${agent.first_name} ${agent.last_name}`
      : agent.username;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Schedule New Viewing</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Property Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property *
            </label>
            <select
              name="property_listing"
              value={formData.property_listing}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.property_listing ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select Property</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {formatPropertyDisplay(property)}
                </option>
              ))}
            </select>
            {errors.property_listing && (
              <p className="text-red-500 text-sm mt-1">{errors.property_listing}</p>
            )}
          </div>

          {/* Client and Agent Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client *
              </label>
              <select
                name="client"
                value={formData.client}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.client ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select Client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.client_name}
                    {client.email && ` (${client.email})`}
                  </option>
                ))}
              </select>
              {errors.client && (
                <p className="text-red-500 text-sm mt-1">{errors.client}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agent *
              </label>
              <select
                name="agent"
                value={formData.agent}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.agent ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select Agent</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {formatAgentDisplay(agent)}
                  </option>
                ))}
              </select>
              {errors.agent && (
                <p className="text-red-500 text-sm mt-1">{errors.agent}</p>
              )}
            </div>
          </div>

          {/* Date and Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Viewing Date & Time *
            </label>
            <input
              type="datetime-local"
              name="viewing_datetime"
              value={formData.viewing_datetime}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.viewing_datetime ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.viewing_datetime && (
              <p className="text-red-500 text-sm mt-1">{errors.viewing_datetime}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Add any special instructions or notes for this viewing..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Scheduling...' : 'Schedule Viewing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
