
var queryInfo = {active: true, currentWindow: true};

function getCurrentTabUrl(callback) {

    chrome.tabs.query(queryInfo, function(tabs) {
        var tab = tabs[0];
        var url = tab.url;
        callback(url);
    });
}

function get_dict_value(dict,key,def)
{
    if (key in dict)
    {
        return dict[key]
    }
    else
    {
        return def
    }
}

function set_bkg_settings(key, value)
{
    chrome.runtime.sendMessage(
        {set_setting: [key, value]}
    )
    console.log("Bkg setting change required:", key, value)
}

//
// function set_bkg_settings_if_not_exist(key, value)
// {
//     chrome.runtime.sendMessage(
//         {set_setting_if_not_exist: [key, value]}
//     )
//     console.log("Bkg setting change required:", key, value)
// }

let background_page = chrome.extension.getBackgroundPage()
var pdf_link_radio_choice = get_dict_value(background_page.settings, "pdf_link_radio_choice", 'sci-hub')
var scihub_link = get_dict_value(background_page.settings, "scihub_link", 'https://sci-hub.se/[DOI]')
var libgen_link = get_dict_value(background_page.settings, "libgen_link", 'http://libgen.li/scimag/ads.php?doi=[DOI]&downloadname=[DOI_FILENAME]')
document.getElementById('scihub_domain').value = scihub_link
document.getElementById('libgen_domain').value = libgen_link
if (pdf_link_radio_choice==='sci-hub')
{
    document.getElementById('scihub_radio').checked = true
}
else
{
    document.getElementById('libgen_radio').checked = true
}


document.getElementById("scihub_radio").addEventListener("click", scihub_radio_clicked);
document.getElementById("libgen_radio").addEventListener("click", libgen_radio_clicked);

function scihub_radio_clicked()
{
    set_bkg_settings("pdf_link_radio_choice", 'sci-hub')
}
function libgen_radio_clicked()
{
    set_bkg_settings("pdf_link_radio_choice", 'lib-gen')
}

var libgen_text_lineEdit = document.getElementById("libgen_domain")
var scihub_text_lineEdit = document.getElementById("scihub_domain")

libgen_text_lineEdit.addEventListener('input', libgen_domain_changed);
libgen_text_lineEdit.addEventListener('propertychange', libgen_domain_changed);
scihub_text_lineEdit.addEventListener('input', scihub_domain_changed);
scihub_text_lineEdit.addEventListener('propertychange', scihub_domain_changed);

function libgen_domain_changed()
{
    set_bkg_settings("libgen_link", libgen_text_lineEdit.value)
}

function scihub_domain_changed()
{
    set_bkg_settings("scihub_link", scihub_text_lineEdit.value)
}

document.getElementById("hide_scihub_or_libgen").addEventListener("click", hide_scihub_or_libgen_clicked);

function hide_scihub_or_libgen_clicked()
{
    set_bkg_settings("hide_scihub_or_libgen", document.getElementById("hide_scihub_or_libgen").checked)
}

function doi_to_link(doi)
{
    let template = ""
    if (document.getElementById('scihub_radio').checked)
    {
        template =  scihub_text_lineEdit.value
    }
    else
    {
        template =  libgen_text_lineEdit.value
    }

    regex = new RegExp(/[<>:"\/\\|?*%]/,'g')
    let download_filename = doi.replace(regex, '_') + '.pdf'
    return template.replace(/\[DOI\]/g,doi).replace(/\[DOI_FILENAME\]/g,download_filename)
}

const get_doi_select_state = function (active_window_url,doi)
{
    let background_page_window = chrome.extension.getBackgroundPage()
    let page_setting = get_dict_value(background_page_window.saved_doi_choices, active_window_url, {})
    let ret = get_dict_value(page_setting,doi,false)
    return ret
}

function renderURL(active_window_url) {

    let scihub_domain = new URL(scihub_link.split('[')[0])
    document.getElementById('Sci_HUB_this_page').addEventListener('click',function ()
        {
            let url_processing = new URL(active_window_url)
            url_processing.hostname = url_processing.hostname+'.'+scihub_domain.hostname
            let url_processing_link = document.createElement('a');
            url_processing_link.href = url_processing.href;
            chrome.runtime.sendMessage({"CreateTab":url_processing.href});
            url_processing_link.click();
        })


    let background_page_window = chrome.extension.getBackgroundPage()
    if (active_window_url in background_page_window.page_DOIs)
    {
        for (doi of background_page_window.page_DOIs[active_window_url])
        {
            let input = document.createElement('input')
            input.type = 'checkbox'
            input.value = doi
            input.id = doi
            input.checked=get_doi_select_state(active_window_url,doi)
            input.addEventListener("change", (event)=>
                {
                    state = event.currentTarget.checked
                    doi = event.currentTarget.id
                    chrome.runtime.sendMessage({save_doi_choice: [active_window_url,doi,state]})
                    console.log("save_doi_choice required:", active_window_url,doi,state)
                })

            let label = document.createElement('a')
            label.textContent = doi
            label.href = doi_to_link(doi)
            let br = document.createElement('br')
            document.getElementById('DOIs').appendChild(input)
            document.getElementById('DOIs').appendChild(label)
            document.getElementById('DOIs').appendChild(br)
        }
    }
}



document.addEventListener('DOMContentLoaded', function() {
    getCurrentTabUrl(function(url) {
        renderURL(url);
    });
});


function select_all()
{
    for (checkbox of document.getElementById('DOIs').getElementsByTagName('input'))
    {
        checkbox.checked = true;
    }
}
function select_none()
{
    for (checkbox of document.getElementById('DOIs').getElementsByTagName('input'))
    {
        checkbox.checked = false;
    }
}

function toggle_all()
{
    for (checkbox of document.getElementById('DOIs').getElementsByTagName('input'))
    {
        checkbox.checked = !checkbox.checked;
    }
}

function launch()
{
    for (checkbox of document.getElementById('DOIs').getElementsByTagName('input'))
    {
        if (checkbox.checked)
        {
            // console.log(checkbox.value)
            // console.log(doi_to_link(checkbox.value))
            chrome.tabs.create({url: doi_to_link(checkbox.value)});
            // window.open(doi_to_link(checkbox.value), '_blank');
        }
    }
}

document.getElementById("select_all").addEventListener("click", select_all, false);
document.getElementById("select_none").addEventListener("click", select_none, false);
document.getElementById("toggle_all").addEventListener("click", toggle_all, false);
document.getElementById("launch").addEventListener("click", launch, false);
