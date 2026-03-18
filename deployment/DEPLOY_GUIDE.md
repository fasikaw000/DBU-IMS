# DBU-IMS Deployment Architecture

The Debreberhan University Internship Management System (DBU-IMS) is packed into a Monorepo composed of decoupled Frontend (`frontend/`) and Backend (`backend/`) deployments.

## Backend Deployment (Render / Heroku)
1. **Host:** Render Web Service (Node.js runtime)
2. **Root Directory:** `./backend`
3. **Build Command:** `./../deployment/render-build.sh` OR `npm install`
4. **Start Command:** `node server.js`
5. **Required Environment Variables:**
   - `NODE_ENV=production`
   - `PORT=5000`
   - `MONGO_URI` (Atlas Production Cluster String)
   - `JWT_SECRET`
   - `JWT_EXPIRE=30d`

## Frontend Deployment (Vercel / Netlify)
1. **Host:** Vercel (Framework Preset: Vite/React)
2. **Root Directory:** `./frontend`
3. **Vercel CLI Override:** Vercel natively interprets the standard package configurations. We have included `deployment/vercel.json` as a safeguard strictly explicitly redirecting React Router loops.
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. **Required Environment Variables:**
   - `VITE_API_URL` -> Base URL for the production Render backend mapping to Axios. Currently default sets internally to `http://localhost:5000/api`.

## Maintenance
* **Backups:** MongoDB Atlas Point-in-Time backups must be manually triggered on the Atlas console under `Data Services > Backup`.
* **Testing Local:** Simply `npm run dev` in frontend, and `node server.js` in backend.
