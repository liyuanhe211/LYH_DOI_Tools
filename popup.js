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
        let url_processing_link = document.createElement('a');
        url_processing_link.href = url_processing.href;
        chrome.runtime.sendMessage({"CreateTab": url_processing.href});
        url_processing_link.click();
    })

    // add links for every doi on the page
    let page_DOIs_storage = await get_storage('page_DOIs')
    let has_links = false
    if (active_window_url in page_DOIs_storage)
    {
        console.log(page_DOIs_storage[active_window_url])
        console.log(page_DOIs_storage[active_window_url].length)
        for (let doi of page_DOIs_storage[active_window_url])
        {
            console.log(doi)
            has_links = true
            let input = document.createElement('input')
            input.type = 'checkbox'
            input.value = doi
            input.id = doi
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
            label.onclick = function ()
            {
                chrome.runtime.sendMessage({"CreateTab": 'https://dx.doi.org/' + label.textContent});
                return false;
            }

            let img_button = document.createElement('a')
            let download_button_img_src = ""
            download_button_img_src = chrome.runtime.getURL("images/Download_button.png")
            let link_from_doi = await doi_to_link(label.textContent)
            img_button.setAttribute('href', link_from_doi)
            let img = document.createElement("img");
            img.setAttribute("src", download_button_img_src)
            img.setAttribute('style', "height:15px;")
            img_button.appendChild(img)
            img_button.onclick = function ()
            {
                chrome.runtime.sendMessage({"CreateTab": link_from_doi});
                return false;
            }

            let br = document.createElement('br')
            document.getElementById('DOIs').appendChild(input)
            document.getElementById('DOIs').appendChild(img_button)
            document.getElementById('DOIs').appendChild(label)
            document.getElementById('DOIs').appendChild(br)
        }
    }

    if (!has_links)
    {
        document.getElementById("LinkButtons").style.visibility = 'hidden'
        document.getElementById("No_DOI").style.visibility = 'visible'
    }
    else
    {
        document.getElementById("LinkButtons").style.visibility = 'visible'
        document.getElementById("No_DOI").style.visibility = 'hidden'
    }
}

// read the stored setting, then apply to the webpage
async function main()
{
    let settings_storage = await get_storage('settings')
    let pdf_link_radio_choice = get_dict_value(settings_storage, "pdf_link_radio_choice", 'sci-hub')
    let scihub_link = get_dict_value(settings_storage, "scihub_link", 'https://sci-hub.se/[DOI]')
    let libgen_link = get_dict_value(settings_storage, "libgen_link", 'http://libgen.li/scimag/ads.php?doi=[DOI]&downloadname=[DOI_FILENAME]')

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

document.getElementById("libgen_domain").addEventListener('input', libgen_domain_changed);
document.getElementById("libgen_domain").addEventListener('propertychange', libgen_domain_changed);
document.getElementById("scihub_domain").addEventListener('input', scihub_domain_changed);
document.getElementById("scihub_domain").addEventListener('propertychange', scihub_domain_changed);
document.getElementById("select_all").addEventListener("click", select_all, false);
document.getElementById("select_none").addEventListener("click", select_none, false);
document.getElementById("toggle_all").addEventListener("click", toggle_all, false);
document.getElementById("launch").addEventListener("click", launch, false);
document.getElementById("open_articles").addEventListener("click", open_articles, false);
document.getElementById("scihub_radio").addEventListener("click", scihub_radio_clicked);
document.getElementById("libgen_radio").addEventListener("click", libgen_radio_clicked);
document.getElementById("hide_scihub_or_libgen").addEventListener("click", hide_scihub_or_libgen_clicked);
document.addEventListener('DOMContentLoaded', function ()
{
    getCurrentTabUrl(async function (url)
                     {
                         await add_doi_urls(url);
                     });
});

main().then(function (messages) {console.log(messages)})