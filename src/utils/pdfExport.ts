// Beautiful PDF Report Generator
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { WorkSession, Settings, ScheduleEntry } from "@/types/earnings";

interface ReportData {
  sessions: WorkSession[];
  settings: Settings;
  schedule: ScheduleEntry[];
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
}

// Color palette
const COLORS = {
  primary: [20, 184, 166] as [number, number, number], // Teal
  accent: [245, 158, 11] as [number, number, number], // Amber/Gold
  success: [34, 197, 94] as [number, number, number], // Green
  dark: [30, 41, 59] as [number, number, number], // Slate
  muted: [100, 116, 139] as [number, number, number], // Slate gray
  light: [241, 245, 249] as [number, number, number], // Light gray
};

// Format duration
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// Get date range string
const getDateRange = (sessions: WorkSession[]): string => {
  if (sessions.length === 0) return "No data";
  const dates = sessions.map(s => new Date(s.date));
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  return `${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}`;
};

// Group sessions by date
const groupByDate = (sessions: WorkSession[]): Map<string, WorkSession[]> => {
  const grouped = new Map<string, WorkSession[]>();
  sessions.forEach(session => {
    const existing = grouped.get(session.date) || [];
    grouped.set(session.date, [...existing, session]);
  });
  return grouped;
};

// Calculate statistics
const calculateStats = (sessions: WorkSession[]) => {
  const totalEarnings = sessions.reduce((sum, s) => sum + s.earnings, 0);
  const totalHours = sessions.reduce((sum, s) => sum + s.duration, 0) / 3600;
  const totalBreaks = sessions.reduce((sum, s) => sum + (s.breaks?.length || 0), 0);
  const totalBreakTime = sessions.reduce((sum, s) => 
    sum + (s.breaks?.reduce((bSum, b) => bSum + b.duration, 0) || 0), 0
  );
  const avgSessionLength = sessions.length > 0 
    ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length 
    : 0;
  const avgEarningsPerHour = totalHours > 0 ? totalEarnings / totalHours : 0;

  return {
    totalEarnings,
    totalHours,
    totalBreaks,
    totalBreakTime,
    avgSessionLength,
    avgEarningsPerHour,
    sessionCount: sessions.length,
  };
};

export const generatePDFReport = (data: ReportData) => {
  const { sessions, settings, todayEarnings, weekEarnings, monthEarnings } = data;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Helper to add new page if needed
  const checkPageBreak = (requiredSpace: number = 40) => {
    if (yPos + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
      return true;
    }
    return false;
  };

  // ===== HEADER =====
  // Background header bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 45, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("Earnings Report", 20, 28);

  // Subtitle
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on ${new Date().toLocaleDateString("en-US", { 
    weekday: "long", 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  })}`, 20, 38);

  // Date range badge
  const dateRange = getDateRange(sessions);
  doc.setFillColor(...COLORS.accent);
  doc.roundedRect(pageWidth - 75, 15, 60, 20, 3, 3, "F");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(dateRange, pageWidth - 45, 27, { align: "center" });

  yPos = 60;

  // ===== SUMMARY CARDS =====
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Summary Overview", 20, yPos);
  yPos += 12;

  const stats = calculateStats(sessions);
  const cardWidth = (pageWidth - 50) / 3;
  const cards = [
    { label: "Today", value: `$${todayEarnings.toFixed(2)}`, color: COLORS.success },
    { label: "This Week", value: `$${weekEarnings.toFixed(2)}`, color: COLORS.primary },
    { label: "This Month", value: `$${monthEarnings.toFixed(2)}`, color: COLORS.accent },
  ];

  cards.forEach((card, i) => {
    const x = 20 + i * (cardWidth + 5);
    
    // Card background
    doc.setFillColor(...COLORS.light);
    doc.roundedRect(x, yPos, cardWidth, 35, 3, 3, "F");
    
    // Accent bar
    doc.setFillColor(...card.color);
    doc.rect(x, yPos, 4, 35, "F");
    
    // Label
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text(card.label, x + 10, yPos + 12);
    
    // Value
    doc.setFontSize(18);
    doc.setTextColor(...COLORS.dark);
    doc.setFont("helvetica", "bold");
    doc.text(card.value, x + 10, yPos + 27);
  });

  yPos += 50;

  // ===== STATISTICS SECTION =====
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Performance Statistics", 20, yPos);
  yPos += 10;

  // Stats grid
  const statsData = [
    ["Total Sessions", stats.sessionCount.toString()],
    ["Total Hours Worked", `${stats.totalHours.toFixed(1)}h`],
    ["Total Earnings", `$${stats.totalEarnings.toFixed(2)}`],
    ["Average $/Hour", `$${stats.avgEarningsPerHour.toFixed(2)}`],
    ["Avg Session Length", formatDuration(stats.avgSessionLength)],
    ["Total Breaks Taken", stats.totalBreaks.toString()],
    ["Total Break Time", formatDuration(stats.totalBreakTime)],
    ["Hourly Rate", `$${settings.hourlyRate}/hr`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: statsData,
    theme: "plain",
    styles: {
      fontSize: 10,
      cellPadding: 6,
    },
    columnStyles: {
      0: { textColor: COLORS.muted, fontStyle: "normal" },
      1: { textColor: COLORS.dark, fontStyle: "bold", halign: "right" },
    },
    alternateRowStyles: {
      fillColor: COLORS.light,
    },
    margin: { left: 20, right: 20 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 20;

  // ===== SESSION DETAILS TABLE =====
  checkPageBreak(60);
  
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Session Log", 20, yPos);
  yPos += 10;

  if (sessions.length > 0) {
    // Sort by date (most recent first)
    const sortedSessions = [...sessions].sort((a, b) => b.startTime - a.startTime);
    
    const tableData = sortedSessions.map(session => {
      const startDate = new Date(session.startTime);
      const breakCount = session.breaks?.length || 0;
      return [
        startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        formatDuration(session.duration),
        breakCount > 0 ? `${breakCount} break${breakCount > 1 ? "s" : ""}` : "-",
        `$${session.earnings.toFixed(2)}`,
        session.notes ? (session.notes.length > 30 ? session.notes.substring(0, 30) + "..." : session.notes) : "-",
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [["Date", "Start", "Duration", "Breaks", "Earned", "Notes"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
      },
      styles: {
        fontSize: 9,
        cellPadding: 5,
      },
      alternateRowStyles: {
        fillColor: COLORS.light,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25, fontStyle: "bold", textColor: COLORS.success },
        5: { cellWidth: "auto" },
      },
      margin: { left: 20, right: 20 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 20;
  } else {
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.muted);
    doc.text("No sessions recorded yet.", 20, yPos + 10);
    yPos += 25;
  }

  // ===== DAILY BREAKDOWN =====
  checkPageBreak(60);
  
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Daily Breakdown", 20, yPos);
  yPos += 10;

  const grouped = groupByDate(sessions);
  const dailyData = Array.from(grouped.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 14) // Last 14 days
    .map(([date, daySessions]) => {
      const dayStats = calculateStats(daySessions);
      const dateObj = new Date(date);
      return [
        dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        daySessions.length.toString(),
        `${dayStats.totalHours.toFixed(1)}h`,
        formatDuration(dayStats.totalBreakTime),
        `$${dayStats.totalEarnings.toFixed(2)}`,
      ];
    });

  if (dailyData.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [["Day", "Sessions", "Hours", "Break Time", "Earnings"]],
      body: dailyData,
      theme: "striped",
      headStyles: {
        fillColor: COLORS.accent,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
      },
      styles: {
        fontSize: 9,
        cellPadding: 5,
      },
      alternateRowStyles: {
        fillColor: COLORS.light,
      },
      columnStyles: {
        4: { fontStyle: "bold", textColor: COLORS.success },
      },
      margin: { left: 20, right: 20 },
    });
  }

  // ===== FOOTER =====
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(...COLORS.light);
    doc.setLineWidth(0.5);
    doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);
    
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text("Earnings Tracker Report", 20, pageHeight - 8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 20, pageHeight - 8, { align: "right" });
  }

  // Save the PDF
  const today = new Date().toISOString().split("T")[0];
  doc.save(`earnings-report-${today}.pdf`);
};

export default generatePDFReport;