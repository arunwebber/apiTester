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

      // Show/hide main controls based on the tab
      apiControls.style.display = (tabId === "history" || tabId === "collections") ? 'block' : 'none';

      // Remove any temporary screens
      const tempScreen = document.getElementById("collection-requests-display") || document.getElementById("test-screen");
      if (tempScreen) {
        tempScreen.remove();
        resetSaveButton();
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
        <div class="collection-actions" style="display: flex; gap: 5px;">
          <button class="rename-btn" data-index="${idx}" style="background-color: #007bff; border-color: #007bff; color: #fff;">Rename</button>
          <button class="delete-btn" data-index="${idx}">Delete</button>
        </div>
      `;

      div.addEventListener("click", () => {
        displayCollectionRequests(col, idx);
      });

      div.querySelector(".delete-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        collections.splice(idx, 1);
        localStorage.setItem("collections", JSON.stringify(collections));
        renderCollections();
      });

      div.querySelector(".rename-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        const newName = prompt("Enter a new name for the collection:", col.name);
        if (newName && newName.trim() !== "" && newName !== col.name) {
          collections[idx].name = newName;
          localStorage.setItem("collections", JSON.stringify(collections));
          renderCollections();
        }
      });

      collectionList.appendChild(div);
    });
  }

  function displayCollectionRequests(collection, collectionIndex) {
    apiControls.style.display = 'none';

    const collectionRequestsDisplay = document.createElement('div');
    collectionRequestsDisplay.id = "collection-requests-display";
    collectionRequestsDisplay.innerHTML = `
        <h3>Requests in "${collection.name}"</h3>
        <ul id="collection-requests-list"></ul>
    `;
    
    const main = document.querySelector(".main");
    const existingDisplay = document.getElementById("collection-requests-display") || document.getElementById("test-screen");
    if (existingDisplay) existingDisplay.remove();

    main.insertBefore(collectionRequestsDisplay, main.firstChild);

    const collectionRequestsList = document.getElementById("collection-requests-list");

    collection.requests.forEach((req, reqIndex) => {
      const reqItem = document.createElement("li");
      reqItem.className = "history-item";
      reqItem.style.cursor = "pointer";
      reqItem.innerHTML = `
        <span class="history-text">${req.method.toUpperCase()}: ${req.url}</span>
        <div class="request-actions" style="display: flex; gap: 5px;">
          <button class="test-btn" data-req-index="${reqIndex}" style="background-color: #007bff; border-color: #007bff; color: #fff;">Test</button>
          <button class="update-btn" data-req-index="${reqIndex}" style="background-color: #ffc107; border-color: #ffc107; color: #fff;">Update</button>
          <button class="delete-btn" data-req-index="${reqIndex}">Delete</button>
        </div>
      `;

      reqItem.querySelector(".history-text").addEventListener('click', () => {
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

      // Delete button listener
      reqItem.querySelector(".delete-btn").addEventListener('click', (e) => {
        e.stopPropagation();
        collection.requests.splice(reqIndex, 1);
        localStorage.setItem("collections", JSON.stringify(collections));
        displayCollectionRequests(collection, collectionIndex); // Re-render the list
      });
      
      // Update button listener
      reqItem.querySelector(".update-btn").addEventListener('click', (e) => {
        e.stopPropagation();
        urlInput.value = req.url;
        methodSelect.value = req.method;
        headersInput.value = req.headersText;
        bodyInput.value = req.bodyText;
        toggleSaveUpdateButton(collectionIndex, reqIndex);
        apiControls.style.display = 'block';
        collectionRequestsDisplay.remove();
        document.querySelector('.sidebar-tab.active').classList.remove('active');
        document.querySelector('[data-tab="history"]').classList.add('active');
        document.querySelectorAll('.sidebar-content').forEach(c => c.style.display = 'none');
        document.getElementById('sidebar-history').style.display = 'block';
      });

      // Test button listener
      reqItem.querySelector(".test-btn").addEventListener('click', (e) => {
        e.stopPropagation();
        displayTestScreen(req);
      });

      collectionRequestsList.appendChild(reqItem);
    });
  }

  function displayTestScreen(request) {
    apiControls.style.display = 'none';

    const testScreen = document.createElement('div');
    testScreen.id = "test-screen";
    testScreen.innerHTML = `
      <h3>Test Request</h3>
      <div class="api-controls" style="display: flex; flex-direction: column; gap: 10px;">
        <div class="method-url-container" style="display: flex; gap: 5px;">
          <select id="test-method" disabled style="width: 100px;">
            <option>${request.method}</option>
          </select>
          <input type="text" id="test-url" value="${request.url}" disabled style="flex-grow: 1;">
        </div>
        <div class="headers-body-container" style="display: flex; flex-direction: column; gap: 5px;">
          <textarea id="test-headers" placeholder="Headers (JSON)" disabled>${request.headersText}</textarea>
          <textarea id="test-body" placeholder="Body (JSON)" disabled>${request.bodyText}</textarea>
        </div>
        <button id="test-send-btn" style="width: 100%; padding: 10px; font-size: 16px; border-radius: 5px; border: 1px solid #28a745; background-color: #28a745; color: white; cursor: pointer;">Test</button>
      </div>
      <div id="test-response-wrapper" style="margin-top: 20px;">
        <h4>Response</h4>
        <pre id="test-response" style="background-color: #2c2f33; color: white; padding: 10px; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word;"></pre>
      </div>
    `;

    const main = document.querySelector(".main");
    const existingDisplay = document.getElementById("collection-requests-display") || document.getElementById("test-screen");
    if (existingDisplay) existingDisplay.remove();
    main.insertBefore(testScreen, main.firstChild);

    const testSendBtn = document.getElementById("test-send-btn");
    const testResponse = document.getElementById("test-response");

    testSendBtn.addEventListener('click', async () => {
      testResponse.innerText = "Loading...";
      const url = request.url;
      const method = request.method;
      const headers = request.headersText ? JSON.parse(request.headersText) : {};
      const body = request.bodyText ? JSON.parse(request.bodyText) : undefined;
      
      try {
        const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
        const text = await res.text();
        const formatted = JSON.stringify(JSON.parse(text), null, 2);
        testResponse.innerText = formatted;
      } catch (err) {
        testResponse.innerText = `Error: ${err.message}\n\nRaw response:\n${text || 'N/A'}`;
      }
    });
  }

  function toggleSaveUpdateButton(colIndex, reqIndex) {
    saveBtn.dataset.updateIndex = `${colIndex},${reqIndex}`;
    saveBtn.innerText = "Update";
    saveBtn.style.backgroundColor = "#ffc107";
    saveBtn.style.borderColor = "#ffc107";
  }

  function resetSaveButton() {
    saveBtn.dataset.updateIndex = "";
    saveBtn.innerText = "Save";
    saveBtn.style.backgroundColor = "#28a745";
    saveBtn.style.borderColor = "#28a745";
  }

  function updateRequestInCollection(colIndex, reqIndex) {
    const updatedRequest = {
      method: methodSelect.value,
      url: urlInput.value.trim(),
      headersText: headersInput.value,
      bodyText: bodyInput.value,
      timestamp: new Date().toISOString(),
    };
    collections[colIndex].requests[reqIndex] = updatedRequest;
    localStorage.setItem("collections", JSON.stringify(collections));
    resetSaveButton();
    renderCollections();
    displayCollectionRequests(collections[colIndex], colIndex);
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
      const updateIndex = saveBtn.dataset.updateIndex;
      if (updateIndex) {
        const [colIndex, reqIndex] = updateIndex.split(',').map(Number);
        updateRequestInCollection(colIndex, reqIndex);
      } else {
        saveDropdown.style.display = saveDropdown.style.display === "none" ? "block" : "none";
        renderSaveCollections();
      }
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
    // Re-render the collections list to show the updated count immediately.
    renderCollections();
  }

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

  function formatResponse(raw, mode, contentType) {
    let formatted = raw;

    if ((mode === "json") || (mode === "auto" && contentType.includes("application/json"))) {
      try {
        formatted = JSON.stringify(JSON.parse(raw), null, 2);
      } catch (err) {
        formatted = `Could not parse response as JSON: ${err.message}\n\nRaw response:\n${raw}`;
      }
    } else if ((mode === "xml") || (mode === "auto" && contentType.includes("xml"))) {
      try {
        const doc = new DOMParser().parseFromString(raw, "application/xml");
        formatted = new XMLSerializer().serializeToString(doc);
      } catch (err) {
        formatted = `Could not parse response as XML: ${err.message}\n\nRaw response:\n${raw}`;
      }
    } else if ((mode === "html") || (mode === "auto" && contentType.includes("text/html"))) {
      formatted = formatHtml(raw);
    } else {
      formatted = raw;
    }
    return formatted;
  }

  prettyMode.addEventListener('change', () => {
    const currentRawContent = rawResponse.innerText;
    const currentContentType = prettyResponse.dataset.contentType || '';
    const newFormattedContent = formatResponse(currentRawContent, prettyMode.value, currentContentType);
    prettyResponse.innerText = newFormattedContent;
  });

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
      
      rawResponse.innerText = raw;
      prettyResponse.dataset.contentType = contentType;

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