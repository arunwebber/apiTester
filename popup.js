// A simple class to manage all localStorage interactions.
class StorageManager {
    static save(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Error saving to localStorage for key "${key}":`, e);
        }
    }

    static get(key) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (e) {
            console.error(`Error getting from localStorage for key "${key}":`, e);
            return null;
        }
    }
}

// Manages all the application data: history, collections, and environments.
class DataManager {
    constructor() {
        this.history = StorageManager.get("apiHistory") || [];
        this.collections = StorageManager.get("collections") || [];
        this.environment = StorageManager.get("environment") || {};
    }

    addHistoryEntry(entry) {
        this.history.unshift(entry);
        StorageManager.save("apiHistory", this.history);
    }

    deleteHistoryEntry(index) {
        this.history.splice(index, 1);
        StorageManager.save("apiHistory", this.history);
    }

    addCollection(name) {
        this.collections.push({ name, requests: [] });
        StorageManager.save("collections", this.collections);
    }

    addRequestToCollection(request, collectionIndex) {
        this.collections[collectionIndex].requests.push(request);
        StorageManager.save("collections", this.collections);
    }

    updateRequestInCollection(request, collectionIndex, requestIndex) {
        this.collections[collectionIndex].requests[requestIndex] = request;
        StorageManager.save("collections", this.collections);
    }

    deleteRequestFromCollection(collectionIndex, requestIndex) {
        this.collections[collectionIndex].requests.splice(requestIndex, 1);
        StorageManager.save("collections", this.collections);
    }

    addEnvVariable(key, value) {
        this.environment[key] = value;
        StorageManager.save("environment", this.environment);
    }

    deleteEnvVariable(key) {
        delete this.environment[key];
        StorageManager.save("environment", this.environment);
    }

    // A helper method to replace environment variables in a string.
    replaceEnvVariables(str) {
        return str.replace(/{{(.*?)}}/g, (match, key) => this.environment[key.trim()] || "");
    }
    
    // New methods for import/export
    exportCollections() {
        const data = JSON.stringify(this.collections, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "collections.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importCollections(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    if (Array.isArray(importedData)) {
                        // Advanced merge to prevent duplicates by name
                        const existingCollectionNames = new Set(this.collections.map(c => c.name));
                        const newCollections = importedData.filter(c => !existingCollectionNames.has(c.name));
                        this.collections.push(...newCollections);
                        StorageManager.save("collections", this.collections);
                        resolve();
                    } else {
                        reject(new Error("Invalid file format. Please import a JSON array."));
                    }
                } catch (error) {
                    reject(new Error("Error parsing JSON file."));
                }
            };
            reader.onerror = () => {
                reject(new Error("Error reading file."));
            };
            reader.readAsText(file);
        });
    }
}

// Manages all interactions with the user interface (UI) and the DOM.
class UIManager {
    constructor(app) {
        this.app = app;
        this.dataManager = app.dataManager;
        this.elements = {};
        this.cacheDOM();
        this.bindEvents();
    }

    // Caches all necessary DOM elements for quick access.
    cacheDOM() {
        this.elements = {
            sendBtn: document.getElementById("send"),
            saveBtn: document.getElementById("save-request-btn"),
            saveDropdown: document.getElementById("save-dropdown"),
            saveCollectionList: document.getElementById("save-collection-list"),
            newCollectionNameInput: document.getElementById("new-collection-name"),
            saveToNewBtn: document.getElementById("save-to-new-btn"),
            methodSelect: document.getElementById("method"),
            urlInput: document.getElementById("url"),
            headersInput: document.getElementById("headers"),
            bodyInput: document.getElementById("body"),
            prettyResponse: document.getElementById("pretty-response"),
            rawResponse: document.getElementById("raw-response"),
            headerResponse: document.getElementById("header-response"),
            cookieResponse: document.getElementById("cookie-response"),
            prettyMode: document.getElementById("pretty-mode"),
            historyList: document.getElementById("history-list"),
            darkModeToggle: document.getElementById("darkModeToggle"),
            envKeyInput: document.getElementById("env-key"),
            envValueInput: document.getElementById("env-value"),
            addEnvBtn: document.getElementById("add-env-btn"),
            envList: document.getElementById("env-list"),
            collectionList: document.getElementById("collection-list"),
            collectionNameInput: document.getElementById("collection-name"),
            addCollectionBtn: document.getElementById("add-collection-btn"),
            
            // Elements for Collection View
            mainApiSection: document.getElementById("main-api-section"),
            collectionRequestsDisplay: document.getElementById("collection-requests-display"),
            collectionRequestsList: document.getElementById("collection-requests-list"),
            collectionRequestsTitle: document.getElementById("collection-requests-title"),
            testScreen: document.getElementById("test-screen"),
            testMethod: document.getElementById("test-method"),
            testUrl: document.getElementById("test-url"),
            testHeaders: document.getElementById("test-headers"),
            testBody: document.getElementById("test-body"),
            testSendBtn: document.getElementById("test-send-btn"),
            testResponse: document.getElementById("test-response"),
            
            // New Elements for Import/Export
            exportCollectionsBtn: document.getElementById("export-collections-btn"),
            importCollectionsBtn: document.getElementById("import-collections-btn"),
            importFileInput: document.getElementById("import-file-input"),
        };
    }

    // Binds all event listeners to their respective DOM elements.
    bindEvents() {
        this.elements.darkModeToggle.addEventListener("change", () => this.app.toggleDarkMode());
        this.elements.sendBtn.addEventListener("click", () => this.app.sendRequest());
        this.elements.saveBtn.addEventListener("click", () => this.handleSaveButton());
        this.elements.saveToNewBtn.addEventListener("click", () => this.app.saveToNewCollection());
        this.elements.prettyMode.addEventListener("change", () => this.handlePrettyModeChange());
        this.elements.addEnvBtn.addEventListener("click", () => this.app.addEnvVariable());
        this.elements.addCollectionBtn.addEventListener("click", () => this.app.addCollection());
        
        // Event listeners for new buttons
        this.elements.exportCollectionsBtn.addEventListener("click", () => this.app.exportCollections());
        this.elements.importCollectionsBtn.addEventListener("click", () => this.elements.importFileInput.click());
        this.elements.importFileInput.addEventListener("change", (e) => this.app.handleImportFile(e.target.files[0]));

        document.querySelectorAll(".sidebar-tab").forEach(tab => {
            tab.addEventListener("click", (e) => this.handleTabSwitch(e, ".sidebar-tab", ".sidebar-content"));
        });
        document.querySelectorAll(".resp-tab").forEach(tab => {
            tab.addEventListener("click", (e) => this.handleTabSwitch(e, ".resp-tab", ".response-content"));
        });
        document.querySelectorAll(".body-subtab").forEach(tab => {
            tab.addEventListener("click", (e) => this.handleTabSwitch(e, ".body-subtab", ["#pretty-response", "#raw-response"]));
        });
    }

    // A generic function to handle all tab-switching logic.
    handleTabSwitch(e, tabSelector, contentSelector) {
        document.querySelectorAll(tabSelector).forEach(t => t.classList.remove("active"));
        e.currentTarget.classList.add("active");
        
        if (Array.isArray(contentSelector)) {
            const selectedSubtab = e.currentTarget.dataset.subtab;
            contentSelector.forEach(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    element.style.display = (selector.includes(selectedSubtab)) ? "block" : "none";
                }
            });
        } else {
            document.querySelectorAll(contentSelector).forEach(c => c.style.display = "none");
            const targetId = e.currentTarget.dataset.tab;
            const targetElement = document.getElementById(`sidebar-${targetId}`) || document.getElementById(`tab-${targetId}`);
            if (targetElement) {
                targetElement.style.display = "block";
            }
            // Reset to main API section when switching sidebar tabs
            this.showSection('main');
        }
    }

    handleSaveButton() {
        const updateIndex = this.elements.saveBtn.dataset.updateIndex;
        if (updateIndex) {
            const [colIndex, reqIndex] = updateIndex.split(',').map(Number);
            this.app.updateRequestInCollection(colIndex, reqIndex);
        } else {
            this.elements.saveDropdown.style.display = this.elements.saveDropdown.style.display === "none" ? "block" : "none";
            this.renderSaveCollections();
        }
    }
    
    handlePrettyModeChange() {
        const rawContent = this.elements.rawResponse.textContent;
        const contentType = this.elements.prettyResponse.dataset.contentType;
        this.elements.prettyResponse.textContent = this.app.formatResponse(rawContent, this.elements.prettyMode.value, contentType);
    }

    renderHistory() {
        this.elements.historyList.innerHTML = "";
        this.dataManager.history.forEach((item, index) => {
            const li = document.createElement("li");
            li.classList.add("history-item");
            li.innerHTML = `
                <button class="delete-btn" title="Delete">X</button>
                <span class="history-text">${item.method.toUpperCase()}: ${item.url}</span>
            `;

            li.querySelector(".delete-btn").addEventListener("click", (e) => {
                e.stopPropagation();
                this.dataManager.deleteHistoryEntry(index);
                this.renderHistory();
            });

            li.querySelector(".history-text").addEventListener("click", () => {
                this.app.loadRequestIntoForm(item);
            });
            this.elements.historyList.appendChild(li);
        });
    }

    renderCollections() {
        this.elements.collectionList.innerHTML = "";
        this.dataManager.collections.forEach((col, index) => {
            const li = document.createElement("li");
            li.classList.add("history-item");
            li.innerHTML = `
                <span>${col.name} (${col.requests.length})</span>
                <button class="delete-btn">X</button>
            `;
            li.querySelector(".delete-btn").addEventListener("click", (e) => {
                e.stopPropagation();
                this.dataManager.collections.splice(index, 1);
                StorageManager.save("collections", this.dataManager.collections);
                this.renderCollections();
            });
            li.addEventListener("click", () => this.displayCollectionRequests(col, index));
            this.elements.collectionList.appendChild(li);
        });
    }

    renderEnvList() {
        this.elements.envList.innerHTML = "";
        for (const [key, value] of Object.entries(this.dataManager.environment)) {
            const item = document.createElement("div");
            item.className = "history-item";
            item.innerHTML = `
                <span><strong>${key}</strong>: ${value}</span>
                <button class="delete-btn">X</button>
            `;
            item.querySelector(".delete-btn").addEventListener("click", () => {
                this.dataManager.deleteEnvVariable(key);
                this.renderEnvList();
            });
            this.elements.envList.appendChild(item);
        }
    }
    
    renderSaveCollections() {
        this.elements.saveCollectionList.innerHTML = "";
        this.dataManager.collections.forEach((col, index) => {
            const li = document.createElement("li");
            li.textContent = col.name;
            li.addEventListener("click", () => {
                this.app.addRequestToCollection(index);
                this.elements.saveDropdown.style.display = "none";
            });
            this.elements.saveCollectionList.appendChild(li);
        });
    }

    // New method to display a collection's requests
    displayCollectionRequests(collection, collectionIndex) {
        this.showSection('collection');
        this.elements.collectionRequestsList.innerHTML = "";
        this.elements.collectionRequestsTitle.innerText = `Requests in "${collection.name}"`;
        collection.requests.forEach((req, reqIndex) => {
            const reqItem = document.createElement("li");
            reqItem.className = "history-item";
            reqItem.innerHTML = `
                <span class="history-text">${req.method.toUpperCase()}: ${req.url}</span>
                <div class="request-actions">
                    <button class="test-btn">Test</button>
                    <button class="update-btn">Update</button>
                    <button class="delete-btn">Delete</button>
                </div>
            `;
            
            reqItem.querySelector(".history-text").addEventListener('click', () => {
                this.app.loadRequestIntoForm(req);
                this.showSection('main');
                this.resetSaveButton();
            });

            reqItem.querySelector(".delete-btn").addEventListener('click', (e) => {
                e.stopPropagation();
                this.dataManager.deleteRequestFromCollection(collectionIndex, reqIndex);
                this.displayCollectionRequests(collection, collectionIndex);
            });

            reqItem.querySelector(".update-btn").addEventListener('click', (e) => {
                e.stopPropagation();
                this.app.loadRequestIntoForm(req);
                this.toggleSaveUpdateButton(collectionIndex, reqIndex);
                this.showSection('main');
            });

            reqItem.querySelector(".test-btn").addEventListener('click', (e) => {
                e.stopPropagation();
                this.app.displayTestScreen(req);
            });

            this.elements.collectionRequestsList.appendChild(reqItem);
        });
    }

    // New method to show/hide the main sections
    showSection(section) {
        this.elements.mainApiSection.style.display = 'none';
        this.elements.collectionRequestsDisplay.style.display = 'none';
        this.elements.testScreen.style.display = 'none';
        if (section === 'main') {
            this.elements.mainApiSection.style.display = 'block';
        } else if (section === 'collection') {
            this.elements.collectionRequestsDisplay.style.display = 'block';
        } else if (section === 'test') {
            this.elements.testScreen.style.display = 'block';
        }
    }

    toggleSaveUpdateButton(colIndex, reqIndex) {
        this.elements.saveBtn.dataset.updateIndex = `${colIndex},${reqIndex}`;
        this.elements.saveBtn.innerText = "Update";
        this.elements.saveBtn.style.backgroundColor = "#ffc107";
        this.elements.saveBtn.style.borderColor = "#ffc107";
    }

    resetSaveButton() {
        this.elements.saveBtn.dataset.updateIndex = "";
        this.elements.saveBtn.innerText = "Save";
        this.elements.saveBtn.style.backgroundColor = "#28a745";
        this.elements.saveBtn.style.borderColor = "#28a745";
    }
}

// The main application class that ties everything together.
class App {
    constructor() {
        this.dataManager = new DataManager();
        this.uiManager = new UIManager(this);
        this.init();
    }

    init() {
        const savedTheme = StorageManager.get("theme");
        if (savedTheme === "dark") {
            document.body.classList.add("dark-mode");
            this.uiManager.elements.darkModeToggle.checked = true;
        }

        this.uiManager.renderHistory();
        this.uiManager.renderCollections();
        this.uiManager.renderEnvList();
    }

    toggleDarkMode() {
        document.body.classList.toggle("dark-mode", this.uiManager.elements.darkModeToggle.checked);
        StorageManager.save("theme", this.uiManager.elements.darkModeToggle.checked ? "dark" : "light");
    }

    loadRequestIntoForm(item) {
        this.uiManager.elements.urlInput.value = item.url;
        this.uiManager.elements.methodSelect.value = item.method;
        this.uiManager.elements.headersInput.value = item.headersText;
        this.uiManager.elements.bodyInput.value = item.bodyText;
    }

    async sendRequest() {
        const { urlInput, methodSelect, headersInput, bodyInput, prettyResponse, rawResponse } = this.uiManager.elements;

        const url = this.dataManager.replaceEnvVariables(urlInput.value.trim());
        const method = methodSelect.value;
        const headersText = this.dataManager.replaceEnvVariables(headersInput.value);
        const bodyText = this.dataManager.replaceEnvVariables(bodyInput.value);

        prettyResponse.textContent = "Loading...";

        let headers = {};
        if (headersText) {
            try {
                headers = JSON.parse(headersText);
            } catch (e) {
                prettyResponse.textContent = `Invalid JSON in headers: ${e.message}`;
                return;
            }
        }

        let body = undefined;
        if (["POST", "PUT", "PATCH"].includes(method.toUpperCase())) {
            if (bodyText) {
                try {
                    body = JSON.stringify(JSON.parse(bodyText));
                } catch (e) {
                    prettyResponse.textContent = `Invalid JSON in body: ${e.message}`;
                    return;
                }
            }
        }

        try {
            const response = await fetch(url, { method, headers, body });
            const rawText = await response.text();
            const contentType = response.headers.get("content-type") || "";
            const setCookie = response.headers.get("set-cookie") || "";
            
            this.uiManager.elements.rawResponse.textContent = rawText;
            this.uiManager.elements.prettyResponse.textContent = this.formatResponse(rawText, this.uiManager.elements.prettyMode.value, contentType);
            this.uiManager.elements.headerResponse.textContent = Array.from(response.headers.entries()).map(([key, value]) => `${key}: ${value}`).join("\n");
            this.uiManager.elements.cookieResponse.textContent = setCookie || "No cookies found.";

            const newEntry = { method, url, headersText, bodyText };
            this.dataManager.addHistoryEntry(newEntry);
            this.uiManager.renderHistory();

        } catch (e) {
            prettyResponse.textContent = `Request failed: ${e.message}`;
        }
    }

    addRequestToCollection(collectionIndex) {
        const request = {
            method: this.uiManager.elements.methodSelect.value,
            url: this.uiManager.elements.urlInput.value.trim(),
            headersText: this.uiManager.elements.headersInput.value,
            bodyText: this.uiManager.elements.bodyInput.value,
            timestamp: new Date().toISOString(),
        };
        this.dataManager.addRequestToCollection(request, collectionIndex);
        this.uiManager.renderCollections();
    }

    updateRequestInCollection(colIndex, reqIndex) {
        const updatedRequest = {
            method: this.uiManager.elements.methodSelect.value,
            url: this.uiManager.elements.urlInput.value.trim(),
            headersText: this.uiManager.elements.headersInput.value,
            bodyText: this.uiManager.elements.bodyInput.value,
            timestamp: new Date().toISOString(),
        };
        this.dataManager.updateRequestInCollection(updatedRequest, colIndex, reqIndex);
        this.uiManager.resetSaveButton();
        this.uiManager.renderCollections();
        this.uiManager.displayCollectionRequests(this.dataManager.collections[colIndex], colIndex);
    }

    saveToNewCollection() {
        const name = this.uiManager.elements.newCollectionNameInput.value.trim();
        if (name) {
            this.dataManager.addCollection(name);
            this.addRequestToCollection(this.dataManager.collections.length - 1);
            this.uiManager.elements.newCollectionNameInput.value = "";
            this.uiManager.elements.saveDropdown.style.display = "none";
        }
    }

    addEnvVariable() {
        const key = this.uiManager.elements.envKeyInput.value.trim();
        const value = this.uiManager.elements.envValueInput.value.trim();
        if (key && value) {
            this.dataManager.addEnvVariable(key, value);
            this.uiManager.elements.envKeyInput.value = "";
            this.uiManager.elements.envValueInput.value = "";
            this.uiManager.renderEnvList();
        }
    }

    addCollection() {
        const name = this.uiManager.elements.collectionNameInput.value.trim();
        if (name) {
            this.dataManager.addCollection(name);
            this.uiManager.elements.collectionNameInput.value = "";
            this.uiManager.renderCollections();
        }
    }

    displayTestScreen(request) {
        this.uiManager.showSection('test');
        this.uiManager.elements.testMethod.innerHTML = `<option>${request.method}</option>`;
        this.uiManager.elements.testUrl.value = request.url;
        this.uiManager.elements.testHeaders.value = request.headersText;
        this.uiManager.elements.testBody.value = request.bodyText;
        this.uiManager.elements.testResponse.innerText = "";
        
        this.uiManager.elements.testSendBtn.onclick = async () => {
            this.uiManager.elements.testResponse.innerText = "Loading...";
            try {
                const res = await fetch(request.url, {
                    method: request.method,
                    headers: request.headersText ? JSON.parse(request.headersText) : {},
                    body: request.bodyText ? JSON.stringify(JSON.parse(request.bodyText)) : undefined,
                });
                const text = await res.text();
                const formatted = this.formatResponse(text, 'auto', res.headers.get("content-type"));
                this.uiManager.elements.testResponse.innerText = formatted;
            } catch (err) {
                this.uiManager.elements.testResponse.innerText = `Error: ${err.message}`;
            }
        };
    }

    formatResponse(raw, mode, contentType) {
        if (!raw) return "";
        let formatted = raw;
        const normalizedContentType = contentType.toLowerCase();

        try {
            if (mode === "json" || (mode === "auto" && normalizedContentType.includes("application/json"))) {
                formatted = JSON.stringify(JSON.parse(raw), null, 2);
            } else if (mode === "xml" || (mode === "auto" && normalizedContentType.includes("xml"))) {
                formatted = new XMLSerializer().serializeToString(new DOMParser().parseFromString(raw, "application/xml"));
            } else if (mode === "html" || (mode === "auto" && normalizedContentType.includes("text/html"))) {
                const doc = new DOMParser().parseFromString(raw, "text/html");
                formatted = new XMLSerializer().serializeToString(doc);
            }
        } catch (e) {
            return `Failed to format. Error: ${e.message}\n\nRaw response:\n${raw}`;
        }
        return formatted;
    }

    // New methods for import/export
    exportCollections() {
        this.dataManager.exportCollections();
    }

    async handleImportFile(file) {
        if (!file) return;
        try {
            await this.dataManager.importCollections(file);
            this.uiManager.renderCollections();
            alert("Collections imported successfully!");
        } catch (error) {
            alert(`Failed to import collections: ${error.message}`);
        }
    }
}

// Start the application after the DOM is fully loaded.
document.addEventListener("DOMContentLoaded", () => {
    new App();
});