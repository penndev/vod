import { createClient } from 'redis';
import config from '../config/index.js';

const redis = createClient({
    url: config.rdsuri,
})

redis.on('error', (err) => console.log('redis connection fail[ %s ]', err))

await redis.connect();

export default redis