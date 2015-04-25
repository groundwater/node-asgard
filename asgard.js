#!/usr/bin/env babel-node

import {jobSchema} from './schema.js'
import http from 'http'
import {spawn} from 'child_process'
import Martini from 'martini'

class Server {
  constructor() {
    this.tasks = []
    this.envs = {}
  }
  submitJob(job) {
    let {tasks} = job

    tasks.forEach(task => this.tasks.push(task))

    setImmediate(_ => this.check())
  }
  check() {
    let task = this.tasks.shift()

    if (task) this.run(task)
  }
  run(task) {
    let {exec, args} = task

    exec = this._substr(exec)
    args = args.map(i => this._substr(i))

    let start = Date.now()
    let proc = spawn(exec, args, {stdio: 'inherit'})

    proc.on('error', function(err){
      console.log(`Error ${err}`)
    })

    let {envs} = this

    proc.on('exit', function(exit, signal){
      let time = Date.now() - start

      envs.pid    = proc.pid
      envs.time   = time
      envs.exit   = exit
      envs.signal = signal

      setImmediate(check)
    })

    var check = () => this.check()
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
