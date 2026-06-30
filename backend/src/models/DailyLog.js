import mongoose from "mongoose";

const dailyLogSchema = new mongoose.Schema(
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

    // Health metrics
    health: {
      sleepHours: {
        type: Number,
        default: 0,
      },

      steps: {
        type: Number,
        default: 0,
      },

      heartPoints: {
        type: Number,
        default: 0,
      },

      waterLitres: {
        type: Number,
        default: 0,
      },
    },

    // Daily habits
    habits: {
      exercise: {
        type: Boolean,
        default: false,
      },

      bathed: {
        type: Boolean,
        default: false,
      },

      wokeBefore7: {
        type: Boolean,
        default: false,
      },

      abstained: {
        type: Boolean,
        default: true,
      },

      sugarFree: {
        type: Boolean,
        default: false,
      },
      trabajo: {
        type: Boolean,
        default: false,
      },
      prayed: {
        type: Boolean,
        default: false,
      },
    },


    // Learning and growth
    growth: {
      knowledge: {
        type: Boolean,
        default: false,
      },

      knowledgeNote: {
        type: String,
        default: "",
      },


      upskilling: {
        type: Boolean,
        default: false,
      },

      upskillNote: {
        type: String,
        default: "",
      },
    },


    // Discipline / entertainment tracking
    entertainment: {

      candyCrushPlayed: {
        type: Boolean,
        default: false,
      },


      avoidDoomScrolling: {
        type: Boolean,
        default: true,
      },

    },


    // Overall daily score
    score: {
      type: Number,
      default: 0,
    },

    // normalized date string for easy lookups (YYYY-MM-DD)
    day: {
      type: String,
      index: true,
    },

    // Exercises moved to separate DailyExercise model


  },

  {
    timestamps: true,
  }
);

const DailyLog = mongoose.model("DailyLog", dailyLogSchema);

export default DailyLog;