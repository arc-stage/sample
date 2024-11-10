async function LoadGeometry(targetObject) {
  // init occt-import-js
  const occt = await occtimportjs();

  // download a step file
  let fileUrl =
    "https://raw.githubusercontent.com/arc-stage/sample/refs/heads/main/steps/CX81B-24S1.stp";
  let response = await fetch(fileUrl);
  let buffer = await response.arrayBuffer();

  // read the imported step file
  let fileBuffer = new Uint8Array(buffer);
  let result = occt.ReadStepFile(fileBuffer, null);

  // process the geometries of the result
  for (let resultMesh of result.meshes) {
    let geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(resultMesh.attributes.position.array, 3)
    );
    if (resultMesh.attributes.normal) {
      geometry.setAttribute(
        "normal",
        new THREE.Float32BufferAttribute(resultMesh.attributes.normal.array, 3)
      );
    }
    const index = Uint32Array.from(resultMesh.index.array);
    geometry.setIndex(new THREE.BufferAttribute(index, 1));

    let material = null;

    if (resultMesh.color) {
      const color = new THREE.Color(
        resultMesh.color[0],
        resultMesh.color[1],
        resultMesh.color[2]
      );
      material = new THREE.MeshPhongMaterial({ color: color });
    } else {
      material = new THREE.MeshPhongMaterial({ color: 0xeeeeee });
    }

    const mesh = new THREE.Mesh(geometry, material);
    targetObject.add(mesh);
  }
}

async function Load() {
  const width = 360;
  const height = 300;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setClearColor(0xdddddd);
  const wrapper = document.querySelector("#wrapper");
  wrapper.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(45, width / height, 1, 100000.0);
  camera.up.set(0.0, 0.0, 1.0);

  const scene = new THREE.Scene();

  const ambientLight = new THREE.AmbientLight(0x222222);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0x888888);
  scene.add(directionalLight);

  const mainObject = new THREE.Object3D();
  await LoadGeometry(mainObject);

  // Adjust camera and controls
  const box = new THREE.Box3().setFromObject(mainObject);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  // Position the camera
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));

  camera.position.set(center.x, center.y, cameraZ * 1.2);
  camera.lookAt(center);

  // Update directional light position
  directionalLight.position.copy(camera.position);

  scene.add(mainObject);

  // Add OrbitControls for interaction
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.copy(center);
  controls.update();

  // Render loop
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
}

Load();

document.querySelector("#download3d").addEventListener("click", async () => {
  const url =
    "https://raw.githubusercontent.com/arc-stage/sample/refs/heads/main/steps/CX81B-24S1.stp";
  const filename = "CX81B-24S1.stp";

  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error("ネットワークエラー: " + response.statusText);
      }
      return response.blob();
    })
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl); // メモリを解放
    })
    .catch((error) => {
      console.error("ダウンロードに失敗しました:", error);
      alert("ファイルのダウンロードに失敗しました。");
    });
});
