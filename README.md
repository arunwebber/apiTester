Here's the GitHub README formatted for clarity and proper markdown.

-----

\<p align="center"\>
\<img src="[https://raw.githubusercontent.com/arunwebber/tabman/refs/heads/main/images/icon\_128.png](https://raw.githubusercontent.com/arunwebber/tabman/refs/heads/main/images/icon_128.png)" alt="Tabman Icon" width="128" height="128"\>
\</p\>

# Tabman - API Tester in a Tab

**Tabman** is a lightweight and simple API testing tool that runs directly in your browser tab. Think of it like a mini-Postman inside Chrome—no installations, no heavy UI, just open a tab and start sending requests.

-----

## Features

  - **Send API Requests**: Supports GET, POST, PUT, DELETE, and other HTTP methods.
  - **Custom Headers**: Add and edit request headers easily.
  - **Request Body Support**: Send JSON, text, or raw data with your requests.
  - **Response Viewer**: See responses formatted with syntax highlighting.
  - **Tab-Based Access**: Opens in its own tab, just like a normal web page.
  - **Lightweight & Fast**: No server-side components required, runs entirely in the browser.

-----

## Demo

Load the extension in Chrome and click the **Tabman** icon to open the tester in a new tab.

-----

## Installation

1.  Clone this repository:
    ```bash
    git clone https://github.com/arunwebber/tabman.git
    cd tabman
    ```
2.  **Load as an Unpacked Extension:**
      - Open Chrome and go to `chrome://extensions/`
      - Enable **Developer mode** (top right corner).
      - Click **"Load unpacked"** and select the project folder.

-----

## Usage

1.  Click the **Tabman** icon in Chrome.
2.  A new tab opens with the API tester interface.
3.  Enter the request URL, method, headers, and body.
4.  Click **Send** to see the response instantly.

-----

## Key Features

### Request Builder

  - Choose from common HTTP methods (GET, POST, PUT, DELETE, PATCH).
  - Add query parameters directly in the URL field.
  - Include custom headers and JSON request bodies.

### Response Viewer

  - Displays response status, headers, and formatted body.
  - Supports syntax highlighting for JSON responses.
  - Copy responses to clipboard for reuse.

### Local Storage Persistence (optional)

  - Future versions can support saving your recent requests for quick reuse.

-----

## Project Structure

  - `manifest.json`: Chrome extension configuration.
  - `background.js`: Handles the extension action and opens the API tester in a new tab.
  - `tab.html`: The main UI for the API tester.
  - `style.css`: Styles for the API tester interface.
  - `tab.js`: Adds functionality for sending requests and displaying responses.

-----

## Contributing

Pull requests are welcome\! Contributions for new features like authentication support, saved collections, or a better UI are especially appreciated.

-----

## License

This project is open-source and available under the **MIT License**.