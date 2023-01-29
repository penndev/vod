import { exit } from "process"
import redis from "../src/redis/index.js"

const hash = async() => {
    const result = await redis.HSET("1","type","value11")
    console.log(result)
    const data = await redis.HGETALL("1")
    console.log(data["types"])
    exit()
}

hash()

console.log("i am here..")