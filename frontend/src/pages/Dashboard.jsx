import React, { useState, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';

const AVAILABLE_PLATFORMS = [
  { id: 'youtube', name: 'YouTube', color: 'hover:border-red-500/50', icon: '📹', badge: 'bg-red-500/10 text-red-400' },
  { id: 'facebook', name: 'Facebook Page', color: 'hover:border-blue-500/50', icon: '📘', badge: 'bg-blue-500/10 text-blue-400' },
  { id: 'instagram', name: 'Instagram Business', color: 'hover:border-pink-500/50', icon: '📸', badge: 'bg-pink-500/10 text-pink-400' },
  { id: 'linkedin', name: 'LinkedIn Professional', color: 'hover:border-cyan-500/50', icon: '💼', badge: 'bg-cyan-500/10 text-cyan-400' },
  { id: 'twitter', name: 'Twitter / X', color: 'hover:border-slate-400/50', icon: '🐦', badge: 'bg-slate-300/10 text-slate-300' },
];

export default function Dashboard() {
  const { userId, linkedAccounts, loadingAccounts, refreshAccounts } = useContext(UserContext);

  // Form State parameters
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Handle triggering dynamic server side authentication redirects 
  const handleConnectPlatform = async (platform) => {
    try {
      // Calls your dynamic backend factory URL generation routes
      const response = await axios.get(`/api/socials/auth/${platform}?userId=${userId}`);
      if (response.data?.url) {
        window.location.href = response.data.url; // Forward window window to real auth flow screen
      }
    } catch (err) {
      console.error(`Failed linking ${platform} pipeline:`, err.message);
      alert(`OAuth Handshake failed initializing for ${platform}. Please check backend logs.`);
    }
  };

  // Toggle selection matrix variables 
  const toggleChannelSelection = (id) => {
    setSelectedChannels(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Process live media distribution requests
  const handlePublishContent = async (e) => {
    e.preventDefault();
    if (selectedChannels.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please pick at least one synchronized social channel target.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage({ type: 'info', text: 'Uploading media attachment assets and blasting platform APIs...' });

    // Build payload structure using multipart form layout wrappers
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('tags', tags);
    formData.append('targetAccounts', JSON.stringify(selectedChannels));
    if (selectedMedia) {
      formData.append('media', selectedMedia);
    }

    try {
      const response = await axios.post('/api/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setStatusMessage({ type: 'success', text: `Success! ${response.data.message || 'Dispatched successfully.'}` });
      // Reset input layers
      setTitle('');
      setDescription('');
      setTags('');
      setSelectedMedia(null);
      setSelectedChannels([]);
    } catch (err) {
      setStatusMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Server distribution error encountered.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* LEFT COLUMN PANEL: ACCOUNT MANAGEMENT COMPONENT */}
      <section className="lg:col-span-4 space-y-6">
        <div className="bg-cardBg border border-slate-800 p-5 rounded-xl shadow-xl">
          <h2 className="text-base font-bold tracking-wide flex items-center gap-2 text-slate-200">
            <span>🔌</span> Integrated Social Channels
          </h2>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Link channels into your database runtime layer to enable post routing hooks.
          </p>

          {loadingAccounts ? (
            <div className="text-center py-6 text-xs text-slate-500 animate-pulse">Loading connected profiles...</div>
          ) : (
            <div className="space-y-3">
              {AVAILABLE_PLATFORMS.map((platform) => {
                // Verify matches against saved collection entries matching backend schemas
                const activeConnection = linkedAccounts.find(acc => acc.platform === platform.id);
                
                return (
                  <div 
                    key={platform.id}
                    className={`bg-slate-900/60 border rounded-lg p-3.5 flex items-center justify-between transition-all duration-200 ${platform.color} border-slate-800/80`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl bg-slate-800 p-2 rounded-md">{platform.icon}</span>
                      <div>
                        <h3 className="text-xs font-semibold text-slate-200">{platform.name}</h3>
                        {activeConnection ? (
                          <p className="text-[10px] font-mono text-emerald-400 truncate max-w-[150px]">
                            @{(activeConnection.username || 'Linked profile').toLowerCase()}
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-500">Not integrated</p>
                        )}
                      </div>
                    </div>

                    {activeConnection ? (
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wider shadow-inner ${platform.badge}`}>
                        Connected
                      </span>
                    ) : (
                      <button
                        onClick={() => handleConnectPlatform(platform.id)}
                        className="text-[11px] font-medium bg-slate-800 hover:bg-slate-700 hover:text-blue-400 text-slate-300 border border-slate-700 px-3 py-1 rounded transition-all duration-150"
                      >
                        Link Account
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* RIGHT COLUMN PANEL: UNIFIED POSTS COMPOSER */}
      <section className="lg:col-span-8">
        <form onSubmit={handlePublishContent} className="bg-cardBg border border-slate-800 p-6 rounded-xl shadow-xl space-y-5">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-200">📝 Unified Content Composer</h2>
              <p className="text-xs text-slate-400 mt-0.5">Author posts and stream broadcast blocks globally instantly.</p>
            </div>
          </div>

          {/* CHANNELS TARGETING GRID PICKER */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 tracking-wide block uppercase">
              Target Broadcast Channels <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AVAILABLE_PLATFORMS.map(p => {
                const isLinked = linkedAccounts.some(acc => acc.platform === p.id);
                const isSelected = selectedChannels.includes(p.id);

                return (
                  <button
                    type="button"
                    key={`compose-${p.id}`}
                    disabled={!isLinked}
                    onClick={() => toggleChannelSelection(p.id)}
                    className={`flex items-center space-x-2 text-left p-2.5 rounded-lg border text-xs font-medium transition-all duration-150 ${
                      isSelected 
                        ? 'bg-blue-600/10 border-blue-500 text-blue-400 font-bold' 
                        : isLinked 
                          ? 'bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700' 
                          : 'bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <span>{p.icon}</span>
                    <span className="truncate">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* INPUT FOR CORE STRINGS TITLE METADATA */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 tracking-wide block uppercase">Campaign Title / Header</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., MERN Architecture Production Breakdown Video!"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500 text-slate-200"
              required
            />
          </div>

          {/* DESCRIPTION TEXTAREA CONTENT BLOCK */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 tracking-wide block uppercase">Body Copy Content Description</label>
            <textarea
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write the deep description body payload content here..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500 text-slate-200 resize-none"
              required
            />
          </div>

          {/* TAGS INPUT FIELD CONTROL */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 tracking-wide block uppercase">Search Indexing Tags / Hashtags</label>
            <input 
              type="text" 
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="nodejs, react, serverless, microservices"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:border-blue-500 text-slate-300"
            />
            <p className="text-[10px] text-slate-500">Provide strings separated via comma symbols.</p>
          </div>

          {/* MULTIMEDIA FILE UPLOADING INPUT CONTAINER FIELD */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 tracking-wide block uppercase">Media Asset Attachment</label>
            <div className="bg-slate-900 border border-dashed border-slate-800 hover:border-slate-700 rounded-lg p-4 flex flex-col items-center justify-center relative transition-colors duration-150">
              <input 
                type="file" 
                accept="image/*,video/*"
                onChange={(e) => setSelectedMedia(e.target.files[0])}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
              <span className="text-2xl mb-1">📁</span>
              <p className="text-xs text-slate-300 font-medium">
                {selectedMedia ? selectedMedia.name : "Drag & Drop or Click to browse native file system assets"}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Supports images or full video configurations formats.</p>
            </div>
          </div>

          {/* NOTIFICATION LAYER BANNER STATEMENTS */}
          {statusMessage.text && (
            <div className={`p-3.5 rounded-lg border text-xs flex items-center gap-2.5 ${
              statusMessage.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
              statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
              'bg-blue-500/10 border-blue-500/30 text-blue-400'
            }`}>
              <span>{statusMessage.type === 'error' ? '❌' : statusMessage.type === 'success' ? '✅' : '⏳'}</span>
              <p className="flex-1 font-medium">{statusMessage.text}</p>
            </div>
          )}

          {/* EXECUTE ACTION SEND TRIGGER TRIGGER BUTTONS */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2.5 px-4 font-bold text-xs uppercase tracking-wider text-white rounded-lg transition-all duration-200 transform active:scale-[0.99] shadow-lg ${
                isSubmitting 
                  ? 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed shadow-none' 
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/10 hover:shadow-blue-500/20'
              }`}
            >
              {isSubmitting ? "Processing Engine Pipeline Active..." : "🚀 Publish Media Update Everywhere Now"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}