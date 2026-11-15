# aix-agora-AIwardrobe

## How to Run the Website Locally

Follow these steps to run the AGORA website on your computer.

### 1. Download the Project

Clone the repository using Git:

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Alternatively, download the repository as a ZIP file from GitHub and extract it.

### 2. Open the Project Folder

Open the downloaded or cloned AGORA project folder using IntelliJ IDEA or another code editor.

Make sure the project contains the following files and folders:

```text
AGORA/
├── AGORA.html
└── README.md
```

### 3. Start the Local Server

Open the Terminal inside your project folder.

Run the following command:

```bash
python -m http.server 8000
```

For Windows users, if the command above does not work, try:

```bash
py -m http.server 8000
```

Wait until the terminal displays a message indicating that the server is running.

### 4. Open the Website

Open your web browser (Google Chrome recommended) and enter:

```text
http://localhost:8000/AGORA.html
```

The AGORA website should now be accessible locally.

### 5. Stop the Local Server

When you finish using the website, return to the Terminal and press:

```text
Ctrl + C
```

This will stop the local server.

## Important Notes

- Python 3 must be installed on your computer.
- Keep the Terminal running while using the website.
- Make sure all project files and folders are downloaded, especially the `js` and `models` folders.
- An internet connection is required to load Three.js from the CDN specified in the HTML import map.
- Do not open `AGORA.html` directly by double-clicking it. Use the local server instead.