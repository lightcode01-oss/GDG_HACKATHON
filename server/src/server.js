require("dotenv").config();
const http = require("http");
const app = require("./app");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 10000;
const server = http.createServer(app);

// Attach Socket.io for Real-Time Dispatch
const io = new Server(server, {
  cors: { origin: "*" }
});

// Bind io to app so routes can use it to broadcast
app.set('io', io);

io.on("connection", (socket) => {
  console.log(`Dispatcher connected: ${socket.id}`);
  
  socket.on("disconnect", () => {
    console.log(`Dispatcher disconnected: ${socket.id}`);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`CrisisAI Production Backbone running on 0.0.0.0:${PORT}`);
});
