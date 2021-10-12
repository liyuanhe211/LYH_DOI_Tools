
var ret_text_nodes = []
var ret_text_DOIs = []
var ret_href_nodes = []
var ret_href_DOIs = []
var processed_nodes = []
var DOI_to_remove = []
var background_page_options = {}


function doi_nodes(html_content)
{
    var doi_reg = RegExp(/(10(?:\.\d+)+(?:\/[^\s&\/]+)+)/g)
    let walk = document.createTreeWalker(html_content);
    do
    {
        var node = walk.nextNode()
        if (node)
        {
            if (node.nodeType === 3 &&
                node.parentElement.tagName.toLowerCase() !== 'script' &&
                node.textContent.trim())
            {
                let text = node.textContent
                if (text.search('10.') !== -1 && doi_reg.test(text))
                {
                    let re_ret = text.match(doi_reg)
                    if (re_ret)
                    {
                        // if (re_ret.length === 1)
                        // {
                        ret_text_nodes.push(node)
                        ret_text_DOIs.push(re_ret[0])
                        // }
                        // else
                        // {
                        //     console.log('>>>>', node.textContent, 'Multiple Match Result')
                        // }
                    }

                }
            }
            else if (typeof node.getAttribute == "function" && node.getAttribute("href"))
            {
                var href = node.getAttribute("href")
                if (href.search('10.') !== -1 && doi_reg.test(href))
                {
                    let re_ret = href.match(doi_reg)
                    if (re_ret)
                    {
                        // if (re_ret.length === 1)
                        // {
                        ret_href_nodes.push(node)
                        ret_href_DOIs.push(re_ret[0])
                        // }
                        // else
                        // {
                        //     console.log('>>>>', node.textContent, node.getAttribute("href"), 'Multiple Match Result')
                        // }
                    }
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

            if (DOI1.startsWith(DOI2+'/'))
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

    const doi_to_link = function(doi)
    {
        let template = ""
        if (get_dict_value(background_page_options, "pdf_link_radio_choice", 'sci-hub')=='sci-hub')
        {
            template =  get_dict_value(background_page_options, "scihub_link", 'https://sci-hub.se/[DOI]')
        }
        else
        {
            template =  get_dict_value(background_page_options, "libgen_link", 'http://libgen.li/scimag/ads.php?doi=[DOI]&downloadname=[DOI_FILENAME]')
        }
        regex = new RegExp(/[<>:"\/\\|?*%]/,'g')
        let download_filename = doi.replace(regex, '_') + '.pdf'
        let ret = template.replace(/\[DOI\]/g,doi).replace(/\[DOI_FILENAME\]/g,download_filename)
        return ret
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
        return a
    }
    let final_DOIs = []
    let final_DOIs_with_position = [] // for sorting the DOI so the DOI list has the same order as the document
    let final_DOIs_sorted = [] // for sorting the DOI so the DOI list has the same order as the document

    for (let i=0;i<ret_text_nodes.length;i++)
    {
        // console.log('a',i)
        let text_node = ret_text_nodes[i]
        if (text_node)
        {
            let doi = ret_text_DOIs[i]
            let A = text_node.parentElement

            if (DOI_to_remove.includes(doi))
            {
                // console.log("DOI removed", doi)
                continue
            }
            if (filter(A))
                continue

            if (! processed_nodes.includes(A))
            {
                A.appendChild(create_download_icon(doi));
//            A.appendChild(create_download_icon(doi,'lib-gen'));
                console.log("Download icon created", A, doi)
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
            A.appendChild(create_download_icon(doi));
//            A.appendChild(create_download_icon(doi,'lib-gen'));
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