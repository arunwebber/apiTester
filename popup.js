document.addEventListener("DOMContentLoaded", () => {
  const sendBtn = document.getElementById("send");
  const saveBtn = document.getElementById("save-request-btn");

  const saveDropdown = document.getElementById("save-dropdown");
  const saveCollectionList = document.getElementById("save-collection-list");
  const newCollectionNameInput = document.getElementById("new-collection-name");
  const saveToNewBtn = document.getElementById("save-to-new-btn");
  const methodSelect = document.getElementById("method");
  const urlInput = document.getElementById("url");
  const headersInput = document.getElementById("headers");
  const bodyInput = document.getElementById("body");
  const apiControls = document.querySelector(".api-controls");
  const responseSection = document.getElementById("response-tabs-wrapper");

  const prettyResponse = document.getElementById("pretty-response");
  const rawResponse = document.getElementById("raw-response");
  const headerResponse = document.getElementById("header-response");
  const cookieResponse = document.getElementById("cookie-response");
  const prettyMode = document.getElementById("pretty-mode");
  const historyList = document.getElementById("history-list");

  // Theme Toggle Elements
  const darkModeToggle = document.getElementById("darkModeToggle");

  let history = JSON.parse(localStorage.getItem("apiHistory")) || [];
  let collections = JSON.parse(localStorage.getItem("collections")) || [];
  let environment = JSON.parse(localStorage.getItem("environment")) || {};

  // Theme Logic
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    darkModeToggle.checked = true;
  }

  darkModeToggle.addEventListener("change", (e) => {
    if (e.target.checked) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  });

  function createHistoryItem({ method, url, headersText, bodyText }, index) {
    const li = document.createElement("li");
    li.classList.add("history-item");
    li.innerHTML = `
      <button class="delete-btn" title="Delete" style="margin-right: 8px;">X</button>
      <span class="history-text" style="cursor: pointer;">${method.toUpperCase()}: ${url}</span>
    `;

    const deleteBtn = li.querySelector(".delete-btn");
    const textSpan = li.querySelector(".history-text");

    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      history.splice(index, 1);
      localStorage.setItem("apiHistory", JSON.stringify(history));
      renderHistory();
    });

    textSpan.addEventListener("click", () => {
      urlInput.value = url;
      methodSelect.value = method;
      headersInput.value = headersText;
      bodyInput.value = bodyText;
    });

    historyList.appendChild(li);
  }

  function renderHistory() {
    historyList.innerHTML = "";
    history.forEach((item, index) => {
      createHistoryItem(item, index);
    });
  }

  renderHistory();

  document.querySelectorAll(".sidebar-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".sidebar-tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".sidebar-content").forEach(c => c.style.display = "none");
      tab.classList.add("active");
      const tabId = tab.dataset.tab;
      document.getElementById(`sidebar-${tabId}`).style.display = "block";

      if (tabId === "history") {
        apiControls.style.display = 'block';
      }
    });
  });

  document.querySelectorAll(".resp-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".resp-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      document.querySelectorAll(".response-content").forEach(section => {
        section.style.display = "none";
      });
      const targetId = `tab-${tab.dataset.tab}`;
      const target = document.getElementById(targetId);
      if (target) target.style.display = "block";
    });
  });

  document.querySelectorAll(".body-subtab").forEach(subtab => {
    subtab.addEventListener("click", () => {
      document.querySelectorAll(".body-subtab").forEach(t => t.classList.remove("active"));
      subtab.classList.add("active");
      const selected = subtab.dataset.subtab;
      prettyResponse.style.display = selected === "pretty" ? "block" : "none";
      rawResponse.style.display = selected === "raw" ? "block" : "none";
    });
  });

  // ENVIRONMENT TAB
  const envKeyInput = document.getElementById("env-key");
  const envValueInput = document.getElementById("env-value");
  const addEnvBtn = document.getElementById("add-env-btn");
  const envList = document.getElementById("env-list");

  function renderEnvList() {
    envList.innerHTML = "";
    for (const [key, value] of Object.entries(environment)) {
      const item = document.createElement("div");
      item.className = "history-item";
      item.innerHTML = `
        <span><strong>${key}</strong>: ${value}</span>
        <button class="delete-btn" data-key="${key}">Remove</button>
      `;
      envList.appendChild(item);
    }

    envList.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.key;
        delete environment[key];
        localStorage.setItem("environment", JSON.stringify(environment));
        renderEnvList();
      });
    });
  }

  addEnvBtn.addEventListener("click", () => {
    const key = envKeyInput.value.trim();
    const value = envValueInput.value.trim();
    if (key && value) {
      environment[key] = value;
      localStorage.setItem("environment", JSON.stringify(environment));
      envKeyInput.value = "";
      envValueInput.value = "";
      renderEnvList();
    }
  });

  renderEnvList();

  function replaceEnvVariables(str) {
    return str.replace(/{{(.*?)}}/g, (_, key) => environment[key.trim()] || "");
  }

  // COLLECTION TAB
  const collectionList = document.getElementById("collection-list");
  const collectionNameInput = document.getElementById("collection-name");
  const addCollectionBtn = document.getElementById("add-collection-btn");

  function renderCollections() {
    collectionList.innerHTML = "";
    collections.forEach((col, idx) => {
      const div = document.createElement("div");
      div.className = "history-item";
      div.style.cursor = "pointer";
      div.innerHTML = `
        <span><strong>${col.name}</strong> (${col.requests.length} requests)</span>
        <button class="delete-btn" data-index="${idx}">Delete</button>
      `;

      div.addEventListener("click", () => {
        displayCollectionRequests(col);
      });

      div.querySelector(".delete-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        collections.splice(idx, 1);
        localStorage.setItem("collections", JSON.stringify(collections));
        renderCollections();
      });

      collectionList.appendChild(div);
    });
  }

  function displayCollectionRequests(collection) {
    apiControls.style.display = 'none';

    const collectionRequestsDisplay = document.createElement('div');
    collectionRequestsDisplay.id = "collection-requests-display";
    collectionRequestsDisplay.innerHTML = `
        <h3>Requests in "${collection.name}"</h3>
        <ul id="collection-requests-list"></ul>
    `;
    
    const backBtn = document.createElement('button');
    backBtn.innerText = "Back to Main";
    backBtn.style.marginBottom = "10px";
    backBtn.addEventListener('click', () => {
        apiControls.style.display = 'block';
        collectionRequestsDisplay.remove();
    });
    collectionRequestsDisplay.insertBefore(backBtn, collectionRequestsDisplay.firstChild);

    const main = document.querySelector(".main");
    const existingDisplay = document.getElementById("collection-requests-display");
    if (existingDisplay) existingDisplay.remove();

    main.insertBefore(collectionRequestsDisplay, main.firstChild);

    const collectionRequestsList = document.getElementById("collection-requests-list");

    collection.requests.forEach((req, idx) => {
      const reqItem = document.createElement("li");
      reqItem.className = "history-item";
      reqItem.style.cursor = "pointer";
      reqItem.innerHTML = `
        <span class="history-text">${req.method.toUpperCase()}: ${req.url}</span>
      `;
      reqItem.addEventListener('click', () => {
        urlInput.value = req.url;
        methodSelect.value = req.method;
        headersInput.value = req.headersText;
        bodyInput.value = req.bodyText;
        apiControls.style.display = 'block';
        collectionRequestsDisplay.remove();
        document.querySelector('.sidebar-tab.active').classList.remove('active');
        document.querySelector('[data-tab="history"]').classList.add('active');
        document.querySelectorAll('.sidebar-content').forEach(c => c.style.display = 'none');
        document.getElementById('sidebar-history').style.display = 'block';
      });
      collectionRequestsList.appendChild(reqItem);
    });
  }

  addCollectionBtn.addEventListener("click", () => {
    const name = collectionNameInput.value.trim();
    if (name) {
      collections.push({ name, requests: [] });
      localStorage.setItem("collections", JSON.stringify(collections));
      collectionNameInput.value = "";
      renderCollections();
    }
  });

  renderCollections();

  function renderSaveCollections() {
    saveCollectionList.innerHTML = "";
    collections.forEach((col, idx) => {
      const li = document.createElement("li");
      li.style.padding = "8px";
      li.style.cursor = "pointer";
      li.innerText = col.name;
      li.addEventListener("click", () => {
        saveRequestToCollection(idx);
        saveDropdown.style.display = "none";
      });
      saveCollectionList.appendChild(li);
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      saveDropdown.style.display = saveDropdown.style.display === "none" ? "block" : "none";
      renderSaveCollections();
    });
  }

  if (saveToNewBtn) {
    saveToNewBtn.addEventListener("click", () => {
      const newName = newCollectionNameInput.value.trim();
      if (newName) {
        collections.push({ name: newName, requests: [] });
        localStorage.setItem("collections", JSON.stringify(collections));
        saveRequestToCollection(collections.length - 1);
        newCollectionNameInput.value = "";
        saveDropdown.style.display = "none";
        renderCollections();
      }
    });
  }

  function saveRequestToCollection(collectionIndex) {
    const request = {
      method: methodSelect.value,
      url: urlInput.value.trim(),
      headersText: headersInput.value,
      bodyText: bodyInput.value,
      timestamp: new Date().toISOString(),
    };
    collections[collectionIndex].requests.push(request);
    localStorage.setItem("collections", JSON.stringify(collections));
    alert(`Request saved to "${collections[collectionIndex].name}".`);
  }

  // Function to format HTML with indentation
  function formatHtml(html) {
    let formatted = '';
    const lines = html.replace(/</g, '\n<').replace(/>/g, '>\n').split('\n');
    let indent = 0;
    const indentChar = '  ';

    for (const line of lines) {
      if (line.trim() === '') continue;

      if (line.startsWith('</')) {
        indent--;
        formatted += indentChar.repeat(indent) + line.trim() + '\n';
      } else if (line.startsWith('<') && !line.endsWith('/>')) {
        formatted += indentChar.repeat(indent) + line.trim() + '\n';
        indent++;
      } else {
        formatted += indentChar.repeat(indent) + line.trim() + '\n';
      }
    }
    return formatted.trim();
  }

  // New function to format the response based on the selected mode
  function formatResponse(raw, mode, contentType) {
    let formatted = raw;

    if ((mode === "json") || (mode === "auto" && contentType.includes("application/json"))) {
      try {
        formatted = JSON.stringify(JSON.parse(raw), null, 2);
      } catch (err) {
        formatted = `Could not parse response as JSON: ${err.message}\n\nRaw response:\n${raw}`;
        console.error("JSON Parsing Error:", err);
      }
    } else if ((mode === "xml") || (mode === "auto" && contentType.includes("xml"))) {
      try {
        const doc = new DOMParser().parseFromString(raw, "application/xml");
        formatted = new XMLSerializer().serializeToString(doc);
      } catch (err) {
        formatted = `Could not parse response as XML: ${err.message}\n\nRaw response:\n${raw}`;
        console.error("XML Parsing Error:", err);
      }
    } else if ((mode === "html") || (mode === "auto" && contentType.includes("text/html"))) {
      formatted = formatHtml(raw);
    } else {
      formatted = raw;
    }
    return formatted;
  }

  // EVENT LISTENER FOR PRETTY MODE DROPDOWN
  prettyMode.addEventListener('change', () => {
    const currentRawContent = rawResponse.innerText;
    const currentContentType = prettyResponse.dataset.contentType || '';
    const newFormattedContent = formatResponse(currentRawContent, prettyMode.value, currentContentType);
    prettyResponse.innerText = newFormattedContent;
  });

  // SEND REQUEST
  sendBtn.addEventListener("click", async () => {
    console.log("Send button clicked. Starting API request...");

    let url = replaceEnvVariables(urlInput.value.trim());
    let method = methodSelect.value;
    let headersText = replaceEnvVariables(headersInput.value);
    let bodyText = replaceEnvVariables(bodyInput.value);

    prettyResponse.innerText = "Loading...";
    rawResponse.innerText = "";
    headerResponse.innerText = "";
    cookieResponse.innerText = "";
    
    // Reset prettyMode dropdown to auto
    prettyMode.value = 'auto';

    let headers = {};
    if (headersText.trim() !== "") {
      try {
        headers = JSON.parse(headersText);
      } catch (err) {
        prettyResponse.innerText = `Invalid JSON in headers: ${err.message}`;
        console.error("Headers JSON Parsing Error:", err);
        return;
      }
    }
    console.log("Request Headers:", headers);

    let body = null;
    if (["POST", "PUT", "PATCH"].includes(method.toUpperCase())) {
      if (bodyText.trim() !== "") {
        try {
          body = JSON.parse(bodyText);
        } catch (err) {
          prettyResponse.innerText = `Invalid JSON in body: ${err.message}`;
          console.error("Body JSON Parsing Error:", err);
          return;
        }
      }
    }
    console.log("Request Body:", body);

    try {
      console.log(`Sending a ${method} request to ${url}`);
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      console.log("Response received.");
      console.log("Response Status:", res.status);
      console.log("Response OK:", res.ok);

      if (!res.ok) {
        prettyResponse.innerText = `Error: ${res.status} ${res.statusText}\n\nCheck the Console and Network tabs for details.`;
        return;
      }

      const raw = await res.text();
      const contentType = res.headers.get("content-type") || "";
      
      // Store raw content and content type for later use
      rawResponse.innerText = raw;
      prettyResponse.dataset.contentType = contentType;

      // Format based on the new logic
      const formatted = formatResponse(raw, prettyMode.value, contentType);
      prettyResponse.innerText = formatted;

      let headerStr = "";
      res.headers.forEach((value, key) => {
        headerStr += `${key}: ${value}\n`;
      });
      headerResponse.innerText = headerStr || "No headers.";

      const setCookie = res.headers.get("set-cookie");
      cookieResponse.innerText = setCookie || "No Set-Cookie header.";

      const newEntry = { method, url, headersText, bodyText };
      history.unshift(newEntry);
      localStorage.setItem("apiHistory", JSON.stringify(history));
      renderHistory();

    } catch (err) {
      prettyResponse.innerText = `Request failed: ${err.message}. Check the Console and Network tabs for details.`;
      console.error("Fetch Error:", err);
    }
  });
});