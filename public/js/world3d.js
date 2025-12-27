const BLOCK_COLORS = {
  'minecraft:stone': 0x7d7d7d,
  'minecraft:granite': 0x9a6c4a,
  'minecraft:polished_granite': 0xa77b5b,
  'minecraft:diorite': 0xbfbfbf,
  'minecraft:polished_diorite': 0xd4d4d4,
  'minecraft:andesite': 0x828282,
  'minecraft:polished_andesite': 0x909090,
  'minecraft:grass_block': 0x5d9c3e,
  'minecraft:dirt': 0x866043,
  'minecraft:coarse_dirt': 0x7a593d,
  'minecraft:podzol': 0x6b5344,
  'minecraft:cobblestone': 0x6b6b6b,
  'minecraft:oak_planks': 0xb8945f,
  'minecraft:spruce_planks': 0x6b502d,
  'minecraft:birch_planks': 0xc8b77a,
  'minecraft:jungle_planks': 0xab7e53,
  'minecraft:acacia_planks': 0xa85d1a,
  'minecraft:dark_oak_planks': 0x3e2912,
  'minecraft:bedrock': 0x4a4a4a,
  'minecraft:sand': 0xdbd3a0,
  'minecraft:red_sand': 0xbe6621,
  'minecraft:gravel': 0x827f7e,
  'minecraft:gold_ore': 0x8f8b77,
  'minecraft:deepslate_gold_ore': 0x5a5a5a,
  'minecraft:iron_ore': 0x8f8b7e,
  'minecraft:deepslate_iron_ore': 0x5a5a5a,
  'minecraft:coal_ore': 0x6b6b6b,
  'minecraft:deepslate_coal_ore': 0x4a4a4a,
  'minecraft:oak_log': 0x6b5839,
  'minecraft:spruce_log': 0x3b2a14,
  'minecraft:birch_log': 0xdcd7c8,
  'minecraft:jungle_log': 0x554f2c,
  'minecraft:acacia_log': 0x676157,
  'minecraft:dark_oak_log': 0x3e2912,
  'minecraft:oak_leaves': 0x4a7a27,
  'minecraft:spruce_leaves': 0x3e6424,
  'minecraft:birch_leaves': 0x6a9a31,
  'minecraft:jungle_leaves': 0x4a9a27,
  'minecraft:acacia_leaves': 0x6b9a31,
  'minecraft:dark_oak_leaves': 0x3e6424,
  'minecraft:glass': 0xc8dce8,
  'minecraft:lapis_ore': 0x6b6b8f,
  'minecraft:lapis_block': 0x1e4c8f,
  'minecraft:sandstone': 0xd6ce8f,
  'minecraft:gold_block': 0xf9d925,
  'minecraft:iron_block': 0xdcdcdc,
  'minecraft:bricks': 0x9b5b4a,
  'minecraft:bookshelf': 0x6b502d,
  'minecraft:mossy_cobblestone': 0x5e6b53,
  'minecraft:obsidian': 0x1b1b2f,
  'minecraft:torch': 0xffd700,
  'minecraft:diamond_ore': 0x6b8f9b,
  'minecraft:deepslate_diamond_ore': 0x4a6a7a,
  'minecraft:diamond_block': 0x5fdde8,
  'minecraft:redstone_ore': 0x8f5b5b,
  'minecraft:deepslate_redstone_ore': 0x6a4a4a,
  'minecraft:ice': 0x9bc8dc,
  'minecraft:snow': 0xfafafa,
  'minecraft:snow_block': 0xfafafa,
  'minecraft:clay': 0x9ea5af,
  'minecraft:netherrack': 0x6b3535,
  'minecraft:soul_sand': 0x514034,
  'minecraft:glowstone': 0xffd78c,
  'minecraft:emerald_ore': 0x6b9b6b,
  'minecraft:deepslate_emerald_ore': 0x4a7a4a,
  'minecraft:emerald_block': 0x41d975,
  'minecraft:quartz_block': 0xece9e2,
  'minecraft:terracotta': 0x985c43,
  'minecraft:coal_block': 0x1a1a1a,
  'minecraft:packed_ice': 0x8fb9dc,
  'minecraft:blue_ice': 0x74a9d4,
  'minecraft:prismarine': 0x5d9b8f,
  'minecraft:dark_prismarine': 0x356b5e,
  'minecraft:sea_lantern': 0xacdce8,
  'minecraft:magma_block': 0x8f3b1b,
  'minecraft:bone_block': 0xd6ceb5,
  'minecraft:concrete': 0x7d7d7d,
  'minecraft:white_concrete': 0xcfd5d6,
  'minecraft:orange_concrete': 0xe06101,
  'minecraft:magenta_concrete': 0xa9309f,
  'minecraft:light_blue_concrete': 0x2389c6,
  'minecraft:yellow_concrete': 0xf1af15,
  'minecraft:lime_concrete': 0x5ea818,
  'minecraft:pink_concrete': 0xd6658f,
  'minecraft:gray_concrete': 0x36393d,
  'minecraft:light_gray_concrete': 0x7d7d73,
  'minecraft:cyan_concrete': 0x157788,
  'minecraft:purple_concrete': 0x64209c,
  'minecraft:blue_concrete': 0x2d2f8f,
  'minecraft:brown_concrete': 0x60331a,
  'minecraft:green_concrete': 0x495b24,
  'minecraft:red_concrete': 0x8e2020,
  'minecraft:black_concrete': 0x080a0f,
  'minecraft:copper_ore': 0x7e6b5c,
  'minecraft:deepslate_copper_ore': 0x5a5a5a,
  'minecraft:copper_block': 0xc06b4a,
  'minecraft:deepslate': 0x4a4a4a,
  'minecraft:calcite': 0xddddd3,
  'minecraft:tuff': 0x6b6b5e,
  'minecraft:amethyst_block': 0x8b5da5,
  'minecraft:budding_amethyst': 0x9b6db5,
  'minecraft:water': 0x3d7cff,
  'minecraft:lava': 0xff6b1a,
  'minecraft:air': 0x000000,
  'minecraft:nether_bricks': 0x2c1a1a,
  'minecraft:red_nether_bricks': 0x451a1a,
  'minecraft:ancient_debris': 0x5e4a3d,
  'minecraft:netherite_block': 0x3d3d3d,
  'minecraft:crying_obsidian': 0x3d1a5e,
  'minecraft:blackstone': 0x2a2a2e,
  'minecraft:basalt': 0x4a4a4a,
  'minecraft:soul_soil': 0x4a3d2e,
  'minecraft:warped_stem': 0x2e6b6b,
  'minecraft:crimson_stem': 0x6b2e2e,
  'minecraft:shroomlight': 0xf9a825,
  'minecraft:end_stone': 0xdbd39a,
  'minecraft:end_stone_bricks': 0xd6ce8f,
  'minecraft:purpur_block': 0xa86bbd,
  'minecraft:chorus_plant': 0x5e4a6b,
  'minecraft:chorus_flower': 0x9b6bbd,
  'minecraft:raw_iron_block': 0xc4a77d,
  'minecraft:raw_copper_block': 0xb87333,
  'minecraft:raw_gold_block': 0xe8b923,
  'minecraft:moss_block': 0x5d7a31,
  'minecraft:dripstone_block': 0x8b7355,
  'minecraft:rooted_dirt': 0x7a6043,
  'minecraft:mud': 0x4a3f3a,
  'minecraft:mud_bricks': 0x8a7a6a,
  'minecraft:mangrove_log': 0x6b4a3a,
  'minecraft:cherry_log': 0xd4a5a5,
  'minecraft:cherry_leaves': 0xf9b8c6,
  'minecraft:bamboo_block': 0x8fb83b,
  'minecraft:sculk': 0x0d3b4a,
  'minecraft:sculk_catalyst': 0x1a4a5a,
  'minecraft:sculk_sensor': 0x0d4a5a,
  'minecraft:reinforced_deepslate': 0x3a3a3a,
  'create:andesite_casing': 0x6b6b5e,
  'create:brass_casing': 0xc8a832,
  'create:copper_casing': 0xc06b4a,
  'create:shaft': 0x5a5a4a,
  'create:cogwheel': 0x6b5a3a,
  'mekanism:basic_bin': 0x4a4a4a,
  'mekanism:steel_casing': 0x5a5a5a,
  'mekanism:osmium_block': 0x6bc8dc,
  'appliedenergistics2:quartz_block': 0xe8e8e8,
  'appliedenergistics2:fluix_block': 0x8b5da5,
  'appliedenergistics2:sky_stone_block': 0x3d3d4a,
  'thermal:machine_frame': 0x6b5a4a,
  'immersiveengineering:steel_scaffolding': 0x5a5a5a,
  'botania:livingrock': 0xc8c8c8,
  'botania:livingwood': 0x6b5a3a,
  'default': 0x888888
};

const BLOCK_OPACITY = {
  'minecraft:glass': 0.3,
  'minecraft:water': 0.6,
  'minecraft:ice': 0.7,
  'minecraft:leaves': 0.9
};

const BLOCK_TEXTURE_TYPES = {
  'stone': ['minecraft:stone', 'minecraft:andesite', 'minecraft:diorite', 'minecraft:granite', 'minecraft:deepslate', 'minecraft:blackstone', 'minecraft:basalt'],
  'ore': ['_ore'],
  'dirt': ['minecraft:dirt', 'minecraft:coarse_dirt', 'minecraft:rooted_dirt', 'minecraft:mud'],
  'grass': ['minecraft:grass_block', 'minecraft:moss_block'],
  'sand': ['minecraft:sand', 'minecraft:red_sand', 'minecraft:gravel', 'minecraft:soul_sand', 'minecraft:soul_soil'],
  'planks': ['_planks'],
  'log': ['_log', '_stem', '_wood'],
  'leaves': ['_leaves'],
  'bricks': ['_bricks', 'minecraft:bricks'],
  'ore_block': ['_block'],
  'glass': ['glass'],
  'cobblestone': ['cobblestone'],
  'bedrock': ['minecraft:bedrock'],
  'obsidian': ['obsidian']
};

class World3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    
    this.blocks = new Map();
    this.meshes = new Map();
    this.waypoints = new Map();
    this.waypointMeshes = new Map();
    this.turtleMesh = null;
    this.turtlePosition = { x: 0, y: 0, z: 0 };
    this.turtleDirection = 0;
    this.textureCache = new Map();
    this.textureLoader = new THREE.TextureLoader();
    this.loadedTextures = new Set();
    this.failedTextures = new Set();
    this.pendingBlocks = [];
    this.contextMenuCallback = null;
    this.onBlockDoubleClick = null;
    
    this.init();
  }
  
  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(10, 10, 10);
    this.camera.lookAt(0, 0, 0);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);
    
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 100;
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
    
    const gridHelper = new THREE.GridHelper(100, 100, 0x444444, 0x333333);
    gridHelper.position.y = -0.5;
    this.scene.add(gridHelper);
    
    this.createTurtle();
    
    window.addEventListener('resize', () => this.onResize());
    
    this.renderer.domElement.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
    this.renderer.domElement.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
    
    this.animate();
  }
  
  getTextureFilePath(blockName) {
    const name = blockName.replace('minecraft:', '');
    const basePaths = [
      `/textures/block/${name}.png`,
      `/textures/block/${name}_side.png`,
      `/textures/block/${name}_top.png`
    ];
    return basePaths[0];
  }

  loadTextureFromFile(blockName) {
    return new Promise((resolve) => {
      const name = blockName.replace('minecraft:', '');
      
      if (this.failedTextures.has(name)) {
        resolve(null);
        return;
      }
      
      if (this.textureCache.has(`file_${name}`)) {
        resolve(this.textureCache.get(`file_${name}`));
        return;
      }
      
      const path = `/textures/block/${name}.png`;
      
      this.textureLoader.load(
        path,
        (texture) => {
          texture.magFilter = THREE.NearestFilter;
          texture.minFilter = THREE.NearestFilter;
          texture.colorSpace = THREE.SRGBColorSpace;
          this.textureCache.set(`file_${name}`, texture);
          this.loadedTextures.add(name);
          resolve(texture);
        },
        undefined,
        () => {
          this.failedTextures.add(name);
          resolve(null);
        }
      );
    });
  }

  generateProceduralTexture(blockName, size = 16) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    const baseColor = this.getBlockColor(blockName);
    const r = (baseColor >> 16) & 255;
    const g = (baseColor >> 8) & 255;
    const b = baseColor & 255;
    
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, size, size);
    
    const textureType = this.getTextureType(blockName);
    const seed = this.hashString(blockName);
    
    switch (textureType) {
      case 'stone':
        this.drawStoneTexture(ctx, size, r, g, b, seed);
        break;
      case 'ore':
        this.drawOreTexture(ctx, size, r, g, b, seed, blockName);
        break;
      case 'dirt':
        this.drawDirtTexture(ctx, size, r, g, b, seed);
        break;
      case 'grass':
        this.drawGrassTexture(ctx, size, r, g, b, seed);
        break;
      case 'sand':
        this.drawSandTexture(ctx, size, r, g, b, seed);
        break;
      case 'planks':
        this.drawPlanksTexture(ctx, size, r, g, b, seed);
        break;
      case 'log':
        this.drawLogTexture(ctx, size, r, g, b, seed);
        break;
      case 'leaves':
        this.drawLeavesTexture(ctx, size, r, g, b, seed);
        break;
      case 'bricks':
        this.drawBricksTexture(ctx, size, r, g, b, seed);
        break;
      case 'cobblestone':
        this.drawCobblestoneTexture(ctx, size, r, g, b, seed);
        break;
      case 'glass':
        this.drawGlassTexture(ctx, size, r, g, b, seed);
        break;
      case 'bedrock':
        this.drawBedrockTexture(ctx, size, r, g, b, seed);
        break;
      case 'obsidian':
        this.drawObsidianTexture(ctx, size, r, g, b, seed);
        break;
      case 'ore_block':
        this.drawOreBlockTexture(ctx, size, r, g, b, seed);
        break;
      default:
        this.drawDefaultTexture(ctx, size, r, g, b, seed);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    
    return texture;
  }

  generateBlockTexture(blockName, size = 16) {
    if (this.textureCache.has(blockName)) {
      return this.textureCache.get(blockName);
    }
    
    const texture = this.generateProceduralTexture(blockName, size);
    this.textureCache.set(blockName, texture);
    
    return texture;
  }

  async getTextureAsync(blockName) {
    if (this.textureCache.has(blockName)) {
      return this.textureCache.get(blockName);
    }
    
    const fileTexture = await this.loadTextureFromFile(blockName);
    if (fileTexture) {
      this.textureCache.set(blockName, fileTexture);
      return fileTexture;
    }
    
    return this.generateBlockTexture(blockName);
  }
  
  getTextureType(blockName) {
    for (const [type, patterns] of Object.entries(BLOCK_TEXTURE_TYPES)) {
      for (const pattern of patterns) {
        if (pattern.startsWith('_')) {
          if (blockName.includes(pattern)) return type;
        } else if (blockName === pattern || blockName.includes(pattern.replace('minecraft:', ''))) {
          return type;
        }
      }
    }
    return 'default';
  }
  
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }
  
  seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
  
  drawStoneTexture(ctx, size, r, g, b, seed) {
    for (let i = 0; i < size * 2; i++) {
      const x = Math.floor(this.seededRandom(seed + i) * size);
      const y = Math.floor(this.seededRandom(seed + i + 100) * size);
      const shade = this.seededRandom(seed + i + 200) > 0.5 ? 20 : -20;
      ctx.fillStyle = `rgb(${Math.min(255, Math.max(0, r + shade))}, ${Math.min(255, Math.max(0, g + shade))}, ${Math.min(255, Math.max(0, b + shade))})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }
  
  drawOreTexture(ctx, size, r, g, b, seed, blockName) {
    this.drawStoneTexture(ctx, size, r, g, b, seed);
    
    let oreColor;
    if (blockName.includes('coal')) oreColor = [30, 30, 30];
    else if (blockName.includes('iron')) oreColor = [210, 180, 150];
    else if (blockName.includes('gold')) oreColor = [255, 215, 0];
    else if (blockName.includes('diamond')) oreColor = [100, 220, 230];
    else if (blockName.includes('emerald')) oreColor = [50, 200, 50];
    else if (blockName.includes('redstone')) oreColor = [200, 30, 30];
    else if (blockName.includes('lapis')) oreColor = [30, 70, 180];
    else if (blockName.includes('copper')) oreColor = [180, 100, 60];
    else oreColor = [200, 200, 200];
    
    for (let i = 0; i < 6; i++) {
      const x = Math.floor(this.seededRandom(seed + i * 50) * (size - 2));
      const y = Math.floor(this.seededRandom(seed + i * 50 + 25) * (size - 2));
      ctx.fillStyle = `rgb(${oreColor[0]}, ${oreColor[1]}, ${oreColor[2]})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }
  
  drawDirtTexture(ctx, size, r, g, b, seed) {
    for (let i = 0; i < size * 3; i++) {
      const x = Math.floor(this.seededRandom(seed + i) * size);
      const y = Math.floor(this.seededRandom(seed + i + 100) * size);
      const shade = (this.seededRandom(seed + i + 200) - 0.5) * 40;
      ctx.fillStyle = `rgb(${Math.min(255, Math.max(0, r + shade))}, ${Math.min(255, Math.max(0, g + shade))}, ${Math.min(255, Math.max(0, b + shade))})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  
  drawGrassTexture(ctx, size, r, g, b, seed) {
    this.drawDirtTexture(ctx, size, r, g, b, seed);
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < 3; y++) {
        if (this.seededRandom(seed + x + y * 100) > 0.3) {
          const shade = (this.seededRandom(seed + x * 2 + y * 50) - 0.5) * 30;
          ctx.fillStyle = `rgb(${Math.min(255, Math.max(0, 80 + shade))}, ${Math.min(255, Math.max(0, 160 + shade))}, ${Math.min(255, Math.max(0, 50 + shade))})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }
  
  drawSandTexture(ctx, size, r, g, b, seed) {
    for (let i = 0; i < size * 4; i++) {
      const x = Math.floor(this.seededRandom(seed + i) * size);
      const y = Math.floor(this.seededRandom(seed + i + 100) * size);
      const shade = (this.seededRandom(seed + i + 200) - 0.5) * 25;
      ctx.fillStyle = `rgb(${Math.min(255, Math.max(0, r + shade))}, ${Math.min(255, Math.max(0, g + shade))}, ${Math.min(255, Math.max(0, b + shade))})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  
  drawPlanksTexture(ctx, size, r, g, b, seed) {
    const plankHeight = size / 4;
    for (let i = 0; i < 4; i++) {
      const shade = ((i % 2) * 15) - 7;
      ctx.fillStyle = `rgb(${Math.min(255, Math.max(0, r + shade))}, ${Math.min(255, Math.max(0, g + shade))}, ${Math.min(255, Math.max(0, b + shade))})`;
      ctx.fillRect(0, i * plankHeight, size, plankHeight);
      
      ctx.fillStyle = `rgba(0, 0, 0, 0.15)`;
      ctx.fillRect(0, i * plankHeight, size, 1);
    }
    
    for (let i = 0; i < 3; i++) {
      const x = Math.floor(this.seededRandom(seed + i) * size);
      ctx.fillStyle = `rgba(0, 0, 0, 0.1)`;
      ctx.fillRect(x, 0, 1, size);
    }
  }
  
  drawLogTexture(ctx, size, r, g, b, seed) {
    for (let y = 0; y < size; y++) {
      const shade = (y % 4 < 2) ? 10 : -10;
      ctx.fillStyle = `rgb(${Math.min(255, Math.max(0, r + shade))}, ${Math.min(255, Math.max(0, g + shade))}, ${Math.min(255, Math.max(0, b + shade))})`;
      ctx.fillRect(0, y, size, 1);
    }
    
    for (let i = 0; i < 4; i++) {
      const x = Math.floor(this.seededRandom(seed + i) * size);
      const y = Math.floor(this.seededRandom(seed + i + 100) * size);
      ctx.fillStyle = `rgba(0, 0, 0, 0.2)`;
      ctx.fillRect(x, y, 1, 2);
    }
  }
  
  drawLeavesTexture(ctx, size, r, g, b, seed) {
    for (let i = 0; i < size * 4; i++) {
      const x = Math.floor(this.seededRandom(seed + i) * size);
      const y = Math.floor(this.seededRandom(seed + i + 100) * size);
      const shade = (this.seededRandom(seed + i + 200) - 0.5) * 50;
      ctx.fillStyle = `rgb(${Math.min(255, Math.max(0, r + shade))}, ${Math.min(255, Math.max(0, g + shade))}, ${Math.min(255, Math.max(0, b + shade))})`;
      ctx.fillRect(x, y, 2, 2);
    }
    
    for (let i = 0; i < 3; i++) {
      const x = Math.floor(this.seededRandom(seed + i + 500) * size);
      const y = Math.floor(this.seededRandom(seed + i + 600) * size);
      ctx.fillStyle = `rgba(0, 0, 0, 0.3)`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  
  drawBricksTexture(ctx, size, r, g, b, seed) {
    const brickHeight = size / 4;
    const brickWidth = size / 2;
    
    for (let row = 0; row < 4; row++) {
      const offset = (row % 2) * (brickWidth / 2);
      for (let col = -1; col < 3; col++) {
        const x = col * brickWidth + offset;
        const y = row * brickHeight;
        const shade = (this.seededRandom(seed + row * 10 + col) - 0.5) * 20;
        ctx.fillStyle = `rgb(${Math.min(255, Math.max(0, r + shade))}, ${Math.min(255, Math.max(0, g + shade))}, ${Math.min(255, Math.max(0, b + shade))})`;
        ctx.fillRect(x + 1, y + 1, brickWidth - 1, brickHeight - 1);
      }
    }
    
    ctx.fillStyle = `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`;
    for (let row = 0; row <= 4; row++) {
      ctx.fillRect(0, row * brickHeight, size, 1);
    }
    for (let row = 0; row < 4; row++) {
      const offset = (row % 2) * (brickWidth / 2);
      for (let col = 0; col < 3; col++) {
        ctx.fillRect(col * brickWidth + offset, row * brickHeight, 1, brickHeight);
      }
    }
  }
  
  drawCobblestoneTexture(ctx, size, r, g, b, seed) {
    for (let i = 0; i < 12; i++) {
      const x = Math.floor(this.seededRandom(seed + i) * (size - 4));
      const y = Math.floor(this.seededRandom(seed + i + 100) * (size - 4));
      const w = 2 + Math.floor(this.seededRandom(seed + i + 200) * 3);
      const h = 2 + Math.floor(this.seededRandom(seed + i + 300) * 3);
      const shade = (this.seededRandom(seed + i + 400) - 0.5) * 40;
      ctx.fillStyle = `rgb(${Math.min(255, Math.max(0, r + shade))}, ${Math.min(255, Math.max(0, g + shade))}, ${Math.min(255, Math.max(0, b + shade))})`;
      ctx.fillRect(x, y, w, h);
    }
  }
  
  drawGlassTexture(ctx, size, r, g, b, seed) {
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
    ctx.fillRect(0, 0, size, size);
    
    ctx.strokeStyle = `rgba(255, 255, 255, 0.5)`;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, size - 1, size - 1);
    
    ctx.fillStyle = `rgba(255, 255, 255, 0.2)`;
    ctx.fillRect(1, 1, 3, 3);
  }
  
  drawBedrockTexture(ctx, size, r, g, b, seed) {
    for (let i = 0; i < 20; i++) {
      const x = Math.floor(this.seededRandom(seed + i) * size);
      const y = Math.floor(this.seededRandom(seed + i + 100) * size);
      const s = 1 + Math.floor(this.seededRandom(seed + i + 200) * 3);
      const shade = this.seededRandom(seed + i + 300) > 0.5 ? 30 : -20;
      ctx.fillStyle = `rgb(${Math.min(255, Math.max(0, r + shade))}, ${Math.min(255, Math.max(0, g + shade))}, ${Math.min(255, Math.max(0, b + shade))})`;
      ctx.fillRect(x, y, s, s);
    }
  }
  
  drawObsidianTexture(ctx, size, r, g, b, seed) {
    for (let i = 0; i < 15; i++) {
      const x = Math.floor(this.seededRandom(seed + i) * size);
      const y = Math.floor(this.seededRandom(seed + i + 100) * size);
      ctx.fillStyle = `rgba(80, 40, 120, 0.3)`;
      ctx.fillRect(x, y, 2, 2);
    }
    
    ctx.fillStyle = `rgba(255, 255, 255, 0.1)`;
    ctx.fillRect(2, 2, 2, 2);
  }
  
  drawOreBlockTexture(ctx, size, r, g, b, seed) {
    for (let i = 0; i < 8; i++) {
      const x = Math.floor(this.seededRandom(seed + i) * size);
      const y = Math.floor(this.seededRandom(seed + i + 100) * size);
      const shade = (this.seededRandom(seed + i + 200) - 0.5) * 30;
      ctx.fillStyle = `rgb(${Math.min(255, Math.max(0, r + shade))}, ${Math.min(255, Math.max(0, g + shade))}, ${Math.min(255, Math.max(0, b + shade))})`;
      ctx.fillRect(x, y, 3, 3);
    }
    
    ctx.fillStyle = `rgba(255, 255, 255, 0.15)`;
    ctx.fillRect(1, 1, 4, 4);
  }
  
  drawDefaultTexture(ctx, size, r, g, b, seed) {
    for (let i = 0; i < size * 2; i++) {
      const x = Math.floor(this.seededRandom(seed + i) * size);
      const y = Math.floor(this.seededRandom(seed + i + 100) * size);
      const shade = (this.seededRandom(seed + i + 200) - 0.5) * 30;
      ctx.fillStyle = `rgb(${Math.min(255, Math.max(0, r + shade))}, ${Math.min(255, Math.max(0, g + shade))}, ${Math.min(255, Math.max(0, b + shade))})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  
  createTurtle() {
    const group = new THREE.Group();
    
    const bodyGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.9);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4ade80 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.3;
    group.add(body);
    
    const shellGeometry = new THREE.BoxGeometry(0.9, 0.3, 1.0);
    const shellMaterial = new THREE.MeshLambertMaterial({ color: 0x2d8a4e });
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    shell.position.y = 0.55;
    group.add(shell);
    
    const headGeometry = new THREE.BoxGeometry(0.35, 0.35, 0.3);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0x4ade80 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 0.3, -0.55);
    group.add(head);
    
    const screenGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.05);
    const screenMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(0, 0.5, -0.45);
    group.add(screen);
    
    const dirArrowGeometry = new THREE.ConeGeometry(0.15, 0.3, 4);
    const dirArrowMaterial = new THREE.MeshLambertMaterial({ color: 0xff4444 });
    const dirArrow = new THREE.Mesh(dirArrowGeometry, dirArrowMaterial);
    dirArrow.rotation.x = Math.PI / 2;
    dirArrow.position.set(0, 0.7, -0.7);
    group.add(dirArrow);
    
    this.turtleMesh = group;
    this.scene.add(this.turtleMesh);
  }
  
  updateTurtle(position, direction) {
    if (!this.turtleMesh) return;
    
    this.turtlePosition = position;
    this.turtleDirection = direction;
    
    this.turtleMesh.position.set(position.x, position.y, position.z);
    
    const rotations = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
    this.turtleMesh.rotation.y = rotations[direction] || 0;
  }
  
  focusOnTurtle() {
    if (!this.turtleMesh) return;
    
    const pos = this.turtlePosition;
    this.controls.target.set(pos.x, pos.y, pos.z);
    this.camera.position.set(pos.x + 8, pos.y + 6, pos.z + 8);
  }
  
  hashStringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash;
    }
    
    const h = Math.abs(hash % 360);
    const s = 40 + Math.abs((hash >> 8) % 30);
    const l = 35 + Math.abs((hash >> 16) % 25);
    
    const c = (1 - Math.abs(2 * l / 100 - 1)) * s / 100;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l / 100 - c / 2;
    
    let r, g, b;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    
    return (r << 16) | (g << 8) | b;
  }

  getBlockColor(blockName) {
    if (BLOCK_COLORS[blockName]) {
      return BLOCK_COLORS[blockName];
    }
    
    for (const [key, color] of Object.entries(BLOCK_COLORS)) {
      if (blockName.includes(key.replace('minecraft:', ''))) {
        return color;
      }
    }
    
    return this.hashStringToColor(blockName);
  }
  
  getBlockOpacity(blockName) {
    for (const [key, opacity] of Object.entries(BLOCK_OPACITY)) {
      if (blockName.includes(key.replace('minecraft:', ''))) {
        return opacity;
      }
    }
    return 1.0;
  }
  
  addBlock(x, y, z, blockName, blockData = null) {
    const key = `${x},${y},${z}`;
    
    if (blockName === 'minecraft:air' || blockName === 'air') {
      this.removeBlock(x, y, z);
      return;
    }
    
    this.blocks.set(key, { x, y, z, name: blockName, data: blockData });
    
    if (this.meshes.has(key)) {
      this.scene.remove(this.meshes.get(key));
    }
    
    const geometry = new THREE.BoxGeometry(0.98, 0.98, 0.98);
    const opacity = this.getBlockOpacity(blockName);
    
    const texture = this.generateBlockTexture(blockName);
    const material = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: opacity < 1,
      opacity: opacity
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.userData = { blockName, x, y, z, data: blockData };
    
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.3, transparent: true });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    mesh.add(wireframe);
    
    this.scene.add(mesh);
    this.meshes.set(key, mesh);
    
    this.loadTextureFromFile(blockName).then((fileTexture) => {
      if (fileTexture && this.meshes.has(key)) {
        const currentMesh = this.meshes.get(key);
        if (currentMesh && currentMesh.material) {
          currentMesh.material.map = fileTexture;
          currentMesh.material.needsUpdate = true;
        }
      }
    });
  }
  
  removeBlock(x, y, z) {
    const key = `${x},${y},${z}`;
    
    if (this.meshes.has(key)) {
      this.scene.remove(this.meshes.get(key));
      this.meshes.delete(key);
    }
    
    this.blocks.delete(key);
  }
  
  showLoading(show, current = 0, total = 0) {
    const loadingEl = document.getElementById('world-loading');
    const barEl = document.getElementById('world-loading-bar');
    const textEl = document.getElementById('world-loading-text');
    
    if (!loadingEl) return;
    
    if (show) {
      loadingEl.classList.remove('hidden');
      if (barEl && total > 0) {
        barEl.style.width = `${(current / total) * 100}%`;
      }
      if (textEl) {
        textEl.textContent = `${current} / ${total} blocks`;
      }
    } else {
      loadingEl.classList.add('hidden');
    }
  }

  updateBlocks(blocks) {
    if (!blocks || !Array.isArray(blocks)) return;
    
    const total = blocks.length;
    if (total === 0) return;
    
    if (total > 50) {
      this.showLoading(true, 0, total);
    }
    
    let index = 0;
    const batchSize = 20;
    
    const processBatch = () => {
      const end = Math.min(index + batchSize, total);
      
      for (let i = index; i < end; i++) {
        const block = blocks[i];
        
        // Explicitly handle air blocks as removals
        if (block.name === 'minecraft:air' || block.name === 'air') {
          this.removeBlock(block.x, block.y, block.z);
        } else {
          this.addBlock(block.x, block.y, block.z, block.name, block.data || null);
        }
      }
      
      index = end;
      
      if (total > 50) {
        this.showLoading(true, index, total);
      }
      
      if (index < total) {
        requestAnimationFrame(processBatch);
      } else {
        this.showLoading(false);
      }
    };
    
    requestAnimationFrame(processBatch);
  }
  
  clearBlocks() {
    this.meshes.forEach((mesh) => {
      this.scene.remove(mesh);
    });
    this.meshes.clear();
    this.blocks.clear();
  }
  
  addWaypoint(id, x, y, z, name, color = 0xff0000) {
    const key = id || `${x},${y},${z}`;
    
    if (this.waypointMeshes.has(key)) {
      this.scene.remove(this.waypointMeshes.get(key));
    }
    
    const group = new THREE.Group();
    
    const beaconGeometry = new THREE.CylinderGeometry(0.1, 0.1, 20, 8);
    const beaconMaterial = new THREE.MeshBasicMaterial({ 
      color: color, 
      transparent: true, 
      opacity: 0.5 
    });
    const beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
    beacon.position.y = 10;
    group.add(beacon);
    
    const markerGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const markerMaterial = new THREE.MeshLambertMaterial({ color: color });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.y = 0.5;
    group.add(marker);
    
    group.position.set(x, y, z);
    group.userData = { type: 'waypoint', id: key, name, x, y, z };
    
    this.scene.add(group);
    this.waypointMeshes.set(key, group);
    this.waypoints.set(key, { id: key, x, y, z, name, color });
  }
  
  removeWaypoint(id) {
    if (this.waypointMeshes.has(id)) {
      this.scene.remove(this.waypointMeshes.get(id));
      this.waypointMeshes.delete(id);
    }
    this.waypoints.delete(id);
  }
  
  updateWaypoints(waypoints) {
    if (!waypoints || !Array.isArray(waypoints)) return;
    
    waypoints.forEach(wp => {
      this.addWaypoint(wp.id, wp.x, wp.y, wp.z, wp.name, wp.color || 0xff0000);
    });
  }
  
  handleContextMenu(event) {
    event.preventDefault();
    
    const blockData = this.raycastBlock(event);
    if (blockData && this.contextMenuCallback) {
      this.contextMenuCallback(event, blockData);
    }
  }
  
  handleDoubleClick(event) {
    const blockData = this.raycastBlock(event);
    if (blockData && this.onBlockDoubleClick) {
      this.onBlockDoubleClick(blockData);
    }
  }
  
  setContextMenuCallback(callback) {
    this.contextMenuCallback = callback;
  }
  
  setDoubleClickCallback(callback) {
    this.onBlockDoubleClick = callback;
  }
  
  onResize() {
    if (!this.container) return;
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
  
  getBlockAt(x, y, z) {
    const key = `${x},${y},${z}`;
    return this.blocks.get(key);
  }
  
  raycastBlock(event) {
    if (!this.container) return null;
    
    const rect = this.container.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
    
    const meshArray = Array.from(this.meshes.values());
    const intersects = raycaster.intersectObjects(meshArray);
    
    if (intersects.length > 0) {
      return intersects[0].object.userData;
    }
    
    return null;
  }
}

if (typeof window !== 'undefined') {
  window.World3D = World3D;
}
