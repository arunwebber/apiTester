document.addEventListener("DOMContentLoaded", () => {
  const sendBtn = document.getElementById("send");
  const methodSelect = document.getElementById("method");
  const urlInput = document.getElementById("url");
  const headersInput = document.getElementById("headers");
  const bodyInput = document.getElementById("body");

  const prettyResponse = document.getElementById("pretty-response");
  const rawResponse = document.getElementById("raw-response");
  const headerResponse = document.getElementById("header-response");
  const cookieResponse = document.getElementById("cookie-response");
  const prettyMode = document.getElementById("pretty-mode");
  const historyList = document.getElementById("history-list");

  // 🔹 Load and manage live history array
  let history = JSON.parse(localStorage.getItem("apiHistory")) || [];

  function createHistoryItem({ method, url, headersText, bodyText }, index) {
    const li = document.createElement("li");
    li.classList.add("history-item"); // optional for styling

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

  // Initial render
  renderHistory();

  // 🔹 Sidebar tab switching
  document.querySelectorAll(".sidebar-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".sidebar-tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".sidebar-content").forEach(c => c.style.display = "none");

      tab.classList.add("active");
      const tabId = tab.dataset.tab;
      document.getElementById(`sidebar-${tabId}`).style.display = "block";
    });
  });

  // 🔹 Response tab switching
  document.querySelectorAll(".resp-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".resp-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      document.querySelectorAll(".response-content").forEach(section => {
        section.style.display = "none";
      });

      const targetId = `tab-${tab.dataset.tab}`;
      const target = document.getElementById(targetId);
      if (target) {
        target.style.display = "block";
      }
    });
  });

  // 🔹 Body sub-tab switching
  document.querySelectorAll(".body-subtab").forEach(subtab => {
    subtab.addEventListener("click", () => {
      document.querySelectorAll(".body-subtab").forEach(t => t.classList.remove("active"));
      subtab.classList.add("active");

      const selected = subtab.dataset.subtab;
      prettyResponse.style.display = selected === "pretty" ? "block" : "none";
      rawResponse.style.display = selected === "raw" ? "block" : "none";
    });
  });

  // 🔹 Send request and handle response
  sendBtn.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    const method = methodSelect.value;
    const headersText = headersInput.value;
    const bodyText = bodyInput.value;

    let headers = {};
    if (headersText.trim() !== "") {
      try {
        headers = JSON.parse(headersText);
      } catch (err) {
        alert("Invalid JSON in headers.");
        return;
      }
    }

    let body = null;
    if (["POST", "PUT", "PATCH"].includes(method.toUpperCase())) {
      if (bodyText.trim() !== "") {
        try {
          body = JSON.parse(bodyText);
        } catch (err) {
          alert("Invalid JSON in body.");
          return;
        }
      }
    }

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const raw = await res.text();
      const contentType = res.headers.get("content-type") || "";

      // Raw response view
      rawResponse.innerText = raw;

      // Pretty view handling
      let formatted = raw;
      const mode = prettyMode.value;

      if ((mode === "json") || (mode === "auto" && contentType.includes("application/json"))) {
        try {
          formatted = JSON.stringify(JSON.parse(raw), null, 2);
        } catch (e) {
          formatted = raw;
        }
      } else if ((mode === "xml") || (mode === "auto" && contentType.includes("xml"))) {
        try {
          const doc = new DOMParser().parseFromString(raw, "application/xml");
          formatted = new XMLSerializer().serializeToString(doc);
        } catch (e) {
          formatted = raw;
        }
      } else if ((mode === "html") || (mode === "auto" && contentType.includes("text/html"))) {
        formatted = raw;
      } else if (mode === "text" || mode === "auto") {
        formatted = raw;
      }

      prettyResponse.innerText = formatted;

      // Headers tab
      let headerStr = "";
      res.headers.forEach((value, key) => {
        headerStr += `${key}: ${value}\n`;
      });
      headerResponse.innerText = headerStr || "No headers.";

      // Cookies tab
      const setCookie = res.headers.get("set-cookie");
      cookieResponse.innerText = setCookie ? setCookie : "No Set-Cookie header.";

      // ✅ Add to history
      const newEntry = { method, url, headersText, bodyText };
      history.unshift(newEntry);
      localStorage.setItem("apiHistory", JSON.stringify(history));
      renderHistory();

    } catch (err) {
      prettyResponse.innerText = `Request failed: ${err.message}`;
      rawResponse.innerText = "";
      headerResponse.innerText = "";
      cookieResponse.innerText = "";
    }
  });
});
