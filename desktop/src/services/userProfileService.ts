export interface UserMemoryItem {
  id: string;
  category: 'preference' | 'goal' | 'interest' | 'work_style' | 'language' | 'general';
  content: string;
  createdAt: string;
  confidence: number;
  isUserApproved: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  role?: string;
  workStyle?: string;
  windowsUsername?: string;
  preferredLanguage: 'auto' | 'ta' | 'en' | 'tanglish';
  communicationTone: 'friendly' | 'concise' | 'professional' | 'energetic';
  dailyQuestionLimit: number;
  questionIntervalMinutes: number;
  enableQuestions: boolean;
  enableMoodTracking: boolean;
  enablePersonalization: boolean;
  quietHoursStart?: string; // e.g. "22:00"
  quietHoursEnd?: string;   // e.g. "08:00"
  doNotDisturb: boolean;
  memories: UserMemoryItem[];
  questionHistory: Array<{
    questionId: number;
    timestamp: string;
    action: 'answered' | 'skipped' | 'postponed';
    chosenOption?: string;
    userNote?: string;
  }>;
  createdAt: string;
  lastActiveAt: string;
}

const STORAGE_KEY_PREFIX = 'vcamp_profile_';
const ACTIVE_PROFILE_KEY = 'vcamp_active_profile_id';

export class UserProfileService {
  private activeProfileId: string = 'default';
  private cachedProfile: UserProfile | null = null;

  constructor() {
    this.activeProfileId = localStorage.getItem(ACTIVE_PROFILE_KEY) || 'default';
    this.loadProfile(this.activeProfileId);
  }

  public getActiveProfileId(): string {
    return this.activeProfileId;
  }

  public getActiveProfile(): UserProfile {
    if (!this.cachedProfile) {
      this.cachedProfile = this.loadProfile(this.activeProfileId);
    }
    return this.cachedProfile;
  }

  public loadProfile(profileId: string): UserProfile {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + profileId);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        this.activeProfileId = profileId;
        this.cachedProfile = parsed;
        localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
        return parsed;
      } catch (e) {
        console.error('Failed to parse user profile', e);
      }
    }

    // Default profile creation if none exists
    const defaultProfile: UserProfile = {
      id: profileId,
      name: profileId === 'default' ? 'Primary User' : profileId,
      windowsUsername: typeof window !== 'undefined' ? (window as any).__VCAMP_USER__ : undefined,
      preferredLanguage: 'auto',
      communicationTone: 'friendly',
      dailyQuestionLimit: 5,
      questionIntervalMinutes: 30,
      enableQuestions: true,
      enableMoodTracking: true,
      enablePersonalization: true,
      doNotDisturb: false,
      memories: [
        {
          id: 'mem_welcome',
          category: 'preference',
          content: 'Prefers helpful desktop companion assistance in Tamil, English, or Tanglish.',
          createdAt: new Date().toISOString(),
          confidence: 0.95,
          isUserApproved: true
        }
      ],
      questionHistory: [],
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };

    this.saveProfile(defaultProfile);
    return defaultProfile;
  }

  public saveProfile(profile: UserProfile): void {
    profile.lastActiveAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY_PREFIX + profile.id, JSON.stringify(profile));
    if (profile.id === this.activeProfileId) {
      this.cachedProfile = profile;
    }
  }

  public switchProfile(profileId: string): UserProfile {
    this.activeProfileId = profileId;
    localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
    return this.loadProfile(profileId);
  }

  public createProfile(name: string, role: string = 'Employee'): UserProfile {
    const id = 'prof_' + Date.now();
    const newProfile: UserProfile = {
      id,
      name,
      role,
      workStyle: 'Autonomous & Focused',
      preferredLanguage: 'auto',
      communicationTone: 'friendly',
      dailyQuestionLimit: 5,
      questionIntervalMinutes: 30,
      enableQuestions: true,
      enableMoodTracking: true,
      enablePersonalization: true,
      doNotDisturb: false,
      memories: [],
      questionHistory: [],
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };
    this.saveProfile(newProfile);
    return newProfile;
  }

  public updateProfile(id: string, updates: Partial<UserProfile>): UserProfile {
    const p = this.loadProfile(id);
    const updated = { ...p, ...updates };
    this.saveProfile(updated);
    return updated;
  }

  public listProfiles(): Array<{ id: string; name: string; lastActiveAt: string }> {
    const list: Array<{ id: string; name: string; lastActiveAt: string }> = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        try {
          const p = JSON.parse(localStorage.getItem(key) || '{}');
          if (p.id) {
            list.push({ id: p.id, name: p.name || p.id, lastActiveAt: p.lastActiveAt || '' });
          }
        } catch {}
      }
    }
    if (list.length === 0) {
      list.push({ id: 'default', name: 'Primary User', lastActiveAt: new Date().toISOString() });
    }
    return list;
  }

  public addMemory(memory: Omit<UserMemoryItem, 'id' | 'createdAt'>): UserMemoryItem {
    const profile = this.getActiveProfile();
    const newMemory: UserMemoryItem = {
      ...memory,
      id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString()
    };
    profile.memories.push(newMemory);
    this.saveProfile(profile);
    return newMemory;
  }

  public removeMemory(memoryId: string): void {
    const profile = this.getActiveProfile();
    profile.memories = profile.memories.filter(m => m.id !== memoryId);
    this.saveProfile(profile);
  }

  public updateMemory(memoryId: string, updates: Partial<UserMemoryItem>): void {
    const profile = this.getActiveProfile();
    profile.memories = profile.memories.map(m => m.id === memoryId ? { ...m, ...updates } : m);
    this.saveProfile(profile);
  }

  public recordQuestionAction(
    questionId: number, 
    action: 'answered' | 'skipped' | 'postponed', 
    chosenOption?: string,
    userNote?: string
  ): void {
    const profile = this.getActiveProfile();
    profile.questionHistory.push({
      questionId,
      timestamp: new Date().toISOString(),
      action,
      chosenOption,
      userNote
    });
    this.saveProfile(profile);
  }

  /**
   * Builds personalized system context prompt from the user's approved memories and preferences.
   */
  public generatePersonalizedContext(): string {
    const profile = this.getActiveProfile();
    if (!profile.enablePersonalization) return '';

    const approvedMemories = profile.memories.filter(m => m.isUserApproved);
    if (approvedMemories.length === 0) return '';

    let prompt = `\n[Personal User Context for ${profile.name}]:\n`;
    prompt += `- Communication tone preference: ${profile.communicationTone}\n`;
    prompt += `- Stored User Memories:\n`;
    approvedMemories.slice(-8).forEach(m => {
      prompt += `  * [${m.category.toUpperCase()}] ${m.content}\n`;
    });

    return prompt;
  }

  public exportProfileData(profileId?: string): string {
    const p = profileId ? this.loadProfile(profileId) : this.getActiveProfile();
    return JSON.stringify(p, null, 2);
  }

  public deleteProfile(profileId: string): boolean {
    if (profileId === 'default') {
      // Clear data but keep default profile
      const defaultP = this.loadProfile('default');
      defaultP.memories = [];
      defaultP.questionHistory = [];
      this.saveProfile(defaultP);
      return true;
    }
    localStorage.removeItem(STORAGE_KEY_PREFIX + profileId);
    this.switchProfile('default');
    return true;
  }
}

export const userProfileService = new UserProfileService();
