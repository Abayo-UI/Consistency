import mongoose from "mongoose";

const learningSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["knowledge", "upskilling"],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    date: {
      type: Date,
      default: Date.now,
      required: true,
    },

    // optional metadata
    notes: {
      type: String,
      default: "",
    },

    durationMinutes: {
      type: Number,
      default: 0,
    },

    resources: [String],
    tags: [String],

    source: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Learning = mongoose.model("Learning", learningSchema);

export default Learning;
