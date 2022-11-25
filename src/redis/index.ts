import { createClient } from 'redis';
import config from '#config/index.js';

const client = createClient({
    url: config.rdsuri,
})


client.on('error', (err) => console.log('Redis Client Error', err))

await client.connect();


export default client