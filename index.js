async function LoadGeometry(targetObject) {
  // init occt-import-js
  const occt = await occtimportjs();

  // download a step file
  let fileUrl =
    "https://raw.githubusercontent.com/kovacsv/occt-import-js/main/test/testfiles/cax-if/as1_pe_203.stp";
  // // let fileUrl =
  // //   "https://hirose-sample.s3.ap-northeast-1.amazonaws.com/steps/WRF-2400942.stp";
  // let fileUrl =
  //   "https://hirose-sample.s3.ap-northeast-1.amazonaws.com/steps/CX81B-24S1_v3.stp";
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
      material = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    }

    const mesh = new THREE.Mesh(geometry, material);
    targetObject.add(mesh);
  }
}

async function Load() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setClearColor(0xfafafa);
  document.body.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(45, width / height, 1.0, 100000.0);
  camera.position.set(5000.0, 15000.0, 10000.0);
  camera.up.set(0.0, 0.0, 1.0);
  camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));

  const scene = new THREE.Scene();

  const ambientLight = new THREE.AmbientLight(0x444444);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0x888888);
  directionalLight.position.set(
    camera.position.x,
    camera.position.y,
    camera.position.z
  );
  scene.add(directionalLight);

  const mainObject = new THREE.Object3D();
  await LoadGeometry(mainObject);
  scene.add(mainObject);

  renderer.setAnimationLoop((time) => {
    mainObject.rotation.x = time / 2000;
    mainObject.rotation.y = time / 1000;
    renderer.render(scene, camera);
  });
}

Load();
