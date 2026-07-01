# Terminal Skill Craft 🛠️⚡

An interactive, premium terminal-themed dashboard for constructing, editing, linting, and registering custom rulesets (skills) for agentic AI coders.

Designed with an immersive developer-centric retro cyberpunk/terminal aesthetic, **Terminal Skill Craft** streamlines the process of writing compliant, standardized `SKILL.md` documents. It features a real-time Markdown compiler, template generators, local draft persistence, and a live validation/linting engine checking for safety, metadata constraints, and proper rule hierarchies.

---

## 🚀 Key Features

*   **Cyberpunk Terminal UI**: Dark-themed, high-contrast, premium HUD layout built with fluid micro-interactions and glassmorphic panels.
*   **Starter Templates**: One-click generation for `default`, `offensive-recon`, and `critical-operation` templates.
*   **Real-time Validation Engine**: Custom compiler and linter validating slug requirements, description bounds, mandatory heading structures (`When to Use`, `Limitations`), and critical safety disclaimers.
*   **Automatic Draft Persistence**: LocalStorage synchronization ensuring zero data loss during session updates.
*   **Interactive Sandbox & Preview**: Side-by-side YAML/markdown editor and fully parsed structural live preview.
*   **Export Options**: One-click copy to clipboard or binary file download of the compiled `SKILL.md`.

---

## 🛠️ Tech Stack

*   **Core Logic**: React 19 (TypeScript)
*   **Styling**: Custom CSS Custom Properties (Variables), Carbon Dark System palette, responsive flex/grid HUD layout
*   **Build Pipeline**: Vite 8 & TypeScript
*   **Linter Integration**: Custom real-time AST/regex-based linter & Oxlint for TS validation

---

## 📋 Prerequisites

Before setting up locally, ensure you have:
*   **Node.js**: v18.0.0 or higher (v20+ recommended)
*   **npm** / **yarn** / **pnpm** installed

---

## 📦 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/chiranjeevi7777/terminal-skill-craft.git
cd terminal-skill-craft
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build and Compile for Production
To bundle the static client application:
```bash
npm run build
```
The output will be placed in the `dist/` directory.

### 5. Local Production Preview
```bash
npm run preview
```

---

## 📐 Architecture Overview

### Directory Structure
```
├── public/                 # Static assets & favicon
├── src/
│   ├── assets/             # SVGs, images, and fonts
│   ├── App.css             # Component-level overrides
│   ├── App.tsx             # Main dashboard UI, logic, & linter engines
│   ├── index.css           # Styling system, tokens, reset, & base animations
│   ├── main.tsx            # React application mounting
│   └── vite-env.d.ts       # TypeScript definitions
├── tsconfig.json           # TS configuration
├── vite.config.ts          # Vite pipeline (includes Pages base configurations)
└── package.json            # Script definitions and dependency trees
```

### Core Architecture Flow
```
[User Forms & Markdown Inputs] ────► [State Update: Frontmatter & Body]
                                             │
      ┌──────────────────────────────────────┴──────────────────────────────────────┐
      ▼                                      ▼                                      ▼
[LocalStorage Sync]                [Custom Lint Validator]                  [SKILL.md Compiler]
 - Stores under key:                - Validates name slugs                   - Merges YAML block
   `skill_draft_<slug>`             - Inspects heading anchors               - Outputs text node
                                    - Verifies safety banners                - Updates Live Preview
```

---

## 🔍 Validation Engine (Linter Rules)

The live linter validates the compiled file on every keypress:

| Rule ID | Severity | Target Element | Validation logic |
|---|---|---|---|
| `err-name-empty` | **Error** | Frontmatter Name | Name is required for registration. |
| `err-name-format` | **Error** | Frontmatter Name | Slug must only contain lowercase alphanumeric, `-`, and `_`. |
| `err-desc-empty` | **Error** | Frontmatter Description | Description must be provided. |
| `err-desc-max` | **Error** | Frontmatter Description | Must not exceed 200 characters. |
| `warn-desc-length` | **Warning** | Frontmatter Description | Exceeds recommend guidelines of 100 characters. |
| `warn-when-to-use` | **Warning** | Markdown Body | Missing the required `## When to Use` header. |
| `warn-limitations` | **Warning** | Markdown Body | Missing the required `## Limitations` header. |
| `err-offensive-disclaimer` | **Error** | Markdown Body | Offensive risk levels must contain the string `AUTHORIZED USE ONLY`. |

---

## 🚀 Deployment

The project is configured for automated/manual deployment to **GitHub Pages**.

To deploy manually to the `gh-pages` branch:
1. Build the project with the correct base path:
   ```bash
   npm run build
   ```
2. Initialize or push the `dist/` folder structure to the `gh-pages` branch of your remote repository:
   ```bash
   # From root directory:
   git push origin :gh-pages # Clear existing if needed
   git subtree push --prefix dist origin gh-pages
   ```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
