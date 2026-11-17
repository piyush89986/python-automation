import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import type { KnowledgeDocument } from '../../types/bot';
import {
  FileText,
  UploadCloud,
  Search,
  CheckCircle2,
  Trash2,
  Database,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';

export const KnowledgeBase: React.FC = () => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([
    {
      id: 'doc-1',
      title: 'Company FAQ & Return Policy 2026',
      file_name: 'faq_returns_2026.pdf',
      size_kb: 420,
      chunks_count: 24,
      status: 'indexed',
      uploaded_at: '2026-11-10',
    },
    {
      id: 'doc-2',
      title: 'Product Catalog & Pricing Specs',
      file_name: 'products_v3.xlsx',
      size_kb: 890,
      chunks_count: 68,
      status: 'indexed',
      uploaded_at: '2026-11-14',
    },
  ]);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Test vector similarity search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ chunk: string; score: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsUploading(true);
    setTimeout(() => {
      const newDoc: KnowledgeDocument = {
        id: `doc-${Date.now()}`,
        title: newTitle.trim(),
        file_name: fileName || 'uploaded_document.pdf',
        size_kb: 250,
        chunks_count: 16,
        status: 'indexed',
        uploaded_at: new Date().toISOString().split('T')[0],
      };
      setDocuments([newDoc, ...documents]);
      setIsUploading(false);
      setIsUploadOpen(false);
      setNewTitle('');
      setFileName('');
    }, 1200);
  };

  const handleTestSearch = () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setTimeout(() => {
      setSearchResults([
        {
          chunk:
            'Our standard delivery timeframe is 2-4 business days. Express shipping offers guaranteed next-day delivery on orders placed before 2 PM EST.',
          score: 0.89,
        },
        {
          chunk:
            'Items can be returned within 30 calendar days of delivery with original receipt and intact packaging.',
          score: 0.78,
        },
      ]);
      setIsSearching(false);
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Database className="w-6 h-6 text-indigo-400" />
            Knowledge Base & RAG Index
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Ground your AI bots with proprietary documents indexed into Pinecone vector storage.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsUploadOpen(true)}
          leftIcon={<UploadCloud className="w-4 h-4" />}
        >
          Upload Document
        </Button>
      </div>

      {/* RAG Settings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Embedding Model</p>
            <p className="text-sm font-bold text-slate-100 mt-0.5">
              text-embedding-3-small
            </p>
            <p className="text-[11px] text-slate-500">1536 Dimensions</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Retrieval Pipeline</p>
            <p className="text-sm font-bold text-slate-100 mt-0.5">Top-k: 4 Chunks</p>
            <p className="text-[11px] text-slate-500">Min Similarity Score: 0.72</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Vector Store</p>
            <p className="text-sm font-bold text-slate-100 mt-0.5">Pinecone (Serverless)</p>
            <p className="text-[11px] text-slate-500">Namespace: isolated tenant</p>
          </div>
        </Card>
      </div>

      {/* Documents Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-slate-100 text-sm">Indexed Documents</h2>
          <span className="text-xs text-slate-400">{documents.length} files in vector database</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400">
              <tr>
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Filename</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Vector Chunks</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-medium text-slate-200 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span>{doc.title}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-400">{doc.file_name}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-400">{doc.size_kb} KB</td>
                  <td className="py-3.5 px-4 text-xs text-slate-300">{doc.chunks_count} chunks</td>
                  <td className="py-3.5 px-4">
                    <Badge variant="success" size="sm">
                      <CheckCircle2 className="w-3 h-3" />
                      Indexed
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setDocuments(documents.filter((d) => d.id !== doc.id))}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Delete from Vector DB"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vector Similarity Playground */}
      <Card className="space-y-4">
        <div>
          <h2 className="font-semibold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Vector Retrieval Simulator
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Test how semantic search retrieves chunks for a given customer question.
          </p>
        </div>

        <div className="flex gap-3">
          <Input
            placeholder="e.g. What is your return and refund policy?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTestSearch()}
          />
          <Button
            variant="primary"
            onClick={handleTestSearch}
            isLoading={isSearching}
            leftIcon={<Search className="w-4 h-4" />}
          >
            Query
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2.5 pt-2">
            <p className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
              Matched Semantic Chunks
            </p>
            {searchResults.map((res, i) => (
              <div
                key={i}
                className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs space-y-1"
              >
                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-medium text-slate-300">Match #{i + 1}</span>
                  <Badge variant="success" size="sm">
                    Cosine Similarity: {res.score}
                  </Badge>
                </div>
                <p className="text-slate-200">{res.chunk}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Knowledge Document"
        subtitle="File text will be extracted, chunked, and embedded into Pinecone automatically."
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <Input
            label="Document Title *"
            placeholder="e.g. Product Catalog Q4"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Select Document File (.pdf, .txt, .docx, .csv)
            </label>
            <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-8 text-center bg-slate-950/40 cursor-pointer">
              <UploadCloud className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-300 font-medium">
                {fileName || 'Click to select or drag and drop file here'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Maximum file size 25MB</p>
              <input
                type="file"
                className="hidden"
                id="fileUploadInput"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setFileName(e.target.files[0].name);
                    if (!newTitle) {
                      setNewTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                    }
                  }
                }}
              />
              <label
                htmlFor="fileUploadInput"
                className="inline-block mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg cursor-pointer"
              >
                Browse Files
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isUploading}>
              Embed & Index
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
