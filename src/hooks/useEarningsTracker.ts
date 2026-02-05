// Core hook for managing all earnings tracker state and logic
import { useState, useEffect, useCallback, useRef } from "react";
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
  return new Date(now.setDate(diff));
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

const buildStateFromSaved = (saved: AppState): AppState => {
  const today = getTodayDate();
  const todayLog = saved.dailyLogs.find((log) => log.date === today);
  
  return {
    ...saved,
    isWorking: false,
    isPaused: false,
    isOnBreak: false,
    currentBreakType: null,
    currentBreakStart: null,
    currentSessionBreaks: [],
    currentSessionStart: null,
    currentSessionDuration: saved.currentSessionDuration || 0,
    accumulatedDuration: saved.accumulatedDuration || 0,
    totalEarningsToday: todayLog?.totalEarnings || 0,
    loginTime: saved.loginTime || Date.now(),
    dailyBreakUsage: checkDailyReset(saved),
    schedule: saved.schedule?.map(s => ({
      ...s,
      dailyGoal: s.dailyGoal ?? saved.settings.dailyGoal ?? 100
    })) || DEFAULT_SCHEDULE,
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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const breakIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cloudSaveRef = useRef<NodeJS.Timeout | null>(null);

  // Load data from Firestore when user logs in
  useEffect(() => {
    if (!userId) {
      setCloudLoaded(false);
      return;
    }

    const loadCloud = async () => {
      const cloudData = await loadUserData(userId);
      if (cloudData) {
        const restored = buildStateFromSaved(cloudData);
        setState(restored);
        saveStateLocal(restored);
        toast({
          title: "☁️ Data Synced",
          description: "Your data has been loaded from the cloud.",
        });
      } else {
        // First login - push local data to cloud
        const localData = loadState();
        if (localData && localData.sessions.length > 0) {
          await saveUserData(userId, localData);
          toast({
            title: "☁️ Data Uploaded",
            description: "Your local data has been saved to the cloud.",
          });
        }
      }
      setCloudLoaded(true);
    };

    loadCloud();
  }, [userId]);

  // Debounced cloud save - saves to Firestore every 5 seconds when logged in
  useEffect(() => {
    if (!userId || !cloudLoaded) return;

    if (cloudSaveRef.current) clearTimeout(cloudSaveRef.current);
    cloudSaveRef.current = setTimeout(() => {
      saveUserData(userId, state);
    }, 5000);

    return () => {
      if (cloudSaveRef.current) clearTimeout(cloudSaveRef.current);
    };
  }, [userId, cloudLoaded, state]);

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

  // Check for milestones
  const checkMilestones = useCallback(
    (currentEarnings: number) => {
      const milestone = Math.floor(currentEarnings);
      if (milestone > state.lastMilestone && milestone > 0) {
        setState((prev) => ({ ...prev, lastMilestone: milestone }));
        
        if (state.settings.notifications) {
          toast({
            title: "🎉 Milestone Reached!",
            description: `You've earned $${milestone} today!`,
          });
        }
      }
    },
    [state.lastMilestone, state.settings.notifications]
  );

  // Timer tick - only runs when working AND not paused AND not on break
  useEffect(() => {
    if (state.isWorking && !state.isPaused && !state.isOnBreak && state.currentSessionStart) {
      intervalRef.current = setInterval(() => {
        setState((prev) => {
          const elapsed = Math.floor((Date.now() - prev.currentSessionStart!) / 1000);
          return { 
            ...prev, 
            currentSessionDuration: prev.accumulatedDuration + elapsed 
          };
        });
      }, 100);
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
      }, 100);
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

  // Auto-save to localStorage every second
  useEffect(() => {
    saveIntervalRef.current = setInterval(() => {
      saveStateLocal(state);
    }, 1000);

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [state]);

  // Save immediately on critical changes
  useEffect(() => {
    saveStateLocal(state);
  }, [state.isWorking, state.isPaused, state.isOnBreak, state.currentSessionDuration, state.sessions]);

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

    setState((prev) => ({
      ...prev,
      isOnBreak: true,
      currentBreakType: type,
      currentBreakStart: Date.now(),
      accumulatedDuration: prev.currentSessionDuration,
      currentSessionStart: null,
    }));

    const breakName = type === "lunch" ? "Lunch Break" : "Short Break";
    const duration = type === "lunch" ? "30" : "15";

    toast({
      title: `🍽️ ${breakName} Started`,
      description: `Taking a ${duration}-minute break. Enjoy!`,
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

      const newSession: WorkSession = {
        id: generateId(),
        startTime: now - (duration * 1000),
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
    [state.isWorking, state.isPaused, state.isOnBreak, state.currentSessionDuration, state.currentSessionBreaks, state.settings.hourlyRate, endBreak]
  );

  // Reset current session
  const resetSession = useCallback(() => {
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
    }));

    toast({
      title: "🔄 Session Reset",
      description: "Current session has been cleared.",
    });
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

  // Import data from JSON
  const importJSON = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        data.isOnBreak = data.isOnBreak ?? false;
        data.currentBreakType = data.currentBreakType ?? null;
        data.currentBreakStart = data.currentBreakStart ?? null;
        data.currentSessionBreaks = data.currentSessionBreaks ?? [];
        data.dailyBreakUsage = data.dailyBreakUsage ?? DEFAULT_BREAK_USAGE;
        data.schedule = data.schedule?.map((s: ScheduleEntry) => ({
          ...s,
          dailyGoal: s.dailyGoal ?? data.settings?.dailyGoal ?? 100
        })) ?? DEFAULT_SCHEDULE;
        
        setState(data);
        saveStateLocal(data);

        toast({
          title: "📥 Import Complete",
          description: "Your data has been restored.",
        });
      } catch (err) {
        toast({
          title: "❌ Import Failed",
          description: "Invalid backup file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  }, []);

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
    toggleDarkMode,
  };
};
