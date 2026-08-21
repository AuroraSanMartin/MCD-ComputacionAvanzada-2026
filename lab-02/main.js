import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// ======================================================
// 01 — PARÁMETROS
// ======================================================

const valoresIniciales = {
  columnas: 15,
  filas: 10,
  separacion: 1,
  amplitud: 3.0,
  frecuencia: 0.4,
  rotacion: 0.3,
  aleatoriedad: 0.0,
  semilla: 42,

  visual: 1, //Base 
  ruido: 0, //Fillet de cada cubo
  olor: 0, //Contraste colores
  calor: 0,
  migrana: 0,
};

const parametros = { ...valoresIniciales };

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
  200
);

camara.position.set(11, 9, 11);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

viewport.appendChild(renderer.domElement);

const controlesOrbita = new OrbitControls(camara, renderer.domElement);
controlesOrbita.enableDamping = true;
controlesOrbita.minDistance = 10;
controlesOrbita.maxDistance = 10;
controlesOrbita.minPolarAngle = 0.3;
controlesOrbita.maxPolarAngle = Math.PI / 2 - 0.08;
controlesOrbita.enablePan = false;
controlesOrbita.target.set(0, 1.2, 0);

// Iluminación general.
const luzHemisferica = new THREE.HemisphereLight(0xf3efe5, 0x202229, 1.7);
escena.add(luzHemisferica);

// Luz principal.
const luzPrincipal = new THREE.DirectionalLight(0xffffff, 3.1);
luzPrincipal.position.set(8, 14, 9);
luzPrincipal.castShadow = true;
escena.add(luzPrincipal);

// Luz secundaria para suavizar el contraste.
const luzRelleno = new THREE.DirectionalLight(0xc8d8ff, 0.8);
luzRelleno.position.set(-8, 6, -6);
escena.add(luzRelleno);

// Plano base.
const suelo = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60),
  new THREE.MeshStandardMaterial({
    color: 0x101114,
    roughness: 1,
    metalness: 0,
    transparent: true,
    opacity: 0.22,
  })
);

suelo.rotation.x = -Math.PI / 2;
suelo.position.y = -0.03;
suelo.receiveShadow = true;
escena.add(suelo);

// ======================================================
// 03 — OBJETO GENERATIVO
// ======================================================

const grupoCampo = new THREE.Group();
escena.add(grupoCampo);

const materialModulo = new THREE.MeshStandardMaterial({
  color: 0xd7d2c8,
  roughness: 0.58,
  metalness: 0.03,
});

// ======================================================
// 04 — REGLAS GENERATIVAS
// ======================================================
// Estas funciones representan decisiones de diseño.
// Si cambian estas reglas, cambia la familia de resultados.

// Regla A:
// posición → distancia al centro → contraste → altura
function calcularAlturaModulo(x, z) {
  const distancia = Math.sqrt(x * x + z * z);
  const distanciaMaxima = Math.max(
    parametros.separacion,
    (parametros.filas - 1) * parametros.separacion
  );
  const crecimientoRadial = Math.min(1, distancia / distanciaMaxima);

  const contraste =
    Math.sin(distancia * parametros.frecuencia) *
    parametros.amplitud *
    crecimientoRadial;

  const ruido =
    aleatoriedadConSemilla(x, z, parametros.semilla) *
    parametros.aleatoriedad;

  return Math.max(0.25, 1.2 + contraste + ruido);
}

// Regla B:
// la orientación depende de la dirección radial respecto al centro.
function calcularRotacionModulo(x, z) {
  const direccion = Math.atan2(z, x);
  return direccion * parametros.rotacion;
}

// ======================================================
// 05 — GENERAR CAMPO
// ======================================================

function generarCampo() {
  limpiarCampo();

  const anchoTorre = 0.76;
  const separacionCubos = 0.02;
  const tamanoCubo =
    (anchoTorre - separacionCubos * (parametros.visual - 1)) /
    parametros.visual;
  const radioFillet = tamanoCubo * parametros.ruido;
  const geometriaCubo = new RoundedBoxGeometry(
    tamanoCubo,
    tamanoCubo,
    tamanoCubo,
    4,
    radioFillet
  );
  const offsetBase =
    (parametros.visual - 1) * (tamanoCubo + separacionCubos) / 2;


  for (let fila = 0; fila < parametros.filas; fila++) {
    const finColumna = fila === 0 ? 1 : parametros.columnas;
    const radio = fila * parametros.separacion;

    for (let columna = 0; columna < finColumna; columna++) {
      const angulo = (columna / parametros.columnas) * Math.PI * 2;
      const x = Math.cos(angulo) * radio;
      const z = Math.sin(angulo) * radio;

      const altura = calcularAlturaModulo(x, z);
      const rotacion = calcularRotacionModulo(x, z);
      const cantidadCubos = Math.max(1, Math.ceil(altura / tamanoCubo));
      const torre = new THREE.Group();

      for (let baseX = 0; baseX < parametros.visual; baseX++) {
        for (let baseZ = 0; baseZ < parametros.visual; baseZ++) {
          const posicionX =
            baseX * (tamanoCubo + separacionCubos) - offsetBase;
          const posicionZ =
            baseZ * (tamanoCubo + separacionCubos) - offsetBase;

          for (let nivel = 0; nivel < cantidadCubos; nivel++) {
            const materialCubo = crearMaterialBloque(
              x,
              z,
              baseX,
              baseZ,
              nivel
            );
            const cubo = new THREE.Mesh(geometriaCubo, materialCubo);
            const escala = calcularVariacionBloque(
              x,
              z,
              baseX,
              baseZ,
              nivel,
              0
            );
            const giroX = calcularVariacionBloque(
              x,
              z,
              baseX,
              baseZ,
              nivel,
              1
            );
            const giroY = calcularVariacionBloque(
              x,
              z,
              baseX,
              baseZ,
              nivel,
              2
            );
            const giroZ = calcularVariacionBloque(
              x,
              z,
              baseX,
              baseZ,
              nivel,
              3
            );

            cubo.position.set(
              posicionX,
              nivel * (tamanoCubo + separacionCubos) + tamanoCubo / 2,
              posicionZ
            );
            cubo.scale.setScalar(escala);
            cubo.rotation.set(giroX, giroY, giroZ);
            cubo.castShadow = true;
            cubo.receiveShadow = true;
            torre.add(cubo);
          }
        }
      }

      torre.position.set(x, 0, z);
      torre.rotation.y = rotacion;
      grupoCampo.add(torre);

      const reflejoTorre = torre.clone(true);
      reflejoTorre.scale.y = -1;
      grupoCampo.add(reflejoTorre);
    }
  }
}

function limpiarCampo() {
  while (grupoCampo.children.length > 0) {
    const objeto = grupoCampo.children[0];

    objeto.traverse((hijo) => {
      if (hijo.isMesh && hijo.material !== materialModulo) {
        hijo.material.dispose();
      }
    });

    grupoCampo.remove(objeto);
  }
}

// ======================================================
// 06 — ALEATORIEDAD CONTROLADA
// ======================================================
// Devuelve un valor repetible entre -1 y 1.
// Una misma semilla produce siempre el mismo patrón.

function aleatoriedadConSemilla(x, z, semilla) {
  const valor =
    Math.sin(
      x * 12.9898 +
      z * 78.233 +
      semilla * 37.719
    ) * 43758.5453;

  const normalizado = valor - Math.floor(valor);

  return normalizado * 2 - 1;
}

function valorAleatorioBloque(x, z, baseX, baseZ, nivel, desplazamiento) {
  const valor =
    Math.sin(
      x * 12.9898 +
      z * 78.233 +
      baseX * 37.719 +
      baseZ * 45.164 +
      nivel * 91.731 +
      desplazamiento * 17.123 +
      parametros.semilla * 3.719
    ) * 43758.5453;

  return valor - Math.floor(valor);
}

function crearMaterialBloque(x, z, baseX, baseZ, nivel) {
  if (parametros.olor === 0) {
    return materialModulo;
  }

  const intensidad = parametros.olor;
  const tono = (
    0.1 +
    (valorAleatorioBloque(x, z, baseX, baseZ, nivel, 4) - 0.5) *
      intensidad *
      0.8 +
    1
  ) % 1;
  const saturacion =
    0.08 + valorAleatorioBloque(x, z, baseX, baseZ, nivel, 5) * 0.65 * intensidad;
  const luminosidad =
    0.58 +
    (valorAleatorioBloque(x, z, baseX, baseZ, nivel, 6) - 0.5) *
      0.18 *
      intensidad;
  const material = materialModulo.clone();

  material.color.setHSL(tono, saturacion, luminosidad);
  return material;
}

function calcularVariacionBloque(x, z, baseX, baseZ, nivel, desplazamiento) {
  const aleatorio = valorAleatorioBloque(
    x,
    z,
    baseX,
    baseZ,
    nivel,
    desplazamiento
  );
  const intensidad = parametros.calor;

  if (desplazamiento === 0) {
    const escalaMinima = 1 - intensidad * 0.65;
    return escalaMinima + aleatorio * (1 - escalaMinima);
  }

  return (aleatorio * 2 - 1) * intensidad * (Math.PI / 3);
}

// ======================================================
// 07 — INTERFAZ
// ======================================================

const controles = {
  amplitud: document.querySelector("#amplitud"),
  frecuencia: document.querySelector("#frecuencia"),
  aleatoriedad: document.querySelector("#aleatoriedad"),
  semilla: document.querySelector("#semilla"),
  visual: document.querySelector("#visual"),
  ruido: document.querySelector("#ruido"),
  calor: document.querySelector("#calor"),
  olor: document.querySelector("#olor"),
  migrana: document.querySelector("#migrana"),
};

const valoresVisibles = {
  amplitud: document.querySelector("#amplitud-valor"),
  frecuencia: document.querySelector("#frecuencia-valor"),
  aleatoriedad: document.querySelector("#aleatoriedad-valor"),
  semilla: document.querySelector("#semilla-valor"),
  visual: document.querySelector("#visual-valor"),
  ruido: document.querySelector("#ruido-valor"),
  calor: document.querySelector("#calor-valor"),
  olor: document.querySelector("#olor-valor"),
  migrana: document.querySelector("#migrana-valor"),
};

function actualizarParametro(nombre, valor) {
  const parametrosEnteros = ["columnas", "filas", "semilla", "visual"];

  parametros[nombre] = parametrosEnteros.includes(nombre)
    ? Number.parseInt(valor, 10)
    : Number.parseFloat(valor);

  valoresVisibles[nombre].value = parametrosEnteros.includes(nombre)
    ? parametros[nombre]
    : parametros[nombre].toFixed(2);

  generarCampo();
}

Object.entries(controles).forEach(([nombre, control]) => {
  control.addEventListener("input", (event) => {
    actualizarParametro(nombre, event.target.value);
  });
});

document.querySelector("#regenerar").addEventListener("click", () => {
  parametros.semilla = Math.floor(Math.random() * 100) + 1;

  controles.semilla.value = parametros.semilla;
  valoresVisibles.semilla.value = parametros.semilla;

  generarCampo();
});

document.querySelector("#restablecer").addEventListener("click", () => {
  Object.assign(parametros, valoresIniciales);

  const parametrosEnteros = ["columnas", "filas", "semilla", "visual"];

  Object.entries(controles).forEach(([nombre, control]) => {
    control.value = parametros[nombre];

    valoresVisibles[nombre].value = parametrosEnteros.includes(nombre)
      ? parametros[nombre]
      : parametros[nombre].toFixed(2);
  });

  generarCampo();
});

// ======================================================
// 08 — BUCLE DE ANIMACIÓN
// ======================================================

let ultimoCambioMigrana = 0;

function actualizarSemillaPorMigrana(tiempoActual) {
  if (parametros.migrana === 0) {
    ultimoCambioMigrana = tiempoActual;
    return;
  }

  const intervalo = 100 / parametros.migrana;

  if (tiempoActual - ultimoCambioMigrana < intervalo) {
    return;
  }

  ultimoCambioMigrana = tiempoActual;
  parametros.semilla = Math.floor(Math.random() * 100) + 1;
  controles.semilla.value = parametros.semilla;
  valoresVisibles.semilla.value = parametros.semilla;
  generarCampo();
}

function animar(tiempoActual) {
  requestAnimationFrame(animar);

  actualizarSemillaPorMigrana(tiempoActual);
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

generarCampo();
animar();
