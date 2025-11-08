import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, Clock, Package, TrendingDown } from 'lucide-react';

export default function MedicineDashboard() {
  const [medicines, setMedicines] = useState([]);
  const [summary, setSummary] = useState({ total: 0, expiringSoon: 0, expired: 0, lowStock: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExpiringModal, setShowExpiringModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [expiringMedicines, setExpiringMedicines] = useState([]);
  const [formData, setFormData] = useState({
    srNumber: '',
    name: '',
    dosage: '',
    manufacturer: '',
    category: '',
    stock: '',
    expirationDate: '',
    instructions: ''
  });

  const API_BASE = 'http://localhost:8080/api';

  useEffect(() => {
    fetchMedicines();
    fetchSummary();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await fetch(`${API_BASE}/medicines`);
      if (response.ok) {
        const data = await response.json();
        setMedicines(data);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_BASE}/medicines/summary?days=30&threshold=10`);
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const fetchExpiringMedicines = async () => {
    try {
      const response = await fetch(`${API_BASE}/medicines/expiring-soon?days=30`);
      if (response.ok) {
        const data = await response.json();
        setExpiringMedicines(data);
        setShowExpiringModal(true);
      }
    } catch (error) {
      console.error('Error fetching expiring medicines:', error);
    }
  };

  const handleAddMedicine = async () => {
    if (!formData.srNumber || !formData.name) {
      alert('SR Number and Medicine Name are required');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/medicines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Medicine added successfully!');
        setShowAddModal(false);
        resetForm();
        fetchMedicines();
        fetchSummary();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add medicine');
      }
    } catch (error) {
      console.error('Error adding medicine:', error);
      alert('Error adding medicine');
    }
  };

  const handleEditMedicine = async () => {
    try {
      const response = await fetch(`${API_BASE}/medicines/${editingMedicine.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Medicine updated successfully!');
        setShowEditModal(false);
        setEditingMedicine(null);
        resetForm();
        fetchMedicines();
        fetchSummary();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update medicine');
      }
    } catch (error) {
      console.error('Error updating medicine:', error);
      alert('Error updating medicine');
    }
  };

  const handleDeleteMedicine = async (id, name) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const response = await fetch(`${API_BASE}/medicines/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Medicine deleted successfully!');
        fetchMedicines();
        fetchSummary();
      }
    } catch (error) {
      console.error('Error deleting medicine:', error);
      alert('Error deleting medicine');
    }
  };

  const openEditModal = (medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      srNumber: medicine.srNumber || '',
      name: medicine.name || '',
      dosage: medicine.dosage || '',
      manufacturer: medicine.manufacturer || '',
      category: medicine.category || '',
      stock: medicine.stock || '',
      expirationDate: medicine.expirationDate || '',
      instructions: medicine.instructions || ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      srNumber: '',
      name: '',
      dosage: '',
      manufacturer: '',
      category: '',
      stock: '',
      expirationDate: '',
      instructions: ''
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  const getDaysUntilExpiry = (expirationDate) => {
    if (!expirationDate) return null;
    const today = new Date();
    const expiry = new Date(expirationDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (expirationDate) => {
    if (!expirationDate) return { text: 'No Expiry', color: 'text-gray-500' };
    
    const days = getDaysUntilExpiry(expirationDate);
    
    if (days < 0) return { text: 'Expired', color: 'text-red-600 font-semibold' };
    if (days === 0) return { text: 'Expires Today', color: 'text-red-600 font-semibold' };
    if (days <= 7) return { text: `${days} days left`, color: 'text-red-600' };
    if (days <= 30) return { text: `${days} days left`, color: 'text-orange-600' };
    if (days <= 90) return { text: `${days} days left`, color: 'text-yellow-600' };
    return { text: `${days} days left`, color: 'text-green-600' };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Medicine Inventory</h1>
            <p className="text-gray-600 mt-1">Manage medicine stock and expiry dates</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Add Medicine
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Medicines</p>
                <p className="text-3xl font-semibold text-gray-800">{summary.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="text-blue-600" size={20} />
              </div>
            </div>
          </div>

          <div 
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={fetchExpiringMedicines}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 mb-1">Expiring Soon</p>
                <p className="text-3xl font-semibold text-orange-600">{summary.expiringSoon}</p>
                <p className="text-xs text-gray-400 mt-1">Click to view details</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="text-orange-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 mb-1">Expired</p>
                <p className="text-3xl font-semibold text-red-600">{summary.expired}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 mb-1">Low Stock</p>
                <p className="text-3xl font-semibold text-yellow-600">{summary.lowStock}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="text-yellow-600" size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Medicine Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SR Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicine Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dosage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {medicines.map((medicine) => {
                  const expiryStatus = getExpiryStatus(medicine.expirationDate);
                  return (
                    <tr key={medicine.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {medicine.srNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{medicine.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{medicine.dosage || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{medicine.category || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`font-medium ${medicine.stock < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                          {medicine.stock || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(medicine.expirationDate)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={expiryStatus.color}>
                          {expiryStatus.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(medicine)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteMedicine(medicine.id, medicine.name)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {medicines.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No medicines found. Click "Add Medicine" to get started.
            </div>
          )}
        </div>
      </div>

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Add New Medicine</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SR Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.srNumber}
                    onChange={(e) => setFormData({ ...formData, srNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., MED001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medicine Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dosage</label>
                  <input
                    type="text"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 500mg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Antibiotic"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Initial Stock</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date</label>
                <input
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMedicine}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Medicine
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Medicine Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Edit Medicine</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SR Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.srNumber}
                    onChange={(e) => setFormData({ ...formData, srNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medicine Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dosage</label>
                  <input
                    type="text"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date</label>
                <input
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => { setShowEditModal(false); setEditingMedicine(null); resetForm(); }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditMedicine}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Update Medicine
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expiring Medicines Modal */}
      {showExpiringModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-orange-600">Medicines Expiring Soon (Next 30 Days)</h2>
              <p className="text-sm text-gray-500 mt-1">
                {expiringMedicines.length} medicine(s) expiring within 30 days
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {expiringMedicines.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No medicines expiring in the next 30 days
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SR Number</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dosage</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Left</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {expiringMedicines.map((medicine) => {
                      const daysLeft = getDaysUntilExpiry(medicine.expirationDate);
                      const expiryStatus = getExpiryStatus(medicine.expirationDate);
                      return (
                        <tr key={medicine.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{medicine.srNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{medicine.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{medicine.dosage || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{medicine.stock || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(medicine.expirationDate)}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`font-medium ${expiryStatus.color}`}>
                              {daysLeft <= 0 ? 'Expired' : `${daysLeft} days`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowExpiringModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}