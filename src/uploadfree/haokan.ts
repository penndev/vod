const axios = require('axios') 
const bdsdk = require('@baiducloud/sdk') 

const BosClient = bdsdk.BosClient
const Cookie = "BDUSS=JoUFpEaEVlbW9tb2lRS1N1LUdpRUd-eVgtblNaRnRlVjdOT2tQTFltaExKdk5pRUFBQUFBJCQAAAAAAQAAAAEAAABmuMBgUGVubkRlYXIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEuZy2JLmctiSk"

export const upload = async (fileData: Buffer):Promise<string> => {
    const data = new URLSearchParams({ mediatype: "2" });
    let response = await axios({
        url: 'https://dream.haokan.com/creator/pcvodtoken',
        method: "post",
        data: data,
        headers: {
            "Referer": "https://dream.haokan.com",
            "Cookie": Cookie
        }
    })
    console.log("=============>", response)
    const authData = response.data.data
    const client = new BosClient({
        credentials: {
            ak: authData.ak,
            sk: authData.sk,
        },
        endpoint: "https://bj.bcebos.com",
        sessionToken: authData.token
    })

    const upResponse = await client.putObject(authData.coverImg.bucket, authData.coverImg.bosobject,fileData)
    console.log("<=============",upResponse)
    return "https://videopic.bdstatic.com" + authData.coverImg.bosobject
}