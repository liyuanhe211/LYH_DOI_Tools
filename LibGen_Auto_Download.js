

chrome.runtime.sendMessage({message:"Requrest options"},
                           function (response)
                           {
                               let background_page_settings = response
                               // console.log(background_page_settings)
                               doi_nodes(document)
                               background_page_options_set(background_page_settings)
                           })

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

function background_page_options_set(background_page_settings)
{

    background_page_options = background_page_settings
    let hide_sci_hub = get_dict_value(background_page_options, "hide_scihub_or_libgen", true)


    // console.log('a')
    let GET_match = document.getElementsByTagName('h2')

    if (GET_match)
    {
        // console.log('b')
        for (i of GET_match)
        {
            // console.log('c')
            if (i.textContent == 'GET')
            {
                // console.log('d')
                i.parentElement.click()
                // console.log('e')
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