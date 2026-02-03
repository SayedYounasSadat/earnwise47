// Main dashboard layout with tabs
import { useState, useCallback } from "react";
import { useEarningsTracker } from "@/hooks/useEarningsTracker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "./Header";
import { TimerDisplay } from "./TimerDisplay";
import { EarningsDisplay } from "./EarningsDisplay";
import { TimerControls } from "./TimerControls";
import { ProgressCard } from "./ProgressCard";
import { TotalsCard } from "./TotalsCard";
import { SettingsCard } from "./SettingsCard";
import { SessionLogsCard } from "./SessionLogsCard";
import { NotesCard } from "./NotesCard";
import { EarningsChart } from "./EarningsChart";
import { ExportImportCard } from "./ExportImportCard";
import { ScheduleCard } from "./ScheduleCard";
import { Home, BarChart3, History, Settings, Calendar } from "lucide-react";

export const Dashboard = () => {
  const {
    isWorking,
    isPaused,
    currentDuration,
    currentEarnings,
    todayEarnings,
    weekEarnings,
    monthEarnings,
    settings,
    sessions,
    schedule,
    startWork,
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
  } = useEarningsTracker();

  // Track notes for current session
  const [sessionNotes, setSessionNotes] = useState("");

  // Handle stop with notes
  const handleStop = useCallback(() => {
    stopWork(sessionNotes);
    setSessionNotes("");
  }, [stopWork, sessionNotes]);

  return (
    <div className="min-h-screen bg-background theme-transition">
      <Header isDarkMode={settings.darkMode} onToggleDarkMode={toggleDarkMode} />

      <main className="container py-4 md:py-6">
        {/* Hero Progress Bar - Always visible at top */}
        <section className="mb-6 animate-fade-in">
          <ProgressCard 
            currentEarnings={todayEarnings} 
            dailyGoal={settings.dailyGoal}
            isWorking={isWorking && !isPaused}
          />
        </section>

        {/* Main Tabs */}
        <Tabs defaultValue="timer" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="timer" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Timer</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Logs</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Timer Tab - Main working area */}
          <TabsContent value="timer" className="space-y-6 animate-fade-in">
            {/* Timer and Earnings Hero */}
            <section className="glass-card rounded-2xl p-6 md:p-8">
              <div className="grid gap-8 md:grid-cols-2">
                {/* Timer */}
                <div className="flex flex-col items-center justify-center">
                  <TimerDisplay 
                    seconds={currentDuration} 
                    isActive={isWorking} 
                    isPaused={isPaused}
                  />
                </div>

                {/* Earnings */}
                <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-border pt-8 md:pt-0 md:pl-8">
                  <EarningsDisplay
                    usdAmount={currentEarnings}
                    exchangeRate={settings.exchangeRate}
                    currencyCode={settings.currencyCode}
                    isActive={isWorking && !isPaused}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="mt-8 pt-6 border-t border-border">
                <TimerControls
                  isWorking={isWorking}
                  isPaused={isPaused}
                  onStart={startWork}
                  onStop={handleStop}
                  onPause={pauseWork}
                  onResume={resumeWork}
                  onReset={resetSession}
                />
              </div>
            </section>

            {/* Quick Stats */}
            <div className="grid gap-6 md:grid-cols-2">
              <TotalsCard
                todayEarnings={todayEarnings}
                weekEarnings={weekEarnings}
                monthEarnings={monthEarnings}
                exchangeRate={settings.exchangeRate}
                currencyCode={settings.currencyCode}
              />
              <NotesCard
                onSaveNotes={(notes) => setSessionNotes(notes)}
                isWorking={isWorking}
              />
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 animate-fade-in">
            <EarningsChart sessions={sessions} />
            
            <div className="grid gap-6 md:grid-cols-2">
              <TotalsCard
                todayEarnings={todayEarnings}
                weekEarnings={weekEarnings}
                monthEarnings={monthEarnings}
                exchangeRate={settings.exchangeRate}
                currencyCode={settings.currencyCode}
              />
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Performance Insights</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Total Sessions</span>
                    <span className="font-bold text-foreground">{sessions.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Total Hours</span>
                    <span className="font-bold text-foreground">
                      {(sessions.reduce((sum, s) => sum + s.duration, 0) / 3600).toFixed(1)}h
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Lifetime Earnings</span>
                    <span className="font-bold text-accent">
                      ${sessions.reduce((sum, s) => sum + s.earnings, 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Avg. Session</span>
                    <span className="font-bold text-foreground">
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
          <TabsContent value="logs" className="space-y-6 animate-fade-in">
            <SessionLogsCard sessions={sessions} onClearLogs={clearLogs} />
            <ExportImportCard
              onExportJSON={exportJSON}
              onExportCSV={exportCSV}
              onImportJSON={importJSON}
            />
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="animate-fade-in">
            <ScheduleCard schedule={schedule} onUpdate={updateSchedule} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6 animate-fade-in">
            <SettingsCard settings={settings} onUpdate={updateSettings} />
            <ExportImportCard
              onExportJSON={exportJSON}
              onExportCSV={exportCSV}
              onImportJSON={importJSON}
            />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          <p>✅ Data is automatically saved to your browser. Close and reopen anytime!</p>
        </footer>
      </main>
    </div>
  );
};
