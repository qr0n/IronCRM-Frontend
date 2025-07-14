'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Parish {
  id: number;
  name: string;
}

interface BudgetTier {
  id: number;
  display_name: string;
}

interface NewClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (client?: any) => void;
  title?: string;
}

interface ClientFormData {
  client_name: string;
  email: string;
  phone_number: string;
  area_of_interest_parish: number | '';
  area_of_interest_towns: string;
  budget_tier: number | '';
  mode_of_purchase: 'MORTGAGE' | 'CASH' | '';
  pre_qual_completed: boolean;
}

export function NewClientModal({ isOpen, onClose, onSuccess, title = "Add New Client" }: NewClientFormProps) {
  const [formData, setFormData] = useState<ClientFormData>({
    client_name: '',
    email: '',
    phone_number: '',
    area_of_interest_parish: '',
    area_of_interest_towns: '',
    budget_tier: '',
    mode_of_purchase: '',
    pre_qual_completed: false
  });
  
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [budgetTiers, setBudgetTiers] = useState<BudgetTier[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const [parishesRes, budgetTiersRes] = await Promise.all([
        api.get('/settings/parishes/'),
        api.get('/settings/budget-tiers/')
      ]);
      
      setParishes(parishesRes.data);
      setBudgetTiers(budgetTiersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
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

    if (!formData.client_name.trim()) {
      newErrors.client_name = 'Client name is required';
    }
    
    if (formData.email && !formData.email.includes('@')) {
      newErrors.email = 'Please enter a valid email address';
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
        ...formData,
        area_of_interest_parish: formData.area_of_interest_parish || null,
        budget_tier: formData.budget_tier || null,
        mode_of_purchase: formData.mode_of_purchase || null,
        email: formData.email || null,
        phone_number: formData.phone_number || null,
      };

      const response = await api.post('/clients/', submitData);
      onSuccess(response.data);
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error creating client:', error);
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
      client_name: '',
      email: '',
      phone_number: '',
      area_of_interest_parish: '',
      area_of_interest_towns: '',
      budget_tier: '',
      mode_of_purchase: '',
      pre_qual_completed: false
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
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Basic Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Name *
            </label>
            <input
              type="text"
              name="client_name"
              value={formData.client_name}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.client_name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="John Smith"
            />
            {errors.client_name && (
              <p className="text-red-500 text-sm mt-1">{errors.client_name}</p>
            )}
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="876-555-0123"
              />
            </div>
          </div>

          {/* Area of Interest */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Area of Interest - Parish
            </label>
            <select
              name="area_of_interest_parish"
              value={formData.area_of_interest_parish}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Parish</option>
              {parishes.map(parish => (
                <option key={parish.id} value={parish.id}>{parish.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Areas of Interest - Towns
            </label>
            <textarea
              name="area_of_interest_towns"
              value={formData.area_of_interest_towns}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Kingston, New Kingston, Half Way Tree (comma-separated)"
            />
            <p className="text-gray-500 text-sm mt-1">Enter multiple towns separated by commas</p>
          </div>

          {/* Budget and Purchase Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget Tier
              </label>
              <select
                name="budget_tier"
                value={formData.budget_tier}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Budget Tier</option>
                {budgetTiers.map(tier => (
                  <option key={tier.id} value={tier.id}>{tier.display_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mode of Purchase
              </label>
              <select
                name="mode_of_purchase"
                value={formData.mode_of_purchase}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Mode</option>
                <option value="MORTGAGE">Mortgage</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
          </div>

          {/* Pre-qualification Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="pre_qual_completed"
              checked={formData.pre_qual_completed}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="ml-2 text-sm font-medium text-gray-700">
              Pre-qualification completed
            </label>
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
              {loading ? 'Creating...' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
