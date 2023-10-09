// pick the found URL for the current window, and list them with links and download buttons
async function add_doi_urls(active_window_url)
{
    //console.log("Current Page URL:",active_window_url)
    // Get sci-hub address for "Sci-hub this page" button
    let settings_storage = await get_storage('settings')
    let scihub_domain = new URL(settings_storage.scihub_link.split('[')[0])
    document.getElementById('Sci_HUB_this_page').addEventListener('click', function ()
    {
        let url_processing = new URL(active_window_url)
        url_processing.hostname = url_processing.hostname + '.' + scihub_domain.hostname
        chrome.runtime.sendMessage({"CreateTab": url_processing.href});
        location.replace(url_processing.href)
    })

    document.getElementById('batch_ref_query').addEventListener('click', function ()
    {
        chrome.runtime.sendMessage({"CreateTab": "https://apps.crossref.org/SimpleTextQuery"});
    })

    document.getElementById('download_by_DOI').addEventListener('keydown', async function (keyPress)
    {
        if(keyPress.keyCode == 13) {
            let DOI_input = document.getElementById('download_by_DOI').value
            let link_from_doi = await doi_to_link(DOI_input)
            chrome.runtime.sendMessage({"CreateTab": link_from_doi});
        }
    })

    // add links for every doi on the page
    // let page_DOIs_storage = await get_storage('page_DOIs')
    let has_links = false

    let current_page_DOIs = await get_page_DOIs(active_window_url)
    if (current_page_DOIs.length!==0)
    {
        // console.log(current_page_DOIs)
        console.log("Number of DOIs found on this page:",current_page_DOIs.length)
        for (let doi of current_page_DOIs)
        {
            console.log("Creating entry:",doi)
            has_links = true
            let input = document.createElement('input')
            input.type = 'checkbox'
            input.value = doi
            input.id = doi
            input.onmouseover = function ()
            {
                // console.log("mouse over")
                // console.log(window.mouseDown)
                if (window.mouseDown)
                {
                    input.checked = !input.checked
                }
            }
            input.classList.add("largerCheckbox")
            input.checked = await get_doi_select_state(active_window_url, doi)
            // when the selection state has changed, save the result to sync storage
            input.addEventListener("change", async function (event)
            {
                let state = event.currentTarget.checked
                let doi = event.currentTarget.id
                let saved_doi_choices_storage = await get_storage("saved_doi_choices")
                saved_doi_choices_storage[active_window_url] = saved_doi_choices_storage[active_window_url] || {}
                saved_doi_choices_storage[active_window_url][doi] = state
                console.log(saved_doi_choices_storage)
                await set_storage({saved_doi_choices:saved_doi_choices_storage})
                console.log("save_doi_choice required:", active_window_url, doi, state)
            })


            let label = document.createElement('a')
            label.textContent = doi
            label.href = 'https://dx.doi.org/' + doi
            label.setAttribute("style","font-size:12px;line-height:13px")
            label.onclick = function ()
            {
                chrome.runtime.sendMessage({"CreateTab": 'https://dx.doi.org/' + label.textContent});
                return false;
            }

            let icon = await create_download_icon(label.textContent)
            let br = document.createElement('br')
            document.getElementById('DOI_links_cell').appendChild(input)
            document.getElementById('DOI_links_cell').appendChild(icon)
            document.getElementById('DOI_links_cell').appendChild(label)
            document.getElementById('DOI_links_cell').appendChild(br)
        }
    }

    if (!has_links)
    {
        document.getElementById('DOI_status_cell').innerHTML="No DOI found in this page (yet)"
        document.getElementById('DOI_status').style.display = "";
        document.getElementById("Selection_Row").style.display = "none"
        document.getElementById("Batch_Button_Row").style.display = "none"
    }
    else
    {
        document.getElementById('DOI_status').style.display = "none"
        document.getElementById("Selection_Row").style.display = ""
        document.getElementById("Batch_Button_Row").style.display = ""
    }
}

// read the stored setting, then apply to the webpage
async function main()
{
    let settings_storage = await get_storage('settings')
    let pdf_link_radio_choice = settings_storage["pdf_link_radio_choice"]
    let scihub_link = settings_storage["scihub_link"]
    let libgen_link = settings_storage["libgen_link"]

    document.getElementById('scihub_domain').value = scihub_link
    document.getElementById('libgen_domain').value = libgen_link
    if (pdf_link_radio_choice === 'sci-hub')
    {
        document.getElementById('scihub_radio').checked = true
    }
    else
    {
        document.getElementById('libgen_radio').checked = true
    }
}

main()
    // .then(function (messages) {console.log(messages)})
