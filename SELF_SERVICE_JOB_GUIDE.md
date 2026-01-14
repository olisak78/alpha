# Self Service Job Addition Guide

## Overview

This guide explains how to add a new job to the Self Service system in the Developer Portal. The Self Service feature allows users to trigger various types of jobs and operations through a user-friendly interface with form-based parameter input.

## Table of Contents

1. [Job Types](#job-types)
2. [Adding a Static Job](#adding-a-static-job)
3. [Configuration Reference](#configuration-reference)
4. [Best Practices](#best-practices)
5. [Troubleshooting](#troubleshooting)

## Job Types

The system supports various job types through a flexible handler system. Jobs are categorized by their parameter source and execution method:

### By Parameter Source

#### Static Jobs
- Parameters are predefined in JSON configuration files
- No external API calls needed for parameter discovery
- Best for jobs with known, fixed parameters
- Configuration stored in `public/data/self-service/static-jobs/`

#### Dynamic Jobs
- Parameters are automatically fetched from external APIs (like Jenkins) at runtime
- Minimal static configuration required
- Parameters always stay synchronized with external systems
- Configuration stored in `public/data/self-service/dynamic-jobs/`
- **Note: Dynamic jobs can only be added by the development team and require backend infrastructure setup**

## Adding a Static Job

### Step 1: Create Configuration File

Create a new JSON file in `public/data/self-service/static-jobs/` (e.g., `my-custom-job.json`). The `onSubmit` handler determines the name of the function that will trigger the job:

#### Basic Example:
```json
{
  "onSubmit": "customJobHandler",
  "steps": [
    {
      "name": "basic-config",
      "title": "Basic Configuration",
      "description": "Configure basic job parameters",
      "fields": [
        {
          "name": "ENVIRONMENT",
          "type": "select",
          "description": "Target environment for deployment",
          "defaultParameterValue": {
            "value": "dev"
          },
          "options": [
            { "id": "dev", "label": "Development", "value": "dev" },
            { "id": "staging", "label": "Staging", "value": "staging" },
            { "id": "prod", "label": "Production", "value": "prod" }
          ]
        }
      ]
    },
    {
      "name": "advanced-config",
      "title": "Advanced Configuration",
      "description": "Configure advanced deployment options",
      "fields": [
        {
          "name": "CUSTOM_MESSAGE",
          "type": "text",
          "description": "Custom message for deployment",
          "defaultParameterValue": {
            "value": "My deployment message"
          }
        }
      ]
    }
  ]
}
```

### Step 2: Add Service Block

Add a new entry to `src/data/self-service/selfServiceBlocks.ts`:

```typescript
import { Settings } from "lucide-react"; // Choose appropriate icon

export const selfServiceBlocks: SelfServiceDialog[] = [
  // ... existing blocks
  {
    id: "your-job-id",
    title: "Your Job Title",
    description: "Description of what this job does",
    icon: Settings, // optional
    category: "Your Category", // optional - e.g., "Infrastructure", "Deployment", "Maintenance"
    dialogType: "static",
    dataFilePath: "/data/self-service/static-jobs/my-custom-job.json"
  }
];
```

### Step 3: Add Submission Handler

If you're adding a custom job, you'll need to implement the submission handler in `src/pages/SelfServicePage.tsx`:

```typescript
// Add to the submitHandlers registry
const submitHandlers = {
  customJobHandler: () => {
    executeCustomJob();
  }
};

// Implement the handler function
const executeCustomJob = () => {
  console.log('Job executed with parameters:', formData);
};
```

#### Example: Custom API Job
The `onSubmit` handler is generic - it can trigger any custom function you implement. Here's an example of an API-based job that includes an `apiConfig` section:

```json
{
  "onSubmit": "customApiCall",
  "apiConfig": {
    "endpoint": "https://api.example.com/deploy",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    }
  },
  "steps": [
    {
      "name": "api-config",
      "title": "API Configuration",
      "description": "Configure API call parameters",
      "fields": [
        {
          "name": "TARGET_ENV",
          "type": "select",
          "description": "Target environment",
          "defaultParameterValue": {
            "value": "staging"
          },
          "options": [
            { "id": "staging", "label": "Staging", "value": "staging" },
            { "id": "production", "label": "Production", "value": "production" }
          ]
        }
      ]
    },
    {
      "name": "deployment-settings",
      "title": "Deployment Settings",
      "description": "Configure deployment-specific settings",
      "fields": [
        {
          "name": "ENABLE_ROLLBACK",
          "type": "checkbox",
          "description": "Enable automatic rollback on failure",
          "defaultParameterValue": {
            "value": true
          }
        },
        {
          "name": "TIMEOUT_MINUTES",
          "type": "text",
          "description": "Deployment timeout in minutes",
          "defaultParameterValue": {
            "value": "30"
          }
        }
      ]
    },
    {
      "name": "notification-settings",
      "title": "Notification Settings",
      "description": "Configure notification preferences",
      "fields": [
        {
          "name": "NOTIFICATION_CHANNEL",
          "type": "radio",
          "description": "Preferred notification channel",
          "defaultParameterValue": {
            "value": "email"
          },
          "options": [
            { "id": "email", "label": "Email", "value": "email" },
            { "id": "slack", "label": "Slack", "value": "slack" },
            { "id": "teams", "label": "Microsoft Teams", "value": "teams" }
          ]
        }
      ]
    }
  ]
}
```

**Add Service Block for Custom API Job:**

Add the service block entry to `src/data/self-service/selfServiceBlocks.ts`:

```typescript
import { Settings } from "lucide-react";

export const selfServiceBlocks: SelfServiceDialog[] = [
  // ... existing blocks
  {
    id: "custom-api-job",
    title: "Custom API Job",
    description: "Execute custom API deployment with configuration options",
    icon: Settings,
    category: "Deployment",
    dialogType: "static",
    dataFilePath: "/data/self-service/static-jobs/custom-api-job.json"
  }
];
```

**Submission Handler for Custom API Job:**

To handle the `customApiCall` job, add this handler to `src/pages/SelfServicePage.tsx`:

```typescript
const submitHandlers = {
  customApiCall: () => {
    executeCustomApiCall();
  }
};

const executeCustomApiCall = async () => {
  const response = await fetch(staticJobData.apiConfig.endpoint, {
    method: staticJobData.apiConfig.method || 'POST',
    headers: staticJobData.apiConfig.headers || {},
    body: JSON.stringify(formData)
  });
};
```

### Step 4: Test the Integration

1. Start the development server: `yarn dev`
2. Navigate to the Self Service page
3. Verify your new job block appears
4. Test the form submission and parameter validation
5. Verify the correct submission handler is called


## Configuration Reference

### Service Block Interface

```typescript
interface SelfServiceDialog {
  id: string;                    // Unique identifier
  title: string;                 // Display title
  description: string;           // Brief description
  icon: any;                     // Lucide React icon component
  category: string;              // Category for grouping
  dialogType: 'dynamic' | 'static';          // Job type
  dataFilePath: string;          // Path to configuration JSON
}
```

### Field Types Summary

The system supports several field types for form inputs:

| Type | UI Component | Data Type | Requires Options | Use Cases |
|------|-------------|-----------|------------------|-----------|
| `text` | Text input field | String | No | Names, messages, URLs, file paths |
| `checkbox` | Checkbox | Boolean | No | Feature toggles, enable/disable options |
| `select` | Dropdown menu | String | Yes | Environment selection, priority levels |
| `radio` | Radio button group | String | Yes | Mutually exclusive choices, strategies |

For detailed examples of each field type and configuration structure, see the complete examples below.


## Best Practices

### 1. Naming Conventions

- **Service Block IDs**: Use kebab-case (e.g., `create-dev-environment`)
- **Configuration Files**: Match the service block ID (e.g., `create-dev-environment.json`)

### 2. User Experience

- **Clear Titles**: Use descriptive, action-oriented titles
- **Helpful Descriptions**: Provide context for each parameter
- **Default Values**: Provide sensible defaults for all parameters

### 4. Security Considerations

- **Sensitive Data**: Avoid exposing sensitive parameters in static configurations

## Troubleshooting

### Common Issues

#### 1. Service Block Not Appearing

**Symptoms**: New job block doesn't show up on the Self Service page

**Solutions**:
- Check that the service block is properly added to `selfServiceBlocks` array in `src/data/self-service/selfServiceBlocks.ts`
- Verify the import statement for the icon component
- Ensure the development server is restarted after changes

#### 2. Configuration File Not Loading

**Symptoms**: Dialog opens but shows no parameters or error messages

**Solutions**:
- Verify the `dataFilePath` points to the correct JSON file
- Check that the JSON file is valid (use a JSON validator)
- Ensure the file is in the `public/` directory (accessible via HTTP)

#### 3. Form Submission Fails

**Symptoms**: Form submits but job doesn't execute

**Solutions**:
- Check that `onSubmit` handler is correctly configured in JSON
- Verify the submission handler exists in the `submitHandlers` registry
- For custom jobs: Check your custom API endpoints and authentication
- Ensure all required parameters are provided
- Check external system permissions and authentication
- Verify parameter formatting matches expected schema

#### 4. Parameter Mapping Issues

**Symptoms**: Parameters appear with wrong field types or missing options

**Solutions**:
- Verify field type definitions in JSON configuration
- Check that options are properly defined for select/radio fields
- Ensure parameter names match expected values

### Getting Help

If you encounter issues not covered in this guide:

1. Check the existing job configurations for reference patterns
2. Review the component implementation in `src/pages/SelfServicePage.tsx`
3. Examine the API service in `src/services/SelfServiceApi.ts`
4. Test with a minimal configuration first, then add complexity
5. Consult the team's documentation or reach out to the development team

This completes the job addition process. New jobs will be available to all users of the Self Service system once deployed.
