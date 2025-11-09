import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, Clock, Package, Search, ChevronLeft, ChevronRight, CheckCircle, XCircle, Info } from 'lucide-react';

export default function MedicineDashboard() {
  const [medicines, setMedicines] = useState([]);
  const [summary, setSummary] = useState({ total: 0, expiringSoon: 0, expired: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExpiringModal, setShowExpiringModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [expiringMedicines, setExpiringMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [formData, setFormData] = useState({
    srNumber: '',
    name: '',
    dosage: '',
    manufacturer: '',
    category: '',
    expirationDate: ''
  });

  const styles = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    .animate-slide-in {
      animation: slideIn 0.3s ease-out;
    }
  `;

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/medicines`;

  useEffect(() => {
    fetchMedicines();
    fetchSummary();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await fetch(API_BASE);
      if (response.ok) {
        const data = await response.json();
        setMedicines(data);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
      showNotification('error', 'Failed to fetch medicines. Check if backend is running.');
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_BASE}/summary?days=30`);
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
      const response = await fetch(`${API_BASE}/expiring-soon?days=30`);
      if (response.ok) {
        const data = await response.json();
        setExpiringMedicines(data);
        setShowExpiringModal(true);
      }
    } catch (error) {
      console.error('Error fetching expiring medicines:', error);
      showNotification('error', 'Failed to fetch expiring medicines');
    }
  };

  const handleAddMedicine = async () => {
    if (!formData.srNumber || !formData.name) {
      showNotification('error', 'SR Number and Medicine Name are required');
      return;
    }

    try {
      const cleanData = {
        srNumber: formData.srNumber.trim(),
        name: formData.name.trim(),
        dosage: formData.dosage.trim() || null,
        manufacturer: formData.manufacturer.trim() || null,
        category: formData.category.trim() || null,
        expirationDate: formData.expirationDate || null
      };

      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData)
      });

      if (response.ok) {
        showNotification('success', 'Medicine added successfully!');
        setShowAddModal(false);
        resetForm();
        fetchMedicines();
        fetchSummary();
      } else {
        const error = await response.json();
        showNotification('error', error.error || error.message || 'Failed to add medicine');
      }
    } catch (error) {
      console.error('Error adding medicine:', error);
      showNotification('error', 'Cannot connect to server. Please check if backend is running on port 8080.');
    }
  };

  const handleEditMedicine = async () => {
    if (!formData.srNumber || !formData.name) {
      showNotification('error', 'SR Number and Medicine Name are required');
      return;
    }

    try {
      const cleanData = {
        srNumber: formData.srNumber.trim(),
        name: formData.name.trim(),
        dosage: formData.dosage.trim() || null,
        manufacturer: formData.manufacturer.trim() || null,
        category: formData.category.trim() || null,
        expirationDate: formData.expirationDate || null
      };

      const response = await fetch(`${API_BASE}/${editingMedicine.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData)
      });

      if (response.ok) {
        showNotification('success', 'Medicine updated successfully!');
        setShowEditModal(false);
        setEditingMedicine(null);
        resetForm();
        fetchMedicines();
        fetchSummary();
      } else {
        const error = await response.json();
        showNotification('error', error.error || error.message || 'Failed to update medicine');
      }
    } catch (error) {
      console.error('Error updating medicine:', error);
      showNotification('error', 'Cannot connect to server. Please check if backend is running on port 8080.');
    }
  };

  const handleDeleteMedicine = async (id, name) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showNotification('success', 'Medicine deleted successfully!');
        fetchMedicines();
        fetchSummary();
      } else {
        showNotification('error', 'Failed to delete medicine');
      }
    } catch (error) {
      console.error('Error deleting medicine:', error);
      showNotification('error', 'Cannot connect to server. Please check if backend is running on port 8080.');
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
      expirationDate: medicine.expirationDate || ''
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
      expirationDate: ''
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

  const filteredMedicines = medicines.filter(medicine =>
    medicine.srNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMedicines = filteredMedicines.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage);

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen bg-gray-50 p-8">
        {notification.show && (
          <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <div className={`rounded-lg shadow-lg p-4 flex items-start gap-3 min-w-80 ${
              notification.type === 'success' ? 'bg-green-50 border border-green-200' :
              notification.type === 'error' ? 'bg-red-50 border border-red-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex-shrink-0">
                {notification.type === 'success' && <CheckCircle className="text-green-600" size={24} />}
                {notification.type === 'error' && <XCircle className="text-red-600" size={24} />}
                {notification.type === 'info' && <Info className="text-blue-600" size={24} />}
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold text-sm ${
                  notification.type === 'success' ? 'text-green-800' :
                  notification.type === 'error' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {notification.type === 'success' ? 'Success' :
                   notification.type === 'error' ? 'Error' : 'Info'}
                </h3>
                <p className={`text-sm mt-1 ${
                  notification.type === 'success' ? 'text-green-700' :
                  notification.type === 'error' ? 'text-red-700' :
                  'text-blue-700'
                }`}>
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => setNotification({ show: false, type: '', message: '' })}
                className={`flex-shrink-0 ${
                  notification.type === 'success' ? 'text-green-600 hover:text-green-800' :
                  notification.type === 'error' ? 'text-red-600 hover:text-red-800' :
                  'text-blue-600 hover:text-blue-800'
                }`}
              >
                <XCircle size={20} />
              </button>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto">
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

          <div className="grid grid-cols-3 gap-6 mb-8">
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
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by SR Number..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SR Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicine Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dosage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manufacturer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentMedicines.map((medicine) => {
                    const expiryStatus = getExpiryStatus(medicine.expirationDate);
                    return (
                      <tr key={medicine.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{medicine.srNumber || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{medicine.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{medicine.dosage || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{medicine.manufacturer || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{medicine.category || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(medicine.expirationDate)}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={expiryStatus.color}>{expiryStatus.text}</span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <button onClick={() => openEditModal(medicine)} className="text-blue-600 hover:text-blue-800">
                              <Edit2 size={18} />
                            </button>
                            <button onClick={() => handleDeleteMedicine(medicine.id, medicine.name)} className="text-red-600 hover:text-red-800">
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

            {currentMedicines.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                {searchTerm ? 'No medicines found matching your search.' : 'No medicines found. Click "Add Medicine" to get started.'}
              </div>
            )}

            {filteredMedicines.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredMedicines.length)} of {filteredMedicines.length} medicines
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  
                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => goToPage(i + 1)}
                        className={`px-3 py-1 rounded-lg ${
                          currentPage === i + 1 ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date</label>
                    <input
                      type="date"
                      value={formData.expirationDate}
                      onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date</label>
                    <input
                      type="date"
                      value={formData.expirationDate}
                      onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
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
    </>
  );
}