//This is to click the DOI link on the Scifinder "Other Sources" page, as this is always the prefered choice

var function_entered = false
chrome.runtime.sendMessage({message:"Requrest options"},
                           function (response)
                           {
                               let background_page_settings = response
                               // console.log(background_page_settings)
                               doi_nodes(document)
                               background_page_options_set(background_page_settings)
                           })

function get_DOI(text)
{
    const doi_reg = RegExp(/(10(?:\.\d+)+(?:\/[^\s&\/]+)+)/g)
    if (text.search('10.') !== -1 && doi_reg.test(text))
    {
        let re_ret = text.match(doi_reg)
        if (re_ret)
        {
            return re_ret[0]
        }

    }
}


function background_page_options_set(background_page_settings)
{
    if (!function_entered) // 不知道为什么这玩意儿会被进入两次
    {
        function_entered = true
        background_page_options = background_page_settings

        let walk = document.createTreeWalker(document);
        let title_node = undefined
        do
        {
            var node = walk.nextNode()
            if (node)
            {
                if (node.nodeType === 3 && node.textContent === "Web-based document resources")
                {
                    title_node = node
                    break
                }
            }

        } while (node)

        let available_resources_table = title_node.parentElement.parentElement.parentElement.parentElement.parentElement.nextElementSibling
        console.log(available_resources_table.getElementsByTagName('a'))
        for (let element of available_resources_table.getElementsByTagName('a'))
        {
            if ('href' in element)
            {
                let a_url = new URL(element['href'])

                let DOI_url = a_url.searchParams.get('URL')

                const doi_to_link = function(doi)
                {
                    let template = ""
                    if (get_dict_value(background_page_options, "pdf_link_radio_choice", 'sci-hub')==='sci-hub')
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

                let scihub_or_libgen_url = doi_to_link(get_DOI(DOI_url))

                console.log("Sending CreateTab Message:", {"CreateTab": scihub_or_libgen_url})
                chrome.runtime.sendMessage({"CreateTab": scihub_or_libgen_url});

                console.log("Clicking,",a_url)
                let url_processing_link = document.createElement('a');
                url_processing_link.href = a_url
                url_processing_link.click();
            }
        }
        chrome.runtime.sendMessage({switch_to_previous_tab: window.location.href});
    }

}