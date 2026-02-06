import { Request, Response } from "express";
import PROJECT from "../models/project";
import { Types } from "mongoose";

export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ msg: "Unauthorized" });

    const projects = await PROJECT.find({ userId, isActive: true });
    return res.status(200).json({ msg: "Projects fetched successfully", data: projects });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ msg: "Server error", error: message });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ msg: "Invalid project id" });

    const project = await PROJECT.findOne({ _id: id, userId: req.user?._id });
    if (!project || !project.isActive) return res.status(404).json({ msg: "Project not found" });

    return res.status(200).json({ msg: "Project fetched successfully", data: project });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ msg: "Server error", error: message });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { name, description, isBillable, hourlyRate, isActive } = req.body;

    const project = await PROJECT.create({
      name,
      description,
      isBillable,
      hourlyRate,
      userId,
      isActive,
    });

    return res.status(201).json({ msg: "Project created successfully", data: project });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ msg: "Server error", error: message });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ msg: "Invalid project id" });

    const project = await PROJECT.findOne({ _id: id, userId: req.user?._id });
    if (!project || !project.isActive) return res.status(404).json({ msg: "Project not found" });

    const updates = req.body;

    // If user sets isBillable true in update body, ensure hourlyRate exists in payload
    if (updates.isBillable === true && typeof updates.hourlyRate !== "number") {
      return res.status(400).json({ msg: "Hourly rate is required when project is billable" });
    }

    Object.assign(project, updates);
    await project.save();

    return res.status(200).json({ msg: "Project updated successfully", data: project });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ msg: "Server error", error: message });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ msg: "Invalid project id" });

    const project = await PROJECT.findOne({ _id: id, userId: req.user?._id });
    if (!project || !project.isActive) return res.status(404).json({ msg: "Project not found" });

    project.isActive = false;
    await project.save();

    return res.status(200).json({ msg: "Project deleted (soft) successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ msg: "Server error", error: message });
  }
};
