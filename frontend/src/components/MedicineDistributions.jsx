import { useState, useEffect } from 'react';
import { Calendar, User, Pill, Send } from 'lucide-react';

export default function MedicineDistributions() {
  const [officers, setOfficers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [formData, setFormData] = useState({
    officerId: '',
    medicineId: '',
    quantity: ''
  });
  const [loading, setLoading] = useState(false);

  const API_BASE = 'http://localhost:8080/api';

  useEffect(() => {
    fetchOfficers();
    fetchMedicines();
    fetchDistributions();
  }, []);

  const fetchOfficers = async () => {
    try {
      const response = await fetch(`${API_BASE}/distributions/officers`);
      const data = await response.json();
      setOfficers(data);
    } catch (error) {
      console.error('Error fetching officers:', error);
    }
  };

  const fetchMedicines = async () => {
    try {
      const response = await fetch(`${API_BASE}/distributions/medicines`);
      const data = await response.json();
      setMedicines(data);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const fetchDistributions = async () => {
    try {
      const response = await fetch(`${API_BASE}/distributions`);
      const data = await response.json();
      setDistributions(data);
    } catch (error) {
      console.error('Error fetching distributions:', error);
    }
  };

  const handleDistribute = async () => {
    if (!formData.officerId || !formData.medicineId || !formData.quantity) {
      alert('Please fill in all fields');
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/distributions?officerId=${formData.officerId}&medicineId=${formData.medicineId}&quantity=${quantity}`,
        { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (response.ok) {
        alert('Medicine distributed successfully!');
        setFormData({ officerId: '', medicineId: '', quantity: '' });
        fetchDistributions();
        fetchMedicines(); // Refresh medicines to show updated stock
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        console.error('Request URL:', `${API_BASE}/distributions?officerId=${formData.officerId}&medicineId=${formData.medicineId}&quantity=${quantity}`);
        alert(`Failed to distribute medicine. Check console for details.`);
      }
    } catch (error) {
      console.error('Error distributing medicine:', error);
      alert(`Error distributing medicine: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Medicine Distributions</h1>
          <p className="text-gray-600 mt-1">Distribute medicines to healthcare officers and track history</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Distribute Medicine</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Officer Name</label>
              <select
                value={formData.officerId}
                onChange={(e) => setFormData({ ...formData, officerId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Officer</option>
                {officers.map((officer) => (
                  <option key={officer.id} value={officer.id}>
                    {officer.username}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Medicine</label>
              <select
                value={formData.medicineId}
                onChange={(e) => setFormData({ ...formData, medicineId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Medicine</option>
                {medicines.map((medicine) => (
                  <option key={medicine.id} value={medicine.id}>
                    {medicine.name} {medicine.dosage} (Stock: {medicine.stock})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="Enter quantity"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleDistribute}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send size={18} />
                {loading ? 'Distributing...' : 'Distribute'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Distribution History</h2>
            <p className="text-sm text-gray-600 mt-1">Recent medicine distributions to healthcare officers</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DATE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    OFFICER
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MEDICINE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    QUANTITY
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STATUS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {distributions.map((dist) => (
                  <tr key={dist.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar size={16} className="mr-2 text-gray-400" />
                        {formatDate(dist.date || dist.distributionDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <User size={16} className="mr-2 text-gray-400" />
                        {dist.officer?.username || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Pill size={16} className="mr-2 text-gray-400" />
                        {dist.medicine?.name || 'N/A'} {dist.medicine?.dosage || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dist.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(dist.status)}`}>
                        {dist.status || 'Completed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {distributions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No distribution history available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}