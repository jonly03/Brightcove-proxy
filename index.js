import express from "express";
import VideosRouter from "./Routes/videos.js";

const app = express();
const port = process.env.PORT || 3000;

// CORS headers middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-type", "application/json");
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Handle preflight requests (OPTIONS method)
  if (req.method === "OPTIONS") {
    res.sendStatus(204); // Respond with no content for preflight requests
  } else {
    next(); // Pass the request to the next middleware
  }
});

// Middleware to parse JSON requests
app.use(express.json());

app.use("/videos", VideosRouter);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
