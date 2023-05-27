import * as THREE from "./lib/three.module.js";
import { OrbitControls } from "../lib/OrbitControls.js";
import { GUI } from "../lib/lil-gui.js";

window.addEventListener(
  "DOMContentLoaded",
  () => {
    const app = new App3();

    app.init();

    app.render();
  },
  false
);

class App3 {
  /**
   * カメラ定義の定数
   */
  static get CAMERA_PARAM() {
    return {
      fovy: 60,
      aspect: window.innerWidth / window.innerHeight,
      near: 0.1,
      far: 1000,
      x: 0.0,
      y: 0.0,
      z: 10.0,
      lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };
  }

  /**
   * レンダラー定義の定数
   */
  static get RENDERER_PARAM() {
    return {
      clearColor: 0x666666,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  /**
   * ディレクショナルライト定義の定数
   */
  static get DIRECTIONAL_LIGHT_PARAM() {
    return {
      color: 0xffffff,
      intensity: 0.2,
      x: 2.0,
      y: 4.0,
      z: 2.0,
    };
  }

  /**
   * アンビエントライト定義の定数
   */
  static get AMBIENT_LIGHT_PARAM() {
    return {
      color: 0xffffff,
      intensity: 0.4,
    };
  }

  /**
   * ポイントライト定義の定数
   */
  static get POINT_LIGHT_PARAM() {
    return {
      color: 0xffffff,
      intensity: 0.5,
    };
  }

  /**
   * マテリアル定義の定数
   */
  static get MATERIAL_PARAM() {
    return {
      color: 0x3399ff,
    };
  }

  /**
   * コンストラクタ
   * @constructor
   */
  constructor() {
    this.renderer;
    this.scene;
    this.camera;
    this.gui;
    this.directionalLight;
    this.ambientLight;
    this.pointLight;
    this.material;
    this.boxGeometry;
    this.box;
    this.boxArray;
    this.groundGeometry;
    this.groundMaterial;
    this.ground;
    this.controls;
    this.axesHelper;
    this.directionalLightHelper;
    this.pointLightHelper;

    this.isDown = false;

    // 再帰呼び出しの為のthis固定
    this.render = this.render.bind(this);

    /**
     * イベント
     */

    // キーイベント
    window.addEventListener(
      "keydown",
      (keyEvent) => {
        switch (keyEvent.key) {
          case " ":
            this.isDown = true;
            break;
          default:
        }
      },
      false
    );
    window.addEventListener(
      "keyup",
      (keyEvent) => {
        switch (keyEvent.key) {
          case " ":
            this.isDown = false;
            break;
          default:
        }
      },
      false
    );

    // リサイズイベント
    window.addEventListener(
      "resize",
      () => {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
      },
      false
    );
  }

  /**
   * 初期化処理
   */
  init() {
    //レンダラー
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(App3.RENDERER_PARAM.clearColor);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(
      App3.RENDERER_PARAM.width,
      App3.RENDERER_PARAM.height
    );
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const wrapper = document.querySelector("#webgl");
    wrapper.appendChild(this.renderer.domElement);

    // シーン
    this.scene = new THREE.Scene();

    // カメラ
    this.camera = new THREE.PerspectiveCamera(
      App3.CAMERA_PARAM.fovy,
      App3.CAMERA_PARAM.aspect,
      App3.CAMERA_PARAM.near,
      App3.CAMERA_PARAM.far
    );
    this.camera.position.set(
      App3.CAMERA_PARAM.x,
      App3.CAMERA_PARAM.y,
      App3.CAMERA_PARAM.z
    );
    this.camera.lookAt(App3.CAMERA_PARAM.lookAt);

    // ディレクショナルライト
    this.directionalLight = new THREE.DirectionalLight(
      App3.DIRECTIONAL_LIGHT_PARAM.color,
      App3.DIRECTIONAL_LIGHT_PARAM.intensity
    );
    this.directionalLight.position.set(
      App3.DIRECTIONAL_LIGHT_PARAM.x,
      App3.DIRECTIONAL_LIGHT_PARAM.y,
      App3.DIRECTIONAL_LIGHT_PARAM.z
    );
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.set(2048, 2048);
    const edge = 10;
    this.directionalLight.shadow.camera = new THREE.OrthographicCamera(
      -edge,
      edge,
      edge,
      -edge,
      0.1,
      30
    );
    this.scene.add(this.directionalLight);

    // アンビエントライト
    this.ambientLight = new THREE.AmbientLight(
      App3.AMBIENT_LIGHT_PARAM.color,
      App3.AMBIENT_LIGHT_PARAM.intensity
    );
    this.scene.add(this.ambientLight);

    // ポイントライト
    this.pointLight = new THREE.PointLight(
      App3.POINT_LIGHT_PARAM.color,
      App3.POINT_LIGHT_PARAM.intensity
    );
    this.pointLight.castShadow = true;
    this.pointLight.shadow.mapSize.set(2048, 2048);
    this.pointLight.position.set(4, 0, 4);
    this.scene.add(this.pointLight);

    // ジオメトリ
    this.boxGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);

    // マテリアル
    this.material = new THREE.MeshPhongMaterial(App3.MATERIAL_PARAM);

    // boxを10個生成
    const BOX_COUNT = 100;
    this.boxArray = [];

    for (let i = 0; i < BOX_COUNT; i++) {
      const box = new THREE.Mesh(this.boxGeometry, this.material);
      box.scale.x = 1 + 0.05 * i;
      box.scale.y = 1 + 0.05 * i;
      box.scale.z = 1 + 0.05 * i;
      box.position.x = 0 + 0.3 * i;

      // 角度をラジアンに変換
      const rad = (15 * Math.PI) / 180;
      const posX = 0.04 * i * Math.cos(rad * i);
      const posZ = 0.04 * i * Math.sin(rad * i);

      box.position.set(posX, -3 + 0.06 * i, posZ);
      box.castShadow = true;
      box.receiveShadow = true;

      this.scene.add(box);
      this.boxArray.push(box);
    }

    // groundMeshの生成
    this.groundGeometry = new THREE.PlaneGeometry(10, 10);
    this.groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xfafafa,
      side: THREE.DoubleSide,
    });
    this.ground = new THREE.Mesh(this.groundGeometry, this.groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.set(0, -3.6, 0);
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // ヘルパー
    // axesHelper
    const axesBarLength = 5.0;
    this.axesHelper = new THREE.AxesHelper(axesBarLength);
    this.scene.add(this.axesHelper);

    // DirectionalLightHelper
    const directionalLightHelperSize = 1;
    this.directionalLightHelper = new THREE.DirectionalLightHelper(
      this.directionalLight,
      directionalLightHelperSize
    );
    this.scene.add(this.directionalLightHelper);

    // PointLightHelper
    const sphereSize = 1;
    this.pointLightHelper = new THREE.PointLightHelper(
      this.pointLight,
      sphereSize
    );
    this.scene.add(this.pointLightHelper);

    // GUIデバッグ
    this.gui = new GUI();
    const lightGUIGroupe = this.gui.addFolder("Light");
    lightGUIGroupe
      .add(this.directionalLight, "visible")
      .name("DirectionalLight");
    lightGUIGroupe.add(this.ambientLight, "visible").name("AmbientLight");
    lightGUIGroupe.add(this.pointLight, "visible").name("PointLight");
    const helperGUIGroupe = this.gui.addFolder("Helper");
    helperGUIGroupe.add(this.axesHelper, "visible").name("AxesHelper");
    helperGUIGroupe
      .add(this.directionalLightHelper, "visible")
      .name("DirectionalLightHelper");
    helperGUIGroupe
      .add(this.pointLightHelper, "visible")
      .name("PointLightHelper");
  }

  /**
   * 描画処理
   */
  render() {
    requestAnimationFrame(this.render);

    if (this.isDown === true) {
      this.box.rotation.y += 0.02;
    }
    // 偶数番目は正方向へ、奇数番目は負方向へ回転
    // 回転の強さはランダムで
    this.boxArray.forEach((box, i) => {
      if (i % 2 === 0) {
        box.rotation.y += Math.random() * 0.1;
        box.rotation.z += Math.random() * 0.1;
      } else {
        box.rotation.y -= Math.random() * 0.1;
        box.rotation.z -= Math.random() * 0.1;
      }
    });

    this.controls.update();

    this.renderer.render(this.scene, this.camera);
  }
}
