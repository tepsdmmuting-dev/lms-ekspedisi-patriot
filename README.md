# Ekspedisi Patriot LMS

## Local PostgreSQL Database Setup

1. Make sure you have PostgreSQL installed and running locally.
2. Create a new database for this project:
   ```bash
   createdb ekspedisi_patriot
   ```
3. Run the schema file to set up the tables and insert mock data:
   ```bash
   psql -d ekspedisi_patriot -f schema.sql
   ```

## Environment Variables (.env)

Create a `.env` file inside the `backend` directory with the following variables:

```env
# Server config
PORT=5000

# PostgreSQL config
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ekspedisi_patriot

# JWT Secret for authentication
JWT_SECRET=supersecretjwtkey_change_me_in_production
```

## Running the app

1. Navigate to `backend` and run `npm install` then `npm run dev`.
2. Navigate to `frontend` and run `npm install` then `npm run dev`.
