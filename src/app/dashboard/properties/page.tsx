'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { NewPropertyModal } from '@/components/forms/NewPropertyModal';
import { PropertySearchBar } from '@/components/search/PropertySearchBar';
import { PlusIcon } from '@heroicons/react/24/outline';

interface Property {
  id: number;
  street_address: string;
  town: string;
  parish_name: string;
  listing_type: 'FOR_SALE' | 'FOR_RENT';
  status: string;
  listing_price: number;
  rental_price: number;
  agent_name: string;
  primary_picture_url: string;
  created_at: string;
}

interface Parish {
  id: number;
  name: string;
}

interface PropertySearchParams {
  query?: string;
  parish?: number;
  town?: string;
  minPrice?: number;
  maxPrice?: number;
  listingType?: 'FOR_SALE' | 'FOR_RENT';
}

export default function PropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchProperties();
    fetchParishes();
  }, []);

  const fetchProperties = async (searchParams?: PropertySearchParams) => {
    try {
      setLoading(true);
      const response = await api.get('/properties/listings/', { params: searchParams });
      setProperties(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParishes = async () => {
    try {
      const response = await api.get('/settings/parishes/');
      setParishes(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching parishes:', error);
    }
  };

  const handleSearch = (searchParams: PropertySearchParams) => {
    fetchProperties(searchParams);
  };

  const handlePropertyCreated = () => {
    setIsModalOpen(false);
    fetchProperties();
  };

  const handleViewDetails = (propertyId: number) => {
    router.push(`/dashboard/properties/${propertyId}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Property</span>
        </button>
      </div>

      <PropertySearchBar parishes={parishes} onSearch={handleSearch} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <div key={property.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Property Image */}
            <div className="h-48 bg-gray-200 relative">
              {property.primary_picture_url ? (
                <img
                  src={property.primary_picture_url}
                  alt={property.street_address}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image Available
                </div>
              )}
              <div className="absolute top-2 right-2">
                <span 
                  className={`px-2 py-1 text-xs rounded-full font-medium ${
                    property.listing_type === 'FOR_SALE' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {property.listing_type === 'FOR_SALE' ? 'For Sale' : 'For Rent'}
                </span>
              </div>
            </div>

            {/* Property Details */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {property.street_address}
              </h3>
              
              <div className="text-gray-600 text-sm mb-2 flex items-center">
                <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {property.town}, {property.parish_name}
              </div>

              <div className="mb-3">
                <span className="text-2xl font-bold text-blue-600">
                  {formatPrice(property.listing_type === 'FOR_SALE' 
                    ? property.listing_price 
                    : property.rental_price)}
                  {property.listing_type === 'FOR_RENT' && <span className="text-sm">/month</span>}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                <span>Agent: {property.agent_name || 'Unassigned'}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  property.status === 'LISTED' ? 'bg-green-100 text-green-800' :
                  property.status === 'OFFER_ACCEPTED' ? 'bg-yellow-100 text-yellow-800' :
                  property.status === 'CONTRACT_SIGNED' ? 'bg-blue-100 text-blue-800' :
                  property.status === 'CLOSED' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {property.status.replace('_', ' ')}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">
                  Listed: {new Date(property.created_at).toLocaleDateString()}
                </span>
                <button 
                  onClick={() => handleViewDetails(property.id)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                >
                  Track Progress →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {properties.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">No properties found</div>
          <p className="text-gray-500 mt-2">Try adjusting your search criteria</p>
        </div>
      )}

      <NewPropertyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handlePropertyCreated}
        parishes={parishes}
      />
    </div>
  );
}
