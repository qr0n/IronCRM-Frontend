'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { XMarkIcon, UserPlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import { NewClientModal } from './NewClientModal';

interface Parish {
  id: number;
  name: string;
}

interface Client {
  id: number;
  client_name: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
}

interface Property {
  id: number;
  street_address: string;
  town: string;
  parish: number;
  parish_name: string;
  listing_type: 'FOR_SALE' | 'FOR_RENT';
  status: string;
  listing_price: number;
  rental_price: number | null;
  agent: number | null;
  agent_name: string;
  seller_client: number | null;
  seller_client_name?: string;
  primary_picture_url?: string;
  created_at: string;
  updated_at: string;
}

interface EditPropertyFormData {
  street_address: string;
  town: string;
  parish: number | '';
  listing_type: 'FOR_SALE' | 'FOR_RENT' | '';
  listing_price: string;
  rental_price: string;
  seller_client: number | '';
  agent: number | '';
  image: File | null;
}

interface EditPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  property: Property;
}

export function EditPropertyModal({ isOpen, onClose, onSuccess, property }: EditPropertyModalProps) {
  const [formData, setFormData] = useState<EditPropertyFormData>({
    street_address: '',
    town: '',
    parish: '',
    listing_type: '',
    listing_price: '',
    rental_price: '',
    seller_client: '',
    agent: '',
    image: null
  });

  const [parishes, setParishes] = useState<Parish[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && property) {
      // Initialize form with property data
      setFormData({
        street_address: property.street_address,
        town: property.town,
        parish: property.parish,
        listing_type: property.listing_type,
        listing_price: property.listing_price?.toString() || '0',
        rental_price: property.rental_price?.toString() || '0',
        seller_client: property.seller_client || '',
        agent: property.agent || '',
        image: null
      });
      fetchData();
    }
  }, [isOpen, property]);

  const fetchData = async () => {
    try {
      const [parishesRes, clientsRes, agentsRes] = await Promise.all([
        api.get('/settings/parishes/'),
        api.get('/clients/'),
        api.get('/users/users/')
      ]);
      
      setParishes(parishesRes.data);
      setClients(clientsRes.data);
      setAgents(agentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      image: file
    }));
    
    // Clear error when user selects a file
    if (errors.image) {
      setErrors(prev => ({
        ...prev,
        image: ''
      }));
    }
  };

  const handleClientCreated = (newClient: Client) => {
    // Add the new client to the clients list
    setClients(prev => [...prev, newClient]);
    // Select the new client in the form
    setFormData(prev => ({
      ...prev,
      seller_client: newClient.id
    }));
    setIsClientModalOpen(false);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.street_address.trim()) {
      newErrors.street_address = 'Street address is required';
    }
    if (!formData.town.trim()) {
      newErrors.town = 'Town is required';
    }
    if (!formData.parish) {
      newErrors.parish = 'Parish is required';
    }
    if (!formData.listing_type) {
      newErrors.listing_type = 'Listing type is required';
    }

    // Validate prices based on listing type
    if (formData.listing_type === 'FOR_SALE') {
      if (!formData.listing_price || parseFloat(formData.listing_price) <= 0) {
        newErrors.listing_price = 'Valid listing price is required for sale properties';
      }
    } else if (formData.listing_type === 'FOR_RENT') {
      if (!formData.rental_price || parseFloat(formData.rental_price) <= 0) {
        newErrors.rental_price = 'Valid rental price is required for rental properties';
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
    setErrors({});

    try {
      const formDataToSubmit = new FormData();
      
      // Add all form fields
      formDataToSubmit.append('street_address', formData.street_address);
      formDataToSubmit.append('town', formData.town);
      formDataToSubmit.append('parish', formData.parish.toString());
      formDataToSubmit.append('listing_type', formData.listing_type);
      
      // Add prices based on listing type
      if (formData.listing_type === 'FOR_SALE') {
        formDataToSubmit.append('listing_price', formData.listing_price);
        formDataToSubmit.append('rental_price', '0');
      } else {
        formDataToSubmit.append('listing_price', '0');
        formDataToSubmit.append('rental_price', formData.rental_price);
      }
      
      // Add optional fields
      if (formData.seller_client) {
        formDataToSubmit.append('seller_client', formData.seller_client.toString());
      }
      if (formData.agent) {
        formDataToSubmit.append('agent', formData.agent.toString());
      }
      if (formData.image) {
        formDataToSubmit.append('image', formData.image);
      }

      await api.patch(`/properties/listings/${property.id}/`, formDataToSubmit, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error updating property:', error);
      if (error.response?.data) {
        setErrors(error.response.data);
      } else {
        setErrors({ general: 'Failed to update property. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      street_address: '',
      town: '',
      parish: '',
      listing_type: '',
      listing_price: '',
      rental_price: '',
      seller_client: '',
      agent: '',
      image: null
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <PencilIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Property</h2>
              <p className="text-sm text-gray-500">{property.street_address}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Property Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                name="street_address"
                value={formData.street_address}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.street_address ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="123 Main Street"
              />
              {errors.street_address && (
                <p className="text-red-500 text-sm mt-1">{errors.street_address}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Town *
              </label>
              <input
                type="text"
                name="town"
                value={formData.town}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.town ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Kingston"
              />
              {errors.town && (
                <p className="text-red-500 text-sm mt-1">{errors.town}</p>
              )}
            </div>
          </div>

          {/* Parish and Listing Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parish *
              </label>
              <select
                name="parish"
                value={formData.parish}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.parish ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select Parish</option>
                {parishes.map(parish => (
                  <option key={parish.id} value={parish.id}>{parish.name}</option>
                ))}
              </select>
              {errors.parish && (
                <p className="text-red-500 text-sm mt-1">{errors.parish}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Listing Type *
              </label>
              <select
                name="listing_type"
                value={formData.listing_type}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.listing_type ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select Listing Type</option>
                <option value="FOR_SALE">For Sale</option>
                <option value="FOR_RENT">For Rent</option>
              </select>
              {errors.listing_type && (
                <p className="text-red-500 text-sm mt-1">{errors.listing_type}</p>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.listing_type === 'FOR_SALE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Listing Price (USD) *
                </label>
                <input
                  type="number"
                  name="listing_price"
                  value={formData.listing_price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.listing_price ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="500000"
                />
                {errors.listing_price && (
                  <p className="text-red-500 text-sm mt-1">{errors.listing_price}</p>
                )}
              </div>
            )}

            {formData.listing_type === 'FOR_RENT' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Rental Price (USD) *
                </label>
                <input
                  type="number"
                  name="rental_price"
                  value={formData.rental_price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.rental_price ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="2500"
                />
                {errors.rental_price && (
                  <p className="text-red-500 text-sm mt-1">{errors.rental_price}</p>
                )}
              </div>
            )}
          </div>

          {/* Client and Agent */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seller/Client (Optional)
              </label>
              <div className="flex gap-2">
                <select
                  name="seller_client"
                  value={formData.seller_client}
                  onChange={handleInputChange}
                  className={`flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.seller_client ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.client_name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(true)}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  title="Add New Client"
                >
                  <UserPlusIcon className="h-4 w-4" />
                </button>
              </div>
              {errors.seller_client && (
                <p className="text-red-500 text-sm mt-1">{errors.seller_client}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned Agent (Optional)
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
                    {agent.first_name} {agent.last_name}
                  </option>
                ))}
              </select>
              {errors.agent && (
                <p className="text-red-500 text-sm mt-1">{errors.agent}</p>
              )}
            </div>
          </div>

          {/* Property Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property Image (Optional)
            </label>
            <input
              type="file"
              name="image"
              onChange={handleFileChange}
              accept="image/*"
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.image ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.image && (
              <p className="text-red-500 text-sm mt-1">{errors.image}</p>
            )}
            {property.primary_picture_url && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-2">Current image:</p>
                <img
                  src={property.primary_picture_url}
                  alt="Current property"
                  className="w-32 h-24 object-cover rounded-lg border"
                />
              </div>
            )}
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
              {loading ? 'Updating...' : 'Update Property'}
            </button>
          </div>
        </form>
      </div>

      {/* New Client Modal */}
      <NewClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSuccess={handleClientCreated}
        title="Add New Client"
      />
    </div>
  );
}
