# vod

a vod codec cms

> 一个简单的在线编码（转码）后台管理系统

## 启动

- `npm run dev`

- `npm run serve`

## 配置

配置文件
- `.env`
- `src/config/index.ts`

## 功能实现说明

- 大文件分片上传

> `src\route\video.ts` 中 `uploadPart` 实现了传输控制使用 md5 进行文件校验。 使用redis进行持久控制。 


- 视频编码转换

> 依赖`ffmpeg`运行时进程管理实现视频编码工作。ffmpeg由工作系统自行安装配置。后台已经设置可以自行配置运行参数

## 依赖

[veadmin](https://github.com/penndev/veadmin)
> veadmin为本项目进行了完整的适配，本项目完成了接口部分，需要安装veadmin为后台管理客户端使用。

[ffmpeg](https://ffmpeg.org)
> 转码依赖于ffmpeg工具必须保证你运行代码的机器已经安装并可以执行ffmpeg命令和ffprobe命令

## 常用命令

- ffmpeg mp4转码为hls

> `ffmpeg -i in.mp4 -vcodec libx264 -acodec aac -hls_list_size 0 -hls_time 30 -hls_enc 1 -hls_enc_key 0123456789abcdef out.m3u8`

- hls标签备注

> `#EXT-X-DISCONTINUITY` -声明不连续

> `#EXT-X-KEY:METHOD=NONE` -声明不加密