import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DateTime } from "luxon";

// Generate and save a monthly PDF report from weekly logs
export function generateMonthlyPDF(logsByWeek, userTimezone = "UTC") {
  const doc = new jsPDF();
  const weekLabels = Object.keys(logsByWeek);
  const pageCount = weekLabels.length;

  weekLabels.forEach((weekLabel, index) => {
    if (index > 0) {
      doc.addPage();
    }
    let currentY = 10; // start Y position for this page

    doc.setFontSize(14);
    doc.text(`Week: ${weekLabel}`, 14, currentY);
    currentY += 8;

    const logs = logsByWeek[weekLabel];
    if (!logs || logs.length === 0) {
      doc.setFontSize(12);
      doc.text("No records for this week.", 14, currentY);
    } else {
      const tableData = logs.map((log) => {
        const clockIn = DateTime.fromISO(log.clock_in).setZone(userTimezone);
        // If clock_out might be null, fallback to clock_in time to avoid errors
        const clockOut = log.clock_out ? DateTime.fromISO(log.clock_out).setZone(userTimezone) : clockIn;

        const durationHours = clockOut.diff(clockIn, "hours").hours.toFixed(2);

        return [
          clockIn.toFormat("yyyy-LL-dd HH:mm"),
          clockOut.toFormat("yyyy-LL-dd HH:mm"),
          durationHours,
          log.note || "—",
        ];
      });

      autoTable(doc, {
        head: [["Clock In", "Clock Out", "Duration (hrs)", "Note"]],
        body: tableData,
        startY: currentY,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] }, // optional: color styling for header
      });
    }

    // Footer with page number, centered horizontally
    doc.setFontSize(10);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.text(`Page ${index + 1} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: "center" });
  });

  doc.save("monthly_timesheet.pdf");
}