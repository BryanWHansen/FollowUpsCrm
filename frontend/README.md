# Follow-Ups CRM - Frontend

React frontend for the Follow-Ups CRM application.

## Tech Stack

- React 18
- Vite
- React Router v6
- Material-UI
- Axios
- React Hook Form
- date-fns

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── api/           # API client and endpoints
├── components/    # Reusable components
├── contexts/      # React contexts (Auth, etc.)
├── pages/         # Page components
├── hooks/         # Custom hooks
├── utils/         # Utility functions
├── App.jsx        # Main app component
└── main.jsx       # Entry point
```

## Environment Variables

Create a `.env` file in the frontend root:

```
VITE_API_URL=http://localhost:3000
```
