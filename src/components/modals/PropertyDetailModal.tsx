'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon, HomeIcon, MapPinIcon, CurrencyDollarIcon, UserIcon } from '@heroicons/react/24/outline';
import { api } from '@/lib/api';

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
  seller_client_name?: string;
  primary_picture_url: string;
  created_at: string;
  updated_at: string;
}

interface PropertyPicture {
  id: number;
  image: string;
  caption: string;
  is_primary: boolean;
}

interface PropertyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: number;
}

export default function PropertyDetailModal({ isOpen, onClose, propertyId }: PropertyDetailModalProps) {
  const [property, setProperty] = useState<Property | null>(null);
  const [pictures, setPictures] = useState<PropertyPicture[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && propertyId) {
      fetchPropertyDetails();
    }
  }, [isOpen, propertyId]);

  const fetchPropertyDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/properties/listings/${propertyId}/`);
      setProperty(response.data);
      setPictures(response.data.pictures || []);
    } catch (error) {
      console.error('Error fetching property details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Property Details
          </h3>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading property details...</p>
          </div>
        ) : property ? (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Property Images */}
              <div>
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg overflow-hidden mb-4">
                  {property.primary_picture_url ? (
                    <img
                      src={property.primary_picture_url}
                      alt={property.street_address}
                      className="w-full h-64 object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-400">
                      <HomeIcon className="h-16 w-16" />
                    </div>
                  )}
                </div>
                
                {pictures.length > 1 && (
                  <div className="grid grid-cols-3 gap-2">
                    {pictures.slice(1, 4).map((picture) => (
                      <img
                        key={picture.id}
                        src={picture.image}
                        alt={picture.caption}
                        className="w-full h-20 object-cover rounded"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Property Information */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {property.street_address}
                  </h2>
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPinIcon className="h-5 w-5 mr-2" />
                    {property.town}, {property.parish_name}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      property.listing_type === 'FOR_SALE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {property.listing_type === 'FOR_SALE' ? 'For Sale' : 'For Rent'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      property.status === 'LISTED' ? 'bg-green-100 text-green-800' :
                      property.status === 'OFFER_ACCEPTED' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {property.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center text-gray-700">
                      <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                      <span className="text-3xl font-bold text-blue-600">
                        {formatPrice(property.listing_type === 'FOR_SALE' 
                          ? property.listing_price 
                          : property.rental_price)}
                        {property.listing_type === 'FOR_RENT' && (
                          <span className="text-lg font-normal text-gray-600">/month</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-gray-700">
                      <UserIcon className="h-5 w-5 mr-2" />
                      <span>
                        <strong>Agent:</strong> {property.agent_name}
                      </span>
                    </div>
                    
                    {property.seller_client_name && (
                      <div className="flex items-center text-gray-700">
                        <UserIcon className="h-5 w-5 mr-2" />
                        <span>
                          <strong>Seller:</strong> {property.seller_client_name}
                        </span>
                      </div>
                    )}

                    <div className="text-gray-600 text-sm">
                      <p><strong>Listed:</strong> {new Date(property.created_at).toLocaleDateString()}</p>
                      <p><strong>Updated:</strong> {new Date(property.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            Property not found
          </div>
        )}

        <div className="px-6 py-3 bg-gray-50 flex justify-end">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
