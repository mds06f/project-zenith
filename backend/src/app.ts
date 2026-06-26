import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import healthRoute from "./routes/health.route";
import weatherRoute from "./routes/weather.route";
import observationRoute from "./routes/observation.route";
import astronomyRoutes from "./routes/astronomy.routes";
import lightPollutionRoute from "./routes/lightpollution.routes";
import satelliteRoute from "./routes/satellite.routes";
import tleRoute from "./routes/tle.routes";
import celestialRoute from "./routes/celestial.routes";
import n2yoRoute from "./routes/n2yo.routes";
import visibleTonightRoute from "./routes/visible-tonight.routes";
import planetDetailsRoute from "./routes/planet-details.routes";
import timelineRoute from "./routes/timeline.routes";
import aiRoute from "./routes/ai.routes";
import reportRoute from "./routes/report.routes";
import objectRoute from "./routes/object.routes";
import locationRoute from "./routes/location.routes";
import narrateRoute from "./routes/narrate.routes";

const app = express();

// Global middleware MUST run before any route so every endpoint gets CORS +
// JSON body parsing. (Previously /api/ai was mounted above these and silently
// ran without CORS headers or a parsed body.)
app.use(cors());
app.use(express.json());

app.use("/api/health", healthRoute);
app.use("/api/weather", weatherRoute);
app.use("/api/observation", observationRoute);
app.use("/api/astronomy", astronomyRoutes);
app.use("/api/lightpollution", lightPollutionRoute);
app.use("/api/satellite", satelliteRoute);
app.use("/api/tle", tleRoute);
app.use("/api/celestial", celestialRoute);
app.use("/api/n2yo", n2yoRoute);
app.use("/api/timeline", timelineRoute);
app.use("/api/visible-tonight", visibleTonightRoute);
app.use("/api/planet-details", planetDetailsRoute);
app.use("/api/ai", aiRoute);

// Aggregation + integration endpoints consumed directly by the frontend.
app.use("/api/report", reportRoute);
app.use("/api/object", objectRoute);
app.use("/api/location", locationRoute);
app.use("/api/narrate", narrateRoute);

export default app;
