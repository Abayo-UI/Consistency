import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import path from "path";
import connectDb from "./config/db.js";
import userRoutes from "../src/routes/userRoutes.js";
import dailyLogRoutes from "../src/routes/dailyLogRoutes.js";
import healthProfileRoutes from "../src/routes/healthProfileRoutes.js";
import weightHistoryRoutes from "../src/routes/weightHistoryRoutes.js";
import streakRoutes from "../src/routes/streakRoutes.js";
import auditLogRoutes from "../src/routes/auditLogRoutes.js";
import learningRoutes from "../src/routes/learningRoutes.js";
import achievementRoutes from "../src/routes/achievementRoutes.js";
import googleFitRoutes from "../src/routes/googleFitRoutes.js";
import exerciseTemplateRoutes from "../src/routes/exerciseTemplateRoutes.js";
import exerciseRoutes from "../src/routes/exerciseRoutes.js";
import ExerciseTemplate from "./models/ExerciseTemplate.js";
import User from "./models/User.js";
import { fileURLToPath } from "url";
import fs from 'fs'

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const app = express()
const port = process.env.PORT || 3000

// Setup __dirname and __filename for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS setup
const allowedOrigins = [
  "http://localhost:5173", // Development frontend
  "http://localhost:5174",
  "", // Production frontend
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

//Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//public unprotected routes
app.use("/user", userRoutes);
// daily logs (protected)
app.use("/daily-logs", dailyLogRoutes);
app.use("/health-profiles", healthProfileRoutes);
app.use("/weight-history", weightHistoryRoutes);
app.use("/streaks", streakRoutes);
app.use("/audit-logs", auditLogRoutes);
app.use("/learnings", learningRoutes);
app.use("/achievements", achievementRoutes);
app.use("/google-fit", googleFitRoutes);
app.use("/exercise-template", exerciseTemplateRoutes);
app.use("/exercises", exerciseRoutes);


// Serve static files and handle SPA fallback (PRODUCTION ONLY)
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
  const indexPath = path.join(staticPath, 'index.html');
  if (fs.existsSync(staticPath) && fs.existsSync(indexPath)) {
    console.log('Serving static files from:', staticPath);
    app.use(express.static(staticPath));

    // SPA fallback: serve index.html for any GET request that accepts HTML
    app.use((req, res, next) => {
      if (req.method !== 'GET') return next();
      if (req.accepts && req.accepts('html')) {
        res.sendFile(indexPath, (err) => {
          if (err) {
            console.error('Error sending index.html via sendFile, falling back to read:', err);
            try {
              const content = fs.readFileSync(indexPath, 'utf8');
              res.type('html').send(content);
            } catch (readErr) {
              console.error('Fallback read/send failed:', readErr);
              res.status(500).send('Something went wrong serving the SPA.');
            }
          }
        });
      } else {
        next();
      }
    });
  } else {
    console.warn('Production build not found. Skipping static file serving. Expected at:', staticPath);
  }
}

connectDb().then( () => {
    app.listen(port, async () => {
    console.log(`Server running on port ${port} `);
    try {
      console.log('server.js file')
      // Ensure default exercise template exists for the first user (if any)
      try {
        const firstUser = await User.findOne();
        if (firstUser) {
          const tpl = await ExerciseTemplate.findOne({ userId: firstUser._id });
          if (!tpl) {
            const defaultItems = [
              'rope skipping',
              'wall angles',
              'squats',
              'chin tucks',
              'thoracic extensions',
              'glutes bridge',
              'posterior reset drill',
              'butterfly kegels',
            ].map((name, idx) => ({ name, defaultChecked: false, order: idx }));
            await ExerciseTemplate.create({ userId: firstUser._id, items: defaultItems });
            console.log('Default exercise template created for first user');
          }
        }
      } catch (templateErr) {
        console.warn('Could not create default exercise template:', templateErr);
      }
    } catch (err) {
      console.warn('error from server.js file:', err)
    }
})
})
