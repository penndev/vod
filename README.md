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

## 依赖

[veadmin](https://github.com/penndev/veadmin)
> veadmin为本项目进行了完整的适配，本项目完成了接口部分，需要安装veadmin为后台管理客户端使用。

[ffmpeg](https://ffmpeg.org)
> 转码依赖于ffmpeg工具必须保证你运行代码的机器已经安装并可以执行ffmpeg命令和ffprobe命令

## mp4 to hls
> `ffmpeg -i in.mp4 -vcodec libx264 -acodec aac -hls_list_size 0 -hls_time 30 -hls_enc 1 -hls_enc_key 0123456789abcdef out.m3u8`

