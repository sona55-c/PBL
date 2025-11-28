// Predefined networks
const networks = {
  "MyHome_Open": { password: null, macFilter: [] },
  "Secure-WiFi-PBL": { password: "S0n@Proj!2025", macFilter: [] },
  "Guest-Sona": { password: "Guest@2025", macFilter: [] }
};

// Simulated connected devices log
let connectedDevices = [];

// Simulated payload encryption for secure networks
function encryptData(ssid, data) {
  if (networks[ssid].password) {
    return btoa(data); // simple base64 encode
  }
  return data; // plaintext for open network
}

// Main connection function
function connectWiFi() {
  const ssid = document.getElementById('ssid').value.trim();
  const password = document.getElementById('password').value;
  const mac = document.getElementById('mac').value.trim().toUpperCase();
  const status = document.getElementById('status');

  if (!networks[ssid]) {
    status.textContent = "Network not found ❌";
    status.style.color = "red";
    return;
  }

  // Check MAC filtering
  if (networks[ssid].macFilter.length && !networks[ssid].macFilter.includes(mac)) {
    status.textContent = "MAC address not allowed ❌";
    status.style.color = "red";
    return;
  }

  // Password check
  if (networks[ssid].password === null) {
    status.textContent = "Connected to open network ✔";
    status.style.color = "green";
  } else if (networks[ssid].password === password) {
    status.textContent = "Connected successfully ✔";
    status.style.color = "green";
  } else {
    status.textContent = "Wrong password ❌";
    status.style.color = "red";
    return;
  }

  // Add to connected devices
  const device = { ssid, mac: mac || "Unknown", time: new Date().toLocaleTimeString() };
  connectedDevices.push(device);
  updateDeviceLog();
}

// Update log display
function updateDeviceLog() {
  const log = document.getElementById('log');
  if (!connectedDevices.length) {
    log.textContent = "No devices connected yet.";
    return;
  }
  let text = "";
  connectedDevices.forEach((d, i) => {
    let sampleData = `Ping 192.168.1.${i+1}`;
    let encrypted = encryptData(d.ssid, sampleData);
    text += `${i+1}. SSID: ${d.ssid}, MAC: ${d.mac}, Time: ${d.time}, Data: ${encrypted}\n`;
  });
  log.textContent = text;
}

// Optional: Preload MAC filtering
networks["Secure-WiFi-PBL"].macFilter.push("AA:BB:CC:DD:EE:01");
