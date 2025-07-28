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

  // Response tab switching (Body, Cookies, Headers)
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

  // Body sub-tab switching (Pretty, Raw)
  document.querySelectorAll(".body-subtab").forEach(subtab => {
    subtab.addEventListener("click", () => {
      document.querySelectorAll(".body-subtab").forEach(t => t.classList.remove("active"));
      subtab.classList.add("active");

      const selected = subtab.dataset.subtab;
      if (selected === "pretty") {
        prettyResponse.style.display = "block";
        rawResponse.style.display = "none";
      } else {
        prettyResponse.style.display = "none";
        rawResponse.style.display = "block";
      }
    });
  });

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

      // Raw view
      rawResponse.innerText = raw;

      // Pretty view logic
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
    } catch (err) {
      prettyResponse.innerText = `Request failed: ${err.message}`;
      rawResponse.innerText = "";
      headerResponse.innerText = "";
      cookieResponse.innerText = "";
    }
  });
});
