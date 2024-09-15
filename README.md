# VOD

> 一个简单的媒体编码（转码）web管理系统

## 运行配置

1. 配置:
    ```
    cp .env.sample .env 
    ```

2. 启动：
    ```
    - 开发环境
    npm run dev // 开发默认启动数据库migrate和queue队列

    - 正式环境 
    npm run serve // 运行开发接口
    npm run queue // 运行转码进程

## 功能说明

**媒体转码原理**
> 用`node`封装`ffmpeg`与`ffprobe`命令实现视频编码转换。`ffprobe`来进行视频信息识别。`ffmpeg`和`ffprobe`需要自行安装并配置在 **环境变量** 中（可以直接在命令行使用ffmpeg ffprobe命令）

**文件上传**
> 以上功能实现原理为首先对文件进行`md5`计算然后将文件分割逐次上传，最后在合并进行`md5`计算并对比结果。
- 切片上传：对大文件进行分割，防止上传一半网络波动引起整体失败。
- 断点续传：如果上传一半中断了，再次上传则从redis中获取上次传输的位置继续。
- 文件校验：依赖`md5`算法来保证文件传输前后的一致性,判断上传状态。
- 文件秒传：根据`md5`的hash值来查看服务器是否已经上传过本文件。
- 媒体预览：上传的媒体文件预览，通常类mp4类媒体需要http range 支持。

**转码队列**
> 基于`rabbitmq`进行异步队列[处理](src\queue\transcode_work.ts),通过`rabbitmq`的`prefetch`参数来配置并发进程。

RabbitMQ [WEB管理界面](https://www.rabbitmq.com/docs/management) 来查看队列详情

转码会有以下问题：
1. 进度与日志：操作日志与进度通过redis来更新，`key`为`transcode:log:${taskId}` 日志 `transcode:progress:${taskId}` 进度 。
2. 多节点配合...
3. 输出文件处理...

**后台管理**
> 完善的后台管理的常见功能
- 管理员
- 访问权限
- 请求日志

## 依赖
- [ffmpeg](https://ffmpeg.org)：`ffmpeg`和`ffprobe`命令,为项目运行的基石。
- [veadmin](https://github.com/penndev/veadmin)：安装veadmin为本项目的操作UI。
