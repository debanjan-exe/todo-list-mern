// MODEL layer: the Mongoose schema = the shape and rules of one task document in MongoDB.
import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    // Owner of the task. Each user sees only their own tasks.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, default: '', trim: true },

    // Date + start time of the task, stored as one Date value (mandatory)
    dateTime: { type: Date, required: [true, 'Date & time is required'] },

    // Optional end time, stored as "HH:mm" text (from the "Ends" field in Figma)
    endTime: { type: String, default: '' },

    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },

    // A task is either still open ("In Progress") or done ("Completed")
    status: { type: String, enum: ['In Progress', 'Completed'], default: 'In Progress' },

    // Soft delete: a deleted task is only marked, never removed from the database.
    // All queries skip tasks with isDeleted = true.
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

export default mongoose.model('Task', taskSchema);
