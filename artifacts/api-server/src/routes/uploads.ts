import { Router } from "express";
import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import { requireAuth } from "../middlewares/auth";
import fs from "node:fs/promises";

const router = Router();

const storage = multer.diskStorage({
  destination: "uploads",
  filename: (_, file, cb) => {
    cb(null, `${crypto.randomUUID()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

router.post(
  "/uploads/avatar",
  requireAuth,
  upload.single("file"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    res.json({
      url: `${baseUrl}/uploads/${req.file.filename}`,
    });
  }
);

router.delete(
  "/uploads/avatar",
  requireAuth,
  async (req, res) => {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        message: "File URL is required",
      });
    }

    try {
      const filename = path.basename(url);
      const filePath = path.join(process.cwd(), "uploads", filename);

      await fs.unlink(filePath);

      res.json({
        message: "Avatar deleted successfully",
      });
    } catch (error) {
      console.error("Delete avatar error:", error);

      res.status(404).json({
        message: "File not found",
      });
    }
  }
);

export default router;