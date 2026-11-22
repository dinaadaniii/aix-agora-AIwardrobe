# aix-agora-AIwardrobe

# AGORA

**AGORA** is a wardrobe and daily outfit recommendation web application.
It helps users organise their clothing, receive outfit suggestions based
on the day's weather and schedule, and plan what to wear.

> **Current project scope:** This version does not include AI model
> generation or AI image-based virtual try-on. The Try-On page is a 2D
> mannequin preview that uses clothing photos uploaded by the user.

## 1. Main features

-   **Today** -- Shows the selected day's weather information and
    recommends outfits using the user's wardrobe, weather conditions,
    schedule, and selected occasion or style.
-   **Closet** -- Lets users upload, edit, organise, and remove clothing
    items. AGORA processes clothing photos to identify colours and
    prepare previews.
-   **Week** -- Supports weekly planning and importing calendar events
    from an `.ics` calendar file.
-   **Calendar** -- Displays the user's saved schedule by month and lets
    the user select a date to view that day's events.
-   **2D Try-On** -- Lets users select uploaded clothing items and
    preview a combination on a 2D mannequin.
-   **Wear history / feedback** -- Records looks marked as worn and
    allows users to give feedback, helping them review their outfit
    choices.

Weather information in this version is generated from an in-app Gyeonggi
climate-based dataset. It should be treated as an estimate for the
recommendation experience, not as a live weather forecast.

## 2. Technologies

  -----------------------------------------------------------------------
Technology                          Purpose
  ----------------------------------- -----------------------------------
HTML                                Application structure

CSS                                 Layout, styling, and responsive
design

JavaScript                          Navigation, outfit recommendation
logic, wardrobe handling, and
interactions

Supabase Auth                       User registration and login

Supabase Database                   User profiles, wardrobe records,
and user data

Supabase Storage                    Uploaded clothing photos and
processed image files

IndexedDB / browser storage         Local browser-side data storage

Supabase JavaScript client (CDN)    Connects the web page to Supabase
-----------------------------------------------------------------------

The current application is primarily a **single-page HTML application**.
The main application is contained in `AGORA.html`; it does not require a
separate Node.js frontend build.

## 3. Project files

The minimum file needed to open the application is:

``` text
AGORA/
└── AGORA.html
```

If your team repository includes additional SQL setup files,
screenshots, or documentation, keep them in the repository and follow
the instructions supplied with those files. The HTML file alone does not
create the Supabase database tables or Storage bucket.

You can use IntelliJ IDEA or another code editor to view and edit
`AGORA.html`.

## 4. How to run the project locally

Follow these steps to run the AGORA website on your computer.

### 1. Download the Project

Clone the repository using Git:

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Alternatively, download the repository as a ZIP file from GitHub and extract it.

### Step 2 -- Open the project folder

Open that folder in IntelliJ IDEA (or your preferred editor).

### Step 3 -- Start a local web server

Open the terminal in the folder containing `AGORA.html`.

**Windows:**

``` bash
py -m http.server 8000
```

If the `py` command is unavailable, try:

``` bash
python -m http.server 8000
```

**macOS / Linux:**

``` bash
python3 -m http.server 8000
```

Wait until the terminal displays a message indicating that the server is running.

### Step 4 -- Open AGORA in your browser

Open your web browser (Google Chrome recommended) and enter:

```text
http://localhost:8000/AGORA.html
```

The AGORA website should now be accessible locally.

Keep the terminal window running while you use the application. 

### 5. Stop the Local Server

When you finish using the website, return to the Terminal and press:

```text
Ctrl + C
```

This will stop the local server.

## Important Notes

- Python 3 must be installed on your computer.
- Keep the Terminal running while using the website.
- Do not rely on opening the HTML file by double-clicking it.
- Do not open `AGORA.html` directly by double-clicking it. Use the local server instead.