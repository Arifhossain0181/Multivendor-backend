import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "tmp-uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
};

const storage = (multer as any).diskStorage({
    destination: (_req: any, _file: any, cb: any) => {
        cb(null, uploadDir);
    },
    filename: (_req: any, file: Express.Multer.File, cb: any) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `${unique}${path.extname(file.originalname)}`);
    },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
    if (!file.mimetype.startsWith("image/")) {
        return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
};

export const upload = (multer as any)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

export const singleImageUpload = upload.single("image");
