import { Request, Response } from "express";
import {
  parseDateFilters,
  fetchProjectsWithWork,
  calculateProjectMetrics,
  calculateOverviewMetrics,
} from "../utils/summaryHelpers";
import {
  generateProjectsSummaryPDF,
  generateOverviewSummaryPDF,
} from "../utils/pdfGenerator";

// Get projects summary with optional date filtering
export const getProjectsSummary = async (req: Request, res: Response) => {
  try {
    const userId = req.user;
    if (!userId) return res.status(401).json({ msg: "Unauthorized" });

    const { from, to } = req.query;

    // Parse date filters
    const dateFilterResult = parseDateFilters(
      from as string | undefined,
      to as string | undefined
    );
    if (!dateFilterResult.success) {
      return res.status(400).json({ msg: dateFilterResult.error });
    }

    const { fromDate, toDate, filterApplied } = dateFilterResult.data;

    // Fetch projects with work in date range
    const { projects, timeEntries } = await fetchProjectsWithWork(
      userId.toString(),
      fromDate,
      toDate
    );

    if (projects.length < 1) {
      return res.status(200).json({
        success: true,
        filterApplied:
          Object.keys(filterApplied).length > 0 ? filterApplied : null,
        msg: "No projects with activity in the selected date range",
        data: [],
      });
    }

    // Calculate metrics for each project
    const projectsData = projects.map((project) =>
      calculateProjectMetrics(project, timeEntries)
    );

    return res.status(200).json({
      success: true,
      filterApplied:
        Object.keys(filterApplied).length > 0 ? filterApplied : null,
      data: projectsData,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ msg: "Server error", error: message });
  }
};

// Get summary overview with optional date filtering
export const getSummaryOverview = async (req: Request, res: Response) => {
  try {
    const userId = req.user;
    if (!userId) return res.status(401).json({ msg: "Unauthorized" });

    const { from, to } = req.query;

    // Parse date filters
    const dateFilterResult = parseDateFilters(
      from as string | undefined,
      to as string | undefined
    );
    if (!dateFilterResult.success) {
      return res.status(400).json({ msg: dateFilterResult.error });
    }

    const { fromDate, toDate, filterApplied } = dateFilterResult.data;

    // Fetch projects with work in date range
    const { projects, timeEntries } = await fetchProjectsWithWork(
      userId.toString(),
      fromDate,
      toDate
    );

    // Calculate overview metrics
    const overview = calculateOverviewMetrics(projects, timeEntries);

    return res.status(200).json({
      success: true,
      filterApplied:
        Object.keys(filterApplied).length > 0 ? filterApplied : null,
      data: overview,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ msg: "Server error", error: message });
  }
};

// Export projects summary as PDF
export const exportProjectsSummaryPDF = async (req: Request, res: Response) => {
  try {
    const userId = req.user;
    if (!userId) return res.status(401).json({ msg: "Unauthorized" });

    const { from, to } = req.query;

    // Parse date filters
    const dateFilterResult = parseDateFilters(
      from as string | undefined,
      to as string | undefined
    );
    if (!dateFilterResult.success) {
      return res.status(400).json({ msg: dateFilterResult.error });
    }

    const { fromDate, toDate, filterApplied } = dateFilterResult.data;

    // Fetch projects with work in date range
    const { projects, timeEntries } = await fetchProjectsWithWork(
      userId.toString(),
      fromDate,
      toDate
    );

    // Calculate metrics for each project
    const projectsData = projects.map((project) =>
      calculateProjectMetrics(project, timeEntries)
    );

    // Generate PDF
    const pdfBuffer = await generateProjectsSummaryPDF(
      projectsData,
      Object.keys(filterApplied).length > 0 ? filterApplied : null
    );

    // Set headers for PDF download
    const filename = `projects-summary-${from || "all"}-${to || "all"}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ msg: "Server error", error: message });
  }
};

// Export overview summary as PDF
export const exportOverviewSummaryPDF = async (req: Request, res: Response) => {
  try {
    const userId = req.user;
    if (!userId) return res.status(401).json({ msg: "Unauthorized" });

    const { from, to } = req.query;

    // Parse date filters
    const dateFilterResult = parseDateFilters(
      from as string | undefined,
      to as string | undefined
    );
    if (!dateFilterResult.success) {
      return res.status(400).json({ msg: dateFilterResult.error });
    }

    const { fromDate, toDate, filterApplied } = dateFilterResult.data;

    // Fetch projects with work in date range
    const { projects, timeEntries } = await fetchProjectsWithWork(
      userId.toString(),
      fromDate,
      toDate
    );

    // Calculate overview metrics
    const overview = calculateOverviewMetrics(projects, timeEntries);

    // Generate PDF
    const pdfBuffer = await generateOverviewSummaryPDF(
      overview,
      Object.keys(filterApplied).length > 0 ? filterApplied : null
    );

    // Set headers for PDF download
    const filename = `overview-summary-${from || "all"}-${to || "all"}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ msg: "Server error", error: message });
  }
};