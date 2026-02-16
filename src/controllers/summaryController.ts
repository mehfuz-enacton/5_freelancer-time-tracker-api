import { Request, Response } from "express";
import Project from "../models/project";
import TimeEntry from "../models/timeEntry";
import { formatToUserTimezone } from "../utils/dateTimeFormat";
import { parseDateRange } from "../utils/dateTimeFormat";

// Get projects summary with optional date filtering
export const getProjectsSummary = async (req: Request, res: Response) => {
  try {
    const userId = req.user;
    if (!userId) return res.status(401).json({ msg: "Unauthorized" });

    const { from, to } = req.query;

    // Parse date filters
    let fromDate: Date | null = null;
    let toDate: Date | null = null;
    const filterApplied: { from?: string; to?: string } = {};

    if (from) {
      const fromParsed = parseDateRange(from as string);
      if (!fromParsed)
        return res
          .status(400)
          .json({ msg: "Invalid 'from' date format. Use DD-MM-YYYY" });
      fromDate = fromParsed.start;
      filterApplied.from = from as string;
    }

    if (to) {
      const toParsed = parseDateRange(to as string);
      if (!toParsed)
        return res
          .status(400)
          .json({ msg: "Invalid 'to' date format. Use DD-MM-YYYY" });
      toDate = toParsed.end;
      filterApplied.to = to as string;
    }

    // Build time entry filter
    const timeEntryFilter: any = { userId };
    if (fromDate || toDate) {
      timeEntryFilter.endTime = {};
      if (fromDate) timeEntryFilter.endTime.$gte = fromDate;
      if (toDate) timeEntryFilter.endTime.$lte = toDate;
    }

    // Get time entries within date range
    const timeEntries = await TimeEntry.find(timeEntryFilter);

    // Get unique project IDs that have work in this range
    const projectIdsWithWork = [
      ...new Set(timeEntries.map((entry) => entry.projectId.toString())),
    ];

    // Get only projects that have work in the date range
    const projects = await Project.find({
      _id: { $in: projectIdsWithWork },
      userId,
      isActive: true,
    });
    if (projects.length < 1) {
      return res.status(200).json({
        success: true,
        filterApplied:
          Object.keys(filterApplied).length > 0 ? filterApplied : null,
        msg: "No projects with activity in the selected date range",
        data: [],
      });
    }

    // Aggregate data by project
    const projectsData = projects.map((project) => {
      const projectEntries = timeEntries.filter(
        (entry) => entry.projectId.toString() === project._id.toString(),
      );

      // Calculate total hours from duration (duration in minutes)
      const totalDurationMinutes = projectEntries.reduce(
        (sum, entry) => sum + entry.duration,
        0,
      );
      const totalWorkingHours =
        Math.round((totalDurationMinutes / 60) * 100) / 100; // 2 decimal places

      // Calculate total earnings (only for billable projects)
      const totalEarnings =
        project.isBillable && project.hourlyRate
          ? Math.round(totalWorkingHours * project.hourlyRate * 100) / 100
          : 0;

      const projectCreatedOn = formatToUserTimezone(project.createdAt);

      // Find earliest startTime and latest endTime
      let projectStartedOn = "";
      let projectLastWorkOn = "";

      if (projectEntries.length > 0) {
        const sortedEntries = projectEntries.sort(
          (a, b) => a.startTime.getTime() - b.startTime.getTime(),
        );

        const firstEntry = sortedEntries[0];
        const lastEntry = sortedEntries[sortedEntries.length - 1];

        if (firstEntry && lastEntry) {
          projectStartedOn = formatToUserTimezone(firstEntry.startTime);
          projectLastWorkOn = formatToUserTimezone(lastEntry.endTime);
        }
      } else {
        // If no time entries in range, show project creation date
        projectStartedOn = "No work recorded";
        projectLastWorkOn = "No work recorded";
      }

      return {
        projectId: project._id,
        name: project.name,
        description: project.description,
        isBillable: project.isBillable,
        hourlyRate: project.hourlyRate || null,
        projectCreatedOn,
        projectStartedOn,
        projectLastWorkOn,
        totalWorkingHours,
        totalEarnings,
      };
    });

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
    let fromDate: Date | null = null;
    let toDate: Date | null = null;
    const filterApplied: { from?: string; to?: string } = {};

    if (from) {
      const fromParsed = parseDateRange(from as string);
      if (!fromParsed)
        return res
          .status(400)
          .json({ msg: "Invalid 'from' date format. Use DD-MM-YYYY" });
      fromDate = fromParsed.start;
      filterApplied.from = from as string;
    }

    if (to) {
      const toParsed = parseDateRange(to as string);
      if (!toParsed)
        return res
          .status(400)
          .json({ msg: "Invalid 'to' date format. Use DD-MM-YYYY" });
      toDate = toParsed.end;
      filterApplied.to = to as string;
    }

    // Build time entry filter
    const timeEntryFilter: any = { userId };
    if (fromDate || toDate) {
      timeEntryFilter.endTime = {};
      if (fromDate) timeEntryFilter.endTime.$gte = fromDate;
      if (toDate) timeEntryFilter.endTime.$lte = toDate;
    }

    // Get time entries within date range
    const timeEntries = await TimeEntry.find(timeEntryFilter);

    const projectIdsWithWork = [
      ...new Set(timeEntries.map((entry) => entry.projectId.toString())),
    ];

    const projects = await Project.find({
      _id: { $in: projectIdsWithWork },
      userId,
      isActive: true,
    });

    // Calculate overview metrics
    let totalWorkingHours = 0;
    let billableHours = 0;
    let billableEarnings = 0;
    let billableProjectsCount = 0;
    let nonBillableProjectsCount = 0;

    projects.forEach((project) => {
      const projectEntries = timeEntries.filter(
        (entry) => entry.projectId.toString() === project._id.toString(),
      );

      if (projectEntries.length > 0) {
        const totalDurationMinutes = projectEntries.reduce(
          (sum, entry) => sum + entry.duration,
          0,
        );
        const projectHours =
          Math.round((totalDurationMinutes / 60) * 100) / 100;

        totalWorkingHours += projectHours;

        if (project.isBillable && project.hourlyRate) {
          billableHours += projectHours;
          billableEarnings +=
            Math.round(projectHours * project.hourlyRate * 100) / 100;
          billableProjectsCount += 1;
        } else {
          nonBillableProjectsCount += 1;
        }
      }
    });

    // Round totals to 2 decimal places
    totalWorkingHours = Math.round(totalWorkingHours * 100) / 100;
    billableHours = Math.round(billableHours * 100) / 100;
    billableEarnings = Math.round(billableEarnings * 100) / 100;

    const overview = {
      totalProjects: projects.length,
      totalWorkingHours,
      billableProjects: billableProjectsCount,
      billableHours,
      billableEarnings,
      nonBillableProjects: nonBillableProjectsCount,
      nonBillableHours:
        Math.round((totalWorkingHours - billableHours) * 100) / 100,
    };

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
