const BAUD_RATE = 9600;

let port = null;
let reader = null;
let writer = null;
let keepReading = false;
let receivedBuffer = "";

const connectButton = document.querySelector("#connect-button");
const sendValueButton = document.querySelector("#send-value-button");
const onButton = document.querySelector("#on-button");
const offButton = document.querySelector("#off-button");
const commandForm = document.querySelector("#command-form");
const commandInput = document.querySelector("#command-input");
const clearLogButton = document.querySelector("#clear-log-button");
const outputValue = document.querySelector("#output-value");
const outputValueLabel = document.querySelector("#output-value-label");
const connectionStatus = document.querySelector("#connection-status");
const statusDot = document.querySelector("#status-dot");
const portLabel = document.querySelector("#port-label");
const browserNote = document.querySelector("#browser-note");
const serialLog = document.querySelector("#serial-log");
const alcohol135Value = document.querySelector("#alcohol135-value");
const co9Value = document.querySelector("#co9-value");
const airQualityValue = document.querySelector("#air-quality-value");
const chartHistory = [];
const MAX_POINTS = 60;

const charts = [
  { canvas: document.querySelector("#alcohol135-chart"), label: "alcohol135", color: "#e6a15c", max: 1023, key: "alcohol135" },
  { canvas: document.querySelector("#co9-chart"), label: "CO9", color: "#8db99c", max: 1023, key: "co9" },
  { canvas: document.querySelector("#air-quality-chart"), label: "Calidad del aire", color: "#d87866", max: 2046, key: "sum" },
];

function setConnectionState(state, message) {
  connectionStatus.textContent = message;
  statusDot.className = `status-dot ${state}`;
  const connected = state === "connected";
  [sendValueButton, onButton, offButton, commandForm.querySelector("button")].forEach((button) => {
    button.disabled = !connected;
  });
  connectButton.textContent = connected ? "Desconectar" : "Conectar Arduino";
}

function addLog(message, type = "system") {
  const emptyMessage = serialLog.querySelector(".log-empty");
  if (emptyMessage) emptyMessage.remove();

  const entry = document.createElement("p");
  const time = new Date().toLocaleTimeString("es-CL");
  entry.className = `log-entry ${type}`;
  entry.innerHTML = `<time>[${time}]</time> ${escapeHtml(message)}`;
  serialLog.append(entry);
  serialLog.scrollTop = serialLog.scrollHeight;
}

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}

async function connectToArduino() {
  if (!("serial" in navigator)) {
    setConnectionState("error", "No compatible");
    browserNote.textContent = "Web Serial requiere Chrome o Edge en una conexión segura (HTTPS o localhost).";
    addLog("Este navegador no dispone de Web Serial.", "system");
    return;
  }

  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: BAUD_RATE });
    const info = port.getInfo();
    portLabel.textContent = info.usbVendorId ? `USB ${info.usbVendorId}` : "Puerto serial";
    setConnectionState("connected", "Conectado");
    browserNote.textContent = `Velocidad: ${BAUD_RATE} baudios`;
    addLog("Conexión abierta.");
    startReading();
  } catch (error) {
    if (error.name !== "NotFoundError") {
      port = null;
      setConnectionState("error", "Error de conexión");
      const message = error.name === "NetworkError"
        ? "El puerto está ocupado. Cierra el Monitor Serial de Arduino IDE y vuelve a intentar."
        : `No fue posible conectar: ${error.message}`;
      browserNote.textContent = message;
      addLog(message, "system");
    }
  }
}

async function disconnectFromArduino() {
  keepReading = false;
  if (reader) {
    await reader.cancel().catch(() => {});
  }
  if (writer) writer.releaseLock();
  if (port) await port.close().catch(() => {});
  reader = null;
  writer = null;
  port = null;
  portLabel.textContent = "Sin puerto";
  setConnectionState("", "Desconectado");
  addLog("Conexión cerrada.");
}

async function startReading() {
  if (!port?.readable) return;
  reader = port.readable.getReader();
  keepReading = true;

  try {
    while (keepReading) {
      const { value, done } = await reader.read();
      if (done) break;
      receivedBuffer += new TextDecoder().decode(value);
      const messages = receivedBuffer.split("\n");
      receivedBuffer = messages.pop() ?? "";
      messages.map((message) => message.trim()).filter(Boolean).forEach(handleReceivedMessage);
    }
  } catch (error) {
    addLog(`Lectura interrumpida: ${error.message}`, "system");
  } finally {
    reader.releaseLock();
    reader = null;
  }
}

function handleReceivedMessage(message) {
  updateSensorCharts(message);
  addLog(message, "received");
}

function updateSensorCharts(message) {
  const values = message.match(/alcohol135:(\d+),CO9:(\d+)/i);
  if (!values) return;

  const alcohol135 = Number(values[1]);
  const co9 = Number(values[2]);
  chartHistory.push({ time: new Date(), alcohol135, co9, sum: alcohol135 + co9 });
  if (chartHistory.length > MAX_POINTS) chartHistory.shift();
  alcohol135Value.textContent = alcohol135;
  co9Value.textContent = co9;
  airQualityValue.textContent = alcohol135 + co9;
  charts.forEach(drawChart);
}

function drawChart(chart) {
  const { canvas, color, key, max } = chart;
  const context = canvas.getContext("2d");
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);

  const padding = { top: 10, right: 8, bottom: 20, left: 30 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  context.font = "10px Consolas, monospace";
  context.strokeStyle = "rgba(255, 255, 255, .10)";
  context.fillStyle = "#777a78";
  context.lineWidth = 1;

  [0, .5, 1].forEach((step) => {
    const y = padding.top + plotHeight * (1 - step);
    context.beginPath();
    context.moveTo(padding.left, y);
    context.lineTo(width - padding.right, y);
    context.stroke();
    context.fillText(Math.round(max * step), 0, y + 3);
  });

  if (chartHistory.length === 0) {
    context.fillText("Esperando datos", padding.left + 8, padding.top + plotHeight / 2);
    return;
  }

  const points = chartHistory.map((sample, index) => ({
    x: padding.left + (chartHistory.length === 1 ? plotWidth / 2 : index * plotWidth / (chartHistory.length - 1)),
    y: padding.top + plotHeight * (1 - sample[key] / max),
  }));
  context.beginPath();
  points.forEach((point, index) => index === 0 ? context.moveTo(point.x, point.y) : context.lineTo(point.x, point.y));
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.stroke();
  context.fillStyle = color;
  points.slice(-1).forEach((point) => {
    context.beginPath();
    context.arc(point.x, point.y, 3, 0, Math.PI * 2);
    context.fill();
  });
}

async function sendMessage(message) {
  if (!port?.writable) return;
  writer = port.writable.getWriter();
  await writer.write(new TextEncoder().encode(`${message}\n`));
  writer.releaseLock();
  writer = null;
  addLog(message, "sent");
}

connectButton.addEventListener("click", () => {
  if (port) disconnectFromArduino();
  else connectToArduino();
});

outputValue.addEventListener("input", () => {
  outputValueLabel.textContent = outputValue.value;
});
sendValueButton.addEventListener("click", () => sendMessage(`VALOR:${outputValue.value}`));
onButton.addEventListener("click", () => sendMessage("LED:ON"));
offButton.addEventListener("click", () => sendMessage("LED:OFF"));

commandForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const command = commandInput.value.trim();
  if (!command) return;
  sendMessage(command);
  commandInput.value = "";
});

clearLogButton.addEventListener("click", () => {
  serialLog.innerHTML = '<p class="log-empty">Los eventos aparecerán aquí.</p>';
});

if (!("serial" in navigator)) {
  browserNote.textContent = "Web Serial no está disponible en este navegador.";
}

window.addEventListener("resize", () => charts.forEach(drawChart));
charts.forEach(drawChart);

if ("serial" in navigator) {
  navigator.serial.addEventListener("disconnect", () => {
    if (port) disconnectFromArduino();
  });
}
