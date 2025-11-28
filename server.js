const express = require("express");
const cors = require("cors");
const dgram = require("dgram");

const app = express();
app.use(cors());
app.use(express.json());

const udp = dgram.createSocket("udp4");
const WIRESHARK_IP = "127.0.0.1";
const WIRESHARK_PORT = 9999;

udp.bind(WIRESHARK_PORT, WIRESHARK_IP, () => {
  console.log(`UDP listener bound to ${WIRESHARK_IP}:${WIRESHARK_PORT}`);
});

function sendUDP(msg) {
  const buffer = Buffer.from(msg + "\n", "utf8");
  udp.send(buffer, 0, buffer.length, WIRESHARK_PORT, WIRESHARK_IP, err => {
    if (err) console.error("UDP Error:", err);
  });
}


// Normal packets
app.post("/packet", (req, res) => {
  const { src, dst, protocol, info } = req.body;
  console.log("Packet:", src, "->", dst, protocol, info);
  sendUDP(`[PACKET] ${src} -> ${dst} (${protocol}): ${info}`);
  res.send("OK");
});

// Firewall blocked
app.post("/firewall/alert", (req, res) => {
  const { domain } = req.body;
  console.log("Firewall Blocked:", domain);
  sendUDP(`[FIREWALL BLOCK] ${domain}`);
  res.send("OK");
});

// Firewall add rule
app.post("/firewall/block", (req, res) => {
  const { domain } = req.body;
  console.log("Added firewall rule:", domain);
  res.send("OK");
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Server running at http://localhost:3000");
});
