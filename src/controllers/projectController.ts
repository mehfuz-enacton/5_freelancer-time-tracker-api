import { Request, Response } from "express";
import PROJECT, { IProject } from "../models/project";
import TimeEntry, {ITimeEntry} from "../models/timeEntry";
import { Types } from "mongoose";
import { UpdateQuery } from 'mongoose';

export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const userId = req.user;
    if (!userId) return res.status(401).json({ msg: "Unauthorized" });

    const projects = await PROJECT.find({ userId, isActive: true });
    if(projects.length < 1) return res.status(404).json({ msg: "No projects available." });
    return res.status(200).json({ msg: "Projects fetched successfully", data: projects });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ msg: "Server error", error: message });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ msg: "Invalid project id" });

    const userId = req.user;
    if (!userId) return res.status(401).json({ msg: "Unauthorized" });

    const project = await PROJECT.findOne({ _id: id, userId, isActive: true });
    if (!project) return res.status(404).json({ msg: "No projects available." });

    return res.status(200).json({ msg: "Project fetched successfully", data: project });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ msg: "Server error", error: message });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const userId = req.user;
    if (!userId) return res.status(401).json({ msg: "Unauthorized" });
    
    const { name, description, isBillable, hourlyRate } = req.body;

    const project = await PROJECT.create({
      name,
      description,
      isBillable:isBillable ?? false,
      hourlyRate: isBillable === true ? hourlyRate : undefined,
      userId,
    });

    return res.status(201).json({ msg: "Project created successfully", data: project });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ msg: "Server error", error: message });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid project id" });
    }

    const userId = req.user;
    if (!userId) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    const project = await PROJECT.findOne({ _id: id, userId, isActive: true });
    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }

    const { isBillable, hourlyRate, ...otherUpdates } = req.body;

    const finalIsBillable = isBillable !== undefined ? isBillable : project.isBillable;

    if (isBillable === true) {
      const finalHourlyRate = hourlyRate !== undefined ? hourlyRate : project.hourlyRate;
      if (typeof finalHourlyRate !== "number") {
        return res.status(400).json({ 
          msg: "Hourly rate is required when setting project as billable" 
        });
      }
    }

    if (isBillable === false && hourlyRate !== undefined) {
      return res.status(400).json({ 
        msg: "Cannot set hourly rate when project is not billable" 
      });
    }

    if (hourlyRate !== undefined && finalIsBillable === false) {
      return res.status(400).json({ 
        msg: "Cannot set hourly rate on a non-billable project. Set isBillable to true first." 
      });
    }

    const updateOp: UpdateQuery<IProject> = { $set: { ...otherUpdates } };

    if (isBillable !== undefined) {
      updateOp.$set.isBillable = isBillable;
      
      if (isBillable === true && hourlyRate !== undefined) {
        updateOp.$set.hourlyRate = hourlyRate;
      } else if (isBillable === false) {
        updateOp.$unset = { hourlyRate: 1 };
      }
    } else if (hourlyRate !== undefined) {
      updateOp.$set.hourlyRate = hourlyRate;
    }

    const updatedProject = await PROJECT.findByIdAndUpdate(
      id,
      updateOp,
      { new: true, runValidators: true }
    );

    return res.status(200).json({ 
      msg: "Project updated successfully", 
      data: updatedProject 
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ msg: "Server error", error: message });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ msg: "Invalid project id" });

    const userId = req.user;
    if (!userId) return res.status(401).json({ msg: "Unauthorized" });

    const project = await PROJECT.findOne({ _id: id, userId, isActive: true });
    if (!project) return res.status(404).json({ msg: "Project not found" });

    project.isActive = false;
    await project.save();

    await TimeEntry.deleteMany({projectId: id});

    return res.status(200).json({ msg: "Project and it's time entries deleted successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ msg: "Server error", error: message });
  }
};
