'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Client {
  id: number;
  client_name: string;
  email: string;
  phone_number: string;
  client_type?: string;  // NEW
  moving_reason?: string;  // NEW
  urgency_level?: number;  // NEW
  areas_of_interest: number[]; // Changed to array
  area_of_interest_towns: string;
  budget_tier: number;
  mode_of_purchase: string;
  pre_qual_completed: boolean;
}

interface Parish {
  id: number;
  name: string;
}

interface BudgetTier {
  id: number;
  display_name: string;
}

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  client: Client;
  parishes: Parish[];
  budgetTiers: BudgetTier[];
}

export function EditClientModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  client,
  parishes,
  budgetTiers 
}: EditClientModalProps) {
  const [formData, setFormData] = useState({
    client_name: '',
    email: '',
    phone_number: '',
    client_type: '',  // NEW
    moving_reason: '',  // NEW
    urgency_level: 3,  // NEW
    areas_of_interest: [] as number[], // Changed to array
    area_of_interest_towns: '',
    budget_tier: '',
    mode_of_purchase: '',
    pre_qual_completed: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && client) {
      setFormData({
        client_name: client.client_name || '',
        email: client.email || '',
        phone_number: client.phone_number || '',
        client_type: client.client_type || '',  // NEW
        moving_reason: client.moving_reason || '',  // NEW
        urgency_level: client.urgency_level || 3,  // NEW
        areas_of_interest: client.areas_of_interest || [], // Initialize as array
        area_of_interest_towns: client.area_of_interest_towns || '',
        budget_tier: client.budget_tier?.toString() || '',
        mode_of_purchase: client.mode_of_purchase || '',
        pre_qual_completed: client.pre_qual_completed || false,
      });
      setError('');
    }
  }, [isOpen, client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = {
        ...formData,
        areas_of_interest: formData.areas_of_interest, // Send as array
        budget_tier: formData.budget_tier ? parseInt(formData.budget_tier) : null,
        email: formData.email || null,
        phone_number: formData.phone_number || '',
      };

      await api.put(`/clients/${client.id}/`, data);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating client:', error);
      setError(error.response?.data?.detail || 'Failed to update client');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Helper functions for multi-parish selection
  const addParish = (parishId: number) => {
    if (parishId && !formData.areas_of_interest.includes(parishId)) {
      setFormData(prev => ({
        ...prev,
        areas_of_interest: [...prev.areas_of_interest, parishId]
      }));
    }
  };

  const removeParish = (parishId: number) => {
    setFormData(prev => ({
      ...prev,
      areas_of_interest: prev.areas_of_interest.filter(id => id !== parishId)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Edit Client
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
            <label htmlFor="client_name" className="block text-sm font-medium text-gray-700 mb-1">
              Client Name *
            </label>
            <input
              type="text"
              id="client_name"
              name="client_name"
              value={formData.client_name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Client Classification */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Client Classification</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="client_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Client Type
                </label>
                <select
                  id="client_type"
                  name="client_type"
                  value={formData.client_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Client Type</option>
                  <option value="BUYER">Buyer</option>
                  <option value="SELLER">Seller</option>
                  <option value="BOTH">Both</option>
                </select>
              </div>

              <div>
                <label htmlFor="moving_reason" className="block text-sm font-medium text-gray-700 mb-1">
                  Moving Reason
                </label>
                <select
                  id="moving_reason"
                  name="moving_reason"
                  value={formData.moving_reason}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Reason</option>
                  <option value="UPSIZING">Upsizing</option>
                  <option value="DOWNSIZING">Downsizing</option>
                  <option value="RELOCATION">Relocation</option>
                  <option value="INVESTMENT">Investment</option>
                  <option value="FIRST_TIME_BUYER">First Time Buyer</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="urgency_level" className="block text-sm font-medium text-gray-700 mb-1">
                  Urgency Level (1-5)
                </label>
                <select
                  id="urgency_level"
                  name="urgency_level"
                  value={formData.urgency_level}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1 - Low</option>
                  <option value={2}>2 - Below Average</option>
                  <option value={3}>3 - Average</option>
                  <option value={4}>4 - High</option>
                  <option value={5}>5 - Urgent</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Areas of Interest - Parishes
            </label>
            
            {/* Selected Parish Tags */}
            {formData.areas_of_interest.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.areas_of_interest.map(parishId => {
                  const parish = parishes.find(p => p.id === parishId);
                  return parish ? (
                    <span
                      key={parishId}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {parish.name}
                      <button
                        type="button"
                        onClick={() => removeParish(parishId)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
            
            {/* Parish Dropdown */}
            <select
              value=""
              onChange={(e) => addParish(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Parish to Add</option>
              {parishes
                .filter(parish => !formData.areas_of_interest.includes(parish.id))
                .map(parish => (
                  <option key={parish.id} value={parish.id}>{parish.name}</option>
                ))}
            </select>
          </div>

          <div>
            <label htmlFor="area_of_interest_towns" className="block text-sm font-medium text-gray-700 mb-1">
              Towns of Interest
            </label>
            <input
              type="text"
              id="area_of_interest_towns"
              name="area_of_interest_towns"
              value={formData.area_of_interest_towns}
              onChange={handleChange}
              placeholder="e.g., Kingston, Spanish Town"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="budget_tier" className="block text-sm font-medium text-gray-700 mb-1">
              Budget Tier
            </label>
            <select
              id="budget_tier"
              name="budget_tier"
              value={formData.budget_tier}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Budget Tier</option>
              {budgetTiers.map(tier => (
                <option key={tier.id} value={tier.id}>
                  {tier.display_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="mode_of_purchase" className="block text-sm font-medium text-gray-700 mb-1">
              Mode of Purchase
            </label>
            <select
              id="mode_of_purchase"
              name="mode_of_purchase"
              value={formData.mode_of_purchase}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Mode</option>
              <option value="MORTGAGE">Mortgage</option>
              <option value="CASH">Cash</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="pre_qual_completed"
              name="pre_qual_completed"
              checked={formData.pre_qual_completed}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="pre_qual_completed" className="ml-2 block text-sm text-gray-900">
              Pre-qualification completed
            </label>
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
              {loading ? 'Updating...' : 'Update Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
