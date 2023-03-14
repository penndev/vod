import { exit } from "process"
import redis from "../src/redis/index.js"

const hash = async() => {
    const result = await redis.HSET("1","type","value")
    const data = await redis.HGETALL("1")
    console.log(result,data)
    exit()
}

hash()