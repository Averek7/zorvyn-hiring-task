import type { Request, Response } from "express";
import { app } from "../src/app";
import { connectMongo } from "../src/lib/mongo";

export default async function handler(req: Request, res: Response): Promise<void> {
  await connectMongo();
  return app(req, res);
}
