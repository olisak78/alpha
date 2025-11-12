# Teams Page Architecture: Container Pattern Implementation

## Overview

This document explains the Container Pattern architecture implemented for the Teams page, which follows the Smart/Presentation Component Pattern for clean separation of concerns.

## Architecture Pattern

The Teams page uses the **Smart/Presentation Component Pattern** (Container Pattern) with the following structure:

### Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     TeamsPage.tsx                          │
│                  (Page-Level Smart Component)              │
│  • URL routing & navigation                                │
│  • High-level error handling                              │
│  • Page-specific state orchestration                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   TeamContainer.tsx                        │
│                 (Data Container Component)                 │
│  • API data fetching (React Query)                        │
│  • Data transformation (API → UI models)                  │
│  • Loading/error state management                         │
│  • Data preparation for presentation layer                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      Team.tsx                              │
│                (Presentation Component)                    │
│  • UI rendering & layout                                  │
│  • User interaction handling                              │
│  • Component composition                                  │
│  • Visual state management                                │
└─────────────────────────────────────────────────────────────┘
```

### Supporting Layer

```
┌─────────────────────────────────────────────────────────────┐
│                   hooks/useTeamsPage.ts                    │
│                   (Custom Logic Hook)                      │
│  • Page-specific business logic                           │
│  • Navigation state management                            │
│  • URL parsing and routing                                │
│  • Reusable stateful logic                               │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### 🏗️ Smart Components (Container Components)

#### `TeamsPage.tsx` - Page-level coordinator
- Route handling and URL management
- High-level error handling and loading states
- Orchestrates overall page flow
- Uses `useTeamsPage` hook for page-specific logic

#### `TeamContainer.tsx` - Data layer bridge
- API data fetching using React Query
- Data transformation (API models → UI models)
- Loading and error state management for team-specific data
- State coordination between parent and child components

#### `useTeamsPage.ts` - Logic encapsulation
- Page-specific business logic
- Navigation state management
- URL parsing and routing logic
- Reusable event handlers

### 🎨 Presentation Components

#### `Team.tsx` - UI presentation
- Rendering UI elements and layout
- Managing team-specific hooks for business logic
- Coordinating sub-components
- Handling user interactions through callbacks

## Data Flow

1. **URL Change** → `useTeamsPage` hook updates state
2. **State Change** → `TeamsPage` passes new props to `TeamContainer`
3. **Props Change** → `TeamContainer` fetches data and transforms it
4. **Data Ready** → `TeamContainer` passes processed data to `Team`
5. **User Interaction** → `Team` calls callbacks that flow back up

## Error Handling Strategy

- **Page Level**: Network errors, route errors
- **Container Level**: Data fetching errors, transformation errors
- **Component Level**: User input validation, UI errors

## Loading States Management

- **Page Level**: Initial team list loading
- **Container Level**: Team member data loading
- **Component Level**: Action-specific loading (buttons, forms)
