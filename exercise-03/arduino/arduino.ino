const int LED_PIN = 2;
const int SMOKE_A0_PIN = A0;
const int SMOKE_A1_PIN = A1;
const int OJO_IZQ_PIN = A4;
const int OJO_DER_PIN = A3;

const int SATURATION_THRESHOLD = 3600;
const int DIFFERENCE_THRESHOLD = 1000;
const int LIGHT_FLICKER_DELTA = 120;
const int LIGHT_FLICKER_CHANGES_REQUIRED = 5;
const int LIGHT_HISTORY_SIZE = 12;

unsigned long lastSensorRead = 0;
unsigned long lastLightSample = 0;
const unsigned long SENSOR_INTERVAL = 150;
const unsigned long LIGHT_SAMPLE_INTERVAL = 20;
int ojoIzqHistory[LIGHT_HISTORY_SIZE];
int ojoDerHistory[LIGHT_HISTORY_SIZE];
int lightHistoryIndex = 0;
int lightHistoryCount = 0;
int ojoIzqActual = 0;
int ojoDerActual = 0;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  Serial.begin(9600);
  Serial.setTimeout(100);
  analogReadResolution(12);
  Serial.println("Arduino listo");
}

void loop() {
  if (millis() - lastLightSample >= LIGHT_SAMPLE_INTERVAL) {
    lastLightSample = millis();
    ojoIzqActual = analogRead(OJO_IZQ_PIN);
    ojoDerActual = analogRead(OJO_DER_PIN);
    addLightHistory(ojoIzqActual, ojoDerActual);
  }

  if (millis() - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = millis();
    int alcohol135 = analogRead(SMOKE_A0_PIN);
    int CO9 = analogRead(SMOKE_A1_PIN);

    sendSensorData(alcohol135, CO9, ojoIzqActual, ojoDerActual);
  }

  if (Serial.available()) {
    String comando = Serial.readStringUntil('\n');
    comando.trim();

    if (comando == "LED:ON") {
      digitalWrite(LED_PIN, HIGH);
      Serial.println("LED encendido");
    } else if (comando == "LED:OFF") {
      digitalWrite(LED_PIN, LOW);
      Serial.println("LED apagado");
    } else if (comando.startsWith("VALOR:")) {
      int valor = comando.substring(6).toInt();
      valor = constrain(valor, 0, 100);
      analogWrite(LED_PIN, map(valor, 0, 100, 0, 255));
      Serial.print("Valor recibido: ");
      Serial.println(valor);
    } else if (comando == "SENSORES?") {
      sendCurrentSensorData();
    } else if (comando.length() > 0) {
      Serial.print("Comando no reconocido: ");
      Serial.println(comando);
    }
  }
}

void addLightHistory(int ojoIzq, int ojoDer) {
  ojoIzqHistory[lightHistoryIndex] = ojoIzq;
  ojoDerHistory[lightHistoryIndex] = ojoDer;
  lightHistoryIndex = (lightHistoryIndex + 1) % LIGHT_HISTORY_SIZE;
  if (lightHistoryCount < LIGHT_HISTORY_SIZE) lightHistoryCount++;
}

bool isLightFlickering(const int history[]) {
  if (lightHistoryCount < LIGHT_HISTORY_SIZE) return false;

  int directionChanges = 0;
  for (int offset = 2; offset < LIGHT_HISTORY_SIZE; offset++) {
    int currentIndex = (lightHistoryIndex + offset) % LIGHT_HISTORY_SIZE;
    int previousIndex = (lightHistoryIndex + offset - 1) % LIGHT_HISTORY_SIZE;
    int beforeIndex = (lightHistoryIndex + offset - 2) % LIGHT_HISTORY_SIZE;
    int previousChange = history[previousIndex] - history[beforeIndex];
    int change = history[currentIndex] - history[previousIndex];

    if (abs(previousChange) >= LIGHT_FLICKER_DELTA &&
        abs(change) >= LIGHT_FLICKER_DELTA &&
        ((previousChange > 0 && change < 0) || (previousChange < 0 && change > 0))) {
      directionChanges++;
    }
  }
  return directionChanges >= LIGHT_FLICKER_CHANGES_REQUIRED;
}

void printAlert(bool &hasAlert, const char *label) {
  if (hasAlert) Serial.print(";");
  Serial.print(label);
  hasAlert = true;
}

void sendSensorData(int alcohol135, int CO9, int ojoIzq, int ojoDer) {
  bool hasAlert = false;
  Serial.print("alcohol135:");
  Serial.print(alcohol135);
  Serial.print(",CO9:");
  Serial.print(CO9);
  Serial.print(",OjoIzq:");
  Serial.print(ojoIzq);
  Serial.print(",OjoDer:");
  Serial.print(ojoDer);
  Serial.print(",ALERTAS:");

  if (alcohol135 >= SATURATION_THRESHOLD) printAlert(hasAlert, "alcohol135_saturado");
  if (CO9 >= SATURATION_THRESHOLD) printAlert(hasAlert, "CO9_saturado");
  if (ojoIzq >= SATURATION_THRESHOLD) printAlert(hasAlert, "OjoIzq_saturado");
  if (ojoDer >= SATURATION_THRESHOLD) printAlert(hasAlert, "OjoDer_saturado");
  if (abs(ojoIzq - ojoDer) >= DIFFERENCE_THRESHOLD) {
    printAlert(hasAlert, "diferencia_izquierda_derecha");
  }
  if (isLightFlickering(ojoIzqHistory) || isLightFlickering(ojoDerHistory)) {
    printAlert(hasAlert, "parpadeo_iluminacion");
  }
  if (!hasAlert) Serial.print("ninguna");
  Serial.println();
}

void sendCurrentSensorData() {
  sendSensorData(analogRead(SMOKE_A0_PIN), analogRead(SMOKE_A1_PIN), ojoIzqActual, ojoDerActual);
}
