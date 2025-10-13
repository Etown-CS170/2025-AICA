# 2025-AICA

AI Communication Assistant - Designed to help users write clearer, context-aware, and tone-appropriate emails quickly and efficiently.

For detailed **project features, design notes, and tech solutions**, please visit the [Project Wiki](https://github.com/Etown-CS170/2025-AICA/wiki/Project-Features-&-Tech-Solutions).

For access to future implementations and tasks, please visit the [Kanban Board](https://github.com/orgs/Etown-CS170/projects/2) or the [Issues](https://github.com/Etown-CS170/2025-AICA/issues).

## Tech Stack

### Backend
- **Runtime / Language:** Node.js, TypeScript  
- **Framework:** Express.js  
- **AI / NLP:** LangChain, @langchain/openai  
- **Utilities / Middleware:** cors, dotenv  
- **Development Tools:** nodemon, ts-node, Type Definitions  
- **Build / Compilation:** TypeScript Compiler (tsc)  

### Frontend
- **Framework / Language:** Angular 20, TypeScript  
- **Styling / UI:** Tailwind CSS, Lucide Angular icons  
- **Reactive Programming / State Management:** RxJS  
- **Browser / Platform Tools:** Zone.js  
- **Build / CLI Tools:** Angular CLI, PostCSS, Autoprefixer  
- **Testing:** Jasmine, Karma

## Setup Guide

### Prerequisites
- Node.js (v18+ recommended)  
- npm (v9+ recommended)  
- Angular CLI (for frontend, install globally if needed):  
``` bash
npm install -g @angular/cli 
```
- Access to an OPENAI API KEY

### Clone the Repository
``` bash
git clone <your-repo-url>
cd 2025-AICA
```

### Set up the Backend
* Navigate to the backend folder:
``` bash
cd backend 
```
* Install dependencies:
``` bash
npm install 
```
* Create a .env file for environment variables. Example:
``` bash 
OPENAI_API_KEY = your_openai_api_key
PORT = 5000 
```
#### Make sure you never push your API_KEY!!!

* Run the backend in development mode:
``` bash
npm run dev 
```

#### The backend server should now be running at http://localhost:5000.

### Set up the Frontend
Navigate to the frontend folder:
``` bash
cd frontend 
```
Open up another terminal tab while the backend one is still running
Install dependencies:
``` bash
npm install 
```
Run the Angular development server:
``` bash
npm start 
```

### Running the Project
* Make sure the backend server is running on http://localhost:5000.
* Make sure the frontend server is running on http://localhost:4200.
* Open your browser and visit http://localhost:4200 to access the app.
* Interact with the AI features, create email drafts, and test templates.