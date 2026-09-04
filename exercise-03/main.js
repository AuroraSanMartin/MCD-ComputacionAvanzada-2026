const BAUD_RATE = 9600;

let port = null;
let reader = null;
let writer = null;
let keepReading = false;
let receivedBuffer = "";

const connectButton = document.querySelector("#connect-button");
const connectionStatus = document.querySelector("#connection-status");
const statusDot = document.querySelector("#status-dot");
const portLabel = document.querySelector("#port-label");
const browserNote = document.querySelector("#browser-note");
const alcohol135Value = document.querySelector("#alcohol135-value");
const co9Value = document.querySelector("#co9-value");
const airQualityValue = document.querySelector("#air-quality-value");
const sensorValueElements = {
  oidoIzq: document.querySelector("#oido-izq-value"),
  oidoDer: document.querySelector("#oido-der-value"),
  ojoIzq: document.querySelector("#ojo-izq-value"),
  ojoDer: document.querySelector("#ojo-der-value"),
};
const alertList = document.querySelector("#alert-list");
const microphoneButton = document.querySelector("#microphone-button");
const microphoneStatus = document.querySelector("#microphone-status");
const decibelValue = document.querySelector("#decibel-value");
let audioContext = null;
let microphoneStream = null;
let analyser = null;
let microphoneFrame = null;
let microphoneHistory = [];
let serialAlerts = [];
let microphoneAlerts = [];
const chartHistory = [];
const MAX_POINTS = 60;

const charts = [
  { canvas: document.querySelector("#alcohol135-chart"), label: "alcohol135", color: "#e6a15c", max: 4095, key: "alcohol135" },
  { canvas: document.querySelector("#co9-chart"), label: "CO9", color: "#8db99c", max: 4095, key: "co9" },
  { canvas: document.querySelector("#air-quality-chart"), label: "Calidad del aire", color: "#d87866", max: 8190, key: "sum" },
];

function setConnectionState(state, message) {
  connectionStatus.textContent = message;
  statusDot.className = `status-dot ${state}`;
  connectButton.textContent = state === "connected" ? "Desconectar Arduino" : "Conectar Arduino";
}

async function connectToArduino() {
  if (!("serial" in navigator)) {
    setConnectionState("error", "No compatible");
    browserNote.textContent = "Web Serial requiere Chrome o Edge en una conexión segura (HTTPS o localhost).";
    return;
  }

  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: BAUD_RATE });
    const info = port.getInfo();
    portLabel.textContent = info.usbVendorId ? `USB ${info.usbVendorId}` : "Puerto serial";
    setConnectionState("connected", "Conectado");
    browserNote.textContent = `Velocidad: ${BAUD_RATE} baudios`;
    startReading();
  } catch (error) {
    if (error.name !== "NotFoundError") {
      port = null;
      setConnectionState("error", "Error de conexión");
      const message = error.name === "NetworkError"
        ? "El puerto está ocupado. Cierra el Monitor Serial de Arduino IDE y vuelve a intentar."
        : `No fue posible conectar: ${error.message}`;
      browserNote.textContent = message;
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
  } finally {
    reader.releaseLock();
    reader = null;
  }
}

function handleReceivedMessage(message) {
  updateSensorCharts(message);
}

function updateSensorCharts(message) {
  const values = message.match(/alcohol135:(\d+),CO9:(\d+),OidoIzq:(\d+),OidoDer:(\d+),OjoIzq:(\d+),OjoDer:(\d+),ALERTAS:(.*)/i);
  if (!values) return;

  const alcohol135 = Number(values[1]);
  const co9 = Number(values[2]);
  const sensors = {
    oidoIzq: Number(values[3]),
    oidoDer: Number(values[4]),
    ojoIzq: Number(values[5]),
    ojoDer: Number(values[6]),
  };
  chartHistory.push({ time: new Date(), alcohol135, co9, sum: alcohol135 + co9 });
  if (chartHistory.length > MAX_POINTS) chartHistory.shift();
  alcohol135Value.textContent = alcohol135;
  co9Value.textContent = co9;
  airQualityValue.textContent = alcohol135 + co9;
  Object.entries(sensors).forEach(([name, value]) => {
    sensorValueElements[name].textContent = value;
  });
  serialAlerts = values[7] === "ninguna" ? [] : values[7].split(";").filter(Boolean);
  renderAlerts();
  charts.forEach(drawChart);
}

function renderAlerts() {
  const activeAlerts = [...new Set([...serialAlerts, ...microphoneAlerts])];
  alertList.innerHTML = activeAlerts.length === 0
    ? "<li class=\"alert-none\">Sin alertas</li>"
    : activeAlerts.map((alert) => `<li>${formatAlert(alert)}</li>`).join("");
  alertList.classList.toggle("has-alert", activeAlerts.length > 0);
}

function formatAlert(alert) {
  const labels = {
    alcohol135_saturado: "alcohol135 sobresaturado",
    CO9_saturado: "CO9 sobresaturado",
    OidoIzq_saturado: "OidoIzq sobresaturado",
    OidoDer_saturado: "OidoDer sobresaturado",
    OjoIzq_saturado: "OjoIzq sobresaturado",
    OjoDer_saturado: "OjoDer sobresaturado",
    diferencia_izquierda_derecha: "Diferencia izquierda/derecha alta",
    diferencia_auditiva_izquierda_derecha: "Diferencia auditiva alta",
    parpadeo_iluminacion: "Parpadeo de iluminación detectado",
    microfono_nivel_alto: "Nivel alto de decibeles",
    microfono_parpadeante: "Ruido parpadeante detectado",
  };
  return labels[alert] ?? alert;
}

async function toggleMicrophone() {
  if (microphoneStream) {
    microphoneStream.getTracks().forEach((track) => track.stop());
    audioContext?.close();
    microphoneStream = null;
    cancelAnimationFrame(microphoneFrame);
    microphoneButton.textContent = "Activar micrófono";
    microphoneStatus.textContent = "Micrófono detenido";
    decibelValue.textContent = "---";
    microphoneHistory = [];
    microphoneAlerts = [];
    renderAlerts();
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    microphoneStatus.textContent = "Este navegador no permite usar el micrófono.";
    return;
  }

  try {
    microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    microphoneHistory = [];
    audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(microphoneStream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    microphoneButton.textContent = "Detener micrófono";
    microphoneStatus.textContent = "Escuchando · dB aproximados";
    readMicrophone();
  } catch (error) {
    microphoneStatus.textContent = error.name === "NotAllowedError"
      ? "Permiso de micrófono rechazado."
      : `No fue posible activar el micrófono: ${error.message}`;
  }
}

function readMicrophone() {
  if (!analyser || !microphoneStream) return;
  const samples = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(samples);
  let sum = 0;
  samples.forEach((sample) => {
    const normalized = (sample - 128) / 128;
    sum += normalized * normalized;
  });
  const rms = Math.sqrt(sum / samples.length);
  const decibels = Math.max(0, Math.round(20 * Math.log10(Math.max(rms, 0.00001)) + 90));
  decibelValue.textContent = `${decibels} dB`;
  microphoneHistory.push(decibels);
  if (microphoneHistory.length > 12) microphoneHistory.shift();
  const isHigh = decibels >= 75;
  const isFlickering = isMicrophoneFlickering();
  microphoneAlerts = [
    ...(isHigh ? ["microfono_nivel_alto"] : []),
    ...(isFlickering ? ["microfono_parpadeante"] : []),
  ];
  renderAlerts();
  microphoneFrame = requestAnimationFrame(readMicrophone);
}

function isMicrophoneFlickering() {
  if (microphoneHistory.length < 8) return false;
  let directionChanges = 0;
  for (let index = 2; index < microphoneHistory.length; index++) {
    const previousChange = microphoneHistory[index - 1] - microphoneHistory[index - 2];
    const change = microphoneHistory[index] - microphoneHistory[index - 1];
    if (Math.abs(previousChange) >= 3 && Math.abs(change) >= 3 && Math.sign(previousChange) !== Math.sign(change)) {
      directionChanges++;
    }
  }
  return directionChanges >= 4;
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
}

connectButton.addEventListener("click", () => {
  if (port) disconnectFromArduino();
  else connectToArduino();
});

microphoneButton.addEventListener("click", toggleMicrophone);

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
