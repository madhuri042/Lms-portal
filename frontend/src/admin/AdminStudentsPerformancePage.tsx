import React, { useEffect, useState } from 'react';
import { Award, User } from 'lucide-react';

type PerfRow = {
  student: { _id: string; firstName?: string; lastName?: string; email?: string };
  assignmentsEvaluated: number;
  totalMarksPossible: number;
  totalMarksObtained: number;
  averagePercent: number;
};

export const AdminStudentsPerformancePage: React.FC = () => {
  const [data, setData] = useState<PerfRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/admin/students/performance', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const studentName = (r: PerfRow) =>
    [r.student?.firstName, r.student?.lastName].filter(Boolean).join(' ') || r.student?.email || '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Award className="w-8 h-8 text-indigo-600" />
        <h1 className="text-2xl font-bold text-slate-900">Students Performance</h1>
      </div>
      <p className="text-slate-600">Assignment grades and average scores per student.</p>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Student</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Assignments evaluated</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Marks obtained</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Total possible</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Average %</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">Loading...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">No performance data yet. Evaluate assignments to see results.</td>
                </tr>
              ) : (
                data.map((r, idx) => (
                  <tr key={r.student?._id || idx} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-900">{studentName(r)}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{r.assignmentsEvaluated}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{r.totalMarksObtained}</td>
                    <td className="py-3 px-4 text-slate-600">{r.totalMarksPossible}</td>
                    <td className="py-3 px-4">
                      <span className={`font-medium ${r.averagePercent >= 70 ? 'text-green-600' : r.averagePercent >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                        {r.averagePercent}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
