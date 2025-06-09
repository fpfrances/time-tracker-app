import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { saveAs } from 'file-saver';

export async function generateMonthlyPDF(monthlyLogsByWeek, user) {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595, 842]); // A4 size in points
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const userName = user?.name || user?.email || "Unknown User";
  const { width, height } = page.getSize();

  const margin = 50;
  const lineHeight = 18;
  const fontSize = 13;
  const headingSize = 18;
  const barHeight = 30;

  let y = height - margin;

  // Declare once here:
  const firstWeekKey = Object.keys(monthlyLogsByWeek)[0];
  const monthName = firstWeekKey
    ? new Date(firstWeekKey.split(' - ')[0]).toLocaleString('default', { month: 'long', year: 'numeric' })
    : 'Unknown Month';

  // Gradient bar helper
  const drawGradientBar = (yPos) => {
    const steps = 50;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const r = 0.5 * (1 - t) + 0.2 * t;
      const g = 0 * (1 - t) + 0.4 * t;
      const b = 0.5 * (1 - t) + 0.8 * t;
      page.drawRectangle({
        x: (width / steps) * i,
        y: yPos,
        width: width / steps,
        height: barHeight,
        color: rgb(r, g, b),
      });
    }
  };

  // Header & footer with gradient bars
  const addHeaderAndFooter = () => {
    drawGradientBar(height - barHeight);
    drawGradientBar(0);


    // Center title text horizontally
  const title = `${monthName} Monthly Report`;
  const titleWidth = fontBold.widthOfTextAtSize(title, headingSize);
  const titleX = (width - titleWidth) / 2;

  page.drawText(title, {
      x: titleX,
      y: height - 20,
      size: headingSize,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText(`Downloaded on: ${new Date().toLocaleString()}`, {
      x: width - margin - 120,
      y: 10,
      size: 9,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
  };

  // Table header row with background
  const drawTableHeader = (posY) => {
    page.drawRectangle({
      x: margin,
      y: posY - 4,
      width: width - margin * 2,
      height: lineHeight + 4,
      color: rgb(0.9, 0.9, 0.9),
    });

    page.drawText("Day", {
      x: margin + 10,
      y: posY,
      size: fontSize,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    page.drawText("Hours", {
      x: margin + 120,
      y: posY,
      size: fontSize,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    page.drawText("Note", {
      x: margin + 200,
      y: posY,
      size: fontSize,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    return posY - (lineHeight + 8);
  };

  // Draw first page header/footer
  addHeaderAndFooter();

  // User name
  page.drawText(`Name: ${userName}`, {
    x: margin,
    y,
    size: fontSize,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  y -= lineHeight * 2;

  // Iterate through each week
  for (const weekRange in monthlyLogsByWeek) {
    // If near bottom, add new page & redraw header/footer and table header
    if (y < margin + lineHeight * 6) {
      page = pdfDoc.addPage([595, 842]);
      y = height - margin;
      addHeaderAndFooter();
      // Also redraw table header after week label
    }

    // Draw week label
    page.drawText(`Week: ${weekRange}`, {
      x: margin + 150,
      y,
      size: fontSize,
      font: fontBold,
      color: rgb(0, 0, 0.6),
    });
    y -= lineHeight / 0.8;

    // Get logs for the week
    const logs = monthlyLogsByWeek[weekRange];

    // Group logs by day with summary
    const dailySummary = {};
    logs.forEach((log) => {
      const dateObj = log.clockInTime ? new Date(log.clockInTime) : null;
      if (!dateObj) return;

      const dateKey = dateObj.toLocaleDateString('en-CA'); // ISO format YYYY-MM-DD in local time
      const dayName = dateObj.toLocaleDateString(undefined, { weekday: 'long' });

      if (!dailySummary[dateKey]) {
        dailySummary[dateKey] = {
          totalDuration: 0,
          latestNote: '',
          latestTime: 0,
          dayName,
        };
      }

      if (typeof log.duration === 'number') {
        dailySummary[dateKey].totalDuration += log.duration;
      }

      const outTime = log.clockOutTime ? new Date(log.clockOutTime).getTime() : 0;
      if (outTime > dailySummary[dateKey].latestTime && log.note) {
        dailySummary[dateKey].latestNote = log.note;
        dailySummary[dateKey].latestTime = outTime;
      }
    });

    // Draw table header for the week
    y = drawTableHeader(y);

    // Render daily summaries rows
    const sortedDates = Object.keys(dailySummary).sort((a, b) => new Date(a) - new Date(b));
    for (const dateKey of sortedDates) {
      const { dayName, totalDuration, latestNote } = dailySummary[dateKey];

      if (y < margin + lineHeight * 3) {
        // New page if space is low
        page = pdfDoc.addPage([595, 842]);
        y = height - margin;
        addHeaderAndFooter();
        y = drawTableHeader(y);
      }

      page.drawText(dayName, {
        x: margin + 10,
        y,
        size: fontSize,
        font: fontRegular,
      });
      page.drawText(`${totalDuration.toFixed(2)}h`, {
        x: margin + 120,
        y,
        size: fontSize,
        font: fontRegular,
      });
      page.drawText(latestNote || 'No note', {
        x: margin + 200,
        y,
        size: fontSize,
        font: fontRegular,
      });

      y -= lineHeight;
    }

    y -= lineHeight * 0.5; // extra spacing after week
  }

  // Save and trigger download
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  saveAs(blob, `MonthlyReport_${monthName.replace(/ /g, '_')}.pdf`);
}