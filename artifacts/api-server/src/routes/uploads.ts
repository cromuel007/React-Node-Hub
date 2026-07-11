import { Router, type IRouter } from "express";
import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import { requireAuth } from "../middlewares/auth";

import {
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { s3 } from "../lib/s3";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

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

    try {
      const key = `avatars/${crypto.randomUUID()}${path.extname(
        req.file.originalname,
      )}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET!,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        }),
      );

      const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      res.json({
        url,
      });
    } catch (error) {
      console.error("Upload avatar error:", error);

      res.status(500).json({
        message: "Failed to upload avatar",
      });
    }
  },
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
      const objectUrl = new URL(url);

      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET!,
          Key: objectUrl.pathname.substring(1),
        }),
      );

      res.json({
        message: "Avatar deleted successfully",
      });
    } catch (error) {
      console.error("Delete avatar error:", error);

      res.status(404).json({
        message: "File not found",
      });
    }
  },
);

export default router;