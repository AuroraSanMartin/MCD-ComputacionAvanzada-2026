# AI Usage Log

Documenta de manera breve cuándo y para qué utilizaste asistentes de IA. El objetivo no es registrar cada mensaje, sino mantener trazabilidad sobre decisiones importantes.

## Registro

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
