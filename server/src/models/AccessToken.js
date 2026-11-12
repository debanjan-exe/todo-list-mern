// MODEL layer: a personal access token (PAT), used by MCP clients such as Claude.
// The real token is shown to the user ONCE. Only its SHA-256 hash is stored,
// so a database leak does not leak usable tokens.
import mongoose from 'mongoose';

const accessTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 40 },
    tokenHash: { type: String, required: true, unique: true }, // sha256 of the token
    prefix: { type: String, required: true }, // first characters, to recognise the token in the list
    lastUsedAt: { type: Date, default: null },
    // Set when the token was made by "Connect" (OAuth). Hash of the client id: one token per app.
    oauthClient: { type: String, default: null },

    // Soft delete: a revoked token is only marked, never removed
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('AccessToken', accessTokenSchema);
