import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 1. Bulletproof security settings (BULLETPROOF SECURITY)
// ==========================================

// HTTP Secure headers (hackers won't be able to detect your server technology)
app.use(helmet()); 

// Set a data limit (so that a hacker can't crash your server by sending a very large file))
app.use(express.json({ limit: '10kb' })); 

// Rate Limiter (protection against DDoS and Brute Force attacks - only 100 requests per 15 minutes from one IP))
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minute
    max: 100, 
    message: { error: "Too many requests from this IP, please try again after 15 minutes." }
});
app.use(limiter);

// Allow only your React frontend to access the backend.
app.use(cors({
    origin: 'http://localhost:5173' 
}));

// ==========================================
// 2. Database Connection (DATABASE CONNECTION)
// ==========================================
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/passop";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅: MongoDB Connected Successfully!"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Password schema (Schema)
const passwordSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    site: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true }
});

const Password = mongoose.model('Password', passwordSchema);

// ==========================================
// 3. Secure API Routes (SECURE API ROUTES WITH TRY-CATCH)
// ==========================================

// GET: Bring all the passwords.
app.get('/', async (req, res, next) => {
    try {
        const passwords = await Password.find({});
        res.status(200).json(passwords);
    } catch (error) {
        next(error); // Send the error to the global handler; the server won't crash.
    }
});

// POST: Save new password
app.post('/', async (req, res, next) => {
    try {
        const newPassword = new Password(req.body);
        await newPassword.save();
        res.status(201).json({ success: true, message: "Saved successfully!" });
    } catch (error) {
        next(error);
    }
});

// PUT: Updating password
app.put('/', async (req, res, next) => {
    try {
        const { id, site, username, password } = req.body;
        const updatedPassword = await Password.findOneAndUpdate(
            { id: id },
            { site, username, password },
            { new: true }
        );
        if (!updatedPassword) return res.status(404).json({ error: "Not found" });
        res.status(200).json({ success: true });
    } catch (error) {
        next(error);
    }
});

// DELETE: Deleting the password
app.delete('/', async (req, res, next) => {
    try {
        const { id } = req.body;
        const deletedPassword = await Password.findOneAndDelete({ id: id });
        if (!deletedPassword) return res.status(404).json({ error: "Not found" });
        res.status(200).json({ success: true });
    } catch (error) {
        next(error);
    }
});

// ==========================================
// 4. Anti-crash global error handler (CRASH-PROOF GLOBAL HANDLER)
// ==========================================
app.use((err, req, res, next) => {
    console.error("🔥 Server Error Caught:", err.message);
    res.status(500).json({ error: "Something went wrong, but the server is safe and stable!" });
});

app.listen(PORT, () => {
    console.log(`🚀 Secure Server running smoothly on port ${PORT}`);
});
