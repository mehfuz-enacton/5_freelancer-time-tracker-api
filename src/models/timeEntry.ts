import mongoose, { Document, Schema, Types, CallbackWithoutResultAndOptionalError  } from "mongoose";

export interface ITimeEntry extends Document {
  userId: Types.ObjectId;
  projectId: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  duration: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const timeEntrySchema = new Schema<ITimeEntry>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
    },
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: Date,
      required: [true, "End time is required"],
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [0, "Duration cannot be negative"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
  },
  { timestamps: true }
);

// Pre-save hook to validate endTime and calculate duration
timeEntrySchema.pre("validate", async function (){
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  // Validate endTime is after startTime
  if (this.endTime && this.startTime && this.endTime <= this.startTime) {
    this.invalidate("endTime", "End time must be after start time");
  }

  // Validate endTime is within 5 minutes of current time
  if (this.endTime && this.endTime > fiveMinutesFromNow) {
    this.invalidate("endTime", "End time cannot be more than 5 minutes in the future");
  }
});

// Index for efficient queries
timeEntrySchema.index({ userId: 1, startTime: -1 });
timeEntrySchema.index({ projectId: 1, startTime: -1 });

export default mongoose.model<ITimeEntry>("TimeEntry", timeEntrySchema);
