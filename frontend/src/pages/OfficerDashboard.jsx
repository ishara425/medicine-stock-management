import React, { useState, useEffect } from 'react';
import { Bell, Package, TrendingUp, AlertTriangle, CheckCircle, XCircle, Clock, Calendar, LogOut, MessageSquare } from 'lucide-react';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api`;


const getCurrentUser = () => {
  return localStorage.getItem('username') || 'Officer User';
};

const getCurrentUserId = () => {
  return localStorage.getItem('userId') || '1';
};

const OfficerDashboard = () => {
  const [activePage, setActivePage] = useState('notifications');
  const [notifications, setNotifications] = useState([]);
  const [restockNotifications, setRestockNotifications] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [restockRequests, setRestockRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [usageAmount, setUsageAmount] = useState('');
  const [restockForm, setRestockForm] = useState({
    medicineId: '',
    requestedQuantity: '',
    urgency: 'Medium',
    reason: ''
  });

  const currentUser = getCurrentUser();
  const currentUserId = getCurrentUserId();

  useEffect(() => {
    fetchNotifications();
    fetchRestockNotifications();
    fetchInventory();
    fetchRestockRequests();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE}/notifications/officer/${currentUserId}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchRestockNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE}/notifications/officer/${currentUserId}/restock-updates`);
      if (response.ok) {
        const data = await response.json();
        setRestockNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching restock notifications:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await fetch(`${API_BASE}/officer-inventory/officer/${currentUserId}`);
      if (response.ok) {
        const data = await response.json();
        setInventory(data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const fetchRestockRequests = async () => {
    try {
      const response = await fetch(`${API_BASE}/restock-requests/officer/${currentUserId}`);
      if (response.ok) {
        const data = await response.json();
        setRestockRequests(data);
      }
    } catch (error) {
      console.error('Error fetching restock requests:', error);
    }
  };

  const handleAcceptNotification = async (notificationId) => {
    try {
      const response = await fetch(`${API_BASE}/notifications/${notificationId}/accept`, {
        method: 'PATCH'
      });
      if (response.ok) {
        alert('Distribution accepted successfully!');
        fetchNotifications();
        fetchInventory();
      } else {
        const error = await response.json();
        alert(error.message || 'Error accepting notification');
      }
    } catch (error) {
      console.error('Error accepting notification:', error);
      alert('Error accepting notification');
    }
  };

  const handleRejectNotification = async (notificationId) => {
    try {
      const response = await fetch(`${API_BASE}/notifications/${notificationId}/reject`, {
        method: 'PATCH'
      });
      if (response.ok) {
        alert('Distribution rejected');
        fetchNotifications();
      } else {
        const error = await response.json();
        alert(error.message || 'Error rejecting notification');
      }
    } catch (error) {
      console.error('Error rejecting notification:', error);
      alert('Error rejecting notification');
    }
  };

  const handleMarkRestockAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      if (response.ok) {
        fetchRestockNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleRecordUsage = async () => {
    if (!selectedMedicine || !usageAmount || parseInt(usageAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (parseInt(usageAmount) > selectedMedicine.currentQuantity) {
      alert('Amount exceeds available stock');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/officer-inventory/record-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryId: selectedMedicine.id,
          quantityUsed: parseInt(usageAmount)
        })
      });

      if (response.ok) {
        alert('Usage recorded successfully!');
        setShowUsageModal(false);
        setUsageAmount('');
        setSelectedMedicine(null);
        fetchInventory();
      }
    } catch (error) {
      console.error('Error recording usage:', error);
      alert('Error recording usage');
    }
  };

  const handleSubmitRestockRequest = async () => {
    if (!restockForm.medicineId || !restockForm.requestedQuantity || !restockForm.reason) {
      alert('Please fill in all fields');
      return;
    }

    if (restockForm.reason.length < 20) {
      alert('Reason must be at least 20 characters');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/restock-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officerId: parseInt(currentUserId),
          medicineId: parseInt(restockForm.medicineId),
          requestedQuantity: parseInt(restockForm.requestedQuantity),
          urgency: restockForm.urgency,
          reason: restockForm.reason
        })
      });

      if (response.ok) {
        alert('Restock request submitted successfully!');
        setShowRestockModal(false);
        setRestockForm({
          medicineId: '',
          requestedQuantity: '',
          urgency: 'Medium',
          reason: ''
        });
        fetchRestockRequests();
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Error submitting restock request');
    }
  };

  const getStockPercentage = (current, total) => {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  };

  const getStockStatus = (percentage) => {
    if (percentage > 50) return { text: 'Good', color: 'text-green-600', bg: 'bg-green-100' };
    if (percentage > 25) return { text: 'Low', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: 'Critical', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const pendingDistributionCount = notifications.filter(n => n.status === 'Pending').length;
  const pendingRestockCount = restockRequests.filter(r => r.status === 'PENDING').length;
  const unreadRestockNotifications = restockNotifications.filter(n => n.status !== 'Read').length;
  const totalNotificationCount = pendingDistributionCount + unreadRestockNotifications;

  const renderSidebar = () => (
    <div className="w-64 bg-blue-900 text-white h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Medicine Portal</h1>
            <p className="text-xs text-blue-300">Officer System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <button
          onClick={() => setActivePage('notifications')}
          className={`w-full flex items-start gap-3 p-3 rounded-lg mb-2 transition-colors ${
            activePage === 'notifications' ? 'bg-blue-800 text-white' : 'text-blue-200 hover:bg-blue-800/50'
          }`}
        >
          <Bell className="w-5 h-5 mt-0.5" />
          <div className="text-left flex-1">
            <div className="font-medium text-sm flex items-center justify-between">
              Notifications
              {totalNotificationCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{totalNotificationCount}</span>
              )}
            </div>
            <div className="text-xs opacity-75">All updates</div>
          </div>
        </button>

        <button
          onClick={() => setActivePage('inventory')}
          className={`w-full flex items-start gap-3 p-3 rounded-lg mb-2 transition-colors ${
            activePage === 'inventory' ? 'bg-blue-800 text-white' : 'text-blue-200 hover:bg-blue-800/50'
          }`}
        >
          <Package className="w-5 h-5 mt-0.5" />
          <div className="text-left">
            <div className="font-medium text-sm">My Inventory</div>
            <div className="text-xs opacity-75">Current stock levels</div>
          </div>
        </button>

        <button
          onClick={() => setActivePage('usage')}
          className={`w-full flex items-start gap-3 p-3 rounded-lg mb-2 transition-colors ${
            activePage === 'usage' ? 'bg-blue-800 text-white' : 'text-blue-200 hover:bg-blue-800/50'
          }`}
        >
          <TrendingUp className="w-5 h-5 mt-0.5" />
          <div className="text-left">
            <div className="font-medium text-sm">Daily Usage</div>
            <div className="text-xs opacity-75">Track medicine usage</div>
          </div>
        </button>

        <button
          onClick={() => setActivePage('restock')}
          className={`w-full flex items-start gap-3 p-3 rounded-lg mb-2 transition-colors ${
            activePage === 'restock' ? 'bg-blue-800 text-white' : 'text-blue-200 hover:bg-blue-800/50'
          }`}
        >
          <AlertTriangle className="w-5 h-5 mt-0.5" />
          <div className="text-left flex-1">
            <div className="font-medium text-sm flex items-center justify-between">
              Restock Requests
              {pendingRestockCount > 0 && (
                <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingRestockCount}</span>
              )}
            </div>
            <div className="text-xs opacity-75">Request medicines</div>
          </div>
        </button>
      </nav>

      <div className="p-4 border-t border-blue-800">
        <div className="text-xs text-blue-300">
          <div>Ministry of Health</div>
          <div>v2.0</div>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => {
    return (
      <div>
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Pending Actions</p>
                <p className="text-3xl font-semibold text-yellow-600">{pendingDistributionCount}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="text-yellow-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Medicines</p>
                <p className="text-3xl font-semibold text-blue-600">{inventory.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="text-blue-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Current Stock</p>
                <p className="text-3xl font-semibold text-green-600">
                  {inventory.reduce((sum, inv) => sum + inv.currentQuantity, 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-green-600" size={20} />
              </div>
            </div>
          </div>
        </div>

        {notifications.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Medicine Distributions
            </h2>
            <div className="space-y-4">
              {notifications.map((notif) => (
                <div key={notif.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {notif.medicine?.name || 'N/A'} {notif.medicine?.dosage || ''}
                        </h3>
                        <p className="text-sm text-gray-500">From: {notif.creator?.username || 'PHI'}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      notif.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      notif.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {notif.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Quantity</p>
                      <p className="font-semibold">{notif.distribution?.quantity || 0} units</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="font-semibold">{formatDate(notif.createdAt)}</p>
                    </div>
                  </div>

                  {notif.status === 'Pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAcceptNotification(notif.id)}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={18} />
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectNotification(notif.id)}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                      >
                        <XCircle size={18} />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {restockNotifications.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              Restock Request Updates
            </h2>
            <div className="space-y-4">
              {restockNotifications.map((notif) => {
                const isApproved = notif.type === 'RestockApproval';
                const isRead = notif.status === 'Read';
                
                return (
                  <div 
                    key={notif.id} 
                    className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                      isApproved ? 'border-green-500' : 'border-red-500'
                    } ${!isRead ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isApproved ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {isApproved ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {notif.medicine?.name || 'N/A'}
                          </h3>
                          <p className="text-sm text-gray-500">{notif.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded text-sm font-medium ${
                          isApproved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {isApproved ? 'APPROVED' : 'REJECTED'}
                        </span>
                        {!isRead && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg mb-4 ${
                      isApproved ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <div className="flex items-start gap-2">
                        <MessageSquare className={`flex-shrink-0 mt-0.5 ${
                          isApproved ? 'text-green-600' : 'text-red-600'
                        }`} size={18} />
                        <div className="flex-1">
                          <p className={`text-sm ${
                            isApproved ? 'text-green-900' : 'text-red-900'
                          }`}>
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        {formatDate(notif.createdAt)}
                      </p>
                      {!isRead && (
                        <button
                          onClick={() => handleMarkRestockAsRead(notif.id)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {notifications.length === 0 && restockNotifications.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No notifications at the moment</p>
            <p className="text-sm text-gray-400 mt-1">You'll see updates here when there are new distributions or restock decisions</p>
          </div>
        )}
      </div>
    );
  };

  const renderInventory = () => (
    <div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">My Medicine Inventory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Received</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Used</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {inventory.map((inv) => {
                const percentage = getStockPercentage(inv.currentQuantity, inv.totalReceived);
                const status = getStockStatus(percentage);
                const totalUsed = inv.totalReceived - inv.currentQuantity;
                
                return (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{inv.medicine?.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{inv.totalReceived} units</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{inv.currentQuantity} units</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full ${
                              percentage > 50 ? 'bg-green-500' :
                              percentage > 25 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{totalUsed} units</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded text-sm font-medium ${status.bg} ${status.color}`}>
                        {status.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderUsage = () => (
    <div>
      <div className="mb-6">
        <button
          onClick={() => {
            if (inventory.length === 0) {
              alert('No inventory available');
              return;
            }
            setShowUsageModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Record Daily Usage
        </button>
      </div>

      <div className="grid gap-6">
        {inventory.map((inv) => {
          const percentage = getStockPercentage(inv.currentQuantity, inv.totalReceived);
          const status = getStockStatus(percentage);
          
          return (
            <div key={inv.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{inv.medicine?.name || 'N/A'}</h3>
                <span className={`px-3 py-1 rounded text-sm font-medium ${status.bg} ${status.color}`}>
                  {percentage}% Stock
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Current Stock</p>
                  <p className="text-xl font-semibold">{inv.currentQuantity} units</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Received</p>
                  <p className="text-xl font-semibold">{inv.totalReceived} units</p>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className={`h-3 rounded-full ${
                    percentage > 50 ? 'bg-green-500' :
                    percentage > 25 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {percentage < 25 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                  <div className="text-sm text-red-700">
                    <p className="font-medium">Low Stock Alert!</p>
                    <p>Consider requesting restock soon to avoid running out.</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showUsageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Record Daily Usage</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medicine</label>
                <select
                  value={selectedMedicine?.id || ''}
                  onChange={(e) => {
                    const inv = inventory.find(i => i.id === parseInt(e.target.value));
                    setSelectedMedicine(inv);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select medicine</option>
                  {inventory.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.medicine?.name} (Available: {inv.currentQuantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount Used</label>
                <input
                  type="number"
                  value={usageAmount}
                  onChange={(e) => setUsageAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  max={selectedMedicine?.currentQuantity || 0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUsageModal(false);
                  setSelectedMedicine(null);
                  setUsageAmount('');
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordUsage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Record Usage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderRestock = () => (
    <div>
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Pending Requests</p>
              <p className="text-3xl font-semibold text-yellow-600">{pendingRestockCount}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="text-yellow-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Approved</p>
              <p className="text-3xl font-semibold text-green-600">
                {restockRequests.filter(r => r.status === 'APPROVED').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Rejected</p>
              <p className="text-3xl font-semibold text-red-600">
                {restockRequests.filter(r => r.status === 'REJECTED').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="text-red-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowRestockModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          New Restock Request
        </button>
      </div>

      <div className="space-y-4">
        {restockRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No restock requests yet</p>
          </div>
        ) : (
          restockRequests.map((req) => (
            <div key={req.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold">{req.medicine?.name || 'N/A'}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        req.urgency === 'HIGH' ? 'bg-red-100 text-red-700' :
                        req.urgency === 'MEDIUM' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {req.urgency} Priority
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        req.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{formatDate(req.requestDate)}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50 p-3 rounded">
                <div>
                  <p className="text-xs text-gray-500">Requested Quantity</p>
                  <p className="font-semibold">{req.requestedQuantity} units</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Current Stock</p>
                  <p className="font-semibold">{req.currentStock} units</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Reason</p>
                <p className="text-sm text-gray-700">{req.reason}</p>
              </div>

              {req.status === 'PENDING' && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={16} />
                  <span>Awaiting Review</span>
                </div>
              )}
              {req.status === 'APPROVED' && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                  <CheckCircle size={16} />
                  <span>Approved - Check notifications for details</span>
                </div>
              )}
              {req.status === 'REJECTED' && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded mb-2">
                    <XCircle size={16} />
                    <span>Rejected - Check notifications for feedback</span>
                  </div>
                  {req.rejectionReason && (
                    <div className="bg-red-50 p-3 rounded">
                      <p className="text-xs text-red-600 font-medium mb-1">Admin Feedback:</p>
                      <p className="text-sm text-red-700">{req.rejectionReason}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showRestockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">New Restock Request</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medicine</label>
                <select
                  value={restockForm.medicineId}
                  onChange={(e) => setRestockForm({...restockForm, medicineId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select medicine</option>
                  {inventory.map((inv) => (
                    <option key={inv.medicine?.id} value={inv.medicine?.id}>
                      {inv.medicine?.name} (Current: {inv.currentQuantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Requested Quantity</label>
                <input
                  type="number"
                  value={restockForm.requestedQuantity}
                  onChange={(e) => setRestockForm({...restockForm, requestedQuantity: e.target.value})}
                  placeholder="Enter quantity"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Urgency Level</label>
                <select
                  value={restockForm.urgency}
                  onChange={(e) => setRestockForm({...restockForm, urgency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="LOW">Low - Can wait 1 week</option>
                  <option value="MEDIUM">Medium - Needed in 2-3 days</option>
                  <option value="HIGH">High - Urgent, needed ASAP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason (min 20 characters)</label>
                <textarea
                  value={restockForm.reason}
                  onChange={(e) => setRestockForm({...restockForm, reason: e.target.value})}
                  placeholder="Explain why restock is needed"
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRestockModal(false);
                  setRestockForm({
                    medicineId: '',
                    requestedQuantity: '',
                    urgency: 'MEDIUM',
                    reason: ''
                  });
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRestockRequest}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {renderSidebar()}
      
      <div className="flex-1 ml-64">
        <header className="bg-white border-b px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Officer Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome, {currentUser}</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('username');
              localStorage.removeItem('userId');
              window.location.href = '/login';
            }}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </header>

        <main className="p-8">
          {activePage === 'notifications' && renderNotifications()}
          {activePage === 'inventory' && renderInventory()}
          {activePage === 'usage' && renderUsage()}
          {activePage === 'restock' && renderRestock()}
        </main>
      </div>
    </div>
  );
};

export default OfficerDashboard;