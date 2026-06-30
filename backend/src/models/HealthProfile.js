import mongoose from "mongoose";

const healthProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Basic body information
    height: {
      type: Number,
      default: 0,
      // centimeters
    },

    currentWeight: {
      type: Number,
      default: 0,
      // kilograms
    },

    dateOfBirth: {
      type: Date,
    },

    bloodGroup: {
      type: String,
      default: "",
    },

    // Health details
    restingHeartRate: {
      type: Number,
      default: 0,
    },

    bmi: {
      type: Number,
      default: 0,
    },

    // Optional personal health notes
    notes: {
      type: String,
      default: "",
    },

  },

  {
    timestamps: true,
  }
);

const HealthProfile = mongoose.model(
  "HealthProfile",
  healthProfileSchema
);

export default HealthProfile;