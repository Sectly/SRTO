const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const DATA_PATH = process.env.DATA_PATH
  ? path.resolve(process.env.DATA_PATH)
  : path.join(__dirname, '../data');

const WORLD_FILE = path.join(DATA_PATH, 'world.json');
const TURTLES_FILE = path.join(DATA_PATH, 'turtles.json');
const WAYPOINTS_FILE = path.join(DATA_PATH, 'waypoints.json');

const turtles = new Map();
const browsers = new Map();
const worldBlocks = new Map();
const waypoints = new Map();
const wsToTurtleId = new Map();
const wsToBrowserId = new Map();

function ensureDataDir() {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function loadWorldState() {
  try {
    ensureDataDir();
    if (fs.existsSync(WORLD_FILE)) {
      const data = JSON.parse(fs.readFileSync(WORLD_FILE, 'utf8'));
      data.forEach(block => {
        const key = `${block.x},${block.y},${block.z}`;
        worldBlocks.set(key, block);
      });
      console.log(`Loaded ${worldBlocks.size} blocks from world.json`);
    }
  } catch (e) {
    console.error('Failed to load world state:', e);
  }
}

function saveWorldState() {
  try {
    ensureDataDir();
    const blocks = Array.from(worldBlocks.values());
    fs.writeFileSync(WORLD_FILE, JSON.stringify(blocks));
  } catch (e) {
    console.error('Failed to save world state:', e);
  }
}

function loadWaypoints() {
  try {
    ensureDataDir();
    if (fs.existsSync(WAYPOINTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(WAYPOINTS_FILE, 'utf8'));
      data.forEach(wp => {
        waypoints.set(wp.id, wp);
      });
      console.log(`Loaded ${waypoints.size} waypoints`);
    }
    
    if (!waypoints.has('origin')) {
      const originWaypoint = {
        id: 'origin',
        name: 'Origin',
        x: 0,
        y: 0,
        z: 0,
        color: 0x00ff00
      };
      waypoints.set('origin', originWaypoint);
      saveWaypoints();
      console.log('Created Origin waypoint at 0, 0, 0');
    }
  } catch (e) {
    console.error('Failed to load waypoints:', e);
  }
}

function saveWaypoints() {
  try {
    ensureDataDir();
    const data = Array.from(waypoints.values());
    fs.writeFileSync(WAYPOINTS_FILE, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save waypoints:', e);
  }
}

function loadTurtleState() {
  try {
    ensureDataDir();
    if (fs.existsSync(TURTLES_FILE)) {
      const data = JSON.parse(fs.readFileSync(TURTLES_FILE, 'utf8'));
      data.forEach(turtle => {
        turtles.set(turtle.id, {
          ...turtle,
          ws: null,
          online: false
        });
      });
      console.log(`Loaded ${turtles.size} turtle states`);
    }
  } catch (e) {
    console.error('Failed to load turtle state:', e);
  }
}

function saveTurtleState() {
  try {
    ensureDataDir();
    const data = [];
    turtles.forEach((turtle, id) => {
      data.push({
        id: id,
        label: turtle.label,
        position: turtle.position,
        direction: turtle.direction,
        fuel: turtle.fuel,
        maxFuel: turtle.maxFuel,
        turtleType: turtle.turtleType,
        traits: turtle.traits,
        equipment: turtle.equipment,
        peripherals: turtle.peripherals
      });
    });
    fs.writeFileSync(TURTLES_FILE, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save turtle state:', e);
  }
}

let saveTimer = null;
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveWorldState();
    saveTurtleState();
    saveTimer = null;
  }, 5000);
}

loadWorldState();
loadTurtleState();
loadWaypoints();

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

app.get('/api/turtles', (req, res) => {
  const turtleList = [];
  turtles.forEach((turtle, id) => {
    turtleList.push({
      id: id,
      label: turtle.label || `Turtle ${id}`,
      fuel: turtle.fuel || 0,
      maxFuel: turtle.maxFuel || 100000,
      position: turtle.position || { x: 0, y: 0, z: 0 },
      direction: turtle.direction || 0,
      inventory: turtle.inventory || [],
      selectedSlot: turtle.selectedSlot || 1,
      online: turtle.online || false
    });
  });
  res.json(turtleList);
});

app.get('/api/world', (req, res) => {
  const blocks = [];
  worldBlocks.forEach((block, key) => {
    blocks.push(block);
  });
  res.json(blocks);
});

app.get('/api/turtle/:id', (req, res) => {
  const turtle = turtles.get(req.params.id);
  if (turtle) {
    res.json({
      id: req.params.id,
      label: turtle.label || `Turtle ${req.params.id}`,
      fuel: turtle.fuel || 0,
      maxFuel: turtle.maxFuel || 100000,
      position: turtle.position || { x: 0, y: 0, z: 0 },
      direction: turtle.direction || 0,
      inventory: turtle.inventory || [],
      selectedSlot: turtle.selectedSlot || 1,
      online: turtle.online || false
    });
  } else {
    res.status(404).json({ error: 'Turtle not found' });
  }
});

app.post('/api/world/clear', (req, res) => {
  worldBlocks.clear();
  saveWorldState();
  broadcastToBrowsers({ type: 'world_clear' });
  res.json({ success: true });
});

app.get('/lua/startup.lua', (req, res) => {
  res.sendFile(path.join(__dirname, '../lua/startup.lua'));
});

app.get('/install.lua', (req, res) => {
  res.sendFile(path.join(__dirname, '../lua/install.lua'));
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      handleMessage(ws, data);
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  });

  ws.on('close', () => {
    if (wsToTurtleId.has(ws)) {
      const turtleId = wsToTurtleId.get(ws);
      const turtle = turtles.get(turtleId);
      if (turtle) {
        turtle.online = false;
        turtle.ws = null;
      }
      wsToTurtleId.delete(ws);
      broadcastToBrowsers({ type: 'turtle_disconnect', id: turtleId });
      console.log(`Turtle ${turtleId} disconnected`);
      scheduleSave();
    }
    
    if (wsToBrowserId.has(ws)) {
      const browserId = wsToBrowserId.get(ws);
      browsers.delete(browserId);
      wsToBrowserId.delete(ws);
      console.log(`Browser ${browserId} disconnected`);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function handleMessage(ws, data) {
  switch (data.type) {
    case 'turtle_connect':
      handleTurtleConnect(ws, data);
      break;
    case 'browser_connect':
      handleBrowserConnect(ws, data);
      break;
    case 'turtle_update':
      handleTurtleUpdate(ws, data);
      break;
    case 'command':
      handleCommand(data);
      break;
    case 'command_result':
      handleCommandResult(ws, data);
      break;
    case 'world_update':
      handleWorldUpdate(data);
      break;
    case 'console_output':
      handleConsoleOutput(ws, data);
      break;
    case 'inventory_update':
      handleInventoryUpdate(ws, data);
      break;
    case 'peripheral_attached':
    case 'peripheral_detached':
      handlePeripheralUpdate(ws, data);
      break;
    case 'add_waypoint':
      handleAddWaypoint(ws, data);
      break;
    case 'forget_block':
      handleForgetBlock(ws, data);
      break;
    case 'gps_calibrated':
      handleGPSCalibrated(ws, data);
      break;
    case 'container_inventory':
      broadcastToBrowsers(data);
      break;
    default:
      console.log('Unknown message type:', data.type);
  }
}

function handleTurtleConnect(ws, data) {
  const turtleId = data.id ? String(data.id) : uuidv4();
  
  const existingTurtle = turtles.get(turtleId);
  if (existingTurtle) {
    if (existingTurtle.ws && existingTurtle.ws !== ws) {
      wsToTurtleId.delete(existingTurtle.ws);
    }
    existingTurtle.ws = ws;
    existingTurtle.online = true;
    existingTurtle.label = data.label || existingTurtle.label;
    existingTurtle.fuel = data.fuel !== undefined ? data.fuel : existingTurtle.fuel;
    existingTurtle.maxFuel = data.maxFuel || existingTurtle.maxFuel;
    existingTurtle.position = data.position || existingTurtle.position;
    existingTurtle.direction = data.direction !== undefined ? data.direction : existingTurtle.direction;
    existingTurtle.inventory = data.inventory || existingTurtle.inventory;
    existingTurtle.selectedSlot = data.selectedSlot || existingTurtle.selectedSlot;
    existingTurtle.hasGPS = data.hasGPS || false;
    existingTurtle.turtleType = data.turtleType || existingTurtle.turtleType || 'normal';
    existingTurtle.traits = data.traits || existingTurtle.traits || [];
    existingTurtle.equipment = data.equipment || existingTurtle.equipment || { left: null, right: null };
    existingTurtle.peripherals = data.peripherals || existingTurtle.peripherals || {};
  } else {
    turtles.set(turtleId, {
      ws: ws,
      online: true,
      label: data.label || `Turtle ${turtleId}`,
      fuel: data.fuel !== undefined ? data.fuel : 0,
      maxFuel: data.maxFuel || 100000,
      position: data.position || { x: 0, y: 0, z: 0 },
      direction: data.direction !== undefined ? data.direction : 0,
      inventory: data.inventory || [],
      selectedSlot: data.selectedSlot || 1,
      hasGPS: data.hasGPS || false,
      turtleType: data.turtleType || 'normal',
      traits: data.traits || [],
      equipment: data.equipment || { left: null, right: null },
      peripherals: data.peripherals || {},
      commandQueue: []
    });
  }

  wsToTurtleId.set(ws, turtleId);
  ws.send(JSON.stringify({ type: 'connected', id: turtleId }));
  broadcastToBrowsers({ type: 'turtle_connect', id: turtleId, turtle: getTurtleData(turtleId) });
  console.log(`Turtle ${turtleId} connected`);
  scheduleSave();
}

function handleBrowserConnect(ws, data) {
  const browserId = uuidv4();
  browsers.set(browserId, { ws: ws });
  wsToBrowserId.set(ws, browserId);
  
  const turtleList = [];
  turtles.forEach((turtle, id) => {
    turtleList.push({ id: id, ...getTurtleData(id) });
  });
  
  ws.send(JSON.stringify({ 
    type: 'init', 
    turtles: turtleList,
    world: Array.from(worldBlocks.values()),
    waypoints: Array.from(waypoints.values())
  }));
  
  console.log(`Browser ${browserId} connected`);
}

function handleTurtleUpdate(ws, data) {
  const turtleId = wsToTurtleId.get(ws);
  if (!turtleId) return;
  
  const turtle = turtles.get(turtleId);
  if (turtle) {
    if (data.fuel !== undefined) turtle.fuel = data.fuel;
    if (data.position) turtle.position = data.position;
    if (data.direction !== undefined) turtle.direction = data.direction;
    if (data.inventory) turtle.inventory = data.inventory;
    if (data.selectedSlot) turtle.selectedSlot = data.selectedSlot;
    if (data.label) turtle.label = data.label;
    if (data.queueLength !== undefined) turtle.queueLength = data.queueLength;
    
    broadcastToBrowsers({ 
      type: 'turtle_update', 
      id: turtleId, 
      data: getTurtleData(turtleId)
    });
    scheduleSave();
  }
}

function handleCommand(data) {
  const turtle = turtles.get(data.turtleId);
  if (turtle && turtle.ws && turtle.online && turtle.ws.readyState === WebSocket.OPEN) {
    turtle.ws.send(JSON.stringify({
      type: 'command',
      command: data.command,
      args: data.args || [],
      queued: data.queued || false
    }));
  }
}

function handleCommandResult(ws, data) {
  const turtleId = wsToTurtleId.get(ws);
  if (!turtleId) return;
  
  broadcastToBrowsers({
    type: 'command_result',
    turtleId: turtleId,
    command: data.command,
    success: data.success,
    result: data.result,
    error: data.error
  });
}

function handleWorldUpdate(data) {
  if (data.blocks) {
    data.blocks.forEach(block => {
      const key = `${block.x},${block.y},${block.z}`;
      if (block.name === 'minecraft:air' || block.name === 'air') {
        worldBlocks.delete(key);
      } else {
        worldBlocks.set(key, block);
      }
    });
    broadcastToBrowsers({ type: 'world_update', blocks: data.blocks });
    scheduleSave();
  }
}

function handleConsoleOutput(ws, data) {
  const turtleId = wsToTurtleId.get(ws);
  if (!turtleId) return;
  
  broadcastToBrowsers({
    type: 'console_output',
    turtleId: turtleId,
    output: data.output
  });
}

function handleInventoryUpdate(ws, data) {
  const turtleId = wsToTurtleId.get(ws);
  if (!turtleId) return;
  
  const turtle = turtles.get(turtleId);
  if (turtle) {
    if (data.inventory) turtle.inventory = data.inventory;
    if (data.selectedSlot) turtle.selectedSlot = data.selectedSlot;
    
    broadcastToBrowsers({
      type: 'inventory_update',
      turtleId: turtleId,
      inventory: data.inventory,
      selectedSlot: data.selectedSlot
    });
  }
}

function handlePeripheralUpdate(ws, data) {
  const turtleId = wsToTurtleId.get(ws);
  if (!turtleId) return;
  
  const turtle = turtles.get(turtleId);
  if (turtle) {
    if (data.peripherals) turtle.peripherals = data.peripherals;
    if (data.equipment) turtle.equipment = data.equipment;
    if (data.turtleType) turtle.turtleType = data.turtleType;
    if (data.traits) turtle.traits = data.traits;
    
    broadcastToBrowsers({
      type: data.type,
      turtleId: turtleId,
      peripherals: data.peripherals,
      equipment: data.equipment,
      turtleType: data.turtleType,
      traits: data.traits,
      side: data.side
    });
    scheduleSave();
  }
}

function handleAddWaypoint(ws, data) {
  const { x, y, z, name } = data;
  const id = `wp_${Date.now()}`;
  const waypoint = {
    id,
    name,
    x,
    y,
    z,
    color: 0xff0000
  };
  
  waypoints.set(id, waypoint);
  saveWaypoints();
  
  broadcastToBrowsers({
    type: 'waypoint_added',
    waypoint: waypoint
  });
}

function handleForgetBlock(ws, data) {
  const { x, y, z } = data;
  const key = `${x},${y},${z}`;
  
  if (worldBlocks.has(key)) {
    worldBlocks.delete(key);
    scheduleSave();
    
    broadcastToBrowsers({
      type: 'block_forgotten',
      x, y, z
    });
  }
}

function handleGPSCalibrated(ws, data) {
  const turtleId = wsToTurtleId.get(ws);
  if (!turtleId) return;
  
  const turtle = turtles.get(turtleId);
  if (turtle && data.success) {
    turtle.gpsOffset = data.offset;
    scheduleSave();
  }
  
  broadcastToBrowsers({
    type: 'gps_calibrated',
    turtleId: turtleId,
    success: data.success,
    offset: data.offset,
    error: data.error
  });
}

function getTurtleData(turtleId) {
  const turtle = turtles.get(turtleId);
  if (!turtle) return null;
  return {
    label: turtle.label,
    fuel: turtle.fuel,
    maxFuel: turtle.maxFuel,
    position: turtle.position,
    direction: turtle.direction,
    inventory: turtle.inventory,
    selectedSlot: turtle.selectedSlot,
    online: turtle.online,
    hasGPS: turtle.hasGPS,
    queueLength: turtle.queueLength || 0,
    turtleType: turtle.turtleType || 'normal',
    traits: turtle.traits || [],
    equipment: turtle.equipment || { left: null, right: null },
    peripherals: turtle.peripherals || {},
    gpsOffset: turtle.gpsOffset
  };
}

function broadcastToBrowsers(data) {
  const message = JSON.stringify(data);
  browsers.forEach((browser) => {
    if (browser.ws && browser.ws.readyState === WebSocket.OPEN) {
      browser.ws.send(message);
    }
  });
}

process.on('SIGINT', () => {
  console.log('Saving state before exit...');
  saveWorldState();
  saveTurtleState();
  saveWaypoints();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Saving state before exit...');
  saveWorldState();
  saveTurtleState();
  saveWaypoints();
  process.exit(0);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`SRTO Server running on http://0.0.0.0:${PORT}`);
  console.log(`WebSocket server running on ws://0.0.0.0:${PORT}`);
});
