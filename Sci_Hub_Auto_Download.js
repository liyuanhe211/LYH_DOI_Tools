

async function main()
{
    let settings_storage = get_storage('settings')
    let hide_sci_hub = settings_storage["hide_scihub_or_libgen"]

    if (document.getElementById('pdf'))
    {
        if ('src' in document.getElementById('pdf'))
        {
            let pdf_link = document.getElementById('pdf')['src']
            // console.log("Download link:", pdf_link)
            let link_filename = pdf_link.split('/')
            link_filename = link_filename[link_filename.length - 1].split('#')[0]
            location.replace(pdf_link)
            if (hide_sci_hub)
            {

                let text = "<b>PDF download started by LYH DOI Tools... </b></br></br>"
                text += 'PDF file found: <b>[ ' + link_filename + ' ]</b><br><br>'
                text += 'This page will self-destruct in 10 seconds...<br><br>'
                text += 'Cancel this by unchecking the "Auto hide Sci-Hub or Lib-Gen page" option in the popup page<br><br>'
                document.getElementById('article').innerHTML = '<center><br><br><br><br><br><br><br>' + text + '</center>'

                // chrome.runtime.sendMessage({switch_to_previous_tab: window.location.href});
                setTimeout(function ()
                           {
                               chrome.runtime.sendMessage({closeThis: true});
                           },
                           10000);
            }
            else
            {
                let text = "<b>PDF download auto-started by LYH DOI Tools... </b></br></br>"
                text += 'PDF file found: <b>[ ' + link_filename + ' ]</b><br><br>'
                document.getElementById('article').innerHTML = '<center><br><br><br><br><br><br><br>' + text + '</center>'
            }

        }
        else
        {
            console.log("PDF file not found.")
        }
    }
    else
    {
        console.log("PDF file not found.")
    }

}

main()