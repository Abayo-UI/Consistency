import mongoose from "mongoose";

const streakSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    abstinence: {
      current: {
        type: Number,
        default: 0,
      },

      longest: {
        type: Number,
        default: 0,
      },

      lastUpdated: {
        type: Date,
      },
    },

    sugarFree: {
      current: {
        type: Number,
        default: 0,
      },

      longest: {
        type: Number,
        default: 0,
      },

      lastUpdated: {
        type: Date,
      },
    },


    exercise: {
      current: {
        type: Number,
        default: 0,
      },

      longest: {
        type: Number,
        default: 0,
      },

      lastUpdated: {
        type: Date,
      },
    },

    earlyWake: {
      current: {
        type: Number,
        default: 0,
      },

      longest: {
        type: Number,
        default: 0,
      },

      lastUpdated: {
        type: Date,
      },
    },

    waterGoal: {
      current: {
        type: Number,
        default: 0,
      },

      longest: {
        type: Number,
        default: 0,
      },

      lastUpdated: {
        type: Date,
      },
    },

    avoidDoomScrolling: {
      current: {
        type: Number,
        default: 0,
      },

      longest: {
        type: Number,
        default: 0,
      },

      lastUpdated: {
        type: Date,
      },
    },

    trabajo: {
      current: {
        type: Number,
        default: 0,
      },

      longest: {
        type: Number,
        default: 0,
      },

      lastUpdated: {
        type: Date,
      },
    },

    prayed: {
      current: {
        type: Number,
        default: 0,
      },

      longest: {
        type: Number,
        default: 0,
      },

      lastUpdated: {
        type: Date,
      },
    },

    knowledge: {
      current: {
        type: Number,
        default: 0,
      },

      longest: {
        type: Number,
        default: 0,
      },

      lastUpdated: {
        type: Date,
      },
    },

    upskilling: {
      current: {
        type: Number,
        default: 0,
      },

      longest: {
        type: Number,
        default: 0,
      },

      lastUpdated: {
        type: Date,
      },
    },

  },

  {
    timestamps: true,
  }
);

const Streak = mongoose.model(
  "Streak",
  streakSchema
);

export default Streak;