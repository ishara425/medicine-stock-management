// frontend/src/components/pages/ReportsPage.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

import Header from '../components/Header';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  FiTrendingUp, FiPackage, FiUsers, FiAlertTriangle,
  FiDownload, FiCalendar, FiCheckCircle, FiClock, FiActivity
} from 'react-icons/fi';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api`;


const ReportsPage = () => {
  const [timeRange, setTimeRange] = useState('30');
  const [loading, setLoading] = useState(true);
  
  // State for each data section
  const [overviewData, setOverviewData] = useState(null);
  const [distributionData, setDistributionData] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [restockData, setRestockData] = useState(null);
  const [predictionsData, setPredictionsData] = useState(null);

  // Fetch all report data
  useEffect(() => {
    fetchAllReportData();
  }, [timeRange]);

  const fetchAllReportData = async () => {
    setLoading(true);
    try {
      // Fetch Overview
      const overviewRes = await fetch(`${API_BASE}/reports/overview?days=${timeRange}`);
      const overview = await overviewRes.json();
      setOverviewData(overview.overview);

      // Fetch Distribution Analytics
      const distRes = await fetch(`${API_BASE}/reports/distribution-analytics?days=${timeRange}`);
      const dist = await distRes.json();
      setDistributionData(dist);

      // Fetch Stock Analytics
      const stockRes = await fetch(`${API_BASE}/reports/stock-analytics`);
      const stock = await stockRes.json();
      setStockData(stock);

      // Fetch Usage Analytics
      const usageRes = await fetch(`${API_BASE}/reports/usage-analytics?days=${timeRange}`);
      const usage = await usageRes.json();
      setUsageData(usage);

      // Fetch Restock Analytics
      const restockRes = await fetch(`${API_BASE}/reports/restock-analytics?days=${timeRange}`);
      const restock = await restockRes.json();
      setRestockData(restock);

      // Fetch Predictions
      const predRes = await fetch(`${API_BASE}/reports/predictions`);
      const pred = await predRes.json();
      setPredictionsData(pred.predictions);

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Export report functionality
  const handleExport = async () => {
    try {
      const response = await fetch(`${API_BASE}/reports/export?days=${timeRange}`);
      const data = await response.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medicine_report_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      alert('Report exported successfully!');
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report');
    }
  };

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Header title="Reports & Analytics" subtitle="Comprehensive system insights" />
          <div className="p-8">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">Loading comprehensive analytics...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header title="Reports & Analytics" subtitle="Comprehensive system insights and performance metrics" />
        
        <div className="p-8">
          {/* Header Controls */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <FiCalendar className="text-blue-600" size={24} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Period
                  </label>
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                    <option value="90">Last 90 Days</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
              </div>
              
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg"
              >
                <FiDownload size={20} />
                Export Report
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <KPICard
              icon={<FiTrendingUp />}
              title="Total Distributions"
              value={overviewData?.totalDistributions || 0}
              subtitle={`${overviewData?.acceptanceRate || 0}% acceptance`}
              color="blue"
              trend="+12%"
            />
            <KPICard
              icon={<FiPackage />}
              title="Quantity Distributed"
              value={overviewData?.totalQuantityDistributed || 0}
              subtitle="Total units"
              color="green"
              trend="+8%"
            />
            <KPICard
              icon={<FiUsers />}
              title="Active Officers"
              value={overviewData?.totalOfficers || 0}
              subtitle={`${overviewData?.totalMedicines || 0} medicines`}
              color="purple"
            />
            <KPICard
              icon={<FiAlertTriangle />}
              title="Low Stock"
              value={overviewData?.lowStockCount || 0}
              subtitle="Items need restock"
              color="orange"
              alert
            />
            <KPICard
              icon={<FiClock />}
              title="Pending Requests"
              value={overviewData?.pendingRequests || 0}
              subtitle="Awaiting approval"
              color="red"
              alert
            />
          </div>

          {/* Distribution Analytics Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FiActivity className="text-blue-600" />
              Distribution Analytics
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Distribution Trend */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Daily Distribution Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={distributionData?.dailyTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                    />
                    <Legend />
                    <Bar dataKey="distributions" fill="#3B82F6" name="Count" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="quantity" fill="#10B981" name="Quantity" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Distributed Medicines */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Top Distributed Medicines</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={distributionData?.topMedicines?.slice(0, 5) || []}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" />
                    <YAxis dataKey="medicine" type="category" width={150} stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                    />
                    <Bar dataKey="totalQuantity" fill="#8B5CF6" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Officer Performance */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200">
            <h3 className="text-xl font-bold mb-6 text-gray-800">Officer Performance Metrics</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Officer Name
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Total Distributions
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Total Quantity
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Completed
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Acceptance Rate
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Performance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {distributionData?.officerPerformance?.map((officer, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-700 font-semibold">
                              {officer.officer.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{officer.officer}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-700 font-medium">
                        {officer.totalDistributions}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-700 font-medium">
                        {officer.totalQuantity}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-700 font-medium">
                        {officer.completed}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                          officer.acceptanceRate >= 90
                            ? 'bg-green-100 text-green-800'
                            : officer.acceptanceRate >= 75
                            ? 'bg-blue-100 text-blue-800'
                            : officer.acceptanceRate >= 60
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {officer.acceptanceRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          officer.acceptanceRate >= 90
                            ? 'bg-green-100 text-green-800'
                            : officer.acceptanceRate >= 75
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {officer.acceptanceRate >= 90 ? 'Excellent' : officer.acceptanceRate >= 75 ? 'Good' : 'Fair'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stock & Usage Analytics */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FiPackage className="text-green-600" />
              Stock & Usage Analytics
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Stock Status Pie Chart */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Stock Health Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Healthy Stock', value: stockData?.stockHealth?.healthy || 0 },
                        { name: 'Low Stock', value: stockData?.stockHealth?.low || 0 },
                        { name: 'Critical Stock', value: stockData?.stockHealth?.critical || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#10B981" />
                      <Cell fill="#F59E0B" />
                      <Cell fill="#EF4444" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {stockData?.stockHealth?.healthy || 0}
                    </div>
                    <div className="text-xs text-gray-600">Healthy</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {stockData?.stockHealth?.low || 0}
                    </div>
                    <div className="text-xs text-gray-600">Low</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {stockData?.stockHealth?.critical || 0}
                    </div>
                    <div className="text-xs text-gray-600">Critical</div>
                  </div>
                </div>
              </div>

              {/* Daily Usage Trend */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Daily Usage Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={usageData?.dailyUsage || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="quantity" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', r: 4 }}
                      name="Quantity Used"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Restock Request Analytics */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200">
            <h3 className="text-xl font-bold mb-6 text-gray-800">Restock Request Analytics</h3>
            <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
              <StatBox
                label="Total"
                value={
                  (restockData?.statusBreakdown?.PENDING || 0) +
                  (restockData?.statusBreakdown?.APPROVED || 0) +
                  (restockData?.statusBreakdown?.REJECTED || 0)
                }
                color="bg-blue-500"
              />
              <StatBox
                label="Pending"
                value={restockData?.statusBreakdown?.PENDING || 0}
                color="bg-yellow-500"
              />
              <StatBox
                label="Approved"
                value={restockData?.statusBreakdown?.APPROVED || 0}
                color="bg-green-500"
              />
              <StatBox
                label="Rejected"
                value={restockData?.statusBreakdown?.REJECTED || 0}
                color="bg-red-500"
              />
              <StatBox
                label="High"
                value={restockData?.urgencyBreakdown?.HIGH || 0}
                color="bg-red-600"
                icon="🔴"
              />
              <StatBox
                label="Medium"
                value={restockData?.urgencyBreakdown?.MEDIUM || 0}
                color="bg-yellow-600"
                icon="🟡"
              />
              <StatBox
                label="Low"
                value={restockData?.urgencyBreakdown?.LOW || 0}
                color="bg-green-600"
                icon="🟢"
              />
            </div>
          </div>

          {/* Top Usage by Medicine */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200">
            <h3 className="text-xl font-bold mb-6 text-gray-800">Top Medicine Usage</h3>
            <div className="space-y-4">
              {usageData?.usageByMedicine?.slice(0, 8).map((med, idx) => {
                const maxUsage = usageData.usageByMedicine[0]?.totalUsed || 1;
                const percentage = (med.totalUsed / maxUsage) * 100;
                return (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold text-gray-800">{med.medicine}</span>
                        <span className="text-sm font-bold text-blue-600">{med.totalUsed} units</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">{med.dosage}</span>
                        <span className="text-xs text-gray-500">{med.category}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Predictive Alerts */}
          {predictionsData && predictionsData.length > 0 && (
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl shadow-md p-6 mb-8 border-2 border-red-200">
              <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <FiAlertTriangle className="text-red-600" size={24} />
                Low Stock Predictions & Critical Alerts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {predictionsData.map((pred, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg p-5 border-2 shadow-lg ${
                      pred.severity === 'critical'
                        ? 'bg-red-100 border-red-400'
                        : 'bg-yellow-100 border-yellow-400'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg">{pred.medicine}</h4>
                        <p className="text-sm text-gray-700 mt-1">
                          <FiUsers className="inline mr-1" size={14} />
                          Officer: {pred.officer}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          pred.severity === 'critical'
                            ? 'bg-red-600 text-white'
                            : 'bg-yellow-600 text-white'
                        }`}
                      >
                        {pred.severity === 'critical' ? '🚨 CRITICAL' : '⚠️ WARNING'}
                      </span>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 font-medium">Current Stock:</span>
                        <span className="font-bold text-gray-900">{pred.currentQuantity} units</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 font-medium">Avg Usage:</span>
                        <span className="font-bold text-gray-900">{pred.avgDailyUsage} units/day</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 font-medium">Days Remaining:</span>
                        <span className={`font-bold ${
                          pred.daysUntilEmpty <= 2 ? 'text-red-700' : 'text-yellow-700'
                        }`}>
                          ~{pred.daysUntilEmpty} days
                        </span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${
                      pred.severity === 'critical' ? 'bg-red-200' : 'bg-yellow-200'
                    }`}>
                      <p className="text-sm font-semibold text-gray-900">
                        💡 {pred.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expiring Medicines */}
          {stockData?.expiringMedicines && stockData.expiringMedicines.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200">
              <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <FiClock className="text-orange-600" />
                Medicines Expiring Soon (Within 30 Days)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Medicine</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Dosage</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Stock</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Expiry Date</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Days Left</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stockData.expiringMedicines.map((med, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{med.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{med.dosage}</td>
                        <td className="px-6 py-4 text-sm text-center font-semibold text-gray-900">{med.stock}</td>
                        <td className="px-6 py-4 text-sm text-center text-gray-700">
                          {new Date(med.expirationDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          <span className={`font-bold ${
                            med.daysUntilExpiry <= 7 ? 'text-red-600' : 
                            med.daysUntilExpiry <= 15 ? 'text-orange-600' : 'text-yellow-600'
                          }`}>
                            {med.daysUntilExpiry} days
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            med.daysUntilExpiry <= 7 
                              ? 'bg-red-100 text-red-800'
                              : med.daysUntilExpiry <= 15
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {med.daysUntilExpiry <= 7 ? 'Urgent' : med.daysUntilExpiry <= 15 ? 'Soon' : 'Upcoming'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* System Insights */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-md p-8 border border-blue-200">
            <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <FiCheckCircle className="text-blue-600" />
              Automated System Insights & Recommendations
            </h3>
            <div className="space-y-4">
              {overviewData?.acceptanceRate < 80 && (
                <InsightCard
                  type="warning"
                  message={`Distribution acceptance rate is ${overviewData.acceptanceRate}%. Consider reviewing distribution processes and officer communication.`}
                />
              )}
              {overviewData?.lowStockCount > 0 && (
                <InsightCard
                  type="alert"
                  message={`${overviewData.lowStockCount} medicines are running low on stock. Immediate restocking recommended to avoid service disruption.`}
                />
              )}
              {overviewData?.pendingRequests > 5 && (
                <InsightCard
                  type="info"
                  message={`${overviewData.pendingRequests} restock requests are pending review. Timely approval will improve operational efficiency.`}
                />
              )}
              {stockData?.expiringMedicines?.length > 0 && (
                <InsightCard
                  type="warning"
                  message={`${stockData.expiringMedicines.length} medicines are expiring within 30 days. Plan distribution or proper disposal procedures.`}
                />
              )}
              {predictionsData?.length > 0 && (
                <InsightCard
                  type="alert"
                  message={`${predictionsData.length} critical low stock predictions detected. Officers will run out of medicines within 2-5 days based on current usage patterns.`}
                />
              )}
              {overviewData?.acceptanceRate >= 90 && overviewData?.lowStockCount === 0 && (
                <InsightCard
                  type="success"
                  message="Excellent system performance! High acceptance rate and healthy stock levels indicate efficient operations."
                />
              )}
              {restockData?.avgResponseTime && restockData.avgResponseTime > 48 && (
                <InsightCard
                  type="info"
                  message={`Average restock request response time is ${restockData.avgResponseTime} hours. Consider reducing this to improve officer satisfaction.`}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// KPI Card Component
const KPICard = ({ icon, title, value, subtitle, color, trend, alert }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`bg-gradient-to-br ${colorClasses[color]} text-white p-3 rounded-lg shadow-md`}>
          {React.cloneElement(icon, { size: 24 })}
        </div>
        {trend && (
          <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-2">{title}</h3>
      <p className={`text-3xl font-bold mb-1 ${alert ? 'text-red-600' : 'text-gray-900'}`}>
        {value.toLocaleString()}
      </p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );
};

// Stat Box Component
const StatBox = ({ label, value, color, icon }) => {
  return (
    <div className={`${color} text-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow`}>
      <div className="text-center">
        {icon && <div className="text-2xl mb-1">{icon}</div>}
        <p className="text-3xl font-bold mb-1">{value}</p>
        <p className="text-xs opacity-90 uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
};

// Insight Card Component
const InsightCard = ({ type, message }) => {
  const types = {
    success: { 
      bg: 'bg-green-100 border-green-300', 
      text: 'text-green-800', 
      icon: <FiCheckCircle size={20} />,
      iconBg: 'bg-green-200'
    },
    warning: { 
      bg: 'bg-yellow-100 border-yellow-300', 
      text: 'text-yellow-800', 
      icon: <FiAlertTriangle size={20} />,
      iconBg: 'bg-yellow-200'
    },
    alert: { 
      bg: 'bg-red-100 border-red-300', 
      text: 'text-red-800', 
      icon: <FiAlertTriangle size={20} />,
      iconBg: 'bg-red-200'
    },
    info: { 
      bg: 'bg-blue-100 border-blue-300', 
      text: 'text-blue-800', 
      icon: <FiTrendingUp size={20} />,
      iconBg: 'bg-blue-200'
    }
  };

  const config = types[type];

  return (
    <div className={`${config.bg} ${config.text} rounded-lg p-5 flex items-start gap-4 border-2 shadow-sm`}>
      <div className={`${config.iconBg} p-2 rounded-lg flex-shrink-0`}>
        {config.icon}
      </div>
      <p className="text-sm font-medium flex-1 leading-relaxed">{message}</p>
    </div>
  );
};

export default ReportsPage;