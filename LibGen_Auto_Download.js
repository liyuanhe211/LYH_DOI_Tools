// click the "GET" button on the Lib-Gen page, if it's not exist, do nothing (note there are several other actions in the content script)
async function main()
{
    let background_page_options = await get_storage('settings')
    let hide_sci_hub = get_dict_value(background_page_options, "hide_scihub_or_libgen", true)

    let GET_match = document.getElementsByTagName('h2')

    if (GET_match)
    {
        for (i of GET_match)
        {
            if (i.textContent == 'GET')
            {
                i.parentElement.click()
                i.innerHTML = '<p style="font-size:70%;">PDF download auto-started by LYH DOI Tools...</p>' +
                    '<p style="font-size:70%;">This page will (probably) self-destruct in 10 seconds...</p>' +
                    '<p style="font-size:50%;">Cancel this by unchecking the "Auto hide Sci-Hub or Lib-Gen page" option in the popup page</p>'
                if(hide_sci_hub)
                {
                    console.log("Page will close in 10 seconds...")
                    setTimeout(function ()
                               {
                                   chrome.runtime.sendMessage({closeThis: true});
                               },
                               10000);
                }
                break
            }
        }

        if(hide_sci_hub)
        {
            chrome.runtime.sendMessage({switch_to_previous_tab: window.location.href});
        }
    }
}

main()