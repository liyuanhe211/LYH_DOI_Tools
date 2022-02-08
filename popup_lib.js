
document.getElementById("libgen_domain").addEventListener('input', libgen_domain_changed);
document.getElementById("libgen_domain").addEventListener('propertychange', libgen_domain_changed);
document.getElementById("scihub_domain").addEventListener('input', scihub_domain_changed);
document.getElementById("scihub_domain").addEventListener('propertychange', scihub_domain_changed);
document.getElementById("select_all").addEventListener("click", select_all, false);
document.getElementById("select_none").addEventListener("click", select_none, false);
document.getElementById("toggle_all").addEventListener("click", toggle_all, false);
document.getElementById("launch").addEventListener("click", batch_download_PDF, false);
document.getElementById("open_articles").addEventListener("click", batch_open_publisher_pages, false);
document.getElementById("scihub_radio").addEventListener("click", scihub_or_libgen_radio_clicked);
document.getElementById("libgen_radio").addEventListener("click", scihub_or_libgen_radio_clicked);
document.getElementById("auto_close_scihub_or_libgen").addEventListener("click", hide_scihub_or_libgen_clicked);
document.addEventListener('DOMContentLoaded', function ()
{
    getCurrentTabUrl(async function (url)
                     {
                         await add_doi_urls(url);
                     });
});


async function initialize()
{
    let pdf_link_radio_choice = await get_bkg_settings('pdf_link_radio_choice')
    if (pdf_link_radio_choice === 'sci-hub')
    {
        set_selectable_button("scihub_radio", true)
        set_selectable_button("libgen_radio", false)
        set_selectable_lineinput("scihub_domain",true)
        set_selectable_lineinput("libgen_domain",false)
    }
    else
    {
        set_selectable_button("scihub_radio", false)
        set_selectable_button("libgen_radio", true)
        set_selectable_lineinput("scihub_domain",false)
        set_selectable_lineinput("libgen_domain",true)
    }
    let hide_scihub_or_libgen = await get_bkg_settings('hide_scihub_or_libgen')
    set_selectable_button("auto_close_scihub_or_libgen",hide_scihub_or_libgen)
}

initialize()

function set_selectable_button(id,current_state)
{
    if (current_state)
    {
        document.getElementById(id).classList.remove('button_unchecked')
        document.getElementById(id).classList.add('button_checked')
    }
    else
    {
        document.getElementById(id).classList.remove('button_checked')
        document.getElementById(id).classList.add('button_unchecked')
    }
}


function set_selectable_lineinput(id,current_state)
{
    if (current_state)
    {
        document.getElementById(id).classList.remove('lineinput')
        document.getElementById(id).classList.add('lineinput_checked')
    }
    else
    {
        document.getElementById(id).classList.remove('lineinput_checked')
        document.getElementById(id).classList.add('lineinput')
    }
}

async function hide_scihub_or_libgen_clicked()
{
    let previous_setting = await get_bkg_settings('hide_scihub_or_libgen')
    let new_setting = !previous_setting
    await set_bkg_settings("hide_scihub_or_libgen", new_setting)
    set_selectable_button("auto_close_scihub_or_libgen",new_setting)
}

async function scihub_or_libgen_radio_clicked()
{
    let previous_setting = await get_bkg_settings('pdf_link_radio_choice')
    let new_setting = ""
    if (previous_setting === 'sci-hub')
    {
        new_setting = 'lib-gen'
        set_selectable_button("scihub_radio", false)
        set_selectable_button("libgen_radio", true)
        set_selectable_lineinput("scihub_domain",false)
        set_selectable_lineinput("libgen_domain",true)
    }
    else
    {
        new_setting = 'sci-hub'
        set_selectable_button("scihub_radio", true)
        set_selectable_button("libgen_radio", false)
        set_selectable_lineinput("scihub_domain",true)
        set_selectable_lineinput("libgen_domain",false)
    }
    await set_bkg_settings("pdf_link_radio_choice", new_setting)
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
    for (let checkbox of document.getElementById('DOI_links_cell').getElementsByTagName('input'))
    {
        checkbox.checked = true;
    }
}

function select_none()
{
    for (let checkbox of document.getElementById('DOI_links_cell').getElementsByTagName('input'))
    {
        checkbox.checked = false;
    }
}

function toggle_all()
{
    for (let checkbox of document.getElementById('DOI_links_cell').getElementsByTagName('input'))
    {
        checkbox.checked = !checkbox.checked;
    }
}

function batch_download_PDF()
{
    for (let checkbox of document.getElementById('DOI_links_cell').getElementsByTagName('input'))
    {
        if (checkbox.checked)
        {
            doi_to_link(checkbox.value,'lib-gen').then((link_from_doi)=>chrome.runtime.sendMessage({"CreateTab": link_from_doi}));
        }
    }
}


function batch_open_publisher_pages()
{
    for (let checkbox of document.getElementById('DOI_links_cell').getElementsByTagName('input'))
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

window.mouseDown = false;
document.onmousedown = function ()
{
    window.mouseDown = true;
}
document.onmouseup = function ()
{
    window.mouseDown = false;
}