// find "已成功找到 , 正在跳转……"

let aTags = document.getElementsByTagName("a");
let searchText = "已成功找到 , 正在跳转……";
let found_tag;

for (tag of aTags)
{
    if (tag.innerText.search(searchText)!=-1)
    {
        found_tag=tag
    }
}

let doi_link = found_tag.href
