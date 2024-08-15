import amqp from 'amqplib'
import config from './index.js'

const conn = await amqp.connect(config.amqpParse)

export default conn
