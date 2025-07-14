'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import NotesComponent from '@/components/NotesComponent';
import { EditPropertyModal } from '@/components/forms/EditPropertyModal';
import { 
  ArrowLeftIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  PencilIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

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
  seller_client_email?: string;
  seller_client_phone?: string;
  primary_picture_url: string;
  created_at: string;
  updated_at: string;
  last_contacted?: string;
}

interface StatusStep {
  id: string;
  label: string;
  description: string;
}

const SALE_STATUSES: StatusStep[] = [
  { id: 'LISTED', label: 'Listed', description: 'Property is active on the market' },
  { id: 'OFFER_ACCEPTED', label: 'Offer Accepted', description: 'Seller has accepted an offer' },
  { id: 'CONTRACT_SIGNED', label: 'Contract Signed', description: 'Purchase agreement executed' },
  { id: 'CLOSED', label: 'Closed', description: 'Sale completed and transferred' }
];

const RENTAL_STATUSES: StatusStep[] = [
  { id: 'LISTED', label: 'Listed', description: 'Property is available for rent' },
  { id: 'OFFER_ACCEPTED', label: 'Application Approved', description: 'Tenant application approved' },
  { id: 'CONTRACT_SIGNED', label: 'Lease Signed', description: 'Lease agreement executed' },
  { id: 'LEASED', label: 'Leased', description: 'Tenant moved in and rent active' }
];

export default function PropertyProgressPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      const response = await api.get(`/properties/listings/${propertyId}/`);
      setProperty(response.data);
      setNewStatus(response.data.status);
    } catch (error) {
      console.error('Error fetching property:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePropertyStatus = async () => {
    if (!property || newStatus === property.status) return;
    
    setUpdating(true);
    try {
      await api.patch(`/properties/listings/${propertyId}/`, {
        status: newStatus
      });
      setProperty({ ...property, status: newStatus });
      setEditingStatus(false);
      alert('Property status updated successfully!');
    } catch (error) {
      console.error('Error updating property status:', error);
      alert('Error updating property status');
    } finally {
      setUpdating(false);
    }
  };

  const handlePropertyUpdated = () => {
    fetchProperty();
    setIsEditModalOpen(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusSteps = () => {
    return property?.listing_type === 'FOR_SALE' ? SALE_STATUSES : RENTAL_STATUSES;
  };

  const getCurrentStepIndex = () => {
    if (!property) return 0;
    const steps = getStatusSteps();
    return steps.findIndex(step => step.id === property.status);
  };

  const getStepStatus = (stepIndex: number) => {
    const currentIndex = getCurrentStepIndex();
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Property not found</h2>
        <button
          onClick={() => router.back()}
          className="mt-4 btn-primary"
        >
          Go Back
        </button>
      </div>
    );
  }

  const statusSteps = getStatusSteps();
  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Property Progress</h1>
            <p className="text-gray-600">{property.street_address}, {property.town}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-500">
              {property.listing_type === 'FOR_SALE' ? 'For Sale' : 'For Rent'}
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {formatPrice(property.listing_type === 'FOR_SALE' 
                ? property.listing_price 
                : (property.rental_price || 0))}
              {property.listing_type === 'FOR_RENT' && <span className="text-lg font-normal">/month</span>}
            </div>
          </div>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PencilIcon className="h-4 w-4" />
            <span>Edit Property</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Property Status Progress</h2>
          <button
            onClick={() => setEditingStatus(!editingStatus)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
          >
            <PencilIcon className="h-4 w-4" />
            <span>Update Status</span>
          </button>
        </div>

        {/* Status Update Form */}
        {editingStatus && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {statusSteps.map((step) => (
                  <option key={step.id} value={step.id}>
                    {step.label}
                  </option>
                ))}
              </select>
              <button
                onClick={updatePropertyStatus}
                disabled={updating || newStatus === property.status}
                className="btn-primary disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update'}
              </button>
              <button
                onClick={() => setEditingStatus(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="relative">
          <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200"></div>
          <div 
            className="absolute top-5 left-0 h-0.5 bg-blue-600 transition-all duration-500"
            style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
          ></div>
          
          <div className="relative flex justify-between">
            {statusSteps.map((step, index) => {
              const status = getStepStatus(index);
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    status === 'completed' ? 'bg-blue-600 text-white' :
                    status === 'current' ? 'bg-blue-100 text-blue-600 border-2 border-blue-600' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {status === 'completed' ? (
                      <CheckIcon className="h-5 w-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div className={`text-sm font-medium ${
                      status === 'current' ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {step.label}
                    </div>
                    <div className="text-xs text-gray-500 max-w-24">
                      {step.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Property Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Property Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">{property.street_address}</div>
                <div className="text-gray-600">{property.town}, {property.parish_name}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">
                  {formatPrice(property.listing_type === 'FOR_SALE' 
                    ? property.listing_price 
                    : (property.rental_price || 0))}
                  {property.listing_type === 'FOR_RENT' && <span className="text-sm text-gray-600">/month</span>}
                </div>
                <div className="text-gray-600">
                  {property.listing_type === 'FOR_SALE' ? 'Sale Price' : 'Monthly Rent'}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">
                  {new Date(property.created_at).toLocaleDateString()}
                </div>
                <div className="text-gray-600">Date Listed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Agent & Client Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">People Involved</h3>
          <div className="space-y-6">
            {/* Agent Info */}
            <div>
              <div className="text-sm font-medium text-gray-500 mb-2">Assigned Agent</div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{property.agent_name}</div>
                  <div className="text-gray-600">Real Estate Agent</div>
                </div>
              </div>
            </div>

            {/* Client Info */}
            {property.seller_client_name && (
              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">
                  Client Information
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <UserIcon className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{property.seller_client_name}</span>
                  </div>
                  {property.seller_client_email && (
                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{property.seller_client_email}</span>
                    </div>
                  )}
                  {property.seller_client_phone && (
                    <div className="flex items-center space-x-3">
                      <PhoneIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{property.seller_client_phone}</span>
                    </div>
                  )}
                  {property.last_contacted && (
                    <div className="flex items-center space-x-3">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        Last contacted: {new Date(property.last_contacted).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Property Image */}
        {property.primary_picture_url && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Image</h3>
            <div className="rounded-lg overflow-hidden">
              <img
                src={property.primary_picture_url}
                alt={property.street_address}
                className="w-full h-48 object-cover"
              />
            </div>
          </div>
        )}

        {/* Notes Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <NotesComponent
            objectType="property"
            objectId={property.id}
            modelName="propertylisting"
            appLabel="properties"
          />
        </div>
      </div>

      {/* Edit Property Modal */}
      {property && (
        <EditPropertyModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handlePropertyUpdated}
          property={property}
        />
      )}
    </div>
  );
}
