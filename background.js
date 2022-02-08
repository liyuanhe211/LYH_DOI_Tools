importScripts('./lib.js')

// set default storage variables
async function initialization()
{
    chrome.contextMenus.create({id:"x_mol_ref_Search",
                                   title: "Open and Download Selected Citation (Ctrl+Shift+S)",
                                   contexts:["selection"]});

    let default_settings = {}
    default_settings.pdf_link_radio_choice = 'lib-gen'
    // default_settings.libgen_link = 'http://libgen.li/ads.php?doi=[DOI]&downloadname=[DOI_FILENAME]'
    default_settings.libgen_link = 'https://cdn1.booksdl.org/ads.php?doi=[DOI]'
    default_settings.scihub_link = 'https://sci-hub.se/[DOI]'
    default_settings.hide_scihub_or_libgen = true

    await set_storage({settings:default_settings})
    // await set_storage({page_DOIs:{}})
    await set_storage({page_DOIs_url_list:[]}) // a list to store in sequence the last stored URLs, due to Chrome limits, there will be only 50 items stored in the page DOI
    await set_storage({saved_doi_choices:{}})
    await set_storage({switch_to_previous_list: []})
    // await set_storage({error_log:[]})
}

chrome.runtime.onInstalled.addListener(initialization);


// Event processor for all content.js messages
async function event_listener(request, sender, sendResponse)
{
    // save DOIs found in one page
    if ("url" in request)
    {
        // let page_DOIs_storage = await get_storage("page_DOIs")
        let page_DOIs_url_list_storage = await get_storage('page_DOIs_url_list')
        if (page_DOIs_url_list_storage.indexOf(request.url)!==-1)
        {
            page_DOIs_url_list_storage.splice(page_DOIs_url_list_storage.indexOf(request.url),1)
        }
        let set_storage_obj = {}
        set_storage_obj[request.url] = request.DOIs
        await set_storage(set_storage_obj)
        page_DOIs_url_list_storage.push(request.url)
        if (page_DOIs_url_list_storage.length>50)
        {
            let page_to_remove = page_DOIs_url_list_storage.shift()
            await remove_storage(page_to_remove)
        }
        await set_storage({page_DOIs_url_list:page_DOIs_url_list_storage})
        console.log("Used storage:",await chrome.storage.sync.getBytesInUse(null))
    }

    // create tab from background, this will prevent tab switching
    if ("CreateTab" in request)
    {
        let url_to_open = request["CreateTab"]
        console.log("Opening URL: ",url_to_open)
        await chrome.tabs.create({url: url_to_open, active: false})
    }

    // close current tab
    if(request.closeThis)
    {
        await chrome.tabs.remove(sender.tab.id);
    }

    // effectively hide a tab by switching to previous one
    if (request.switch_to_previous_tab)
    {
        let switch_to_previous_list_storage = await get_storage("switch_to_previous_list")
        switch_to_previous_list_storage.push(request.switch_to_previous_tab)
        // this list kept which tab should be allowed to be switch away, such that it will not switch away from normal tabs if the user has switched before the script could react
        await set_storage({switch_to_previous_list:switch_to_previous_list_storage})

        chrome.tabs.query({active: true, currentWindow: true},
                          function (tabs)
                          {
                              if(tabs.length)
                              {
                                  let tab = tabs[0];
                                  let current_tab_url = tab.url;
                                  if (switch_to_previous_list_storage.indexOf(current_tab_url)!==-1)
                                  {
                                      chrome.tabs.query({currentWindow: true},(tabsArray)=>
                                      {
                                          // If only 1 tab is present, do nothing.
                                          if (tabsArray.length === 1) return;
                                          // Otherwise switch to the previous available tab.
                                          // Find index of the currently active tab.
                                          let sender_tab_index = null;
                                          tabsArray.forEach(function (tab, index)
                                                            {
                                                                if (tab.id === sender.tab.id)
                                                                    sender_tab_index = index;
                                                            });

                                          // Switch to the previous tab.
                                          chrome.tabs.update(tabsArray[(sender_tab_index - 1) % tabsArray.length].id, {
                                              active: true
                                          });
                                      });
                                  }
                              }

                          })
    }
}


chrome.runtime.onMessage.addListener(event_listener)
chrome.action.onClicked.addListener(
    function (tab)
    {
        chrome.tabs.create({url: 'popup.html'})
    }
)

function x_mol_search(keyword)
{
    chrome.tabs.create({url: "https://www.x-mol.com/q?option="+keyword, active: false});
}

//context menu event
chrome.contextMenus.onClicked.addListener(
    function (info, tab)
    {
        if (info.menuItemId === "x_mol_ref_Search")
        {
            x_mol_search(info.selectionText)
        }
    });

//short cut event
chrome.commands.onCommand.addListener((command) => {
    if (command === "x_mol_search")
    {
        //console.log('short cut detected')

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            chrome.tabs.sendMessage(tabs[0].id, {x_mol_search:true});
        });
    }
});
