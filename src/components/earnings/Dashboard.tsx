// Main dashboard layout with sidebar menu
import { useState, useCallback, useMemo, useEffect, lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEarningsTracker } from "@/hooks/useEarningsTracker";
import { useAuth } from "@/contexts/AuthContext";
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
const BudgetTab = lazy(() => import("./BudgetTab").then(m => ({ default: m.BudgetTab })));
const StudyTab = lazy(() => import("./StudyTab").then(m => ({ default: m.StudyTab })));
import { FinancialHealthCard } from "./FinancialHealthCard";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { generatePDFReport } from "@/utils/pdfExport";
import { Home, BarChart3, History, Settings, Calendar, Clock, DollarSign, Zap, Wallet, BookOpen, type LucideIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type DashboardSection = "timer" | "budget" | "study" | "analytics" | "logs" | "schedule" | "settings";

const NAV_ITEMS: { value: DashboardSection; label: string; icon: LucideIcon; description: string }[] = [
  { value: "timer", label: "Timer", icon: Home, description: "Track time and earnings" },
  { value: "budget", label: "Budget", icon: Wallet, description: "Plan spending and bills" },
  { value: "study", label: "Study", icon: BookOpen, description: "Study sessions and stats" },
  { value: "analytics", label: "Analytics", icon: BarChart3, description: "Trends and insights" },
  { value: "logs", label: "Logs", icon: History, description: "Session history" },
  { value: "schedule", label: "Schedule", icon: Calendar, description: "Weekly availability" },
  { value: "settings", label: "Settings", icon: Settings, description: "Preferences and data" },
];

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
  const [activeSection, setActiveSection] = useState<DashboardSection>("timer");
  const [commandOpen, setCommandOpen] = useState(false);

  // ⌘K / Ctrl+K to open command palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const currentNav = NAV_ITEMS.find((n) => n.value === activeSection);

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
    <SidebarProvider defaultOpen className="bg-background theme-transition">
        <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <SidebarInset className="min-w-0">
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
        sidebarTrigger={<SidebarTrigger className="mr-1 h-8 w-8 rounded-md" />}
        currentSection={currentNav?.label}
        onOpenCommand={() => setCommandOpen(true)}
      />

      <main className="container px-3 sm:px-4 py-4 sm:py-5 md:py-6 max-w-5xl mx-auto pb-24 md:pb-6">
        {/* Section header */}
        {currentNav && (
          <div className="mb-4 sm:mb-5 animate-fade-in">
            <h2 className="section-title flex items-center gap-2">
              <currentNav.icon className="w-5 h-5 text-muted-foreground" />
              {currentNav.label}
            </h2>
            <p className="section-subtitle">{currentNav.description}</p>
          </div>
        )}

        {/* Hero Progress Bar — only on timer view */}
        {activeSection === "timer" && (
          <section className="mb-4 sm:mb-6 animate-fade-in">
            <ProgressCard
              currentEarnings={todayEarnings}
              dailyGoal={todayGoal}
              isWorking={isWorking && !isPaused && !isOnBreak}
            />
          </section>
        )}
        {/* Main menu content */}
          {/* Timer Tab */}
          {activeSection === "timer" && (
          <section className="space-y-4 sm:space-y-6 animate-fade-in">
            {/* Status pill + Today's Quick Stats */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                isWorking && !isPaused && !isOnBreak
                  ? "bg-success/10 text-success border-success/30"
                  : isOnBreak
                    ? "bg-warning/10 text-warning border-warning/30"
                    : isPaused
                      ? "bg-muted text-muted-foreground border-border"
                      : "bg-muted/60 text-muted-foreground border-border"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isWorking && !isPaused && !isOnBreak ? "bg-success animate-pulse" :
                  isOnBreak ? "bg-warning" :
                  isPaused ? "bg-muted-foreground" : "bg-muted-foreground/60"
                }`} />
                {isOnBreak ? "On break" : isPaused ? "Paused" : isWorking ? "Working" : "Idle"}
              </div>

              <div className="flex items-center gap-3 sm:gap-4 px-3 py-1.5 rounded-full border border-border/70 bg-card text-xs sm:text-sm overflow-x-auto">
                <div className="flex items-center gap-1.5 shrink-0">
                  <DollarSign className="w-3.5 h-3.5 text-accent" />
                  <span className="text-muted-foreground">Today</span>
                  <span className="font-semibold text-foreground tabular-nums">${todayEarnings.toFixed(2)}</span>
                </div>
                <div className="w-px h-3.5 bg-border shrink-0" />
                <div className="flex items-center gap-1.5 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span className="font-medium text-foreground tabular-nums">{todayStats.hours.toFixed(1)}h</span>
                </div>
                <div className="w-px h-3.5 bg-border shrink-0" />
                <div className="flex items-center gap-1.5 shrink-0">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <span className="font-medium text-foreground tabular-nums">{todayStats.sessions}</span>
                  <span className="text-muted-foreground">sessions</span>
                </div>
                {shiftRemaining && settings.showShiftRemaining !== false && (
                  <>
                    <div className="w-px h-3.5 bg-border shrink-0" />
                    <span className="text-muted-foreground shrink-0">⏰ {shiftRemaining}</span>
                  </>
                )}
              </div>
            </div>

            {/* Timer and Earnings Hero */}
            <section className="surface-card p-4 sm:p-6 md:p-8 shadow-sm">
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

            <FinancialHealthCard sessions={sessions} />

            <NotesCard
              onSaveNotes={(notes) => setSessionNotes(notes)}
              isWorking={isWorking}
            />
          </section>
          )}

          {/* Budget */}
          {activeSection === "budget" && (
          <section className="animate-fade-in">
            <Suspense fallback={<TabSkeleton />}>
              <BudgetTab sessions={sessions} />
            </Suspense>
          </section>
          )}

          {/* Study */}
          {activeSection === "study" && (
          <section className="animate-fade-in">
            <Suspense fallback={<TabSkeleton />}>
              <StudyTab />
            </Suspense>
          </section>
          )}

          {/* Analytics */}
          {activeSection === "analytics" && (
          <section className="space-y-4 sm:space-y-6 animate-fade-in">
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
          </section>
          )}

          {/* Logs */}
          {activeSection === "logs" && (
          <section className="space-y-4 sm:space-y-6 animate-fade-in">
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
          </section>
          )}

          {/* Schedule */}
          {activeSection === "schedule" && (
          <section className="animate-fade-in">
            <ScheduleCard schedule={schedule} onUpdate={updateSchedule} />
          </section>
          )}

          {/* Settings */}
          {activeSection === "settings" && (
          <section className="space-y-4 sm:space-y-6 animate-fade-in">
            <SettingsCard settings={settings} onUpdate={updateSettings} />
            <ExportImportCard
              onExportJSON={exportJSON}
              onExportCSV={exportCSV}
              onExportPDF={pdfExportHandler}
              onImportJSON={importJSON}
            />
            <ResetDataCard onResetAll={resetAllData} onClearLogs={clearLogs} />
          </section>
          )}

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

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Primary"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="grid grid-cols-5 gap-0.5 px-1 pt-1">
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const active = activeSection === item.value;
            const Icon = item.icon;
            return (
              <li key={item.value}>
                <button
                  onClick={() => setActiveSection(item.value)}
                  className={`w-full flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-md text-[10px] font-medium transition-colors ${
                    active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Command palette */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Jump to a section…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {NAV_ITEMS.map((item) => (
              <CommandItem
                key={item.value}
                onSelect={() => {
                  setActiveSection(item.value);
                  setCommandOpen(false);
                }}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">{item.description}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => { toggleDarkMode(); setCommandOpen(false); }}>
              Toggle dark mode
            </CommandItem>
            {!isWorking && (
              <CommandItem onSelect={() => { startWork(); setCommandOpen(false); setActiveSection("timer"); }}>
                Start working
              </CommandItem>
            )}
            {isWorking && !isPaused && (
              <CommandItem onSelect={() => { pauseWork(); setCommandOpen(false); }}>
                Pause timer
              </CommandItem>
            )}
            {isWorking && isPaused && (
              <CommandItem onSelect={() => { resumeWork(); setCommandOpen(false); }}>
                Resume timer
              </CommandItem>
            )}
            {isWorking && (
              <CommandItem onSelect={() => { handleStop(); setCommandOpen(false); }}>
                Stop & save session
              </CommandItem>
            )}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
        </SidebarInset>
    </SidebarProvider>
  );
};

const TabSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-32 w-full rounded-xl" />
    <div className="grid gap-4 md:grid-cols-2">
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
    <Skeleton className="h-64 w-full rounded-xl" />
  </div>
);


const AppSidebar = ({ activeSection, onSectionChange }: { activeSection: DashboardSection; onSectionChange: (section: DashboardSection) => void }) => {
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    tooltip={item.label}
                    isActive={activeSection === item.value}
                    onClick={() => {
                      onSectionChange(item.value);
                      setOpenMobile(false);
                    }}
                    className="cursor-pointer"
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
};
