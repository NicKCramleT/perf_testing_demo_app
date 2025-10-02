export default function Home() {
  return (
    <div className="font-sans min-h-screen p-8 pb-20 sm:p-20">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Next.js + TypeScript + MongoDB Boilerplate</h1>
        
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Features</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Next.js 15 with App Router</li>
            <li>TypeScript for type safety</li>
            <li>MongoDB integration with connection pooling</li>
            <li>Tailwind CSS for styling</li>
            <li>ESLint for code quality</li>
            <li>API routes with MongoDB examples</li>
          </ul>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Copy <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">.env.example</code> to <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">.env</code></li>
            <li>Update the <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">MONGODB_URI</code> with your MongoDB connection string</li>
            <li>Run <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">npm run dev</code> to start the development server</li>
            <li>Visit <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">/api/users</code> to test the API</li>
          </ol>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">API Endpoints</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">GET /api/users</h3>
              <p className="text-gray-600 dark:text-gray-400">Fetch all users from the database</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">POST /api/users</h3>
              <p className="text-gray-600 dark:text-gray-400">Create a new user in the database</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
