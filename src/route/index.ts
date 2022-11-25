import Router from "@koa/router"
import { captcha, login } from "./adminuser.js"
import { mediaList } from "./media.js"
import { queryTransCodec, submitTransCodec } from './transcodec.js'
import { uploadBefore, uploadPart } from "./upload.js"

const router = new Router({
    prefix: '/api'
})

router.get('/captcha', captcha)
router.post('/login', login)

// 处理文件上传
router.get('/media/list', mediaList)

router.post('/upload/before', uploadBefore)
router.put("/upload/part", uploadPart)

router.post('/job/submit', submitTransCodec)
router.get('/job/query', queryTransCodec)


export default router