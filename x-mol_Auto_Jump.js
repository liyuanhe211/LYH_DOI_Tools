// x-mol的https://www.x-mol.com/q页面的特殊处理
// x-mol页面上创建一个链接（因为x-mol自己的target不对），然后在自己的页面上打开期刊原文页面
// 然后打开一个sci-hub或者lib-gen下载页面，打开它
async function main()
{
    console.log("Triggered")
    let aTags = document.getElementsByTagName("a");
    let searchText = "已成功找到 , 正在跳转……";
    for (let tag of aTags)
    {
        if (tag.innerText.search(searchText) !== -1)
        {
            chrome.runtime.sendMessage({"CreateTab": tag['href']});
            setTimeout(function ()
                {
                    chrome.runtime.sendMessage({"closeThis":true})
                },
                500);
            let doi = match_doi(tag['href'])
            if (doi)
            {
                console.log(doi)
                chrome.runtime.sendMessage({"CreateTab": await doi_to_link(doi)});
            }
            break
        }
    }
}

main()