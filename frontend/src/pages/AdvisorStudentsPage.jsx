import { GraduationCap } from 'lucide-react';

const AdvisorStudentsPage = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-dbu-primary" />
          Students
        </h1>
        <p className="text-slate-500 mt-2">
          Advisor-specific student records and supervision details are shown on this page.
        </p>
      </div>
    </div>
  );
};

export default AdvisorStudentsPage;
