'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Client {
  id: number;
  client_name: string;
  email: string;
  phone_number: string;
  area_of_interest_parish: number;
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
    area_of_interest_parish: '',
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
        area_of_interest_parish: client.area_of_interest_parish?.toString() || '',
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
        area_of_interest_parish: formData.area_of_interest_parish ? parseInt(formData.area_of_interest_parish) : null,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
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

          <div>
            <label htmlFor="area_of_interest_parish" className="block text-sm font-medium text-gray-700 mb-1">
              Area of Interest (Parish)
            </label>
            <select
              id="area_of_interest_parish"
              name="area_of_interest_parish"
              value={formData.area_of_interest_parish}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Parish</option>
              {parishes.map(parish => (
                <option key={parish.id} value={parish.id}>
                  {parish.name}
                </option>
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
