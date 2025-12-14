require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ===== MODELS =====
const User = mongoose.model("User", new mongoose.Schema({
  username: String,
  password: String
}));

const Room = mongoose.model("Room", new mongoose.Schema({
  room: Number,
  status: { type: String, default: "empty" }
}));

// ===== MONGODB CONNECT =====
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000
});

// mongoose.connection.on("connected", async () => {
//   console.log("✅ MongoDB Connected");

//   const count = await Room.countDocuments();
//   if (count === 0) {
//     for (let f = 1; f <= 13; f++) {
//       for (let r = 1; r <= 25; r++) {
//         await Room.create({ room: f * 100 + r });
//       }
//     }
//     console.log("🏨 Rooms created");
//   }
// });

mongoose.connection.on("connected", async () => {
  console.log("✅ MongoDB Connected");

  // ===== CREATE ROOMS =====
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
    const hashedPassword = await bcrypt.hash("hostel123", 10);
    await User.create({
      username: "hostel",
      password: hashedPassword
    });
    console.log("👤 Default user created: hostel / hostel123");
  } else {
    console.log("👤 Default user already exists");
  }
});


mongoose.connection.on("error", err => {
  console.log("❌ MongoDB Error:", err.message);
});

// ===== ROUTES =====
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'login.html'));
// });

// app.get('/dashboard', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
// });

// app.post('/api/register', async (req, res) => {
//   const hash = await bcrypt.hash(req.body.password, 10);
//   await User.create({ username: req.body.username, password: hash });
//   res.json({ success: true });
// });

// app.post('/api/login', async (req, res) => {
//   const user = await User.findOne({ username: req.body.username });
//   if (!user) return res.json({ success: false });

//   const ok = await bcrypt.compare(req.body.password, user.password);
//   if (!ok) return res.json({ success: false });

//   const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
//   res.json({ success: true, token });
// });

// app.get('/api/rooms', async (req, res) => {
//   const rooms = await Room.find().sort({ room: 1 });
//   res.json(rooms);
// });

// app.post('/api/room/:room', async (req, res) => {
//   await Room.updateOne(
//     { room: req.params.room },
//     { status: req.body.status }
//   );
//   res.json({ success: true });
// });

// ===== ROUTES =====
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/api/rooms', async (req, res) => {
  const rooms = await Room.find().sort({ room: 1 });
  res.json(rooms);
});

app.post('/api/room/:room', async (req, res) => {
  await Room.updateOne(
    { room: req.params.room },
    { status: req.body.status }
  );
  res.json({ success: true });
});


// ===== SERVER START =====
const PORT = process.env.PORT || 9999;
app.listen(PORT, () => {
  console.log("🚀 Server running on", PORT);
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

  await Room.create({ room, status: "empty" });
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
