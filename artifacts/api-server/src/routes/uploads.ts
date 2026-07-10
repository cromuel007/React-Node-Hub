import { Router, type IRouter } from "express";
import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

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
  async (req, res): Promise<void> => {
    if (!req.file) {
      res.status(400).json({
        message: "No file uploaded",
      });
      return;
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
  async (req, res): Promise<void> => {
    const { url } = req.body;

    if (!url) {
      res.status(400).json({
        message: "File URL is required",
      });
      return;
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