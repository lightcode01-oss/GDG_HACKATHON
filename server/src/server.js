const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");

const PORT = process.env.PORT || 10000;

// CREATE HTTP SERVER
const server = http.createServer(app);

// INITIALIZE SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ATTACH IO TO APP FOR ROUTE ACCESS
app.set("io", io);

// SOCKET CONNECTION LOGIC
io.on("connection", (socket) => {
  console.log(`[SOCKET_ACTIVE]: System node connected (${socket.id})`);
  
  socket.on("disconnect", () => {
    console.log(`[SOCKET_INACTIVE]: System node disconnected (${socket.id})`);
  });
});

// START SERVER (RENDER STABLE BINDING)
server.listen(PORT, "0.0.0.0", () => {
  console.log(`=========================================`);
  console.log(`🚀 CRISIS_AI BACKEND CORE ONLINE`);
  console.log(`📡 PORT: ${PORT}`);
  console.log(`🌐 BIND: 0.0.0.0`);
  console.log(`=========================================`);
});
