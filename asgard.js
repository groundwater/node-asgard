#!/usr/bin/env babel-node

import {jobSchema} from './schema.js'
import http from 'http'
import {spawn} from 'child_process'
import Martini from 'martini'

class Server {
  constructor() {
    this.tasks = []
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
    let proc = spawn(exec, args, {stdio: 'inherit'})

    proc.on('error', function(err){
      console.log(`Error ${err}`)
    })

    proc.on('exit', function(code, signal){
      console.log(`Exited ${code}/${signal}`)

      setImmediate(check)
    })

    var check = () => this.check()
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
