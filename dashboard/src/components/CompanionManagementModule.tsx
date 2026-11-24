import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { 
  Bot, 
  Upload, 
  Sparkles, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Box, 
  Layers,
  Palette
} from 'lucide-react';

export const CompanionManagementModule: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [companionName, setCompanionName] = useState('VCamp Companion');
  const [personalityTone, setPersonalityTone] = useState('empathetic');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('humanoid_robot.glb');
  const [availableModels, setAvailableModels] = useState<string[]>(['humanoid_robot.glb', 'avatar_female.glb', 'minimal_drone.glb']);
  
  const [uploading, setUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      const data = await apiClient.get('/companion/profile');
      if (data) {
        setProfile(data);
        setCompanionName(data.name || 'VCamp Companion');
        setPersonalityTone(data.personality_tone || 'empathetic');
        setSystemPrompt(data.system_prompt || '');
        if (data.active_model_url) {
          setSelectedModel(data.active_model_url);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch companion profile:', e);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.put('/companion/profile', {
        name: companionName,
        personality_tone: personalityTone,
        system_prompt: systemPrompt,
        active_model_url: selectedModel,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update companion profile');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.glb') && !file.name.toLowerCase().endsWith('.gltf')) {
      setError('Please upload a 3D .GLB or .GLTF file');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const res = await apiClient.uploadFile('/companion/model/upload', file);
      if (res && res.model_url) {
        setSelectedModel(res.model_url);
        setAvailableModels((prev) => [...prev, file.name]);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Model upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-400" /> Personalized 3D Companion Configuration
          </h2>
          <p className="text-xs text-slate-400">
            Customize your individual companion persona, 3D humanoid character mesh, and behavioral prompt.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Personal companion profile updated and synced with your desktop companion!</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Basic Character Information */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Identity & Personality
            </h3>
            <span className="text-[10px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
              Personal Scope
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Companion Name
              </label>
              <input
                type="text"
                value={companionName}
                onChange={(e) => setCompanionName(e.target.value)}
                placeholder="VCamp Companion"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Personality Tone
              </label>
              <select
                value={personalityTone}
                onChange={(e) => setPersonalityTone(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-xs text-white outline-none"
              >
                <option value="empathetic">Empathetic & Supportive (Default)</option>
                <option value="encouraging">Motivational & Energetic</option>
                <option value="calm">Calm & Mindful</option>
                <option value="playful">Playful & Cheerful</option>
                <option value="professional">Professional & Direct</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Custom Prompt Injection
            </label>
            <textarea
              rows={3}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="You are a supportive, culturally attuned assistant proficient in Tamil and English..."
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-xs text-white outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Injected into Groq LLM system prompt alongside your isolated memories and sentiment state.
            </p>
          </div>
        </div>

        {/* 3D Model Asset Assignment & Upload */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Box className="w-4 h-4 text-emerald-400" /> 3D Model Asset (.GLB / .GLTF)
            </h3>
            <span className="text-[10px] text-slate-400">Three.js R3F Compatible</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Active 3D Mesh
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-xs text-white outline-none"
              >
                {availableModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Upload Custom Character Model
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".glb,.gltf"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="block w-full text-xs text-slate-400 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-600/30 file:text-cyan-300 hover:file:bg-cyan-600/50 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Upload rigged humanoid .GLB models up to 50MB. Strictly isolated to your account.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all shadow-lg shadow-cyan-900/30"
          >
            <Save className="w-4 h-4" /> Save Companion Settings
          </button>
        </div>
      </form>
    </div>
  );
};
