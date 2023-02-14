# vod

VOD CODEC CMS

> 一个简单的在线编码（转码）后台管理系统


## 启动

- 启动开发服务器（http服务，队列，数据库打印等）

        npm run dev 

- 启动生产koa http服务

        npm run serve

-  启动生产bull 后台队列

        npm run queue


## 配置

配置文件 `src/config/index.ts`

## 依赖

[veadmin](https://github.com/penndev/veadmin)
> veadmin为本项目进行了完整的适配，本项目完成了接口部分，需要安装veadmin为后台管理客户端使用。

[ffmpeg](https://ffmpeg.org)
> 转码依赖于ffmpeg工具必须保证你运行代码的机器已经安装并可以执行ffmpeg命令和ffprobe命令




