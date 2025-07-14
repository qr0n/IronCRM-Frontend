'use client';

import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface Parish {
  id: number;
  name: string;
}

interface BudgetTier {
  id: number;
  display_name: string;
}

interface ClientSearchParams {
  query?: string;
  parish?: number;
  budgetTier?: number;
  preQualified?: boolean;
  modeOfPurchase?: 'MORTGAGE' | 'CASH';
  lastContactedDays?: number;
}

interface ClientSearchBarProps {
  onSearch: (params: ClientSearchParams) => void;
  parishes?: Parish[];
  budgetTiers?: BudgetTier[];
  showFilters?: boolean;
}

export function ClientSearchBar({ 
  onSearch, 
  parishes = [],
  budgetTiers = [],
  showFilters = true
}: ClientSearchBarProps) {
  const [query, setQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState<Omit<ClientSearchParams, 'query'>>({});
  const [searchType, setSearchType] = useState<'all' | 'name' | 'email' | 'phone'>('all');

  const handleSearch = () => {
    const searchParams: ClientSearchParams = {
      query: query.trim() || undefined,
      ...filters
    };
    
    onSearch(searchParams);
  };

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  const clearAll = () => {
    setQuery('');
    setFilters({});
    onSearch({});
  };

  const getQuickFilters = () => [
    {
      id: 'recent',
      label: 'Recently Contacted',
      active: filters.lastContactedDays === 7,
      onClick: () => handleFilterChange('lastContactedDays', filters.lastContactedDays === 7 ? undefined : 7)
    },
    {
      id: 'overdue',
      label: 'Overdue Contact',
      active: filters.lastContactedDays === 30,
      onClick: () => handleFilterChange('lastContactedDays', filters.lastContactedDays === 30 ? undefined : 30)
    },
    {
      id: 'prequalified',
      label: 'Pre-qualified',
      active: filters.preQualified === true,
      onClick: () => handleFilterChange('preQualified', filters.preQualified === true ? undefined : true)
    },
    {
      id: 'cash',
      label: 'Cash Buyers',
      active: filters.modeOfPurchase === 'CASH',
      onClick: () => handleFilterChange('modeOfPurchase', filters.modeOfPurchase === 'CASH' ? undefined : 'CASH')
    }
  ];

  // Auto-search when filters change
  useEffect(() => {
    if (Object.keys(filters).some(key => filters[key as keyof typeof filters] !== undefined)) {
      handleSearch();
    }
  }, [filters]);

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Search Type Selector */}
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Fields</option>
          <option value="name">Name Only</option>
          <option value="email">Email Only</option>
          <option value="phone">Phone Only</option>
        </select>

        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
        
        {showFilters && (
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
              showAdvancedFilters 
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="h-4 w-4" />
            Filters
          </button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {getQuickFilters().map(filter => (
          <button
            key={filter.id}
            onClick={filter.onClick}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter.active
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPinIcon className="h-4 w-4 inline mr-1" />
              Parish
            </label>
            <select
              value={filters.parish || ''}
              onChange={(e) => handleFilterChange('parish', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Parishes</option>
              {parishes.map(parish => (
                <option key={parish.id} value={parish.id}>{parish.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
              Budget Tier
            </label>
            <select
              value={filters.budgetTier || ''}
              onChange={(e) => handleFilterChange('budgetTier', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Budget Tiers</option>
              {budgetTiers.map(tier => (
                <option key={tier.id} value={tier.id}>{tier.display_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pre-qualification</label>
            <select
              value={filters.preQualified === undefined ? '' : filters.preQualified.toString()}
              onChange={(e) => handleFilterChange('preQualified', e.target.value === '' ? undefined : e.target.value === 'true')}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Clients</option>
              <option value="true">Pre-qualified</option>
              <option value="false">Not Pre-qualified</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Mode</label>
            <select
              value={filters.modeOfPurchase || ''}
              onChange={(e) => handleFilterChange('modeOfPurchase', e.target.value || undefined)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Modes</option>
              <option value="MORTGAGE">Mortgage</option>
              <option value="CASH">Cash</option>
            </select>
          </div>

          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Contacted</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleFilterChange('lastContactedDays', filters.lastContactedDays === 7 ? undefined : 7)}
                className={`px-3 py-2 text-sm border rounded ${
                  filters.lastContactedDays === 7 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Last 7 days
              </button>
              <button
                onClick={() => handleFilterChange('lastContactedDays', filters.lastContactedDays === 30 ? undefined : 30)}
                className={`px-3 py-2 text-sm border rounded ${
                  filters.lastContactedDays === 30 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Last 30 days
              </button>
              <button
                onClick={() => handleFilterChange('lastContactedDays', filters.lastContactedDays === 90 ? undefined : 90)}
                className={`px-3 py-2 text-sm border rounded ${
                  filters.lastContactedDays === 90 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Last 90 days
              </button>
            </div>
          </div>

          <div className="md:col-span-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {Object.keys(filters).filter(key => filters[key as keyof typeof filters] !== undefined).length} filters active
            </div>
            <button
              onClick={clearAll}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* Search Instructions */}
      {query === '' && Object.keys(filters).length === 0 && (
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <UserIcon className="h-4 w-4" />
            <span className="font-medium">Search Tips:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Search by client name, email address, or phone number</li>
            <li>Use quick filters for common searches (Recent, Pre-qualified, Cash buyers)</li>
            <li>Combine search text with filters for precise results</li>
            <li>Filter by parish and budget tier to find local clients</li>
          </ul>
        </div>
      )}
    </div>
  );
}
