import React, { useState, useEffect } from 'react';
import { 
  User, 
  Plus, 
  Trash2, 
  Brain, 
  Check, 
  Sparkles,
  Calendar,
  Clock
} from 'lucide-react';
import { userProfileService, UserProfile, UserMemoryItem } from '../../services/userProfileService';

export const UserProfileTab: React.FC = () => {
  const [activeProfile, setActiveProfile] = useState<UserProfile>(userProfileService.getActiveProfile());
  const [allProfiles, setAllProfiles] = useState(userProfileService.listProfiles());
  const [newProfileName, setNewProfileName] = useState('');
  const [newMemoryKey, setNewMemoryKey] = useState('');
  const [newMemoryVal, setNewMemoryVal] = useState('');

  const handleSwitchProfile = (id: string) => {
    userProfileService.switchProfile(id);
    setActiveProfile(userProfileService.getActiveProfile());
    setAllProfiles(userProfileService.listProfiles());
  };

  const handleCreateProfile = () => {
    if (!newProfileName.trim()) return;
    const p = userProfileService.createProfile(newProfileName.trim());
    userProfileService.switchProfile(p.id);
    setActiveProfile(userProfileService.getActiveProfile());
    setAllProfiles(userProfileService.listProfiles());
    setNewProfileName('');
  };

  const handleAddMemory = () => {
    if (!newMemoryKey.trim() || !newMemoryVal.trim()) return;
    userProfileService.addMemory({
      category: 'preference',
      content: `${newMemoryKey.trim()}: ${newMemoryVal.trim()}`,
      confidence: 0.95,
      isUserApproved: true,
    });
    setActiveProfile(userProfileService.getActiveProfile());
    setNewMemoryKey('');
    setNewMemoryVal('');
  };

  const handleDeleteMemory = (id: string) => {
    userProfileService.removeMemory(id);
    setActiveProfile(userProfileService.getActiveProfile());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-cyan-300 mb-1 flex items-center gap-2">
          <User className="w-5 h-5 text-cyan-400" />
          User Profiles & Semantic Memory Store
        </h3>
        <p className="text-xs text-slate-400">
          Personalized memory graphs, companion check-in logs, and multi-user profile switching.
        </p>
      </div>

      {/* Profile Management */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/20 space-y-4">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Active Profile & Switching
        </h4>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={activeProfile.id}
            onChange={(e) => handleSwitchProfile(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-cyan-500 min-w-[200px]"
          >
            {allProfiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id})
              </option>
            ))}
          </select>

          <div className="flex gap-2 flex-1 max-w-sm">
            <input
              type="text"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              placeholder="New profile name..."
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500 flex-1"
            />
            <button
              onClick={handleCreateProfile}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create
            </button>
          </div>
        </div>
      </div>

      {/* Semantic Memory Items */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-cyan-400" />
            Semantic Memory Graph ({activeProfile.memories.length})
          </h4>
          <span className="text-[11px] text-slate-400">Context injected dynamically into Groq prompts</span>
        </div>

        {/* Add Memory Form */}
        <div className="flex flex-wrap gap-2 pt-1">
          <input
            type="text"
            value={newMemoryKey}
            onChange={(e) => setNewMemoryKey(e.target.value)}
            placeholder="Memory Key (e.g. preferred_language)"
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500 min-w-[180px]"
          />
          <input
            type="text"
            value={newMemoryVal}
            onChange={(e) => setNewMemoryVal(e.target.value)}
            placeholder="Value (e.g. Tamil & English, likes concise replies)"
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500 flex-1 min-w-[200px]"
          />
          <button
            onClick={handleAddMemory}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Memory
          </button>
        </div>

        {/* Memory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
          {activeProfile.memories.length > 0 ? (
            activeProfile.memories.map((m) => (
              <div
                key={m.id}
                className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex items-start justify-between gap-2"
              >
                <div>
                  <span className="text-[10px] uppercase font-mono font-semibold text-cyan-400 block">{m.category}</span>
                  <span className="text-xs text-slate-200 block mt-0.5">{m.content}</span>
                  <span className="text-[9px] text-slate-500 font-mono mt-1 block">
                    Recorded: {new Date(m.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteMemory(m.id)}
                  className="text-slate-500 hover:text-rose-400 p-1"
                  title="Delete memory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic p-4">No semantic memory items stored yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
