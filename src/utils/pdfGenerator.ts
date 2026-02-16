import PDFDocument from "pdfkit";

type ColorValue = PDFKit.Mixins.ColorValue;

interface ProjectData {
  projectId: string;
  name: string;
  description: string | undefined;
  isBillable: boolean;
  hourlyRate: number | null;
  projectCreatedOn: string;
  projectStartedOn: string;
  projectLastWorkOn: string;
  totalWorkingHours: number;
  totalEarnings: number;
}

interface OverviewData {
  totalProjects: number;
  totalWorkingHours: number;
  billableProjects: number;
  billableHours: number;
  billableEarnings: number;
  nonBillableProjects: number;
  nonBillableHours: number;
}

interface FilterInfo {
  from?: string;
  to?: string;
}

// Generate PDF for projects summary
export const generateProjectsSummaryPDF = async (
  projects: ProjectData[],
  filters: FilterInfo | null,
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header section
      drawHeader(doc, "Projects Summary Report");

      // Date range filter info
      if (filters && (filters.from || filters.to)) {
        doc.fontSize(10).fillColor("gray").text(`Report Period:`, 50, 100);
        const dateRangeText = filters.from && filters.to
          ? `${filters.from} to ${filters.to}`
          : filters.from
          ? `From ${filters.from}`
          : `Until ${filters.to}`;
        doc.fillColor("black").text(dateRangeText, 140, 100);
      }

      let yPosition = filters && (filters.from || filters.to) ? 125 : 105;

      // Summary table
      if (projects.length === 0) {
        doc.fontSize(12).fillColor("gray").text("No projects with activity in the selected date range.", 50, yPosition);
      } else {
        // Table header
        const tableTop = yPosition;
        const rowHeight = 25;
        const colWidth = { name: 150, hours: 70, rate: 60, earnings: 70, dates: 120 };

        // Draw header background
        doc.fillColor("#f0f0f0").rect(50, tableTop, 470, rowHeight).fill();
        doc.fillColor("black");

        // Header text
        doc.fontSize(9).font("Helvetica-Bold");
        doc.text("Project", 55, tableTop + 8);
        doc.text("Hours", 55 + colWidth.name, tableTop + 8);
        doc.text("Rate", 55 + colWidth.name + colWidth.hours, tableTop + 8);
        doc.text("Earnings", 55 + colWidth.name + colWidth.hours + colWidth.rate, tableTop + 8);
        doc.text("Work Period", 55 + colWidth.name + colWidth.hours + colWidth.rate + colWidth.earnings, tableTop + 8);

        let currentY = tableTop + rowHeight;
        doc.font("Helvetica").fontSize(8);

        // Project rows
        projects.forEach((project, index) => {
          // Alternate row background
          if (index % 2 === 0) {
            doc.fillColor("#fafafa").rect(50, currentY, 470, rowHeight).fill();
          }

          doc.fillColor("black");
          doc.text(truncateText(project.name, 20), 55, currentY + 8);
          doc.text(project.totalWorkingHours.toFixed(2), 55 + colWidth.name, currentY + 8);
          doc.text(project.isBillable && project.hourlyRate ? `${project.hourlyRate}/hr` : "N/A", 55 + colWidth.name + colWidth.hours, currentY + 8);
          doc.text(project.isBillable ? `${project.totalEarnings.toFixed(2)}` : "-", 55 + colWidth.name + colWidth.hours + colWidth.rate, currentY + 8);
          doc.text(`${formatDate(project.projectStartedOn)} - ${formatDate(project.projectLastWorkOn)}`, 55 + colWidth.name + colWidth.hours + colWidth.rate + colWidth.earnings, currentY + 8, { width: 115 });

          currentY += rowHeight;

          // New page if needed
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }
        });

        // Totals section
        currentY += 20;
        if (currentY > 650) {
          doc.addPage();
          currentY = 50;
        }

        const totalHours = projects.reduce((sum, p) => sum + p.totalWorkingHours, 0);
        const totalEarnings = projects.reduce((sum, p) => sum + p.totalEarnings, 0);
        const billableCount = projects.filter(p => p.isBillable).length;

        doc.fontSize(11).font("Helvetica-Bold");
        doc.text("Summary Totals", 50, currentY);
        currentY += 20;

        doc.font("Helvetica").fontSize(10);
        doc.text(`Total Projects: ${projects.length}`, 50, currentY);
        doc.text(`Billable Projects: ${billableCount}`, 200, currentY);
        doc.text(`Non-Billable Projects: ${projects.length - billableCount}`, 370, currentY);
        currentY += 15;
        doc.text(`Total Hours: ${totalHours.toFixed(2)}`, 50, currentY);
        doc.text(`Total Earnings: ${totalEarnings.toFixed(2)}`, 200, currentY);
      }

      // Footer
      drawFooter(doc);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Generate PDF for overview summary
export const generateOverviewSummaryPDF = async (
  overview: OverviewData,
  filters: FilterInfo | null,
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      drawHeader(doc, "Overview Summary Report");

      // Date range filter info
      let yPosition = 100;
      if (filters && (filters.from || filters.to)) {
        doc.fontSize(10).fillColor("gray").text(`Report Period:`, 50, yPosition);
        const dateRangeText = filters.from && filters.to
          ? `${filters.from} to ${filters.to}`
          : filters.from
          ? `From ${filters.from}`
          : `Until ${filters.to}`;
        doc.fillColor("black").text(dateRangeText, 140, yPosition);
        yPosition += 25;
      }

      // Metrics cards
      const metrics = [
        { label: "Total Projects", value: overview.totalProjects.toString(), color: "#4CAF50" },
        { label: "Total Working Hours", value: `${overview.totalWorkingHours.toFixed(2)} hrs`, icon: "⏱", color: "#2196F3" },
        { label: "Billable Projects", value: overview.billableProjects.toString(), icon: "💰", color: "#FF9800" },
        { label: "Billable Hours", value: `${overview.billableHours.toFixed(2)} hrs`, icon: "💵", color: "#9C27B0" },
        { label: "Total Earnings", value: `${overview.billableEarnings.toFixed(2)}`, icon: "💲", color: "#F44336" },
        { label: "Non-Billable Projects", value: overview.nonBillableProjects.toString(), icon: "📋", color: "#009688" },
        { label: "Non-Billable Hours", value: `${overview.nonBillableHours.toFixed(2)} hrs`, icon: "⏰", color: "#673AB7" },
      ];

      // Draw metrics boxes
      const boxWidth = 240;
      const boxHeight = 60;
      const boxGap = 20;
      let x = 50;
      let y = yPosition;

      metrics.forEach((metric) => {
        // Box background
        doc.fillColor(metric.color as string).rect(x, y, boxWidth, boxHeight).fill();
        doc.fillColor("white");

        // Value
        doc.fontSize(20).font("Helvetica-Bold").text(metric.value, x + 10, y + 12);

        // Label
        doc.fontSize(10).font("Helvetica").text(metric.label, x + 10, y + 40);

        // Position for next box
        if (x === 50) {
          x += boxWidth + boxGap;
        } else {
          x = 50;
          y += boxHeight + boxGap;
        }
      });

      // Add charts section (simple bar chart representation)
      y += boxHeight + 40;
      if (y > 600) {
        doc.addPage();
        y = 50;
      }

      // Billable vs Non-Billable Chart
      doc.fontSize(14).font("Helvetica-Bold").fillColor("black").text("Billable vs Non-Billable Hours", 50, y);
      y += 30;

      const chartWidth = 500;
      const chartHeight = 30;
      const totalHours = overview.billableHours + overview.nonBillableHours;
      const billableWidth = totalHours > 0 ? (overview.billableHours / totalHours) * chartWidth : 0;
      const nonBillableWidth = totalHours > 0 ? (overview.nonBillableHours / totalHours) * chartWidth : chartWidth;

      // Billable bar
      doc.fillColor("#4CAF50").rect(50, y, billableWidth, chartHeight).fill();
      // Non-billable bar
      doc.fillColor("#9E9E9E").rect(50 + billableWidth, y, nonBillableWidth, chartHeight).fill();

      // Legend
      y += chartHeight + 10;
      doc.fontSize(10).fillColor("black");
      doc.fillColor("#4CAF50").rect(50, y, 15, 15).fill();
      doc.fillColor("black").text(`Billable: ${overview.billableHours.toFixed(2)} hrs`, 70, y + 2);

      doc.fillColor("#9E9E9E").rect(200, y, 15, 15).fill();
      doc.fillColor("black").text(`Non-Billable: ${overview.nonBillableHours.toFixed(2)} hrs`, 220, y + 2);

      // Footer
      drawFooter(doc);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Helper function to draw header
function drawHeader(doc: InstanceType<typeof PDFDocument>, title: string): void {
  // Background color
  doc.fillColor("#f8f9fa").rect(0, 0, doc.page.width, 80).fill();

  // Title
  doc.fontSize(24).fillColor("#2c3e50").font("Helvetica-Bold").text(title, 50, 25);

  // Line
  doc.moveTo(50, 65).lineTo(545, 65).lineWidth(2).strokeColor("#3498db").stroke();
}

// Helper function to draw footer
function drawFooter(doc: InstanceType<typeof PDFDocument>): void {
  doc.fontSize(9).fillColor("gray");
  doc.text(
    `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
    50,
    doc.page.height - 50,
    { width: 495, align: "center" },
  );
}

// Helper function to truncate text
function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

// Helper function to format date
function formatDate(dateStr: string): string {
  if (dateStr === "No work recorded") return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
