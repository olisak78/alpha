import { Monitor, Cloud } from "lucide-react";

export interface SelfServiceDialog {
  id: string;
  title: string;
  description: string;
  icon?: any;
  category?: string;
  dialogType: 'dynamic' | 'static';
  dataFilePath: string;
  jenkinsJob?: {
    jaasName: string;
    jobName: string;
  };
}

export const selfServiceBlocks: SelfServiceDialog[] = [
  {
    id: "create-landscape",
    title: "Create Dev Landscape",
    description: "Spin up a new development environment",
    icon: Monitor,
    category: "Infrastructure",
    dialogType: "static",
    dataFilePath: "/data/self-service/static-jobs/create-dev-landscape.json",
    jenkinsJob: {
      jaasName: "atom",
      jobName: "deploy-dev-landscape"
    }
  },
  {
    id: "create-multicis",
    title: "Create MultiCIS Environment",
    description: "Deploy CIS services to a Cloud Foundry environment",
    icon: Cloud,
    category: "Infrastructure",
    dialogType: "dynamic",
    dataFilePath: "/data/self-service/dynamic-jobs/multi-cis-environment.json",
    jenkinsJob: {
      jaasName: "atom",
      jobName: "multi-cis-v3-create"
    }
  },
  {
    id: "hello-developer-portal",
    title: "Hello Developer Portal",
    description: "",
    icon: Cloud,
    category: "Infrastructure",
    dialogType: "dynamic",
    dataFilePath: "/data/self-service/dynamic-jobs/hello-developer-portal.json",
    jenkinsJob: {
      jaasName: "atom",
      jobName: "hello-deverloper-portal"
    }
  },
  {
    id: "update-multicis",
    title: "Update MultiCIS Environment",
    description: "This job updates your CF Multi-CIS v2 2.0 instance with specific jar from branch.",
    icon: Cloud,
    category: "Infrastructure",
    dialogType: "dynamic",
    dataFilePath: "/data/self-service/dynamic-jobs/multi-cis-update.json",
    jenkinsJob: {
      jaasName: "atom",
      jobName: "multi-cis-v3-docker-update"
    }
  },
  {
    id: "release-java-projects",
    title: "Release Java Projects",
    description: "Release Java projects to the specified environment",
    icon: Cloud,
    category: "Java projects",
    dialogType: "dynamic",
    dataFilePath: "/data/self-service/dynamic-jobs/release-java-projects.json",
    jenkinsJob: {
      jaasName: "gkecfsrelease",
      jobName: "release-java-projects"
    }
  },
  {
    id: "dev-create-new-feature-toggle",
    title: "Create New Feature Toggle",
    description: "This job creates new feature-toggle for the user who triggered the build in his own dev landscape.",
    icon: Cloud,
    category: "Feature toggle",
    dialogType: "dynamic",
    dataFilePath: "/data/self-service/dynamic-jobs/dev-create-new-feature-toggle.json",
    jenkinsJob: {
      jaasName: "atomrelease",
      jobName: "dev-create-new-feature-toggle"
    }
  },
  {
    id: "release-cloud-automation-between-staging-and-canary-landscapes",
    title: "Release Cloud Automation Between Staging and Canary",
    description: "Release Cloud Automation between Staging and Canary Landscape",
    icon: Cloud,
    category: "Cloud automation",
    dialogType: "dynamic",
    dataFilePath: "/data/self-service/dynamic-jobs/release-cloud-automation-between-staging-and-canary-landscapes.json",
    jenkinsJob: {
      jaasName: "atomrelease",
      jobName: "release-cloud-automation-between-staging-and-canary-landscapes"
    }
  },
  {
    id: "release-cloud-automation-for-non-product-between-canary-to-live",
    title: "Release Cloud Automation Between Canary and Live",
    description: "Release Cloud Automation for Non-Product between Canary to Live Landscape",
    icon: Cloud,
    category: "Cloud automation",
    dialogType: "dynamic",
    dataFilePath: "/data/self-service/dynamic-jobs/release-cloud-automation-for-non-product-between-canary-to-live.json",
    jenkinsJob: {
      jaasName: "atomrelease",
      jobName: "release-cloud-automation-for-non-product-between-canary-to-live"
    }
  },
   {
    id: "atom-libraries-release",
    title: "Atom Libraries Release",
    description: "This job releases new MINOR version of library",
    icon: Cloud,
    category: "Atom",
    dialogType: "dynamic",
    dataFilePath: "/data/self-service/dynamic-jobs/atom-libraries-release.json",
    jenkinsJob: {
      jaasName: "atomrelease",
      jobName: "atom-libraries-release"
    }
  },
  {
    id: "cd-release-process-canary-to-hotfix-to-live-non-product",
    title: "Release Process Canary to Hotfix to Live Non-Product",
    description: "CD Release Process Canary to Hotfix to Live Non-Product",
    icon: Cloud,
    category: "Release",
    dialogType: "dynamic",
    dataFilePath: "/data/self-service/dynamic-jobs/cd-release-process-canary-to-hotfix-to-live-non-product.json",
    jenkinsJob: {
      jaasName: "atomrelease",
      jobName: "cd-release-process-canary-to-hotfix-to-live-non-product"
    }
  },
   {
    id: "cp-formations-api-tests-on-stagingaws",
    title: "CP Formations API Tests",
    description: "CP Formations API Tests on Staging AWS",
    icon: Cloud,
    category: "CP formations",
    dialogType: "dynamic",
    dataFilePath: "/data/self-service/dynamic-jobs/cp-formations-api-tests-on-stagingaws.json",
    jenkinsJob: {
      jaasName: "gkecfsautomation",
      jobName: "cp-formations-api-tests-on-stagingaws"
    }
  },
  {
    id: "cloud-automation-api-tests-on-integrate",
    title: "Cloud Automation API Tests Integrate",
    description: "Cloud Automation API Tests on Integrate",
    icon: Cloud,
    category: "Cloud automation",
    dialogType: "dynamic",
    dataFilePath: "/data/self-service/dynamic-jobs/cloud-automation-api-tests-on-integrate.json",
    jenkinsJob: {
      jaasName: "gkecfsautomation",
      jobName: "cloud-automation-api-tests-on-integrate"
    }
  },
  {
    id: "cloud-automation-api-tests-on-canary",
    title: "Cloud Automation API Tests Canary",
    description: "Cloud Automation API Tests on Canary",
    icon: Cloud,
    category: "Cloud automation",
    dialogType: "dynamic",
    dataFilePath: "/data/self-service/dynamic-jobs/cloud-automation-api-tests-on-canary.json",
    jenkinsJob: {
      jaasName: "gkecfsautomation",
      jobName: "cloud-automation-api-tests-on-canary"
    }
  }
];
