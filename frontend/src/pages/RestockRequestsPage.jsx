import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Filter, Calendar, User, Pill, RefreshCw } from 'lucide-react';

const API_BASE = 'http://localhost:8080/api';

const RestockRequestsManagement = () => {
  const [requests, setRequests] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const currentUserId = localStorage.getItem('userId') || '1';

  useEffect(() => {
    fetchRestockRequests();
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(() => {
      fetchRestockRequests(true); // Silent refresh
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const fetchRestockRequests = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    
    try {
      const response = await fetch(`${API_BASE}/restock-requests`);
      if (response.ok) {
        const data = await response.json();
        
        // Debug logging
        console.log('=== RESTOCK REQUESTS DEBUG ===');
        console.log('Total requests:', data.length);
        data.forEach(req => {
          console.log(`ID: ${req.id} | Status: "${req.status}" | Urgency: "${req.urgency}" | Medicine: ${req.medicine?.name}`);
        });
        console.log('==============================');
        
        setRequests(data);
      } else {
        console.error('Failed to fetch requests:', response.status);
      }
    } catch (error) {
      console.error('Error fetching restock requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!confirm('Are you sure you want to approve this restock request?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/restock-requests/${requestId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reviewerId: parseInt(currentUserId)
        })
      });

      if (response.ok) {
        alert('Restock request approved successfully! Officer will be notified.');
        fetchRestockRequests();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving request');
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt('Enter reason for rejection:');
    
    if (reason === null) return; // User cancelled
    
    if (!reason || reason.trim().length < 10) {
      alert('Please provide a detailed reason (at least 10 characters)');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/restock-requests/${requestId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reviewerId: parseInt(currentUserId),
          rejectionReason: reason.trim()
        })
      });

      if (response.ok) {
        alert('Restock request rejected. Officer will be notified.');
        fetchRestockRequests();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error rejecting request');
    }
  };

  // Calculate statistics
  const stats = {
    pending: requests.filter(r => r.status === 'PENDING').length,
    urgent: requests.filter(r => r.urgency === 'HIGH' && r.status === 'PENDING').length,
    approved: requests.filter(r => r.status === 'APPROVED').length
  };

  // Filter requests
  const filteredRequests = requests.filter(request => {
    const statusMatch = filterStatus === 'all' || request.status === filterStatus.toUpperCase();
    const urgencyMatch = filterUrgency === 'all' || request.urgency === filterUrgency.toUpperCase();
    return statusMatch && urgencyMatch;
  });

  const getPriorityBadge = (urgency) => {
    const badges = {
      HIGH: 'bg-red-100 text-red-700',
      MEDIUM: 'bg-orange-100 text-orange-700',
      LOW: 'bg-blue-100 text-blue-700'
    };
    return badges[urgency] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityLabel = (urgency) => {
    const labels = {
      HIGH: 'High Priority',
      MEDIUM: 'Medium Priority',
      LOW: 'Low Priority'
    };
    return labels[urgency] || urgency;
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      APPROVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700'
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Restock Requests Management</h1>
          <p className="text-gray-600 mt-1">Review and manage officer medicine restock requests</p>
        </div>
        <button
          onClick={() => fetchRestockRequests()}
          disabled={loading || refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Pending Requests</p>
              <p className="text-3xl font-semibold text-yellow-600">{stats.pending}</p>
              <p className="text-xs text-gray-400 mt-1">Awaiting approval</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">High Urgency</p>
              <p className="text-3xl font-semibold text-red-600">{stats.urgent}</p>
              <p className="text-xs text-gray-400 mt-1">Urgent requests</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Approved</p>
              <p className="text-3xl font-semibold text-green-600">{stats.approved}</p>
              <p className="text-xs text-gray-400 mt-1">All time</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
            <select 
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Urgency Levels</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Restock Requests</h2>
          <p className="text-sm text-gray-500">Review and approve officer requests • Total: {requests.length}</p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading requests...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No restock requests found</p>
              {requests.length > 0 && (
                <p className="text-sm text-gray-400 mt-2">Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests
                .sort((a, b) => {
                  // Sort by urgency (HIGH > MEDIUM > LOW) then by date
                  const urgencyOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
                  const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
                  if (urgencyDiff !== 0) return urgencyDiff;
                  return new Date(b.requestDate) - new Date(a.requestDate);
                })
                .map((request) => (
                  <div 
                    key={request.id} 
                    className={`border rounded-lg p-6 hover:bg-gray-50 transition-colors ${
                      request.urgency === 'HIGH' && request.status === 'PENDING' 
                        ? 'border-red-300 bg-red-50' 
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Pill className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {request.medicine?.name || 'N/A'} {request.medicine?.dosage || ''}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <User size={14} />
                              <span>{request.officer?.username || 'N/A'}</span>
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getPriorityBadge(request.urgency)}`}>
                              {getPriorityLabel(request.urgency)}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 whitespace-nowrap ${getStatusBadge(request.status)}`}>
                              {request.status === 'APPROVED' && <CheckCircle size={12} />}
                              {request.status === 'REJECTED' && <XCircle size={12} />}
                              <span>{request.status}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(request.requestDate)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Current Stock</p>
                        <p className="font-semibold text-gray-900">{request.currentStock || 0} units</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Requested Quantity</p>
                        <p className="font-semibold text-blue-600">{request.requestedQuantity || 0} units</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Request Date</p>
                        <p className="font-semibold text-gray-900">{formatDate(request.requestDate)}</p>
                      </div>
                    </div>

                    {request.reason && (
                      <div className="mb-4 bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1 font-medium">Reason for Request</p>
                        <p className="text-sm text-gray-700">{request.reason}</p>
                      </div>
                    )}

                    {request.status === 'PENDING' ? (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
                        >
                          <CheckCircle size={18} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 transition-colors"
                        >
                          <XCircle size={18} />
                          Reject
                        </button>
                      </div>
                    ) : request.status === 'APPROVED' ? (
                      <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                        <CheckCircle size={18} />
                        <span className="font-medium">Approved</span>
                        {request.reviewedAt && (
                          <span className="text-sm ml-auto">
                            on {formatDate(request.reviewedAt)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                        <XCircle size={18} />
                        <span className="font-medium">Rejected</span>
                        {request.reviewedAt && (
                          <span className="text-sm ml-auto">
                            on {formatDate(request.reviewedAt)}
                          </span>
                        )}
                      </div>
                    )}

                    {request.rejectionReason && request.status === 'REJECTED' && (
                      <div className="mt-3 bg-red-50 p-3 rounded-lg">
                        <p className="text-xs text-red-600 font-medium mb-1">Rejection Reason:</p>
                        <p className="text-sm text-red-700">{request.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestockRequestsManagement;