-- SRTO - Sectly's Remote Turtle Orchestrator
-- Turtle Client Script for ComputerCraft / CC:Tweaked
-- Supports Advanced Peripherals, Plethora, UnlimitedPeripheralWorks, GPS

local SERVER_URL = nil

if fs.exists("domain.txt") then
    local file = fs.open("domain.txt", "r")
    SERVER_URL = file.readAll()
    file.close()
end

local ws = nil
local running = true
local turtleId = os.getComputerID()
local position = { x = 0, y = 0, z = 0 }
local direction = 0
local inventory = {}
local commandQueue = {}
local processingQueue = false

local geoScanner = nil
local blockScanner = nil
local universalScanner = nil

local function log(msg)
    print("[SRTO] " .. tostring(msg))
end

local function getPeripheralList()
    local peripherals = {}
    local names = peripheral.getNames()
    for _, name in ipairs(names) do
        local types = {peripheral.getType(name)}
        local methods = {}
        pcall(function()
            methods = peripheral.getMethods(name) or {}
        end)
        peripherals[name] = { 
            types = types,
            methods = methods
        }
    end
    return peripherals
end

local function getTurtleType()
    local turtleType = "normal"
    local traits = {}
    
    if turtle.craft then
        turtleType = "crafty"
        table.insert(traits, "crafting")
    end
    
    local peripherals = peripheral.getNames()
    for _, name in ipairs(peripherals) do
        local pType = peripheral.getType(name)
        if pType == "modem" then
            local modem = peripheral.wrap(name)
            if modem and modem.isWireless and modem.isWireless() then
                table.insert(traits, "wireless")
            else
                table.insert(traits, "wired_modem")
            end
        end
    end
    
    if term.isColor and term.isColor() then
        table.insert(traits, "advanced")
        if turtleType == "normal" then
            turtleType = "advanced"
        elseif turtleType == "crafty" then
            turtleType = "advanced_crafty"
        end
    end
    
    return turtleType, traits
end

local function getEquipment()
    local equipment = { left = nil, right = nil }
    
    if turtle.getUpgradeLeft then
        local upgrade = turtle.getUpgradeLeft()
        if upgrade then
            equipment.left = {
                id = upgrade.id or upgrade.name,
                name = upgrade.displayName or upgrade.id or upgrade.name,
                type = upgrade.type or "unknown"
            }
        end
    end
    
    if turtle.getUpgradeRight then
        local upgrade = turtle.getUpgradeRight()
        if upgrade then
            equipment.right = {
                id = upgrade.id or upgrade.name,
                name = upgrade.displayName or upgrade.id or upgrade.name,
                type = upgrade.type or "unknown"
            }
        end
    end
    
    return equipment
end

local function detectPeripherals()
    geoScanner = nil
    blockScanner = nil
    universalScanner = nil
    
    local peripherals = peripheral.getNames()
    for _, name in ipairs(peripherals) do
        local pType = peripheral.getType(name)
        if pType == "geoScanner" then
            geoScanner = peripheral.wrap(name)
            log("Found Geo Scanner")
        elseif pType == "plethora:scanner" then
            blockScanner = peripheral.wrap(name)
            log("Found Block Scanner (Plethora)")
        elseif pType == "universalScanner" then
            universalScanner = peripheral.wrap(name)
            log("Found Universal Scanner")
        end
    end
end

local function tryGPS()
    local x, y, z = gps.locate(2)
    if x then
        position.x = math.floor(x)
        position.y = math.floor(y)
        position.z = math.floor(z)
        log("GPS position: " .. position.x .. ", " .. position.y .. ", " .. position.z)
        return true
    end
    return false
end

local function determineDirection()
    local startX, startY, startZ = gps.locate(2)
    if not startX then return false end
    
    if turtle.forward() then
        local endX, endY, endZ = gps.locate(2)
        turtle.back()
        
        if endX then
            local dx = math.floor(endX) - math.floor(startX)
            local dz = math.floor(endZ) - math.floor(startZ)
            
            if dz == -1 then direction = 0
            elseif dx == 1 then direction = 1
            elseif dz == 1 then direction = 2
            elseif dx == -1 then direction = 3 end
            
            log("Direction determined: " .. direction)
            return true
        end
    end
    return false
end

local function getInventory()
    local inv = {}
    for i = 1, 16 do
        local item = turtle.getItemDetail(i, true)
        if item then
            inv[i] = {
                name = item.name,
                count = item.count,
                damage = item.damage,
                maxCount = item.maxCount,
                displayName = item.displayName,
                nbt = item.nbt
            }
        else
            inv[i] = nil
        end
    end
    return inv
end

local function sendUpdate()
    if ws then
        inventory = getInventory()
        local data = {
            type = "turtle_update",
            fuel = turtle.getFuelLevel(),
            position = position,
            direction = direction,
            inventory = inventory,
            selectedSlot = turtle.getSelectedSlot(),
            queueLength = #commandQueue,
            label = os.getComputerLabel()
        }
        ws.send(textutils.serialiseJSON(data))
    end
end

local function sendInventoryUpdate()
    if ws then
        local inv = getInventory()
        ws.send(textutils.serialiseJSON({
            type = "inventory_update",
            inventory = inv,
            selectedSlot = turtle.getSelectedSlot()
        }))
    end
end

local function sendPeripheralUpdate(attached, side)
    if ws then
        local peripherals = getPeripheralList()
        local equipment = getEquipment()
        local turtleType, traits = getTurtleType()
        ws.send(textutils.serialiseJSON({
            type = attached and "peripheral_attached" or "peripheral_detached",
            peripherals = peripherals,
            equipment = equipment,
            turtleType = turtleType,
            traits = traits,
            side = side
        }))
    end
end

local function sendWorldUpdate(blocks)
    if ws and #blocks > 0 then
        ws.send(textutils.serialiseJSON({
            type = "world_update",
            blocks = blocks
        }))
    end
end

local function inspectSurroundings()
    local blocks = {}
    local dx, dz = 0, 0
        if direction == 0 then dz = -1
        elseif direction == 1 then dx = 1
        elseif direction == 2 then dz = 1
        elseif direction == 3 then dx = -1 end
    local success, block = turtle.inspect()
    if success then
        table.insert(blocks, {
            x = position.x + dx,
            y = position.y,
            z = position.z + dz,
            name = block.name,
            state = block.state
        })
    else
        table.insert(blocks, {
            x = position.x + dx,
            y = position.y,
            z = position.z + dz,
            name = "minecraft:air",
            state = {}
        })
    end
    
    success, block = turtle.inspectUp()
    if success then
        table.insert(blocks, {
            x = position.x,
            y = position.y + 1,
            z = position.z,
            name = block.name,
            state = block.state
        })
    else 
        table.insert(blocks, {
            x = position.x,
            y = position.y + 1,
            z = position.z,
            name = "minecraft:air",
            state = {}
        })
    end
    
    success, block = turtle.inspectDown()
    if success then
        table.insert(blocks, {
            x = position.x,
            y = position.y - 1,
            z = position.z,
            name = block.name,
            state = block.state
        })
    else
        table.insert(blocks, {
            x = position.x,
            y = position.y - 1,
            z = position.z,
            name = "minecraft:air",
            state = {}
        })
    end
    print("Inspected surroundings: " .. #blocks .. " blocks found")    
    return blocks
end

local function geoScan(radius)
    radius = radius or 8
    local blocks = {}
    
    if geoScanner then
        local success, result = pcall(function()
            return geoScanner.scan(radius)
        end)
        if success and result then
            for _, block in ipairs(result) do
                table.insert(blocks, {
                    x = position.x + block.x,
                    y = position.y + block.y,
                    z = position.z + block.z,
                    name = block.name,
                    state = block.tags
                })
            end
            log("Geo scan: " .. #blocks .. " blocks")
        end
    elseif blockScanner then
        local success, result = pcall(function()
            return blockScanner.scan()
        end)
        if success and result then
            for _, block in ipairs(result) do
                table.insert(blocks, {
                    x = position.x + block.x,
                    y = position.y + block.y,
                    z = position.z + block.z,
                    name = block.name,
                    state = block.state
                })
            end
            log("Block scan: " .. #blocks .. " blocks")
        end
    elseif universalScanner then
        local success, result = pcall(function()
            return universalScanner.scan(radius)
        end)
        if success and result then
            for _, block in ipairs(result) do
                table.insert(blocks, {
                    x = position.x + block.x,
                    y = position.y + block.y,
                    z = position.z + block.z,
                    name = block.name
                })
            end
            log("Universal scan: " .. #blocks .. " blocks")
        end
    else
        blocks = inspectSurroundings()
        log("No scanner found, using basic inspect")
    end
    
    return blocks
end

local function getExternalInventory()
    local inv = {}
    local chest = peripheral.find("inventory")
    if chest then
        local items = chest.list()
        for slot, item in pairs(items) do
            inv[slot] = {
                name = item.name,
                count = item.count
            }
        end
    end
    return inv
end

local function sendConsoleOutput(output)
    if ws then
        ws.send(textutils.serialiseJSON({
            type = "console_output",
            output = tostring(output)
        }))
    end
end

local function sendCommandResult(command, success, result, err)
    if ws then
        ws.send(textutils.serialiseJSON({
            type = "command_result",
            command = command,
            success = success,
            result = result,
            error = err
        }))
    end
end

local function moveForward()
    if turtle.forward() then
        if direction == 0 then position.z = position.z - 1
        elseif direction == 1 then position.x = position.x + 1
        elseif direction == 2 then position.z = position.z + 1
        elseif direction == 3 then position.x = position.x - 1 end
        return true
    end
    return false
end

local function moveBack()
    if turtle.back() then
        if direction == 0 then position.z = position.z + 1
        elseif direction == 1 then position.x = position.x - 1
        elseif direction == 2 then position.z = position.z - 1
        elseif direction == 3 then position.x = position.x + 1 end
        return true
    end
    return false
end

local function moveUp()
    if turtle.up() then
        position.y = position.y + 1
        return true
    end
    return false
end

local function moveDown()
    if turtle.down() then
        position.y = position.y - 1
        return true
    end
    return false
end

local function mine()
    if turtle.dig() then
        local dx, dz = 0, 0
        if direction == 0 then dz = -1
        elseif direction == 1 then dx = 1
        elseif direction == 2 then dz = 1
        elseif direction == 3 then dx = -1 end
        
        local blocks = {{
            x = position.x + dx,
            y = position.y,
            z = position.z + dz,
            name = "minecraft:air",
            state = {}
        }}
        sendWorldUpdate(blocks)
        return true
    end
    return false
end

local function mineUp()
    if turtle.digUp() then
        local blocks = {{
            x = position.x,
            y = position.y + 1,
            z = position.z,
            name = "minecraft:air",
            state = {}
        }}
        sendWorldUpdate(blocks)
        return true
    end
    return false
end

local function mineDown()
    if turtle.digDown() then
        local blocks = {{
            x = position.x,
            y = position.y - 1,
            z = position.z,
            name = "minecraft:air",
            state = {}
        }}
        sendWorldUpdate(blocks)
        return true
    end
    return false
end

local function turnLeft()
    turtle.turnLeft()
    direction = (direction - 1) % 4
    return true
end

local function turnRight()
    turtle.turnRight()
    direction = (direction + 1) % 4
    return true
end

local function turnToDirection(targetDir)
    local diff = (targetDir - direction) % 4
    if diff == 1 then
        turnRight()
    elseif diff == 2 then
        turnRight()
        turnRight()
    elseif diff == 3 then
        turnLeft()
    end
end

local function pathfindTo(targetX, targetY, targetZ)
    local moves = {}
    
    while position.y < targetY do
        if not moveUp() then
            if not turtle.digUp() then break end
            moveUp()
        end
        table.insert(moves, "up")
        sendUpdate()
    end
    while position.y > targetY do
        if not moveDown() then
            if not turtle.digDown() then break end
            moveDown()
        end
        table.insert(moves, "down")
        sendUpdate()
    end
    
    if position.x < targetX then
        turnToDirection(1)
        while position.x < targetX do
            if not moveForward() then
                if not turtle.dig() then break end
                moveForward()
            end
            table.insert(moves, "forward")
            sendUpdate()
        end
    elseif position.x > targetX then
        turnToDirection(3)
        while position.x > targetX do
            if not moveForward() then
                if not turtle.dig() then break end
                moveForward()
            end
            table.insert(moves, "forward")
            sendUpdate()
        end
    end
    
    if position.z < targetZ then
        turnToDirection(2)
        while position.z < targetZ do
            if not moveForward() then
                if not turtle.dig() then break end
                moveForward()
            end
            table.insert(moves, "forward")
            sendUpdate()
        end
    elseif position.z > targetZ then
        turnToDirection(0)
        while position.z > targetZ do
            if not moveForward() then
                if not turtle.dig() then break end
                moveForward()
            end
            table.insert(moves, "forward")
            sendUpdate()
        end
    end
    
    return #moves
end

local function executeCommand(data)
    local command = data.command
    local args = data.args or {}
    local success = false
    local result = nil
    local err = nil

    if command == "forward" then
        success = moveForward()
    elseif command == "back" then
        success = moveBack()
    elseif command == "up" then
        success = moveUp()
    elseif command == "down" then
        success = moveDown()
    elseif command == "turnLeft" then
        success = turnLeft()
    elseif command == "turnRight" then
        success = turnRight()
    elseif command == "dig" then
        success = mine()
    elseif command == "digUp" then
        success = mineUp()
    elseif command == "digDown" then
        success = mineDown()
    elseif command == "place" then
        success = turtle.place()
    elseif command == "placeUp" then
        success = turtle.placeUp()
    elseif command == "placeDown" then
        success = turtle.placeDown()
    elseif command == "attack" then
        success = turtle.attack()
    elseif command == "attackUp" then
        success = turtle.attackUp()
    elseif command == "attackDown" then
        success = turtle.attackDown()
    elseif command == "suck" then
        local count = args[1] or 64
        success = turtle.suck(count)
    elseif command == "suckUp" then
        local count = args[1] or 64
        success = turtle.suckUp(count)
    elseif command == "suckDown" then
        local count = args[1] or 64
        success = turtle.suckDown(count)
    elseif command == "drop" then
        local count = args[1]
        success = turtle.drop(count)
    elseif command == "dropUp" then
        local count = args[1]
        success = turtle.dropUp(count)
    elseif command == "dropDown" then
        local count = args[1]
        success = turtle.dropDown(count)
    elseif command == "select" then
        local slot = args[1] or 1
        success = turtle.select(slot)
    elseif command == "refuel" then
        local count = args[1]
        success = turtle.refuel(count)
        if success then
            result = turtle.getFuelLevel()
        end
    elseif command == "inspect" then
        success, result = turtle.inspect()
        if not success then
            result = { name = "minecraft:air" }
            success = true
        end
    elseif command == "inspectUp" then
        success, result = turtle.inspectUp()
        if not success then
            result = { name = "minecraft:air" }
            success = true
        end
    elseif command == "inspectDown" then
        success, result = turtle.inspectDown()
        if not success then
            result = { name = "minecraft:air" }
            success = true
        end
    elseif command == "detectAll" then
        local blocks = inspectSurroundings()
        sendWorldUpdate(blocks)
        success = true
        result = #blocks .. " blocks detected"
    elseif command == "geoScan" then
        local radius = args[1] or 8
        local blocks = geoScan(radius)
        sendWorldUpdate(blocks)
        success = true
        result = #blocks .. " blocks scanned"
    elseif command == "getFuelLevel" then
        result = turtle.getFuelLevel()
        success = true
    elseif command == "getFuelLimit" then
        result = turtle.getFuelLimit()
        success = true
    elseif command == "transferTo" then
        local slot = args[1] or 1
        local count = args[2]
        success = turtle.transferTo(slot, count)
    elseif command == "craft" then
        local count = args[1] or 1
        if turtle.craft then
            success = turtle.craft(count)
        else
            err = "No crafting table equipped"
        end
    elseif command == "equipLeft" then
        success = turtle.equipLeft()
        if success then
            detectPeripherals()
            sendPeripheralUpdate(true, "left")
        end
    elseif command == "equipRight" then
        success = turtle.equipRight()
        if success then
            detectPeripherals()
            sendPeripheralUpdate(true, "right")
        end
    elseif command == "getExternalInventory" then
        result = getExternalInventory()
        success = true
    elseif command == "pushToChest" then
        local turtleSlot = args[1] or turtle.getSelectedSlot()
        local count = args[2] or 64
        turtle.select(turtleSlot)
        success = turtle.drop(count)
        if not success then
            success = turtle.dropUp(count)
        end
        if not success then
            success = turtle.dropDown(count)
        end
        if not success then
            err = "No chest found or inventory full"
        else
            result = "Items transferred"
        end
    elseif command == "pullFromChest" then
        local count = args[2] or 64
        success = turtle.suck(count)
        if not success then
            success = turtle.suckUp(count)
        end
        if not success then
            success = turtle.suckDown(count)
        end
        if not success then
            err = "No chest found or chest empty"
        else
            result = "Items retrieved"
        end
    elseif command == "clearQueue" then
        commandQueue = {}
        success = true
        result = "Queue cleared"
        log("Command queue cleared")
    elseif command == "gpsLocate" then
        success = tryGPS()
        if success then
            result = position
        else
            err = "GPS not available"
        end
    elseif command == "pathfind" then
        local tx = args[1]
        local ty = args[2]
        local tz = args[3]
        if tx and ty and tz then
            local moves = pathfindTo(tx, ty, tz)
            success = true
            result = moves .. " moves completed"
        else
            err = "Invalid coordinates"
        end
    elseif command == "setLabel" then
        local newLabel = args[1]
        if newLabel then
            os.setComputerLabel(newLabel)
            success = true
            result = "Label set to: " .. newLabel
        else
            err = "No label provided"
        end
    elseif command == "placeSign" then
        local text = args[1] or ""
        success = turtle.place()
        if success then
            local signDir = "front"
            local sign = peripheral.wrap(signDir)
            if sign and sign.setSignText then
                sign.setSignText(text)
                result = "Sign placed with text"
            else
                result = "Sign placed (text not supported)"
            end
        end
    elseif command == "reboot" then
        sendCommandResult(command, true, "Rebooting...", nil)
        if ws then ws.close() end
        log("Rebooting...")
        os.reboot()
    elseif command == "shutdown" then
        sendCommandResult(command, true, "Shutting down...", nil)
        if ws then ws.close() end
        log("Shutting down...")
        os.shutdown()
    elseif command == "getPeripherals" then
        result = getPeripheralList()
        success = true
    elseif command == "compare" then
        success, result = turtle.compare()
    elseif command == "compareUp" then
        success, result = turtle.compareUp()
    elseif command == "compareDown" then
        success, result = turtle.compareDown()
    elseif command == "compareTo" then
        local slot = args[1] or 1
        success = turtle.compareTo(slot)
    elseif command == "getItemDetail" then
        local slot = args[1] or turtle.getSelectedSlot()
        result = turtle.getItemDetail(slot, true)
        success = result ~= nil
    elseif command == "calibrateGPS" then
        local gpsX, gpsY, gpsZ = gps.locate(5)
        if gpsX then
            local offset = {
                x = gpsX - position.x,
                y = gpsY - position.y,
                z = gpsZ - position.z
            }
            position.x = gpsX
            position.y = gpsY
            position.z = gpsZ
            hasGPS = true
            
            if ws then
                ws.send(textutils.serialiseJSON({
                    type = "gps_calibrated",
                    success = true,
                    offset = offset
                }))
            end
            
            sendStatusUpdate()
            success = true
            result = "GPS calibrated. Offset: " .. offset.x .. ", " .. offset.y .. ", " .. offset.z
        else
            if ws then
                ws.send(textutils.serialiseJSON({
                    type = "gps_calibrated",
                    success = false,
                    error = "GPS network not available"
                }))
            end
            err = "GPS network not available"
        end
    elseif command == "eval" then
        local code = args[1]
        if code then
            local fn, loadErr = load(code, "eval", "t", _ENV)
            if fn then
                local ok, res = pcall(fn)
                if ok then
                    success = true
                    result = res
                    sendConsoleOutput("Result: " .. tostring(res))
                else
                    err = tostring(res)
                    sendConsoleOutput("Error: " .. err)
                end
            else
                err = loadErr
                sendConsoleOutput("Load error: " .. err)
            end
        end
    elseif command == "scanContainerAt" then
        local tx, ty, tz = args[1], args[2], args[3]
        local dx = tx - position.x
        local dy = ty - position.y
        local dz = tz - position.z
        local inv = {}
        local scanSide = nil
        local blockName = nil
        
        if dy == 1 then
            scanSide = "top"
        elseif dy == -1 then
            scanSide = "bottom"
        elseif math.abs(dx) + math.abs(dz) == 1 then
            local targetDir = nil
            if dz == -1 then targetDir = 0
            elseif dx == 1 then targetDir = 1
            elseif dz == 1 then targetDir = 2
            elseif dx == -1 then targetDir = 3
            end
            
            if targetDir then
                local turns = (targetDir - direction) % 4
                if turns == 1 then 
                    turtle.turnRight()
                elseif turns == 2 then 
                    turtle.turnRight()
                    turtle.turnRight()
                elseif turns == 3 then 
                    turtle.turnLeft()
                end
                direction = targetDir
            end
            scanSide = "front"
        end
        
        if scanSide then
            local hasBlock, blockData
            if scanSide == "top" then
                hasBlock, blockData = turtle.inspectUp()
            elseif scanSide == "bottom" then
                hasBlock, blockData = turtle.inspectDown()
            else
                hasBlock, blockData = turtle.inspect()
            end
            
            if hasBlock then
                blockName = blockData.name
            end
            
            local chest = peripheral.wrap(scanSide)
            if chest and chest.list then
                local items = chest.list()
                for slot, item in pairs(items) do
                    inv[slot] = {
                        name = item.name,
                        count = item.count
                    }
                end
                if ws then
                    ws.send(textutils.serialiseJSON({
                        type = "container_inventory",
                        x = tx,
                        y = ty,
                        z = tz,
                        inventory = inv,
                        blockName = blockName
                    }))
                end
                success = true
                result = "Inventory scanned"
            else
                err = "No inventory at that location"
            end
        else
            err = "Container not adjacent to turtle"
        end
    elseif command == "peripheralAction" then
        local side = args[1]
        local action = args[2]
        local arg = args[3]
        local p = peripheral.wrap(side)
        if p then
            if action == "readInventory" and p.list then
                local items = p.list()
                local inv = {}
                for slot, item in pairs(items) do
                    inv[slot] = { name = item.name, count = item.count }
                end
                if ws then
                    ws.send(textutils.serialiseJSON({
                        type = "container_inventory",
                        x = position.x,
                        y = position.y,
                        z = position.z,
                        inventory = inv,
                        blockName = "Peripheral: " .. side
                    }))
                end
                success = true
                result = "Inventory read"
            elseif action == "scan" and p.scan then
                local radius = arg or 8
                local blocks = {}
                local scanResult = p.scan(radius)
                if scanResult then
                    for _, block in ipairs(scanResult) do
                        table.insert(blocks, {
                            x = position.x + block.x,
                            y = position.y + block.y,
                            z = position.z + block.z,
                            name = block.name,
                            state = block.tags
                        })
                    end
                    sendWorldUpdate(blocks)
                    success = true
                    result = #blocks .. " blocks scanned"
                else
                    err = "Scan failed"
                end
            elseif action == "clearMonitor" and p.clear then
                p.clear()
                success = true
                result = "Monitor cleared"
            elseif action == "writeMonitor" and p.write then
                p.clear()
                p.setCursorPos(1, 1)
                p.write(tostring(arg))
                success = true
                result = "Text written"
            elseif action == "playNote" and p.playNote then
                p.playNote("harp")
                success = true
                result = "Note played"
            elseif action == "getModemInfo" then
                local info = {}
                if p.isWireless then info.wireless = p.isWireless() end
                if p.getNameLocal then info.localName = p.getNameLocal() end
                result = info
                success = true
            elseif action == "listItems" and p.listItems then
                local items = p.listItems()
                result = items
                success = true
                sendConsoleOutput("Found " .. #items .. " item types")
            elseif action == "listCraftable" and p.listCraftableItems then
                local items = p.listCraftableItems()
                result = items
                success = true
                sendConsoleOutput("Found " .. #items .. " craftable items")
            elseif action == "getColonyInfo" and p.getInfo then
                local info = p.getInfo()
                result = info
                success = true
            elseif action == "sendChat" and p.sendMessage then
                p.sendMessage(tostring(arg))
                success = true
                result = "Message sent"
            elseif action == "getEnergy" then
                local energy = 0
                if p.getEnergy then energy = p.getEnergy() end
                if p.getEnergyStored then energy = p.getEnergyStored() end
                result = energy
                success = true
                sendConsoleOutput("Energy: " .. tostring(energy))
            elseif action == "getPlayer" and p.getInventory then
                local inv = p.getInventory()
                result = inv
                success = true
            elseif action == "launch" and p.launch then
                p.launch(arg or 0, arg or 1, arg or 0)
                success = true
                result = "Launched"
            else
                err = "Action not supported: " .. tostring(action)
            end
        else
            err = "Peripheral not found: " .. tostring(side)
        end
    else
        err = "Unknown command: " .. tostring(command)
    end

    sendCommandResult(command, success, result, err)
    sendUpdate()
    
    if command ~= "geoScan" and command ~= "pathfind" and command ~= "reboot" and command ~= "shutdown" then
        local blocks = inspectSurroundings()
        if #blocks > 0 then
            sendWorldUpdate(blocks)
        end
    end
end

local function handleCommand(data)
    if data.queued then
        table.insert(commandQueue, data)
        sendUpdate()
    else
        executeCommand(data)
    end
end

local function processQueue()
    while running do
        if #commandQueue > 0 and not processingQueue then
            processingQueue = true
            local cmd = table.remove(commandQueue, 1)
            executeCommand(cmd)
            processingQueue = false
        end
        sleep(0.05)
    end
end

local function connect()
    log("Connecting to " .. SERVER_URL)
    
    local wsUrl = SERVER_URL:gsub("^http", "ws")
    
    local wsConn, wsErr = http.websocket(wsUrl)
    if not wsConn then
        log("Connection failed: " .. tostring(wsErr))
        return false
    end
    
    ws = wsConn
    log("Connected!")
    
    detectPeripherals()
    
    if tryGPS() then
        determineDirection()
    end
    
    inventory = getInventory()
    local turtleType, traits = getTurtleType()
    local equipment = getEquipment()
    local initData = {
        type = "turtle_connect",
        id = tostring(turtleId),
        label = os.getComputerLabel() or ("Turtle " .. turtleId),
        fuel = turtle.getFuelLevel(),
        maxFuel = turtle.getFuelLimit(),
        position = position,
        direction = direction,
        inventory = inventory,
        selectedSlot = turtle.getSelectedSlot(),
        peripherals = getPeripheralList(),
        turtleType = turtleType,
        traits = traits,
        equipment = equipment,
        hasGeoScanner = geoScanner ~= nil,
        hasBlockScanner = blockScanner ~= nil,
        hasUniversalScanner = universalScanner ~= nil,
        hasGPS = gps.locate(1) ~= nil
    }
    
    ws.send(textutils.serialiseJSON(initData))
    
    return true
end

local function messageLoop()
    while running do
        if ws then
            local event, url, msg = os.pullEvent()
            
            if event == "websocket_message" then
                local ok, data = pcall(textutils.unserialiseJSON, msg)
                if ok and data then
                    if data.type == "command" then
                        handleCommand(data)
                    elseif data.type == "connected" then
                        log("Registered with server as ID: " .. tostring(data.id))
                    end
                end
            elseif event == "websocket_closed" then
                log("Connection closed, reconnecting...")
                ws = nil
                sleep(2)
                connect()
            elseif event == "terminate" then
                log("Terminated by user")
                running = false
                if ws then
                    ws.close()
                end
            end
        else
            sleep(1)
        end
    end
end

local function inventoryWatcher()
    while running do
        os.pullEvent("turtle_inventory")
        if ws then
            sendInventoryUpdate()
        end
    end
end

local function peripheralWatcher()
    while running do
        local event, side = os.pullEvent()
        if event == "peripheral" then
            detectPeripherals()
            sendPeripheralUpdate(true, side)
        elseif event == "peripheral_detach" then
            detectPeripherals()
            sendPeripheralUpdate(false, side)
        end
    end
end

local function main()
    if not SERVER_URL or SERVER_URL == "" then
        print("========================================")
        print("SRTO - Setup Required")
        print("========================================")
        print("")
        print("Run the installer:")
        print("  wget run <domain>/install.lua <domain>")
        print("")
        print("Example:")
        print("  wget run http://server:5000/install.lua http://server:5000")
        print("========================================")
        return
    end

    if not connect() then
        log("Initial connection failed, will retry...")
    end
    
    parallel.waitForAny(messageLoop, processQueue, inventoryWatcher, peripheralWatcher)
end

main()
