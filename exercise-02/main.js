import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// ======================================================
// 01 — CONFIGURACIÓN
// ======================================================
// Open-Meteo entrega observaciones horarias y pronóstico sin API key.
const URL_CLIMA =
  "https://api.open-meteo.com/v1/forecast?latitude=-33.4569&longitude=-70.6483&hourly=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m&past_days=1&forecast_days=1&timezone=America%2FSantiago";

const INTERVALO_ACTUALIZACION = 15; // segundos.

const parametros = {
  modo: "temporal",
  escalaAltura: 0.5,
};

let actualizacionAutomatica = true;
let segundosRestantes = INTERVALO_ACTUALIZACION;
let estaciones = [];
let variaciones = [];
let objetosEstacion = [];
let periodoVisible = "am";

// ======================================================
// 02 — ESCENA
// ======================================================

const viewport = document.querySelector("#viewport");
const escena = new THREE.Scene();
escena.background = new THREE.Color(0x0b0b0c);

const camara = new THREE.PerspectiveCamera(
  42,
  viewport.clientWidth / viewport.clientHeight,
  0.1,
  300
);
camara.position.set(18, 46, 24);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
viewport.appendChild(renderer.domElement);

const controlesOrbita = new OrbitControls(camara, renderer.domElement);
controlesOrbita.enableDamping = true;
controlesOrbita.target.set(0, 2, 0);

escena.add(new THREE.HemisphereLight(0xf2eee4, 0x1f2228, 1.8));

const luzPrincipal = new THREE.DirectionalLight(0xffffff, 2.7);
luzPrincipal.position.set(18, 28, 14);
luzPrincipal.castShadow = true;
escena.add(luzPrincipal);

const suelo = new THREE.Mesh(
  new THREE.PlaneGeometry(90, 90),
  new THREE.MeshStandardMaterial({ color: 0x101114, roughness: 1 })
);
suelo.rotation.x = -Math.PI / 2;
suelo.position.y = -0.02;
suelo.receiveShadow = true;
escena.add(suelo);

const grilla = new THREE.GridHelper(70, 70, 0x34383d, 0x1e2024);
grilla.position.y = 0.001;
escena.add(grilla);

const grupoEstaciones = new THREE.Group();
escena.add(grupoEstaciones);

const grupoVariaciones = new THREE.Group();
escena.add(grupoVariaciones);

const grupoBaseGeografica = new THREE.Group();
escena.add(grupoBaseGeografica);

const botonTemperatura = document.querySelector("#alternar-temperatura");
botonTemperatura.addEventListener("click", () => {
  grupoEstaciones.visible = !grupoEstaciones.visible;
  botonTemperatura.setAttribute("aria-pressed", String(grupoEstaciones.visible));
});

const botonPeriodo = document.querySelector("#alternar-periodo");
botonPeriodo.addEventListener("click", () => {
  periodoVisible = periodoVisible === "am" ? "pm" : "am";
  botonPeriodo.textContent = periodoVisible === "am" ? "Mostrar PM" : "Mostrar AM";
  botonPeriodo.setAttribute("aria-pressed", String(periodoVisible === "pm"));
  generarRepresentacion();
});

const botonMigrana = document.querySelector("#alternar-migrana");
botonMigrana.addEventListener("click", () => {
  grupoVariaciones.visible = !grupoVariaciones.visible;
  botonMigrana.setAttribute("aria-pressed", String(grupoVariaciones.visible));
});

// ======================================================
// 03 — DATOS: FETCH + FALLBACK
// ======================================================

async function cargarDatosVivos() {
  actualizarEstadoConexion("conectando");

  try {
    const respuesta = await fetch(URL_CLIMA, { cache: "no-store" });

    if (!respuesta.ok) {
      throw new Error("La API respondió con un estado no válido.");
    }

    const datos = await respuesta.json();

    const mediciones = convertirDatosClima(datos);
    const indiceActual = Math.max(
      0,
      mediciones.findIndex((medicion) => new Date(medicion.tiempo) >= new Date())
    );
    const indiceInicioDia = Math.max(
      0,
      mediciones
        .slice(0, indiceActual + 1)
        .findLastIndex((medicion) => medicion.tiempo.slice(11, 13) === "00")
    );
    estaciones = calcularVariaciones(
      mediciones.slice(indiceInicioDia, indiceInicioDia + 24)
    );
    variaciones = calcularVariaciones(
      mediciones.slice(Math.max(0, indiceInicioDia - 24), indiceInicioDia)
    );
    actualizarEstadoConexion("vivo");
    document.querySelector("#fuente-label").textContent = "Open-Meteo · Santiago";
    document.querySelector("#actualizacion-label").textContent =
      formatearHora(datos.current?.time);

    generarRepresentacion();
  } catch (error) {
    console.warn("No fue posible usar el feed vivo. Se utilizará el dataset local.", error);
    await cargarRespaldoLocal();
  }
}

async function cargarRespaldoLocal() {
  estaciones = calcularVariaciones(crearRespaldoClimatico());
  variaciones = estaciones;
  actualizarEstadoConexion("respaldo");
  document.querySelector("#fuente-label").textContent = "Datos sintéticos · respaldo";
  document.querySelector("#actualizacion-label").textContent = "sin conexión";

  generarRepresentacion();
}

function convertirDatosClima(datos) {
  const horas = datos.hourly?.time ?? [];
  return horas.map((tiempo, indice) => ({
    id: `santiago-${indice}`,
    nombre: formatearHora(tiempo),
    tiempo,
    temperatura: datos.hourly.temperature_2m[indice],
    humedad: datos.hourly.relative_humidity_2m[indice],
    lluvia: datos.hourly.rain[indice],
    precipitacion: datos.hourly.precipitation[indice],
    viento: datos.hourly.wind_speed_10m[indice],
    lat: datos.latitude,
    lon: datos.longitude,
  }));
}

function calcularVariaciones(mediciones) {
  return mediciones.map((medicion, indice) => ({
    ...medicion,
    variacion: indice === 0
      ? 0
      : medicion.temperatura - mediciones[indice - 1].temperatura,
    riesgoMigrana: calcularRiesgoMigrana(
      indice === 0 ? 0 : medicion.temperatura - mediciones[indice - 1].temperatura
    ),
  }));
}

function calcularRiesgoMigrana(cambioTemperatura) {
  const porcentajePorGrado = cambioTemperatura < 0 ? 24 / 5 : 19 / 5;
  return Math.min(100, Math.abs(cambioTemperatura) * porcentajePorGrado);
}

function crearRespaldoClimatico() {
  return Array.from({ length: 24 }, (_, indice) => {
    const tiempo = new Date(Date.now() + indice * 60 * 60 * 1000).toISOString();

    return {
      id: `respaldo-${indice}`,
      nombre: formatearHora(tiempo),
      tiempo,
      temperatura: 9 + Math.sin((indice / 24) * Math.PI * 2) * 5,
      humedad: 72 - Math.sin((indice / 24) * Math.PI * 2) * 18,
      lluvia: 0,
      precipitacion: 0,
      viento: 5,
      lat: -33.4569,
      lon: -70.6483,
    };
  });
}

// ======================================================
// 04 — REGLAS: INPUT → RELACIÓN → OUTPUT
// ======================================================

function calcularIntensidadTemperatura(estacion) {
  const temperaturas = estaciones.map((medicion) => medicion.temperatura);
  const minimo = Math.min(...temperaturas);
  const maximo = Math.max(...temperaturas);
  return maximo > minimo
    ? (estacion.temperatura - minimo) / (maximo - minimo)
    : 0.5;
}

function proyectarGeograficamente(estacionesSeleccionadas) {
  const radio = 6;

  return estacionesSeleccionadas.map((estacion) => {
    const hora = Number(estacion.tiempo?.slice(11, 13) ?? 0);
    const horaReloj = hora % 12;
    const angulo = (horaReloj / 12) * Math.PI * 2 - Math.PI / 2;

    return {
      ...estacion,
      x: Math.cos(angulo) * radio,
      z: Math.sin(angulo) * radio,
    };
  });
}

function ordenarPorTemperatura(estacionesSeleccionadas) {
  const ordenadas = [...estacionesSeleccionadas].sort(
    (a, b) => b.temperatura - a.temperatura
  );

  const columnas = Math.ceil(Math.sqrt(ordenadas.length));
  const separacion = 2.0;

  return ordenadas.map((estacion, indice) => {
    const columna = indice % columnas;
    const fila = Math.floor(indice / columnas);

    return {
      ...estacion,
      x: (columna - columnas / 2) * separacion,
      z: (fila - columnas / 2) * separacion,
    };
  });
}

function generarRepresentacion() {
  limpiarRepresentacion();

  const seleccion = seleccionarEstaciones(estaciones).filter((estacion) => {
    const hora = Number(estacion.tiempo?.slice(11, 13) ?? 0);
    return (hora < 12 ? "am" : "pm") === periodoVisible;
  });

  const distribuidas =
    parametros.modo === "temporal"
      ? proyectarGeograficamente(seleccion)
      : ordenarPorTemperatura(seleccion);

  actualizarBaseGeografica(distribuidas);
  distribuidas.forEach((medicion) => crearModuloEstacion(medicion));

  if (variaciones.length > 0) {
    const riesgoPromedio =
      variaciones.reduce((total, medicion) => total + medicion.riesgoMigrana, 0) /
      variaciones.length;
    crearGraficoRiesgo(riesgoPromedio);
  }
}

function crearGraficoRiesgo(riesgo) {
  const grupo = new THREE.Group();
  const riesgoNormalizado = Math.min(100, Math.max(0, riesgo)) / 100;
  const radio = 2.3;

  [
    { inicio: -Math.PI / 2, proporcion: riesgoNormalizado, color: 0xe48b57 },
    {
      inicio: -Math.PI / 2 + riesgoNormalizado * Math.PI * 2,
      proporcion: 1 - riesgoNormalizado,
      color: 0x34383e,
    },
  ].forEach(({ inicio, proporcion, color }) => {
    if (proporcion <= 0) return;
    const sector = new THREE.Mesh(
      new THREE.CircleGeometry(radio, 48, inicio, proporcion * Math.PI * 2),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
    );
    sector.rotation.x = -Math.PI / 2;
    sector.position.y = 0.08;
    grupo.add(sector);
  });

  const etiqueta = crearEtiquetaSuelo(
    `Riesgo ${riesgo.toFixed(1)}%`,
    0,
    0,
    22,
    3.8,
    0.9
  );
  etiqueta.position.y = 0.35;
  grupo.add(etiqueta);
  grupoVariaciones.add(grupo);
}

function seleccionarEstaciones(lista) {
  // Elegimos un conjunto estable y suficientemente representativo.
  // Ordenar por capacidad evita que el subconjunto dependa del orden arbitrario del feed.
  return [...lista].sort(
    (a, b) => new Date(a.tiempo ?? 0) - new Date(b.tiempo ?? 0)
  );
}

function crearModuloEstacion(
  estacion,
  grupoDestino = grupoEstaciones,
  esVariacion = false,
  esCentral = false
) {
  const intensidadTemperatura = calcularIntensidadTemperatura(estacion);

  // REGLA 1:
  // capacidad total → altura total del contenedor.
  const alturaTotal = esVariacion && esCentral
    ? 5
    : esVariacion
      ? Math.max(0.3, estacion.riesgoMigrana * parametros.escalaAltura / 20)
        : Math.max(
          parametros.escalaAltura,
          Math.abs(estacion.temperatura) * parametros.escalaAltura
        );

  // REGLA 2:
  // bicicletas disponibles → fracción llena.
  const alturaBicicletas = Math.max(0.08, alturaTotal);
  const alturaRiesgo = Math.max(
    0.03,
    alturaTotal * ((estacion.riesgoMigrana ?? 100) / 100)
  );

  const ancho = 1.05;

  const grupo = new THREE.Group();
  grupo.position.set(estacion.x, 0, estacion.z);
  grupo.userData.estacion = estacion;

  // Contenedor: representa la capacidad total.
  const geometriaCapacidad = new THREE.BoxGeometry(ancho, alturaTotal, ancho);
  const materialCapacidad = new THREE.MeshStandardMaterial({
    color: esVariacion ? 0xe48b57 : 0x34383e,
    roughness: 0.9,
    transparent: true,
    opacity: esVariacion ? (esCentral ? 0.32 : 1) : 0.55,
  });

  const capacidad = new THREE.Mesh(geometriaCapacidad, materialCapacidad);
  capacidad.position.y = alturaTotal / 2;
  capacidad.userData.estacion = estacion;
  grupo.add(capacidad);

  if (!esVariacion) {
    const materialDivision = new THREE.MeshBasicMaterial({
      color: 0x0b0b0c,
      transparent: true,
      opacity: 0.75,
    });

    const gradosTotales = Math.max(1, Math.ceil(Math.abs(estacion.temperatura)));
    for (let grado = 1; grado < gradosTotales; grado += 1) {
      const division = new THREE.Mesh(
        new THREE.BoxGeometry(ancho * 1.01, 0.035, ancho * 1.01),
        materialDivision
      );
      division.position.y = grado * parametros.escalaAltura;
      grupo.add(division);
    }
  }

  // Volumen claro: representa las bicicletas actualmente disponibles.
  const geometriaBicicletas = new THREE.BoxGeometry(
    ancho * 0.72,
    esVariacion ? alturaRiesgo : alturaBicicletas,
    ancho * 0.72
  );
  const colorTemperatura = esVariacion
    ? new THREE.Color(0xe48b57)
    : new THREE.Color().setHSL(
    0.62 - intensidadTemperatura * 0.62,
    0.72,
    0.62
  );
  const materialBicicletas = new THREE.MeshStandardMaterial({
    color: colorTemperatura,
    roughness: 0.5,
  });

  const bicicletas = new THREE.Mesh(geometriaBicicletas, materialBicicletas);
  bicicletas.position.y = (esVariacion ? alturaRiesgo : alturaBicicletas) / 2;
  bicicletas.castShadow = true;
  bicicletas.userData.estacion = estacion;
  grupo.add(bicicletas);
  if (!esVariacion) {
    grupo.add(crearEtiquetaSuelo(estacion.nombre, 0, 0.82, 18, 1.8, 0.55));
    const etiquetaTemperatura = crearEtiquetaSuelo(
      `${estacion.temperatura.toFixed(1)} °C`,
      0,
      0,
      22,
      2.7,
      0.9
    );
    etiquetaTemperatura.position.y = alturaTotal + 0.65;
    grupo.add(etiquetaTemperatura);
  } else if (esCentral) {
    grupo.add(crearEtiquetaSuelo("Riesgo", 0, 0.82, 18, 1.8, 0.55));
  }

  grupoDestino.add(grupo);
  objetosEstacion.push(capacidad, bicicletas);
}

function limpiarRepresentacion() {
  objetosEstacion = [];

  [grupoEstaciones, grupoVariaciones].forEach((grupoDestino) => {
    while (grupoDestino.children.length > 0) {
      const grupo = grupoDestino.children[0];

      grupo.traverse((objeto) => {
        if (objeto.geometry) objeto.geometry.dispose();
        if (objeto.material) objeto.material.dispose();
      });

      grupoDestino.remove(grupo);
    }
  });
}

function actualizarBaseGeografica(estacionesDistribuidas) {
  limpiarBaseGeografica();
  grupoBaseGeografica.visible = parametros.modo === "temporal";

  if (!grupoBaseGeografica.visible || estacionesDistribuidas.length === 0) return;

  const xs = estacionesDistribuidas.map((estacion) => estacion.x);
  const zs = estacionesDistribuidas.map((estacion) => estacion.z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const ancho = maxX - minX;
  const profundidad = maxZ - minZ;
  const largoFlecha = Math.max(4, Math.min(ancho, profundidad) * 0.28);
  const xGuia = minX - 3.2;
  const zInicio = maxZ;
  const zFinal = zInicio - largoFlecha;

  const materialGuia = new THREE.LineBasicMaterial({
    color: 0xd9d2c3,
    transparent: true,
    opacity: 0.5,
  });

  const flecha = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(xGuia, 0.04, zInicio),
      new THREE.Vector3(xGuia, 0.04, zFinal),
    ]),
    materialGuia
  );

  const cabeza = new THREE.Mesh(
    new THREE.ConeGeometry(0.42, 1.1, 3),
    new THREE.MeshBasicMaterial({
      color: 0xd9d2c3,
      transparent: true,
      opacity: 0.55,
    })
  );
  cabeza.rotation.x = Math.PI / 2;
  cabeza.rotation.z = Math.PI;
  cabeza.position.set(xGuia, 0.06, zFinal - 0.46);

  grupoBaseGeografica.add(flecha, cabeza);
  grupoBaseGeografica.add(crearEtiquetaSuelo("N", xGuia, zFinal - 1.45, 42));
  grupoBaseGeografica.add(
    crearEtiquetaSuelo("tiempo → / temperatura ↑", minX, maxZ + 1.9, 28)
  );
  const etiquetaPeriodo = crearEtiquetaSuelo(
    periodoVisible.toUpperCase(),
    0,
    0,
    48,
    4.5,
    1.7
  );
  etiquetaPeriodo.position.y = 3;
  grupoBaseGeografica.add(etiquetaPeriodo);
}

function limpiarBaseGeografica() {
  limpiarGrupo(grupoBaseGeografica);
}

function limpiarGrupo(grupo) {
  while (grupo.children.length > 0) {
    const objeto = grupo.children[0];

    if (objeto.geometry) objeto.geometry.dispose();
    if (objeto.material) {
      if (objeto.material.map) objeto.material.map.dispose();
      objeto.material.dispose();
    }

    grupo.remove(objeto);
  }
}

function crearEtiquetaSuelo(texto, x, z, tamanoFuente, escalaX = 5.4, escalaY = 2.0) {
  const canvas = document.createElement("canvas");
  const contexto = canvas.getContext("2d");
  canvas.width = 256;
  canvas.height = 96;

  contexto.fillStyle = "rgba(217, 210, 195, 0.72)";
  contexto.font = `${tamanoFuente}px Roboto, Arial, sans-serif`;
  contexto.textAlign = "center";
  contexto.textBaseline = "middle";
  contexto.fillText(texto, canvas.width / 2, canvas.height / 2);

  const textura = new THREE.CanvasTexture(canvas);
  const etiqueta = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: textura,
      transparent: true,
      depthWrite: false,
    })
  );
  etiqueta.position.set(x, 0.18, z);
  etiqueta.scale.set(escalaX, escalaY, 1);

  return etiqueta;
}

// ======================================================
// 05 — INTERFAZ + INSPECTOR
// ======================================================

const raycaster = new THREE.Raycaster();
const puntero = new THREE.Vector2();

renderer.domElement.addEventListener("pointerdown", (event) => {
  const rect = renderer.domElement.getBoundingClientRect();

  puntero.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  puntero.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(puntero, camara);

  const intersecciones = raycaster.intersectObjects(objetosEstacion, false);

  if (intersecciones.length > 0) {
    mostrarEstacion(intersecciones[0].object.userData.estacion);
  }
});

function mostrarEstacion(estacion) {
  document.querySelector("#estacion-nombre").textContent = estacion.nombre;
  document.querySelector("#m-temperatura").textContent = `${estacion.temperatura.toFixed(1)} °C`;
  document.querySelector("#m-humedad").textContent = `${estacion.humedad}%`;
  document.querySelector("#m-lluvia").textContent = `${estacion.lluvia.toFixed(1)} mm`;
  document.querySelector("#m-viento").textContent =
    `${estacion.viento.toFixed(1)} km/h`;
  document.querySelector("#m-riesgo").textContent =
    `${(estacion.riesgoMigrana ?? 0).toFixed(1)}%`;
}

document.querySelector("#modo-distribucion").addEventListener("change", (event) => {
  parametros.modo = event.target.value;
  generarRepresentacion();
});

conectarSlider("escala-altura", "escala-altura-valor", "escalaAltura", 2);

function conectarSlider(idControl, idValor, parametro, decimales) {
  const control = document.querySelector(`#${idControl}`);
  const valor = document.querySelector(`#${idValor}`);

  control.addEventListener("input", (event) => {
    parametros[parametro] = Number(event.target.value);
    valor.value = parametros[parametro].toFixed(decimales);
    generarRepresentacion();
  });
}

document.querySelector("#actualizar").addEventListener("click", async () => {
  segundosRestantes = INTERVALO_ACTUALIZACION;
  await cargarDatosVivos();
});

document.querySelector("#pausar").addEventListener("click", (event) => {
  actualizacionAutomatica = !actualizacionAutomatica;
  event.target.textContent = actualizacionAutomatica
    ? "Pausar auto"
    : "Reanudar auto";

  document.querySelector("#cuenta-regresiva").textContent =
    actualizacionAutomatica ? `${segundosRestantes} s` : "pausada";
});

function actualizarEstadoConexion(tipo) {
  const estado = document.querySelector("#estado-label");

  if (tipo === "vivo") {
    estado.innerHTML = '<i class="status-dot"></i> conectado';
  } else if (tipo === "respaldo") {
    estado.textContent = "respaldo local";
  } else {
    estado.textContent = "conectando…";
  }
}

function formatearHora(timestamp) {
  if (!timestamp) return new Date().toLocaleTimeString("es-CL");

  const fecha = typeof timestamp === "number"
    ? new Date(timestamp * 1000)
    : new Date(timestamp);

  return fecha.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ======================================================
// 06 — POLLING RESPONSABLE
// ======================================================
// La app consulta periódicamente el feed para mantener visible la fuente viva.
// El feed puede declarar un TTL mayor, por lo que algunas respuestas pueden repetirse.
// El contador mantiene visible que el sistema está esperando la próxima actualización.

setInterval(async () => {
  if (!actualizacionAutomatica) return;

  segundosRestantes -= 1;
  document.querySelector("#cuenta-regresiva").textContent =
    `${segundosRestantes} s`;

  if (segundosRestantes <= 0) {
    segundosRestantes = INTERVALO_ACTUALIZACION;
    await cargarDatosVivos();
  }
}, 1000);

// ======================================================
// 07 — ANIMACIÓN + RESPONSIVE
// ======================================================

function animar() {
  requestAnimationFrame(animar);
  controlesOrbita.update();
  renderer.render(escena, camara);
}

function ajustarVentana() {
  const ancho = viewport.clientWidth;
  const altura = viewport.clientHeight;

  camara.aspect = ancho / altura;
  camara.updateProjectionMatrix();
  renderer.setSize(ancho, altura);
}

window.addEventListener("resize", ajustarVentana);

cargarDatosVivos();
animar();
