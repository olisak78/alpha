import { FeatureToggle } from "@/types/developer-portal";

export const mockFeatureToggles: FeatureToggle[] = [
  {
    id: "adaptive-rate-limit-computation",
    name: "ADAPTIVE_RATE_LIMIT_COMPUTATION",
    component: "cis-cli-backend",
    description: "Enable adaptive rate limit computation for better performance control",
    landscapes: {
      "cf-ap10": false, "cf-cn20-canary": false, "cf-ap11": false, "cf-cn40-hotfix": false, "cf-ap12": false,
      "cf-us10-hotfix": false, "cf-ap21": false, "cf-cn40-canary": false, "cf-eu01-canary": false, "cf-eu10-canary": false,
      "cf-ca10": false, "cf-eu12": false, "cf-ca20": false, "cf-eu21": false, "cf-eu10": false, "cf-us31": false,
      "cf-eu20": false, "cf-eu30": false, "cf-in30": false, "cf-jp10": false, "cf-jp20": false, "cf-jp31": false,
      "cf-sa30": false, "cf-sa31": false, "cf-us02": false, "cf-us10": false, "cf-us11": false, "cf-us20": false,
      "cf-us21": false, "cf-us30": false
    }
  },
  {
    id: "adaptive-rate-limit-enforcement",
    name: "ADAPTIVE_RATE_LIMIT_ENFORCEMENT",
    component: "cis-cli-backend",
    description: "Enable adaptive rate limit enforcement mechanisms",
    landscapes: {
      "cf-ap10": false, "cf-cn20-canary": false, "cf-ap11": false, "cf-cn40-hotfix": false, "cf-ap12": false,
      "cf-us10-hotfix": false, "cf-ap21": false, "cf-cn40-canary": false, "cf-eu01-canary": false, "cf-eu10-canary": false,
      "cf-ca10": false, "cf-eu12": false, "cf-ca20": false, "cf-eu21": false, "cf-eu10": false, "cf-us31": false,
      "cf-eu20": false, "cf-eu30": false, "cf-in30": false, "cf-jp10": false, "cf-jp20": false, "cf-jp31": false,
      "cf-sa30": false, "cf-sa31": false, "cf-us02": false, "cf-us10": false, "cf-us11": false, "cf-us20": false,
      "cf-us21": false, "cf-us30": false
    }
  },
  {
    id: "adaptive-rate-limit-jobs-enforcement",
    name: "ADAPTIVE_RATE_LIMIT_JOBS_ENFORCEMENT",
    component: "cis-cli-backend",
    description: "Enable adaptive rate limit enforcement for background jobs",
    landscapes: {
      "cf-ap10": false, "cf-cn20-canary": false, "cf-ap11": false, "cf-cn40-hotfix": false, "cf-ap12": false,
      "cf-us10-hotfix": false, "cf-ap21": false, "cf-cn40-canary": false, "cf-eu01-canary": false, "cf-eu10-canary": false,
      "cf-ca10": false, "cf-eu12": false, "cf-ca20": false, "cf-eu21": false, "cf-eu10": false, "cf-us31": false,
      "cf-eu20": false, "cf-eu30": false, "cf-in30": false, "cf-jp10": false, "cf-jp20": false, "cf-jp31": false,
      "cf-sa30": false, "cf-sa31": false, "cf-us02": false, "cf-us10": false, "cf-us11": false, "cf-us20": false,
      "cf-us21": false, "cf-us30": false
    }
  },
  {
    id: "allow-accounts-hierarchy",
    name: "ALLOW_ACCOUNTS_HIERARCHY",
    component: "cis-cli-backend",
    description: "Allow hierarchical account structures and nested account management",
    landscapes: {
      "cf-ap10": true, "cf-cn20-canary": true, "cf-ap11": true, "cf-cn40-hotfix": true, "cf-ap12": true,
      "cf-us10-hotfix": true, "cf-ap21": true, "cf-cn40-canary": true, "cf-eu01-canary": true, "cf-eu10-canary": true,
      "cf-ca10": true, "cf-eu12": true, "cf-ca20": true, "cf-eu21": true, "cf-eu10": true, "cf-us31": true,
      "cf-eu20": true, "cf-eu30": true, "cf-in30": true, "cf-jp10": true, "cf-jp20": true, "cf-jp31": true,
      "cf-sa30": true, "cf-sa31": true, "cf-us02": true, "cf-us10": true, "cf-us11": true, "cf-us20": true,
      "cf-us21": true, "cf-us30": true
    }
  },
  {
    id: "archived-job-deletion",
    name: "ARCHIVED_JOB_DELETION",
    component: "cis-cli-backend",
    description: "Enable automatic deletion of archived jobs",
    landscapes: {
      "cf-ap10": true, "cf-cn20-canary": true, "cf-ap11": true, "cf-cn40-hotfix": true, "cf-ap12": true,
      "cf-us10-hotfix": true, "cf-ap21": true, "cf-cn40-canary": true, "cf-eu01-canary": true, "cf-eu10-canary": true,
      "cf-ca10": true, "cf-eu12": true, "cf-ca20": true, "cf-eu21": true, "cf-eu10": true, "cf-us31": true,
      "cf-eu20": true, "cf-eu30": true, "cf-in30": true, "cf-jp10": true, "cf-jp20": true, "cf-jp31": true,
      "cf-sa30": true, "cf-sa31": true, "cf-us02": true, "cf-us10": true, "cf-us11": true, "cf-us20": true,
      "cf-us21": true, "cf-us30": true
    }
  },
  {
    id: "async-jobs-data-deletion-task-enabled",
    name: "ASYNC_JOBS_DATA_DELETION_TASK_ENABLED",
    component: "cis-cli-backend",
    description: "Enable asynchronous job data deletion tasks",
    landscapes: {
      "cf-ap10": true, "cf-cn20-canary": true, "cf-ap11": true, "cf-cn40-hotfix": true, "cf-ap12": true,
      "cf-us10-hotfix": true, "cf-ap21": true, "cf-cn40-canary": true, "cf-eu01-canary": true, "cf-eu10-canary": true,
      "cf-ca10": true, "cf-eu12": true, "cf-ca20": true, "cf-eu21": true, "cf-eu10": true, "cf-us31": true,
      "cf-eu20": true, "cf-eu30": true, "cf-in30": true, "cf-jp10": true, "cf-jp20": true, "cf-jp31": true,
      "cf-sa30": true, "cf-sa31": true, "cf-us02": true, "cf-us10": true, "cf-us11": true, "cf-us20": true,
      "cf-us21": true, "cf-us30": true
    }
  },
  {
    id: "audit-logs-async-jobs",
    name: "AUDIT_LOGS_ASYNC_JOBS",
    component: "cis-cli-backend",
    description: "Enable audit logging for asynchronous jobs",
    landscapes: {
      "cf-ap10": true, "cf-cn20-canary": true, "cf-ap11": true, "cf-cn40-hotfix": true, "cf-ap12": true,
      "cf-us10-hotfix": true, "cf-ap21": true, "cf-cn40-canary": true, "cf-eu01-canary": true, "cf-eu10-canary": true,
      "cf-ca10": true, "cf-eu12": true, "cf-ca20": true, "cf-eu21": true, "cf-eu10": true, "cf-us31": true,
      "cf-eu20": true, "cf-eu30": true, "cf-in30": true, "cf-jp10": true, "cf-jp20": true, "cf-jp31": true,
      "cf-sa30": true, "cf-sa31": true, "cf-us02": true, "cf-us10": true, "cf-us11": true, "cf-us20": true,
      "cf-us21": true, "cf-us30": true
    }
  },
  {
    id: "automatic-retry-failed-publish-event-jobs",
    name: "AUTOMATIC_RETRY_FAILED_PUBLISH_EVENT_JOBS",
    component: "cis-cli-backend",
    description: "Enable automatic retry mechanism for failed event publishing jobs",
    landscapes: {
      "cf-ap10": true, "cf-cn20-canary": true, "cf-ap11": true, "cf-cn40-hotfix": true, "cf-ap12": true,
      "cf-us10-hotfix": true, "cf-ap21": true, "cf-cn40-canary": true, "cf-eu01-canary": true, "cf-eu10-canary": true,
      "cf-ca10": true, "cf-eu12": true, "cf-ca20": true, "cf-eu21": true, "cf-eu10": true, "cf-us31": true,
      "cf-eu20": true, "cf-eu30": true, "cf-in30": true, "cf-jp10": true, "cf-jp20": true, "cf-jp31": true,
      "cf-sa30": true, "cf-sa31": true, "cf-us02": true, "cf-us10": true, "cf-us11": true, "cf-us20": true,
      "cf-us21": true, "cf-us30": true
    }
  },
  {
    id: "block-subscription-manager-registration",
    name: "BLOCK_SUBSCRIPTION_MANAGER_REGISTRATION",
    component: "cis-cli-backend",
    description: "Block registration of subscription managers",
    landscapes: {
      "cf-ap10": false, "cf-cn20-canary": false, "cf-ap11": false, "cf-cn40-hotfix": false, "cf-ap12": false,
      "cf-us10-hotfix": false, "cf-ap21": false, "cf-cn40-canary": false, "cf-eu01-canary": false, "cf-eu10-canary": false,
      "cf-ca10": false, "cf-eu12": false, "cf-ca20": false, "cf-eu21": false, "cf-eu10": false, "cf-us31": false,
      "cf-eu20": false, "cf-eu30": false, "cf-in30": false, "cf-jp10": false, "cf-jp20": false, "cf-jp31": false,
      "cf-sa30": false, "cf-sa31": false, "cf-us02": false, "cf-us10": false, "cf-us11": false, "cf-us20": false,
      "cf-us21": false, "cf-us30": false
    }
  },
  {
    id: "circuit-breaker",
    name: "CIRCUIT_BREAKER",
    component: "cis-cli-backend",
    description: "Enable circuit breaker pattern for service resilience",
    landscapes: {
      "cf-ap10": true, "cf-cn20-canary": true, "cf-ap11": true, "cf-cn40-hotfix": true, "cf-ap12": true,
      "cf-us10-hotfix": true, "cf-ap21": true, "cf-cn40-canary": true, "cf-eu01-canary": true, "cf-eu10-canary": true,
      "cf-ca10": true, "cf-eu12": true, "cf-ca20": true, "cf-eu21": true, "cf-eu10": true, "cf-us31": true,
      "cf-eu20": true, "cf-eu30": true, "cf-in30": true, "cf-jp10": true, "cf-jp20": true, "cf-jp31": true,
      "cf-sa30": true, "cf-sa31": true, "cf-us02": true, "cf-us10": true, "cf-us11": true, "cf-us20": true,
      "cf-us21": true, "cf-us30": true
    }
  },
  
  // Unified Services Project Feature Toggles
  {
    id: "cc-limit-user-bindings",
    name: "cc-limit-user-bindings",
    component: "core-controllers",
    description: "Limit user bindings in core controllers",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "cim-publish-to-root-governance",
    name: "cim-publish-to-root-governance",
    component: "commercial-integration-manager",
    description: "Enable publishing to root governance",
    landscapes: {
      "staging": true, "int": false, "canary": false, "perf": false, "hotfix": false, "live": false
    }
  },
  {
    id: "uca-retry-spfi",
    name: "uca-retry-spfi",
    component: "unified-cloud-automation",
    description: "Enable retry mechanism for SPFI",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "rmcertificaterevokedvalidation",
    name: "rmcertificaterevokedvalidation",
    component: "resources-server",
    description: "Enable certificate revoked validation",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "rmpatchrevisionid",
    name: "rmpatchrevisionid",
    component: "resources-server",
    description: "Enable patch revision ID functionality",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "rmratelimit",
    name: "rmratelimit",
    component: "resources-server",
    description: "Enable rate limiting for resources server",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": false, "live": false
    }
  },
  {
    id: "ua-restrict-initial-admins",
    name: "ua-restrict-initial-admins",
    component: "unified-account",
    description: "Restrict initial admin permissions",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "uca-simulate-cloud-automation-requests",
    name: "uca-simulate-cloud-automation-requests",
    component: "unified-cloud-automation",
    description: "Simulate cloud automation requests for testing",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "urm-disable-old-style-subresources-updates",
    name: "urm-disable-old-style-subresources-updates",
    component: "resources-server",
    description: "Disable old style subresources updates",
    landscapes: {
      "staging": true, "int": false, "canary": false, "perf": false, "hotfix": false, "live": false
    }
  },
  {
    id: "urm-enable-adaptive-rate-limiter",
    name: "urm-enable-adaptive-rate-limiter",
    component: "resources-server",
    description: "Enable adaptive rate limiter",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "urm-enable-adaptive-rate-limiter-blocking",
    name: "urm-enable-adaptive-rate-limiter-blocking",
    component: "resources-server",
    description: "Enable blocking for adaptive rate limiter",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": false, "hotfix": true, "live": true
    }
  },
  {
    id: "urm-force-status-subresource-schema-validation",
    name: "urm-force-status-subresource-schema-validation",
    component: "resources-server",
    description: "Force status subresource schema validation",
    landscapes: {
      "staging": true, "int": false, "canary": false, "perf": false, "hotfix": false, "live": false
    }
  },
  {
    id: "urm-reset-subresources-on-update",
    name: "urm-reset-subresources-on-update",
    component: "resources-server",
    description: "Reset subresources on update",
    landscapes: {
      "staging": true, "int": false, "canary": false, "perf": false, "hotfix": false, "live": false
    }
  },
  {
    id: "urmlistrtd",
    name: "urmlistrtd",
    component: "resources-server",
    description: "Enable URM list RTD functionality",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "cim-reconcile-optimizations",
    name: "cim-reconcile-optimizations",
    component: "commercial-integration-manager",
    description: "Enable reconcile optimizations",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "usm-disable-managed-service-v1-creation",
    name: "usm-disable-managed-service-v1-creation",
    component: "unified-service-orchestration",
    description: "Disable managed service v1 creation",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "uci-call-slis",
    name: "uci-call-slis",
    component: "commercial-integration-manager",
    description: "Enable calling SLIS",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "uci-local-tenant-type-validation",
    name: "uci-local-tenant-type-validation",
    component: "commercial-integration-manager",
    description: "Enable local tenant type validation",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "urm-write-type-def-in-db",
    name: "urm-write-type-def-in-db",
    component: "resources-server",
    description: "Write type definitions in database",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "urm-read-type-def-from-db",
    name: "urm-read-type-def-from-db",
    component: "resources-server",
    description: "Read type definitions from database",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "workspace-subresources",
    name: "workspace-subresources",
    component: "workspace-server",
    description: "Enable workspace subresources",
    landscapes: {
      "staging": false, "int": false, "canary": false, "perf": false, "hotfix": false, "live": false
    }
  },
  {
    id: "urm-init-type-def-db",
    name: "urm-init-type-def-db",
    component: "resources-server",
    description: "Initialize type definition database",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "uca-send-error-status-to-spfi",
    name: "uca-send-error-status-to-spfi",
    component: "unified-cloud-automation",
    description: "Send error status to SPFI",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "workspace-enable-cloud-automation-designer",
    name: "workspace-enable-cloud-automation-designer",
    component: "workspace-app",
    description: "Enable cloud automation designer",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "uca-get-host-url-from-secret",
    name: "uca-get-host-url-from-secret",
    component: "unified-cloud-automation",
    description: "Get host URL from secret",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "workspace-go-to-path",
    name: "workspace-go-to-path",
    component: "workspace-app",
    description: "Enable go to path functionality",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "workspace-events-viewer",
    name: "workspace-events-viewer",
    component: "workspace-app",
    description: "Enable events viewer",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "workspace-events-api",
    name: "workspace-events-api",
    component: "workspace-server",
    description: "Enable events API",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "ua-account-tenant-group-automatic-creation",
    name: "ua-account-tenant-group-automatic-creation",
    component: "unified-account",
    description: "Enable automatic account tenant group creation",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "urm-rtd-api-ready",
    name: "urm-rtd-api-ready",
    component: "resources-server",
    description: "RTD API ready status",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "healthcheck-mt-grouping-toggles-test1",
    name: "healthcheck-mt-grouping-toggles-test1",
    component: "healthcheck",
    description: "Test toggle for MT grouping",
    landscapes: {
      "staging": true, "int": false, "canary": false, "perf": true, "hotfix": false, "live": false
    }
  },
  {
    id: "workspace-btp-wizard",
    name: "workspace-btp-wizard",
    component: "workspace-server",
    description: "Enable BTP wizard",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": false, "live": false
    }
  },
  {
    id: "workspace-new-saas-cockpit-url",
    name: "workspace-new-saas-cockpit-url",
    component: "workspace-app",
    description: "Enable new SaaS cockpit URL",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "workspace-unified-wizard-consumer-sa",
    name: "workspace-unified-wizard-consumer-sa",
    component: "workspace-server",
    description: "Enable unified wizard consumer SA",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "uci-call-slm",
    name: "uci-call-slm",
    component: "commercial-integration-manager",
    description: "Enable calling SLM",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "urm-policies-on-postgres",
    name: "urm-policies-on-postgres",
    component: "resources-server",
    description: "Enable policies on PostgreSQL",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "urm-verify-resource-signature",
    name: "urm-verify-resource-signature",
    component: "resources-server",
    description: "Verify resource signature",
    landscapes: {
      "staging": false, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "urm-policies-new-authorizer",
    name: "urm-policies-new-authorizer",
    component: "resources-server",
    description: "Enable new authorizer for policies",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "workspace-unified-wizard",
    name: "workspace-unified-wizard",
    component: "workspace-server",
    description: "Enable unified wizard",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "workspace-resource-events-viewer",
    name: "workspace-resource-events-viewer",
    component: "workspace-app",
    description: "Enable resource events viewer",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "workspace-unified-wizard-euporie",
    name: "workspace-unified-wizard-euporie",
    component: "workspace-server",
    description: "Enable unified wizard for Euporie",
    landscapes: {
      "staging": false, "int": false, "canary": false, "perf": false, "hotfix": false, "live": false
    }
  },
  {
    id: "urm-enable-metrics-based-adaptive-limit",
    name: "urm-enable-metrics-based-adaptive-limit",
    component: "resources-server",
    description: "Enable metrics-based adaptive limit",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "uca-migration-automation-request-ref-automation-solution",
    name: "uca-migration-automation-request-ref-automation-solution",
    component: "unified-cloud-automation",
    description: "Migration automation request reference automation solution",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "workspace-move-resource",
    name: "workspace-move-resource",
    component: "workspace-app",
    description: "Enable move resource functionality",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": false, "live": false
    }
  },
  {
    id: "urm-disable-total-requests-probe-adaptive-limit",
    name: "urm-disable-total-requests-probe-adaptive-limit",
    component: "resources-server",
    description: "Disable total requests probe adaptive limit",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "urm-disable-technical-client-v1-rotation",
    name: "urm-disable-technical-client-v1-rotation",
    component: "core-controllers",
    description: "Disable technical client v1 rotation",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "urm-enable-adaptive-websocket-throttling",
    name: "urm-enable-adaptive-websocket-throttling",
    component: "resources-server",
    description: "Enable adaptive websocket throttling",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": false, "live": false
    }
  },
  {
    id: "usm-enable-fulfillment-data-for-etc",
    name: "usm-enable-fulfillment-data-for-etc",
    component: "unified-service-orchestration",
    description: "Enable fulfillment data for ETC",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "urm-enable-adaptive-concurrency-limiting",
    name: "urm-enable-adaptive-concurrency-limiting",
    component: "resources-server",
    description: "Enable adaptive concurrency limiting",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "workspace-unified-wizard-download-helm",
    name: "workspace-unified-wizard-download-helm",
    component: "workspace-server",
    description: "Enable unified wizard download Helm",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "uci-slis-tc-v2",
    name: "uci-slis-tc-v2",
    component: "commercial-integration-manager",
    description: "Enable SLIS TC v2",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": false, "live": false
    }
  },
  {
    id: "uca-automation-request-deletion-job",
    name: "uca-automation-request-deletion-job",
    component: "unified-cloud-automation",
    description: "Enable automation request deletion job",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "workspace-commercial-mapping",
    name: "workspace-commercial-mapping",
    component: "workspace-server",
    description: "Enable commercial mapping",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "workspace-cad-patch-by-deletion-solution",
    name: "workspace-cad-patch-by-deletion-solution",
    component: "workspace-app",
    description: "Enable CAD patch by deletion solution",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": false, "live": false
    }
  },
  {
    id: "urm-reset-references-on-update",
    name: "urm-reset-references-on-update",
    component: "resources-server",
    description: "Reset references on update",
    landscapes: {
      "staging": false, "int": false, "canary": false, "perf": false, "hotfix": false, "live": false
    }
  },
  {
    id: "urm-enable-request-latency-adaptive-limit",
    name: "urm-enable-request-latency-adaptive-limit",
    component: "resources-server",
    description: "Enable request latency adaptive limit",
    landscapes: {
      "staging": false, "int": false, "canary": false, "perf": false, "hotfix": false, "live": false
    }
  },
  {
    id: "urm-enable-new-opensearch-query-optimizations",
    name: "urm-enable-new-opensearch-query-optimizations",
    component: "resources-server",
    description: "Enable new OpenSearch query optimizations",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "urm-enable-adaptive-latency-median",
    name: "urm-enable-adaptive-latency-median",
    component: "resources-server",
    description: "Enable adaptive latency median",
    landscapes: {
      "staging": false, "int": false, "canary": false, "perf": false, "hotfix": false, "live": false
    }
  },
  {
    id: "urm-enable-manual-tracing",
    name: "urm-enable-manual-tracing",
    component: "resources-server",
    description: "Enable manual tracing",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "urm-resource-access-guard-restricted-methods",
    name: "urm-resource-access-guard-restricted-methods",
    component: "resources-server",
    description: "Enable resource access guard restricted methods",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "urm-enable-resource-access-guard",
    name: "urm-enable-resource-access-guard",
    component: "resources-server",
    description: "Enable resource access guard",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": false, "hotfix": true, "live": true
    }
  },
  {
    id: "bso-fake-sms-trust-move",
    name: "bso-fake-sms-trust-move",
    component: "btp-subaccount-operator",
    description: "Fake SMS trust move",
    landscapes: {
      "staging": false, "int": false, "canary": false, "perf": false, "hotfix": false, "live": false
    }
  },
  {
    id: "uca-disable-customer-managed-request-flow",
    name: "uca-disable-customer-managed-request-flow",
    component: "unified-cloud-automation",
    description: "Disable customer managed request flow",
    landscapes: {
      "staging": false, "int": false, "canary": false, "perf": false, "hotfix": false, "live": false
    }
  },
  {
    id: "urm-enable-adaptive-new-strategy",
    name: "urm-enable-adaptive-new-strategy",
    component: "resources-server",
    description: "Enable adaptive new strategy",
    landscapes: {
      "staging": false, "int": false, "canary": false, "perf": true, "hotfix": false, "live": false
    }
  },
  {
    id: "uci-call-crm",
    name: "uci-call-crm",
    component: "commercial-integration-manager",
    description: "Enable calling CRM",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "urm-enable-mixins-lazy-migration-with-new-id",
    name: "urm-enable-mixins-lazy-migration-with-new-id",
    component: "resources-server",
    description: "Enable mixins lazy migration with new ID",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "bso-sync-btp-accounts",
    name: "bso-sync-btp-accounts",
    component: "btp-subaccount-operator",
    description: "Sync BTP accounts",
    landscapes: {
      "staging": true, "int": false, "canary": false, "perf": false, "hotfix": false, "live": false
    }
  },
  {
    id: "ftm-ori-test",
    name: "ftm-ori-test",
    component: "feature-toggle-manager",
    description: "FTM ORI test toggle",
    landscapes: {
      "staging": false, "int": false, "canary": false, "perf": false, "hotfix": false, "live": false
    }
  },
  {
    id: "uci-support-uni-order",
    name: "uci-support-uni-order",
    component: "commercial-integration-manager",
    description: "Support universal order",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "urm-enable-resource-access-guard-read",
    name: "urm-enable-resource-access-guard-read",
    component: "resources-server",
    description: "Enable resource access guard read",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": false, "hotfix": true, "live": true
    }
  },
  {
    id: "workspace-show-rtd-resources",
    name: "workspace-show-rtd-resources",
    component: "workspace-server",
    description: "Show RTD resources",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "workspace-cad-locals-management",
    name: "workspace-cad-locals-management",
    component: "workspace-server",
    description: "Enable CAD locals management",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "uci-handle-eligibilitycatalogitem",
    name: "uci-handle-eligibilitycatalogitem",
    component: "commercial-integration-manager",
    description: "Handle eligibility catalog item",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "uci-order-set-auto-provisioning",
    name: "uci-order-set-auto-provisioning",
    component: "commercial-integration-manager",
    description: "Set auto provisioning for orders",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "workspace-cascade-delete",
    name: "workspace-cascade-delete",
    component: "workspace-server",
    description: "Enable cascade delete",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "workspace-cad-skip-auto-assign-plans",
    name: "workspace-cad-skip-auto-assign-plans",
    component: "workspace-server",
    description: "Skip auto assign plans in CAD",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": false, "live": false
    }
  },
  {
    id: "uci-call-ems",
    name: "uci-call-ems",
    component: "commercial-integration-manager",
    description: "Enable calling EMS",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": false, "live": false
    }
  },
  {
    id: "urm-allowlist-access-guard-bucket-blocking",
    name: "urm-allowlist-access-guard-bucket-blocking",
    component: "resources-server",
    description: "Allowlist access guard bucket blocking",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "uci-skip-entitlement-tenant-creation-for-bdcc",
    name: "uci-skip-entitlement-tenant-creation-for-bdcc",
    component: "commercial-integration-manager",
    description: "Skip entitlement tenant creation for BDCC",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "bso-sync-btp-accounts-to-ums",
    name: "bso-sync-btp-accounts-to-ums",
    component: "btp-subaccount-operator",
    description: "Sync BTP accounts to UMS",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": false, "live": false
    }
  },
  {
    id: "uci-update-btp-solution",
    name: "uci-update-btp-solution",
    component: "commercial-integration-manager",
    description: "Update BTP solution",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "bso-sync-btp-accounts-to-urm",
    name: "bso-sync-btp-accounts-to-urm",
    component: "btp-subaccount-operator",
    description: "Sync BTP accounts to URM",
    landscapes: {
      "staging": true, "int": false, "canary": false, "perf": false, "hotfix": false, "live": false
    }
  },
  {
    id: "bso-sync-internal-global-accounts-to-urm",
    name: "bso-sync-internal-global-accounts-to-urm",
    component: "btp-subaccount-operator",
    description: "Sync internal global accounts to URM",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": false, "live": false
    }
  },
  {
    id: "workspace-suite-wizard",
    name: "workspace-suite-wizard",
    component: "workspace-server",
    description: "Enable suite wizard",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": false, "live": false
    }
  },
  {
    id: "uci-requeue-after-delay",
    name: "uci-requeue-after-delay",
    component: "commercial-integration-manager",
    description: "Requeue after delay",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": false, "live": false
    }
  },
  {
    id: "workspace-oidc-providers",
    name: "workspace-oidc-providers",
    component: "workspace-server",
    description: "Enable OIDC providers",
    landscapes: {
      "staging": false, "int": false, "canary": false, "perf": false, "hotfix": false, "live": false
    }
  },
  {
    id: "ftm-test-toggle",
    name: "ftm-test-toggle",
    component: "feature-toggle-manager",
    description: "FTM test toggle",
    landscapes: {
      "staging": false, "int": false, "canary": false, "perf": false, "hotfix": false, "live": false
    }
  },
  {
    id: "ftm-test-toggle2",
    name: "ftm-test-toggle2",
    component: "feature-toggle-manager",
    description: "FTM test toggle 2",
    landscapes: {
      "staging": false, "int": false, "canary": false, "perf": false, "hotfix": false, "live": false
    }
  },
  {
    id: "uci-uci-restrict-entitlement-resource",
    name: "uci-uci-restrict-entitlement-resource",
    component: "commercial-integration-manager",
    description: "Restrict entitlement resource (duplicate)",
    landscapes: {
      "staging": false, "int": false, "canary": false, "perf": false, "hotfix": false, "live": false
    }
  },
  {
    id: "workspace-cloud-automation-designer-type-selector",
    name: "workspace-cloud-automation-designer-type-selector",
    component: "workspace-server",
    description: "Cloud automation designer type selector",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": false, "live": false
    }
  },
  {
    id: "uci-restrict-entitlement-resource",
    name: "uci-restrict-entitlement-resource",
    component: "commercial-integration-manager",
    description: "Restrict entitlement resource",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": true, "live": true
    }
  },
  {
    id: "workspace-skip-search-resource-api",
    name: "workspace-skip-search-resource-api",
    component: "workspace-server",
    description: "Skip search resource API",
    landscapes: {
      "staging": false, "int": false, "canary": false, "perf": false, "hotfix": false, "live": false
    }
  },
  {
    id: "workspace-discover-rtd",
    name: "workspace-discover-rtd",
    component: "workspace-server",
    description: "Discover RTD",
    landscapes: {
      "staging": true, "int": true, "canary": true, "perf": true, "hotfix": false, "live": false
    }
  }
];
