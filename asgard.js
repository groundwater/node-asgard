#!/usr/bin/env babel-node

import {jobSchema} from './schema.js'
import http from 'http'
import {spawn} from 'child_process'
import Martini from 'martini'

class Server {
  constructor() {
    this.tasks  = {}
    this.envs   = {}
    this.active = {}
  }
  _tasks(name) {
    if (!this.tasks[name]) {
      this.tasks[name] = []
    }

    return this.tasks[name]
  }
  submitJob(job, {name}) {
    let {tasks} = job

    job.tasks.forEach(task => this._tasks(name).push(task))

    setImmediate(_ => this.check(name))
  }
  check(name) {
    // skip if already active
    if (this.active[name]) return

    let task = this._tasks(name).shift()

    if (task) this.run(name, task)
  }
  run(name, task) {
    let {exec, args} = task
    let {envs, active} = this

    exec = this._substr(exec)
    args = args.map(i => this._substr(i))

    let start = Date.now()

    let proc = spawn(exec, args, {stdio: 'inherit'})

    proc.on('error', function(err){
      console.log(`Error ${err}`)
    })

    proc.on('exit', function(exit, signal){
      let time = Date.now() - start

      envs.pid    = proc.pid
      envs.time   = time
      envs.exit   = exit
      envs.signal = signal

      active[name] = null

      setImmediate(check)
    })

    this.active[name] = proc

    var check = () => this.check(name)
  }
  _substr(string) {
    let {envs} = this

    return Object.keys(envs).reduce((curr, term) => {
      let re = new RegExp(`\\$${term}`, 'g')
      let ne = curr.replace(re, envs[term])

      return ne
    }, string)
  }
}

const rpc = Martini.New(jobSchema)
const router = rpc.getRouter(new Server())
const server = http.createServer(router)
const {
  PORT=8080,
  HOST='localhost'
} = process.env

server.listen(PORT, HOST, function(){
  console.log(`Server Listening: http://${HOST}:${PORT}/`)
})
