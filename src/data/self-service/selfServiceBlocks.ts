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
  }
];
