import * as THREE from "three";
import { ParametricGeometry } from "three/addons/geometries/ParametricGeometry.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

let container;
const params = {
  autoRotate: true,
  background: 0x777777,
};

let camera, scene, renderer, meshPillow;

init();
animate();

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(0, -10, 20 * 1.1);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(params.background);

  renderer = new THREE.WebGLRenderer({ antialias: true });

  const canvas = generateDragonCurveCanvas();
  const canvasTexture = new THREE.CanvasTexture(canvas);

  function pillowSurface(u, v, target) {
    const pillowWidth = 3;
    const pillowHeight = 2;

    u *= 2 * Math.PI;
    v *= 2 * Math.PI;

    const x = pillowWidth * Math.sin(u);
    const y = pillowHeight * Math.sin(v);
    const z = Math.cos(u) * Math.cos(v);

    target.set(x, y, z);
  }

  const geometry = new ParametricGeometry(pillowSurface, 100, 100); // Increase segments for smoother surface
  const material = new THREE.MeshBasicMaterial({
    map: canvasTexture,
    side: THREE.DoubleSide,
  });

  meshPillow = new THREE.Mesh(geometry, material);
  scene.add(meshPillow);

  // Lights
  scene.add(new THREE.AmbientLight(0x404040));

  const pointLight1 = new THREE.PointLight(0xffffff);
  pointLight1.position.set(150, 10, 0);
  pointLight1.castShadow = false;
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xffffff);
  pointLight2.position.set(-150, 0, 0);
  scene.add(pointLight2);

  const pointLight3 = new THREE.PointLight(0xffffff);
  pointLight3.position.set(0, -10, -150);
  scene.add(pointLight3);

  const pointLight4 = new THREE.PointLight(0xffffff);
  pointLight4.position.set(0, 0, 150);
  scene.add(pointLight4);

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  new OrbitControls(camera, renderer.domElement);

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  camera.lookAt(scene.position);
  if (params.autoRotate) {
    meshPillow.rotation.y += 0.005;
  }
  renderer.render(scene, camera);
}

function generateDragonCurveCanvas() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 912;
  canvas.height = 712;

  // Fill canvas with desired color
  ctx.fillStyle = "#ffffff"; // White color
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const maxOrder = 17;

  function Point(x, y) {
    return {
      x: x,
      y: y,
      rotateAround: function (p) {
        const dx = p.x - this.x;
        const dy = p.y - this.y;
        this.x = p.x + dy;
        this.y = p.y - dx;
      },
    };
  }

  function Polyline(points) {
    return {
      points: points,
      getLastPoint: function () {
        return this.points[this.points.length - 1];
      },
      rotateAround: function (p) {
        for (let i = 0; i < this.points.length; i++) {
          this.points[i].rotateAround(p);
        }
      },
      removeLastPoint: function () {
        this.points.splice(-1, 1);
      },
      reverse: function () {
        this.points.reverse();
      },
      append: function (polyline) {
        this.points = this.points.concat(polyline.points);
      },
      draw: function (ctx) {
        ctx.beginPath();
        for (let i = 0; i < this.points.length - 1; i++) {
          ctx.lineTo(this.points[i + 1].x, this.points[i + 1].y);
        }
        ctx.stroke();
      },
    };
  }

  function DragonCurve(x, y, lineLength, order) {
    let polyline;
    if (order === 0) {
      const points = [];
      points[0] = new Point(x, y);
      points[1] = new Point(x + lineLength, y); // Adjust line length for proper scaling
      polyline = new Polyline(points);
    } else {
      const predecessor = new DragonCurve(x, y, lineLength, order - 1);
      polyline = clone(predecessor.polyline);
      const toAppend = clone(polyline);
      toAppend.rotateAround(polyline.getLastPoint());
      toAppend.removeLastPoint();
      toAppend.reverse();
      polyline.append(toAppend);
    }
    return {
      polyline: polyline,
      draw: function (ctx) {
        polyline.draw(ctx);
      },
    };
  }

  function clone(obj) {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }
    const temp = obj.constructor();
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        temp[key] = clone(obj[key]);
      }
    }
    return temp;
  }

  // Draw Dragon Curve
  const curve = new DragonCurve(256, 256, 2, maxOrder); // Start drawing from the center
  curve.draw(ctx);

  return canvas;
}
