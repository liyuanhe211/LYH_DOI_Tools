
let new_link = window.location.href.replace("onlinelibrary.wiley.com/doi/pdf","onlinelibrary.wiley.com/doi/pdfdirect")
new_link = new_link.replace("onlinelibrary.wiley.com/doi/epdf","onlinelibrary.wiley.com/doi/pdfdirect")
new_link = new_link.replace("pubs.acs.org/doi/epdf","pubs.acs.org/doi/pdf")
new_link = new_link.replace("www.science.org/doi/epdf","www.science.org/doi/pdf")
new_link = new_link.replace("royalsocietypublishing.org/doi/epdf","royalsocietypublishing.org/doi/pdf")
new_link = new_link.replace("www.chinesechemsoc.org/doi/epdf","www.chinesechemsoc.org/doi/pdf")
new_link = new_link.replace("www.pnas.org/doi/epdf","www.pnas.org/doi/pdf")
new_link = new_link.replace("journals.asm.org/doi/epub","journals.asm.org/doi/pdf")
new_link = new_link.replace("www.ahajournals.org/doi/epub","www.ahajournals.org/doi/pdf")


chrome.runtime.sendMessage({switch_to_previous_tab: window.location.href});

// let stupid_epdf_label = document.createElement('a')
let text = "<p style=\"font-size:20px\">The epdf feature is skipped by LYH DOI Tools extension.</br></br>PDF download started.</br></br>"
text += 'This page will self-destruct in 5 seconds...<br><br>'
text+= "You can close this tab now."
text = '<center><br><br><br><br><br><br><br><br><br><br><br><br><br>' + text + '</center></p>'
try
{
    document.body.innerHTML = text;
}
catch (e)
{

}

location.replace(new_link)
setTimeout(function ()
           {
               chrome.runtime.sendMessage({closeThis: true});
           },
           10000);
