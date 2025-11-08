import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MedicineDistributions from '../components/MedicineDistributions';

const DistributionsPage = () => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header 
          title="Medicine Distributions" 
          subtitle="Distribute medicines to healthcare officers" 
        />
        <MedicineDistributions />
      </div>
    </div>
  );
};

export default DistributionsPage;