declare module "multer" {
  import { Request, Response, NextFunction } from "express";
  import { Busboy } from "busboy";

  export interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
  }

  export interface StorageEngine {
    _handleFile(
      req: Request,
      file: Express.Multer.File,
      callback: (error?: any, info?: Partial<File>) => void,
    ): void;
    _removeFile(req: Request, file: File, callback: (error: Error | null) => void): void;
  }

  export interface MulterOptions {
    dest?: string;
    storage?: StorageEngine;
    fileFilter?: (req: Request, file: Express.Multer.File, callback: (error: Error | null, acceptFile?: boolean) => void) => void;
    limits?: {
      fieldNameSize?: number;
      fieldSize?: number;
      fields?: number;
      fileSize?: number;
      files?: number;
    };
  }

  export type Multer = (options?: MulterOptions) => {
    (req: Request, res: Response, next: NextFunction): void;
    single(fieldname: string): (req: Request, res: Response, next: NextFunction) => void;
    array(fieldname: string, maxCount?: number): (req: Request, res: Response, next: NextFunction) => void;
    fields(fields: { name: string; maxCount?: number }[]): (req: Request, res: Response, next: NextFunction) => void;
    none(): (req: Request, res: Response, next: NextFunction) => void;
    any(): (req: Request, res: Response, next: NextFunction) => void;
  };

  export const Multer: Multer;
  export default Multer;
}

declare module "express" {
  interface Request {
    file?: Express.Multer.File;
    files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  }
}
