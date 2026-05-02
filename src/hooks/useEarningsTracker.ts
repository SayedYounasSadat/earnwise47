// Core hook for managing all earnings tracker state and logic
// v2 – patched sync, timer, and date logic
import { useState, useEffect, useCallback, useRef } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import {
  AppState,
  WorkSession,
  BreakSession,
  BreakType,
  DailyBreakUsage,
  Settings,
  ScheduleEntry,
  DEFAULT_SETTINGS,
  DEFAULT_SCHEDULE,
  DEFAULT_BREAK_USAGE,
  BREAK_DURATIONS,
} from "@/types/earnings";
import { toast } from "@/hooks/use-toast";
import { loadUserData, saveUserData } from "@/services/firestoreSync";

const STORAGE_KEY = "earnings-tracker-data";
const RESET_SNAPSHOT_KEY = "earnings-tracker-reset-snapshot";
const RESET_SNAPSHOT_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface ResetSnapshot {
  savedAt: number;
  isWorking: boolean;
  isPaused: boolean;
  isOnBreak: boolean;
  currentBreakType: BreakType | null;
  currentBreakStart: number | null;
  currentSessionBreaks: BreakSession[];
  currentSessionStart: number | null;
  currentSessionDuration: number;
  accumulatedDuration: number;
}

// Generate unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
  return new Date().toISOString().split("T")[0];
};

// Get start of week (Monday)
const getWeekStart = (): Date => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.getFullYear(), now.getMonth(), diff);
};

// Get start of month
const getMonthStart = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

// Load state from localStorage
const loadState = (): AppState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load state:", e);
  }
  return null;
};

// Save state to localStorage
const saveStateLocal = (state: AppState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state:", e);
  }
};

// Check if we need to reset daily break usage
const checkDailyReset = (saved: AppState): DailyBreakUsage => {
  const today = getTodayDate();
  const lastSession = saved.sessions[saved.sessions.length - 1];
  if (lastSession && lastSession.date !== today) {
    return DEFAULT_BREAK_USAGE;
  }
  return saved.dailyBreakUsage || DEFAULT_BREAK_USAGE;
};

// Max session duration sanity check: 24 hours in seconds
const MAX_SESSION_DURATION = 24 * 3600;

const sanitizeDuration = (duration: number): number => {
  if (!duration || duration < 0 || !isFinite(duration)) return 0;
  return Math.min(duration, MAX_SESSION_DURATION);
};

const buildStateFromSaved = (saved: AppState, restoreTimer: boolean = true): AppState => {
  const today = getTodayDate();
  const todayLog = saved.dailyLogs.find((log) => log.date === today);

  const commonSchedule = saved.schedule?.map(s => ({
    ...s,
    dailyGoal: s.dailyGoal ?? saved.settings.dailyGoal ?? 100
  })) || DEFAULT_SCHEDULE;

  // If the timer was running when the app was closed, restore it
  const wasWorking = restoreTimer && saved.isWorking && !saved.isPaused && !saved.isOnBreak && saved.currentSessionStart;
  const wasPaused = restoreTimer && saved.isWorking && saved.isPaused;

  if (wasWorking && saved.currentSessionStart) {
    const now = Date.now();
    // Sanity check: if currentSessionStart is in the future or unreasonably old, reset
    if (saved.currentSessionStart > now || (now - saved.currentSessionStart) / 1000 > MAX_SESSION_DURATION) {
      return {
        ...saved,
        isWorking: false,
        isPaused: false,
        isOnBreak: false,
        currentBreakType: null,
        currentBreakStart: null,
        currentSessionBreaks: [],
        currentSessionStart: null,
        currentSessionDuration: 0,
        accumulatedDuration: 0,
        totalEarningsToday: todayLog?.totalEarnings || 0,
        loginTime: Date.now(),
        dailyBreakUsage: checkDailyReset(saved),
        schedule: commonSchedule,
      };
    }

    const elapsed = Math.floor((now - saved.currentSessionStart) / 1000);
    const accumulated = sanitizeDuration(saved.accumulatedDuration || 0);
    const totalDuration = sanitizeDuration(accumulated + elapsed);

    return {
      ...saved,
      isWorking: true,
      isPaused: false,
      isOnBreak: false,
      currentBreakType: null,
      currentBreakStart: null,
      currentSessionStart: saved.currentSessionStart,
      currentSessionDuration: totalDuration,
      accumulatedDuration: accumulated,
      totalEarningsToday: todayLog?.totalEarnings || 0,
      loginTime: saved.loginTime || Date.now(),
      dailyBreakUsage: checkDailyReset(saved),
      schedule: commonSchedule,
    };
  }

  if (wasPaused) {
    const accumulated = sanitizeDuration(saved.accumulatedDuration || saved.currentSessionDuration || 0);
    return {
      ...saved,
      isWorking: true,
      isPaused: true,
      isOnBreak: false,
      currentBreakType: null,
      currentBreakStart: null,
      currentSessionStart: null,
      currentSessionDuration: accumulated,
      accumulatedDuration: accumulated,
      totalEarningsToday: todayLog?.totalEarnings || 0,
      loginTime: saved.loginTime || Date.now(),
      dailyBreakUsage: checkDailyReset(saved),
      schedule: commonSchedule,
    };
  }
  
  return {
    ...saved,
    isWorking: false,
    isPaused: false,
    isOnBreak: false,
    currentBreakType: null,
    currentBreakStart: null,
    currentSessionBreaks: [],
    currentSessionStart: null,
    currentSessionDuration: 0,
    accumulatedDuration: 0,
    totalEarningsToday: todayLog?.totalEarnings || 0,
    loginTime: saved.loginTime || Date.now(),
    dailyBreakUsage: checkDailyReset(saved),
    schedule: commonSchedule,
  };
};

const getDefaultState = (): AppState => ({
  isWorking: false,
  isPaused: false,
  isOnBreak: false,
  currentBreakType: null,
  currentBreakStart: null,
  currentSessionBreaks: [],
  currentSessionStart: null,
  currentSessionDuration: 0,
  accumulatedDuration: 0,
  totalEarningsToday: 0,
  sessions: [],
  dailyLogs: [],
  schedule: DEFAULT_SCHEDULE,
  settings: DEFAULT_SETTINGS,
  lastMilestone: 0,
  loginTime: Date.now(),
  dailyBreakUsage: DEFAULT_BREAK_USAGE,
});

const getInitialState = (): AppState => {
  const saved = loadState();
  if (saved) {
    return buildStateFromSaved(saved);
  }
  return getDefaultState();
};

export const useEarningsTracker = (userId?: string | null) => {
  const [state, setState] = useState<AppState>(getInitialState);
  const [breakDuration, setBreakDuration] = useState(0);
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const breakIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cloudSaveRef = useRef<NodeJS.Timeout | null>(null);
  const syncResetRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Sync on reconnect
  const handleReconnect = useCallback(() => {
    if (userId && cloudLoaded) {
      setSyncStatus("syncing");
      saveUserData(userId, stateRef.current).then((success) => {
        setSyncStatus(success ? "synced" : "error");
        if (syncResetRef.current) clearTimeout(syncResetRef.current);
        syncResetRef.current = setTimeout(() => setSyncStatus("idle"), 3000);
        if (success) {
          toast({ title: "☁️ Back Online", description: "Data synced to cloud." });
        }
      });
    }
  }, [userId, cloudLoaded]);

  const isOnline = useOnlineStatus(handleReconnect);

  // Show offline toast
  useEffect(() => {
    if (!isOnline) {
      toast({ title: "📡 Offline", description: "Changes are saved locally and will sync when you're back online." });
    }
  }, [isOnline]);

  // Load data from Firestore when user logs in
  useEffect(() => {
    if (!userId) {
      setCloudLoaded(false);
      return;
    }

    const loadCloud = async () => {
      setSyncStatus("syncing");
      const cloudData = await loadUserData(userId);
      if (cloudData) {
        const restored = buildStateFromSaved(cloudData);
        setState(restored);
        saveStateLocal(restored);
        setSyncStatus("synced");
        toast({
          title: "☁️ Data Synced",
          description: "Your data has been loaded from the cloud.",
        });
      } else {
        // First login - push local data to cloud
        const localData = loadState();
        if (localData && localData.sessions.length > 0) {
          const success = await saveUserData(userId, localData);
          setSyncStatus(success ? "synced" : "error");
          toast({
            title: success ? "☁️ Data Uploaded" : "⚠️ Sync Issue",
            description: success ? "Your local data has been saved to the cloud." : "Could not upload data. Will retry.",
            variant: success ? "default" : "destructive",
          });
        } else {
          setSyncStatus("synced");
        }
      }
      setCloudLoaded(true);
    };

    loadCloud();
  }, [userId]);

  // Debounced cloud save - only on meaningful state changes (not timer ticks)
  // We serialize a "signature" excluding volatile timer fields to avoid saving every second
  const cloudSaveSignature = useRef("");

  useEffect(() => {
    if (!userId || !cloudLoaded) return;

    // Build a lightweight signature excluding currentSessionDuration (changes every second)
    const sig = JSON.stringify({
      sessions: state.sessions.length,
      lastSessionId: state.sessions[state.sessions.length - 1]?.id,
      isWorking: state.isWorking,
      isPaused: state.isPaused,
      isOnBreak: state.isOnBreak,
      settings: state.settings,
      schedule: state.schedule,
      breakUsage: state.dailyBreakUsage,
    });

    if (sig === cloudSaveSignature.current) return;
    cloudSaveSignature.current = sig;

    if (cloudSaveRef.current) clearTimeout(cloudSaveRef.current);
    cloudSaveRef.current = setTimeout(async () => {
      setSyncStatus("syncing");
      const success = await saveUserData(userId, state);
      setSyncStatus(success ? "synced" : "error");
      if (syncResetRef.current) clearTimeout(syncResetRef.current);
      syncResetRef.current = setTimeout(() => setSyncStatus("idle"), 3000);
    }, 3000);

    return () => {
      if (cloudSaveRef.current) clearTimeout(cloudSaveRef.current);
    };
  }, [userId, cloudLoaded, state]);

  // Save immediately when user leaves/refreshes the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveStateLocal(state);
      // Use sendBeacon for reliable cloud save on unload
      if (userId && cloudLoaded) {
        saveUserData(userId, state);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state, userId, cloudLoaded]);


  // Get today's daily goal from schedule
  const getTodayGoal = useCallback((): number => {
    const today = new Date().getDay();
    const todaySchedule = state.schedule.find(s => s.dayOfWeek === today);
    return todaySchedule?.dailyGoal ?? state.settings.dailyGoal;
  }, [state.schedule, state.settings.dailyGoal]);

  // Calculate current earnings in real-time
  const calculateCurrentEarnings = useCallback((): number => {
    const hourlyRate = state.settings.hourlyRate;
    const seconds = state.currentSessionDuration;
    return (seconds / 3600) * hourlyRate;
  }, [state.currentSessionDuration, state.settings.hourlyRate]);

  // Calculate total earnings for today
  const calculateTodayEarnings = useCallback((): number => {
    const today = getTodayDate();
    const todaySessions = state.sessions.filter((s) => s.date === today);
    const completedEarnings = todaySessions.reduce((sum, s) => sum + s.earnings, 0);
    return completedEarnings + calculateCurrentEarnings();
  }, [state.sessions, calculateCurrentEarnings]);

  // Calculate weekly earnings
  const calculateWeekEarnings = useCallback((): number => {
    const weekStart = getWeekStart();
    const weekStartStr = weekStart.toISOString().split("T")[0];
    
    return state.sessions
      .filter((s) => s.date >= weekStartStr)
      .reduce((sum, s) => sum + s.earnings, 0) + calculateCurrentEarnings();
  }, [state.sessions, calculateCurrentEarnings]);

  // Calculate monthly earnings
  const calculateMonthEarnings = useCallback((): number => {
    const monthStart = getMonthStart();
    const monthStartStr = monthStart.toISOString().split("T")[0];
    
    return state.sessions
      .filter((s) => s.date >= monthStartStr)
      .reduce((sum, s) => sum + s.earnings, 0) + calculateCurrentEarnings();
  }, [state.sessions, calculateCurrentEarnings]);

  // Check for all-time high milestone only (O(n) with pre-computed daily map)
  const checkMilestones = useCallback(
    (currentEarnings: number) => {
      if (currentEarnings <= 0) return;
      
      // Pre-compute daily totals in O(n) instead of O(n²)
      const dailyTotals = new Map<string, number>();
      const today = getTodayDate();
      for (const s of state.sessions) {
        if (s.date === today) continue; // exclude today's sessions (we use currentEarnings for today)
        dailyTotals.set(s.date, (dailyTotals.get(s.date) || 0) + s.earnings);
      }
      
      let allTimeHigh = 0;
      for (const total of dailyTotals.values()) {
        if (total > allTimeHigh) allTimeHigh = total;
      }

      if (currentEarnings > allTimeHigh && allTimeHigh > 0) {
        const rounded = Math.floor(currentEarnings);
        if (rounded > state.lastMilestone) {
          setState((prev) => ({ ...prev, lastMilestone: rounded }));
          
          if (state.settings.notifications) {
            toast({
              title: "🏆 New All-Time High!",
              description: `You've beaten your daily record with $${currentEarnings.toFixed(2)}!`,
            });
          }
        }
      }
    },
    [state.lastMilestone, state.settings.notifications, state.sessions]
  );

  // Timer tick - only runs when working AND not paused AND not on break
  useEffect(() => {
    if (state.isWorking && !state.isPaused && !state.isOnBreak && state.currentSessionStart) {
      intervalRef.current = setInterval(() => {
        setState((prev) => {
          if (!prev.currentSessionStart) return prev;
          const elapsed = Math.floor((Date.now() - prev.currentSessionStart) / 1000);
          const total = sanitizeDuration((prev.accumulatedDuration || 0) + elapsed);
          if (total === prev.currentSessionDuration) return prev; // skip unnecessary re-render
          return { 
            ...prev, 
            currentSessionDuration: total 
          };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isWorking, state.isPaused, state.isOnBreak, state.currentSessionStart]);

  // Break timer
  useEffect(() => {
    if (state.isOnBreak && state.currentBreakStart) {
      breakIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.currentBreakStart!) / 1000);
        setBreakDuration(elapsed);
      }, 1000);
    } else {
      if (breakIntervalRef.current) {
        clearInterval(breakIntervalRef.current);
        breakIntervalRef.current = null;
      }
      setBreakDuration(0);
    }

    return () => {
      if (breakIntervalRef.current) {
        clearInterval(breakIntervalRef.current);
      }
    };
  }, [state.isOnBreak, state.currentBreakStart]);

  // Auto-save to localStorage (skip until cloud data loaded for logged-in users)
  const canSave = !userId || cloudLoaded;

  // Save to localStorage every 5 seconds and on critical state changes
  useEffect(() => {
    if (!canSave) return;
    saveIntervalRef.current = setInterval(() => {
      saveStateLocal(state);
    }, 5000);

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [state, canSave]);

  // Save immediately on critical changes (start/stop/pause, not timer ticks)
  useEffect(() => {
    if (!canSave) return;
    saveStateLocal(state);
  }, [state.isWorking, state.isPaused, state.isOnBreak, state.sessions, canSave]);

  // Check milestones on earnings change
  useEffect(() => {
    const todayEarnings = calculateTodayEarnings();
    checkMilestones(todayEarnings);
  }, [calculateTodayEarnings, checkMilestones]);

  // Start working
  const startWork = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isWorking: true,
      isPaused: false,
      isOnBreak: false,
      currentBreakType: null,
      currentBreakStart: null,
      currentSessionBreaks: [],
      currentSessionStart: Date.now(),
      currentSessionDuration: 0,
      accumulatedDuration: 0,
    }));

    toast({
      title: "⏱️ Work Started",
      description: "Timer is running. You're earning!",
    });
  }, []);

  // Start a break
  const startBreak = useCallback((type: BreakType) => {
    if (!state.isWorking) return;

    if (type === "lunch" && state.dailyBreakUsage.lunchUsed) {
      toast({
        title: "❌ Break Unavailable",
        description: "You've already used your lunch break today.",
        variant: "destructive",
      });
      return;
    }

    if (type === "short" && state.dailyBreakUsage.shortBreaksUsed >= 2) {
      toast({
        title: "❌ Break Unavailable",
        description: "You've used all your short breaks today.",
        variant: "destructive",
      });
      return;
    }

    if (type === "rr" && (state.dailyBreakUsage.rrBreaksUsed ?? 0) >= 2) {
      toast({
        title: "❌ Break Unavailable",
        description: "You've used all your restroom breaks today.",
        variant: "destructive",
      });
      return;
    }

    setState((prev) => ({
      ...prev,
      isOnBreak: true,
      currentBreakType: type,
      currentBreakStart: Date.now(),
      accumulatedDuration: prev.currentSessionDuration,
      currentSessionStart: null,
    }));

    const breakNames: Record<string, string> = { lunch: "Lunch Break", short: "Short Break", rr: "Restroom Break" };
    const breakName = breakNames[type] || "Break";
    const durationText = type === "lunch" ? "30 min" : type === "short" ? "15 min" : "untimed";

    toast({
      title: `🍽️ ${breakName} Started`,
      description: `Taking a ${durationText} break. Enjoy!`,
    });
  }, [state.isWorking, state.dailyBreakUsage]);

  // End break and resume work
  const endBreak = useCallback(() => {
    if (!state.isOnBreak || !state.currentBreakType) return;

    const breakEnd = Date.now();
    const breakDur = Math.floor((breakEnd - state.currentBreakStart!) / 1000);

    const newBreak: BreakSession = {
      id: generateId(),
      type: state.currentBreakType,
      startTime: state.currentBreakStart!,
      endTime: breakEnd,
      duration: breakDur,
      date: getTodayDate(),
    };

    setState((prev) => {
      const newBreakUsage = { ...prev.dailyBreakUsage };
      if (prev.currentBreakType === "lunch") {
        newBreakUsage.lunchUsed = true;
      } else if (prev.currentBreakType === "short") {
        newBreakUsage.shortBreaksUsed = Math.min(newBreakUsage.shortBreaksUsed + 1, 2);
      } else if (prev.currentBreakType === "rr") {
        newBreakUsage.rrBreaksUsed = Math.min((newBreakUsage.rrBreaksUsed ?? 0) + 1, 2);
      }

      return {
        ...prev,
        isOnBreak: false,
        currentBreakType: null,
        currentBreakStart: null,
        currentSessionBreaks: [...prev.currentSessionBreaks, newBreak],
        currentSessionStart: Date.now(),
        dailyBreakUsage: newBreakUsage,
      };
    });

    toast({
      title: "⏱️ Back to Work",
      description: `Break logged (${Math.floor(breakDur / 60)}m ${breakDur % 60}s). Let's go!`,
    });
  }, [state.isOnBreak, state.currentBreakType, state.currentBreakStart]);

  // Pause
  const pauseWork = useCallback(() => {
    if (!state.isWorking || state.isPaused || state.isOnBreak) return;

    setState((prev) => ({
      ...prev,
      isPaused: true,
      accumulatedDuration: prev.currentSessionDuration,
      currentSessionStart: null,
    }));

    toast({
      title: "☕ Paused",
      description: "Timer paused. This won't use your break quota.",
    });
  }, [state.isWorking, state.isPaused, state.isOnBreak]);

  // Resume from pause
  const resumeWork = useCallback(() => {
    if (!state.isPaused) return;

    setState((prev) => ({
      ...prev,
      isPaused: false,
      currentSessionStart: Date.now(),
    }));

    toast({
      title: "⏱️ Resumed",
      description: "Timer resumed. Let's continue!",
    });
  }, [state.isPaused]);

  // Stop working
  const stopWork = useCallback(
    (notes: string = "") => {
      if (!state.isWorking && !state.isPaused && !state.isOnBreak) return;
      
      if (state.isOnBreak) {
        endBreak();
      }

      if (state.currentSessionDuration === 0) {
        resetSession();
        return;
      }

      const now = Date.now();
      const duration = state.currentSessionDuration;
      const earnings = (duration / 3600) * state.settings.hourlyRate;
      const today = getTodayDate();

      // Use actual session start if available, otherwise approximate
      const actualStart = state.currentSessionStart 
        ? state.currentSessionStart - ((state.accumulatedDuration || 0) * 1000)
        : now - (duration * 1000);

      const newSession: WorkSession = {
        id: generateId(),
        startTime: actualStart,
        endTime: now,
        duration,
        earnings,
        notes,
        date: today,
        breaks: state.currentSessionBreaks,
      };

      setState((prev) => ({
        ...prev,
        isWorking: false,
        isPaused: false,
        isOnBreak: false,
        currentBreakType: null,
        currentBreakStart: null,
        currentSessionBreaks: [],
        currentSessionStart: null,
        currentSessionDuration: 0,
        accumulatedDuration: 0,
        sessions: [...prev.sessions, newSession],
      }));

      toast({
        title: "✅ Session Saved",
        description: `Earned $${earnings.toFixed(2)} in ${Math.floor(duration / 60)}m ${duration % 60}s`,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.isWorking, state.isPaused, state.isOnBreak, state.currentSessionDuration, state.currentSessionBreaks, state.settings.hourlyRate, endBreak]
  );

  // Reset current session (snapshots first if autoSaveBeforeReset is on)
  const resetSession = useCallback(() => {
    setState((prev) => {
      // Snapshot current timer state for undo, if enabled and there's something to undo
      if (
        prev.settings.autoSaveBeforeReset &&
        (prev.isWorking || prev.isPaused || prev.isOnBreak || prev.currentSessionDuration > 0)
      ) {
        try {
          const snapshot: ResetSnapshot = {
            savedAt: Date.now(),
            isWorking: prev.isWorking,
            isPaused: prev.isPaused,
            isOnBreak: prev.isOnBreak,
            currentBreakType: prev.currentBreakType,
            currentBreakStart: prev.currentBreakStart,
            currentSessionBreaks: prev.currentSessionBreaks,
            currentSessionStart: prev.currentSessionStart,
            currentSessionDuration: prev.currentSessionDuration,
            accumulatedDuration: prev.accumulatedDuration,
          };
          localStorage.setItem(RESET_SNAPSHOT_KEY, JSON.stringify(snapshot));
        } catch (e) {
          console.error("Failed to save reset snapshot:", e);
        }
      }

      return {
        ...prev,
        isWorking: false,
        isPaused: false,
        isOnBreak: false,
        currentBreakType: null,
        currentBreakStart: null,
        currentSessionBreaks: [],
        currentSessionStart: null,
        currentSessionDuration: 0,
        accumulatedDuration: 0,
      };
    });
  }, []);

  // Undo a reset by restoring the snapshot (if recent enough)
  const undoReset = useCallback((): boolean => {
    try {
      const raw = localStorage.getItem(RESET_SNAPSHOT_KEY);
      if (!raw) return false;
      const snap: ResetSnapshot = JSON.parse(raw);
      if (!snap || Date.now() - snap.savedAt > RESET_SNAPSHOT_TTL_MS) {
        localStorage.removeItem(RESET_SNAPSHOT_KEY);
        return false;
      }

      // If the timer was running, advance accumulated duration to absorb the gap
      // and restart from "now" so the user doesn't lose the elapsed time but doesn't
      // get credit for the time spent reading the toast either.
      const wasRunning = snap.isWorking && !snap.isPaused && !snap.isOnBreak;

      setState((prev) => ({
        ...prev,
        isWorking: snap.isWorking,
        isPaused: wasRunning ? true : snap.isPaused, // restore paused so user can resume intentionally
        isOnBreak: snap.isOnBreak,
        currentBreakType: snap.currentBreakType,
        currentBreakStart: snap.currentBreakStart,
        currentSessionBreaks: snap.currentSessionBreaks,
        currentSessionStart: null,
        currentSessionDuration: snap.currentSessionDuration,
        accumulatedDuration: snap.currentSessionDuration,
      }));

      localStorage.removeItem(RESET_SNAPSHOT_KEY);
      return true;
    } catch (e) {
      console.error("Failed to undo reset:", e);
      return false;
    }
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
  }, []);

  // Update schedule
  const updateSchedule = useCallback((schedule: ScheduleEntry[]) => {
    setState((prev) => ({ ...prev, schedule }));
  }, []);

  // Export data as JSON
  const exportJSON = useCallback(() => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `earnings-backup-${getTodayDate()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "📤 Export Complete",
      description: "Your data has been exported as JSON.",
    });
  }, [state]);

  // Export data as CSV
  const exportCSV = useCallback(() => {
    const headers = ["Date", "Start Time", "End Time", "Duration (min)", "Earnings (USD)", "Breaks", "Notes"];
    const rows = state.sessions.map((s) => [
      s.date,
      new Date(s.startTime).toLocaleTimeString(),
      s.endTime ? new Date(s.endTime).toLocaleTimeString() : "",
      (s.duration / 60).toFixed(2),
      s.earnings.toFixed(2),
      s.breaks?.length || 0,
      `"${s.notes.replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `earnings-${getTodayDate()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "📤 Export Complete",
      description: "Your data has been exported as CSV.",
    });
  }, [state.sessions]);

  // Import data from JSON with validation
  const importJSON = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string);
        
        // Validate essential structure
        if (typeof raw !== "object" || raw === null) throw new Error("Invalid format");
        if (!Array.isArray(raw.sessions)) throw new Error("Missing sessions array");
        if (typeof raw.settings !== "object" || raw.settings === null) throw new Error("Missing settings");
        
        // Validate each session has required fields
        for (const s of raw.sessions) {
          if (typeof s.id !== "string" || typeof s.startTime !== "number" || typeof s.duration !== "number" || typeof s.earnings !== "number") {
            throw new Error("Invalid session data");
          }
          // Sanitize duration
          s.duration = sanitizeDuration(s.duration);
          s.earnings = Math.max(0, s.earnings);
          s.notes = typeof s.notes === "string" ? s.notes.slice(0, 2000) : "";
          s.breaks = Array.isArray(s.breaks) ? s.breaks : [];
        }
        
        // Sanitize settings
        const validSettings = { ...DEFAULT_SETTINGS };
        if (typeof raw.settings.hourlyRate === "number" && raw.settings.hourlyRate >= 0 && raw.settings.hourlyRate <= 10000) {
          validSettings.hourlyRate = raw.settings.hourlyRate;
        }
        if (typeof raw.settings.exchangeRate === "number" && raw.settings.exchangeRate > 0 && raw.settings.exchangeRate <= 1000000) {
          validSettings.exchangeRate = raw.settings.exchangeRate;
        }
        if (typeof raw.settings.dailyGoal === "number" && raw.settings.dailyGoal >= 0) {
          validSettings.dailyGoal = raw.settings.dailyGoal;
        }
        if (typeof raw.settings.currencyCode === "string") {
          validSettings.currencyCode = raw.settings.currencyCode.slice(0, 10);
        }
        if (typeof raw.settings.darkMode === "boolean") validSettings.darkMode = raw.settings.darkMode;
        if (typeof raw.settings.notifications === "boolean") validSettings.notifications = raw.settings.notifications;
        if (typeof raw.settings.overtimeMultiplier === "number") validSettings.overtimeMultiplier = raw.settings.overtimeMultiplier;
        if (typeof raw.settings.showShiftRemaining === "boolean") validSettings.showShiftRemaining = raw.settings.showShiftRemaining;

        const data: AppState = {
          ...getDefaultState(),
          sessions: raw.sessions,
          dailyLogs: Array.isArray(raw.dailyLogs) ? raw.dailyLogs : [],
          settings: validSettings,
          schedule: raw.schedule?.map((s: ScheduleEntry) => ({
            ...s,
            dailyGoal: s.dailyGoal ?? validSettings.dailyGoal
          })) ?? DEFAULT_SCHEDULE,
          dailyBreakUsage: raw.dailyBreakUsage ?? DEFAULT_BREAK_USAGE,
          lastMilestone: typeof raw.lastMilestone === "number" ? raw.lastMilestone : 0,
        };
        
        setState(data);
        saveStateLocal(data);

        toast({
          title: "📥 Import Complete",
          description: `Restored ${data.sessions.length} sessions.`,
        });
      } catch (err: any) {
        toast({
          title: "❌ Import Failed",
          description: err?.message || "Invalid backup file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  }, []);

  // Delete a single session by ID
  const deleteSession = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((s) => s.id !== id),
    }));
    toast({
      title: "🗑️ Session Deleted",
      description: "The session has been removed.",
    });
  }, []);

  // Update a session's fields and recalculate duration/earnings
  const updateSession = useCallback((id: string, updates: Partial<Pick<WorkSession, 'startTime' | 'endTime' | 'notes' | 'project' | 'date'>>) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, ...updates };
        if (updates.startTime !== undefined || updates.endTime !== undefined) {
          const start = updates.startTime ?? s.startTime;
          const end = updates.endTime ?? s.endTime;
          if (start && end) {
            updated.duration = Math.floor((end - start) / 1000);
            updated.earnings = (updated.duration / 3600) * prev.settings.hourlyRate;
          }
        }
        return updated;
      }),
    }));
    toast({
      title: "✏️ Session Updated",
      description: "The session has been updated.",
    });
  }, []);

  // Add a manual session
  const addManualSession = useCallback((data: { date: string; startTime: number; endTime: number; notes: string; project: string }) => {
    const duration = Math.floor((data.endTime - data.startTime) / 1000);
    const earnings = (duration / 3600) * state.settings.hourlyRate;
    const newSession: WorkSession = {
      id: generateId(),
      startTime: data.startTime,
      endTime: data.endTime,
      duration,
      earnings,
      notes: data.notes,
      date: data.date,
      breaks: [],
      project: data.project || undefined,
    };
    setState((prev) => ({
      ...prev,
      sessions: [...prev.sessions, newSession],
    }));
    toast({
      title: "✅ Session Added",
      description: `Manual session added: $${earnings.toFixed(2)}`,
    });
  }, [state.settings.hourlyRate]);

  // Clear all logs
  const clearLogs = useCallback(() => {
    setState((prev) => ({
      ...prev,
      sessions: [],
      dailyLogs: [],
      lastMilestone: 0,
      dailyBreakUsage: DEFAULT_BREAK_USAGE,
    }));

    toast({
      title: "🗑️ Logs Cleared",
      description: "All session logs have been deleted.",
    });
  }, []);

  // Reset ALL data back to factory defaults
  const resetAllData = useCallback(() => {
    const freshState = getDefaultState();
    setState(freshState);
    saveStateLocal(freshState);

    // Also wipe cloud data if user is logged in
    if (userId) {
      saveUserData(userId, freshState);
    }

    toast({
      title: "🔄 All Data Reset",
      description: "Everything has been reset to defaults.",
    });
  }, [userId]);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !state.settings.darkMode;
    updateSettings({ darkMode: newDarkMode });
    
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [state.settings.darkMode, updateSettings]);

  // Apply dark mode on mount
  useEffect(() => {
    if (state.settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [state.settings.darkMode]);

  return {
    state,
    isWorking: state.isWorking,
    isPaused: state.isPaused,
    isOnBreak: state.isOnBreak,
    currentBreakType: state.currentBreakType,
    breakDuration,
    dailyBreakUsage: state.dailyBreakUsage,
    currentDuration: state.currentSessionDuration,
    currentEarnings: calculateCurrentEarnings(),
    todayEarnings: calculateTodayEarnings(),
    weekEarnings: calculateWeekEarnings(),
    monthEarnings: calculateMonthEarnings(),
    todayGoal: getTodayGoal(),
    settings: state.settings,
    sessions: state.sessions,
    schedule: state.schedule,
    syncStatus,
    isOnline,
    startWork,
    startBreak,
    endBreak,
    pauseWork,
    resumeWork,
    stopWork,
    resetSession,
    updateSettings,
    updateSchedule,
    exportJSON,
    exportCSV,
    importJSON,
    clearLogs,
    resetAllData,
    toggleDarkMode,
    deleteSession,
    updateSession,
    addManualSession,
  };
};
