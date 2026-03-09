// Main dashboard layout with tabs
import { useState, useCallback, useMemo, useEffect } from "react";
import { useEarningsTracker } from "@/hooks/useEarningsTracker";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "./Header";
import { TimerDisplay } from "./TimerDisplay";
import { EarningsDisplay } from "./EarningsDisplay";
import { TimerControls } from "./TimerControls";
import { BreakControls } from "./BreakControls";
import { ProgressCard } from "./ProgressCard";
import { TotalsCard } from "./TotalsCard";
import { SettingsCard } from "./SettingsCard";
import { SessionLogsCard } from "./SessionLogsCard";
import { NotesCard } from "./NotesCard";
import { EarningsChart } from "./EarningsChart";
import { ExportImportCard } from "./ExportImportCard";
import { ScheduleCard } from "./ScheduleCard";
import { ResetDataCard } from "./ResetDataCard";
import { HeatmapCalendar } from "./HeatmapCalendar";
import { EarningsProjections } from "./EarningsProjections";
import { ComparisonCharts } from "./ComparisonCharts";
import { PomodoroTimer } from "./PomodoroTimer";
import { StreakAchievements } from "./StreakAchievements";
import { OvertimeCard } from "./OvertimeCard";
import { MissedTimeCard } from "./MissedTimeCard";
import { WorldClockWidget } from "./WorldClockWidget";
import { KeyboardShortcutsHint } from "./KeyboardShortcutsHint";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { generatePDFReport } from "@/utils/pdfExport";
import { Home, BarChart3, History, Settings, Calendar, Clock, DollarSign, Zap } from "lucide-react";

export const Dashboard = () => {
  const { user, logout } = useAuth();

  const {
    isWorking,
    isPaused,
    isOnBreak,
    currentBreakType,
    breakDuration,
    dailyBreakUsage,
    currentDuration,
    currentEarnings,
    todayEarnings,
    weekEarnings,
    monthEarnings,
    todayGoal,
    settings,
    sessions,
    schedule,
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
  } = useEarningsTracker(user?.uid);

  const [sessionNotes, setSessionNotes] = useState("");

  const handleStop = useCallback(() => {
    stopWork(sessionNotes);
    setSessionNotes("");
  }, [stopWork, sessionNotes]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    isWorking, isPaused, isOnBreak,
    onStart: startWork,
    onStop: handleStop,
    onPause: pauseWork,
    onResume: resumeWork,
    onReset: resetSession,
  });

  // Calculate remaining shift time
  const [shiftRemaining, setShiftRemaining] = useState<string | null>(null);

  useEffect(() => {
    const calcRemaining = () => {
      if (!isWorking) { setShiftRemaining(null); return; }
      const now = new Date();
      const day = now.getDay();
      const todaySchedule = schedule.find(s => s.dayOfWeek === day && s.enabled);
      if (!todaySchedule) { setShiftRemaining(null); return; }
      const [endH, endM] = todaySchedule.endTime.split(":").map(Number);
      const endMinutes = endH * 60 + endM;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const diff = endMinutes - nowMinutes;
      if (diff <= 0) { setShiftRemaining("Shift ended"); return; }
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      setShiftRemaining(h > 0 ? `${h}h ${m}m left` : `${m}m left`);
    };
    calcRemaining();
    const timer = isWorking ? setInterval(calcRemaining, 30_000) : null;
    return () => { if (timer) clearInterval(timer); };
  }, [isWorking, schedule]);

  // Today's quick stats for the summary bar
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todaySessions = sessions.filter(s => s.date === today);
    const totalHours = todaySessions.reduce((sum, s) => sum + s.duration, 0) / 3600;
    return { sessions: todaySessions.length, hours: totalHours };
  }, [sessions]);

  const pdfExportHandler = useCallback(() => generatePDFReport({
    sessions, settings, schedule, todayEarnings, weekEarnings, monthEarnings,
  }), [sessions, settings, schedule, todayEarnings, weekEarnings, monthEarnings]);

  return (
    <div className="min-h-screen bg-background theme-transition">
      <Header
        isDarkMode={settings.darkMode}
        onToggleDarkMode={toggleDarkMode}
        syncStatus={!isOnline ? "error" : syncStatus}
        user={user ? {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        } : null}
        onLogout={logout}
      />

      <main className="container px-3 sm:px-4 py-3 sm:py-4 md:py-6 max-w-5xl mx-auto">
        {/* Hero Progress Bar */}
        <section className="mb-4 sm:mb-6 animate-fade-in">
          <ProgressCard 
            currentEarnings={todayEarnings} 
            dailyGoal={todayGoal}
            isWorking={isWorking && !isPaused && !isOnBreak}
          />
        </section>

        {/* Main Tabs */}
        <Tabs defaultValue="timer" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4 sm:mb-6 h-10 sm:h-11">
            <TabsTrigger value="timer" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Timer</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Logs</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Timer Tab */}
          <TabsContent value="timer" className="space-y-4 sm:space-y-6 animate-fade-in">
            {/* Today's Quick Stats Bar */}
            <div className="flex items-center gap-2 sm:gap-4 p-2.5 sm:p-3 rounded-xl bg-muted/50 text-sm overflow-x-auto">
              <div className="flex items-center gap-1.5 shrink-0">
                <DollarSign className="w-3.5 h-3.5 text-accent" />
                <span className="text-muted-foreground text-xs">Today</span>
                <span className="font-bold text-foreground tabular-nums">${todayEarnings.toFixed(2)}</span>
              </div>
              <div className="w-px h-4 bg-border shrink-0" />
              <div className="flex items-center gap-1.5 shrink-0">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium text-foreground tabular-nums">{todayStats.hours.toFixed(1)}h</span>
              </div>
              <div className="w-px h-4 bg-border shrink-0" />
              <div className="flex items-center gap-1.5 shrink-0">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium text-foreground tabular-nums">{todayStats.sessions}</span>
                <span className="text-muted-foreground text-xs">sessions</span>
              </div>
              {shiftRemaining && settings.showShiftRemaining !== false && (
                <>
                  <div className="w-px h-4 bg-border shrink-0" />
                  <span className="text-xs text-muted-foreground shrink-0">⏰ {shiftRemaining}</span>
                </>
              )}
            </div>

            {/* Timer and Earnings Hero */}
            <section className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8">
              <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
                <div className="flex flex-col items-center justify-center">
                  <TimerDisplay 
                    seconds={currentDuration} 
                    isActive={isWorking} 
                    isPaused={isPaused}
                    shiftRemaining={settings.showShiftRemaining !== false ? shiftRemaining : null}
                  />
                </div>

                <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-border pt-6 sm:pt-8 md:pt-0 md:pl-8">
                  <EarningsDisplay
                    usdAmount={currentEarnings}
                    exchangeRate={settings.exchangeRate}
                    currencyCode={settings.currencyCode}
                    isActive={isWorking && !isPaused}
                  />
                </div>
              </div>

              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border space-y-3">
                <div className="flex items-center justify-center">
                  <KeyboardShortcutsHint />
                </div>
                <TimerControls
                  isWorking={isWorking}
                  isPaused={isPaused}
                  isOnBreak={isOnBreak}
                  onStart={startWork}
                  onStop={handleStop}
                  onPause={pauseWork}
                  onResume={resumeWork}
                  onReset={resetSession}
                />
              </div>

              {isWorking && (
                <div className="mt-6">
                  <BreakControls
                    isOnBreak={isOnBreak}
                    currentBreakType={currentBreakType}
                    breakDuration={breakDuration}
                    breakUsage={dailyBreakUsage}
                    onStartBreak={startBreak}
                    onEndBreak={endBreak}
                  />
                </div>
              )}
            </section>

            {/* Quick Stats + Pomodoro + Clock */}
            <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
              <TotalsCard
                todayEarnings={todayEarnings}
                weekEarnings={weekEarnings}
                monthEarnings={monthEarnings}
                exchangeRate={settings.exchangeRate}
                currencyCode={settings.currencyCode}
              />
              <WorldClockWidget useDST={settings.usePacificDST ?? true} />
              <PomodoroTimer />
            </div>

            <NotesCard
              onSaveNotes={(notes) => setSessionNotes(notes)}
              isWorking={isWorking}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4 sm:space-y-6 animate-fade-in">
            <EarningsChart sessions={sessions} />

            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <EarningsProjections
                sessions={sessions}
                todayEarnings={todayEarnings}
                todayGoal={todayGoal}
              />
              <ComparisonCharts sessions={sessions} />
            </div>
            
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <OvertimeCard sessions={sessions} schedule={schedule} settings={settings} />
              <MissedTimeCard sessions={sessions} schedule={schedule} />
            </div>

            <HeatmapCalendar sessions={sessions} />

            <StreakAchievements sessions={sessions} schedule={schedule} />

            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <TotalsCard
                todayEarnings={todayEarnings}
                weekEarnings={weekEarnings}
                monthEarnings={monthEarnings}
                exchangeRate={settings.exchangeRate}
                currencyCode={settings.currencyCode}
              />
              <div className="glass-card rounded-xl p-4 sm:p-6">
                <h3 className="font-semibold text-foreground mb-4">Performance Insights</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">Total Sessions</span>
                    <span className="font-bold text-foreground tabular-nums">{sessions.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">Total Hours</span>
                    <span className="font-bold text-foreground tabular-nums">
                      {(sessions.reduce((sum, s) => sum + s.duration, 0) / 3600).toFixed(1)}h
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">Lifetime Earnings</span>
                    <span className="font-bold text-accent tabular-nums">
                      ${sessions.reduce((sum, s) => sum + s.earnings, 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">Avg. Session</span>
                    <span className="font-bold text-foreground tabular-nums">
                      {sessions.length > 0 
                        ? `${Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length / 60)}m`
                        : "0m"
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4 sm:space-y-6 animate-fade-in">
            <SessionLogsCard
              sessions={sessions}
              onClearLogs={clearLogs}
              onDeleteSession={deleteSession}
              onUpdateSession={updateSession}
              onAddManualSession={addManualSession}
              hourlyRate={settings.hourlyRate}
            />
            <ExportImportCard
              onExportJSON={exportJSON}
              onExportCSV={exportCSV}
              onExportPDF={pdfExportHandler}
              onImportJSON={importJSON}
            />
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="animate-fade-in">
            <ScheduleCard schedule={schedule} onUpdate={updateSchedule} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 sm:space-y-6 animate-fade-in">
            <SettingsCard settings={settings} onUpdate={updateSettings} />
            <ExportImportCard
              onExportJSON={exportJSON}
              onExportCSV={exportCSV}
              onExportPDF={pdfExportHandler}
              onImportJSON={importJSON}
            />
            <ResetDataCard onResetAll={resetAllData} onClearLogs={clearLogs} />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-border text-center text-xs sm:text-sm text-muted-foreground">
          <p>
            {!isOnline
              ? "📡 You're offline. Changes saved locally and will sync when reconnected."
              : user 
                ? "☁️ Data syncs automatically across all devices." 
                : "✅ Data is saved to your browser. Close and reopen anytime!"}
          </p>
        </footer>
      </main>
    </div>
  );
};
