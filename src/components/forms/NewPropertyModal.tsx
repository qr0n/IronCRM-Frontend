'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline';
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
  username: string;
  first_name: string;
  last_name: string;
}

interface NewPropertyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parishes: Parish[];
}

interface PropertyFormData {
  listing_type: 'FOR_SALE' | 'FOR_RENT';
  street_address: string;
  town: string;
  parish: number | '';
  property_type: string;
  bedrooms: string;
  bathrooms: string;
  description: string;  // NEW
  listing_price: string;
  rental_price: string;
  custom_commission_rate: string;  // NEW
  custom_agent_split: string;  // NEW
  seller_client: number | '';
  agent: number | '';
  image: File | null;
  image_caption: string;
}

export function NewPropertyModal({ isOpen, onClose, onSuccess, parishes }: NewPropertyFormProps) {
  const [formData, setFormData] = useState<PropertyFormData>({
    listing_type: 'FOR_SALE',
    street_address: '',
    town: '',
    parish: '',
    property_type: '',
    bedrooms: '',
    bathrooms: '',
    description: '',  // NEW
    listing_price: '',
    rental_price: '',
    custom_commission_rate: '',  // NEW
    custom_agent_split: '',  // NEW
    seller_client: '',
    agent: '',
    image: null,
    image_caption: ''
  });
  
  const [clients, setClients] = useState<Client[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const [clientsRes, agentsRes] = await Promise.all([
        api.get('/clients/'),
        api.get('/users/users/')
      ]);
      
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
    
    // Price validation based on listing type
    if (formData.listing_type === 'FOR_SALE') {
      if (!formData.listing_price || parseFloat(formData.listing_price) <= 0) {
        newErrors.listing_price = 'Valid listing price is required for sale properties';
      }
    } else {
      if (!formData.rental_price || parseFloat(formData.rental_price) <= 0) {
        newErrors.rental_price = 'Valid rental price is required for rental properties';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission started');
    console.log('Form data:', {
      ...formData,
      image: formData.image ? { name: formData.image.name, size: formData.image.size } : null
    });

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setLoading(true);
    try {
      // Create FormData for file upload
      const formDataToSubmit = new FormData();
      
      // Add all form fields
      formDataToSubmit.append('listing_type', formData.listing_type);
      formDataToSubmit.append('street_address', formData.street_address);
      formDataToSubmit.append('town', formData.town);
      formDataToSubmit.append('parish', formData.parish.toString());
      
      // Add new property characteristics
      if (formData.property_type) {
        formDataToSubmit.append('property_type', formData.property_type);
      }
      if (formData.bedrooms) {
        formDataToSubmit.append('bedrooms', formData.bedrooms);
      }
      if (formData.bathrooms) {
        formDataToSubmit.append('bathrooms', formData.bathrooms);
      }
      
      // Add description if provided
      if (formData.description.trim()) {
        formDataToSubmit.append('description', formData.description);
      }
      
      // Add custom commission settings if provided
      if (formData.custom_commission_rate) {
        formDataToSubmit.append('custom_commission_rate', formData.custom_commission_rate);
      }
      
      if (formData.custom_agent_split) {
        formDataToSubmit.append('custom_agent_split', formData.custom_agent_split);
      }
      
      if (formData.seller_client) {
        formDataToSubmit.append('seller_client', formData.seller_client.toString());
      }
      
      if (formData.agent) {
        formDataToSubmit.append('agent', formData.agent.toString());
      }
      
      if (formData.listing_type === 'FOR_SALE' && formData.listing_price) {
        formDataToSubmit.append('listing_price', formData.listing_price);
      }
      
      if (formData.listing_type === 'FOR_RENT' && formData.rental_price) {
        formDataToSubmit.append('rental_price', formData.rental_price);
      }

      // Create the property first
      const propertyResponse = await api.post('/properties/listings/', formDataToSubmit);

      // If there's an image, upload it as a property picture
      if (formData.image) {
        console.log('Uploading image for property ID:', propertyResponse.data.id);
        console.log('Image file:', formData.image.name, 'Size:', formData.image.size);
        
        const pictureFormData = new FormData();
        pictureFormData.append('property_listing', propertyResponse.data.id.toString());
        pictureFormData.append('image', formData.image);
        pictureFormData.append('caption', formData.image_caption || '');
        pictureFormData.append('is_primary', 'true');

        try {
          const pictureResponse = await api.post('/properties/pictures/', pictureFormData);
          console.log('Image upload successful:', pictureResponse.data);
        } catch (imageError) {
          console.error('Error uploading image:', imageError);
          // Don't fail the entire operation if image upload fails
        }
      } else {
        console.log('No image to upload');
      }

      // Small delay to ensure the image is processed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error creating property:', error);
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
      listing_type: 'FOR_SALE',
      street_address: '',
      town: '',
      parish: '',
      property_type: '',
      bedrooms: '',
      bathrooms: '',
      description: '',  // NEW
      listing_price: '',
      rental_price: '',
      custom_commission_rate: '',  // NEW
      custom_agent_split: '',  // NEW
      seller_client: '',
      agent: '',
      image: null,
      image_caption: ''
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add New Property</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Listing Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Listing Type *
            </label>
            <select
              name="listing_type"
              value={formData.listing_type}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="FOR_SALE">For Sale</option>
              <option value="FOR_RENT">For Rent</option>
            </select>
          </div>

          {/* Address Information */}
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

          {/* Property Characteristics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Type
              </label>
              <select
                name="property_type"
                value={formData.property_type}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.property_type ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select Property Type</option>
                <option value="APARTMENT">Apartment</option>
                <option value="HOUSE">House</option>
                <option value="TOWNHOUSE">Townhouse</option>
                <option value="STUDIO_APT">Studio Apt</option>
                <option value="COMMERCIAL_BLDG_OFFICES">Commercial Bldg/Offices</option>
                <option value="COMMERCIAL_LOT">Commercial Lot</option>
                <option value="COMMERCIAL_SPACES_OFFICES">Commercial Spaces/Offices</option>
                <option value="DEVELOPMENT_LAND_COMMERCIAL">Development Land (Commercial)</option>
                <option value="DEVELOPMENT_LAND_RESIDENTIAL">Development Land (Residential)</option>
                <option value="FACTORY">Factory</option>
                <option value="FARM_AGRICULTURE">Farm/Agriculture</option>
                <option value="FRACTIONAL_OWNERSHIP">Fractional Ownership</option>
                <option value="HOTEL">Hotel</option>
                <option value="RESIDENTIAL_LOT">Residential Lot</option>
                <option value="RESORT_APARTMENT">Resort Apartment</option>
                <option value="RESORT_APARTMENT_VILLA">Resort Apartment/Villa</option>
                <option value="RESORT_LAND">Resort Land</option>
                <option value="RETAIL_SPACE">Retail Space</option>
                <option value="WAREHOUSE">Warehouse</option>
              </select>
              {errors.property_type && (
                <p className="text-red-500 text-sm mt-1">{errors.property_type}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bedrooms
              </label>
              <select
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.bedrooms ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select Bedrooms</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4+">4+</option>
              </select>
              {errors.bedrooms && (
                <p className="text-red-500 text-sm mt-1">{errors.bedrooms}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bathrooms
              </label>
              <select
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.bathrooms ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select Bathrooms</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4+">4+</option>
              </select>
              {errors.bathrooms && (
                <p className="text-red-500 text-sm mt-1">{errors.bathrooms}</p>
              )}
            </div>
          </div>

          {/* Property Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe the property features, amenities, and highlights..."
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Price Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.listing_type === 'FOR_SALE' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Listing Price ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="listing_price"
                  value={formData.listing_price}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.listing_price ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="250000"
                />
                {errors.listing_price && (
                  <p className="text-red-500 text-sm mt-1">{errors.listing_price}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Rental Price ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="rental_price"
                  value={formData.rental_price}
                  onChange={handleInputChange}
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

          {/* Custom Commission Settings (Optional) */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Custom Commission Settings (Optional)</h3>
            <p className="text-sm text-gray-600 mb-4">Leave blank to use system default rates</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commission Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  name="custom_commission_rate"
                  value={formData.custom_commission_rate}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.custom_commission_rate ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="3.5"
                />
                {errors.custom_commission_rate && (
                  <p className="text-red-500 text-sm mt-1">{errors.custom_commission_rate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agent Split (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  name="custom_agent_split"
                  value={formData.custom_agent_split}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.custom_agent_split ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="60.0"
                />
                {errors.custom_agent_split && (
                  <p className="text-red-500 text-sm mt-1">{errors.custom_agent_split}</p>
                )}
              </div>
            </div>
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
                    {agent.first_name && agent.last_name 
                      ? `${agent.first_name} ${agent.last_name}`
                      : agent.username}
                  </option>
                ))}
              </select>
              {errors.agent && (
                <p className="text-red-500 text-sm mt-1">{errors.agent}</p>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Image (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.image ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.image && (
                <p className="text-red-500 text-sm mt-1">{errors.image}</p>
              )}
              
              {/* Image Preview */}
              {formData.image && (
                <div className="mt-2">
                  <img
                    src={URL.createObjectURL(formData.image)}
                    alt="Property preview"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                  />
                </div>
              )}
            </div>

            {formData.image && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image Caption (Optional)
                </label>
                <input
                  type="text"
                  name="image_caption"
                  value={formData.image_caption}
                  onChange={handleInputChange}
                  placeholder="Enter a description for this image..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              {loading ? 'Creating...' : 'Create Property'}
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
