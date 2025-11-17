"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const path_1 = __importDefault(require("path"));
const routes_1 = require("./routes");
const db_1 = require("./config/db");
const vite_1 = require("./vite");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000
    }
}));
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
});
(async () => {
    await (0, db_1.connectDB)();
    const server = await (0, routes_1.registerRoutes)(app);
    if (process.env.NODE_ENV === "production") {
        const publicPath = path_1.default.join(__dirname, "public");
        app.use(express_1.default.static(publicPath));
        app.get("*", (_req, res) => {
            res.sendFile(path_1.default.join(publicPath, "index.html"));
        });
    }
    const port = parseInt(process.env.PORT || "5000", 10);
    const host = "0.0.0.0";
    server.listen(port, host, () => {
        (0, vite_1.log)(`Serving on http://${host}:${port}`);
    });
})();
