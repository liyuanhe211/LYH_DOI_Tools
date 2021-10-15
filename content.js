
var ret_text_nodes = []
var ret_text_DOIs = []
var ret_href_nodes = []
var ret_href_DOIs = []
var processed_nodes = []
var DOI_to_remove = []
var background_page_options = {}


function match_doi(text)
{
    //匹配：
    // https://doi.org/10.1002/anie.202105092
    // 10.1021/acs.orglett.5b00297
    // 对wiley的特殊情况：https://doi.org/10.1002/1521-3773(20001117)39:22<3964::AID-ANIE3964>3.0.CO;2-C
    // 行文中的情况：《自然•化学》(Nature Chemistry, 2021, DOI: 10.1038/s41557-021-00778-z)。近日，2021年诺贝尔化学奖颁给了德国化学家本杰明·利斯特（Benjamin List），以及美国
    // 排除多余文字如"(blabla, DOI: 10.1021/acs.orglett.5b00297)"不要把括号吃进去
    // 排除中文字符和中文标点
    // 只有10.1002允许有括号
    // 括号必须在10.开头之后左右匹配
    //
    // 特殊情况举例：
    // https://chem.xmu.edu.cn/xwdt/kyzc.htm；
    // https://chem.xmu.edu.cn/info/1274/11287.htm；
    let doi_reg_all = RegExp(/(10(?:\.\d+)+(?:\/[^\s&\/]+)+)/g)

    if (text.search('10.') !== -1 && doi_reg_all.test(text))
    {
        let re_ret = text.match(doi_reg_all)
        if (re_ret)
        {
            let matched_doi = re_ret[0]
            matched_doi = matched_doi.split(/[^\x00-\x7F]/g,1)[0]
            // 如果不是wiley的，不允许出现括号
            if ((!matched_doi.startsWith('10.1002')) && (!matched_doi.startsWith('10.1016')))
            {
                matched_doi = matched_doi.split(/[()]/g,1)[0]
            }
            // 如果是10.1002开头或10.1016开头，自左向右匹配，直到第一个无左括号的右括号
            else
            {
                let cut = 0
                let matching_status = 0
                while(cut<matched_doi.length)
                {
                    if (matched_doi[cut]=='(')
                    {
                        matching_status++
                    }
                    if (matched_doi[cut]==')')
                    {
                        matching_status--
                    }
                    if (matching_status<0)
                    {
                        break
                    }
                    cut++
                }
                matched_doi = matched_doi.substr(0,cut)
            }
            return matched_doi
        }
    }

    // 为nature特意写一条，因为nature文章上半页生成不了链接
    // https://www.nature.com/articles/s41586-021-03878-5.pdf ==> 10.1038/s41586-021-03878-5
    if (window.location.href.startsWith('https://www.nature.com/articles/'))
    {
        let nature_doi_reg = RegExp(/articles\/([^\s&\/]+).pdf/g)
        let re_ret = nature_doi_reg.exec(text)
        if (re_ret)
        {
            let matched_doi = "10.1038/"+re_ret[1]
            return matched_doi
        }
    }
}

// function test_match_doi_function()
// {
//     console.log(match_doi('hahaha'))
//     console.log(match_doi('10.1021/acs.orglett.5b00297'))
//     console.log(match_doi('哈哈哈https://doi.org/10.1002/anie.202105092'))
//     console.log(match_doi('哈哈哈https://doi.org/10.1002/anie.202105092)'))
//     console.log(match_doi('https://doi.org/10.1002/anie.202105092'))
//     console.log(match_doi('10.1002/1521-3773(20001117)39:22<3964::AID-ANIE3964>3.0.CO;2-C'))
//     console.log(match_doi('https://doi.org/10.1002/1521-3773(20001117)39:22<3964::AID-ANIE3964>3.0.CO;2-C'))
//     console.log(match_doi('对wiley的特殊情况：https://doi.org/10.1002/1521-3773(20001117)39:22<3964::AID-ANIE3964>3.0.CO;2-C'))
//     console.log(match_doi('对wiley的特殊情况：https://doi.org/10.1002/1521-3773(20001117)39:22<3964::AID-ANIE3964>3.0.CO;2-C)'))
//     console.log(match_doi('《自然•化学》(Nature Chemistry, 2021, DOI: 10.1038/s41557-021-00778-z)。近日，2021年诺贝尔化学奖颁给了德国化学家本杰明·利斯特（Benjamin List），以及美国'))
//     console.log(match_doi("(blabla, DOI: 10.1021/acs.orglett.5b00297)"))
//     console.log(match_doi("DOI: 10.1021/acs.orglett.5b00297）"))
// }


function doi_nodes(html_content)
{
    let walk = document.createTreeWalker(html_content);
    do
    {
        var node = walk.nextNode()
        if (node)
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
                var href = node.getAttribute("href")
                let matched_doi = match_doi(decodeURIComponent(href))
                if (matched_doi)
                {
                    ret_href_nodes.push(node)
                    ret_href_DOIs.push(matched_doi)
                }
            }
        }

    } while (node)

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

            if (DOI1===DOI2)
                continue

            if (DOI2.startsWith(DOI1+'/'))
                DOI_to_remove.push(DOI2)

            if (DOI2.startsWith(DOI1+'?'))
                DOI_to_remove.push(DOI2)

            if (DOI2.startsWith(DOI1+'&'))
                DOI_to_remove.push(DOI2)

            if (DOI1.startsWith(DOI2+'/'))
                DOI_to_remove.push(DOI1)

            if (DOI1.startsWith(DOI2+'?'))
                DOI_to_remove.push(DOI1)

            if (DOI1.startsWith(DOI2+'&'))
                DOI_to_remove.push(DOI1)
        }
    }
    // console.log(DOI_to_remove)

}

function get_dict_value(dict,key,def)
{
    if (dict && key in dict)
    {
        return dict[key]
    }
    else
    {
        return def
    }
}

chrome.runtime.sendMessage({message:"Requrest options"},
                           function (response)
                           {
                               let background_page_settings = response
                               // console.log(background_page_settings)
                               doi_nodes(document)
                               background_page_options_set(background_page_settings)
                           })


chrome.runtime.onMessage.addListener(
    function (request,sender,response)
    {
        // alert(request)
        let re = RegExp('bear','gi')
        let re_ret = document.documentElement.innerHTML.match(re)
        response({count:re_ret.length})
    }
)

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


function background_page_options_set(background_page_settings)
{

    background_page_options = background_page_settings
    let sci_hub_url = get_dict_value(background_page_options, "scihub_link", 'https://sci-hub.se/[DOI]')
    let lib_gen_url = get_dict_value(background_page_options, "libgen_link", 'http://libgen.li/scimag/ads.php?doi=[DOI]&downloadname=[DOI_FILENAME]')

    const doi_to_link = function(doi)
    {
        let template = ""
        if (get_dict_value(background_page_options, "pdf_link_radio_choice", 'sci-hub')=='sci-hub')
        {
            template =  sci_hub_url
        }
        else
        {
            template =  lib_gen_url
        }
        regex = new RegExp(/[<>:"\/\\|?*%]/,'g')
        let download_filename = doi.replace(regex, '_') + '.pdf'
        let ret = template.replace(/\[DOI\]/g,doi).replace(/\[DOI_FILENAME\]/g,download_filename)
        return ret
    }


    const already_is_download_page = function()
    {
        //如果是Lib-Gen或者Sci-Hub的下载页，不再创建链接按钮
        let current_page_url = window.location.href
        if (current_page_url.startsWith(lib_gen_url.split(/[\[\]\?]/g)[0]))
        {
            return true
        }
        if (current_page_url.startsWith(sci_hub_url.split(/[\[\]\?]/g)[0]))
        {
            return true
        }
    }

    const create_download_icon = function(doi)
    {
        let a = document.createElement("a");
        let download_button_img_src = ""
        download_button_img_src = chrome.runtime.getURL("images/Download_button.png")
        a.setAttribute('href',doi_to_link(doi))
        let img = document.createElement("img");
        img.setAttribute("src", download_button_img_src)
        a.setAttribute('target',"_blank")
        img.setAttribute('style',"height:15px;")
        a.appendChild(img)
        a.onclick = function() {
            chrome.runtime.sendMessage({"CreateTab": doi_to_link(doi)});
            return false;
        }
        return a
    }
    let final_DOIs = []
    let final_DOIs_with_position = [] // for sorting the DOI so the DOI list has the same order as the document
    let final_DOIs_sorted = [] // for sorting the DOI so the DOI list has the same order as the document
    let x_mol_processed_links = [] // record which link has been processed by x-mol, there might be duplicated links

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
                if (!already_is_download_page())
                {
                    A.appendChild(create_download_icon(doi));
                    console.log("Download icon created", A, doi)
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

    for (let i=0;i<ret_href_nodes.length;i++)
    {
        let href_node = ret_href_nodes[i]
        let doi = ret_href_DOIs[i]
        let A = href_node
        if (DOI_to_remove.includes(doi))
        {
            // console.log("DOI removed", doi)
            continue
        }
        if (filter(A))
            continue
        if (! processed_nodes.includes(A))
        {
            if (!already_is_download_page())
            {
                let created_download_icon = create_download_icon(doi)
                A.appendChild(created_download_icon);

                // x-mol的https://www.x-mol.com/q页面的处理
                // x-mol页面上创建一个链接（因为x-mol自己的target不对），然后在自己的页面上打开期刊原文页面
                // 然后打开一个sci-hub或者lib-gen下载页面，打开它

                if (window.location.href.startsWith('https://www.x-mol.com/q'))
                {
                    if (x_mol_processed_links.indexOf(href_node['href']) === -1)
                    {
                        let aTags = document.getElementsByTagName("a");
                        let searchText = "已成功找到 , 正在跳转……";
                        for (tag of aTags)
                        {
                            if (tag.innerText.search(searchText) != -1)
                            {
                                console.log('haha')
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

    // console.log(final_DOIs,final_DOIs_with_position)
    final_DOIs_with_position.sort((a,b)=>a[0]-b[0])
    // console.log(final_DOIs,final_DOIs_with_position,final_DOIs_sorted)
    for (let i=0;i<final_DOIs_with_position.length;i++)
    {
        final_DOIs_sorted.push(final_DOIs_with_position[i][1])
    }

    // console.log(final_DOIs,final_DOIs_with_position,final_DOIs_sorted)
    chrome.runtime.sendMessage(
        {
            url:window.location.href,
            DOIs:final_DOIs_sorted
        }
    )
}


// process the 503 Service Temporarily Unavailable given by libgen,
// To wait a few second, re-launch the original libgen page, then, close the page itself

let libgen_503_regex = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/scimag\/get.php\?doi=(10(?:\.\d+)+\/[^\s&]+)/g
let libgen_503_url = window.location.href
if (libgen_503_url.search('10.') !== -1 && libgen_503_regex.test(libgen_503_url))
{
    if (document.getElementsByTagName('h1')[0].textContent.trim() ==="503 Service Temporarily Unavailable")
    {
        let re_ret = libgen_503_url.match(libgen_503_regex)
        if (re_ret && re_ret.length === 1)
        {
            let doi = (re_ret[0])
            template =  get_dict_value(background_page_options, "libgen_link", 'http://libgen.li/scimag/ads.php?doi=[DOI]&downloadname=[DOI_FILENAME]')
            regex = new RegExp(/[<>:"\/\\|?*%]/,'g')
            let download_filename = doi.replace(regex, '_') + '.pdf'
            pdf_link = template.replace(/\[DOI\]/g,doi).replace(/\[DOI_FILENAME\]/g,download_filename)
            const link = document.createElement('a');
            link.href = pdf_link;
            link.click();
        }
    }
}

function open_scihub_from_libgen_error()
{
    var doi_reg = RegExp(/(10(?:\.\d+)+\/[^\s&]+)/g)
    let libgen_not_found_link = window.location.href
    if (libgen_not_found_link.search('10.') !== -1 && doi_reg.test(libgen_not_found_link))
    {
        let re_ret = libgen_not_found_link.match(doi_reg)
        if (re_ret && re_ret.length === 1)
        {
            let doi = re_ret[0]
            template =  get_dict_value(background_page_options, "scihub_link", 'https://sci-hub.se/[DOI]')
            regex = new RegExp(/[<>:"\/\\|?*%]/,'g')
            let download_filename = doi.replace(regex, '_') + '.pdf'
            pdf_link = template.replace(/\[DOI\]/g,doi).replace(/\[DOI_FILENAME\]/g,download_filename)
            const link = document.createElement('a');
            link.href = pdf_link;
            link.click();
        }

    }
}

//process lib-gen book not found failure giving something like "
// Error
// Book with such MD5 hash isn't found 10.1002/anie.202105092 "
let libgen_link_match =  get_dict_value(background_page_options, "libgen_link", 'http://libgen.li/scimag/ads.php?doi=[DOI]&downloadname=[DOI_FILENAME]')
libgen_link_match = libgen_link_match.split(/\[DOI/g)[0]
if (window.location.href.startsWith(libgen_link_match))
{
    if (document.getElementsByTagName('h1')[0].textContent.trim()=='Error')
    {
        if (document.getElementsByTagName('h1')[0].nextElementSibling.textContent.trim().startsWith('Book with such MD5 hash isn'))
        {
            open_scihub_from_libgen_error()
        }
    }
}


//process lib-gen 502 failure giving something like "
// 502 Bad Gateway
libgen_link_match =  get_dict_value(background_page_options, "libgen_link", 'http://libgen.li/scimag/ads.php?doi=[DOI]&downloadname=[DOI_FILENAME]')
libgen_link_match = libgen_link_match.split(/\[DOI/g)[0]
if (window.location.href.startsWith(libgen_link_match))
{
    if (document.getElementsByTagName('h1')[0].textContent=='502 Bad Gateway')
    {
        open_scihub_from_libgen_error()
    }
}

//process lib-gen book not found failure giving something like "
// File not found in DB
if (window.location.href.startsWith("http://libgen."))
{
    if(document.getElementsByTagName('div').length)
    {
        if (document.getElementsByTagName('div')[0].className==='alert alert-danger')
        {
            if (document.getElementsByTagName('div')[0].innerText==='File not found in DB')
            {
                console.log('LibGen "File not found in DB" error triggered.')

                var doi_reg2 = RegExp(/(10(?:\.\d+)+\/[^\s&]+)/g)
                let libgen_not_found_link = window.location.href
                if (libgen_not_found_link.search('10.') !== -1 && doi_reg2.test(libgen_not_found_link))
                {
                    let re_ret = libgen_not_found_link.match(doi_reg2)
                    if (re_ret && re_ret.length === 1)
                    {
                        let doi = re_ret[0]
                        template =  get_dict_value(background_page_options, "scihub_link", 'https://sci-hub.se/[DOI]')
                        regex = new RegExp(/[<>:"\/\\|?*%]/,'g')
                        let download_filename = doi.replace(regex, '_') + '.pdf'
                        pdf_link = template.replace(/\[DOI\]/g,doi).replace(/\[DOI_FILENAME\]/g,download_filename)
                        const link = document.createElement('a');
                        link.href = pdf_link;
                        link.click();
                    }
                }
            }
        }
    }
}