# Graph Report - Delecius  (2026-10-10)

## Corpus Check
- 125 files · ~356,870 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1223 nodes · 1232 edges · 104 communities (91 shown, 10 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `794117c2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Delicious Restaurant
- server.js
- app.js
- package.json
- Code Quality Skill
- Package Dependencies
- Product Photography
- Firebase AI Logic on Web (JavaScript)
- Email System
- Database Config
- Dependency Audit Script
- Staff Dashboard
- Brand Assets
- sw.js
- App Hosting CLI Commands
- Deterministic Rules for Migration
- Cart Module
- Mutations
- Icons Module
- ui.js
- What You Must Do When Invoked
- Client-Side Text-to-Speech (TTS) Generation with Gemini
- graphify reference: extra exports and benchmark
- graphify reference: query, path, explain
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- AGENTS.md — Delicious Restaurant (Project2)
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- extraction-spec.md
- track.js
- Firebase AI Logic Basics
- validators.js
- Key Attributes
- Configuration Reference
- Security Reference
- Firebase Crashlytics - Android Setup Guide (Kotlin)
- Firebase Remote Config - Android Setup Guide (Kotlin)
- Native SQL Examples
- Schema Reference
- firebase-basics/SKILL.md
- 1. Vector Similarity Search (Semantic)
- Advanced Validation for Business Logic
- Firebase Authentication Web SDK
- Firebase Android Setup Guide
- Firestore Indexes Reference
- ⛔️ CRITICAL RULES & ENVIRONMENT CHECKS
- Step-by-Step Migration Execution
- Web SDK
- Firebase SQL Connect
- Writing Data
- Cloud Functions Integration Reference
- Templates
- Firebase Authentication - Android Setup Guide (Kotlin)
- Flutter & Firebase Setup Guide
- Realtime Reference
- Firebase SQL Connect - Android Setup Guide (Kotlin)
- Flutter SDK
- iOS SDK
- Cloud Firestore (Enterprise edition) - Android Setup Guide (Kotlin)
- ⛔️ CRITICAL RULE: NO INLINE INITIALIZATION ⛔️
- Cloud Firestore (Standard edition) - Android Setup Guide (Kotlin)
- Firestore Web SDK Usage Guide
- ⛔️ CRITICAL RULE: NO INLINE INITIALIZATION ⛔️
- main.swift
- ⛔️ CRITICAL RULE: INITIALIZATION ORDER ⛔️
- Admin Node SDK
- Firebase Functions V1 vs V2 Signature Mapping
- ⛔️ CRITICAL RULE: NO INLINE INITIALIZATION ⛔️
- Native SQL Operations
- Document Data Model
- Firestore Indexes Reference
- Web SDK Usage (Enterprise Native Mode)
- firebase-auth-basics/SKILL.md
- Firebase Auth & Google Sign-In for Flutter
- Basic Checks
- Alternative: Manual MCP Configuration (Project Scope)
- Manual Initialization
- Firebase Web Setup Guide
- Data Seeding & Bulk Operations Reference
- Cloud Firestore in Flutter
- Cloud Firestore in Flutter
- Manual Initialization
- 1. Instance Selection and Edition Detection
- Assessment: Security Validator (Red Team Edition)
- Workflow
- Firebase Local Environment Setup
- Recommended: Global Setup
- Recommended: Global Setup
- 1. Local Prototyping: Data Seeding
- Antigravity Setup
- Recommended Method: Using Plugins
- Cursor Setup
- package.json
- db.js
- Android Studio Setup
- start
- scripts
- authenticateToken
- Package.swift

## God Nodes (most connected - your core abstractions)
1. `Delicious Restaurant` - 21 edges
2. `SPA Entry Point (index.html)` - 18 edges
3. `Firebase Authentication Web SDK` - 15 edges
4. `What You Must Do When Invoked` - 12 edges
5. `/graphify` - 11 edges
6. `Anti-Koshary Skill` - 11 edges
7. `Flutter SDK` - 10 edges
8. `Web SDK` - 10 edges
9. `Firebase AI Logic Basics` - 9 edges
10. `Firebase AI Logic on Web (JavaScript)` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Anti-Koshary Skill` --applies_to--> `Delicious Restaurant`  [INFERRED]
  .agents/skills/anti-koshary/SKILL.md → README.md
- `Customizable Menu Items (Options/Ingredients/Sizes)` --realized_by--> `Customize Item Modal`  [INFERRED]
  README.md → client/index.html
- `Internationalization (EN/FR/AR with RTL)` --realized_by--> `Language Switcher (Globe Menu with Flags)`  [INFERRED]
  README.md → client/index.html
- `Live Kitchen Dashboard` --realized_by--> `Staff Dashboard Section`  [INFERRED]
  README.md → client/index.html
- `Delicious Restaurant` --describes--> `SPA Entry Point (index.html)`  [EXTRACTED]
  README.md → client/index.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Brand Identity Assets** — client_favicon_pizza_slice_svg, client_icons_icon_192_brand_logo, client_icons_icon_512_brand_logo [INFERRED 0.85]
- **Beverage Products** — client_imgs_coca_coca_cola_can, client_imgs_sprite_sprite_can [INFERRED 0.85]
- **Pizza Menu Products** — client_imgs_3fromages_four_cheese_pizza, client_imgs_4seasons_four_seasons_pizza, client_imgs_mega_all_cheese_pizza, client_imgs_frontpic_hero_pizza_image [INFERRED 0.85]

## Communities (104 total, 10 thin omitted)

### Community 0 - "Delicious Restaurant"
Cohesion: 0.05
Nodes (47): Admin My Account Panel, Admin Analytics Panel with CSV Export, Admin Dashboard Section with Sidebar Navigation, Admin Menu Management Panel, Admin Orders Panel, Admin Reviews Panel, Admin Staff Panel, Admin Delivery Zones Panel (+39 more)

### Community 1 - "server.js"
Cohesion: 0.05
Nodes (24): app, authLimiter, bcrypt, clientDir, cors, crypto, db, express (+16 more)

### Community 2 - "app.js"
Cohesion: 0.12
Nodes (15): API, AppState, CartBadge, CartPage, Checkout, Customizer, initHamburger(), isValidDZPhone() (+7 more)

### Community 3 - "package.json"
Cohesion: 0.12
Nodes (16): bcryptjs, cors, dotenv, express, express-rate-limit, multer, nodemon, author (+8 more)

### Community 4 - "Code Quality Skill"
Cohesion: 0.15
Nodes (16): Auth Checks, Injection Checks, Secrets Detection, Security Checks Reference, Coincidental vs Coupled Duplication, Extracting a Reusable Piece, Structural Decay Reference, Anti-Koshary Skill (+8 more)

### Community 5 - "Package Dependencies"
Cohesion: 0.22
Nodes (9): dependencies, bcryptjs, cors, dotenv, express, express-rate-limit, multer, mysql2 (+1 more)

### Community 6 - "Product Photography"
Cohesion: 0.39
Nodes (8): Four Cheese Pizza, Four Seasons Pizza, Coca-Cola Can, Family Pack Promotion, Hero Pizza Image, All Cheese Mega Pizza, Sprite Can, Grilled Chicken Wrap

### Community 7 - "Firebase AI Logic on Web (JavaScript)"
Cohesion: 0.05
Nodes (39): App Check Debug Provider, Chat Session, Flutter Setup for Firebase AI Logic, Initialization, Installation, Text Generation, Usage, 1. Import and Initialize (+31 more)

### Community 8 - "Email System"
Cohesion: 0.47
Nodes (5): nodemailer, getTransporter(), isMailConfigured(), nodemailer, sendPasswordResetEmail()

### Community 10 - "Dependency Audit Script"
Cohesion: 0.83
Nodes (3): section(), dep_audit.sh script, try()

### Community 11 - "Staff Dashboard"
Cohesion: 0.50
Nodes (3): KitchenAlerts, KitchenFlow, StaffDashboard

### Community 12 - "Brand Assets"
Cohesion: 1.00
Nodes (3): Pizza Slice SVG Favicon, Brand Logo Icon 192px, Brand Logo Icon 512px

### Community 14 - "App Hosting CLI Commands"
Cohesion: 0.06
Nodes (30): App Hosting CLI Commands, Automated deployment via GitHub (CI/CD), Backend Management, Initialization, `npx -y firebase-tools@latest apphosting:backends:create`, `npx -y firebase-tools@latest apphosting:backends:delete <backend-id>`, `npx -y firebase-tools@latest apphosting:backends:get <backend-id>`, `npx -y firebase-tools@latest apphosting:backends:list` (+22 more)

### Community 15 - "Deterministic Rules for Migration"
Cohesion: 0.07
Nodes (27): 1. Per-Function Configuration, 2. Global Configuration (`setGlobalOptions`), 3. Migrating Environment Configurations (`functions.config()`), Advanced Interpolation & Logic, Built-ins, Common Property Translations, Deterministic Rules for Migration, Initialization & Scope (+19 more)

### Community 17 - "Mutations"
Cohesion: 0.07
Nodes (26): Aliases, Basic Query, Contents, Create, Create with Server Values, Delete, Embedded Queries, Expression Operators (Compare with Server Values) (+18 more)

### Community 19 - "ui.js"
Cohesion: 0.12
Nodes (12): AdminDashboard, AdminGate, initAdminForms(), initLoginModal(), Auth, I18n, askConfirm(), closeConfirm() (+4 more)

### Community 20 - "What You Must Do When Invoked"
Cohesion: 0.07
Nodes (26): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+18 more)

### Community 21 - "Client-Side Text-to-Speech (TTS) Generation with Gemini"
Cohesion: 0.08
Nodes (25): 1. Response Modality, 1. Streaming Playback with `AVAudioEngine`, 1. Streaming Playback with Web Audio API, 2. Convert PCM Base64 to Playable WAV Blob for `<audio>` Elements, 2. Convert PCM to WAV for `MediaPlayer`, 2. Single-Speaker `SpeechConfig`, 2. WAV Converter for `AVAudioPlayer`, 3. Multi-Speaker `MultiSpeakerVoiceConfig` (2-Speaker Dialogues) (+17 more)

### Community 22 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 23 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 24 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 25 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 26 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 33 - "Firebase AI Logic Basics"
Cohesion: 0.08
Nodes (26): 1. Provision Firebase AI Logic (ALL platforms), 2. Add the SDK and initialize the service in the app, Advanced Features, App Check Debug Tokens for Local Development & CI/CD, Chat Session (Multi-turn), CI/CD Pipelines (Pre-Provisioned), Core Capabilities, Firebase AI Logic Basics (+18 more)

### Community 34 - "validators.js"
Cohesion: 0.67
Nodes (3): isValidDZPhone(), isValidEmail(), normalizeDZPhone()

### Community 35 - "Key Attributes"
Cohesion: 0.08
Nodes (23): `cleanUrls` (Optional), Full Example, `headers` (Optional), Hosting Configuration (`firebase.json`), `ignore` (Optional), Key Attributes, `public` (Required), `redirects` (Optional) (+15 more)

### Community 36 - "Configuration Reference"
Cohesion: 0.08
Nodes (24): Breaking Changes, CI/CD Integration, Cloud SQL Configuration, Configuration Reference, Connect from SDK, connector.yaml, Contents, dataconnect.yaml (+16 more)

### Community 37 - "Security Reference"
Cohesion: 0.08
Nodes (24): Access Levels, Anti-Patterns, @auth Directive, auth.token Fields, Authorization Data Lookup, Authorization Patterns, Available Bindings, CEL Expressions (+16 more)

### Community 38 - "Firebase Crashlytics - Android Setup Guide (Kotlin)"
Cohesion: 0.08
Nodes (21): 1. Add dependencies to Gradle build files, 2. *Optional:* Install the NDK SDK to capture native crashes, 3. *Required:* Force a test crash, Add custom debugging information, Firebase Crashlytics - Android Setup Guide (Kotlin), Module (app-level) `build.gradle.kts` (`<project>/<app-module>/build.gradle.kts`), Optional additional steps, Prerequisites (+13 more)

### Community 39 - "Firebase Remote Config - Android Setup Guide (Kotlin)"
Cohesion: 0.08
Nodes (21): 1. Add dependencies to Gradle build files, 2. Set in-app defaults, 3. Fetch and activate values, Firebase Remote Config - Android Setup Guide (Kotlin), Prerequisites, Add Swift Package Dependencies, Fetch and Activate Values, Firebase Remote Config iOS Setup Guide (+13 more)

### Community 40 - "Native SQL Examples"
Cohesion: 0.10
Nodes (20): Advanced aggregation with RANK, Advanced CTE with upserts (atomic get-or-create), Basic SELECT with field aliasing, Basic UPDATE, Blog with Permissions, E-Commerce Store, Examples, Movie Review App (+12 more)

### Community 41 - "Schema Reference"
Cohesion: 0.10
Nodes (20): @col, Contents, Core Directives, Customizing Tables, Data Types, @default, Defining Types, Enumerations (+12 more)

### Community 42 - "firebase-basics/SKILL.md"
Cohesion: 0.11
Nodes (11): Exploring Commands, Initialization, Refresh Android Studio Local Environment, Refresh Antigravity Local Environment, Refresh Claude Code Local Environment, Refresh Gemini CLI Local Environment, Refresh Other Local Environment, Common Issues (+3 more)

### Community 43 - "1. Vector Similarity Search (Semantic)"
Cohesion: 0.11
Nodes (17): 1. Query Formats (`queryFormat` argument), 1. Vector Similarity Search (Semantic), 2. Full-Text Search (Lexical), 2. Relevance Thresholding (`relevanceThreshold` and `_metadata.relevance`), A. Auto-Embedding Search, A. Generation on Insert, Automatic Embedding Generation (`_embed` server value), B. Custom Vector Search (+9 more)

### Community 44 - "Advanced Validation for Business Logic"
Cohesion: 0.12
Nodes (16): 1. Enforce Enum Values, 2. Validate State Transitions, 3. Strict Path and Relationship Scoping, 4. Secure Counter Updates, 5. **CRITICAL** Ensure Application Validity, Advanced Validation for Business Logic, Critical Constraints, Critical Directives for Secure Generation (+8 more)

### Community 45 - "Firebase Authentication Web SDK"
Cohesion: 0.13
Nodes (15): Connect to Emulator, Email Link Authentication, Firebase Authentication Web SDK, Initialization, Observe Auth State, Sign In Anonymously, Sign In with Apple (Popup), Sign In with Facebook (Popup) (+7 more)

### Community 46 - "Firebase Android Setup Guide"
Cohesion: 0.13
Nodes (14): 1. Check if the Android project is connected to a Firebase Project, 2. Create a new Firebase project or use an existing one, 3. Register the Android project, 4. Obtain and save `google-services.json`, 5. Add the `google-services` plugin, 6. App Check (Debug Token Persistence), Firebase Android Setup Guide, `google-services.json` file is NOT present (+6 more)

### Community 47 - "Firestore Indexes Reference"
Cohesion: 0.13
Nodes (15): 1. High Write Rates (Sequential Values), 2. Large String/Map/Array Fields, 3. TTL Fields, Automatic vs. Manual Management, Best Practices & Exemptions, CLI Commands, Composite Indexes, Config files (+7 more)

### Community 48 - "⛔️ CRITICAL RULES & ENVIRONMENT CHECKS"
Cohesion: 0.13
Nodes (14): 1. The Anti-Ruby Mandate, 2. Modern Xcode Folder Synchronization, 3. Allowed Scripting Languages, 4. Toolchain Verification, 5. Mandatory Linker Flags for Static Frameworks (Firebase), **CRITICAL: Always Use Latest SDK Version**, ⛔️ CRITICAL RULES & ENVIRONMENT CHECKS, Empty Directory Workflow (+6 more)

### Community 49 - "Step-by-Step Migration Execution"
Cohesion: 0.14
Nodes (13): 1. Declarative IAM & APIs (Zero-Local-Overhead), 2. Global Parameter Access Restriction, 3. V2 Concurrency & Cost Parity, Core Rules & Constraints, Extension to Functions Codebase & npm Package Migration, Overview, Step 1: Inventory Extension Resources, Step 2: Configure `package.json` (+5 more)

### Community 50 - "Web SDK"
Cohesion: 0.14
Nodes (14): Best Practices for Agents, Calling Operations, Client-Side Caching, Data Type Mapping Reference, Initialization, Installation, Resilient Enum Handling, Subscriptions (Realtime) (+6 more)

### Community 51 - "Firebase SQL Connect"
Cohesion: 0.14
Nodes (14): 1. Define Data Model (`schema/schema.gql`), 2. Define Authorized Operations (`connector/queries.gql`, `connector/mutations.gql`), 3. Use type-safe SDK in your apps, Deployment & CLI, Development Workflow, Examples, Feature Capability Map, Firebase SQL Connect (+6 more)

### Community 52 - "Writing Data"
Cohesion: 0.14
Nodes (13): Add a Document with Auto-ID, Get a Single Document, Get Multiple Documents, Order and Limit, Pipeline Queries, Python SDK Usage, Queries, Reading Data (+5 more)

### Community 53 - "Cloud Functions Integration Reference"
Cohesion: 0.15
Nodes (12): Accessing User Authentication Context, Auth Context Mappings, Auth Extraction Example, Cloud Functions Integration Reference, Comprehensive Example, Core Trigger Configuration, 🚨 Critical Infinite Loop Constraint, Event Filtering (+4 more)

### Community 54 - "Templates"
Cohesion: 0.15
Nodes (12): Basic CRUD Schema, Client Subscribe (Web), connector.yaml Template, dataconnect.yaml Template, Event-Driven Refresh, Firebase Init Commands, Many-to-Many Relationship, Realtime Query Templates (+4 more)

### Community 55 - "Firebase Authentication - Android Setup Guide (Kotlin)"
Cohesion: 0.17
Nodes (12): 1. Enable Authentication via CLI, 2. Add dependencies to Gradle build files, 3. Initialize FirebaseAuth, 4. Check current Auth state, 5. Use sign-in providers in the app, 6. Sign out users, Email/Password, Firebase Authentication - Android Setup Guide (Kotlin) (+4 more)

### Community 56 - "Flutter & Firebase Setup Guide"
Cohesion: 0.17
Nodes (11): 1. Re-running `flutterfire configure` Upon Renaming, 2. Platform-Specific Build Requirements, 3. Web CORS Best Practices, 4. Elaborating on `WidgetsFlutterBinding.ensureInitialized()`, Flutter & Firebase Setup Guide, Prerequisites, Step 1: Create a Flutter Project, Step 2: Configure Firebase (+3 more)

### Community 57 - "Realtime Reference"
Cohesion: 0.17
Nodes (12): CEL Bindings in Conditions, Combining Multiple @refresh Directives, Common Patterns, Contents, Explicit Mutation Signals (`onMutationExecuted`), Implicit Entity Refresh signals, `mutation` — The Triggering Event, Realtime Reference (+4 more)

### Community 58 - "Firebase SQL Connect - Android Setup Guide (Kotlin)"
Cohesion: 0.17
Nodes (12): 1. Add dependencies to Gradle build files, 2. Initialize, 3. Work with SQL Connect, Basic query, Best practices for agents working with Firebase SQL Connect, Calling operations, Client-side caching, Data type mapping reference (+4 more)

### Community 59 - "Flutter SDK"
Cohesion: 0.17
Nodes (12): Basic Query, Best Practices for Agents, Calling Operations, Client-Side Caching, Data Type Mapping Reference, Flutter SDK, Imports, Initialization (+4 more)

### Community 60 - "iOS SDK"
Cohesion: 0.17
Nodes (12): Basic Query, Best Practices for Agents, Calling Operations, Client-Side Caching, Data Type Mapping Reference, Dependencies (Package.swift or SPM), Initialization, iOS SDK (+4 more)

### Community 61 - "Cloud Firestore (Enterprise edition) - Android Setup Guide (Kotlin)"
Cohesion: 0.17
Nodes (11): 1. Provision Firestore, 2. Add dependencies to Gradle build files, 3. Initialize Firestore, 4. Decision framework: Mandatory pipeline architecture, 5. Pipeline examples, 6. Real-time listener & document operations, Cloud Firestore (Enterprise edition) - Android Setup Guide (Kotlin), Full-text search (+3 more)

### Community 62 - "⛔️ CRITICAL RULE: NO INLINE INITIALIZATION ⛔️"
Cohesion: 0.13
Nodes (14): 1. Import and Initialize, 2. Type-Safe Data Models (Codable), 3. Basic CRUD Operations, 4. Pipeline Queries, 5. Realtime Listeners in SwiftUI (Lifecycle Best Practices), ⛔️ CRITICAL RULE: NO FirebaseFirestoreSwift ⛔️, ⛔️ CRITICAL RULE: NO INLINE INITIALIZATION ⛔️, Examples (+6 more)

### Community 63 - "Cloud Firestore (Standard edition) - Android Setup Guide (Kotlin)"
Cohesion: 0.17
Nodes (11): 1. Provision Firestore, 2. Add dependencies to Gradle build files, 3. Initialize Firestore, 4. Work with data, Add data, Cloud Firestore (Standard edition) - Android Setup Guide (Kotlin), Delete data, Jetpack Compose (Modern) (+3 more)

### Community 64 - "Firestore Web SDK Usage Guide"
Cohesion: 0.12
Nodes (16): Add a Document with Auto-ID (`addDoc`), Firestore Web SDK Usage Guide, Get a Single Document (`getDoc`), Get Multiple Documents (`getDocs`), Handle Changes (Added/Modified/Removed), Initialization, Listen to a Document/Query (`onSnapshot`), Order and Limit (+8 more)

### Community 65 - "⛔️ CRITICAL RULE: NO INLINE INITIALIZATION ⛔️"
Cohesion: 0.18
Nodes (10): 1. Import and Initialize, 2. Type-Safe Data Models (Codable), 3. Writing Data (Modern Concurrency & Codable), 4. Reading Data (Modern Concurrency & Codable), 5. Realtime Listeners in SwiftUI (Lifecycle Best Practices), ⛔️ CRITICAL RULE: NO FirebaseFirestoreSwift ⛔️, ⛔️ CRITICAL RULE: NO INLINE INITIALIZATION ⛔️, Firebase Firestore iOS Setup Guide (+2 more)

### Community 66 - "main.swift"
Cohesion: 0.33
Nodes (10): addCrashlyticsRunScriptBuildPhase(), hasCrashlyticsRunScriptBuildPhase(), isUserScriptSandboxingEnabled(), main(), setDwarfWithDsymDebugInformationFormat(), Bool, Foundation, PathKit (+2 more)

### Community 67 - "⛔️ CRITICAL RULE: INITIALIZATION ORDER ⛔️"
Cohesion: 0.20
Nodes (9): 1. Create a Firebase Project and App (Automated), 2. Installation (Automated via Swift Package Manager CLI), 3. Initialization, 4. App Check (Debug Token Persistence), AppDelegate (Traditional / UIKit), ⛔️ CRITICAL RULE: INITIALIZATION ORDER ⛔️, ⛔️ CRITICAL RULE: STATE MANAGEMENT (OBSERVATION VS COMBINE) ⛔️, Firebase iOS Setup Guide (+1 more)

### Community 68 - "Admin Node SDK"
Cohesion: 0.20
Nodes (9): 1. Impersonating an Unauthenticated User, 2. Impersonating a Specific User (Cloud Functions), 3. Impersonating a Specific User (Plain HTTP), 4. Running with Unrestricted Access, Admin Node SDK, Best Practices for Agents, Configuration in `connector.yaml`, Generation (+1 more)

### Community 69 - "Firebase Functions V1 vs V2 Signature Mapping"
Cohesion: 0.22
Nodes (8): Auth (Blocking), Cloud Firestore, Cloud Pub/Sub, Cloud Storage, Cloud Tasks, Firebase Functions V1 vs V2 Signature Mapping, HTTP / Callables, Realtime Database

### Community 70 - "⛔️ CRITICAL RULE: NO INLINE INITIALIZATION ⛔️"
Cohesion: 0.22
Nodes (8): 1. Import and Initialize, 2. Authentication State, 3. Email and Password Authentication (Modern Concurrency), 4. Sign Out, ⛔️ CRITICAL RULE: NO INLINE INITIALIZATION ⛔️, Firebase Auth iOS Setup Guide, Sign In, Sign Up

### Community 71 - "Native SQL Operations"
Cohesion: 0.22
Nodes (8): Core Agent Constraints, Mutation Fields (DML), Native SQL Operations, Native SQL Root Fields, PostgreSQL Extensions, Query Fields (Read-Only), ⚠️ Security: Stored Procedures & Dynamic SQL, Syntax rules & limitations

### Community 72 - "Document Data Model"
Cohesion: 0.22
Nodes (8): Collection Group Support, Collections, Document Data Model, Documents, Examples, Firestore Data Model Reference, Subcollections, Use Cases

### Community 73 - "Firestore Indexes Reference"
Cohesion: 0.22
Nodes (9): CLI Commands, Config files, Firestore Indexes Reference, Index Density, Index Ordering, Index Structure, Management, Query Support Examples (+1 more)

### Community 74 - "Web SDK Usage (Enterprise Native Mode)"
Cohesion: 0.22
Nodes (8): 1. Initialization, 2. Decision Framework: Pipelines vs. Standard Queries, 3. Pipeline Examples, 4. Real-Time Listener & Document Operations, Full-Text Search, Relational Joins Pattern, Rules & Accountability, Web SDK Usage (Enterprise Native Mode)

### Community 75 - "firebase-auth-basics/SKILL.md"
Cohesion: 0.25
Nodes (5): Core Concepts, Identity Providers, Prerequisites, Tokens, Users

### Community 76 - "Firebase Auth & Google Sign-In for Flutter"
Cohesion: 0.25
Nodes (7): 1. `google_sign_in` 7.2.0 API Changes, 2. Initialization & Web Hang/Crash Pitfalls, 3. Web Logout Crashes, 4. Prototyping Workaround: Bypassing Firestore Composite Indices, 5. Robust `AuthService` Boilerplate, 6. Troubleshooting `auth/unauthorized-domain` on Flutter Web, Firebase Auth & Google Sign-In for Flutter

### Community 77 - "Basic Checks"
Cohesion: 0.25
Nodes (7): Authentication in Security Rules, Basic Checks, Check if user is signed in, Check if user owns the data, Check if user owns the document (field-based), Example: Email Verification Check, Token Properties

### Community 78 - "Alternative: Manual MCP Configuration (Project Scope)"
Cohesion: 0.25
Nodes (7): 1. Configure and Verify Firebase MCP Server, 1. Install and Verify Firebase Extension, 2. Restart and Verify Connection, 2. Restart and Verify Connection, Alternative: Manual MCP Configuration (Project Scope), Gemini CLI Setup, Recommended: Installing Extensions

### Community 80 - "Manual Initialization"
Cohesion: 0.25
Nodes (8): 1. Create a Firestore Enterprise Database, 2. Create `firebase.json`, 2. Create `firestore.rules`, 3. Create `firestore.indexes.json`, Deploy rules and indexes, Local Emulation, Manual Initialization, Provisioning Firestore Enterprise Native Mode

### Community 81 - "Firebase Web Setup Guide"
Cohesion: 0.29
Nodes (6): 1. Create a Firebase Project and App, 2. Installation, 3. Initialization, 4. Using Services, 5. App Check (Debug Token Persistence), Firebase Web Setup Guide

### Community 82 - "Data Seeding & Bulk Operations Reference"
Cohesion: 0.29
Nodes (6): 2. Production: Admin SDK Bulk Operations, 3. Production: Bulk Operations via raw SQL, 🚨 Critical SQL Operations Constraint, Data Seeding & Bulk Operations Reference, SDK Bulk APIs Features:, SDK Bulk Operations Example

### Community 83 - "Cloud Firestore in Flutter"
Cohesion: 0.29
Nodes (6): 1. Setup, 2. Best Practices: Type-Safe Models, 3. The Service Layer, 4. Listening to Streams in the UI (`StreamBuilder`), Cloud Firestore in Flutter, Initialization & References

### Community 84 - "Cloud Firestore in Flutter"
Cohesion: 0.29
Nodes (6): 1. Setup, 2. Best Practices: Type-Safe Models, 3. The Service Layer, 4. Listening to Streams in the UI (`StreamBuilder`), Cloud Firestore in Flutter, Initialization & References

### Community 85 - "Manual Initialization"
Cohesion: 0.29
Nodes (7): 1. Create `firebase.json`, 2. Create `firestore.rules`, 3. Create `firestore.indexes.json`, Deploy database, rules and indexes, Local Emulation, Manual Initialization, Provisioning Cloud Firestore

### Community 86 - "1. Instance Selection and Edition Detection"
Cohesion: 0.29
Nodes (7): 1. Instance Selection and Edition Detection, 2. Specialized Guides, A. Instance Found, B. No Instance Found (or New Requested), Cloud Firestore Database and Operations, Enterprise Edition / Native Mode (`references/enterprise/`), Standard Edition (`references/standard/`)

### Community 87 - "Assessment: Security Validator (Red Team Edition)"
Cohesion: 0.29
Nodes (6): Admin Bootstrapping & Privileges:, Assessment: Security Validator (Red Team Edition), Mandatory Audit Checklist:, Overview, Scoring Criteria, Scoring Criteria (1-5):

### Community 88 - "Workflow"
Cohesion: 0.33
Nodes (6): 1. Provisioning, 2. Client Setup & Usage, 3. Security Rules, Option 1. Enabling Authentication via CLI, Option 2. Enabling Authentication in Console, Workflow

### Community 89 - "Firebase Local Environment Setup"
Cohesion: 0.33
Nodes (5): 1. Verify Node.js, 2. Verify Firebase CLI, 3. Verify Firebase Authentication, 4. Install Agent Skills and MCP Server, Firebase Local Environment Setup

### Community 90 - "Recommended: Global Setup"
Cohesion: 0.33
Nodes (5): 1. Install and Verify Firebase Skills, 2. Configure and Verify Firebase MCP Server, 3. Restart and Verify Connection, GitHub Copilot Setup, Recommended: Global Setup

### Community 91 - "Recommended: Global Setup"
Cohesion: 0.33
Nodes (5): 1. Install and Verify Firebase Skills, 2. Configure and Verify Firebase MCP Server, 3. Restart and Verify Connection, Other Agents Setup, Recommended: Global Setup

### Community 92 - "1. Local Prototyping: Data Seeding"
Cohesion: 0.33
Nodes (6): 1. Local Prototyping: Data Seeding, Resetting Seed Data, ⚠️ Seeding Directives Rule, Seeding Independent Tables (FK Order), Seeding Related Tables (Nested Relational Inserts), The `seed_data.gql` Workflow

### Community 94 - "Antigravity Setup"
Cohesion: 0.40
Nodes (4): 1. Install and Verify Firebase Skills, 2. Configure and Verify Firebase MCP Server, 3. Restart and Verify Connection, Antigravity Setup

### Community 95 - "Recommended Method: Using Plugins"
Cohesion: 0.40
Nodes (4): 1. Install and Verify Plugins, 2. Restart and Verify Connection, Claude Code Setup, Recommended Method: Using Plugins

### Community 96 - "Cursor Setup"
Cohesion: 0.40
Nodes (4): 1. Install and Verify Firebase Skills, 2. Configure and Verify Firebase MCP Server, 3. Restart and Verify Connection, Cursor Setup

### Community 97 - "package.json"
Cohesion: 0.15
Nodes (12): description, engines, node, main, name, private, scripts, build (+4 more)

### Community 98 - "db.js"
Cohesion: 0.40
Nodes (4): mysql2, mysql, pool, promisePool

### Community 99 - "Android Studio Setup"
Cohesion: 0.50
Nodes (3): Android Studio Setup, MCP Setup, Skills Installation

### Community 100 - "start"
Cohesion: 0.50
Nodes (4): bootstrapAdmin(), migrateDB(), purgeDeliveredOrders(), start()

### Community 101 - "scripts"
Cohesion: 0.67
Nodes (3): scripts, dev, start

### Community 102 - "authenticateToken"
Cohesion: 0.67
Nodes (3): authenticateToken(), parseCookie(), requireAdmin()

## Knowledge Gaps
- **771 isolated node(s):** `PackageDescription`, `Foundation`, `PathKit`, `AppState`, `ScrollReveal` (+766 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 818 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Flutter SDK` connect `Flutter SDK` to `firebase-data-connect/SKILL.md`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `PackageDescription`, `Foundation`, `PathKit` to the rest of the system?**
  _771 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Delicious Restaurant` be split into smaller, more focused modules?**
  _Cohesion score 0.045328399629972246 - nodes in this community are weakly interconnected._
- **Should `server.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.12280701754385964 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `Firebase AI Logic on Web (JavaScript)` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._