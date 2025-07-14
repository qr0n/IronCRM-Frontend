# Real Estate CRM Frontend

A modern, responsive React/Next.js frontend for the Real Estate CRM platform that connects to your Django REST API backend.

## 🎨 Design Features

Based on your wireframe sketches, this frontend includes:

- **Modern Login Interface** - Clean authentication with error handling
- **Dashboard Layout** - Sidebar navigation with statistics cards
- **Property Listings** - Grid layout with filtering and property cards
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **JWT Authentication** - Secure token-based authentication with auto-refresh

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Set Up Environment**
   Create a `.env.local` file:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js 13+ App Router
│   │   ├── dashboard/          # Protected dashboard pages
│   │   │   ├── layout.tsx      # Dashboard layout with sidebar
│   │   │   ├── page.tsx        # Main dashboard
│   │   │   └── properties/     # Property management
│   │   ├── login/              # Authentication pages
│   │   ├── globals.css         # Global styles with Tailwind
│   │   └── layout.tsx          # Root layout
│   ├── components/             # Reusable components
│   │   └── layout/             # Layout components
│   │       ├── Sidebar.tsx     # Navigation sidebar
│   │       └── Header.tsx      # Top header
│   ├── contexts/               # React contexts
│   │   └── AuthContext.tsx     # Authentication state
│   └── lib/                    # Utilities
│       └── api.ts              # Axios API client
├── package.json
├── tailwind.config.js          # Tailwind CSS configuration
└── next.config.js             # Next.js configuration
```

## 🔧 Backend Integration

### Django API Setup

1. **Enable CORS** (add to Django settings):
   ```python
   INSTALLED_APPS = [
       # ... existing apps
       'corsheaders',
   ]

   MIDDLEWARE = [
       # ... existing middleware
       'corsheaders.middleware.CorsMiddleware',
   ]

   CORS_ALLOWED_ORIGINS = [
       "http://localhost:3000",
       "http://127.0.0.1:3000",
   ]
   ```

2. **Update Django URLs** (uncomment in your main urls.py):
   ```python
   urlpatterns = [
       # ... existing patterns
       path('api/properties/', include('properties.urls')),
       path('api/clients/', include('clients.urls')),
       path('api/viewings/', include('viewings.urls')),
       path('api/users/', include('users.urls')),
   ]
   ```

3. **Create Missing API Endpoints** (if needed):
   - `GET /api/auth/user/` - Get current user info
   - `GET /api/properties/listings/` - List properties
   - `GET /api/clients/` - List clients
   - `GET /api/viewings/` - List viewings

## 🎯 Features Implemented

### ✅ Authentication
- [x] JWT login/logout
- [x] Token refresh handling
- [x] Protected routes
- [x] User context

### ✅ Dashboard
- [x] Statistics cards
- [x] Quick actions
- [x] Recent activity
- [x] Upcoming viewings

### ✅ Properties
- [x] Property listing grid
- [x] Property cards with images
- [x] Filtering (All, For Sale, For Rent, Active)
- [x] Property details view
- [x] Status indicators

### ✅ Layout & Navigation
- [x] Responsive sidebar
- [x] Top header with user info
- [x] Mobile-friendly design
- [x] Modern UI with Tailwind CSS

## 🎨 UI Components

The frontend uses a consistent design system with:

- **Colors**: Blue primary theme matching your backend
- **Typography**: Clean, readable fonts
- **Cards**: Consistent styling for property and info cards
- **Buttons**: Primary and secondary button styles
- **Forms**: Styled input fields with validation
- **Icons**: Heroicons for consistent iconography

## 🔗 API Communication

The frontend communicates with your Django backend through:

- **Axios Client**: Configured in `src/lib/api.ts`
- **JWT Tokens**: Automatic token attachment to requests
- **Error Handling**: Token refresh and logout on auth failures
- **Type Safety**: TypeScript interfaces for API responses

## 🚀 Next Steps

To complete the integration:

1. **Install Dependencies**: Run `npm install` in the frontend directory
2. **Start Backend**: Make sure your Django server is running on port 8000
3. **Start Frontend**: Run `npm run dev` to start the Next.js development server
4. **Test Login**: Use your Django admin credentials to log in
5. **Add Missing Endpoints**: Create any missing API endpoints in Django

## 📱 Responsive Design

The interface is fully responsive and works on:
- **Desktop**: Full sidebar navigation and multi-column layouts
- **Tablet**: Collapsible sidebar with grid layouts
- **Mobile**: Mobile-optimized navigation and single-column layouts

## 🔒 Security

- JWT tokens stored in localStorage
- Automatic token refresh
- Protected route handling
- CORS configuration for secure API communication

---

**Ready to run!** Just install the dependencies and start the development server to see your real estate CRM frontend in action!
