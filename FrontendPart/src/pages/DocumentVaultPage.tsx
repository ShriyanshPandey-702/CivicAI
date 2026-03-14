import { useState, useEffect } from 'react';
import { Upload, CheckCircle, AlertTriangle, Shield, FileText } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useCitizen } from '@/lib/CitizenContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const REQUIRED_DOCS = [
  { id: 'aadhaar', name: 'Aadhaar Card', description: 'Primary ID for all schemes', status: 'uploaded' },
  { id: 'income_cert', name: 'Income Certificate', description: 'Required for EWS and most financial schemes', status: 'missing' },
  { id: 'caste_cert', name: 'Caste Certificate', description: 'Required for reserved category benefits', status: 'missing' },
  { id: 'address_proof', name: 'Address Proof', description: 'Ration card, voter ID, or utility bill', status: 'uploaded' },
  { id: 'land_record', name: 'Land Record', description: 'Only required for agricultural and farmer schemes', status: 'missing' },
  { id: 'bank_passbook', name: 'Bank Passbook', description: 'Required for direct cash transfers', status: 'missing' },
];

const DocumentVaultPage = () => {
  const { citizenId } = useCitizen();
  const [docs, setDocs] = useState(REQUIRED_DOCS);
  const [uploading, setUploading] = useState<string | null>(null);

  // Fetch the actual uploaded files from Supabase storage
  const fetchDocuments = async () => {
    if (!citizenId) return;
    
    try {
      // List all files in the user's folder
      const { data, error } = await supabase.storage.from('id_proofs').list(citizenId);
      
      if (error) {
        console.error("Storage list error:", error);
        return;
      }
      
      // Get the prefixes of the uploaded files (e.g. 'aadhaar' from 'aadhaar-1234.pdf')
      const uploadedPrefixes = data ? data.map(file => file.name.split('-')[0]) : [];
      
      // Update the local required docs state to reflect reality
      setDocs(REQUIRED_DOCS.map(doc => ({
        ...doc,
        // If we found a file in storage that starts with this doc's ID, it's uploaded
        status: uploadedPrefixes.includes(doc.id) ? 'uploaded' : 'missing'
      })));
      
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    }
  };

  // Run once on mount and whenever citizenId changes
  useEffect(() => {
    fetchDocuments();
  }, [citizenId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, docId: string) => {
    const file = e.target.files?.[0];
    if (!file || !citizenId) return;

    setUploading(docId);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${citizenId}/${docId}-${Math.random()}.${fileExt}`;
      
      const { error } = await supabase.storage.from('id_proofs').upload(filePath, file);
      
      if (error) throw error;

      toast.success(`${file.name} uploaded successfully!`);
      
      // Refresh the list from the server to guarantee accuracy
      await fetchDocuments();
      
    } catch (err: any) {
      toast.error(err.message || "Failed to upload document");
    } finally {
      setUploading(null);
    }
  };

  if (!citizenId) {
    return (
      <DashboardLayout>
        <div className="bg-card border border-border rounded-xl p-8 text-center max-w-md mx-auto mt-12">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-foreground mb-2">Complete Profile First</h2>
          <p className="text-muted-foreground mb-4">You need to register your profile before uploading documents to your secure vault.</p>
        </div>
      </DashboardLayout>
    );
  }

  const uploadedCount = docs.filter(d => d.status === 'uploaded').length;

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Document Vault</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Securely store your documents for faster, one-click scheme applications.
          </p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-medium text-sm border border-primary/20">
          {uploadedCount} of {docs.length} Documents Uploaded
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docs.map((doc) => (
          <div key={doc.id} className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${doc.status === 'uploaded' ? 'bg-ashoka-green/10 text-ashoka-green' : 'bg-muted text-muted-foreground'}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{doc.name}</h3>
                  <p className="text-xs text-muted-foreground">{doc.description}</p>
                </div>
              </div>
              {doc.status === 'uploaded' ? (
                <CheckCircle className="w-5 h-5 text-ashoka-green" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4 mt-auto">
              <span className={`text-xs font-semibold uppercase tracking-wider ${doc.status === 'uploaded' ? 'text-ashoka-green' : 'text-amber-500'}`}>
                {doc.status === 'uploaded' ? 'Ready for use' : 'Missing'}
              </span>
              
              <label className={`text-sm font-medium px-4 py-1.5 rounded-md cursor-pointer transition-colors flex items-center gap-2 ${
                doc.status === 'uploaded' 
                  ? 'bg-muted text-foreground hover:bg-muted/80' 
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}>
                {uploading === doc.id ? (
                  <span className="animate-pulse">Uploading...</span>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {doc.status === 'uploaded' ? 'Replace' : 'Upload'}
                  </>
                )}
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*,.pdf" 
                  onChange={(e) => handleUpload(e, doc.id)}
                  disabled={uploading === doc.id}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-start gap-4">
        <Shield className="w-6 h-6 text-primary shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-foreground mb-1">100% Encrypted & Secure</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All documents uploaded to the CivicAI vault are encrypted at rest using AES-256 bank-level security. 
            They are only accessed when generating official PDF applications with your explicit consent.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DocumentVaultPage;
