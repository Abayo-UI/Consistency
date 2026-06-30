import mongoose from "mongoose";

const exerciseItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  checked: { type: Boolean, default: false },
  reps: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  templateItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExerciseTemplate', required: false },
});

const dailyExerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now, required: true },
  day: { type: String, index: true }, // YYYY-MM-DD
  items: [exerciseItemSchema],
}, { timestamps: true });

const DailyExercise = mongoose.model('DailyExercise', dailyExerciseSchema);
export default DailyExercise;
