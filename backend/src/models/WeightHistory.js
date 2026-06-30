import mongoose from "mongoose";

const weightHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    weight: {
      type: Number,
      required: true,
      // kilograms
    },

    date: {
      type: Date,
      default: Date.now,
      required: true,
    },

    month: {
      type: String,
      required: true,
      // Example: "June 2026"
    },

    notes: {
      type: String,
      default: "",
    },

  },

  {
    timestamps: true,
  }
);

const WeightHistory = mongoose.model(
  "WeightHistory",
  weightHistorySchema
);

export default WeightHistory;