const int LED_PIN = 2;
const int SMOKE_A0_PIN = A0;
const int SMOKE_A1_PIN = A1;
unsigned long lastSensorRead = 0;
const unsigned long SENSOR_INTERVAL = 500;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  Serial.begin(9600);
  Serial.setTimeout(100);
  Serial.println("Arduino listo");
}

void loop() {
  if (millis() - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = millis();
    int alcohol135 = analogRead(SMOKE_A0_PIN);
    int CO9 = analogRead(SMOKE_A1_PIN);

    Serial.print("alcohol135:");
    Serial.print(alcohol135);
    Serial.print(",CO9:");
    Serial.println(CO9);
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
      Serial.print("alcohol135:");
      Serial.print(analogRead(SMOKE_A0_PIN));
      Serial.print(",CO9:");
      Serial.println(analogRead(SMOKE_A1_PIN));
    } else if (comando.length() > 0) {
      Serial.print("Comando no reconocido: ");
      Serial.println(comando);
    }
  }
}
