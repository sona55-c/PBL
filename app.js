// =====================
// CONFIG
// =====================
const SERVER = "http://127.0.0.1:3000"; // local server for testing
const AUTH = {
    "x-auth-key": "PBL_SECRET_KEY_2025",
    "Content-Type": "application/json"
};

let connectedSSID = null;
let hotspotBlockedDevices = [];
let packetCounter = 0;

// =====================
// LOGGING
// =====================
function addLog(text) {
    const logBox = document.getElementById("logOutput");
    if (!logBox) return console.error("logOutput not found");
    logBox.innerHTML += text + "<br>";
    logBox.scrollTop = logBox.scrollHeight;
}

// =====================
// PACKET CAPTURE (Fake Wireshark)
// =====================
function addPacket(source, dest, protocol, info) {
    packetCounter++;
    const tbody = document.querySelector("#packetTable tbody");
    const row = document.createElement("tr");
    const time = new Date().toLocaleTimeString();

    row.innerHTML = `
        <td>${packetCounter}</td>
        <td>${time}</td>
        <td>${source}</td>
        <td>${dest}</td>
        <td>${protocol}</td>
        <td>${info}</td>
    `;
    tbody.appendChild(row);
    tbody.parentElement.scrollTop = tbody.parentElement.scrollHeight;

    // Send to server
    fetch(`${SERVER}/packet`, {
        method: "POST",
        headers: AUTH,
        body: JSON.stringify({ src: source, dst: dest, protocol, info })
    });
}

// =====================
// WIFI NETWORKS
// =====================
const networks = {
    "MyHome_Open": { security: "open", password: null, macFilter: [] },
    "Secure-WiFi-PBL": { security: "wpa2", password: "S0n@Proj!2025", macFilter: ["AA:BB:CC:DD:EE:01"] },
    "Guest-Sona": { security: "wpa2", password: "Guest@2025", macFilter: [] }
};

// =====================
// CONNECT WIFI
// =====================
function connectToWiFi(deviceName, mac, ssid, password) {
    const net = networks[ssid];
    if (!net) {
        addLog(`❌ Network ${ssid} not found`);
        return;
    }

    if (net.macFilter.length && !net.macFilter.includes(mac)) {
        addLog(`❌ MAC Blocked: ${mac}`);
        addPacket(mac, ssid, "WiFi", "MAC Blocked");
        return;
    }

    if (net.security === "wpa2" && password !== net.password) {
        addLog(`❌ Wrong Password for ${ssid}`);
        addPacket(mac, ssid, "WiFi", "Wrong Password");
        return;
    }

    connectedSSID = ssid;

    if (net.security === "open") {
        addLog(`🟢 ${deviceName} connected to OPEN network ${ssid}`);
        addPacket(mac, ssid, "WiFi", "Connected OPEN");
    } else {
        const encrypted = btoa("Ping 192.168.1.2");
        addLog(`🟢 ${deviceName} connected to SECURE network ${ssid}`);
        addLog(`Encrypted Payload: ${encrypted}`);
        addPacket(mac, ssid, "WiFi", "Connected SECURE + Encrypted Payload");
    }
}

// =====================
// WEBSITE ACCESS
// =====================
function checkWebsiteAccess(url) {
    const domain = url.replace("https://", "").replace("http://", "").split("/")[0];

    fetch("firewallRules.json")
        .then(r => r.json())
        .then(rules => {
            if (rules.blocked.includes(domain)) {
                addLog(`⛔ BLOCKED by FIREWALL: ${domain}`);
                addPacket("Browser", domain, "HTTP", "Firewall Blocked");

                fetch(`${SERVER}/firewall/alert`, {
                    method: "POST",
                    headers: AUTH,
                    body: JSON.stringify({ domain })
                });
            } else {
                addLog(`🌐 Allowed: ${domain}`);
                addPacket("Browser", domain, "HTTP", "Allowed Website");
            }
        });
}

// =====================
// HOTSPOT BLOCK
// =====================
function requestHotspot(mac) {
    if (hotspotBlockedDevices.includes(mac)) {
        addLog(`❌ Hotspot already disabled for device ${mac}`);
        addPacket(mac, "Hotspot", "WiFi", "Hotspot Already Blocked");
        return;
    }
    hotspotBlockedDevices.push(mac);
    addLog(`⚠️ Hotspot Sharing Blocked for ${mac}`);
    addPacket(mac, "Hotspot", "WiFi", "Hotspot Blocked");
}

// =====================
// WIFI CALL
// =====================
function wifiCall(mac, numberDialed) {
    const time = new Date().toLocaleTimeString();
    addLog(`📞 WiFi Call: ${numberDialed} from ${mac} on ${connectedSSID} @ ${time}`);
    addPacket(mac, numberDialed, "VoIP", `WiFi Call on ${connectedSSID}`);
}

// =====================
// BUTTONS
// =====================
document.getElementById("connectBtn").onclick = () => {
    const device = document.getElementById("deviceSelect").value;
    const mac = document.getElementById("macInput").value.toUpperCase();
    const ssid = document.getElementById("wifiSelect").value;
    const pass = document.getElementById("wifiPassword").value;
    connectToWiFi(device, mac, ssid, pass);
};

document.getElementById("btnAccessWebsite").onclick = () => {
    const url = document.getElementById("websiteInput").value;
    checkWebsiteAccess(url);
};

document.getElementById("btnHotspot").onclick = () => {
    const mac = document.getElementById("macInput").value.toUpperCase();
    requestHotspot(mac);
};

document.getElementById("btnCall").onclick = () => {
    const mac = document.getElementById("macInput").value.toUpperCase();
    const number = document.getElementById("callNumber").value;
    wifiCall(mac, number);
};

// Firewall add rule
document.getElementById("addFwRule").onclick = () => {
    const domain = document.getElementById("fwInput").value.trim();
    if (!domain) return;

    fetch(`${SERVER}/firewall/block`, {
        method: "POST",
        headers: AUTH,
        body: JSON.stringify({ domain })
    }).then(() => {
        addLog(`🔥 Firewall Rule Added: Block ${domain}`);
    });
};

// Export PCAP
document.getElementById("exportPCAP").onclick = () => {
    const pcapData = [];
    const rows = document.querySelectorAll("#packetTable tbody tr");
    rows.forEach(r => {
        const cols = r.querySelectorAll("td");
        const line = `${cols[0].innerText}, ${cols[1].innerText}, ${cols[2].innerText}, ${cols[3].innerText}, ${cols[4].innerText}, ${cols[5].innerText}`;
        pcapData.push(line);
    });
    const blob = new Blob(pcapData, { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wifi-simulator.pcap";
    a.click();
};
