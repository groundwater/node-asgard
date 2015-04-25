export const jobTypes = {
  args  : {type: 'array', kind: 'string'},
  envs  : {type: 'map', kind: 'string'},
  stdio : {type: 'struct', props: {
    fd   : 'number',
    path : 'number',
  }},
  task : {type: 'struct', props: {
    exec  : 'string',
    args  : 'args',
    envs  : 'envs',
    cwd   : 'string',
    stdio : 'stdio',
  }},
  tasks: {type: 'array', kind: 'task'},
  job : {type: 'struct', props: {
    tasks: 'tasks'
  }}
}

export const jobSchema = {
  types: jobTypes,
  routes: {
    submitJob: {
      proto: {
        method: 'POST',
        route: '/job/:name',
      },
      input: 'job',
      output: 'json'
    }
  }
}
