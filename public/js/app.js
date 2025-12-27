let ws = null;
let selectedTurtleId = null;
let turtles = new Map();
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;
let world3d = null;
let draggedSlot = null;
let commandHistory = [];
let historyIndex = -1;
let contextMenuBlock = null;
let waypoints = new Map();
let pendingWaypointPos = null;
let cachedInventories = new Map();
let itemContextSlot = null;
let itemContextSource = null;
let currentExternalInventory = null;

const CONTAINER_BLOCKS = [
  'chest', 'barrel', 'shulker_box', 'hopper', 'dropper', 'dispenser',
  'furnace', 'blast_furnace', 'smoker', 'brewing_stand', 'trapped_chest',
  'ender_chest', 'storage', 'crate', 'drawer', 'bin', 'vault'
];

const TOOL_ICONS = {
  'pickaxe': '⛏',
  'axe': '🪓',
  'shovel': '🔨',
  'hoe': '🌾',
  'sword': '🗡',
  'modem': '📡',
  'speaker': '🔊',
  'scanner': '📊',
  'workbench': '🔧',
  'introspection': '🔍',
  'kinetic': '⚡',
  'peripheral': '🔌'
};

const MOD_PERIPHERALS = {
  'advancedperipherals': ['geo_scanner', 'colony_integrator', 'chat_box', 'me_bridge', 'rs_bridge', 'energy_detector', 'nbt_storage', 'environment_detector', 'player_detector', 'redstone_integrator', 'inventory_manager', 'block_reader'],
  'plethora': ['scanner', 'introspection', 'kinetic', 'laser', 'overlay'],
  'computronics': ['tape_drive', 'camera', 'radar', 'colorful_lamp', 'chat_box', 'speaker'],
  'mekanism': ['digital_miner', 'fuelwood_heater', 'chemical_tank'],
  'create': ['train_station', 'display_board', 'speedometer'],
  'ae2': ['me_bridge', 'crafting_cpu'],
  'refined_storage': ['rs_bridge'],
  'botania': ['mana_pool', 'spreader'],
  'immersive_engineering': ['redstone_probe', 'capacitor']
};

function getWebSocketUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
}

function connect() {
  const wsUrl = getWebSocketUrl();
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('Connected to server');
    reconnectAttempts = 0;
    updateConnectionStatus(true);
    ws.send(JSON.stringify({ type: 'browser_connect' }));
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleServerMessage(data);
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  };

  ws.onclose = () => {
    console.log('Disconnected from server');
    updateConnectionStatus(false);
    attemptReconnect();
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

function attemptReconnect() {
  if (reconnectAttempts < maxReconnectAttempts) {
    reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
    console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts})`);
    setTimeout(connect, delay);
  }
}

function updateConnectionStatus(connected) {
  const statusEl = document.getElementById('connection-status');
  if (connected) {
    statusEl.innerHTML = `
      <span class="w-3 h-3 rounded-full bg-green-500 online-indicator"></span>
      <span class="text-sm text-green-400">Connected</span>
    `;
  } else {
    statusEl.innerHTML = `
      <span class="w-3 h-3 rounded-full bg-red-500"></span>
      <span class="text-sm text-gray-400">Disconnected</span>
    `;
  }
}

function handleServerMessage(data) {
  switch (data.type) {
    case 'init':
      handleInit(data);
      break;
    case 'turtle_connect':
      handleTurtleConnect(data);
      break;
    case 'turtle_disconnect':
      handleTurtleDisconnect(data);
      break;
    case 'turtle_update':
      handleTurtleUpdate(data);
      break;
    case 'command_result':
      handleCommandResult(data);
      break;
    case 'console_output':
      handleConsoleOutput(data);
      break;
    case 'world_update':
      handleWorldUpdate(data);
      break;
    case 'world_clear':
      if (world3d) world3d.clearBlocks();
      break;
    case 'external_inventory':
      handleExternalInventory(data);
      break;
    case 'inventory_update':
      handleInventoryUpdateEvent(data);
      break;
    case 'peripheral_attached':
    case 'peripheral_detached':
      handlePeripheralEvent(data);
      break;
    case 'waypoints':
      handleWaypoints(data);
      break;
    case 'waypoint_added':
      handleWaypointAdded(data);
      break;
    case 'block_forgotten':
      handleBlockForgotten(data);
      break;
    case 'gps_calibrated':
      handleGPSCalibrated(data);
      break;
    case 'container_inventory':
      handleContainerInventory(data);
      break;
  }
}

function handleInit(data) {
  turtles.clear();
  if (data.turtles) {
    data.turtles.forEach(turtle => {
      turtles.set(turtle.id, turtle);
    });
  }
  
  if (data.world && world3d) {
    world3d.updateBlocks(data.world);
  }
  
  if (data.waypoints && world3d) {
    data.waypoints.forEach(wp => {
      waypoints.set(wp.id, wp);
      world3d.addWaypoint(wp.id, wp.x, wp.y, wp.z, wp.name, wp.color);
    });
  }
  
  renderTurtleList();
  updateServerUrl();
}

function handleTurtleConnect(data) {
  turtles.set(data.id, { id: data.id, ...data.turtle });
  renderTurtleList();
  addConsoleMessage(`Turtle ${data.id} connected`, 'success');
}

function handleTurtleDisconnect(data) {
  const turtle = turtles.get(data.id);
  if (turtle) {
    turtle.online = false;
    turtles.set(data.id, turtle);
  }
  renderTurtleList();
  if (selectedTurtleId === data.id) {
    updateTurtleStatus(turtle);
  }
  addConsoleMessage(`Turtle ${data.id} disconnected`, 'error');
}

function handleTurtleUpdate(data) {
  const turtle = turtles.get(data.id);
  if (turtle) {
    Object.assign(turtle, data.data);
    turtles.set(data.id, turtle);
  }
  renderTurtleList();
  if (selectedTurtleId === data.id) {
    updateTurtleDisplay(turtle);
    
    if (world3d && turtle.position) {
      world3d.updateTurtle(turtle.position, turtle.direction || 0);
    }
  }
}

function handleCommandResult(data) {
  const resultClass = data.success ? 'success' : 'error';
  const message = data.success 
    ? `${data.command}: ${JSON.stringify(data.result)}`
    : `${data.command} failed: ${data.error}`;
  addConsoleMessage(message, resultClass);

  if (data.command === 'inspect' && data.success && data.result) {
    updateBlockInfo(data.result);
  }
  
  if (data.command === 'getExternalInventory' && data.success && data.result) {
    updateExternalInventory(data.result);
  }
}

function handleConsoleOutput(data) {
  if (data.turtleId === selectedTurtleId) {
    addConsoleMessage(data.output, 'info');
  }
}

function handleWorldUpdate(data) {
  if (data.blocks && world3d) {
    world3d.updateBlocks(data.blocks);
  }
}

function handleExternalInventory(data) {
  if (data.turtleId === selectedTurtleId) {
    updateExternalInventory(data.inventory);
  }
}

function handleInventoryUpdateEvent(data) {
  const turtle = turtles.get(data.turtleId);
  if (turtle && data.inventory) {
    turtle.inventory = data.inventory;
    if (data.selectedSlot) turtle.selectedSlot = data.selectedSlot;
    turtles.set(data.turtleId, turtle);
    
    if (selectedTurtleId === data.turtleId) {
      updateInventoryDisplay(turtle);
      updateCraftingGrid(turtle);
    }
  }
}

function handlePeripheralEvent(data) {
  const isAttached = data.type === 'peripheral_attached';
  addConsoleMessage(`Peripheral ${isAttached ? 'attached' : 'detached'}: ${data.side || 'unknown'}`, isAttached ? 'success' : 'info');
  
  const turtle = turtles.get(data.turtleId);
  if (turtle) {
    if (data.peripherals) turtle.peripherals = data.peripherals;
    if (data.equipment) turtle.equipment = data.equipment;
    if (data.turtleType) turtle.turtleType = data.turtleType;
    if (data.traits) turtle.traits = data.traits;
    turtles.set(data.turtleId, turtle);
    
    if (selectedTurtleId === data.turtleId) {
      updatePeripheralsDisplay(turtle);
      updateEquipmentDisplay(turtle);
      updateTurtleType(turtle);
    }
  }
}

function renderTurtleList() {
  const listEl = document.getElementById('turtle-list');
  
  if (turtles.size === 0) {
    listEl.innerHTML = `
      <div class="text-center text-gray-500 py-6 text-sm">
        <p>No turtles connected</p>
        <p class="text-xs mt-1">Run startup script on turtle</p>
      </div>
    `;
    return;
  }

  let html = '';
  turtles.forEach((turtle, id) => {
    const isSelected = id === selectedTurtleId;
    const isOnline = turtle.online;
    const fuelPercent = turtle.maxFuel > 0 ? (turtle.fuel / turtle.maxFuel) * 100 : 0;
    const queueLen = turtle.queueLength || 0;
    
    html += `
      <div class="turtle-card ${isSelected ? 'selected' : ''} bg-turtle-accent/50 border border-turtle-accent rounded p-2 mb-1.5 cursor-pointer text-sm" onclick="selectTurtle('${id}')">
        <div class="flex items-center justify-between mb-1">
          <span class="font-semibold text-xs">${turtle.label || 'Turtle ' + id}</span>
          <div class="flex items-center gap-1">
            ${queueLen > 0 ? `<span class="text-xs text-yellow-400">[${queueLen}]</span>` : ''}
            <span class="w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 online-indicator' : 'bg-red-500'}"></span>
          </div>
        </div>
        <div class="text-xs text-gray-400 space-y-0.5">
          <div class="w-full bg-turtle-dark rounded-full h-1">
            <div class="bg-turtle-green h-1 rounded-full" style="width: ${fuelPercent}%"></div>
          </div>
          <div class="flex justify-between">
            <span>${turtle.position ? `${turtle.position.x}, ${turtle.position.y}, ${turtle.position.z}` : '?'}</span>
            <span>Fuel: ${turtle.fuel || 0}</span>
          </div>
        </div>
      </div>
    `;
  });

  listEl.innerHTML = html;
}

function selectTurtle(id) {
  selectedTurtleId = id;
  const turtle = turtles.get(id);
  
  document.getElementById('no-turtle-selected').classList.add('hidden');
  document.getElementById('turtle-control').classList.remove('hidden');
  
  if (!world3d) {
    world3d = new World3D('world-container');
    setupWorldInteraction();
  }
  
  if (turtle) {
    updateTurtleDisplay(turtle);
    
    if (world3d) {
      world3d.updateTurtle(turtle.position || { x: 0, y: 0, z: 0 }, turtle.direction || 0);
      world3d.focusOnTurtle();
    }
  }
  
  renderTurtleList();
  
  sendCommand('detectAll');
}

function setupWorldInteraction() {
  const container = document.getElementById('world-container');
  const hoverInfo = document.getElementById('block-hover-info');
  const blockName = document.getElementById('hover-block-name');
  const blockPos = document.getElementById('hover-block-pos');
  
  container.addEventListener('mousemove', (e) => {
    if (!world3d) return;
    const block = world3d.raycastBlock(e);
    if (block && block.blockName) {
      hoverInfo.classList.remove('hidden');
      blockName.textContent = block.blockName;
      blockPos.textContent = `(${block.x}, ${block.y}, ${block.z})`;
    } else {
      hoverInfo.classList.add('hidden');
    }
  });
  
  container.addEventListener('mouseleave', () => {
    hoverInfo.classList.add('hidden');
  });
  
  container.addEventListener('dblclick', (e) => {
    if (!world3d) return;
    const block = world3d.raycastBlock(e);
    if (block && block.x !== undefined) {
      addConsoleMessage(`Pathfinding to (${block.x}, ${block.y}, ${block.z})...`, 'info');
      sendCommand('pathfind', [block.x, block.y, block.z]);
    }
  });
}

function updateTurtleDisplay(turtle) {
  document.getElementById('turtle-name').textContent = turtle.label || `Turtle ${turtle.id || selectedTurtleId}`;
  document.getElementById('turtle-id').textContent = turtle.id || selectedTurtleId;
  updateTurtleStatus(turtle);
  updateTurtleType(turtle);
  updateFuelDisplay(turtle);
  updatePositionDisplay(turtle);
  updateInventoryDisplay(turtle);
  updateCraftingGrid(turtle);
  updateQueueDisplay(turtle);
  updateEquipmentDisplay(turtle);
  updatePeripheralsDisplay(turtle);
}

function updateTurtleType(turtle) {
  const typeEl = document.getElementById('turtle-type');
  const traitsEl = document.getElementById('turtle-traits');
  
  if (turtle.turtleType && turtle.turtleType !== 'normal') {
    typeEl.textContent = turtle.turtleType.replace('_', ' ');
    typeEl.classList.remove('hidden');
  } else {
    typeEl.classList.add('hidden');
  }
  
  if (turtle.traits && turtle.traits.length > 0) {
    traitsEl.textContent = turtle.traits.join(', ');
    traitsEl.classList.remove('hidden');
  } else {
    traitsEl.classList.add('hidden');
  }
}

function getToolIcon(itemName) {
  if (!itemName) return '';
  const name = itemName.toLowerCase();
  for (const [key, icon] of Object.entries(TOOL_ICONS)) {
    if (name.includes(key)) return icon;
  }
  return '🔧';
}

function formatEquipmentName(item) {
  if (!item) return null;
  const name = item.name || item.id || '';
  return name.replace('minecraft:', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function updateEquipmentDisplay(turtle) {
  const leftEl = document.getElementById('equip-left');
  const rightEl = document.getElementById('equip-right');
  
  if (!leftEl || !rightEl) return;
  
  const equipment = turtle.equipment || { left: null, right: null };
  
  if (equipment.left) {
    const name = formatEquipmentName(equipment.left);
    const icon = getToolIcon(equipment.left.name || equipment.left.id);
    leftEl.innerHTML = `
      <div class="text-lg">${icon}</div>
      <div class="text-xs text-center truncate w-full">${name}</div>
    `;
    leftEl.classList.add('bg-blue-900/50', 'border-blue-500');
    leftEl.classList.remove('border-turtle-accent');
  } else {
    leftEl.innerHTML = '<div class="text-gray-500 text-xs">Empty</div>';
    leftEl.classList.remove('bg-blue-900/50', 'border-blue-500');
    leftEl.classList.add('border-turtle-accent');
  }
  
  if (equipment.right) {
    const name = formatEquipmentName(equipment.right);
    const icon = getToolIcon(equipment.right.name || equipment.right.id);
    rightEl.innerHTML = `
      <div class="text-lg">${icon}</div>
      <div class="text-xs text-center truncate w-full">${name}</div>
    `;
    rightEl.classList.add('bg-blue-900/50', 'border-blue-500');
    rightEl.classList.remove('border-turtle-accent');
  } else {
    rightEl.innerHTML = '<div class="text-gray-500 text-xs">Empty</div>';
    rightEl.classList.remove('bg-blue-900/50', 'border-blue-500');
    rightEl.classList.add('border-turtle-accent');
  }
}

function updatePeripheralsDisplay(turtle) {
  const container = document.getElementById('peripherals-list');
  if (!container) return;
  
  const peripherals = turtle.peripherals || {};
  const names = Object.keys(peripherals);
  
  if (names.length === 0) {
    container.innerHTML = '<div class="text-xs text-gray-500">No peripherals</div>';
    return;
  }
  
  let html = '';
  for (const name of names) {
    const p = peripherals[name];
    const types = (p.types || []).join(', ');
    html += `<div class="text-xs bg-turtle-dark rounded px-2 py-1 mb-1">
      <span class="text-white">${name}</span>
      <span class="text-gray-400 ml-1">(${types})</span>
    </div>`;
  }
  container.innerHTML = html;
}

function updateQueueDisplay(turtle) {
  const queueEl = document.getElementById('queue-count');
  if (queueEl) {
    const queueLen = turtle.queueLength || 0;
    queueEl.textContent = queueLen > 0 ? `Queue: ${queueLen}` : '';
    queueEl.classList.toggle('hidden', queueLen === 0);
  }
}

function updateTurtleStatus(turtle) {
  const statusEl = document.getElementById('turtle-status');
  if (turtle && turtle.online) {
    statusEl.className = 'px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400';
    statusEl.textContent = 'Online';
  } else {
    statusEl.className = 'px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400';
    statusEl.textContent = 'Offline';
  }
}

function updateFuelDisplay(turtle) {
  const fuel = turtle.fuel || 0;
  const maxFuel = turtle.maxFuel || 100000;
  
  const fuelText = document.getElementById('fuel-text');
  if (fuelText) {
    fuelText.textContent = `${fuel} / ${maxFuel}`;
  }
  
  // Update fuel bar if it exists (legacy support)
  const fuelBar = document.getElementById('fuel-bar');
  if (fuelBar) {
    const percent = maxFuel > 0 ? (fuel / maxFuel) * 100 : 0;
    fuelBar.style.width = `${percent}%`;
    
    if (percent < 10) {
      fuelBar.className = 'bg-red-500 h-2 rounded-full transition-all';
    } else if (percent < 25) {
      fuelBar.className = 'bg-yellow-500 h-2 rounded-full transition-all';
    } else {
      fuelBar.className = 'bg-turtle-green h-2 rounded-full transition-all';
    }
  }
}

function updatePositionDisplay(turtle) {
  const pos = turtle.position || { x: 0, y: 0, z: 0 };
  document.getElementById('position-text').textContent = `${pos.x}, ${pos.y}, ${pos.z}`;
  
  const directions = ['North', 'East', 'South', 'West'];
  const dir = turtle.direction !== undefined ? turtle.direction : 0;
  document.getElementById('direction-text').textContent = directions[dir % 4] || 'Unknown';
  
  document.getElementById('slot-text').textContent = `Slot: ${turtle.selectedSlot || 1}`;
}

function updateInventoryDisplay(turtle) {
  const gridEl = document.getElementById('inventory-grid');
  const inventory = turtle.inventory || [];
  const selectedSlot = turtle.selectedSlot || 1;
  
  let html = '';
  for (let i = 1; i <= 16; i++) {
    const item = inventory[i - 1] || null;
    const isSelected = i === selectedSlot;
    
    html += `
      <div class="inventory-slot ${isSelected ? 'selected' : ''}" 
           onclick="selectSlot(${i})" 
           draggable="true"
           ondragstart="onTurtleDragStart(event, ${i})"
           ondragover="onDragOver(event)"
           ondrop="onDrop(event, ${i})"
           oncontextmenu="showTurtleItemMenu(event, ${i}, ${item ? `'${item.name}'` : 'null'}, ${item ? item.count : 0})"
           title="${item ? item.name + ' x' + item.count : 'Empty (Slot ' + i + ')'}">
        ${item ? `
          <div class="item-name">${getShortItemName(item.name)}</div>
          <span class="count">${item.count || 1}</span>
        ` : `<span class="slot-num">${i}</span>`}
      </div>
    `;
  }
  
  gridEl.innerHTML = html;
}

function onTurtleDragStart(event, slot) {
  draggedSlot = slot;
  event.dataTransfer.setData('text/plain', JSON.stringify({ source: 'turtle', slot }));
  event.dataTransfer.effectAllowed = 'move';
}

function showTurtleItemMenu(event, slot, itemName, count) {
  if (!itemName) return;
  showItemContextMenu(event, slot, 'turtle', itemName, count);
}

function updateCraftingGrid(turtle) {
  const craftSlots = [1, 2, 3, 5, 6, 7, 9, 10, 11];
  const inventory = turtle.inventory || [];
  
  const craftingGrid = document.getElementById('crafting-grid');
  if (!craftingGrid) return;
  
  craftingGrid.querySelectorAll('.craft-slot').forEach((slot) => {
    const slotNum = parseInt(slot.dataset.slot);
    const item = inventory[slotNum - 1];
    
    if (item) {
      slot.innerHTML = `
        <div class="item-name">${getShortItemName(item.name)}</div>
        <span class="count">${item.count || 1}</span>
      `;
      slot.classList.add('has-item');
    } else {
      slot.innerHTML = '';
      slot.classList.remove('has-item');
    }
  });
}

function updateExternalInventory(inventory) {
  const container = document.getElementById('external-inventory');
  const section = document.getElementById('external-inv-section');
  currentExternalInventory = inventory;
  
  if (!inventory || inventory.length === 0) {
    if (section) section.classList.add('hidden');
    container.innerHTML = '<div class="text-xs text-gray-500 col-span-6 text-center py-2">No chest detected</div>';
    return;
  }
  
  if (section) section.classList.remove('hidden');
  
  let html = '';
  inventory.forEach((item, index) => {
    if (item) {
      html += `
        <div class="external-slot" 
             draggable="true"
             ondragstart="onExternalDragStart(event, ${index + 1})"
             ondragover="onDragOver(event)"
             ondrop="onExternalDrop(event, ${index + 1})"
             onclick="pullFromChest(${index + 1})"
             oncontextmenu="showItemContextMenu(event, ${index + 1}, 'external', '${item.name}', ${item.count})"
             title="${item.name} x${item.count}">
          <div class="item-name">${getShortItemName(item.name)}</div>
          <span class="count">${item.count || 1}</span>
        </div>
      `;
    } else {
      html += `
        <div class="external-slot empty"
             ondragover="onDragOver(event)"
             ondrop="onExternalDrop(event, ${index + 1})">
        </div>
      `;
    }
  });
  
  container.innerHTML = html || '<div class="text-xs text-gray-500 col-span-6 text-center py-2">Chest is empty</div>';
}

function onDragStart(event, slot) {
  draggedSlot = slot;
  event.dataTransfer.effectAllowed = 'move';
}

function onDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

function onDrop(event, targetSlot) {
  event.preventDefault();
  
  try {
    const data = JSON.parse(event.dataTransfer.getData('text/plain'));
    
    if (data.source === 'external') {
      const count = event.ctrlKey ? 1 : 64;
      sendCommand('select', [targetSlot]);
      setTimeout(() => sendCommand('pullFromChest', [data.slot, count]), 100);
      setTimeout(() => sendCommand('getExternalInventory'), 600);
      draggedSlot = null;
      return;
    }
  } catch (e) {}
  
  if (draggedSlot && draggedSlot !== targetSlot) {
    const count = event.ctrlKey ? 1 : null;
    sendCommand('transferTo', [targetSlot, count]);
    selectSlot(draggedSlot);
  }
  draggedSlot = null;
}

function pullFromChest(slot, count) {
  sendCommand('pullFromChest', [slot, count || 64]);
}

function getShortItemName(name) {
  if (!name) return '';
  const parts = name.split(':');
  const itemName = parts[parts.length - 1];
  return itemName.replace(/_/g, ' ').substring(0, 5);
}

function selectSlot(slot) {
  sendCommand('select', [slot]);
}

function updateBlockInfo(block) {
  addConsoleMessage(`Block: ${block.name}`, 'info');
}

function sendCommand(command, args = [], queued = false) {
  if (!selectedTurtleId) {
    addConsoleMessage('No turtle selected', 'error');
    return;
  }
  
  const turtle = turtles.get(selectedTurtleId);
  if (!turtle || !turtle.online) {
    addConsoleMessage('Turtle is offline', 'error');
    return;
  }

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'command',
      turtleId: selectedTurtleId,
      command: command,
      args: args,
      queued: queued
    }));
  } else {
    addConsoleMessage('Not connected to server', 'error');
  }
}

function clearQueue() {
  sendCommand('clearQueue');
  addConsoleMessage('Clearing command queue...', 'info');
}

function renameTurtle() {
  const newName = prompt('Enter new turtle name:');
  if (newName && newName.trim()) {
    sendCommand('setLabel', [newName.trim()]);
  }
}

function gpsLocate() {
  sendCommand('gpsLocate');
}

function placeSign() {
  const text = prompt('Enter sign text:');
  if (text !== null) {
    sendCommand('placeSign', [text]);
  }
}

function rebootTurtle() {
  if (confirm('Are you sure you want to reboot this turtle?')) {
    sendCommand('reboot');
  }
}

function shutdownTurtle() {
  if (confirm('Are you sure you want to shut down this turtle?')) {
    sendCommand('shutdown');
  }
}

function executeLua() {
  const codeEl = document.getElementById('lua-code');
  const code = codeEl.value.trim();
  if (!code) return;
  
  commandHistory.push(code);
  if (commandHistory.length > 50) commandHistory.shift();
  historyIndex = commandHistory.length;
  
  sendCommand('eval', [code]);
  codeEl.value = '';
}

function addConsoleMessage(message, type = '') {
  const consoleEl = document.getElementById('console-output');
  const firstChild = consoleEl.querySelector('.text-gray-500');
  if (firstChild && firstChild.textContent === 'Waiting for output...') {
    consoleEl.innerHTML = '';
  }
  
  const lineEl = document.createElement('div');
  lineEl.className = `console-line ${type}`;
  const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  lineEl.textContent = `[${time}] ${message}`;
  consoleEl.appendChild(lineEl);
  consoleEl.scrollTop = consoleEl.scrollHeight;
  
  while (consoleEl.children.length > 50) {
    consoleEl.removeChild(consoleEl.firstChild);
  }
}

function clearConsole() {
  const consoleEl = document.getElementById('console-output');
  consoleEl.innerHTML = '<div class="text-gray-500">Console cleared</div>';
}

function updateServerUrl() {
  const urlEl = document.getElementById('server-url');
  const urlEl2 = document.getElementById('server-url-2');
  if (urlEl) {
    urlEl.textContent = window.location.origin;
  }
  if (urlEl2) {
    urlEl2.textContent = window.location.origin;
  }
}

function handleWaypoints(data) {
  if (data.waypoints && world3d) {
    data.waypoints.forEach(wp => {
      waypoints.set(wp.id, wp);
      world3d.addWaypoint(wp.id, wp.x, wp.y, wp.z, wp.name, wp.color);
    });
  }
}

function handleWaypointAdded(data) {
  if (data.waypoint && world3d) {
    const wp = data.waypoint;
    waypoints.set(wp.id, wp);
    world3d.addWaypoint(wp.id, wp.x, wp.y, wp.z, wp.name, wp.color);
    addConsoleMessage(`Waypoint "${wp.name}" added at ${wp.x}, ${wp.y}, ${wp.z}`, 'success');
  }
}

function handleBlockForgotten(data) {
  if (world3d) {
    world3d.removeBlock(data.x, data.y, data.z);
    addConsoleMessage(`Forgot block at ${data.x}, ${data.y}, ${data.z}`, 'info');
  }
}

function handleGPSCalibrated(data) {
  if (data.success) {
    addConsoleMessage(`GPS calibrated! Offset: ${data.offset.x}, ${data.offset.y}, ${data.offset.z}`, 'success');
  } else {
    addConsoleMessage(`GPS calibration failed: ${data.error || 'Unknown error'}`, 'error');
  }
}

function isContainerBlock(blockName) {
  if (!blockName) return false;
  const name = blockName.toLowerCase();
  return CONTAINER_BLOCKS.some(c => name.includes(c));
}

function showContextMenu(event, blockData) {
  const menu = document.getElementById('context-menu');
  const nameEl = document.getElementById('context-block-name');
  const posEl = document.getElementById('context-block-pos');
  
  contextMenuBlock = blockData;
  
  nameEl.textContent = blockData.blockName || 'Unknown';
  posEl.textContent = `${blockData.x}, ${blockData.y}, ${blockData.z}`;
  
  const invBtn = document.getElementById('context-inventory-btn');
  const scanInvBtn = document.getElementById('context-scan-inv-btn');
  const key = `${blockData.x},${blockData.y},${blockData.z}`;
  
  if (blockData.data && blockData.data.inventory) {
    invBtn.classList.remove('hidden');
  } else if (cachedInventories.has(key)) {
    invBtn.classList.remove('hidden');
  } else {
    invBtn.classList.add('hidden');
  }
  
  if (isContainerBlock(blockData.blockName)) {
    scanInvBtn.classList.remove('hidden');
  } else {
    scanInvBtn.classList.add('hidden');
  }
  
  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;
  menu.classList.remove('hidden');
}

function hideContextMenu() {
  const menu = document.getElementById('context-menu');
  menu.classList.add('hidden');
  contextMenuBlock = null;
}

function contextMenuAction(action) {
  if (!contextMenuBlock) return;
  
  const { x, y, z, blockName, data } = contextMenuBlock;
  const key = `${x},${y},${z}`;
  
  switch (action) {
    case 'goto':
      sendCommand('pathfind', [x, y, z], true);
      addConsoleMessage(`Navigating to ${x}, ${y}, ${z}...`, 'info');
      break;
    case 'waypoint':
      pendingWaypointPos = { x, y, z };
      document.getElementById('waypoint-modal').classList.remove('hidden');
      document.getElementById('waypoint-name').focus();
      break;
    case 'details':
      showBlockDetails({ x, y, z, blockName, data });
      break;
    case 'inventory':
      if (data && data.inventory) {
        showInventoryModal(data.inventory, blockName);
      } else if (cachedInventories.has(key)) {
        showInventoryModal(cachedInventories.get(key), blockName);
      }
      break;
    case 'scanInventory':
      scanContainerInventory(x, y, z, blockName);
      break;
    case 'forget':
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'forget_block',
          x, y, z
        }));
      }
      break;
  }
  
  hideContextMenu();
}

function showBlockDetails(block) {
  const modal = document.getElementById('block-details-modal');
  const content = document.getElementById('block-details-content');
  
  let html = `
    <div class="mb-3">
      <div class="text-gray-400 text-xs">Block Name</div>
      <div class="font-semibold">${block.blockName}</div>
    </div>
    <div class="mb-3">
      <div class="text-gray-400 text-xs">Position</div>
      <div class="font-mono">${block.x}, ${block.y}, ${block.z}</div>
    </div>
  `;
  
  if (block.data) {
    html += `
      <div class="mb-3">
        <div class="text-gray-400 text-xs mb-1">Block Data</div>
        <pre class="bg-turtle-dark p-2 rounded text-xs overflow-x-auto">${JSON.stringify(block.data, null, 2)}</pre>
      </div>
    `;
  }
  
  content.innerHTML = html;
  modal.classList.remove('hidden');
}

function closeBlockDetails() {
  document.getElementById('block-details-modal').classList.add('hidden');
}

function closeWaypointModal() {
  document.getElementById('waypoint-modal').classList.add('hidden');
  document.getElementById('waypoint-name').value = '';
  pendingWaypointPos = null;
}

function confirmWaypoint() {
  const name = document.getElementById('waypoint-name').value.trim();
  if (!name || !pendingWaypointPos) return;
  
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'add_waypoint',
      x: pendingWaypointPos.x,
      y: pendingWaypointPos.y,
      z: pendingWaypointPos.z,
      name: name
    }));
  }
  
  closeWaypointModal();
}

function showBlockInventory(inventory) {
  const modal = document.getElementById('block-details-modal');
  const content = document.getElementById('block-details-content');
  
  let html = '<div class="text-gray-400 text-xs mb-2">Inventory Contents</div>';
  html += '<div class="grid grid-cols-4 gap-1">';
  
  for (const [slot, item] of Object.entries(inventory)) {
    html += `
      <div class="bg-turtle-dark p-1 rounded text-center">
        <div class="text-xs truncate">${item.name?.replace('minecraft:', '') || 'Empty'}</div>
        <div class="text-xs text-gray-400">x${item.count || 0}</div>
      </div>
    `;
  }
  
  html += '</div>';
  content.innerHTML = html;
  modal.classList.remove('hidden');
}

function geoScan() {
  const turtle = turtles.get(selectedTurtleId);
  if (!turtle) return;
  
  let hasGeoScanner = false;
  if (turtle.peripherals && typeof turtle.peripherals === 'object') {
    for (const [side, peripheral] of Object.entries(turtle.peripherals)) {
      const types = peripheral.types || [];
      if (types.includes('geo_scanner') || types.includes('geoScanner') || 
          types.some(t => t.includes('scanner'))) {
        hasGeoScanner = true;
        break;
      }
    }
  }
  
  const radius = hasGeoScanner ? 16 : 8;
  sendCommand('geoScan', [radius]);
  addConsoleMessage(`Scanning with radius ${radius}...`, 'info');
}

function calibrateGPS() {
  if (!selectedTurtleId) {
    addConsoleMessage('No turtle selected', 'error');
    return;
  }
  
  sendCommand('calibrateGPS');
  addConsoleMessage('Calibrating GPS...', 'info');
}

function initWorld3D() {
  world3d = new World3D('world-container');
  
  world3d.setContextMenuCallback((event, blockData) => {
    showContextMenu(event, blockData);
  });
  
  world3d.setDoubleClickCallback((blockData) => {
    sendCommand('pathfind', [blockData.x, blockData.y, blockData.z], true);
    addConsoleMessage(`Navigating to ${blockData.x}, ${blockData.y}, ${blockData.z}...`, 'info');
  });
}

document.addEventListener('keydown', (e) => {
  if (!selectedTurtleId) return;
  
  const luaInput = document.getElementById('lua-code');
  if (e.target === luaInput) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        luaInput.value = commandHistory[historyIndex] || '';
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        luaInput.value = commandHistory[historyIndex] || '';
      } else {
        historyIndex = commandHistory.length;
        luaInput.value = '';
      }
    }
    return;
  }
  
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  const keyMap = {
    'w': 'forward',
    'W': 'forward',
    's': 'back',
    'S': 'back',
    'a': 'turnLeft',
    'A': 'turnLeft',
    'd': 'turnRight',
    'D': 'turnRight',
    'q': 'down',
    'Q': 'down',
    'e': 'up',
    'E': 'up',
    ' ': 'dig',
    'f': 'place',
    'F': 'place',
    'r': 'refuel',
    'R': 'refuel',
    'g': 'geoScan',
    'G': 'geoScan',
  };

  if (e.key === 'Delete') {
    e.preventDefault();
    clearQueue();
    return;
  }

  const command = keyMap[e.key];
  if (command) {
    e.preventDefault();
    sendCommand(command);
  }

  if (e.key >= '1' && e.key <= '9') {
    e.preventDefault();
    selectSlot(parseInt(e.key));
  }
  if (e.key === '0') {
    e.preventDefault();
    selectSlot(10);
  }
});

function scanContainerInventory(x, y, z, blockName) {
  if (!selectedTurtleId) {
    addConsoleMessage('No turtle selected', 'error');
    return;
  }
  
  addConsoleMessage(`Scanning inventory of ${blockName?.replace('minecraft:', '')}...`, 'info');
  sendCommand('scanContainerAt', [x, y, z]);
}

function showInventoryModal(inventory, blockName) {
  const modal = document.getElementById('inventory-modal');
  const content = document.getElementById('inventory-modal-content');
  
  let html = `<div class="text-gray-400 text-xs mb-3">${blockName?.replace('minecraft:', '') || 'Container'}</div>`;
  html += '<div class="grid grid-cols-6 gap-1">';
  
  const entries = Object.entries(inventory || {});
  if (entries.length === 0) {
    html = '<div class="text-gray-500 text-center py-4">Empty inventory</div>';
  } else {
    for (const [slot, item] of entries) {
      html += `
        <div class="bg-turtle-dark p-1 rounded text-center" title="Slot ${slot}">
          <div class="text-xs truncate">${item.name?.replace('minecraft:', '') || 'Empty'}</div>
          <div class="text-xs text-gray-400">x${item.count || 0}</div>
        </div>
      `;
    }
  }
  
  html += '</div>';
  content.innerHTML = html;
  modal.classList.remove('hidden');
}

function closeInventoryModal() {
  document.getElementById('inventory-modal').classList.add('hidden');
}

function openPeripheralModal() {
  const turtle = turtles.get(selectedTurtleId);
  const modal = document.getElementById('peripheral-modal');
  const list = document.getElementById('peripheral-actions-list');
  const craftySection = document.getElementById('crafty-section');
  const externalSection = document.getElementById('external-inv-section');
  
  const isCrafty = turtle && (
    (Array.isArray(turtle.traits) && (turtle.traits.includes('crafty') || turtle.traits.includes('crafting'))) ||
    (turtle.turtleType && turtle.turtleType.includes('craft'))
  );
  
  if (isCrafty) {
    craftySection.classList.remove('hidden');
    updateCraftingGrid(turtle);
  } else {
    craftySection.classList.add('hidden');
  }
  
  if (currentExternalInventory && currentExternalInventory.length > 0) {
    externalSection.classList.remove('hidden');
  } else {
    externalSection.classList.add('hidden');
  }
  
  let html = '';
  
  if (turtle && turtle.peripherals) {
    for (const [side, peripheral] of Object.entries(turtle.peripherals)) {
      const types = peripheral.types || [];
      const methods = peripheral.methods || [];
      const typesStr = types.join(', ');
      
      html += `
        <div class="bg-turtle-dark rounded p-3">
          <div class="flex justify-between items-center mb-2">
            <div>
              <span class="font-semibold">${side}</span>
              <span class="text-xs text-gray-400 ml-2">(${typesStr})</span>
            </div>
          </div>
          <div class="flex flex-wrap gap-1">
      `;
      
      if (types.includes('inventory') || types.some(t => t.includes('chest') || t.includes('barrel') || t.includes('storage'))) {
        html += `<button onclick="peripheralAction('${side}', 'readInventory')" class="text-xs bg-purple-600 hover:bg-purple-500 px-2 py-1 rounded">Read Inventory</button>`;
      }
      
      if (types.includes('geo_scanner') || types.some(t => t.includes('scanner') || t.includes('geoScanner'))) {
        html += `<button onclick="peripheralAction('${side}', 'scan', 16)" class="text-xs bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded">Scan (16)</button>`;
        html += `<button onclick="peripheralAction('${side}', 'scan', 8)" class="text-xs bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded">Scan (8)</button>`;
      }
      
      if (types.includes('monitor') || types.some(t => t.includes('monitor'))) {
        html += `<button onclick="peripheralAction('${side}', 'clearMonitor')" class="text-xs bg-yellow-600 hover:bg-yellow-500 px-2 py-1 rounded">Clear</button>`;
        html += `<button onclick="promptMonitorWrite('${side}')" class="text-xs bg-green-600 hover:bg-green-500 px-2 py-1 rounded">Write</button>`;
      }
      
      if (types.includes('speaker') || types.some(t => t.includes('speaker'))) {
        html += `<button onclick="peripheralAction('${side}', 'playNote')" class="text-xs bg-pink-600 hover:bg-pink-500 px-2 py-1 rounded">Play Note</button>`;
      }
      
      if (types.includes('modem') || types.some(t => t.includes('modem'))) {
        html += `<button onclick="peripheralAction('${side}', 'getModemInfo')" class="text-xs bg-cyan-600 hover:bg-cyan-500 px-2 py-1 rounded">Modem Info</button>`;
      }
      
      if (types.some(t => t.includes('me_bridge') || t.includes('rs_bridge'))) {
        html += `<button onclick="peripheralAction('${side}', 'listItems')" class="text-xs bg-orange-600 hover:bg-orange-500 px-2 py-1 rounded">List Items</button>`;
        html += `<button onclick="peripheralAction('${side}', 'listCraftable')" class="text-xs bg-orange-600 hover:bg-orange-500 px-2 py-1 rounded">Craftable</button>`;
      }
      
      if (types.some(t => t.includes('colony_integrator'))) {
        html += `<button onclick="peripheralAction('${side}', 'getColonyInfo')" class="text-xs bg-amber-600 hover:bg-amber-500 px-2 py-1 rounded">Colony Info</button>`;
      }
      
      if (types.some(t => t.includes('chat_box'))) {
        html += `<button onclick="promptChatSend('${side}')" class="text-xs bg-green-600 hover:bg-green-500 px-2 py-1 rounded">Send Chat</button>`;
      }
      
      if (types.some(t => t.includes('energy'))) {
        html += `<button onclick="peripheralAction('${side}', 'getEnergy')" class="text-xs bg-yellow-600 hover:bg-yellow-500 px-2 py-1 rounded">Get Energy</button>`;
      }
      
      if (types.some(t => t.includes('introspection'))) {
        html += `<button onclick="peripheralAction('${side}', 'getPlayer')" class="text-xs bg-teal-600 hover:bg-teal-500 px-2 py-1 rounded">Player Info</button>`;
      }
      
      if (types.some(t => t.includes('kinetic'))) {
        html += `<button onclick="peripheralAction('${side}', 'launch', 1)" class="text-xs bg-red-600 hover:bg-red-500 px-2 py-1 rounded">Launch</button>`;
      }
      
      html += `<button onclick="showPeripheralMethods('${side}')" class="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded">Methods</button>`;
      
      html += `
          </div>
        </div>
      `;
    }
  }
  
  if (!html) {
    html = '<div class="text-gray-500 text-center">No peripherals attached</div>';
  }
  
  list.innerHTML = html;
  modal.classList.remove('hidden');
}

function promptChatSend(side) {
  const msg = prompt('Enter message to send in chat:');
  if (msg) {
    sendCommand('peripheralAction', [side, 'sendChat', msg]);
  }
}

function closePeripheralModal() {
  document.getElementById('peripheral-modal').classList.add('hidden');
}

function peripheralAction(side, action, arg) {
  sendCommand('peripheralAction', [side, action, arg]);
  addConsoleMessage(`Running ${action} on ${side}...`, 'info');
}

function promptMonitorWrite(side) {
  const text = prompt('Enter text to display on monitor:');
  if (text) {
    sendCommand('peripheralAction', [side, 'writeMonitor', text]);
  }
}

function showPeripheralMethods(side) {
  const turtle = turtles.get(selectedTurtleId);
  if (!turtle || !turtle.peripherals || !turtle.peripherals[side]) return;
  
  const methods = turtle.peripherals[side].methods || [];
  const modal = document.getElementById('block-details-modal');
  const content = document.getElementById('block-details-content');
  
  let html = `<div class="text-gray-400 text-xs mb-2">Methods for ${side}</div>`;
  html += '<div class="grid grid-cols-2 gap-1">';
  
  for (const method of methods) {
    html += `<div class="bg-turtle-dark px-2 py-1 rounded text-xs font-mono">${method}</div>`;
  }
  
  html += '</div>';
  content.innerHTML = html;
  modal.classList.remove('hidden');
}

function handleContainerInventory(data) {
  const { x, y, z, inventory } = data;
  const key = `${x},${y},${z}`;
  cachedInventories.set(key, inventory);
  showInventoryModal(inventory, data.blockName || 'Container');
}

function showItemContextMenu(event, slot, source, itemName, count) {
  event.preventDefault();
  event.stopPropagation();
  
  itemContextSlot = slot;
  itemContextSource = source;
  
  const menu = document.getElementById('item-context-menu');
  const nameEl = document.getElementById('item-context-name');
  const takeBtn = document.getElementById('item-ctx-take');
  const takeAllBtn = document.getElementById('item-ctx-takeAll');
  const putBtn = document.getElementById('item-ctx-put');
  
  nameEl.textContent = itemName ? itemName.replace('minecraft:', '').replace(/_/g, ' ') : 'Item';
  
  if (source === 'external') {
    takeBtn.classList.remove('hidden');
    takeAllBtn.classList.remove('hidden');
    putBtn.classList.add('hidden');
  } else if (source === 'turtle') {
    takeBtn.classList.add('hidden');
    takeAllBtn.classList.add('hidden');
    putBtn.classList.remove('hidden');
  }
  
  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;
  menu.classList.remove('hidden');
}

function hideItemContextMenu() {
  document.getElementById('item-context-menu').classList.add('hidden');
  itemContextSlot = null;
  itemContextSource = null;
}

function itemContextAction(action) {
  if (!itemContextSlot || !itemContextSource) return;
  
  if (itemContextSource === 'external') {
    if (action === 'take') {
      sendCommand('pullFromChest', [itemContextSlot, 1]);
    } else if (action === 'takeAll') {
      sendCommand('pullFromChest', [itemContextSlot, 64]);
    } else if (action === 'put') {
      const turtle = turtles.get(selectedTurtleId);
      if (turtle) {
        sendCommand('pushToChest', [turtle.selectedSlot || 1, 64]);
      }
    }
  } else if (itemContextSource === 'turtle') {
    if (action === 'put') {
      sendCommand('select', [itemContextSlot]);
      setTimeout(() => sendCommand('drop', [64]), 100);
    }
  }
  
  hideItemContextMenu();
  setTimeout(() => sendCommand('getExternalInventory'), 600);
}

function onExternalDragStart(event, slot) {
  event.dataTransfer.setData('text/plain', JSON.stringify({ source: 'external', slot }));
  event.dataTransfer.effectAllowed = 'move';
}

function onExternalDrop(event, targetSlot) {
  event.preventDefault();
  
  const count = event.ctrlKey ? 1 : 64;
  
  try {
    const data = JSON.parse(event.dataTransfer.getData('text/plain'));
    
    if (data.source === 'turtle') {
      sendCommand('select', [data.slot]);
      setTimeout(() => sendCommand('drop', [count]), 100);
      setTimeout(() => sendCommand('getExternalInventory'), 500);
      draggedSlot = null;
      return;
    }
  } catch (e) {}
  
  if (draggedSlot !== null) {
    sendCommand('select', [draggedSlot]);
    setTimeout(() => sendCommand('drop', [count]), 100);
    setTimeout(() => sendCommand('getExternalInventory'), 500);
  }
  
  draggedSlot = null;
}

function showEquipMenu(event, side) {
  event.preventDefault();
  const turtle = turtles.get(selectedTurtleId);
  if (!turtle) return;
  
  const equipment = turtle.equipment || {};
  const item = equipment[side];
  
  if (item) {
    if (confirm(`Unequip ${formatEquipmentName(item)}?`)) {
      sendCommand(side === 'left' ? 'equipLeft' : 'equipRight');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  connect();
  updateServerUrl();
  initWorld3D();
  
  const luaInput = document.getElementById('lua-code');
  if (luaInput) {
    luaInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeLua();
      }
    });
  }
  
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('context-menu');
    const itemMenu = document.getElementById('item-context-menu');
    if (!menu.contains(e.target)) {
      hideContextMenu();
    }
    if (itemMenu && !itemMenu.contains(e.target)) {
      hideItemContextMenu();
    }
  });
  
  document.getElementById('waypoint-name')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmWaypoint();
    }
  });
});

let activeScript = null;
let scriptIntervals = {};
let quarryActive = false;
let quarryRunning = false;

function runScript(scriptName) {
  const buttonMap = {
    'tunnel': document.querySelector('button[onclick="runScript(\'tunnel\')"]'),
    'quarry': document.querySelector('button[onclick="runScript(\'quarry\')"]')
  };
  
  const button = buttonMap[scriptName];
  if (!button) return;
  
  if (scriptName === 'quarry') {
    if (quarryRunning) {
      quarryRunning = false;
      sendCommand('clearQueue');
      button.classList.remove('bg-red-600', 'hover:bg-red-500');
      button.classList.add('bg-purple-600', 'hover:bg-purple-700');
      button.textContent = 'Quarry';
      addConsoleMessage('Quarry cancelled', 'info');
      return;
    }
    
    if (quarryActive) {
      hideQuarryUI();
      quarryActive = false;
    } else {
      showQuarryUI();
      quarryActive = true;
    }
    return;
  }
  
  if (activeScript === scriptName) {
    stopScript(scriptName, button);
  } else {
    if (activeScript) {
      const oldButton = buttonMap[activeScript];
      stopScript(activeScript, oldButton);
    }
    startScript(scriptName, button);
  }
}

function showQuarryUI() {
  const turtle = turtles.get(selectedTurtleId);
  if (!turtle || !world3d) return;
  
  const turtlePos = turtle.position;
  world3d.camera.position.set(turtlePos.x, turtlePos.y + 15, turtlePos.z);
  world3d.controls.target.set(turtlePos.x, turtlePos.y, turtlePos.z);
  world3d.controls.update();
  
  const quarryUI = document.getElementById('quarry-ui');
  const container = document.getElementById('world-container');
  
  setTimeout(() => {
    const screenPos = getScreenPosition(turtlePos.x, turtlePos.y + 2, turtlePos.z);
    
    if (screenPos) {
      const rect = container.getBoundingClientRect();
      quarryUI.style.left = `${rect.left + screenPos.x}px`;
      quarryUI.style.top = `${rect.top + screenPos.y}px`;
      quarryUI.classList.remove('hidden');
    }
  }, 100);
}

function hideQuarryUI() {
  const quarryUI = document.getElementById('quarry-ui');
  quarryUI.classList.add('hidden');
}

function getScreenPosition(x, y, z) {
  if (!world3d || !world3d.camera || !world3d.renderer) return null;
  
  const vector = new THREE.Vector3(x, y, z);
  vector.project(world3d.camera);
  
  const widthHalf = world3d.renderer.domElement.width / 2;
  const heightHalf = world3d.renderer.domElement.height / 2;
  
  return {
    x: (vector.x * widthHalf) + widthHalf,
    y: -(vector.y * heightHalf) + heightHalf
  };
}

function startQuarry() {
  const north = parseInt(document.getElementById('quarry-north').value) || 5;
  const south = parseInt(document.getElementById('quarry-south').value) || 5;
  const east = parseInt(document.getElementById('quarry-east').value) || 5;
  const west = parseInt(document.getElementById('quarry-west').value) || 5;
  const depth = parseInt(document.getElementById('quarry-depth').value) || 10;
  
  if (north < 1 || north > 25 || south < 1 || south > 25 || 
      east < 1 || east > 25 || west < 1 || west > 25 || 
      depth < 1 || depth > 256) {
    addConsoleMessage('Invalid quarry dimensions', 'error');
    return;
  }
  
  hideQuarryUI();
  quarryActive = false;
  quarryRunning = true;
  
  const button = document.querySelector('button[onclick="runScript(\'quarry\')"]');
  if (button) {
    button.classList.remove('bg-purple-600', 'hover:bg-purple-700');
    button.classList.add('bg-red-600', 'hover:bg-red-500');
    button.textContent = 'Stop Quarry';
  }
  
  const totalNS = north + south + 1; 
  const totalEW = east + west - 1;  
  
  executeQuarry(totalNS, totalEW, depth, north, west);
}

async function executeQuarry(rows, cols, depth, northOffset, westOffset) {
  const turtle = turtles.get(selectedTurtleId);
  if (!turtle) return;
  
  addConsoleMessage(`Starting quarry: ${rows}x${cols}x${depth} (N:${northOffset} W:${westOffset})`, 'info');
  console.log('Quarry params:', { rows, cols, depth, northOffset, westOffset, currentDir: turtle.direction });
  
  const delay = (time) => new Promise(resolve => setTimeout(resolve, time || 1000));
  
  const dir = turtle.direction;
  console.log('Current direction:', dir);
  let turnToNorth = (0 - dir + 4) % 4;
  console.log('Turns to north:', turnToNorth);
  for (let i = 0; i < turnToNorth; i++) {
    sendCommand('turnRight', [], true);
  }
  
  console.log('Moving north:', northOffset, 'blocks');
  for (let i = 0; i < northOffset; i++) {
    sendCommand('dig', [], true);
    await delay();
    sendCommand('forward', [], true);
    await delay();
  }
  
  sendCommand('turnLeft', [], true); 
  delay();
  console.log('Moving west:', westOffset, 'blocks');
  for (let i = 0; i < westOffset; i++) {
    sendCommand('dig', [], true);
    await delay();
    sendCommand('forward', [], true);
    await delay();
  }

  sendCommand('turnRight', [], true); 
  await delay();
  sendCommand('turnRight', [], true); 
  await delay();

  for (let d = 0; d < depth; d++) {
    addConsoleMessage(`Starting depth layer ${d + 1} of ${depth}`, 'info');
    for (let r = 0; r < rows-1; r++) {
      for (let c = 0; c < cols+1; c++) {
        sendCommand('dig', [], true);
        await delay();
        sendCommand('forward', [], true);
        await delay();
      }
      if (r < rows - 1) {
        if (r % 2 === 0) {
          sendCommand('turnRight', [], true);
          await delay();
          sendCommand('dig', [], true);
          await delay();
          sendCommand('forward', [], true);
          await delay();
          sendCommand('turnRight', [], true);
        } else {
          sendCommand('turnLeft', [], true);
          await delay();
          sendCommand('dig', [], true);
          await delay();
          sendCommand('forward', [], true);
          await delay();
          sendCommand('turnLeft', [], true);
        }
      }
    }
    if (d < depth - 1) {
      sendCommand('digDown', [], true);
      await delay();
      sendCommand('down', [], true);
      await delay();
      
      sendCommand('turnRight', [], true);
      await delay();
      sendCommand('turnRight', [], true);
      await delay();
    }
  }
  
  quarryRunning = false;
  const button = document.querySelector('button[onclick="runScript(\'quarry\')"]');
  if (button) {
    button.classList.remove('bg-red-600', 'hover:bg-red-500');
    button.classList.add('bg-purple-600', 'hover:bg-purple-700');
    button.textContent = 'Quarry';
  }
  addConsoleMessage('Quarry complete!', 'success');
}

function startScript(scriptName, button) {
  activeScript = scriptName;
  
  button.classList.remove('bg-turtle-accent', 'hover:bg-purple-600');
  button.classList.add('bg-red-600', 'hover:bg-red-500');
  button.textContent = 'Stop';
  
  if (scriptName === 'tunnel') {
    scriptIntervals.tunnel = setInterval(async () => {
      sendCommand('digUp', [], true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      sendCommand('dig', [], true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      sendCommand('forward', [], true);
    }, 3000);
  }
}

function stopScript(scriptName, button) {
  if (scriptIntervals[scriptName]) {
    clearInterval(scriptIntervals[scriptName]);
    delete scriptIntervals[scriptName];
  }
  
  activeScript = null;
  
  button.classList.remove('bg-red-600', 'hover:bg-red-500');
  button.classList.add('bg-turtle-accent', 'hover:bg-purple-600');
  button.textContent = scriptName.charAt(0).toUpperCase() + scriptName.slice(1);
}
