import mongoose from "mongoose";

const googleFitDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: {
      type: Date,
      default: Date.now,
      required: true,
    },

    steps: {
      type: Number,
      default: 0,
    },

    heartPoints: {
      type: Number,
      default: 0,
    },

    sleepHours: {
      type: Number,
      default: 0,
    },

    source: {
      type: String,
      default: "google-fit",
    },

    raw: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const GoogleFitData = mongoose.model("GoogleFitData", googleFitDataSchema);

export default GoogleFitData;
