
// hand written codes to filter-out situations where links will not be created
// returns true if it should be removed
function filter(A)
{
    if (window.location.href.startsWith("https://pubs.acs.org/"))
    {
        if (A.id ==='prevID' || A.id ==='nextID')
            return true
    }
    if (window.location.href.startsWith("https://pubs.acs.org/"))
    {
        if (A.href.search('/doi/suppl')!==-1)
            return true
    }
}

async function main()
{
    let ret_text_nodes = []
    let ret_text_DOIs = []
    let ret_href_nodes = []
    let ret_href_DOIs = []
    let processed_nodes = []

    // for filter through doi containing each other
    // e.g. remove 10.1021/acs.orglett.5b00297/suppl_file/ol5b00297_si_001.pdf if 10.1021/acs.orglett.5b00297 existed
    // while 10.1021/acs.orglett.5b002 should be kept even if 10.1021/acs.orglett.5b00 existed
    let DOI_to_remove = []

    // for filter through doi containing extra pieces
    // e.g. remove the #xxx part in 10.1021/acs.orglett.5b00297#title if 10.1021/acs.orglett.5b00297 existed
    // while 10.1021/acs.orglett.5b00297#title should be kept if 10.1021/acs.orglett.5b00297 doesn't exist
    // everywhere the key is recognized as DOI, it should be replaced with the value
    let DOI_to_replace = {}

    // walk over all objects to find all links or texts (strings) that contains doi

    let walk = document.createTreeWalker(document);
    let node = walk.nextNode()

    while (node)
    {
        // text nodes
        if (node.nodeType === 3 &&
            node.parentElement.tagName.toLowerCase() !== 'script' &&
            node.textContent.trim())
        {
            let text = node.textContent
            let matched_doi = match_doi(text)
            if (matched_doi)
            {
                ret_text_nodes.push(node)
                ret_text_DOIs.push(matched_doi)
            }
        }
        // link nodes
        else if (typeof node.getAttribute == "function" && node.getAttribute("href"))
        {
            let href = node.getAttribute("href")
            let matched_doi = match_doi(decodeURIComponent(href))
            if (matched_doi)
            {
                ret_href_nodes.push(node)
                ret_href_DOIs.push(matched_doi)
            }
        }
        node = walk.nextNode()
    }

    // filter through doi containing each other
    // e.g. remove 10.1021/acs.orglett.5b00297/suppl_file/ol5b00297_si_001.pdf if 10.1021/acs.orglett.5b00297 existed
    // while 10.1021/acs.orglett.5b002 should be kept even if 10.1021/acs.orglett.5b00 existed

    let all_DOIs = ret_href_DOIs.concat(ret_text_DOIs)
    for (let i=0;i<all_DOIs.length-1;i++)
    {
        let DOI1 = all_DOIs[i]
        if (DOI1 in DOI_to_remove)
        {
            continue
        }
        for (let j=i+1; j<all_DOIs.length;j++)
        {
            let DOI2 = all_DOIs[j]
            // console.log(DOI1,DOI2)
            if (DOI2 in DOI_to_remove)
                continue
            let redundant_doi_ret = redundant_doi(DOI1,DOI2)
            if (redundant_doi_ret)
            {
                DOI_to_remove.push(redundant_doi_ret)
            }

            let need_to_replace_doi_ret = need_to_replace_doi(DOI1,DOI2)
            if (need_to_replace_doi_ret)
            {
                DOI_to_replace[need_to_replace_doi_ret[0]] = need_to_replace_doi_ret[1]
            }
        }
    }

    let settings_storage = await get_storage("settings")

    for (let i=0;i<ret_text_DOIs.length;i++)
    {
        if ((ret_text_DOIs[i]) in DOI_to_replace)
        {
            ret_text_DOIs[i] = DOI_to_replace[ret_text_DOIs[i]]
        }
    }

    for (let i=0;i<ret_href_DOIs.length;i++)
    {
        if ((ret_href_DOIs[i]) in DOI_to_replace)
        {
            ret_href_DOIs[i] = DOI_to_replace[ret_href_DOIs[i]]
        }
    }


    // add the image buttons
    let final_DOIs = []
    let final_DOIs_with_position = [] // for sorting the DOI so the DOI list has the same order as the document
    let final_DOIs_sorted = [] // for sorting the DOI so the DOI list has the same order as the document
    let x_mol_processed_links = [] // record which link has been processed by x-mol, there might be duplicated links

    // add buttons for text nodes first
    for (let i=0;i<ret_text_nodes.length;i++)
    {
        let text_node = ret_text_nodes[i]
        if (text_node)
        {
            let doi = ret_text_DOIs[i]
            let A = text_node.parentElement

            if (DOI_to_remove.includes(doi))
            {
                continue
            }
            if (filter(A))
                continue

            if (! processed_nodes.includes(A))
            {
                // if it is already sci-hub or lib-gen page, there is no need to add the icons again
                if (!already_is_download_page())
                {
                    let download_icon_html = await create_download_icon(doi)

                    // check that there has a successful RegExp match, sometimes there isn't a match (special character in the DOI like https://onlinelibrary.wiley.com/doi/10.1002/1521-3773%2820001117%2939%3A22%3C3964%3A%3AAID-ANIE3964%3E3.0.CO%3B2-C) in that case, it will be just add to the end
                    if (A.innerHTML.match(RegExp(doi,'g')))
                        A.innerHTML = A.innerHTML.replace(RegExp(doi,'g'),doi+download_icon_html.outerHTML)
                    else
                        A.appendChild(download_icon_html)

                    // re-add the on-click function, as sometimes the on_click added in the create_download_icon seems to fail
                    let link_from_doi = await doi_to_link(doi)
                    if (A.getElementsByClassName('LYH_download_icon').length)
                    {
                        A.getElementsByClassName('LYH_download_icon')[0].onclick = function ()
                        {
                            chrome.runtime.sendMessage({"CreateTab": link_from_doi.toString()});
                            return false;
                        }
                    }
                }
                processed_nodes.push(A)
            }
            if (! final_DOIs.includes(doi))
            {
                final_DOIs.push(doi)
                final_DOIs_with_position.push([[].slice.call(document.getElementsByTagName("*")).indexOf(A),doi])
            }
        }

    }

    // then add buttons for the href nodes
    for (let i=0;i<ret_href_nodes.length;i++)
    {
        let href_node = ret_href_nodes[i]
        let doi = ret_href_DOIs[i]
        let A = href_node
        if (DOI_to_remove.includes(doi))
        {
            continue
        }
        if (filter(A))
            continue
        // 目前只允许每个strings出现一个doi
        if (! processed_nodes.includes(A))
        {
            if (!already_is_download_page())
            {
                let created_download_icon = await create_download_icon(doi)
                A.appendChild(created_download_icon);

                // x-mol的https://www.x-mol.com/q页面的特殊处理
                // x-mol页面上创建一个链接（因为x-mol自己的target不对），然后在自己的页面上打开期刊原文页面
                // 然后打开一个sci-hub或者lib-gen下载页面，打开它
                if (window.location.href.startsWith('https://www.x-mol.com/q'))
                {
                    if (x_mol_processed_links.indexOf(href_node['href']) === -1)
                    {
                        let aTags = document.getElementsByTagName("a");
                        let searchText = "已成功找到 , 正在跳转……";
                        for (let tag of aTags)
                        {
                            if (tag.innerText.search(searchText) !== -1)
                            {
                                let x_mol_article_link = document.createElement('a');
                                x_mol_article_link.href = href_node['href'];
                                x_mol_processed_links.push(href_node['href'])
                                x_mol_article_link.click();
                                chrome.runtime.sendMessage({"CreateTab": created_download_icon['href']});
                                break
                            }
                        }
                    }
                }
            }
            processed_nodes.push(A)
        }
        if (! final_DOIs.includes(doi))
        {
            final_DOIs.push(doi)
            final_DOIs_with_position.push([[].slice.call(document.getElementsByTagName("*")).indexOf(A),doi])
        }
    }

    // for sorting the DOI so the DOI list has the same order as the document
    final_DOIs_with_position.sort((a,b)=>a[0]-b[0])
    for (let i=0;i<final_DOIs_with_position.length;i++)
    {
        final_DOIs_sorted.push(final_DOIs_with_position[i][1])
    }

    // save DOIs find by current page for use in constructing the popup page
    chrome.runtime.sendMessage(
        {
            url:window.location.href,
            DOIs:final_DOIs_sorted
        }
    )


    // process the 503 Service Temporarily Unavailable given by libgen,
    // To wait a few second, re-launch the original libgen page, then, close the page itself
    // Reg Match: http://80.82.78.35/get.php?md5=68458db7f5e8d568e95f1dce4456f8fc&key=Q3CSU4OT8D8V6Q8F&doi=10.1021/ol901504p
    // Reg Match: http://80.82.78.35/scimag/get.php?doi=10.1021/ol901504p

    let libgen_503_regex = RegExp(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/(?:scimag\/)*get.php\?(?:.+=.+&)?doi=(10(?:\.\d+)+\/[^\s&]+)/g)
    let libgen_503_url = window.location.href
    if (libgen_503_regex.test(libgen_503_url))
    {
        if (document.getElementsByTagName('h1').length!==0 &&
            document.getElementsByTagName('h1')[0].textContent.trim() ==="503 Service Temporarily Unavailable")
        {
            let url_object = new URL(libgen_503_url)
            let libgen_503_doi = url_object.searchParams.get('doi')
            if (libgen_503_doi)
            {
                await open_libgen_from_DOI(libgen_503_doi)
            }
        }
    }

    //process lib-gen book not found failure giving something like "
    // Error
    // Book with such MD5 hash isn't found 10.1002/anie.202105092 "
    let libgen_link_match =  get_dict_value(settings_storage, "libgen_link", 'http://libgen.li/scimag/ads.php?doi=[DOI]&downloadname=[DOI_FILENAME]')
    libgen_link_match = libgen_link_match.split(/\[DOI/g)[0]
    if (window.location.href.startsWith(libgen_link_match) &&
        document.getElementsByTagName('h1').length &&
        document.getElementsByTagName('h1')[0].textContent.trim()==='Error' &&
        document.getElementsByTagName('h1')[0].nextElementSibling.textContent.trim().startsWith('Book with such MD5 hash isn')
        )
    {
        await open_scihub_from_libgen_error()
    }

    //process lib-gen 502 failure giving something like "
    // 502 Bad Gateway
    libgen_link_match =  get_dict_value(settings_storage, "libgen_link", 'http://libgen.li/scimag/ads.php?doi=[DOI]&downloadname=[DOI_FILENAME]')
    libgen_link_match = libgen_link_match.split(/\[DOI/g)[0]
    if (window.location.href.startsWith(libgen_link_match) &&
        document.getElementsByTagName('h1').length &&
        document.getElementsByTagName('h1')[0].textContent=='502 Bad Gateway'
        )
    {
        await open_scihub_from_libgen_error()
    }

    //process lib-gen book not found failure giving something like "
    // File not found in DB
    if (window.location.href.startsWith("http://libgen.") &&
        document.getElementsByTagName('div').length &&
        document.getElementsByTagName('div')[0].className==='alert alert-danger' &&
        document.getElementsByTagName('div')[0].innerText==='File not found in DB')
    {
        //console.log('LibGen "File not found in DB" error triggered.')

        const doi_reg2 = RegExp(/(10(?:\.\d+)+\/[^\s&]+)/g)
        let libgen_not_found_link = window.location.href
        if (libgen_not_found_link.search('10.') !== -1 && doi_reg2.test(libgen_not_found_link))
        {
            let re_ret = libgen_not_found_link.match(doi_reg2)
            if (re_ret && re_ret.length === 1)
            {
                await open_libgen_from_DOI(re_ret[0])
            }
        }
    }
}

// for the shortcut x-mol search thing
chrome.runtime.onMessage.addListener(x_mol_request_listener)
main()



// // Add download button to scifinder page.
// // This actually doesn't do anything, it's just a signifier that there are some special function added to scifinder
// // ALso, Scifinder actually doesn't create the fulltext buttons on page load, it actually gives a call like
// // https://scifinder.cas.org/scifinder/view/text/refList.jsf?nav=eNpb85aBtYSBMbGEQcXCzdTRwtXZJcLCzM3Y1NDEOcLU0cXcyMTCxMTQ1cLV2MzY0QmoNKm4iEEwK7EsUS8nMS9dzzOvJDU9tUjo0YIl3xvbLZgYGD0ZWMsSc0pTK4oYBBDq_Epzk1KL2tZMleWe8qCbiYGhooCBgYEJaGBGCYO0Y2iIh39QvKdfmKtfCJDh5x_vHuQfGuDp517CwJmZW5BfVAI0obiQoY6BGahND6gvH8ZjYCxhYCoqQ3WXU35-Tmpi3lmFooarc369A7orCuauAgYAsFdJyg&sortKey=ACCESSION_NUMBER&sortOrder=DESCENDING
// // then the response has the full text buttons.
// // I don't know how to run function after certain element as appeared, so this function is run 2 times a second until a full text button is seen
//
// let timer_id = -1
//
// function add_scifinder_download_icons()
// {
//     let full_text_objects = window.document.getElementsByClassName('fullTextQuickLink')
//     console.log("Scifinder Alarm Triggered:",full_text_objects)
//     if (full_text_objects.length!==0)
//     {
//         clearInterval(timer_id)
//         for (let element of full_text_objects)
//         {
//             console.log(element)
//             let img = document.createElement("img");
//             img.setAttribute("src", download_button_img_src)
//             img.setAttribute('style', "height:15px;")
//             element.appendChild(img);
//             console.log(element)
//         }
//     }
// }
//
// if (window.location.href.search('scifinder/view/scifinder/scifinderExplore.jsf')!==-1)
// {
//     timer_id = setInterval(add_scifinder_download_icons,500)
// }

