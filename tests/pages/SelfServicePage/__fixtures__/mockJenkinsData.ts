export const mockStaticJobData = {
  jenkinsJob: {
    jaasName: 'atom',
    jobName: 'deploy-dev-landscape'
  },
  onSubmit: 'triggerJenkinsJob',
  parameterDefinitions: []
};

export const mockDynamicJobData = {
  jenkinsJob: {
    jaasName: 'gkecfsmulticis2',
    jobName: 'multi-cis-v3-create'
  },
  steps: [
    {
      name: 'dynamic-step',
      title: 'Dynamic Configuration',
      isDynamic: true,
      fields: []
    }
  ]
};

export const mockParameterFilteringJobData = {
  jenkinsJob: {
    jaasName: 'atom',
    jobName: 'deploy-dev-landscape'
  },
  onSubmit: 'triggerJenkinsJob',
  steps: [
    {
      id: 'step-1',
      title: 'Configuration',
      fields: [
        {
          name: 'trueBoolParam',
          type: 'checkbox',
          description: 'Boolean parameter set to true',
          defaultParameterValue: { value: true }
        },
        {
          name: 'falseBoolParam',
          type: 'checkbox',  
          description: 'Boolean parameter set to false',
          defaultParameterValue: { value: false }
        },
        {
          name: 'stringParam',
          type: 'text',
          description: 'String parameter',
          defaultParameterValue: { value: 'test' }
        }
      ]
    }
  ]
};

export const mockEnvironmentJobData = {
  parameterDefinitions: [
    {
      name: 'environment',
      type: 'StringParameterDefinition',
      description: 'Environment name',
      defaultValue: { value: 'dev' }
    }
  ]
};
