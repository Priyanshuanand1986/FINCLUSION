# FINCLUSION - Personal Finance Tracker

A modern personal finance tracker application built with React, TypeScript, and Supabase for comprehensive financial management.

🔗 **Live Application**: [https://manju-bharati-mahto.github.io/FINCLUSION/](https://the-finclusion.netlify.app/)

## Overview

FINCLUSION is a comprehensive personal finance tracker that helps you manage your income, expenses, and financial goals with an intuitive interface and powerful analytics.

This is a personal finance tracker application that helps you manage your income and expenses.

## Features

- Track income and expenses
- Create and manage budgets
- Categorize transactions
- View spending analysis
- Set reminders for bills

## Tech Stack

**Frontend:**

- React 18.2.0
- TypeScript
- Tailwind CSS
- Chart.js & Recharts
- React Router with HashRouter
- Framer Motion for animations
- React Toastify for notifications

**Backend & Database:**

- Supabase (PostgreSQL database)
- Supabase Authentication
- Row Level Security (RLS)
- Real-time subscriptions

## Getting Started

### Prerequisites

- Node.js (v16.x or higher)
- npm
- A Supabase account

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
    cd YOUR_REPOSITORY_NAME
    ```

2.  **Install frontend dependencies:**
    ```bash
    npm install
    ```

3.  **Install backend dependencies:**
    ```bash
    cd backend
    npm install
    cd ..
    ```

4.  **Set up Supabase:**
    - Create a new project on [Supabase](https://supabase.com/).
    - Go to your project's **Settings** > **API**.
    - Find your **Project URL** and `anon` **public** key.

5.  **Configure environment variables:**
    - Create a `.env` file in the root of the project.
    - Add your Supabase credentials to the `.env` file:
      ```
      REACT_APP_SUPABASE_URL=YOUR_SUPABASE_URL
      REACT_APP_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
      ```
    - Create a `.env` file in the `backend` directory.
    - Add the same Supabase credentials to the `backend/.env` file.

6.  **Set up the database:**
    - In your Supabase project, go to the **SQL Editor**.
    - Open the `backend/database/schema.sql` file in this project.
    - Copy the SQL code and run it in the Supabase SQL Editor to create the necessary tables.

### Running the Application

1.  **Start the backend server:**
    ```bash
    cd backend
    npm run dev
    ```
    The backend will be running on `http://localhost:5002`.

2.  **Start the frontend development server:**
    In a new terminal, from the root of the project:
    ```bash
    npm start
    ```
    The frontend will be running on `http://localhost:3000`.

Open your browser and navigate to `http://localhost:3000` to see the application.


## Features

- **User Authentication**: Register, login, and profile management
- **Dashboard**: Overview of financial status, recent transactions, and spending trends
- **Transactions**: Add, edit, and delete income and expense transactions
- **Categories**: Create and manage custom categories for transactions
- **Reporting**: Monthly summary of income and expenses
- **Data Visualization**: Charts and graphs for better understanding of spending patterns

## Tech Stack

### Frontend
- React
- TypeScript
- Tailwind CSS
- Chart.js
- Axios

### Backend
- Node.js
- Express
- TypeScript
- MongoDB with Mongoose
- JWT Authentication

## Project Structure

```
budget-tracker/
├── backend/            # Backend API server code
│   ├── src/            # Source code
│   ├── dist/           # Compiled output
│   └── README.md       # Backend documentation
├── src/                # Frontend React application
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── services/       # API and service functions
│   └── utils/          # Utility functions
├── public/             # Static files
└── README.md           # Main documentation
```

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/budget-tracker.git
cd budget-tracker
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
npm install
```

4. Configure environment variables:
   - In the backend directory, copy `.env.example` to `.env` and update values
   - In the root directory, create a `.env` file with `REACT_APP_API_URL=http://localhost:5000/api`

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. In a new terminal, seed the database (optional):
```bash
cd backend
npm run seed
```

3. Start the frontend development server:
```bash
# From the root directory
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

### Switching from Mock to Real Backend

By default, the application uses a mock backend with localStorage. To use the real MongoDB backend:

1. Ensure the backend server is running
2. Open `src/services/api.ts` and change `USE_MOCK_AUTH` to `false`

## API Documentation

See the [backend README](backend/README.md) for detailed API documentation.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## CI / Node versions and GitHub Secrets

This repository and its GitHub Actions workflow are configured to build with Node 16 to avoid compatibility issues with some toolchain dependencies.

- To set Node 16 locally:
  - On macOS/Linux with nvm: `nvm use 16` (or `nvm install 16` then `nvm use 16`).
  - On Windows with nvm-windows: `nvm install 16` then `nvm use 16`.
  - The repository includes a `.nvmrc` file with `16` to help tools pick the correct version.

- GitHub Actions expects two secrets for Supabase integration. In your repository, go to `Settings -> Secrets -> Actions` and add:
  - `SUPABASE_URL` — your Supabase project URL (e.g. `https://xyz.supabase.co`).
  - `SUPABASE_ANON_KEY` — the anon public key from Supabase.

After adding these secrets, the `Deploy to GitHub Pages` workflow will populate a `.env` file during the build and the app will have access to Supabase at runtime.
