import { Monitor, Cloud } from "lucide-react";

export interface SelfServiceDialog {
  id: string;
  title: string;
  description: string;
  icon?: any;
  category?: string;
  dialogType: 'dynamic' | 'static';
  dataFilePath: string;
}

export const selfServiceBlocks: SelfServiceDialog[] = [
  {
    id: "create-landscape",
    title: "Create Dev Landscape",
    description: "Spin up a new development environment",
    icon: Monitor,
    category: "Infrastructure",
    dialogType: "static",
    dataFilePath: "/data/self-service/static-jobs/create-dev-landscape.json"
  },
  {
    id: "create-multicis",
    title: "Create MultiCIS Environment",
    description: "Deploy CIS services to a Cloud Foundry environment",
    icon: Cloud,
    category: "Infrastructure",
    dialogType: "dynamic",
    dataFilePath: "/data/self-service/dynamic-jobs/multi-cis-environment.json"
  },
  {
    id: "hello-developer-portal",
    title: "Hello Developer Portal",
    description: "",
    icon: Cloud,
    category: "Infrastructure",
    dialogType: "dynamic",
    dataFilePath: "/data/self-service/dynamic-jobs/hello-developer-portal.json"
  }
];
