// =====================================================
//        WiFi NETWORK DEFINITIONS
// =====================================================
const networks = {
    "MyHome_Open": { security: "open", macFilter: [], password: null },
    "Secure-WiFi-PBL": { security: "wpa2", password: "S0n@Proj!2025", macFilter: ["AA:BB:CC:DD:EE:01"] }
};

let connectedSSID = null;
let hotspotBlockedDevices = [];
const blockedSites = ["piratedmovies.com", "hackertools.net", "illegalstuff.org", "adult-content.com"];
const callLogs = [];
let packetCounter = 0;

// =====================================================
//                LOGGING SYSTEM
// =====================================================
function addLog(text) {
    const logBox = document.getElementById("logOutput");
    logBox.innerHTML += text + "\n";
    logBox.scrollTop = logBox.scrollHeight;

    // ALSO send logs to Wireshark packet stream
    sendPacketToServer(text);
}

// =====================================================
//        SEND PACKET TO NODE.JS → UDP → WIRESHARK
// =====================================================
function sendPacketToServer(info) {
    fetch("http://192.168.1.102", {  // <-- YOUR IPv4 here
        method: "POST",
        body: info
    }).catch(err => console.error("Fetch error:", err));
}






// =====================================================
//         PACKET CAPTURE (Fake Wireshark)
// =====================================================
function addPacket(sourceMAC, dest, protocol, info) {
    packetCounter++;
    const tbody = document.getElementById("packetTable").querySelector("tbody");
    const row = document.createElement("tr");
    const time = new Date().toLocaleTimeString();

    row.innerHTML = `
        <td>${packetCounter}</td>
        <td>${time}</td>
        <td>${sourceMAC}</td>
        <td>${dest}</td>
        <td>${protocol}</td>
        <td>${info}</td>
    `;
    tbody.appendChild(row);

    // scroll fake wireshark panel
    tbody.parentElement.scrollTop = tbody.parentElement.scrollHeight;

    // ALSO send real packet to Node/Wireshark
    sendPacketToServer(`[${protocol}] ${sourceMAC} -> ${dest}: ${info}`);
}

// =====================================================
//        WiFi CONNECTION SYSTEM
// =====================================================
function connectToWiFi(deviceName, mac, ssid, password) {
    const net = networks[ssid];

    if (!net) {
        addLog(`❌ Network ${ssid} not found`);
        return;
    }

    if (net.macFilter.length > 0 && !net.macFilter.includes(mac)) {
        addLog(`❌ MAC Blocked: ${mac} is NOT allowed on ${ssid}`);
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

// =====================================================
//        WEBSITE ACCESS SYSTEM
// =====================================================
function checkWebsiteAccess(url) {
    const domain = url.replace("https://", "").replace("http://", "").split("/")[0];

    if (blockedSites.includes(domain)) {
        addLog(`⚠️ ACCESS BLOCKED: ${domain} contains harmful or illegal content.`);
        addPacket("Browser", domain, "HTTP", "Blocked Site");
    } else {
        addLog(`🌐 Allowed: ${domain}`);
        addPacket("Browser", domain, "HTTP", "Allowed Site");
    }
}

// =====================================================
//        HOTSPOT BLOCK SYSTEM
// =====================================================
function requestHotspot(deviceMAC) {
    if (hotspotBlockedDevices.includes(deviceMAC)) {
        addLog(`❌ Hotspot already disabled for device ${deviceMAC}`);
        addPacket(deviceMAC, "Hotspot", "WiFi", "Hotspot Already Blocked");
        return;
    }
    hotspotBlockedDevices.push(deviceMAC);
    addLog(`⚠️ Hotspot Sharing Blocked for ${deviceMAC} (Security Policy)`);
    addPacket(deviceMAC, "Hotspot", "WiFi", "Hotspot Blocked");
}

// =====================================================
//        WIFI CALLING SYSTEM
// =====================================================
function wifiCall(deviceMAC, numberDialed, ssid) {
    const time = new Date().toLocaleTimeString();
    const entry = { mac: deviceMAC, number: numberDialed, time: time, ssid: ssid };
    callLogs.push(entry);

    addLog(`📞 WiFi Call: ${numberDialed} from ${deviceMAC} on ${ssid} @ ${time}`);
    addPacket(deviceMAC, numberDialed, "VoIP", `WiFi Call on ${ssid}`);
}

// =====================================================
//        BUTTON EVENT LISTENERS
// =====================================================
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
    wifiCall(mac, number, connectedSSID);
};

// =====================================================
//        EXPORT PCAP FUNCTION (TEXT VERSION)
// =====================================================
document.getElementById("exportPCAP").onclick = () => {
    const pcapData = [];
    const rows = document.getElementById("packetTable").querySelectorAll("tbody tr");

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
