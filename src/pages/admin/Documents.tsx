import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, File, Search, Trash2, Loader2, Sparkles, Plus, Globe } from "lucide-react";
import api from '../../lib/api';

interface RagDoc {
  id: string;
  filename: string;
  category: string;
  chunkCount: number;
  uploadedBy: string;
  status: 'processing' | 'ready' | 'failed';
  createdAt: string;
}

export default function Documents() {
  const [documents, setDocuments] = useState<RagDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form states
  const [category, setCategory] = useState('Study Abroad');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Website form states
  const [websiteDialogOpen, setWebsiteDialogOpen] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteCategory, setWebsiteCategory] = useState('Study Abroad');
  const [websiteIngesting, setWebsiteIngesting] = useState(false);

  const handleWebsiteIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl) return;

    setWebsiteIngesting(true);
    setError('');

    try {
      await api.post('/admin/documents/ingest-website', {
        url: websiteUrl,
        category: websiteCategory,
      });
      setWebsiteUrl('');
      setWebsiteDialogOpen(false);
      setLoading(true);
      fetchDocuments();
    } catch (err: any) {
      console.error("Failed to ingest website:", err);
      setError(err.response?.data?.error || 'Failed to ingest website.');
    } finally {
      setWebsiteIngesting(false);
    }
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/admin/documents');
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.error("Failed to load documents:", err);
      setError('Could not fetch indexed documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('category', category);

    try {
      await api.post('/admin/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // Clear forms
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setDialogOpen(false);
      // Refresh list
      setLoading(true);
      fetchDocuments();
    } catch (err: any) {
      console.error("Failed to upload document:", err);
      setError(err.response?.data?.error || 'Failed to ingest document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this document? All associated vector embeddings will be removed.")) return;

    try {
      await api.delete(`/admin/documents/${id}`);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (err) {
      console.error("Failed to delete document:", err);
      alert("Failed to delete the document.");
    }
  };

  const filteredDocs = documents.filter(doc =>
    doc.filename.toLowerCase().includes(search.toLowerCase()) ||
    doc.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            Knowledge Base Manager <Sparkles className="w-6 h-6 text-red-400" />
          </h1>
          <p className="text-gray-600 mt-2">Upload documents or crawl websites to chunk and ingest into the RAG system.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Add Website Dialog */}
          <Dialog open={websiteDialogOpen} onOpenChange={setWebsiteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600/10 hover:bg-red-600/20 text-red-600 font-medium border border-red-200">
                <Globe className="w-4 h-4 mr-2" />
                Add Website
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-50 border-gray-200 text-gray-900 max-w-md">
              <form onSubmit={handleWebsiteIngest}>
                <DialogHeader>
                  <DialogTitle>Crawl & Ingest Website</DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Provide a website URL to crawl. The RAG system will strip HTML, extract texts, chunk and index it. Adding an existing URL will reload and overwrite it.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-5 py-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</label>
                    <select
                      value={websiteCategory}
                      onChange={(e) => setWebsiteCategory(e.target.value)}
                      className="w-full bg-white border border-gray-200 text-gray-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
                    >
                      <option value="Study Abroad">Study Abroad</option>
                      <option value="Work Abroad">Work Abroad</option>
                      <option value="PR & Immigration">PR & Immigration</option>
                      <option value="Visit & Tourism">Visit & Tourism</option>
                      <option value="General Knowledge">General Knowledge</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Website URL</label>
                    <Input
                      type="url"
                      placeholder="https://example.com/about"
                      required
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 focus-visible:ring-red-500 text-sm"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setWebsiteDialogOpen(false)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={websiteIngesting || !websiteUrl}
                    className="bg-red-600 hover:bg-red-500 text-white font-medium"
                  >
                    {websiteIngesting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Ingestion'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Upload Document Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-500 text-white font-medium shadow-md shadow-red-900/20">
                <Plus className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-50 border-gray-200 text-gray-900 max-w-md">
              <form onSubmit={handleUpload}>
                <DialogHeader>
                  <DialogTitle>Ingest New Document</DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Select a document (PDF, Word, or TXT) to upload and chunk into the vector database.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-5 py-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-white border border-gray-200 text-gray-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
                    >
                      <option value="Study Abroad">Study Abroad</option>
                      <option value="Work Abroad">Work Abroad</option>
                      <option value="PR & Immigration">PR & Immigration</option>
                      <option value="Visit & Tourism">Visit & Tourism</option>
                      <option value="General Knowledge">General Knowledge</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">File</label>
                    <div className="border-2 border-dashed border-gray-200 hover:border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors relative">
                      <input
                        type="file"
                        ref={fileInputRef}
                        required
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        accept=".pdf,.docx,.txt"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Upload className="w-8 h-8 text-gray-500 mb-2" />
                      <span className="text-sm font-medium text-gray-700">
                        {selectedFile ? selectedFile.name : 'Click or Drag document here'}
                      </span>
                      <span className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT up to 10MB</span>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setDialogOpen(false)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={uploading || !selectedFile}
                    className="bg-red-600 hover:bg-red-500 text-white font-medium"
                  >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Ingestion'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input 
            placeholder="Search documents..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gray-50/50 border-gray-200 text-gray-900 focus-visible:ring-red-500"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <Card className="bg-gray-50/50 border-gray-200 backdrop-blur-xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-800">Indexed Files</CardTitle>
          <CardDescription className="text-gray-500">Currently active in the vector database.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <File className="w-12 h-12 mx-auto text-gray-500 mb-3" />
              <p className="text-gray-600">No indexed documents found.</p>
              <p className="text-xs text-gray-400 mt-1">Upload a PDF or TXT to get started with custom RAG content.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200/50 bg-white/30 hover:bg-gray-200/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-red-500/10">
                      {doc.filename.startsWith('Website:') ? (
                        <Globe className="w-5 h-5 text-red-400" />
                      ) : (
                        <File className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{doc.filename}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{doc.category}</span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">{doc.chunkCount} chunks</span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">By {doc.uploadedBy}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                      doc.status === 'ready' 
                        ? 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20' 
                        : doc.status === 'failed' 
                        ? 'bg-red-400/10 text-red-400 ring-red-400/20' 
                        : 'bg-red-400/10 text-red-400 ring-red-400/20 animate-pulse'
                    }`}>
                      {doc.status}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(doc.id)}
                      className="text-gray-500 hover:text-red-400 hover:bg-red-400/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
