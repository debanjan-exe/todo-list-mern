// MODEL layer: one user account.
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email is not valid'],
    },
    // Only the bcrypt HASH is stored, never the real password.
    // select: false = not returned by queries unless asked for.
    password: { type: String, required: true, select: false },

    // true = the demo account made by the server on start (see authService.ensureTestUser)
    isTestUser: { type: Boolean, default: false },

    // Soft delete: a deleted account is only marked, never removed from the database
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One ACTIVE account per email. Deleted accounts are not counted,
// so the same email can sign up again after an account is deleted.
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

// Only ONE test user can exist in a database:
// a unique index that only counts documents where isTestUser is true.
userSchema.index({ isTestUser: 1 }, { unique: true, partialFilterExpression: { isTestUser: true } });

export default mongoose.model('User', userSchema);
