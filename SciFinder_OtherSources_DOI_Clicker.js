//This is to click the DOI link on the Scifinder "Other Sources" page, as this is always the prefered choice

let function_entered = false;

async function main()
{
    if (!function_entered) // 不知道为什么这玩意儿会被进入两次
    {
        function_entered = true

        let settings_storage = get_storage('settings')

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
        for (let element of available_resources_table.getElementsByTagName('a'))
        {
            if ('href' in element)
            {
                let a_url = new URL(element['href'])
                let DOI_url = a_url.searchParams.get('URL')
                let scihub_or_libgen_url = await doi_to_link(match_doi(DOI_url))
                chrome.runtime.sendMessage({"CreateTab": scihub_or_libgen_url});
                location.replace(a_url.href)
            }
        }
        chrome.runtime.sendMessage({switch_to_previous_tab: window.location.href});
    }

}

main()