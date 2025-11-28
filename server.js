const dgram = require("dgram");
const server = dgram.createSocket("udp4");

server.on("message", msg => {
    console.log("Received:", msg.toString());
});

// bind to all network adapters
server.bind(9999, "0.0.0.0", () => {
    console.log("UDP Server listening on port 9999");
});
