import React from 'react';
import { Construction } from 'lucide-react';

const Placeholder = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
      <div className="bg-blue-100 p-4 rounded-full mb-6">
        <Construction className="h-12 w-12 text-blue-600" />
      </div>
      <h2 className="text-3xl font-bold text-slate-800 mb-2">{title}</h2>
      <p className="text-slate-500 max-w-md">
        This section is currently under construction and will be available in the next release of GoalSync Pro.
      </p>
    </div>
  );
};

export default Placeholder;
