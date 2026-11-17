import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Video,
  Image as ImageIcon,
  Sparkles,
  Camera,
} from 'lucide-react';

interface ScheduledPost {
  id: string;
  type: 'post' | 'reel' | 'story';
  caption: string;
  media_url: string;
  scheduled_for: string;
  status: 'SCHEDULED' | 'PUBLISHED' | 'DRAFT';
  hashtags: string[];
}

const mockPosts: ScheduledPost[] = [
  {
    id: '1',
    type: 'reel',
    caption: 'Drop a "SNEAKER" in the DMs to unlock an exclusive 20% discount code for the new drops! 🔥👟',
    media_url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&q=80',
    scheduled_for: 'Tomorrow at 06:00 PM',
    status: 'SCHEDULED',
    hashtags: ['#streetwear', '#sneakers', '#d2cbrand'],
  },
  {
    id: '2',
    type: 'post',
    caption: 'Minimalist aesthetic for your daily routine. Explore our all-new organic cotton collection.',
    media_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80',
    scheduled_for: 'Friday at 12:30 PM',
    status: 'SCHEDULED',
    hashtags: ['#minimalist', '#organicclothing', '#summerdrops'],
  },
  {
    id: '3',
    type: 'reel',
    caption: 'How our customer service bot answers 5,000 DMs a day without missing a beat.',
    media_url: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=600&q=80',
    scheduled_for: 'Yesterday at 04:00 PM',
    status: 'PUBLISHED',
    hashtags: ['#automation', '#customerservice', '#growthhacks'],
  },
];

export const Publishing: React.FC = () => {
  const [posts, setPosts] = useState<ScheduledPost[]>(mockPosts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    type: 'reel' as 'post' | 'reel' | 'story',
    caption: '',
    media_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
    scheduled_for: 'Tomorrow at 05:00 PM',
    hashtags: '#fashion #automation #drops',
  });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    const created: ScheduledPost = {
      id: String(Date.now()),
      type: newPost.type,
      caption: newPost.caption,
      media_url: newPost.media_url,
      scheduled_for: newPost.scheduled_for,
      status: 'SCHEDULED',
      hashtags: newPost.hashtags.split(' ').filter(Boolean),
    };
    setPosts([created, ...posts]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-pink-400" />
            <span>Instagram Publishing & Reel Scheduler</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Plan, compose, and auto-publish Instagram Reels, Carousels, and Feed Posts with automated comment triggers.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-pink-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Reel / Post</span>
        </button>
      </div>

      {/* Grid of Scheduled Posts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-xl"
          >
            <div className="relative h-48 bg-slate-950 overflow-hidden">
              <img src={post.media_url} alt="media preview" className="w-full h-full object-cover" />
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-md flex items-center gap-1">
                  {post.type === 'reel' ? (
                    <Video className="w-3 h-3 text-pink-400" />
                  ) : (
                    <ImageIcon className="w-3 h-3 text-indigo-400" />
                  )}
                  <span className="uppercase">{post.type}</span>
                </span>
              </div>

              <div className="absolute top-2.5 right-2.5">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-md ${
                    post.status === 'PUBLISHED'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {post.status}
                </span>
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{post.scheduled_for}</span>
                </div>
                <p className="text-xs text-slate-200 line-clamp-3 leading-relaxed">
                  {post.caption}
                </p>
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {post.hashtags.map((h, i) => (
                    <span key={i} className="text-[10px] text-indigo-400">
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <Sparkles className="w-3 h-3" />
                  <span>Auto-DM Trigger: Active</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">ID: #{post.id}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Composer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-pink-400" />
                <span>Schedule Instagram Content</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Post Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['reel', 'post', 'story'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setNewPost({ ...newPost, type: fmt })}
                      className={`py-2 rounded-xl text-xs font-semibold uppercase transition border ${
                        newPost.type === fmt
                          ? 'bg-pink-600/20 border-pink-500 text-pink-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Media URL (Video / Photo)</label>
                <input
                  type="url"
                  required
                  value={newPost.media_url}
                  onChange={(e) => setNewPost({ ...newPost, media_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Caption</label>
                <textarea
                  rows={3}
                  required
                  value={newPost.caption}
                  onChange={(e) => setNewPost({ ...newPost, caption: e.target.value })}
                  placeholder="Tell your audience what to do (e.g. 'Comment PRICE for direct link')..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Hashtags</label>
                <input
                  type="text"
                  value={newPost.hashtags}
                  onChange={(e) => setNewPost({ ...newPost, hashtags: e.target.value })}
                  placeholder="#brand #d2c #viral"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-lg"
                >
                  Schedule Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
