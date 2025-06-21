import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { saveAs } from 'file-saver';

export async function generateWeeklyPDF(weeklyLog, dailyNotes, userTimezone, weekRange, user) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size in points (595x842)
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const userName = user?.name || user?.email || "Unknown User";

  // Helper function to draw text with default black color
  const drawText = (text, x, y, size = 12, useBold = false) => {
    page.drawText(text, {
      x,
      y,
      size,
      font: useBold ? fontBold : font,
      color: rgb(0, 0, 0),
    });
  };

// Draw header background (top bar)
const startX = 0;
const barHeight = 30;
const barWidth = width;
const steps = 50;                 // Number of gradient steps
const topY = height - barHeight;  // top bar y-position
const bottomY = 0;                // bottom bar y-position

for (let i = 0; i < steps; i++) {
  // Calculate interpolation between purple and blue
  const t = i / (steps - 1);
  const r = 0.5 * (1 - t) + 0.2 * t;
  const g = 0 * (1 - t) + 0.4 * t;
  const b = 0.5 * (1 - t) + 0.8 * t;

  // Draw top bar slice
  page.drawRectangle({
    x: startX + (barWidth / steps) * i,
    y: topY,
    width: barWidth / steps,
    height: barHeight,
    color: rgb(r, g, b),
  });

  // Draw bottom bar slice
  page.drawRectangle({
    x: startX + (barWidth / steps) * i,
    y: bottomY,
    width: barWidth / steps,
    height: barHeight,
    color: rgb(r, g, b),
  });
}

  // Header title text in white
  page.drawText('Weekly Report', {
    x: 230,
    y: height - 20,
    size: 18,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // Start Y below header
  let y = height - 150;

  drawText(`Name: ${userName}`, 50, 760, 16, true);
  drawText(`Week: ${weekRange}`, 197, 700, 16, true);

  y -= 50;

  // Table column headers
  drawText('Day', 50, y, 14, true);
  drawText('Hours', 150, y, 14, true);
  drawText('Notes', 250, y, 14, true);

  y -= 7;

  // Draw a line under headers
  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0.5, 0.5, 0.5),
  });

  y -= 20;

  // List daily logs with notes
  Object.entries(weeklyLog).forEach(([day, hours]) => {
  drawText(day, 50, y);
  drawText(hours.toFixed(2), 150, y);

  const notes = dailyNotes[day];
  let noteLines = 1;

  if (Array.isArray(notes) && notes.length > 0) {
    notes.forEach((note, index) => {
      drawText(`• ${note}`, 250, y - index * 12, 10);
    });
    noteLines = notes.length;
  } else {
    drawText('No note', 250, y, 10);
  }

  // Subtract height: base line + all additional note lines + padding
  y -= Math.max(20, noteLines * 12 + 8);
});

  // Draw separator line above total
  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0.5, 0.5, 0.5),
  });

  y -= 18;

  // Total hours in bold
const total = Object.values(weeklyLog).reduce((acc, cur) => acc + cur, 0).toFixed(2);
drawText(`Total Hours: ${total}`, 50, y, 15, true);

// Add download timestamp in white at bottom bar
const downloadDate = new Date();
const formattedDate = downloadDate.toLocaleString();

page.drawText(`Downloaded on: ${formattedDate}`, {
  x: 425,
  y: 10,
  size: 9,
  font: fontBold,
  color: rgb(1, 1, 1),
});

// Save and download PDF
const pdfBytes = await pdfDoc.save();
const blob = new Blob([pdfBytes], { type: 'application/pdf' });
saveAs(blob, `Weekly_Report_${weekRange.replace(/\s+/g, '_')}.pdf`);
}