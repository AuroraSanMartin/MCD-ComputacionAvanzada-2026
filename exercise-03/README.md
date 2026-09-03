# Exercise 03 · Puente serial con Arduino

Base de HTML, CSS y JavaScript estático para conectar una placa Arduino al navegador mediante Web Serial.

## Uso

1. Abre `arduino/arduino.ino` en Arduino IDE y carga el sketch en la placa.
2. Abre `index.html` en Chrome o Edge usando `localhost` o una página HTTPS.
3. Presiona **Conectar Arduino** y elige el puerto de la placa.
4. Usa los controles para enviar comandos y observa los datos recibidos en el registro.

La comunicación usa `9600` baudios y mensajes de texto terminados en `\\n`. El sensor `alcohol135` está conectado a `A0` y el sensor `CO9` a `A1`; ambos se leen cada 500 ms.

## Comandos incluidos

- `VALOR:0` a `VALOR:100`
- `LED:ON`
- `LED:OFF`
- `SENSORES?`
- Cualquier texto escrito en el comando manual

El sketch debe leer cada línea y decidir qué hacer con ella. Para enviar datos hacia la página, Arduino debe usar `Serial.println(...)`.

La lectura automática tiene este formato: `alcohol135:345,CO9:512`. La página interpreta ese formato y actualiza los gráficos `Perfume`, `Monóxido de carbono` y `Calidad del aire`. Este último representa `alcohol135 + CO9`.

Si la página responde "LED encendido" pero el LED no cambia, confirma que seleccionaste la placa y el puerto correctos en Arduino IDE. Algunas placas usan lógica invertida para el LED integrado; en ese caso intercambia `HIGH` y `LOW` en las dos llamadas de `digitalWrite`.

## Restricciones del navegador

Web Serial necesita Chrome o Edge y un contexto seguro: `localhost` o HTTPS. Al abrir el archivo directamente puede no estar disponible; desde la carpeta del repositorio se puede iniciar un servidor local con:

```text
python -m http.server 8000
```

Luego visita `http://localhost:8000/exercise-03/`.
