// Main dashboard layout with sidebar menu
import { useState, useCallback, useMemo, useEffect, lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEarningsTracker } from "@/hooks/useEarningsTracker";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "./Header";
import { TimerHero } from "./TimerHero";
import { RecentSessionsPreview } from "./RecentSessionsPreview";
import { BreakControls } from "./BreakControls";

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

const BudgetTab = lazy(() => import("./BudgetTab").then(m => ({ default: m.BudgetTab })));
const StudyTab = lazy(() => import("./StudyTab").then(m => ({ default: m.StudyTab })));
import { FinancialHealthCard } from "./FinancialHealthCard";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { generatePDFReport } from "@/utils/pdfExport";
import { Home, BarChart3, History, Settings, Calendar, Wallet, BookOpen, type LucideIcon } from "lucide-react";
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

        {/* Main menu content */}
          {/* Timer Tab */}
          {activeSection === "timer" && (
          <section className="space-y-4 sm:space-y-6 animate-fade-in">
            <TimerHero
              isWorking={isWorking}
              isPaused={isPaused}
              isOnBreak={isOnBreak}
              currentDuration={currentDuration}
              currentEarnings={currentEarnings}
              exchangeRate={settings.exchangeRate}
              currencyCode={settings.currencyCode}
              todayEarnings={todayEarnings}
              dailyGoal={todayGoal}
              shiftRemaining={shiftRemaining}
              showShiftRemaining={settings.showShiftRemaining !== false}
              displayName={user?.displayName ?? null}
              onStart={startWork}
              onStop={handleStop}
              onPause={pauseWork}
              onResume={resumeWork}
              onReset={resetSession}
            />

            {isWorking && (
              <BreakControls
                isOnBreak={isOnBreak}
                currentBreakType={currentBreakType}
                breakDuration={breakDuration}
                breakUsage={dailyBreakUsage}
                onStartBreak={startBreak}
                onEndBreak={endBreak}
              />
            )}

            {/* Quick stats strip */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: "Today", value: `$${todayEarnings.toFixed(2)}`, sub: `${todayStats.hours.toFixed(1)}h` },
                { label: "This week", value: `$${weekEarnings.toFixed(2)}`, sub: "earned" },
                { label: "Sessions", value: `${todayStats.sessions}`, sub: "today" },
              ].map((s) => (
                <div key={s.label} className="surface-card p-3 sm:p-4">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-lg sm:text-xl font-semibold tabular-nums text-foreground">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Recent sessions QoL */}
            <RecentSessionsPreview
              sessions={sessions}
              onViewAll={() => setActiveSection("logs")}
            />

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
              <div className="surface-card p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Performance Insights</h3>
                  <span className="text-xs text-muted-foreground">All-time</span>
                </div>
                <dl className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Total sessions", value: sessions.length.toString() },
                    { label: "Total hours", value: `${(sessions.reduce((sum, s) => sum + s.duration, 0) / 3600).toFixed(1)}h` },
                    { label: "Lifetime earnings", value: `$${sessions.reduce((sum, s) => sum + s.earnings, 0).toFixed(2)}`, accent: true },
                    { label: "Avg. session", value: sessions.length > 0 ? `${Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length / 60)}m` : "0m" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg border border-border/60 bg-muted/30 p-3">
                      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</dt>
                      <dd className={`mt-1 text-lg font-semibold tabular-nums ${s.accent ? "text-accent" : "text-foreground"}`}>{s.value}</dd>
                    </div>
                  ))}
                </dl>
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
