# DocuHub

DocuHub is a full-stack web application for uploading, categorizing, viewing, downloading, and managing PDF documents, with JWT-protected admin actions and an optional merch section.

## Features

- Public pages: Home, Documents, Individual Document Viewer, About, Contact, Merch
- Admin interface with JWT login
- Document CRUD and Category CRUD APIs
- PDF upload via `multer`
- Production-safe PDF storage via Cloudinary (with local fallback for dev)
- In-browser PDF rendering with PDF.js
- Optional PDF-to-HTML conversion (text extraction via `pdf-parse`)
- Search, category filter, and pagination for document listings
- Responsive UI with hamburger nav
- Seed script for admin user, categories, and sample document metadata

## Tech Stack

- Frontend: HTML5, CSS3 (Grid/Flexbox), Vanilla JavaScript
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Auth: JWT + bcrypt password hashing
- PDF handling: PDF.js + pdf-parse
- File storage: Cloudinary (recommended in production)

## Project Structure

```text
docuhub/
  public/
    css/styles.css
    js/
      api.js
      main.js
      home.js
      documents.js
      document.js
      admin.js
    index.html
    documents.html
    document.html
    admin.html
    merch.html
    about.html
    contact.html
  src/
    app.js
    config/db.js
    controllers/
      authController.js
      categoryController.js
      documentController.js
    middleware/
      auth.js
      errorHandler.js
      upload.js
    models/
      User.js
      Category.js
      Document.js
    routes/
      authRoutes.js
      categoryRoutes.js
      documentRoutes.js
    utils/pdfConverter.js
    seed.js
  uploads/.gitkeep
  server.js
  package.json
  .env.example
  render.yaml
  vercel.json
```

Page naming:
- `documents.html` = category/list/search page
- `document.html` = single document viewer page

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Update `.env` values:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/docuhub
JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=2h
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

4. Seed initial data:

```bash
npm run seed
```

5. Start app:

```bash
npm run dev
```

Open: `http://localhost:5000`

## API Overview

Base URL: `/api`

### Health

- `GET /api/health`
- `GET /api/health/storage`

### Auth

- `POST /api/auth/login`
  - Body:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

### Categories

- `GET /api/categories`
- `GET /api/categories/summary`
- `POST /api/categories` (admin JWT)
- `PUT /api/categories/:id` (admin JWT)
- `DELETE /api/categories/:id` (admin JWT)

### Documents

- `GET /api/documents?page=1&limit=8&search=policy&category=<categoryId>`
- `GET /api/documents/:id`
- `POST /api/documents` (admin JWT, multipart/form-data)
- `PUT /api/documents/:id` (admin JWT, multipart/form-data)
- `DELETE /api/documents/:id` (admin JWT)

`POST /api/documents` form-data fields:

- `title` (required)
- `description` (optional)
- `categoryId` (required)
- `pdf` (optional if `externalUrl` provided)
- `externalUrl` (optional if `pdf` provided)
- `convertToHtml` (`true`/`false`)

## Example API Requests

Login:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Create category:

```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"name":"Invoices","description":"Invoice documents"}'
```

Upload a PDF:

```bash
curl -X POST http://localhost:5000/api/documents \
  -H "Authorization: Bearer <TOKEN>" \
  -F "title=Q1 Report" \
  -F "description=Quarterly report" \
  -F "categoryId=<CATEGORY_ID>" \
  -F "convertToHtml=true" \
  -F "pdf=@./sample.pdf"
```

## Security Notes

- Admin-only actions are protected with JWT middleware.
- Passwords are hashed using bcrypt.
- Uploads are restricted to PDF mime type and max 15 MB.
- Sensitive configuration is read from environment variables.
- In production, set Cloudinary env vars to avoid ephemeral disk storage.

## Deployment Notes

- `render.yaml` included for Render deployment.
- `vercel.json` included for simple Vercel Node deployment.
- Ensure `MONGO_URI`, `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are set in deployment environment variables.

### Cloudinary Setup

1. Create a Cloudinary account and open your dashboard.
2. Copy:
   - `Cloud name`
   - `API Key`
   - `API Secret`
3. Add these to `.env` locally and hosting environment variables in production.

When Cloudinary vars are configured:
- Uploaded PDFs are pushed to Cloudinary (`docuhub/pdfs` folder).
- Document metadata stores `externalUrl` (Cloudinary URL) and `cloudinaryPublicId`.
- Local temporary upload files are deleted after upload.
