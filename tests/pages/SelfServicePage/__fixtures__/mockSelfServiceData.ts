export const mockSelfServiceBlocks = [
  {
    id: 'create-landscape',
    title: 'Create Dev Landscape',
    description: 'Spin up a new development environment',
    icon: () => null, // Mock icon component
    category: 'Infrastructure',
    dialogType: 'static',
    dataFilePath: '/data/self-service/static-jobs/create-dev-landscape.json',
    jenkinsJob: {
      jaasName: 'atom',
      jobName: 'deploy-dev-landscape'
    }
  },
  {
    id: 'create-multicis',
    title: 'Create MultiCIS Environment',
    description: 'Deploy CIS services to a Cloud Foundry environment',
    icon: () => null, // Mock icon component
    category: 'Infrastructure',
    dialogType: 'dynamic',
    dataFilePath: '/data/self-service/dynamic-jobs/create-multicis.json',
    jenkinsJob: {
      jaasName: 'gkecfsmulticis2',
      jobName: 'multi-cis-v3-create'
    }
  }
];

export const mockSelfServiceJson = {
  'self-service-wizards': [
    {
      id: 'create-dev-landscape',
      title: 'Create Dev Landscape',
      description: 'Spin up a new development environment',
      steps: [
        { 
          id: 'step-1', 
          title: 'Configuration', 
          description: 'Configure your settings',
          stepNumber: 1,
          elements: [],
          nextStepId: 'step-2',
          prevStepId: null,
          isLastStep: false
        },
        { 
          id: 'step-2', 
          title: 'Review', 
          description: 'Review your configuration',
          stepNumber: 2,
          elements: [],
          nextStepId: null,
          prevStepId: 'step-1',
          isLastStep: true
        }
      ]
    }
  ]
};
