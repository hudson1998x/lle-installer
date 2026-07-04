let currentScreen = "checking";
let selectedVersion = null;
let versions = [];

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  const screen = document.getElementById(`screen-${screenId}`);
  if (screen) {
    screen.classList.add("active");
    currentScreen = screenId;
  }
}

function init() {
  setupEventListeners();
  setupProgressListeners();
  checkInitialStatus();
}

async function checkInitialStatus() {
  showScreen("checking");

  try {
    const status = await window.lle.getInitialStatus();

    if (!status.dotnetInstalled) {
      showScreen("dotnet");
      return;
    }

    if (!status.appInstalled) {
      await loadVersions();
      showScreen("versions");
      return;
    }

    if (status.serverRunning) {
      const url = await window.lle.getServerUrl();
      document.getElementById("server-url").textContent = url;
      showScreen("running");
      return;
    }

    const projectPath = await window.lle.getInstallPath();
    if (projectPath) {
      await launchServer(projectPath);
    } else {
      await loadVersions();
      showScreen("versions");
    }
  } catch (err) {
    console.error("Init error:", err);
    await loadVersions();
    showScreen("versions");
  }
}

async function loadVersions() {
  const listEl = document.getElementById("version-list");
  listEl.innerHTML = '<div class="spinner small"></div><p>Loading versions...</p>';

  try {
    versions = await window.lle.getReleases();
    renderVersions();
  } catch (err) {
    listEl.innerHTML = `<p>Failed to load versions: ${err.message}</p><button class="btn btn-secondary" onclick="loadVersions()">Retry</button>`;
  }
}

function renderVersions() {
  const listEl = document.getElementById("version-list");
  listEl.innerHTML = "";

  if (versions.length === 0) {
    listEl.innerHTML = "<p>No versions available</p>";
    return;
  }

  versions.forEach((v) => {
    const item = document.createElement("div");
    item.className = "version-item";
    item.innerHTML = `
      <div class="version-info">
        <div class="version-tag">${v.name || v.tag}</div>
        <div class="version-date">${new Date(v.date).toLocaleDateString()}</div>
      </div>
      <div class="version-select">&#8250;</div>
    `;
    item.addEventListener("click", (e) => selectVersion(v, e.currentTarget));
    listEl.appendChild(item);
  });
}

async function selectVersion(version, element) {
  selectedVersion = version;

  document.querySelectorAll(".version-item").forEach((item) => {
    item.classList.remove("selected");
  });
  if (element) element.classList.add("selected");

  const progressEl = document.getElementById("install-progress");
  progressEl.classList.remove("hidden");

  try {
    const projectPath = await window.lle.installLle(version.tag, version.zipballUrl);
    await launchServer(projectPath);
  } catch (err) {
    console.error("Install error:", err);
    progressEl.classList.add("hidden");
    alert(`Installation failed: ${err.message}`);
  }
}

async function launchServer(projectPath) {
  showScreen("checking");
  document.getElementById("checking-status").textContent = "Starting server...";

  try {
    const url = await window.lle.startServer(projectPath);
    document.getElementById("server-url").textContent = url;
    showScreen("running");
  } catch (err) {
    console.error("Server start error:", err);
    alert(`Failed to start server: ${err.message}`);
    showScreen("versions");
  }
}

async function handleSwitchVersion() {
  await loadVersions();
  showScreen("versions");
}

async function handleUninstall() {
  showScreen("uninstall");

  window.lle.onUninstallProgress((msg) => {
    document.getElementById("uninstall-progress-text").textContent = msg;
  });

  try {
    await window.lle.uninstall();
    alert("LLE has been uninstalled.");
    showScreen("versions");
  } catch (err) {
    console.error("Uninstall error:", err);
    alert(`Uninstall failed: ${err.message}`);
    showScreen("running");
  }
}

function setupEventListeners() {
  document.getElementById("btn-install-dotnet").addEventListener("click", async () => {
    const btn = document.getElementById("btn-install-dotnet");
    btn.disabled = true;
    btn.textContent = "Installing...";

    document.getElementById("dotnet-progress").classList.remove("hidden");

    try {
      const success = await window.lle.installDotnet();
      if (success) {
        await loadVersions();
        showScreen("versions");
      } else {
        btn.disabled = false;
        btn.textContent = "Install .NET 10 SDK";
        alert(".NET installation failed. Please install manually.");
      }
    } catch (err) {
      btn.disabled = false;
      btn.textContent = "Install .NET 10 SDK";
      alert(`Error: ${err.message}`);
    }
  });

  document.getElementById("btn-cancel").addEventListener("click", async () => {
    await window.lle.closeWindow();
  });

  document.getElementById("btn-open-browser").addEventListener("click", async () => {
    const url = await window.lle.getServerUrl();
    await window.lle.openUrl(url);
  });

  document.getElementById("btn-switch-version").addEventListener("click", handleSwitchVersion);
  document.getElementById("btn-uninstall").addEventListener("click", handleUninstall);
}

function setupProgressListeners() {
  window.lle.onDotnetProgress((msg) => {
    document.getElementById("dotnet-progress-text").textContent = msg;
    const match = msg.match(/(\d+)%/);
    if (match) {
      document.getElementById("dotnet-progress-fill").style.width = `${match[1]}%`;
    }
  });

  window.lle.onInstallProgress((msg) => {
    document.getElementById("install-progress-text").textContent = msg;
    const match = msg.match(/(\d+)%/);
    if (match) {
      document.getElementById("install-progress-fill").style.width = `${match[1]}%`;
    }
  });

  window.lle.onServerStatus((msg) => {
    document.getElementById("checking-status").textContent = msg;
  });
}

document.addEventListener("DOMContentLoaded", init);
