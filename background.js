window.page_DOIs = {}
window.settings = {}
window.saved_doi_choices = {}
window.settings.pdf_link_radio_choice = 'lib-gen'
window.settings.libgen_link = 'http://libgen.li/ads.php?doi=[DOI]&downloadname=[DOI_FILENAME]'
window.settings.scihub_link = 'https://sci-hub.se/[DOI]'
window.switch_to_previous_list = []

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse)
    {
        window.page_DOIs[request.url] = request.DOIs
        if (request.message ==="Requrest options")
        {
            sendResponse(window.settings)
            console.log('sending response, ',window.settings)
        }
        if ("set_setting" in request)
        {
            window.settings[request.set_setting[0]]=request.set_setting[1]
            console.log("Bkg setting change received:",request.set_setting)
            console.log(window.settings)
        }
        if ("set_setting_if_not_exist" in request)
        {
            if (! request.set_setting_if_not_exist[0] in window.settings)
            {
                window.settings[request.set_setting_if_not_exist[0]]=request.set_setting_if_not_exist[1]
                console.log("Bkg setting change received:",request.set_setting_if_not_exist)
                console.log(window.settings)
            }
            else
            {
                console.log("Bkg setting change received, but already exist, so omitted:",request.set_setting_if_not_exist)
                console.log(window.settings)
            }
        }

        if ("save_doi_choice" in request)
        {
            let [page_url,doi,state] = request.save_doi_choice
            console.log(page_url in window.saved_doi_choices)
            window.saved_doi_choices[page_url] = window.saved_doi_choices[page_url] || {}
            window.saved_doi_choices[page_url][doi] = state
            console.log("save_doi_choice change received:",request.save_doi_choice)
            console.log(window.saved_doi_choices)
        }

        if ("CreateTab" in request)
        {
            let url_to_open = request["CreateTab"]
            console.log("Opening URL: ",url_to_open)
            chrome.tabs.create({url: url_to_open, active: false})
        }

        if(request.closeThis)
        {
            chrome.tabs.remove(sender.tab.id);
        }

        if (request.switch_to_previous_tab)
        {
            window.switch_to_previous_list.push(request.switch_to_previous_tab)
            chrome.tabs.query({active: true, currentWindow: true},
                              function (tabs)
                              {
                                  if(tabs.length)
                                  {
                                      let tab = tabs[0];
                                      let current_tab_url = tab.url;
                                      if (window.switch_to_previous_list.indexOf(current_tab_url)!==-1)
                                      {
                                          chrome.tabs.query({currentWindow: true},
                                                            function (tabsArray)
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

                              });


        }

    }
)

chrome.browserAction.onClicked.addListener(
    function (tab)
    {
        chrome.tabs.create({url: 'popup.html'})
    }
)


function set_dict_value(dict,key,value)
{
    dict[key]=value
    console.log("Dict value changed:",dict,key,value)
}

function set_dict_value_if_not_exist(dict,key,value)
{
    if (! key in dict)
    {
        set_dict_value(dict,key,value)
    }
}