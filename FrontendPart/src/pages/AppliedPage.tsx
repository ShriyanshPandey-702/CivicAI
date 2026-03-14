import { Link } from 'react-router-dom';
import { FileDown, FileText, CheckCircle, Clock, Bot, ArrowRight } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useCitizen } from '@/lib/CitizenContext';

const AppliedPage = () => {
  const { citizenId, appliedSchemes, analysisComplete } = useCitizen();

  if (!citizenId) {
    return (
      <DashboardLayout>
        <div className="bg-card border border-border rounded-xl p-8 text-center max-w-md mx-auto mt-12">
          <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-foreground mb-2">Track Applications</h2>
          <p className="text-muted-foreground mb-6">Create a profile and apply for schemes to track their status here.</p>
          <Link to="/register" className="btn-saffron inline-flex items-center gap-2 text-sm">
            Create Profile
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">My Applications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track the status of your submitted government scheme applications.
        </p>
      </div>

      {appliedSchemes.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display text-lg font-bold text-foreground mb-2">No Applications Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            {analysisComplete
              ? 'Go to Eligible Schemes and click "Apply Now" on any scheme to generate your application.'
              : 'Run the AI analysis first to find schemes you\'re eligible for, then apply.'}
          </p>
          <Link to={analysisComplete ? "/dashboard/schemes" : "/dashboard/agent"} className="btn-saffron text-sm px-6 inline-flex items-center gap-2">
            {analysisComplete ? 'View Schemes' : 'Run AI Analysis'} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted text-muted-foreground text-sm border-b border-border">
                  <th className="p-4 font-medium">Scheme Name</th>
                  <th className="p-4 font-medium">Reference ID</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Est. Benefit</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {appliedSchemes.map((app) => (
                  <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium text-foreground">{app.scheme_name}</td>
                    <td className="p-4 text-sm font-mono text-muted-foreground">{app.reference_id}</td>
                    <td className="p-4 text-sm text-muted-foreground">{app.date}</td>
                    <td className="p-4 text-sm font-medium text-primary">
                      ₹{typeof app.benefit_amount === 'number' ? app.benefit_amount.toLocaleString('en-IN') : app.benefit_amount}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        app.status === 'Approved' ? 'bg-ashoka-green/10 text-ashoka-green' : 
                        app.status === 'Processing' ? 'bg-india-blue/10 text-india-blue' :
                        'bg-warning/10 text-warning'
                      }`}>
                        {app.status === 'Approved' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => window.open(`http://localhost:5000/api/download/${app.reference_id}`)}
                        className="inline-flex items-center gap-2 text-sm text-secondary hover:text-secondary/80 font-medium transition-colors"
                      >
                        <FileDown className="w-4 h-4" /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AppliedPage;
