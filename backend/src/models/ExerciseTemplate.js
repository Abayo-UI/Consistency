import mongoose from "mongoose";

const exerciseTemplateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    items: [
      {
        name: { type: String, required: true },
        sets: { type: Number, default: 3 },
        reps: { type: Number, default: 10 },
        defaultChecked: { type: Boolean, default: false },
        order: { type: Number, default: 0 },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const ExerciseTemplate = mongoose.model("ExerciseTemplate", exerciseTemplateSchema);
export default ExerciseTemplate;
