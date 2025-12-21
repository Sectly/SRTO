-- // SRTO (Sectly's Remote Turtle Orchestrator) - Downloader Script

local function readAll(h)
  local s = h.readAll()
  h.close()
  return s
end

local url = ...
if not url or url == "" then
  print("SRTO Installer")
  print("--------------")
  print("Usage:")
  print("wget run <server>/install.lua <server>")
  print("")
  print("Example:")
  print("wget run https://example.com/install.lua https://example.com")
  return
end

if string.sub(url, -1) == "/" then
  url = string.sub(url, 1, -2)
end

local srtoUrl = url .. "/srto.lua"
print("SRTO Installer")
print("--------------")
print("Server: " .. url)
print("")
print("Downloading SRTO client...")

local h = http.get(srtoUrl, { ["Cache-Control"] = "no-cache" })
if not h then
  print("ERROR: Failed to download from: " .. srtoUrl)
  print("Make sure the server is running and accessible.")
  return
end

local code = readAll(h)
print("Downloaded " .. #code .. " bytes")

local f = fs.open("/srto.lua", "w")
f.write(code)
f.close()
print("Saved to /srto.lua")

local f2 = fs.open("/srto_server.txt", "w")
f2.write(url)
f2.close()
print("Server URL saved to /srto_server.txt")

local startupCode = [[
-- SRTO Startup Script
local function getServerUrl()
  local f = fs.open("/srto_server.txt", "r")
  if not f then return nil end
  local url = f.readAll():gsub("[\r\n]", "")
  f.close()
  return url
end

local serverUrl = getServerUrl()
if not serverUrl then
  print("ERROR: No server URL found. Run installer again.")
  return
end

shell.run("/srto.lua", serverUrl)
]]

local f3 = fs.open("/startup", "w")
f3.write(startupCode)
f3.close()
print("Created /startup")

print("")
print("Installation complete!")
print("Rebooting in 3 seconds...")
sleep(3)
os.reboot()
