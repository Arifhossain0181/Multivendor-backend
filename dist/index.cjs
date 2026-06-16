"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_express = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_helmet = __toESM(require("helmet"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_http = __toESM(require("http"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var server = import_http.default.createServer(app);
app.use((0, import_helmet.default)());
var allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000"
].filter((origin) => Boolean(origin));
console.log(`
[SERVER] Allowed CORS origins:`, allowedOrigins);
app.use(
  (0, import_cors.default)({
    origin: (origin, callback) => {
      console.log(`[CORS] Request from origin: ${origin || "no-origin"}`);
      if (!origin) {
        console.log(`[CORS]  Allowed - No origin`);
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        console.log(`[CORS]Allowed - Origin in whitelist`);
        return callback(null, true);
      }
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        console.log(`[CORS] Allowed - Localhost`);
        return callback(null, true);
      }
      console.log(`[CORS]  Blocked - Origin not allowed`);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
);
app.use((req, res, next) => {
  console.log(`
[REQUEST] ${req.method} ${req.path}`);
  console.log(`[REQUEST] Headers:`, {
    "content-type": req.headers["content-type"],
    "authorization": req.headers["authorization"] ? "***" : "none"
  });
  next();
});
app.use(import_express.default.json());
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Multivendor API"
  });
});
var PORT = process.env.PORT || 5e3;
server.listen(PORT, () => {
  console.log(`
 Server running on port ${PORT}
`);
});
