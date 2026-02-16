import { parseDateRange } from "./dateTimeFormat";
import { formatToUserTimezone } from "./dateTimeFormat";
import TimeEntry from "../models/timeEntry";
import Project from "../models/project";

interface DateFilter {
  fromDate: Date | null;
  toDate: Date | null;
  filterApplied: { from?: string; to?: string };
}

/**
 * Parse and validate date range from query parameters
 */
export const parseDateFilters = (
  from?: string,
  to?: string
): { success: true; data: DateFilter } | { success: false; error: string } => {
  let fromDate: Date | null = null;
  let toDate: Date | null = null;
  const filterApplied: { from?: string; to?: string } = {};

  if (from) {
    const fromParsed = parseDateRange(from);
    if (!fromParsed) {
      return {
        success: false,
        error: "Invalid 'from' date format. Use DD-MM-YYYY",
      };
    }
    fromDate = fromParsed.start;
    filterApplied.from = from;
  }

  if (to) {
    const toParsed = parseDateRange(to);
    if (!toParsed) {
      return {
        success: false,
        error: "Invalid 'to' date format. Use DD-MM-YYYY",
      };
    }
    toDate = toParsed.end;
    filterApplied.to = to;
  }

  return { success: true, data: { fromDate, toDate, filterApplied } };
};

/**
 * Build MongoDB filter for time entries based on date range
 */
export const buildTimeEntryFilter = (
  userId: string,
  fromDate: Date | null,
  toDate: Date | null
) => {
  const filter: any = { userId };

  if (fromDate || toDate) {
    filter.endTime = {};
    if (fromDate) filter.endTime.$gte = fromDate;
    if (toDate) filter.endTime.$lte = toDate;
  }

  return filter;
};

/**
 * Fetch projects that have time entries in the given date range
 */
export const fetchProjectsWithWork = async (
  userId: string,
  fromDate: Date | null,
  toDate: Date | null
) => {
  // Build time entry filter
  const timeEntryFilter = buildTimeEntryFilter(userId, fromDate, toDate);

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

  return { projects, timeEntries };
};

/**
 * Calculate project-specific metrics
 */
export const calculateProjectMetrics = (
  project: any,
  timeEntries: any[]
) => {
  const projectEntries = timeEntries.filter(
    (entry) => entry.projectId.toString() === project._id.toString()
  );

  // Calculate total hours from duration (duration in minutes)
  const totalDurationMinutes = projectEntries.reduce(
    (sum, entry) => sum + entry.duration,
    0
  );
  const totalWorkingHours = Math.round((totalDurationMinutes / 60) * 100) / 100;

  // Calculate total earnings (only for billable projects)
  const totalEarnings =
    project.isBillable && project.hourlyRate
      ? Math.round(totalWorkingHours * project.hourlyRate * 100) / 100
      : 0;

  const projectCreatedOn = formatToUserTimezone(project.createdAt);

  // Find earliest startTime and latest endTime
  let projectStartedOn = "No work recorded";
  let projectLastWorkOn = "No work recorded";

  if (projectEntries.length > 0) {
    const startTimes = projectEntries.map((e) => e.startTime.getTime());
    const endTimes = projectEntries.map((e) => e.endTime.getTime());

    projectStartedOn = formatToUserTimezone(new Date(Math.min(...startTimes)));
    projectLastWorkOn = formatToUserTimezone(new Date(Math.max(...endTimes)));
  }

  return {
    projectId: project._id.toString(),
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
};

/**
 * Calculate overview metrics from projects and time entries
 */
export const calculateOverviewMetrics = (
  projects: any[],
  timeEntries: any[]
) => {
  let totalWorkingHours = 0;
  let billableHours = 0;
  let billableEarnings = 0;
  let billableProjectsCount = 0;
  let nonBillableProjectsCount = 0;

  projects.forEach((project) => {
    const projectEntries = timeEntries.filter(
      (entry) => entry.projectId.toString() === project._id.toString()
    );

    if (projectEntries.length > 0) {
      const totalDurationMinutes = projectEntries.reduce(
        (sum, entry) => sum + entry.duration,
        0
      );
      const projectHours = Math.round((totalDurationMinutes / 60) * 100) / 100;

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

  return {
    totalProjects: projects.length,
    totalWorkingHours,
    billableProjects: billableProjectsCount,
    billableHours,
    billableEarnings,
    nonBillableProjects: nonBillableProjectsCount,
    nonBillableHours: Math.round((totalWorkingHours - billableHours) * 100) / 100,
  };
};