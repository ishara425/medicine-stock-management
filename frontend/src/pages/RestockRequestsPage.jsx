import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { AlertTriangle, CheckCircle, Filter, Calendar, User, Pill } from 'lucide-react';

const RestockRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [loading, setLoading] = useState(true);

  const API_BASE = 'http://localhost:8080/api';

  useEffect(() => {
    fetchRestockRequests();
  }, []);

  const fetchRestockRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/restock-requests`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching restock requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    pending: requests.filter(r => r.status === 'PENDING').length,
    urgent: requests.filter(r => r.urgency === 'HIGH').length,
    approved: requests.filter(r => r.status === 'APPROVED').length
  };

  const filteredRequests = requests.filter(request => {
    const statusMatch = filterStatus === 'all' || request.status === filterStatus.toUpperCase();
    const urgencyMatch = filterUrgency === 'all' || request.urgency === filterUrgency.toUpperCase();
    return statusMatch && urgencyMatch;
  });

  const getPriorityBadge = (urgency) => {
    const badges = {
      HIGH: 'bg-red-100 text-red-700',
      MEDIUM: 'bg-yellow-100 text-yellow-700',
      LOW: 'bg-green-100 text-green-700'
    };
    return badges[urgency] || 'bg-gray-100 text-gray-700';
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header 
          title="Restock Requests" 
          subtitle="Review and manage officer medicine restock requests" 
        />
        
        <div className="p-8">
          {/* Stats Cards */}
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
                  <p className="text-sm text-gray-500 mb-1">Approved</p>
                  <p className="text-3xl font-semibold text-green-600">{stats.approved}</p>
                  <p className="text-xs text-gray-400 mt-1">Total approved</p>
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
              <p className="text-sm text-gray-500">Review and approve officer requests</p>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading requests...</div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No requests found</div>
              ) : (
                filteredRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 mb-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Pill className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {request.medicine?.name || 'N/A'} {request.medicine?.dosage || ''}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <User size={14} />
                              {request.officer?.username || 'N/A'}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs ${getPriorityBadge(request.urgency)}`}>
                              {request.urgency} Priority
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${getStatusBadge(request.status)}`}>
                              {request.status === 'APPROVED' && <CheckCircle size={12} />}
                              {request.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(request.requestDate)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3 bg-gray-50 p-3 rounded">
                      <div>
                        <p className="text-xs text-gray-500">Current Stock</p>
                        <p className="font-semibold text-gray-900">{request.currentStock || 0} units</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Requested Qty</p>
                        <p className="font-semibold text-blue-600">{request.requestedQuantity || 0} units</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Request Date</p>
                        <p className="font-semibold text-gray-900">{formatDate(request.requestDate)}</p>
                      </div>
                    </div>

                    {request.reason && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Reason for Request</p>
                        <p className="text-sm text-gray-700">{request.reason}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestockRequestsPage;