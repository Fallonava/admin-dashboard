I am building a Next.js (App Router) full-stack application to automate my hospital registration daily recaps. I need you to create a complete end-to-end feature including a robust MongoDB connection, API routes, and two frontend components.

Tech Stack: Next.js App Router, Tailwind CSS, Mongoose (MongoDB), `xlsx`, `recharts`, `lucide-react`.

Here is the complete requirement:


### PHASE 1: Robust MongoDB Connection Setup
1. Create a MongoDB connection utility in `lib/mongodb.ts` (or `.js`). 
   - Use `mongoose`.
   - Read the connection string from `process.env.MONGODB_URI`.
   - Implement a global caching mechanism (`global.mongoose`) to prevent connection leaks during Next.js Hot Module Replacement (HMR) in development mode.
   - Add proper `console.log` for successful connection and error catching.
2. Create a Mongoose schema in `models/DailyRecap.ts`. 
   - MUST check if `mongoose.models.DailyRecap` exists before defining it (`mongoose.models.DailyRecap || mongoose.model(...)`) to avoid OverwriteModelError.
   - Fields:
     - `date`: Date (required, unique, index)
     - `total_patients`: Number
     - `missing_sep_count`: Number
     - `staff_performance`: Array of Objects (schema: `{ name: String, total: Number }`)
     - `missing_sep_details`: Array of Objects (schema: `{ no_rm: String, nama: String, asuransi: String }`)

### PHASE 2: Backend API Route (MongoDB Integration)
1. Create an API route at `app/api/recaps/route.ts`.
2. `GET` method: Import `lib/mongodb.ts`, connect to the DB, fetch all `DailyRecap` documents sorted by `date` ascending, and return as JSON.
3. `POST` method: Import `lib/mongodb.ts`, connect to the DB, receive the JSON payload. Use `DailyRecap.findOneAndUpdate({ date: payload.date }, payload, { upsert: true, new: true })` so we update the existing recap for that day or create a new one.

### PHASE 3: Excel Uploader Component (`components/DailyRecapUploader.tsx`)
1. Create a client component with a Drag-and-Drop zone for a `.xlsx` file using the `xlsx` library.
2. The exact column headers in the uploaded Excel are (case-sensitive, with spaces):
   - Patient Name: "Nama Rekam Medis"
   - Medical Record No: "No. Rekam Medis"
   - SEP Number: "No SEP"
   - Insurance/Payment: "Asuransi"
   - Registered By (Staff): "Nama Petugas"
3. Data Logic:
   - Parse the sheet to JSON.
   - `missingSEPList`: Filter array where "Asuransi" contains "BPJS" (case-insensitive) AND "No SEP" is undefined, null, "", or "-".
   - `staffPerformance`: Reduce array to count total patients registered per "Nama Petugas". Sort descending.
   - Calculate `totalPatients` and `missing_sep_count`.
4. UI logic: Display a preview dashboard with:
   - Total Patients & Total Missing SEP (highlight in red/orange if > 0).
   - A clean borderless table of `missingSEPList`.
   - A list/bar showing `staffPerformance`.
5. Add a "Simpan ke Database" button that triggers a POST request to `/api/recaps` with the processed data. Show loading states and a success toast.

### PHASE 4: History Dashboard Component (`components/HistoryDashboard.tsx`)
1. Create a client component that fetches data from `GET /api/recaps`.
2. Use `recharts` to render:
   - A Line Chart showing `total_patients` over time.
   - A Bar Chart showing `missing_sep_count` over time.
3. Render an aggregated total staff leaderboard summing up performance from all fetched records.

### PHASE 5: UI/UX Aesthetic Rules (STRICT)
Apply a modern, minimalist "Apple Style 2026" design language:
- Use soft, earthy/cowo bumi color palettes for accents: subtle beige, light mocca, ivory, and muted grays (e.g., `bg-stone-50`, `text-stone-800`, `border-stone-200`).
- Avoid harsh borders. Use subtle glassmorphism, soft drop shadows (`shadow-sm`, `shadow-md`), and generous padding.
- Use soft rounded corners (`rounded-2xl` or `rounded-3xl`).
- Use Lucide React icons.
