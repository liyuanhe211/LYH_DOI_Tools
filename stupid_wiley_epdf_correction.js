const new_link = window.location.href.replace("onlinelibrary.wiley.com/doi/pdf","onlinelibrary.wiley.com/doi/pdfdirect").replace("onlinelibrary.wiley.com/doi/epdf","onlinelibrary.wiley.com/doi/pdfdirect")
chrome.runtime.sendMessage({switch_to_previous_tab: window.location.href});

// let stupid_epdf_label = document.createElement('a')
let text = "LYH DOI Tools Extension Captured </br></br>"
text += 'PDF Download automatically initiated. The epdf is inhibited. </br></br>This page will (probably) self-destruct in 5 seconds...<br><br>'
text+= "You can close this tab now."
text = '<center><br><br><br><br><br><br><br><br><br><br><br><br><br>' + text + '</center>'
document.body.innerHTML = text

const link = document.createElement('a');
link.href = new_link;
link.click();


setTimeout(function ()
           {
               chrome.runtime.sendMessage({closeThis: true});
           },
           10000);