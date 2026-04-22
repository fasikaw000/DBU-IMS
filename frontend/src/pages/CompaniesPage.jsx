import { Building2 } from 'lucide-react';

const CompaniesPage = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-dbu-primary" />
          Companies
        </h1>
        <p className="text-slate-500 mt-2">
          Company management and placement partners are shown on this page.
        </p>
      </div>
    </div>
  );
};

export default CompaniesPage;
