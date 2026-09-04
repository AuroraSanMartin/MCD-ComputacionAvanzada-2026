# AI Usage Log

Documenta de manera breve cuándo y para qué utilizaste asistentes de IA. El objetivo no es registrar cada mensaje, sino mantener trazabilidad sobre decisiones importantes.

## Registro

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Quitar el panel de alertas y mostrar la sobrecarga de cada sensor con rectángulos tipo semáforo"

**Qué cambió en el proyecto:**
Se eliminó el panel de alertas y cada lectura del panel derecho ahora usa borde verde, amarillo o rojo según su estado. El micrófono y la calidad del aire también muestran su estado mediante el mismo sistema.

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Agregar un gradiente circular blanco que aparezca desde el centro junto al desenfoque"

**Qué cambió en el proyecto:**
Se añadió una capa radial blanca centrada en el panel visual. Su tamaño y opacidad aumentan con la calidad del aire, acompañando el desenfoque del manto.

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Iniciar el desenfoque del manto cuando la calidad del aire supere 800"

**Qué cambió en el proyecto:**
El umbral de desenfoque se ajustó a `800`; desde ese valor hasta `8190`, el desenfoque aumenta gradualmente hasta 10 píxeles.

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Desenfocar la vista del manto según el valor de calidad del aire"

**Qué cambió en el proyecto:**
La suma de alcohol135 y CO9 ahora controla un desenfoque gradual del manto, desde 0 hasta 10 píxeles. El desenfoque no afecta las lecturas, alertas ni controles del panel derecho.

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Corregir el parpadeo que continuaba aunque los valores no cambiaran más de 30"

**Qué cambió en el proyecto:**
Se eliminó el temporizador autónomo del parpadeo suave. Ahora cada gradiente solo recibe un nuevo objetivo cuando su lectura estable cambia más de 30 unidades; las lecturas menores conservan la intensidad actual.

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Reducir la sensibilidad: cambios de 30 o menos no deben modificar la intensidad de los gradientes"

**Qué cambió en el proyecto:**
Se agregó una zona muerta de 30 unidades por ojo. La interfaz sigue mostrando el valor instantáneo, pero el manto y la intensidad de sobrecarga usan una lectura estable hasta que el cambio supera 30.

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Hacer gradual el cambio de intensidad del parpadeo cuando no hay sobresaturación"

**Qué cambió en el proyecto:**
Los niveles de parpadeo siguen siendo 100%, 75%, 25% y 0%, pero ahora funcionan como objetivos interpolados por frame. El brillo de cada gradiente se desplaza gradualmente hacia el siguiente nivel.

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Corregir el parpadeo que continuaba con lecturas cercanas a 1300 en ambos ojos"

**Qué cambió en el proyecto:**
Se eliminó la alerta histórica de fluctuación como disparador del manto. Ahora el parpadeo visual depende exclusivamente de lectura menor a 1000 o diferencia izquierda/derecha de al menos 500.

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Activar el parpadeo cuando la lectura de luz sea menor a 1000 o la diferencia entre ojos sea de al menos 500, con distintas intensidades"

**Qué cambió en el proyecto:**
Se agregaron los umbrales `1000` y `500` en Arduino y navegador. La severidad visual ahora escala de `0.25` a `1`, modificando la velocidad y la intensidad del parpadeo.

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Hacer el parpadeo más rápido y brillante, variando entre 100%, 75%, 25% y 0%"

**Qué cambió en el proyecto:**
El parpadeo de baja luz ahora cambia cada 35–95 ms entre cuatro niveles discretos de brillo. Se aumentó la opacidad máxima de los gradientes y se redujo la transición visual para que la variación sea más rápida y evidente.

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Hacer que el gradiente sea más brillante y parpadee levemente cuando el valor de cada ojo sea muy bajo"

**Qué cambió en el proyecto:**
Los gradientes ahora alcanzan mayor brillo con lecturas LDR bajas y tienen una oscilación suave independiente para cada ojo. El parpadeo fuerte de sobrecarga visual se conserva por separado.

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Hacer que ambos gradientes cubran toda la pantalla y no solo el manto"

**Qué cambió en el proyecto:**
Se agregaron dos capas de gradiente que cubren todo el panel visual izquierdo, una desde cada borde hacia el centro. Su opacidad sigue las lecturas invertidas de OjoIzq y OjoDer y conserva el parpadeo por sobrecarga visual.

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Hacer que ambos gradientes vayan desde los bordes hacia el centro y sean transparentes en el centro"

**Qué cambió en el proyecto:**
El perfil espacial de los gradientes ahora usa la distancia al centro: cada lado comienza visible en su borde y se desvanece hasta fuerza cero en la línea central.

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Invertir la interpretación de los LDR porque un valor alto significa menos luz"

**Qué cambió en el proyecto:**
Los gradientes de OjoIzq y OjoDer ahora usan la lectura invertida: valores bajos representan más luz y valores altos atenúan el gradiente.

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Agregar dos gradientes laterales controlados por cada ojo y hacerlos parpadear ante sobrecarga visual"

**Qué cambió en el proyecto:**
El manto Three.js ahora mezcla un gradiente desde cada borde hacia el centro según OjoIzq y OjoDer. Cuando Arduino informa sobrecarga visual, ambos gradientes cambian su visibilidad de forma irregular para producir un parpadeo impredecible.

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Mover las lecturas de sensores al lado derecho y agruparlas de a dos"

**Qué cambió en el proyecto:**
Las lecturas numéricas se movieron al panel derecho y se organizaron como Perfume/CO9, OjoIzq/OjoDer y OidoIzq/OidoDer. La suma de calidad del aire queda como valor derivado debajo de los pares.

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Quitar los gráficos de lecturas y mostrarlas como números enteros actualizados en el panel izquierdo"

**Qué cambió en el proyecto:**
Se retiraron los tres gráficos de lecturas y su código de dibujo. El panel izquierdo ahora muestra como enteros alcohol135, CO9, OidoIzq, OidoDer, OjoIzq, OjoDer y la suma de calidad del aire.

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Cambiar la amplitud de la onda nueva según el cambio de lectura de ambos oídos, sin alterar las ondas existentes"

**Qué cambió en el proyecto:**
Cada cambio de lectura crea una nueva onda independiente cuya amplitud depende de la diferencia respecto de la lectura anterior. Las ondas que ya están viajando mantienen su amplitud original hasta llegar al centro.

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Hacer que las ondas se creen constantemente y no mediante pulsos"

**Qué cambió en el proyecto:**
Se reemplazó la animación por pulsos reiniciables por una onda continua cuya fase avanza permanentemente hacia el centro del manto.

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Amplificar 100 veces más la amplitud de la onda sobre el manto"

**Qué cambió en el proyecto:**
Se agregó `WAVE_AMPLITUDE_MULTIPLIER = 100` en la visualización Three.js para multiplicar directamente la deformación producida por los sensores auditivos.

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Aumentar la sensibilidad del manto e invertir 180 grados el gradiente y las ondas"

**Qué cambió en el proyecto:**
Se amplificó la respuesta visual a los sensores auditivos, se agregaron pulsos secundarios para un movimiento más alterado y se invirtieron el gradiente vertical y el sentido de propagación de las ondas.

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Acostar el manto y hacer que el pulso se siga esparciendo hasta llegar al centro"

**Qué cambió en el proyecto:**
Se ajustó la cámara Three.js a una vista más horizontal, se aumentó la densidad de la malla y se reemplazó la onda continua por pulsos que avanzan desde cada borde hacia el centro con amplitud decreciente.

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Visualizar ambos oídos con un manto Three.js dividido horizontalmente y ondas que se unen en el centro"

**Qué cambió en el proyecto:**
Se agregó una superficie Three.js que usa OidoIzq y OidoDer para deformar dos ondas opuestas. La onda superior viaja desde la izquierda y la inferior desde la derecha; ambas reducen su amplitud hasta una línea central inmóvil.

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Agregar nuevamente dos sensores auditivos análogos en A7 y A6, llamados OidoIzq y OidoDer"

**Qué cambió en el proyecto:**
Se reincorporaron las lecturas analógicas OidoIzq en A7 y OidoDer en A6, junto con sus valores visibles y alertas de saturación y diferencia izquierda/derecha. El micrófono del computador y sus controles se mantienen.

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Acelerar la lectura para detectar parpadeo en la iluminación como sobrecarga sensorial"

**Qué cambió en el proyecto:**
Los LDR ahora se muestrean cada 20 ms y se analizan en una ventana de cambios alternados. Se agregó la alerta `parpadeo_iluminacion` y la transmisión serial se limita a cada 150 ms para evitar saturar el puerto.

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Quitar los sensores BigSound y usar el micrófono del computador para detectar decibeles y sobrecarga sensorial"

**Qué cambió en el proyecto:**
Se eliminaron los BigSound del sketch y del protocolo. La página ahora usa el micrófono del computador para estimar decibeles y detectar niveles altos o ruido parpadeante.

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Corregir la escala de sobrecarga a 4095 y reconocer diferencias en sensores BigSound digitales"

**Qué cambió en el proyecto:**
Se cambió la escala analógica a 12 bits, se elevó el umbral de saturación visual a 3600 y los BigSound ahora se leen mediante sus salidas digitales DO, con detección de estados distintos y cambios repetitivos.

### 04-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Agregar sensores Big Sound y LDR, leerlos en Arduino, mostrar sus valores y avisar sobre saturación, diferencias izquierda/derecha y parpadeos constantes"

**Qué cambió en el proyecto:**
Se agregaron las lecturas de OidoIzq (A6), OidoDer (A5), OjoIzq (A4) y OjoDer (A3), junto con detección de saturación, diferencias entre lados y oscilaciones repetitivas. La interfaz ahora muestra los valores y las alertas en tiempo real.

### 02-09-2026 - Exercise-03

**Herramienta / agente:**
Copilot
**Qué pedí:**
"Crea la base para una página con javascript, html y css en Exercise-03 que se pueda conectar a Arduino IDE"

**Qué cambió en el proyecto:**
Se creó una interfaz estática con Web Serial para conectar una placa Arduino desde Chrome o Edge, enviar comandos de texto y mostrar datos recibidos. También se documentó el protocolo inicial, la velocidad serial de 9600 baudios y el uso de un servidor local.

### 21-08-2026 - Lab02

**Herramienta / agente:**  
Copilot
**Qué pedí:**
"Mi código genera torres de las cuales la altura cambia según la posición respecto a la onda que se encuentra en el espacio. Quiero que cada torre se subdivida por la variable "Visual". Esta determina que cada torre está formada por cubos de base "Visual x Visual", manteniendo el mismo ancho total."

"Agrega un slider para cambiar el valor de Visual, que sea entre 1 y 5"

"Ahora quiero que cada cubo tenga un fillet que pueda ser controlado con la variable "ruido", la cual también tendrá su propio slider que vaya desde 0 a 0.49, correspondiente al porcentaje del ancho de cada cubo que sería fillet"

"quiero que las torres en vez de seguir un orden cartesiano, sigan un orden con coordenadas polares"

"quiero que la onda que define las alturas se llame "contraste" y que junte la amplitud con la frecuencia. Quiero que la onda sea leve al inicio y más grande mientras más se aleje del centro"

"quiero que este cambio también se vea en los sliders"

"Quiero que exista como valor no modificable que las columnas sean 15, las filas sean 10 y la separación sea 1. También quiero que la rotación sea respecto al centro y esto no se pueda modificar."

"Quita los sliders. Ahora quiero que la varialbe "calor" haga que cada bloque dentro de cada torre pueda girar y cambiar el tamaño de cada bloque sin que estos sean más grandes que el tamaño actual. Este tamaño y giro es aleatorio, y es más notable mientras más grande sea el valor de "calor". Agrega un slider para "calor"."

"Quiero una última variable con slider llamada "olor", la cual cambia el color de cada cubo de forma aleatoria. Mientras mayor sea el valor de "olor", más distintos serán los colores de los cubos. Si el valor es 0, todos los cubos se mantendrán del color actual"

"Agrega una última variable llamada "migraña" con su propia slider. Esta irá del 0 al 1. En 0, la semilla se mantiene constante. En 1, la semilla cambiará cada 0.1 segundos"

"quiero que la cámara encuadre la figura generada de forma que no se puedan ver los bordes de esta, o sea que el Zoom no se aleje tanto de la figura y haya un tope al girar la cámara"

"quita la sección de "Sistema" ya que ya no tiene sliders. Haz que la camara se aleje aún menos de la figura"

"quita la grilla base y haz que la figura formada se refleje hacia abajo"

"Quiero que en el resultado final donde dice "Campo Generativo 01" diga "Visualizador de Migraña", y abajo cambia la descripción por "Lab02; Aurora San martín""

"Quiero que el color de "Lab02; Aurora San Martín" sea en negro y que el texto de "Visualizador de migraña" no se corte a una siguiente linea, sino que se mantenga continuo"

"Devuelve todos los colores a como estaban antes menos el de "Lab02; Aurora San martín""

**Qué cambió en el proyecto:**  
Modificó el código base para que generar molestia visual mediante aleatoriedad en ruido, rotación, tamaño y color, como una forma de visualizar la migraña con variables ambientales, actualmente controladas mediante sliders. Se agregaron variables como ruido, visual, olor, migraña y calor, mientras que se fijaron otras como "columna" y "fila" del código base. Se cambió la distribución de las columnas, de utilizar coordenadas cartesianas a polares. Se limitó la rotación y el zoom de la cámara. Se eliminó la grilla base. También modifiqué levemente los colores de la interfaz final para facilitar la lectura.
**Qué revisé o corregí manualmente:**  
Corregí manualmente errores ortográficos o de escritura, como martín->Martín y ruido/fillet por solamente ruido.
**Qué aprendí / qué error apareció:**  
Especifidad al escribir, utilizar términos lo más literales posibles.

### 26-08-2026 - Exercise-02

**Herramienta / agente:**  
Copilot
**Qué pedí:**
"Cambia Exercise-02 para que visualice el clima de Santiago, Chile usando datos horarios de Open-Meteo."

**Qué cambió en el proyecto:**  
Se reemplazó el feed GBFS de bicicletas por una consulta horaria de Open-Meteo. La geometría ahora representa horas de clima: temperatura en altura y color, humedad en ancho, y lluvia y viento en el inspector.

### 28-08-2026 - Exercise-02

**Herramienta / agente:**  
Copilot
**Qué pedí:**
"Quita el slider de cantidad de horas y escala horizontal. Subdivide cada torre según sus grados Celsius, muestra la temperatura sobre ella y agrega el porcentaje de riesgo de migraña al panel derecho."

**Qué cambió en el proyecto:**  
Se fijó el ancho de las torres, se muestran todas las horas disponibles, y cada torre incorpora divisiones por grado Celsius y una etiqueta de temperatura. El riesgo de migraña ahora se calcula también para las estaciones visibles y aparece en el inspector.

### 29-08-2026 - Exercise-02

**Herramienta / agente:**  
Copilot
**Qué pedí:**
"Agrégalo. También agrega un bloque junto a la información de la derecha que diga los decibeles actuales y cuánto tiempo con la cantidad de decibeles actuales puede ser peligroso."

**Qué cambió en el proyecto:**  
Se incorporó un medidor de sonido en el panel derecho con acceso al micrófono del navegador, lectura en tiempo real de nivel de ruido, una barra visual y un cálculo estimado de tiempo de exposición peligroso según el nivel actual. La interfaz conserva el estilo del ejercicio y se integra al panel de información del clima.
