# Real Estate CRM - Development Plan

## 📊 **Data Model Analysis**

### **Properties Model**
```python
PropertyListing:
- id, street_address, town, parish (FK to Parish)
- listing_type: FOR_SALE, FOR_RENT
- status: LISTED, OFFER_ACCEPTED, CONTRACT_SIGNED, CLOSED, LEASED
- listing_price, rental_price (decimals)
- agent (FK to User), seller_client (FK to Client)
- created_at, updated_at
- Related: PropertyPicture (images)
```

### **Clients Model**
```python
Client:
- id, client_name, email, phone_number
- area_of_interest_parish (FK to Parish)
- area_of_interest_towns (text field)
- budget_tier (FK to BudgetTier)
- mode_of_purchase: MORTGAGE, CASH
- pre_qual_completed (boolean)
- last_contacted, created_at, updated_at
```

### **Viewings Model**
```python
Viewing:
- id, property_listing (FK), client (FK), agent (FK)
- viewing_datetime
- status: SCHEDULED, COMPLETED, CANCELED
- notes (text)
- created_at
```

### **Settings Model**
```python
Parish: name
BudgetTier: display_name, order
SystemSettings: company_commission_percentage, agent_commission_split, etc.
```

---

## 🎯 **Implementation Plan**

### **Phase 1: Complete Missing Pages**

#### **1. Dashboard/Clients Page** ✅ PRIORITY
- **Layout**: Tabular with search/filter bar
- **Features**:
  - Client list table with columns: Name, Email, Phone, Parish, Budget, Last Contacted, Status
  - Search by: name, email, phone
  - Filter by: parish, budget tier, pre-qualification status, mode of purchase
  - Sort by: name, last contacted, created date
  - CRUD operations: Add/Edit/Delete clients
  - Export functionality

#### **2. Dashboard/Viewings Page** ✅ PRIORITY
- **Layout**: List/Calendar hybrid view
- **Features**:
  - Viewing list with property address, client, agent, date/time, status
  - Calendar view for scheduling
  - Search by: property address, client name, agent
  - Filter by: status, date range, agent
  - Quick status updates (Scheduled → Completed/Canceled)
  - Notes management

#### **3. Dashboard/Settings Page** ✅ PRIORITY
- **Layout**: Form-based settings panels
- **Features**:
  - System settings: commission rates, contact overdue days
  - Parish management: Add/Edit/Delete parishes
  - Budget tier management: Add/Edit/Delete budget tiers
  - User management (admin only)

### **Phase 2: Advanced Search System**

#### **1. Property Search Enhancement** ✅ HIGH
- **Natural Language Search**: "Search in St. Andrew, Kingston for property in range of $200K-500K"
- **Parser Components**:
  - Location parser: Parish + Town extraction
  - Budget parser: Price range extraction  
  - Property type parser: FOR_SALE/FOR_RENT
- **Backend**: Custom search view with Django Q objects
- **Frontend**: Smart search bar with auto-suggestions

#### **2. Client Search Enhancement** ✅ HIGH
- **Multi-field Search**: name OR email OR phone
- **Advanced Filters**: 
  - Parish, budget tier, qualification status
  - Date ranges for last contacted
  - Mode of purchase
- **Quick Filters**: Recently contacted, High budget, Pre-qualified

#### **3. Viewing Search** ✅ MEDIUM
- **Search Capabilities**:
  - By property address, client name, agent name
  - Date range filtering
  - Status filtering
- **Quick Views**: Today's viewings, This week, Overdue

### **Phase 3: Enhanced UI Components**

#### **1. Reusable Search Components**
- `PropertySearchBar` - For property-related pages
- `ClientSearchBar` - For client-related pages  
- `ViewingSearchBar` - For viewing-related pages
- `UniversalSearchBar` - Global search across all entities

#### **2. Enhanced Data Tables**
- Sortable columns
- Pagination
- Export functionality
- Bulk actions
- Responsive design

---

## 🚀 **Technical Implementation**

### **Backend Search API Design**

#### **Property Search Endpoint**
```python
GET /api/properties/search/?q="Search in St. Andrew, Kingston for property in range of $200K-500K"
GET /api/properties/search/?parish=1&town=Kingston&min_price=200000&max_price=500000
```

#### **Client Search Endpoint** 
```python
GET /api/clients/search/?q="john smith"
GET /api/clients/search/?name=john&email=smith&parish=1
```

#### **Universal Search Endpoint**
```python
GET /api/search/?q="kingston"&types=properties,clients,viewings
```

### **Frontend Search Components**

#### **Property Search Bar**
```typescript
interface PropertySearchProps {
  onSearch: (params: PropertySearchParams) => void;
  placeholder?: string;
  showAdvanced?: boolean;
}

interface PropertySearchParams {
  query?: string;
  parish?: number;
  town?: string;
  minPrice?: number;
  maxPrice?: number;
  listingType?: 'FOR_SALE' | 'FOR_RENT';
}
```

#### **Client Search Bar**
```typescript
interface ClientSearchProps {
  onSearch: (params: ClientSearchParams) => void;
  showFilters?: boolean;
}

interface ClientSearchParams {
  query?: string;
  parish?: number;
  budgetTier?: number;
  preQualified?: boolean;
  modeOfPurchase?: 'MORTGAGE' | 'CASH';
}
```

---

## 📁 **File Structure Plan**

### **Frontend Components**
```
src/components/
├── search/
│   ├── PropertySearchBar.tsx
│   ├── ClientSearchBar.tsx
│   ├── ViewingSearchBar.tsx
│   └── UniversalSearchBar.tsx
├── tables/
│   ├── ClientTable.tsx
│   ├── ViewingTable.tsx
│   └── DataTable.tsx (generic)
├── forms/
│   ├── ClientForm.tsx
│   ├── ViewingForm.tsx
│   └── SettingsForm.tsx
└── ui/
    ├── FilterPanel.tsx
    ├── SearchResults.tsx
    └── ExportButton.tsx
```

### **Frontend Pages**
```
src/app/dashboard/
├── clients/
│   ├── page.tsx (main client list)
│   ├── new/page.tsx (add client)
│   └── [id]/
│       ├── page.tsx (client details)
│       └── edit/page.tsx (edit client)
├── viewings/
│   ├── page.tsx (main viewing list)
│   ├── calendar/page.tsx (calendar view)
│   └── new/page.tsx (schedule viewing)
└── settings/
    ├── page.tsx (main settings)
    ├── parishes/page.tsx (parish management)
    └── budget-tiers/page.tsx (budget management)
```

### **Backend Search Views**
```python
# New search views to create
properties/views.py:
- PropertySearchView
- PropertyAdvancedSearchView

clients/views.py:  
- ClientSearchView
- ClientAdvancedSearchView

viewings/views.py:
- ViewingSearchView

core/views.py:
- UniversalSearchView (searches across all models)
```

---

## 🔄 **Implementation Order**

### **Sprint 1: Core Pages** (This session)
1. ✅ Create clients list page with basic table
2. ✅ Create viewings list page with basic table  
3. ✅ Create settings page with basic forms
4. ✅ Add navigation and routing

### **Sprint 2: Search Enhancement** (Next session)
1. ✅ Implement property search parser
2. ✅ Create reusable search components
3. ✅ Add client search functionality
4. ✅ Add viewing search functionality

### **Sprint 3: Advanced Features** (Future)
1. ✅ CRUD operations for all entities
2. ✅ Calendar view for viewings
3. ✅ Export functionality
4. ✅ Bulk operations

---

## 🎨 **UI/UX Design Patterns**

### **Search Bar Designs**
- **Property**: Natural language input with location and budget suggestions
- **Client**: Multi-field search with dropdown filters
- **Viewing**: Date-focused search with agent filter

### **Table Designs**
- **Clients**: Dense table with contact info, last activity, status indicators
- **Viewings**: Timeline-style with property thumbnails and client info
- **Properties**: Grid view (existing) + table view option

### **Color Coding**
- **Status Colors**: Green (Active/Completed), Yellow (Pending), Red (Canceled)
- **Priority**: High-value clients, overdue contacts, hot properties
- **Categories**: Different colors for sale vs rent, different property types

---

## ⚡ **Quick Start Commands**

### **Start Development**
```bash
# Backend
cd d:\IronCRM\real_estate_platform
python manage.py runserver

# Frontend  
cd d:\IronCRM\real_estate_platform\frontend
npm run dev
```

### **Test API Endpoints**
```bash
# Test existing endpoints
curl http://localhost:8000/api/clients/
curl http://localhost:8000/api/viewings/
curl http://localhost:8000/api/properties/listings/
```

---

**Status**: 📋 DEVELOPMENT PLAN READY
**Next**: Start with Phase 1 - Complete missing pages
**Priority**: Clients page → Viewings page → Settings page → Search enhancement
