import { ClipboardList } from 'lucide-react';

const AssignmentsPage = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-dbu-primary" />
          Assignments
        </h1>
        <p className="text-slate-500 mt-2">
          Advisor assignment workflows and related records are shown on this page.
        </p>
      </div>
    </div>
  );
};

export default AssignmentsPage;
