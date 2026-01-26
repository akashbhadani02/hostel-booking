require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');

const Room = require('./models/Room');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ===== USER MODEL =====
const User = mongoose.model("User", new mongoose.Schema({
  username: String,
  password: String
}));

// ===== MONGODB CONNECT =====
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000
});

mongoose.connection.on("connected", async () => {
  console.log("✅ MongoDB Connected");

  // ===== CREATE ROOMS (ONLY FIRST TIME) =====
  const count = await Room.countDocuments();
  if (count === 0) {
    for (let f = 1; f <= 13; f++) {
      for (let r = 1; r <= 25; r++) {
        await Room.create({ room: f * 100 + r });
      }
    }
    console.log("🏨 Rooms created");
  }

  // ===== CREATE DEFAULT USER =====
  const existingUser = await User.findOne({ username: "hostel" });
  if (!existingUser) {
    const hash = await bcrypt.hash("hostel123", 10);
    await User.create({ username: "hostel", password: hash });
    console.log("👤 Default user created (hostel / hostel123)");
  }
});

mongoose.connection.on("error", err => {
  console.log("❌ MongoDB Error:", err.message);
});

// ===== ROUTES =====
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// ===== ROOMS APIs =====
app.get('/api/rooms', async (req, res) => {
  const rooms = await Room.find().sort({ room: 1 });
  res.json(rooms);
});

app.post('/api/room/:room', async (req, res) => {
  const { status } = req.body;

  await Room.findOneAndUpdate(
    { room: req.params.room },
    { status }
  );

  res.json({ success: true });
});

app.post('/api/room-note/:room', async (req, res) => {
  const { note } = req.body;

  await Room.findOneAndUpdate(
    { room: req.params.room },
    { note: note || '' }
  );

  res.json({ success: true });
});

app.post('/api/add-room', async (req, res) => {
  const { room } = req.body;

  if (!room) {
    return res.json({ success: false, message: "Room number required" });
  }

  const exists = await Room.findOne({ room });
  if (exists) {
    return res.json({ success: false, message: "Room already exists" });
  }

  await Room.create({ room });
  res.json({ success: true });
});

app.delete('/api/delete-room/:room', async (req, res) => {
  const room = Number(req.params.room);

  const exists = await Room.findOne({ room });
  if (!exists) {
    return res.json({ success: false, message: "Room not found" });
  }

  await Room.deleteOne({ room });
  res.json({ success: true });
});

// ===== SERVER START =====
const PORT = process.env.PORT || 9999;
app.listen(PORT, () => {
  console.log("🚀 Server running on", PORT);
});
