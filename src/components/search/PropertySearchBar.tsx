'use client';

import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  HomeIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

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
  status?: 'AVAILABLE' | 'SOLD' | 'UNDER_CONTRACT';
}

interface PropertySearchBarProps {
  onSearch: (params: PropertySearchParams) => void;
  parishes?: Parish[];
  showFilters?: boolean;
}

export function PropertySearchBar({ 
  onSearch, 
  parishes = [],
  showFilters = true
}: PropertySearchBarProps) {
  const [query, setQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState<Omit<PropertySearchParams, 'query'>>({});

  const handleSearch = () => {
    const searchParams: PropertySearchParams = {
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
      id: 'available',
      label: 'Available',
      active: filters.status === 'AVAILABLE',
      onClick: () => handleFilterChange('status', filters.status === 'AVAILABLE' ? undefined : 'AVAILABLE')
    },
    {
      id: 'sold',
      label: 'Recently Sold',
      active: filters.status === 'SOLD',
      onClick: () => handleFilterChange('status', filters.status === 'SOLD' ? undefined : 'SOLD')
    },
    {
      id: 'for-sale',
      label: 'For Sale',
      active: filters.listingType === 'FOR_SALE',
      onClick: () => handleFilterChange('listingType', filters.listingType === 'FOR_SALE' ? undefined : 'FOR_SALE')
    },
    {
      id: 'for-rent',
      label: 'For Rent',
      active: filters.listingType === 'FOR_RENT',
      onClick: () => handleFilterChange('listingType', filters.listingType === 'FOR_RENT' ? undefined : 'FOR_RENT')
    },
    {
      id: 'under-500k',
      label: 'Under $500K',
      active: filters.maxPrice === 500000,
      onClick: () => handleFilterChange('maxPrice', filters.maxPrice === 500000 ? undefined : 500000)
    },
    {
      id: 'over-1m',
      label: 'Over $1M',
      active: filters.minPrice === 1000000,
      onClick: () => handleFilterChange('minPrice', filters.minPrice === 1000000 ? undefined : 1000000)
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
            placeholder="Search by address, town, parish, or client name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

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

        {(query || Object.keys(filters).some(key => filters[key as keyof typeof filters] !== undefined)) && (
          <button
            onClick={clearAll}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear All
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
              <MapPinIcon className="h-4 w-4 inline mr-1" />
              Town
            </label>
            <input
              type="text"
              placeholder="e.g., Kingston, Spanish Town"
              value={filters.town || ''}
              onChange={(e) => handleFilterChange('town', e.target.value || undefined)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
              Min Price
            </label>
            <input
              type="number"
              placeholder="e.g., 200000"
              value={filters.minPrice || ''}
              onChange={(e) => handleFilterChange('minPrice', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
              Max Price
            </label>
            <input
              type="number"
              placeholder="e.g., 800000"
              value={filters.maxPrice || ''}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <HomeIcon className="h-4 w-4 inline mr-1" />
              Listing Type
            </label>
            <select
              value={filters.listingType || ''}
              onChange={(e) => handleFilterChange('listingType', e.target.value || undefined)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="FOR_SALE">For Sale</option>
              <option value="FOR_RENT">For Rent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="AVAILABLE">Available</option>
              <option value="UNDER_CONTRACT">Under Contract</option>
              <option value="SOLD">Sold</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
