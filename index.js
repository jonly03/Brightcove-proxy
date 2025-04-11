import express from "express";
import VideosRouter from "./Routes/videos.js";

const app = express();
const port = 3000;

// Middleware to parse JSON requests
app.use(express.json());

app.use("/videos", VideosRouter);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
