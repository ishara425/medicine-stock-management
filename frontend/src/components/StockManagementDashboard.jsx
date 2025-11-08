import React, { useState, useEffect } from 'react';
import { Package, TrendingDown, RefreshCw, Plus, X, List } from 'lucide-react';

const StockManagementDashboard = () => {
  const [stockData, setStockData] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [summary, setSummary] = useState({
    totalMedicines: 0,
    lowStockItems: 0,
    stockUpdates: 0
  });
  const [loading, setLoading] = useState(true);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showBatchesModal, setShowBatchesModal] = useState(false);
  const [selectedMedicineBatches, setSelectedMedicineBatches] = useState([]);
  const [selectedMedicineName, setSelectedMedicineName] = useState('');
  const [formData, setFormData] = useState({
    medicineId: '',
    quantity: '',
    batchNumber: '',
    dateReceived: new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);

  const API_BASE_URL = 'http://localhost:8080/api';

  const fetchMedicines = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/medicines`);
      if (response.ok) {
        const data = await response.json();
        setMedicines(data);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  // Fetch consolidated stock data (one row per medicine)
  const fetchStockData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/stock/consolidated`);
      if (response.ok) {
        const data = await response.json();
        console.log('Consolidated stock data received:', data);
        setStockData(data);
      } else {
        console.error('Failed to fetch stock data:', response.status);
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockSummary = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stock/summary`);
      if (response.ok) {
        const data = await response.json();
        setSummary({
          totalMedicines: data.totalMedicines || 0,
          lowStockItems: data.lowStockItems || 0,
          stockUpdates: data.stockUpdates || 0
        });
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  // Fetch individual batches for a medicine
  const fetchMedicineBatches = async (medicineId, medicineName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/stock/medicine/${medicineId}/batches`);
      if (response.ok) {
        const data = await response.json();
        setSelectedMedicineBatches(data);
        setSelectedMedicineName(medicineName);
        setShowBatchesModal(true);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  useEffect(() => {
    fetchStockData();
    fetchStockSummary();
    fetchMedicines();
  }, []);

  const getStockStatus = (received, available) => {
    if (received === 0) return { text: '0% Available', color: 'text-red-600' };
    const percentage = Math.round((available / received) * 100);
    if (percentage >= 80) return { text: `${percentage}% Available`, color: 'text-green-600' };
    if (percentage >= 20) return { text: `${percentage}% Available`, color: 'text-yellow-600' };
    return { text: `${percentage}% Available`, color: 'text-red-600' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.medicineId || !formData.quantity) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const stockPayload = {
        quantity: parseInt(formData.quantity),
        batchNumber: formData.batchNumber || null,
        receivedDate: formData.dateReceived,
        expiryDate: null
      };

      const response = await fetch(
        `${API_BASE_URL}/stock/receive?medicineId=${formData.medicineId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(stockPayload)
        }
      );

      if (response.ok) {
        setFormData({
          medicineId: '',
          quantity: '',
          batchNumber: '',
          dateReceived: new Date().toISOString().split('T')[0]
        });
        
        setShowReceiveModal(false);
        await fetchStockData();
        await fetchStockSummary();
        
        alert('Stock received successfully!');
      } else {
        const errorData = await response.text();
        alert(`Error: ${errorData || 'Failed to receive stock'}`);
      }
    } catch (error) {
      console.error('Error submitting stock:', error);
      alert('Error submitting stock. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowReceiveModal(false);
    setFormData({
      medicineId: '',
      quantity: '',
      batchNumber: '',
      dateReceived: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-light text-gray-800 mb-1">Stock Management</h2>
        <p className="text-sm text-gray-500">Monitor and manage medicine inventory levels (consolidated view)</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Medicines</p>
              <p className="text-3xl font-semibold text-gray-800">{summary.totalMedicines}</p>
              <p className="text-xs text-gray-400 mt-1">Unique items in inventory</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="text-blue-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Low Stock Items</p>
              <p className="text-3xl font-semibold text-red-600">{summary.lowStockItems}</p>
              <p className="text-xs text-gray-400 mt-1">Require immediate attention</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="text-red-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Stock Updates</p>
              <p className="text-3xl font-semibold text-green-600">{summary.stockUpdates}</p>
              <p className="text-xs text-gray-400 mt-1">Updated this week</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <RefreshCw className="text-green-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <button 
          onClick={() => setShowReceiveModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={18} />
          Receive Stock
        </button>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Stock Levels (Consolidated)</h3>
          <p className="text-sm text-gray-500">All stock batches combined per medicine. Click "View Batches" for details.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SR Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Received</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Available</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    Loading stock data...
                  </td>
                </tr>
              ) : stockData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No stock data available
                  </td>
                </tr>
              ) : (
                stockData.map((item) => {
                  const status = getStockStatus(item.quantity, item.quantityAvailable);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.srNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.medicineName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantityAvailable || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${status.color}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.lastUpdated)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => fetchMedicineBatches(item.id, item.medicineName)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <List size={16} />
                          View Batches
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receive Stock Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Receive New Stock</h2>
                <p className="text-sm text-gray-500 mt-1">Add new medicine stock batch to inventory</p>
              </div>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medicine <span className="text-red-500">*</span>
                </label>
                <select
                  name="medicineId"
                  value={formData.medicineId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Select medicine</option>
                  {medicines.map((medicine) => (
                    <option key={medicine.id} value={medicine.id}>
                      {medicine.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity Received <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="Enter quantity"
                  required
                  min="1"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch/Reference Number
                </label>
                <input
                  type="text"
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleInputChange}
                  placeholder="Auto-generated if left empty"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Received
                </label>
                <input
                  type="date"
                  name="dateReceived"
                  value={formData.dateReceived}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Receiving...' : 'Receive Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Batches Modal */}
      {showBatchesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Stock Batches</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedMedicineName}</p>
              </div>
              <button
                onClick={() => setShowBatchesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Received</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedMedicineBatches.map((batch) => {
                    const status = getStockStatus(batch.quantity, batch.quantityAvailable);
                    return (
                      <tr key={batch.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{batch.batchNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{batch.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{batch.quantityAvailable}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(batch.receivedDate)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-medium ${status.color}`}>
                            {status.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowBatchesModal(false)}
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
};

export default StockManagementDashboard;