import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Phone,
  Mail,
  ExternalLink,
  MessageSquare,
  Sparkles,
  TrendingUp,
  UserCheck,
  Edit2,
} from 'lucide-react';
import { crmApi, type ContactItem } from '../../api/crm';
import { useNavigate } from 'react-router-dom';

export const CRM: React.FC = () => {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [editingContact, setEditingContact] = useState<ContactItem | null>(null);
  const [tagInput, setTagInput] = useState('');
  const navigate = useNavigate();

  const loadContacts = async () => {
    try {
      setLoading(true);
      const res = await crmApi.list({
        lead_status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        search: searchTerm || undefined,
      });
      if (res.data) {
        setContacts(res.data);
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadContacts();
  };

  const handleUpdateStatus = async (contact: ContactItem, newStatus: 'LEAD' | 'QUALIFIED' | 'CUSTOMER') => {
    try {
      await crmApi.update(contact.id, { lead_status: newStatus });
      setContacts((prev) =>
        prev.map((c) => (c.id === contact.id ? { ...c, lead_status: newStatus } : c))
      );
    } catch (err) {
      console.error('Failed to update lead status:', err);
    }
  };

  const handleSaveContactDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;
    try {
      await crmApi.update(editingContact.id, {
        full_name: editingContact.full_name || undefined,
        email: editingContact.email || undefined,
        phone: editingContact.phone || undefined,
        tags: editingContact.tags,
      });
      setContacts((prev) =>
        prev.map((c) => (c.id === editingContact.id ? editingContact : c))
      );
      setEditingContact(null);
    } catch (err) {
      console.error('Failed to update contact details:', err);
    }
  };

  const handleAddTag = () => {
    if (!tagInput.trim() || !editingContact) return;
    const clean = tagInput.trim().replace(/^#/, '');
    if (!editingContact.tags.includes(clean)) {
      setEditingContact({
        ...editingContact,
        tags: [...editingContact.tags, clean],
      });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!editingContact) return;
    setEditingContact({
      ...editingContact,
      tags: editingContact.tags.filter((t) => t !== tagToRemove),
    });
  };

  // Metrics
  const totalCount = contacts.length;
  const leadCount = contacts.filter((c) => c.lead_status === 'LEAD').length;
  const qualifiedCount = contacts.filter((c) => c.lead_status === 'QUALIFIED').length;
  const customerCount = contacts.filter((c) => c.lead_status === 'CUSTOMER').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-400" />
          <span>Lead CRM & Instagram Audience</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Every customer who interacts via Instagram DMs, mentions, or comments is automatically captured into your CRM funnel.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Audience</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-white">{totalCount}</span>
            <Users className="w-5 h-5 text-slate-500" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Cold Leads</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-amber-400">{leadCount}</span>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Qualified Prospects</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-indigo-400">{qualifiedCount}</span>
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Converted Customers</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-400">{customerCount}</span>
            <UserCheck className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[260px] relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by username, full name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-1.5">
          {(['ALL', 'LEAD', 'QUALIFIED', 'CUSTOMER'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedStatus === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Instagram User</th>
                <th className="py-3.5 px-4">Lead Funnel Stage</th>
                <th className="py-3.5 px-4">Contact Details</th>
                <th className="py-3.5 px-4">Interest Tags</th>
                <th className="py-3.5 px-4">Last Active</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading CRM leads...
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No contacts found.
                  </td>
                </tr>
              ) : (
                contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs uppercase overflow-hidden shrink-0">
                          {c.avatar_url ? (
                            <img src={c.avatar_url} alt={c.username} className="w-full h-full object-cover" />
                          ) : (
                            c.username.slice(0, 2)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white">@{c.username}</p>
                          <p className="text-[11px] text-slate-400">{c.full_name || 'Instagram User'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={c.lead_status}
                        onChange={(e) =>
                          handleUpdateStatus(c, e.target.value as 'LEAD' | 'QUALIFIED' | 'CUSTOMER')
                        }
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none transition ${
                          c.lead_status === 'CUSTOMER'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : c.lead_status === 'QUALIFIED'
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        }`}
                      >
                        <option value="LEAD" className="bg-slate-900 text-amber-400">🟡 Cold Lead</option>
                        <option value="QUALIFIED" className="bg-slate-900 text-indigo-400">🔵 Qualified</option>
                        <option value="CUSTOMER" className="bg-slate-900 text-emerald-400">🟢 Customer</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{c.email || '—'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{c.phone || '—'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {c.tags && c.tags.length > 0 ? (
                          c.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px]"
                            >
                              #{t}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 text-[11px]">No tags</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(c.last_interaction_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingContact(c)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                          title="Edit Lead Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate('/inbox')}
                          className="p-1.5 text-indigo-400 hover:text-indigo-300 rounded-lg hover:bg-indigo-600/20 transition"
                          title="Open in Live Inbox"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <a
                          href={`https://instagram.com/${c.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                          title="Open Instagram Profile"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Contact Drawer Modal */}
      {editingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Edit Lead @{editingContact.username}</span>
              </h3>
              <button
                onClick={() => setEditingContact(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveContactDetails} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingContact.full_name || ''}
                  onChange={(e) =>
                    setEditingContact({ ...editingContact, full_name: e.target.value })
                  }
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Email</label>
                <input
                  type="email"
                  value={editingContact.email || ''}
                  onChange={(e) =>
                    setEditingContact({ ...editingContact, email: e.target.value })
                  }
                  placeholder="john@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editingContact.phone || ''}
                  onChange={(e) =>
                    setEditingContact({ ...editingContact, phone: e.target.value })
                  }
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="e.g. sneakers, high-intent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {editingContact.tags?.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[11px] flex items-center gap-1"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-rose-400"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingContact(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
