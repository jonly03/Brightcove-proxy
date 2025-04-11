// routes.js

import express from "express";
import BrightcoveHelper from "../brightcover-helper.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const videos = await BrightcoveHelper.getVideos(req.query.limit);
    if (videos.error) {
      return res.status(500).json({ error: videos.error });
    }
    res.json(videos);
  } catch (error) {
    console.error("Error handling /videos request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const video = await BrightcoveHelper.getVideos(1, req.params.id);
    if (video.error) {
      return res.status(500).json({ error: video.error });
    }
    res.json(video);
  } catch (error) {
    console.error("Error handling /videos/:id request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
