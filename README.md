<div align="center">
YojanaSetu India
Your guide to scholarships, admissions, applications, and document readiness
A full-stack web application designed to help users organize opportunities, understand eligibility, manage required documents, and track application readiness.
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-Frontend-646CFF?logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ESM-F7DF1E?logo=javascript&logoColor=black)
![Base44](https://img.shields.io/badge/Backend-Base44-4F46E5)
</div>
---
Overview
YojanaSetu India is a student-focused platform concept for bringing scholarship, admission, examination, and document-readiness workflows into one place. Instead of keeping requirements scattered across different pages and notes, users can explore opportunities, review eligibility information, organize documents, and monitor application progress.
The project includes a React-based interface and Base44 backend configuration, with application logic for eligibility evaluation, document dependencies, readiness scoring, and notifications.
> **Project status:** Source code is available in this repository. Availability of live services, external integrations, and production data depends on the linked Base44 app configuration and deployment.
Key Features
Opportunity discovery — browse and review available opportunities.
Eligibility evaluation — assess opportunities against configured eligibility rules.
Document management — organize required documents and their verification status.
Application tracking — track saved opportunities and application progress.
Document dependency analysis — identify prerequisite documents and dependency relationships.
Readiness scoring — calculate a readiness result using the configured scoring logic.
Notifications — display and synchronize application-related notifications.
User dashboard and profile — access a consolidated view of user information and progress.
Administrative tools — manage opportunities, documents, eligibility rules, scoring settings, dependencies, users, verification, and audit logs.
Feature behavior depends on the current implementation, configuration, and connected services.
Technology Stack
Area	Technologies
Frontend	React 18, JavaScript, Vite
Routing and UI	React Router, Tailwind CSS, Radix UI, Lucide React
Data and UI utilities	TanStack Query, React Hook Form, Zod
Charts and visualization	Recharts
Backend integration	Base44 SDK and Base44 backend functions
Backend language	TypeScript
Code quality	ESLint, TypeScript checks
This repository uses Base44 for backend integration. It does not represent a standalone Express/MongoDB server setup.
Application Modules
Module	Purpose
Dashboard	Central overview of user activity and readiness
Opportunities	Explore and inspect available opportunities
Eligibility	Review eligibility against configured rules
Documents	Organize and review document information
Applications	Track applications and saved opportunities
Readiness	View readiness calculations and related guidance
Notifications	Review application-related updates
Profile and authentication	Manage user profile and account access
Admin area	Maintain platform data, rules, verification, and audit records
Project Structure
```text
YojanaSetu-India/
├── base44/
│   ├── entities/              # Backend entity schemas
│   └── functions/             # Backend business logic
│       ├── analyzeDependencies/
│       ├── computeReadiness/
│       ├── evaluateEligibility/
│       ├── syncNotifications/
│       └── validateDependencyEdge/
├── src/
│   ├── components/            # Reusable interface components
│   ├── pages/                 # Application pages and admin pages
│   ├── lib/                   # Shared frontend utilities
│   └── ...
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── jsconfig.json
└── README.md
```
Getting Started
Prerequisites
Install the following before running the project:
Node.js with npm
Git
A GitHub account
Base44 access for the backend-linked development workflow
Deno if required by the Base44 local backend setup
1. Clone the repository
```bash
git clone https://github.com/chauhanshrikant456-cmyk/YojanaSetu-India.git
cd YojanaSetu-India
```
2. Install dependencies
```bash
npm install
```
3. Set up Base44
Install the Base44 CLI if it is not already installed:
```bash
npm install -g base44@latest
```
Then authenticate and link this local project to the intended Base44 app:
```bash
base44 login
base44 link
```
Follow the CLI prompts and use the correct Base44 app. Do not share credentials or secret configuration files.
4. Run the application locally
For the Base44-integrated local development workflow:
```bash
base44 dev
```
Open the local URL printed in the terminal. The default frontend URL is commonly `http://localhost:5173`, but use the actual URL shown by the command.
Note: This project is configured around Base44. Running `npm run dev` by itself may not provide the backend/API behavior expected by the application. Follow the Base44 setup instructions for this repository.
Useful Commands
Command	Description
`npm install`	Install project dependencies
`npm run dev`	Start the Vite frontend directly, where appropriate
`npm run build`	Build the frontend for production
`npm run preview`	Preview a production build locally
`npm run lint`	Run ESLint
`npm run typecheck`	Run the configured TypeScript checks
`base44 dev`	Run the Base44-integrated local development workflow
`base44 dev --remote`	Run locally against the linked hosted backend; writes may affect production data
Use `base44 dev --remote` carefully: operations can write to the linked app's hosted data.
Backend Functions
The `base44/functions/` directory contains server-side logic for these workflows:
`evaluateEligibility` — evaluates configured eligibility rules.
`analyzeDependencies` — analyzes document dependency relationships.
`computeReadiness` — computes an application/document readiness result.
`validateDependencyEdge` — validates a dependency relationship.
`syncNotifications` — synchronizes notification information.
The `base44/entities/` directory contains schemas for the application's data entities. Actual behavior depends on the linked Base44 application and its configuration.
Build and Quality Checks
Run these commands from the project root:
```bash
npm run lint
npm run typecheck
npm run build
```
If a command reports an error, review the terminal output and resolve the issue before deploying.
Security and Data Handling
Never commit secrets. Keep API keys, access tokens, passwords, and private credentials out of Git.
Do not commit `.env` files containing secret values.
If a secret has already been pushed to a public repository, revoke or rotate it; deleting the file in a later commit does not erase it from Git history.
Keep `.gitignore` rules in place for local configuration, dependency folders, logs, and build output.
Use test data during development and avoid publishing personal or sensitive user information.
Review Base44 permissions and connected integrations before making the application public.
Deployment
Pushing code to GitHub stores and versions the source code; it does not automatically make the application live.
To publish the Base44-connected application, open the corresponding Base44 dashboard, verify the app configuration, and use its publish/deployment workflow. If deploying the frontend through another hosting provider, configure the required backend integration and environment settings first.
No live demo URL is listed here because a verified public deployment URL has not been specified in this README.
Contributing
Contributions and improvements are welcome.
Fork the repository.
Create a feature branch.
Make a focused change.
Run the available lint, type-check, and build commands.
Open a pull request with a clear summary and testing notes.
Roadmap Ideas
Potential future improvements include:
Clearer source and last-verified dates for opportunities.
Better application progress summaries and reminders.
More accessible, mobile-friendly interfaces.
Additional validation and automated tests.
Improved setup documentation for contributors.
These are possible future enhancements, not claims that the features are already implemented.
Academic Project
YojanaSetu India is developed as a full-stack student project exploring opportunity discovery, eligibility rules, document dependencies, and application readiness workflows.
License
No license has been specified yet. Unless a license is added to this repository, reuse and redistribution permissions should not be assumed.
---
<div align="center">
YojanaSetu India · Helping make opportunity requirements easier to navigate.
</div>
