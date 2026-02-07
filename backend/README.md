# FollowUps CRM Backend API

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example` and add your database connection string:
```
DATABASE_URL=postgresql://username:password@localhost/mydb
PORT=3000
```

3. Start the server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Customers

- **GET /api/customers** - Get all customers
- **GET /api/customers/:id** - Get a specific customer by ID
- **POST /api/customers** - Create a new customer
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "preferredName": "Johnny",
    "birthday": "1990-01-15",
    "phoneNumber": "555-1234",
    "address": "123 Main St"
  }
  ```

### Vehicles

- **GET /api/vehicles** - Get all purchased vehicles (with customer info)
- **GET /api/customers/:id/vehicles** - Get all vehicles for a specific customer
- **POST /api/vehicles** - Create a new purchased vehicle
  ```json
  {
    "customerId": 1,
    "make": "Toyota",
    "model": "Camry",
    "year": 2023
  }
  ```

### Health Check

- **GET /health** - Check if the server is running
