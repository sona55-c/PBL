// ==========================================
//  SERVER: Receives logs + sends packets to Wireshark
// ==========================================

const express = require("express");
const cors = require("cors");
const dgram = require("dgram");

const app = express();
app.use(cors());
app.use(express.text());

// UDP socket
const udp = dgram.createSocket("udp4");

// <-- CHANGE THIS TO YOUR SYSTEM'S LAN IP -->
const WIRESHARK_IP = "192.168.1.102";  
const WIRESHARK_PORT = 9999;

// Main receive endpoint
app.post("/", (req, res) => {
    const data = req.body;
    console.log("Received:", data);

    // NEW: If it's a blocked website, send special UDP packet
    if (data.startsWith("BLOCKED_SITE")) {
        const domain = data.split(" ")[1];
        const msg = Buffer.from(`Firewall Blocked: ${domain}`);

        udp.send(msg, WIRESHARK_PORT, WIRESHARK_IP, (err) => {
            if (err) console.log("UDP Error:", err);
        });
    }

    res.send("OK");
});

app.listen(3000, "0.0.0.0", () => {
    console.log("Server running at http://localhost:3000");
});
