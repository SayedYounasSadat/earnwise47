// Core hook for managing all earnings tracker state and logic
import { useState, useEffect, useCallback, useRef } from "react";
import {
  AppState,
  WorkSession,
  DailyLog,
  Settings,
  ScheduleEntry,
  DEFAULT_SETTINGS,
  DEFAULT_SCHEDULE,
} from "@/types/earnings";
import { toast } from "@/hooks/use-toast";

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
const saveState = (state: AppState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state:", e);
  }
};

const getInitialState = (): AppState => {
  const saved = loadState();
  if (saved) {
    // Reset daily stats if it's a new day
    const today = getTodayDate();
    const todayLog = saved.dailyLogs.find((log) => log.date === today);
    
    return {
      ...saved,
      isWorking: false, // Always start stopped
      currentSessionStart: null,
      currentSessionDuration: 0,
      totalEarningsToday: todayLog?.totalEarnings || 0,
      loginTime: saved.loginTime || Date.now(),
    };
  }

  return {
    isWorking: false,
    currentSessionStart: null,
    currentSessionDuration: 0,
    totalEarningsToday: 0,
    sessions: [],
    dailyLogs: [],
    schedule: DEFAULT_SCHEDULE,
    settings: DEFAULT_SETTINGS,
    lastMilestone: 0,
    loginTime: Date.now(),
  };
};

export const useEarningsTracker = () => {
  const [state, setState] = useState<AppState>(getInitialState);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Timer tick
  useEffect(() => {
    if (state.isWorking && state.currentSessionStart) {
      intervalRef.current = setInterval(() => {
        setState((prev) => {
          const elapsed = Math.floor((Date.now() - prev.currentSessionStart!) / 1000);
          return { ...prev, currentSessionDuration: elapsed };
        });
      }, 100); // Update every 100ms for smooth animation
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
  }, [state.isWorking, state.currentSessionStart]);

  // Auto-save every second
  useEffect(() => {
    saveIntervalRef.current = setInterval(() => {
      saveState(state);
    }, 1000);

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [state]);

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
      currentSessionStart: Date.now(),
      currentSessionDuration: 0,
    }));

    toast({
      title: "⏱️ Work Started",
      description: "Timer is running. You're earning!",
    });
  }, []);

  // Stop working
  const stopWork = useCallback(
    (notes: string = "") => {
      if (!state.isWorking || !state.currentSessionStart) return;

      const now = Date.now();
      const duration = Math.floor((now - state.currentSessionStart) / 1000);
      const earnings = (duration / 3600) * state.settings.hourlyRate;
      const today = getTodayDate();

      const newSession: WorkSession = {
        id: generateId(),
        startTime: state.currentSessionStart,
        endTime: now,
        duration,
        earnings,
        notes,
        date: today,
      };

      setState((prev) => ({
        ...prev,
        isWorking: false,
        currentSessionStart: null,
        currentSessionDuration: 0,
        sessions: [...prev.sessions, newSession],
      }));

      toast({
        title: "✅ Session Saved",
        description: `Earned $${earnings.toFixed(2)} in ${Math.floor(duration / 60)}m ${duration % 60}s`,
      });
    },
    [state.isWorking, state.currentSessionStart, state.settings.hourlyRate]
  );

  // Reset current session
  const resetSession = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isWorking: false,
      currentSessionStart: null,
      currentSessionDuration: 0,
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
    const headers = ["Date", "Start Time", "End Time", "Duration (min)", "Earnings (USD)", "Notes"];
    const rows = state.sessions.map((s) => [
      s.date,
      new Date(s.startTime).toLocaleTimeString(),
      s.endTime ? new Date(s.endTime).toLocaleTimeString() : "",
      (s.duration / 60).toFixed(2),
      s.earnings.toFixed(2),
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
        setState(data);
        saveState(data);

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
    }));

    toast({
      title: "🗑️ Logs Cleared",
      description: "All session logs have been deleted.",
    });
  }, []);

  // Get chart data for last N days
  const getChartData = useCallback(
    (days: number = 7) => {
      const data: { date: string; earnings: number; hours: number; label: string }[] = [];
      const today = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const daySessions = state.sessions.filter((s) => s.date === dateStr);
        const totalEarnings = daySessions.reduce((sum, s) => sum + s.earnings, 0);
        const totalHours = daySessions.reduce((sum, s) => sum + s.duration, 0) / 3600;

        data.push({
          date: dateStr,
          earnings: totalEarnings,
          hours: totalHours,
          label: date.toLocaleDateString("en-US", { weekday: "short" }),
        });
      }

      return data;
    },
    [state.sessions]
  );

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
    currentDuration: state.currentSessionDuration,
    currentEarnings: calculateCurrentEarnings(),
    todayEarnings: calculateTodayEarnings(),
    weekEarnings: calculateWeekEarnings(),
    monthEarnings: calculateMonthEarnings(),
    settings: state.settings,
    sessions: state.sessions,
    schedule: state.schedule,
    startWork,
    stopWork,
    resetSession,
    updateSettings,
    updateSchedule,
    exportJSON,
    exportCSV,
    importJSON,
    clearLogs,
    getChartData,
    toggleDarkMode,
  };
};
