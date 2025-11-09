import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Calendar, Package, Search, Filter } from 'lucide-react';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api`;


const OfficerTrackingPage = () => {
  const [officerInventory, setOfficerInventory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedOfficer, setSelectedOfficer] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inventoryRes, notifRes] = await Promise.all([
        fetch(`${API_BASE}/officer-inventory`),
        fetch(`${API_BASE}/distributions`)
      ]);

      if (inventoryRes.ok) {
        const inventoryData = await inventoryRes.json();
        setOfficerInventory(inventoryData);
      }

      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique officers
  const officers = Array.from(
    new Set(officerInventory.map(inv => inv.officer?.username).filter(Boolean))
  );

  // Calculate statistics
  const totalOfficers = officers.length;
  const totalDistributions = notifications.filter(n => n.status === 'Completed').length;
  const pendingDistributions = notifications.filter(n => n.status === 'Pending').length;
  const medicineTypes = officerInventory.length;

  // Filter inventory
  const filteredInventory = officerInventory.filter(inv => {
    const matchesOfficer = 
      selectedOfficer === 'all' || 
      inv.officer?.username === selectedOfficer;
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      inv.medicine?.name?.toLowerCase().includes(searchLower) ||
      inv.officer?.username?.toLowerCase().includes(searchLower);
    
    return matchesOfficer && matchesSearch;
  });

  // Get distributions for selected officer
  const getOfficerDistributions = (officerId) => {
    if (!officerId || selectedOfficer === 'all') return [];
    
    const officerInv = officerInventory.find(
      inv => inv.officer?.username === selectedOfficer
    );
    
    if (!officerInv) return [];
    
    return notifications.filter(n => n.officer?.id === officerInv.officer?.id);
  };

  const getStockPercentage = (current, total) => {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  };

  const getStockStatus = (percentage) => {
    if (percentage > 50) {
      return { text: `${percentage}% Stock`, color: 'text-green-600 bg-green-50' };
    }
    if (percentage > 25) {
      return { text: `${percentage}% Stock`, color: 'text-yellow-600 bg-yellow-50' };
    }
    return { text: `${percentage}% Stock`, color: 'text-red-600 bg-red-50' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const selectedOfficerDistributions = getOfficerDistributions(
    officerInventory.find(inv => inv.officer?.username === selectedOfficer)?.officer?.id
  );

  // Group distributions by medicine
  const distributionsByMedicine = selectedOfficerDistributions.reduce((acc, dist) => {
    const medicineName = dist.medicine?.name || 'Unknown';
    if (!acc[medicineName]) {
      acc[medicineName] = [];
    }
    acc[medicineName].push(dist);
    return acc;
  }, {});

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Officer Tracking</h1>
        <p className="text-gray-600 mt-1">Monitor officer inventory and distribution history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Active Officers</p>
              <p className="text-3xl font-semibold text-blue-600">{totalOfficers}</p>
              <p className="text-xs text-gray-400 mt-1">Total registered</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Distributions</p>
              <p className="text-3xl font-semibold text-green-600">{totalDistributions}</p>
              <p className="text-xs text-gray-400 mt-1">Completed</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Pending Actions</p>
              <p className="text-3xl font-semibold text-yellow-600">{pendingDistributions}</p>
              <p className="text-xs text-gray-400 mt-1">Awaiting acceptance</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Calendar className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Medicine Types</p>
              <p className="text-3xl font-semibold text-purple-600">{medicineTypes}</p>
              <p className="text-xs text-gray-400 mt-1">In inventory</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-500" />
          <span className="font-medium">Filters</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Officer</label>
            <select
              value={selectedOfficer}
              onChange={(e) => setSelectedOfficer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Officers</option>
              {officers.map((officer) => (
                <option key={officer} value={officer}>
                  {officer}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by officer or medicine..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Officer Inventory Overview</h2>
          <p className="text-sm text-gray-500">Complete inventory across all officers</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Officer Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Medicine
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Received
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stock Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    Loading officer inventory...
                  </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No inventory data found
                  </td>
                </tr>
              ) : (
                filteredInventory.map((inv) => {
                  const percentage = getStockPercentage(inv.currentQuantity, inv.totalReceived);
                  const status = getStockStatus(percentage);
                  
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Users className="text-gray-400" size={16} />
                          <span className="font-medium text-gray-900">
                            {inv.officer?.username || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Package className="text-gray-400" size={16} />
                          <span className="text-gray-900">
                            {inv.medicine?.name || 'N/A'} {inv.medicine?.dosage || ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {inv.totalReceived || 0} units
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {inv.currentQuantity || 0} units
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded text-sm font-medium ${status.color}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(inv.lastUpdated)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Distribution History */}
      {selectedOfficer !== 'all' && selectedOfficerDistributions.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Distribution History</h2>
            <p className="text-sm text-gray-500">
              Showing distributions for {selectedOfficer}
            </p>
          </div>

          <div className="p-6 space-y-6">
            {Object.entries(distributionsByMedicine).map(([medicineName, distributions]) => (
              <div key={medicineName}>
                <h3 className="font-semibold text-gray-900 mb-3">{medicineName}</h3>
                <div className="space-y-2 ml-4">
                  {distributions
                    .sort((a, b) => new Date(b.distributionDate) - new Date(a.distributionDate))
                    .map((dist) => (
                      <div key={dist.id} className="flex items-center gap-3 text-sm">
                        <Calendar className="text-gray-400 flex-shrink-0" size={16} />
                        <span className="text-gray-600">{formatDate(dist.distributionDate)}</span>
                        <span className="font-medium text-gray-900">{dist.quantity} units</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          dist.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          dist.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {dist.status}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerTrackingPage;