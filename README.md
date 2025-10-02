# Next.js + TypeScript + MongoDB Boilerplate

A modern full-stack application boilerplate built with Next.js, TypeScript, and MongoDB.

## Features

- ⚡ **Next.js 15** - React framework with App Router
- 📘 **TypeScript** - Type-safe development
- 🗄️ **MongoDB** - NoSQL database with connection pooling
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 🔍 **ESLint** - Code quality and consistency
- 📦 **API Routes** - RESTful API examples with MongoDB integration

## Prerequisites

- Node.js 18.x or higher
- MongoDB instance (local or cloud-based like MongoDB Atlas)

## Getting Started

1. **Clone the repository** (if not already done)

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Copy the example environment file and update it with your MongoDB connection string:

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your MongoDB connection string:

   ```env
   MONGODB_URI=mongodb://localhost:27017/perf_testing_demo_app
   ```

   For MongoDB Atlas, use a connection string like:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   ```

4. **Run the development server:**

   ```bash
   npm run dev
   ```

5. **Open your browser:**

   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
.
├── app/                    # Next.js App Router directory
│   ├── api/               # API routes
│   │   └── users/         # Users API endpoints
│   │       └── route.ts   # GET and POST handlers
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── lib/                   # Utility libraries
│   └── mongodb.ts         # MongoDB connection handler
├── public/                # Static assets
├── .env.example           # Example environment variables
├── package.json           # Project dependencies
└── tsconfig.json          # TypeScript configuration
```

## API Endpoints

### GET /api/users

Fetch all users from the database (limited to 10 results).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/users

Create a new user in the database.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

## MongoDB Connection

The MongoDB connection is handled in `lib/mongodb.ts` with the following features:

- **Connection Pooling**: Reuses connections for better performance
- **Development Mode**: Preserves connections across hot reloads
- **Production Mode**: Optimized connection handling
- **Type Safety**: Full TypeScript support

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) - TypeScript handbook
- [MongoDB Node.js Driver](https://mongodb.github.io/node-mongodb-native/) - MongoDB driver docs
- [Tailwind CSS](https://tailwindcss.com/docs) - Tailwind CSS documentation

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new):

1. Push your code to a Git repository
2. Import your repository to Vercel
3. Add your `MONGODB_URI` environment variable in Vercel project settings
4. Deploy!

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## License

MIT

