import { Request, Response } from "express";
import TimeEntry, { ITimeEntry } from "../models/timeEntry";
import PROJECT from "../models/project";
import { Types } from "mongoose";
import { parseUserDateTime, formatToUserTimezone } from "../utils/dateTimeFormat";

// Helper function to calculate overlap in minutes between two time ranges
function calculateOverlapInMinutes(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): number {
  const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
  const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));

  if (overlapStart >= overlapEnd) {
    return 0; // No overlap
  }

  return Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / 1000 / 60);
}

// Helper function to check for overlapping time entries
async function checkForOverlappingEntries(
  userId: Types.ObjectId,
  startTime: Date,
  endTime: Date,
  excludeEntryId?: string
): Promise<boolean> {
  const query = { userId };

  const existingEntries = await TimeEntry.find(query);

  for (const entry of existingEntries) {
    // Skip the entry being updated
    if (excludeEntryId && entry._id.toString() === excludeEntryId) {
      continue;
    }

    // Check if this entry overlaps with the new/updated entry
    const overlapMinutes = calculateOverlapInMinutes(
      startTime,
      endTime,
      entry.startTime,
      entry.endTime
    );

    // Allow max 2 minutes of overlap
    if (overlapMinutes > 2) {
      return true; // Overlap detected
    }
  }

  return false; // No overlap
}

export const createTimeEntry = async (req: Request, res: Response) => {
  try {
    const userId = req.user;
    if (!userId) return res.status(401).json({ msg: "Unauthorized" });

    const { projectId, startTime, endTime, description } = req.body;

    // Check if project exists and belongs to user
    const project = await PROJECT.findOne({ _id: projectId, userId, isActive: true });
    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }

    // Parse user's datetime format (IST) and convert to UTC
    const startDate = parseUserDateTime(startTime);
    const endDate = parseUserDateTime(endTime);

    if (!startDate || !endDate) {
      return res.status(400).json({ msg: "Invalid date format" });
    }

    // Check for overlapping entries
    const hasOverlap = await checkForOverlappingEntries(userId, startDate, endDate);
    if (hasOverlap) {
      return res.status(400).json({
        msg: "Time entry overlaps with existing entry. Maximum 2 minutes overlap allowed.",
      });
    }

    // Calculate duration (always calculated, user doesn't provide it)
    const duration = Math.floor((endDate.getTime() - startDate.getTime()) / 1000 / 60);

    const timeEntry = await TimeEntry.create({
      projectId,
      userId,
      startTime: startDate,
      endTime: endDate,
      duration,
      description,
    });

    // Format dates to user's timezone for response
    const responseData = {
      ...timeEntry.toObject(),
      startTime: formatToUserTimezone(timeEntry.startTime),
      endTime: formatToUserTimezone(timeEntry.endTime),
      createdAt: timeEntry.createdAt,
      updatedAt: timeEntry.updatedAt,
    };

    return res.status(201).json({ msg: "Time entry created successfully", data: responseData });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ msg: "Server error", error: message });
  }
};

export const updateTimeEntry = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid time entry id" });
    }

    const userId = req.user;
    if (!userId) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    const existingEntry = await TimeEntry.findOne({ _id: id, userId });
    if (!existingEntry) {
      return res.status(404).json({ msg: "Time entry not found" });
    }

    const { startTime, endTime, description } = req.body;

    // Parse user's datetime format (IST) and convert to UTC, or use existing values
    const startDate = startTime ? parseUserDateTime(startTime) : existingEntry.startTime;
    const endDate = endTime ? parseUserDateTime(endTime) : existingEntry.endTime;

    if (!startDate) {
      return res.status(400).json({ msg: "Invalid start time format" });
    }
    if (!endDate) {
      return res.status(400).json({ msg: "Invalid end time format" });
    }

    if (endDate <= startDate) {
      return res.status(400).json({ msg: "End time must be after start time" });
    }

    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    if (endDate > fiveMinutesFromNow) {
      return res.status(400).json({
        msg: "End time cannot be more than 5 minutes in the future",
      });
    }

    // Check for overlapping entries (excluding the current entry)
    const hasOverlap = await checkForOverlappingEntries(userId, startDate, endDate, id);
    if (hasOverlap) {
      return res.status(400).json({
        msg: "Time entry overlaps with existing entry. Maximum 2 minutes overlap allowed.",
      });
    }

    // Calculate duration
    const duration = Math.floor((endDate.getTime() - startDate.getTime()) / 1000 / 60);

    const updateData = {
      startTime: startDate,
      endTime: endDate,
      duration,
      description: description !== undefined ? description : existingEntry.description,
    };

    const updatedEntry = await TimeEntry.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Format dates to user's timezone for response
    const responseData = {
      ...updatedEntry!.toObject(),
      startTime: formatToUserTimezone(updatedEntry!.startTime),
      endTime: formatToUserTimezone(updatedEntry!.endTime),
      createdAt: updatedEntry!.createdAt,
      updatedAt: updatedEntry!.updatedAt,
    };

    return res.status(200).json({ msg: "Time entry updated successfully", data: responseData });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ msg: "Server error", error: message });
  }
};

export const deleteTimeEntry = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid time entry id" });
    }

    const userId = req.user;
    if (!userId) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    const timeEntry = await TimeEntry.findOne({ _id: id, userId });
    if (!timeEntry) {
      return res.status(404).json({ msg: "Time entry not found" });
    }

    await TimeEntry.findByIdAndDelete(id);

    return res.status(200).json({ msg: "Time entry deleted successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ msg: "Server error", error: message });
  }
};

export const getTimeEntriesByProject = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string;
    if (!Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ msg: "Invalid project id" });
    }

    const userId = req.user;
    if (!userId) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    // Verify project belongs to user
    const project = await PROJECT.findOne({ _id: projectId, userId, isActive: true });
    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }

    const timeEntries = await TimeEntry.find({ projectId, userId })
      .sort({ startTime: -1 });

    // Format dates to user's timezone for response
    const formattedEntries = timeEntries.map((entry) => ({
      ...entry.toObject(),
      startTime: formatToUserTimezone(entry.startTime),
      endTime: formatToUserTimezone(entry.endTime),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));

    return res.status(200).json({
      msg: "Time entries fetched successfully",
      data: formattedEntries,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ msg: "Server error", error: message });
  }
};

export const getTimeEntryById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid time entry id" });
    }

    const userId = req.user;
    if (!userId) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    const timeEntry = await TimeEntry.findOne({ _id: id, userId });
    if (!timeEntry) {
      return res.status(404).json({ msg: "Time entry not found" });
    }

    // Format dates to user's timezone for response
    const responseData = {
      ...timeEntry.toObject(),
      startTime: formatToUserTimezone(timeEntry.startTime),
      endTime: formatToUserTimezone(timeEntry.endTime),
      createdAt: timeEntry.createdAt,
      updatedAt: timeEntry.updatedAt,
    };

    return res.status(200).json({ msg: "Time entry fetched successfully", data: responseData });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ msg: "Server error", error: message });
  }
};
