// Main dashboard layout component
import { useState, useCallback } from "react";
import { useEarningsTracker } from "@/hooks/useEarningsTracker";
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

export const Dashboard = () => {
  const {
    isWorking,
    currentDuration,
    currentEarnings,
    todayEarnings,
    weekEarnings,
    monthEarnings,
    settings,
    sessions,
    schedule,
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
  } = useEarningsTracker();

  // Track notes for current session
  const [sessionNotes, setSessionNotes] = useState("");

  // Handle stop with notes
  const handleStop = useCallback(() => {
    stopWork(sessionNotes);
    setSessionNotes("");
  }, [stopWork, sessionNotes]);

  // Chart data
  const chartData = getChartData(7);

  return (
    <div className="min-h-screen bg-background theme-transition">
      <Header isDarkMode={settings.darkMode} onToggleDarkMode={toggleDarkMode} />

      <main className="container py-6 md:py-8">
        {/* Hero section - Timer and Earnings */}
        <section className="glass-card rounded-2xl p-6 md:p-8 mb-6 animate-fade-in">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Timer */}
            <div className="flex flex-col items-center justify-center">
              <TimerDisplay seconds={currentDuration} isActive={isWorking} />
            </div>

            {/* Earnings */}
            <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-border pt-8 md:pt-0 md:pl-8">
              <EarningsDisplay
                usdAmount={currentEarnings}
                exchangeRate={settings.exchangeRate}
                currencyCode={settings.currencyCode}
                isActive={isWorking}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="mt-8 pt-6 border-t border-border">
            <TimerControls
              isWorking={isWorking}
              onStart={startWork}
              onStop={handleStop}
              onReset={resetSession}
            />
          </div>
        </section>

        {/* Dashboard grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Progress */}
          <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <ProgressCard currentEarnings={todayEarnings} dailyGoal={settings.dailyGoal} />
          </div>

          {/* Totals */}
          <div className="animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <TotalsCard
              todayEarnings={todayEarnings}
              weekEarnings={weekEarnings}
              monthEarnings={monthEarnings}
              exchangeRate={settings.exchangeRate}
              currencyCode={settings.currencyCode}
            />
          </div>

          {/* Settings */}
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <SettingsCard settings={settings} onUpdate={updateSettings} />
          </div>

          {/* Chart */}
          <div className="md:col-span-2 animate-fade-in" style={{ animationDelay: "0.25s" }}>
            <EarningsChart data={chartData} />
          </div>

          {/* Schedule */}
          <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <ScheduleCard schedule={schedule} onUpdate={updateSchedule} />
          </div>

          {/* Notes */}
          <div className="animate-fade-in" style={{ animationDelay: "0.35s" }}>
            <NotesCard
              onSaveNotes={(notes) => setSessionNotes(notes)}
              isWorking={isWorking}
            />
          </div>

          {/* Logs */}
          <div className="md:col-span-2 lg:col-span-1 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <SessionLogsCard sessions={sessions} onClearLogs={clearLogs} />
          </div>

          {/* Export/Import */}
          <div className="animate-fade-in" style={{ animationDelay: "0.45s" }}>
            <ExportImportCard
              onExportJSON={exportJSON}
              onExportCSV={exportCSV}
              onImportJSON={importJSON}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          <p>Data is automatically saved to your browser&apos;s local storage.</p>
          <p className="mt-1">Export regularly to keep your data safe!</p>
        </footer>
      </main>
    </div>
  );
};
