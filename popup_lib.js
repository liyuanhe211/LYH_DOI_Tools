
async function hide_scihub_or_libgen_clicked()
{
    await set_bkg_settings("hide_scihub_or_libgen", document.getElementById("hide_scihub_or_libgen").checked)
}

async function scihub_radio_clicked()
{
    await set_bkg_settings("pdf_link_radio_choice", 'sci-hub')
}

async function libgen_radio_clicked()
{
    await set_bkg_settings("pdf_link_radio_choice", 'lib-gen')
}

async function libgen_domain_changed()
{
    await set_bkg_settings("libgen_link", document.getElementById("libgen_domain").value)
}

async function scihub_domain_changed()
{
    await set_bkg_settings("scihub_link", document.getElementById("scihub_domain").value)
}

function select_all()
{
    for (let checkbox of document.getElementById('DOIs').getElementsByTagName('input'))
    {
        checkbox.checked = true;
    }
}

function select_none()
{
    for (let checkbox of document.getElementById('DOIs').getElementsByTagName('input'))
    {
        checkbox.checked = false;
    }
}

function toggle_all()
{
    for (let checkbox of document.getElementById('DOIs').getElementsByTagName('input'))
    {
        checkbox.checked = !checkbox.checked;
    }
}

function launch()
{
    for (let checkbox of document.getElementById('DOIs').getElementsByTagName('input'))
    {
        if (checkbox.checked)
        {
            doi_to_link(checkbox.value,'lib-gen').then((link_from_doi)=>chrome.runtime.sendMessage({"CreateTab": link_from_doi}));
        }
    }
}


function open_articles()
{
    for (let checkbox of document.getElementById('DOIs').getElementsByTagName('input'))
    {
        if (checkbox.checked)
        {
            chrome.runtime.sendMessage({"CreateTab": "https://dx.doi.org/"+checkbox.value})
        }
    }
}

async function get_doi_select_state(active_window_url, doi)
{
    let saved_doi_choices_storage = await get_storage("saved_doi_choices")
    let page_setting = get_dict_value(saved_doi_choices_storage, active_window_url, {})
    return get_dict_value(page_setting, doi, false)
}
