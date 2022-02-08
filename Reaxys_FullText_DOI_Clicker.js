//This is to click the DOI link on the Reaxys "Full Text" page, as this is always the prefered choice

let function_entered = false;

async function main()
{
    if (!function_entered) // 不知道为什么这玩意儿会被进入两次
    {
        function_entered = true

        // let settings_storage = get_storage('settings')

        let walk = document.createTreeWalker(document);
        let doi_node = undefined
        let node = undefined
        do
        {
            node = walk.nextNode()
            if (node)
            {
                if (node.nodeType === 3 && node.textContent.trim() === "DOI" && node.parentElement.classList.contains("t3d1"))
                {
                    doi_node = node
                    break
                }
            }

        } while (node)

        let DOI = node.parentElement.nextElementSibling.textContent
        let scihub_or_libgen_url = await doi_to_link(match_doi(DOI))
        chrome.runtime.sendMessage({"CreateTab": scihub_or_libgen_url});
        location.replace("https://dx.doi.org/"+DOI)
        chrome.runtime.sendMessage({switch_to_previous_tab: window.location.href});
    }

}

main()