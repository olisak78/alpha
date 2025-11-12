# SelfServicePage Component

## Overview

The `SelfServicePage` is a React component that provides a self-service interface for triggering automated tools and processes. It displays a grid of service blocks that users can interact with to execute Jenkins jobs and other automated operations.

## Location
`src/pages/SelfServicePage.tsx`

## Purpose

This page serves as a centralized dashboard for self-service operations, allowing users to:
- View available automated tools and processes
- Trigger Jenkins jobs with custom parameters
- Interact with both static and dynamic job configurations
- Submit forms with validation and error handling

## Key Features

### 1. **Dynamic Dialog Management**
- Manages active dialog state for self-service blocks
- Handles opening/closing of dialog modals
- Tracks form data across dialog interactions

### 2. **Jenkins Job Integration**
- Supports both static and dynamic Jenkins job configurations
- Fetches job parameters from Jenkins API
- Triggers Jenkins jobs with filtered parameters
- Handles success/error notifications

### 3. **Flexible Data Loading**
- Loads static configuration from JSON files
- Fetches dynamic job parameters from Jenkins
- Supports hybrid configurations with both static and dynamic steps
- Populates dynamic steps when needed

### 4. **Form Management**
- Extracts default values from job parameters
- Updates form data reactively
- Filters boolean parameters (excludes false values)
- Maintains form state across dialog sessions

## Component Structure

### State Management

```typescript
const [activeBlock, setActiveBlock] = useState<SelfServiceDialog | null>(null);
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState<Record<string, any>>({});
const [staticJobData, setStaticJobData] = useState<any>(null);
```

### Hooks and Dependencies

- **`useFetchJenkinsJobParameters`**: Fetches Jenkins job parameters for dynamic jobs
- **`useTriggerJenkinsJob`**: Mutation hook for triggering Jenkins jobs
- **`SelfServiceBlockDialog`**: Dialog component for each service block

## Key Functions

### `loadStaticData(path: string)`
Loads static configuration from JSON files in the public directory.

```typescript
const loadStaticData = async (path: string) => {
  try {
    const publicPath = path.startsWith('/') ? path.substring(1) : path;
    const response = await fetch(`/${publicPath}`);
    if (!response.ok) throw new Error('Failed to fetch');
    return await response.json();
  } catch (error) {
    toast({ title: "Error", description: "Failed to load configuration", variant: "destructive" });
    return null;
  }
};
```

### `getDefaults(params: any[])`
Extracts default values from job parameters, filtering out hidden parameters.

```typescript
const getDefaults = (params: any[]) => {
  const defaults: Record<string, any> = {};
  params.filter(p => p.type !== "WHideParameterDefinition").forEach(p => {
    const key = p.name || p.id;
    const value = p.defaultParameterValue?.value || p.defaultValue?.value;
    defaults[key] = value || '';
  });
  return defaults;
};
```

### `submitForm()`
Dynamically executes submit handlers based on the `onSubmit` property in the JSON configuration.

```typescript
const submitForm = () => {
  // Get the onSubmit function name from the static configuration
  const onSubmitFunction = staticJobData?.onSubmit
  
  // Call the appropriate handler
  const handler = submitHandlers[onSubmitFunction as keyof typeof submitHandlers];
  if (handler) {
    handler();
  } else {
    console.error(`Unknown onSubmit function: ${onSubmitFunction}`);
  }
};
```

**Function Registry Pattern:**
The component uses a registry pattern to map string function names from JSON to actual functions:

```typescript
const submitHandlers = {
  trigger: () => {
    trigger();
  }
  // Add more handlers here as needed
};
```

This allows JSON configurations to specify which function should execute on form submission by setting the `onSubmit` property to a registered function name (e.g., `"onSubmit": "trigger"`).

### `trigger()`
Executes Jenkins job with filtered parameters (excludes false boolean values).

```typescript
const trigger = () => {
  if (!activeBlock?.jenkinsJob) return;

  const filteredParams: Record<string, any> = {};
  Object.entries(formData).forEach(([key, value]) => {
    if (typeof value !== 'boolean' || value === true) {
      filteredParams[key] = value;
    }
  });

  triggerMutation.mutate({
    jaasName: activeBlock.jenkinsJob.jaasName,
    jobName: activeBlock.jenkinsJob.jobName,
    parameters: filteredParams
  });
};
```

## Configuration Types

### Static Configuration
- Loaded from JSON files in `/public/data/self-service/`
- Contains predefined steps and parameters
- Can include dynamic step placeholders

### Dynamic Configuration
- Fetched from Jenkins API in real-time
- Parameters determined by Jenkins job definition
- Enabled when `dialogType === 'dynamic'`

### Hybrid Configuration
- Combines static steps with dynamic parameter fetching
- Uses `isDynamic` flag in step configuration
- Calls `fetchAndPopulateDynamicSteps` for dynamic portions

## ⚠️ Important: Form Submission Configuration

**The `onSubmit` property in JSON configurations is critical** - it specifies which function from the `submitHandlers` registry should execute when the form is submitted. This allows different service blocks to have different submission behaviors (e.g., `"onSubmit": "trigger"` for Jenkins jobs).

## Data Loading Flow

The component implements a complex data loading strategy that handles three different configuration types. Here's the detailed flow:

### 1. **Trigger Conditions**
Data loading is triggered by the `useEffect` hook when:
- `activeBlock` changes (user selects a different service block)
- `isOpen` changes to `true` (dialog opens)
- `jenkinsQuery.data` changes (Jenkins API response updates)

### 2. **Configuration Type Detection**
The component determines the loading strategy based on the active block's properties:

```typescript
// Static configuration with file path
if (activeBlock.dataFilePath) {
  // Load from JSON file
}
// Pure dynamic configuration
else if (jenkinsQuery.data?.steps) {
  // Use Jenkins API data directly
}
```

### 3. **Static Configuration Loading**

**Step 3a: File Fetch**
```typescript
const jobData = await loadStaticData(activeBlock.dataFilePath);
```
- Fetches JSON configuration from `/public/data/self-service/` directory
- Handles fetch errors with toast notifications
- Returns parsed JSON or null on failure

**Step 3b: Dynamic Step Detection**
```typescript
const hasDynamicSteps = jobData.steps.some((step: any) => step.isDynamic);
```
- Scans loaded steps for `isDynamic` flag
- Identifies hybrid configurations requiring Jenkins API calls

**Step 3c: Hybrid Processing (if needed)**
```typescript
if (hasDynamicSteps && activeBlock.jenkinsJob) {
  const populatedResponse = await fetchAndPopulateDynamicSteps(
    activeBlock.jenkinsJob.jaasName,
    activeBlock.jenkinsJob.jobName,
    jobData.steps
  );
  jobData = { ...jobData, steps: populatedResponse.steps };
}
```
- Calls external service to populate dynamic steps
- Merges dynamic data with static configuration
- Updates `staticJobData` state with combined result

### 4. **Dynamic Configuration Loading**

For pure dynamic jobs (no `dataFilePath`):
```typescript
if (jenkinsQuery.data?.steps) {
  jenkinsQuery.data.steps.forEach((step: any) => {
    if (step.fields) allParams.push(...step.fields);
  });
}
```
- Uses data from `useFetchJenkinsJobParameters` hook
- Extracts fields from all steps
- No file system interaction required

#### Jenkins Hook Data Structure

The `useFetchJenkinsJobParameters` hook returns a `JenkinsJobParametersResponse` with the following structure:

```typescript
interface JenkinsJobParametersResponse {
  steps: JenkinsJobStep[];
}

interface JenkinsJobStep {
  name: string;
  title?: string;
  description?: string;
  fields?: JenkinsJobField[];
  isDynamic?: boolean;
}

interface JenkinsJobField {
  name: string;
  type: string;
  description?: string | null;
  defaultParameterValue?: JenkinsParameterValue;
}

interface JenkinsParameterValue {
  value: string | boolean | number;
}
```

**API Details:**
- **Endpoint**: `/self-service/jenkins/{jaasName}/{jobName}/parameters`
- **Hook**: `useFetchJenkinsJobParameters(jaasName, jobName, options)`
- **Caching**: 5-minute stale time, no refetch on window focus
- **Enabled**: Only when `jaasName` and `jobName` are provided and dialog is open

**Data Transformation:**
The service transforms the legacy Jenkins API response:
```typescript
// Legacy Jenkins response format
interface LegacyJenkinsJobParametersResponse {
  parameterDefinitions: JenkinsJobField[];
}

// Transformed to standardized format
return {
  steps: [{
    name: 'parameters',
    fields: response.parameterDefinitions || []
  }]
};
```

### 5. **Parameter Extraction**

**From Static/Hybrid Configurations:**
```typescript
if (jobData?.steps) {
  jobData.steps.forEach((step: any) => {
    if (step.fields) allParams.push(...step.fields);
  });
} else if (Array.isArray(jobData)) {
  allParams = jobData; // Direct parameter array
}
```

**From Dynamic Configurations:**
```typescript
jenkinsQuery.data.steps.forEach((step: any) => {
  if (step.fields) allParams.push(...step.fields);
});
```

### 6. **Default Value Processing**
```typescript
if (allParams.length > 0) {
  setFormData(getDefaults(allParams));
}
```
- Filters out hidden parameters (`WHideParameterDefinition`)
- Extracts default values from parameter definitions
- Sets initial form state

### 7. **State Updates**
The loading process updates multiple state variables:
- `staticJobData`: Complete job configuration (static/hybrid only)
- `formData`: Form field defaults extracted from parameters
- Jenkins query state: Managed by React Query (dynamic only)

## Data Loading Sequence Diagram

```
User Opens Dialog
       ↓
   useEffect Triggered
       ↓
   Check Configuration Type
       ↓
┌─────────────────┬─────────────────┐
│ Static/Hybrid   │    Dynamic      │
│       ↓         │       ↓         │
│ Fetch JSON File │ Use Jenkins     │
│       ↓         │ Hook Data       │
│ Check isDynamic │       ↓         │
│ Steps           │ Extract Steps   │
│       ↓         │       ↓         │
│ Call Jenkins    │ Get All Fields  │
│ API (if needed) │       ↓         │
│       ↓         │ Extract         │
│ Merge Results   │ Defaults        │
│       ↓         │       ↓         │
│ Extract All     │ Set Form Data   │
│ Fields          │                 │
│       ↓         │                 │
│ Extract         │                 │
│ Defaults        │                 │
│       ↓         │                 │
│ Set Form Data   │                 │
└─────────────────┴─────────────────┘
       ↓
   Dialog Ready for User Interaction
```

## Dependencies

### Internal Components
- `SelfServiceBlockDialog`: Main dialog component
- `BreadcrumbPage`: Page layout wrapper

### Hooks
- `useFetchJenkinsJobParameters`: Jenkins API integration
- `useTriggerJenkinsJob`: Job execution mutation

### Services
- `fetchAndPopulateDynamicSteps`: Dynamic step population
- `SelfServiceApi`: API service layer

### Data
- `selfServiceBlocks`: Static block configuration
- `SelfServiceDialog`: TypeScript type definitions

## Usage Example

```tsx
import SelfServicePage from '@/pages/SelfServicePage';

// Rendered as a route component
<Route path="/self-service" component={SelfServicePage} />
```

## Configuration Example

### Static Block Configuration
```json
{
  "id": "example-block",
  "title": "Example Service",
  "description": "Example self-service operation",
  "dialogType": "static",
  "dataFilePath": "/data/self-service/example-config.json",
  "jenkinsJob": {
    "jaasName": "example-jaas",
    "jobName": "example-job"
  }
}
```

### Dynamic Step Configuration
```json
{
  "steps": [
    {
      "title": "Configuration",
      "isDynamic": true,
      "fields": []
    }
  ],
  "onSubmit": "trigger"
}
```
