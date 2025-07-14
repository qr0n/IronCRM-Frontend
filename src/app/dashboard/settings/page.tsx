'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { EditUserModal } from '@/components/forms/EditUserModal';
import { 
  CogIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface SystemSettings {
  company_commission_percentage: string;
  agent_commission_split: string;
  overdue_contact_days: number;
  default_lead_recipient_email: string;
}

interface Parish {
  id: number;
  name: string;
}

interface BudgetTier {
  id: number;
  display_name: string;
  order: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
}

export default function SettingsPage() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('system');
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [budgetTiers, setBudgetTiers] = useState<BudgetTier[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Form states
  const [newParish, setNewParish] = useState('');
  const [newBudgetTier, setNewBudgetTier] = useState({ display_name: '', order: 0 });
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'AGENT'
  });
  const [editingParish, setEditingParish] = useState<Parish | null>(null);
  const [editingBudgetTier, setEditingBudgetTier] = useState<BudgetTier | null>(null);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSystemSettings(),
        fetchParishes(),
        fetchBudgetTiers(),
        fetchUsers()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const response = await api.get('/settings/system/');
      setSystemSettings(response.data);
      setPermissionError(null); // Clear any previous permission errors
    } catch (error: any) {
      console.error('Error fetching system settings:', error);
      if (error.response?.status === 403) {
        setPermissionError('You are not authorized to view or change system settings. Please contact your administrator.');
      }
    }
  };

  const fetchParishes = async () => {
    try {
      console.log('Fetching parishes...');
      const response = await api.get('/settings/parishes/');
      console.log('Parishes response:', response.data);
      const parishData = response.data.results || response.data;
      console.log('Parish data:', parishData);
      setParishes(parishData);
    } catch (error) {
      console.error('Error fetching parishes:', error);
    }
  };

  const fetchBudgetTiers = async () => {
    try {
      const response = await api.get('/settings/budget-tiers/');
      const budgetData = response.data.results || response.data;
      setBudgetTiers(budgetData);
    } catch (error) {
      console.error('Error fetching budget tiers:', error);
    }
  };

  const fetchUsers = async () => {
    // Only managers and admins can manage users
    if (!currentUser || currentUser.role === 'AGENT') {
      return;
    }
    
    try {
      const response = await api.get('/users/users/');
      const userData = response.data.results || response.data;
      setUsers(userData);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 403) {
        setPermissionError('You are not authorized to view users. Please contact your administrator.');
      }
    }
  };

  const saveSystemSettings = async (settings: SystemSettings) => {
    setSaving(true);
    try {
      await api.post('/settings/system/', settings);
      setSystemSettings(settings);
      setPermissionError(null); // Clear any previous permission errors
      alert('System settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving system settings:', error);
      if (error.response?.status === 403) {
        setPermissionError('You are not authorized to change system settings. Please contact your administrator.');
      } else {
        alert('Error saving system settings');
      }
    } finally {
      setSaving(false);
    }
  };

  const addParish = async () => {
    if (!newParish.trim()) {
      console.log('Parish name is empty');
      return;
    }
    
    console.log('Adding parish:', newParish);
    
    try {
      const response = await api.post('/settings/parishes/', { name: newParish });
      console.log('Parish added successfully:', response.data);
      setNewParish('');
      await fetchParishes();
      alert('Parish added successfully!');
    } catch (error: any) {
      console.error('Error adding parish:', error);
      if (error.response?.status === 403) {
        alert('You are not authorized to add parishes. Please contact your administrator.');
      } else {
        alert('Error adding parish. Please try again.');
      }
    }
  };

  const updateParish = async (parish: Parish) => {
    try {
      await api.put(`/settings/parishes/${parish.id}/`, parish);
      setEditingParish(null);
      fetchParishes();
    } catch (error: any) {
      console.error('Error updating parish:', error);
      if (error.response?.status === 403) {
        alert('You are not authorized to edit parishes. Please contact your administrator.');
        setEditingParish(null);
      } else {
        alert('Error updating parish. Please try again.');
      }
    }
  };

  const deleteParish = async (id: number) => {
    if (!confirm('Are you sure you want to delete this parish?')) return;
    
    try {
      await api.delete(`/settings/parishes/${id}/`);
      fetchParishes();
    } catch (error: any) {
      console.error('Error deleting parish:', error);
      if (error.response?.status === 403) {
        alert('You are not authorized to delete parishes. Please contact your administrator.');
      } else {
        alert('Error deleting parish. Please try again.');
      }
    }
  };

  const addBudgetTier = async () => {
    if (!newBudgetTier.display_name.trim()) {
      console.log('Budget tier display name is empty');
      return;
    }
    
    console.log('Adding budget tier:', newBudgetTier);
    
    try {
      const response = await api.post('/settings/budget-tiers/', newBudgetTier);
      console.log('Budget tier added successfully:', response.data);
      setNewBudgetTier({ display_name: '', order: 0 });
      await fetchBudgetTiers();
      alert('Budget tier added successfully!');
    } catch (error: any) {
      console.error('Error adding budget tier:', error);
      if (error.response?.status === 403) {
        alert('You are not authorized to add budget tiers. Please contact your administrator.');
      } else {
        alert('Error adding budget tier. Please try again.');
      }
    }
  };

  const updateBudgetTier = async (tier: BudgetTier) => {
    try {
      await api.put(`/settings/budget-tiers/${tier.id}/`, tier);
      setEditingBudgetTier(null);
      fetchBudgetTiers();
    } catch (error) {
      console.error('Error updating budget tier:', error);
    }
  };

  const deleteBudgetTier = async (id: number) => {
    if (!confirm('Are you sure you want to delete this budget tier?')) return;
    
    try {
      await api.delete(`/settings/budget-tiers/${id}/`);
      fetchBudgetTiers();
    } catch (error) {
      console.error('Error deleting budget tier:', error);
    }
  };

  const addUser = async () => {
    console.log('AddUser called with:', newUser);
    
    // Check permissions before attempting to add user
    if (!currentUser || currentUser.role === 'AGENT') {
      alert('You are not authorized to add users. Please contact your administrator.');
      return;
    }
    
    if (!newUser.username.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      console.log('Missing required fields:', {
        username: newUser.username.trim(),
        email: newUser.email.trim(),
        password: newUser.password.trim()
      });
      alert('Please fill in all required fields (username, email, password)');
      return;
    }
    
    // Additional role validation
    if (newUser.role === 'ADMIN' && currentUser.role !== 'ADMIN') {
      alert('Only Admin users can create other Admin users.');
      return;
    }
    
    if (newUser.role === 'MANAGER' && !['ADMIN', 'MANAGER'].includes(currentUser.role)) {
      alert('Only Manager or Admin users can create Manager users.');
      return;
    }
    
    console.log('Adding user:', newUser);
    
    try {
      const response = await api.post('/users/users/', newUser);
      console.log('User added successfully:', response.data);
      setNewUser({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        role: 'AGENT'
      });
      setShowNewUserModal(false);
      await fetchUsers();
      alert('User added successfully!');
    } catch (error: any) {
      console.error('Error adding user:', error);
      if (error.response?.status === 403) {
        alert('You are not authorized to add users. Please contact your administrator.');
      } else if (error.response?.data?.role) {
        alert(`Role validation error: ${error.response.data.role[0]}`);
      } else if (error.response?.data?.error) {
        alert(`Error: ${error.response.data.error}`);
      } else {
        alert('Error adding user. Please check the form and try again.');
      }
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditUserModal(true);
  };

  // Only show certain tabs based on user role
  const getAvailableTabs = () => {
    const baseTabs = [
      { id: 'system', name: 'System Settings', icon: CogIcon },
      { id: 'parishes', name: 'Parishes', icon: MapPinIcon },
      { id: 'budget-tiers', name: 'Budget Tiers', icon: CurrencyDollarIcon },
    ];
    
    // Only managers and admins can access user management
    if (currentUser?.role && ['MANAGER', 'ADMIN'].includes(currentUser.role)) {
      baseTabs.push({ id: 'users', name: 'Users', icon: UserGroupIcon });
    }
    
    return baseTabs;
  };

  const tabs = getAvailableTabs();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage system configuration and data</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">        {/* System Settings Tab */}
        {activeTab === 'system' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Configuration</h2>
            
            {/* Permission Error Message */}
            {permissionError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
                    <p className="text-sm text-red-700 mt-1">{permissionError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* System Settings Form */}
            {systemSettings && !permissionError ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveSystemSettings(systemSettings);
                }}
                className="space-y-4 max-w-md"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Commission Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={systemSettings.company_commission_percentage}
                    onChange={(e) => setSystemSettings({
                      ...systemSettings,
                      company_commission_percentage: e.target.value
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agent Commission Split (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={systemSettings.agent_commission_split}
                    onChange={(e) => setSystemSettings({
                      ...systemSettings,
                      agent_commission_split: e.target.value
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Overdue Contact Days
                  </label>
                  <input
                    type="number"
                    value={systemSettings.overdue_contact_days}
                    onChange={(e) => setSystemSettings({
                      ...systemSettings,
                      overdue_contact_days: parseInt(e.target.value)
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Lead Recipient Email
                  </label>
                  <input
                    type="email"
                    value={systemSettings.default_lead_recipient_email}
                    onChange={(e) => setSystemSettings({
                      ...systemSettings,
                      default_lead_recipient_email: e.target.value
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </form>
            ) : !systemSettings && !permissionError ? (
              <div className="text-gray-500">Loading system settings...</div>
            ) : null}
          </div>
        )}

        {/* Parishes Tab */}
        {activeTab === 'parishes' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Parishes</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Parish name"
                  value={newParish}
                  onChange={(e) => setNewParish(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addParish}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {parishes.map((parish) => (
                <div key={parish.id} className="flex items-center justify-between p-3 border rounded-lg">
                  {editingParish?.id === parish.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingParish.name}
                        onChange={(e) => setEditingParish({ ...editingParish, name: e.target.value })}
                        className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => updateParish(editingParish)}
                        className="text-green-600 hover:text-green-800"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingParish(null)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium">{parish.name}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingParish(parish)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteParish(parish.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget Tiers Tab */}
        {activeTab === 'budget-tiers' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Budget Tiers</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Display name (e.g., $0 - $200K)"
                  value={newBudgetTier.display_name}
                  onChange={(e) => setNewBudgetTier({ ...newBudgetTier, display_name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Order"
                  value={newBudgetTier.order}
                  onChange={(e) => setNewBudgetTier({ ...newBudgetTier, order: parseInt(e.target.value) || 0 })}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addBudgetTier}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {budgetTiers.map((tier) => (
                <div key={tier.id} className="flex items-center justify-between p-3 border rounded-lg">
                  {editingBudgetTier?.id === tier.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingBudgetTier.display_name}
                        onChange={(e) => setEditingBudgetTier({ ...editingBudgetTier, display_name: e.target.value })}
                        className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        value={editingBudgetTier.order}
                        onChange={(e) => setEditingBudgetTier({ ...editingBudgetTier, order: parseInt(e.target.value) || 0 })}
                        className="w-20 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => updateBudgetTier(editingBudgetTier)}
                        className="text-green-600 hover:text-green-800"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingBudgetTier(null)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="font-medium">{tier.display_name}</span>
                        <span className="text-sm text-gray-500 ml-2">(Order: {tier.order})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingBudgetTier(tier)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteBudgetTier(tier.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Users</h2>
              {/* Only show Add User button for managers and admins */}
              {currentUser?.role && ['MANAGER', 'ADMIN'].includes(currentUser.role) && (
                <button
                  onClick={() => setShowNewUserModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add User
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name}`
                              : user.username}
                          </div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-800 mr-2 p-1 hover:bg-blue-50 rounded"
                          title="Edit user"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* New User Modal */}
      {showNewUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New User</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addUser();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={newUser.first_name}
                  onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={newUser.last_name}
                  onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="AGENT">Agent</option>
                  {/* Only managers and admins can create managers */}
                  {currentUser?.role && ['MANAGER', 'ADMIN'].includes(currentUser.role) && (
                    <option value="MANAGER">Manager</option>
                  )}
                  {/* Only admins can create admins */}
                  {currentUser?.role === 'ADMIN' && (
                    <option value="ADMIN">Admin</option>
                  )}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowNewUserModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {selectedUser && (
        <EditUserModal
          isOpen={showEditUserModal}
          onClose={() => {
            setShowEditUserModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            fetchUsers(); // Refresh the users list
            setShowEditUserModal(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
        />
      )}
    </div>
  );
}
