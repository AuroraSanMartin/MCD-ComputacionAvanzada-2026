# Ejercicio 02: Clima de Santiago

Visualización 3D del cambio de temperatura en Santiago de Chile usando datos
horarios de [Open-Meteo](https://open-meteo.com/).

La aplicación consulta un día pasado y un día de pronóstico. Cada módulo
representa una hora: la altura y el color corresponden a la temperatura, el
ancho representa la humedad relativa y el inspector muestra lluvia y viento.

Para ejecutarla, abre `index.html` con Live Server. Si no hay conexión, se usa
una serie climática sintética de respaldo..

## Riesgo estimado

La torre naranja usa como referencia el estudio [Influence of temperature
changes on migraine occurrence in Germany](https://doi.org/10.1007/s00484-012-0582-2).
Su escala aplica 19% por cada 5 °C de aumento y 24% por cada 5 °C de descenso,
con un máximo visual de 100%. Es una asociación poblacional del estudio, no un
diagnóstico médico individual.
