import { Request, NextFunction, RequestHandler, Response } from "express";

const TryCatch = (handler: RequestHandler): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (err: any) {
      console.error("🔥 ERROR:", err);
      res.status(500).json({ message: err.message });
    }
  };
};

export default TryCatch;
