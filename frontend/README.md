# Courier Aggregator System - Frontend UI

A production-ready, fully interactive frontend UI for a Courier Aggregator platform (inspired by Shipway). Built with React 18, Vite, and Tailwind CSS.

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run developement server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

## 🛠️ Tech Stack

- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS (Custom Neon/Dark Theme)
- **Icons**: Lucide React
- **Charts**: Recharts (Animated & Interactive)
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod
- **Animations**: Framer Motion
- **API Handling**: Axios (with JWT interceptors)

## 📂 Project Structure

- `src/components`: Reusable UI elements, global layouts, and modular components.
- `src/pages`: Individual module screens (Dashboard, Orders, Track, NDR, etc.).
- `src/services`: API abstraction layer using Axios.
- `src/store`: Global state management with Zustand.
- `src/utils`: Helper functions and formatting utilities.
- `src/hooks`: Custom React hooks for business logic.

## 🔗 Backend Integration

All API calls are routed through `src/services/api.js`.
- Placeholder endpoints are commented with backend integration instructions.
- JWT Authentication is pre-configured in the Axios interceptor.
- Update `VITE_API_URL` in `.env` to point to your live Django backend.

## ✨ Features Implemented

- [x] Multi-module Dashboard with live charts.
- [x] Advanced Order Management with infinite filtering.
- [x] Real-time tracking interface with delivery timelines.
- [x] NDR (Non-Delivery Report) management workflow.
- [x] Wallet & Financial transaction tracking.
- [x] Logistics serviceability checker.
- [x] Full JWT Authentication simulation.
- [x] Fully responsive design (Mobile, Tablet, Desktop).

---
**Author**: Akshay Tomar | **Year**: 2026
