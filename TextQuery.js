// document.getElementById('ACS_clean_up_button').addEventListener('click', function ()
// {
//     // clean up button
// })
//
//
// document.getElementById('submit_button').addEventListener('click', function ()
// {
//     // submit button
// })

// Add icon
// <link rel="shortcut icon" type="image/png" href="Link to the image"/>
let icon =  document.createElement("link");
icon.setAttribute('href',chrome.runtime.getURL('images/Icon128.png'))
icon.setAttribute('type','image/png')
icon.setAttribute('rel','shortcut icon')
document.getElementsByTagName('head')[0].appendChild(icon)

//-------------------------------------------------------------------------
// Remove junks
$("#back-to-site").hide()
// $("#back-to-site").hide()
$("p:contains(Members may also)").first().hide()
$("p:contains(We now provide space to match )").first().hide()
$("p:contains(To learn about other services and interfaces see our)").first().hide()
$("p:contains(if you have any questions)").first().hide()
$("li:contains(There should be no line breaks within an individual reference)").first().hide()
$("li:contains(To check the accuracy of a reference)").first().hide()
$("li:contains(You may use any reference style)").first().hide()
$("p:contains(Get persistent links for your reference list or bibliography)").first().hide()
$('[src*="blog-ad-stq-2019.png"]').hide()
document.getElementsByTagName('header')[0].style.height='0px'
document.getElementsByTagName('header')[0].style.paddingTop='0px'
$("td:contains(Enter text in the box below)").last().hide()

let text_area = document.getElementById('freetext')
if (text_area!==null)
{
    text_area.setAttribute('wrap', "soft")
    text_area.setAttribute('style', 'font-size: 14px;line-height:1.15')
    text_area.setAttribute('rows', "20")
    place_holder_text = `LYH-DOI-Tools modified CrossRef TextQuery.

Copy and paste the reference list here, tidy it up, get DOI and download links.
Works better if the references are in alphabetical order or presented as a numbered/alphabeted list.


Example:
Submit directly:
------
1. Boucher RC (2004) New concepts of the pathogenesis of cystic fibrosis lung disease. Eur Resp J 23: 146–158.
2. Knowles MR, Boucher RC (2002) Mucus clearance as a primary innate defense mechanism for mammalian airways. J Clin Investig 109: 571–577.
------

Needs to add line separation:
------
(e) Hu, Q. Y.; Rege, P. D.; Corey, E. J. Simple, Catalytic Enantioselective Syntheses of Estrone and Desogestrel. J. Am. Chem. Soc. 2004, 126, 5984−5986.
(3) (a) Jaeger, D. A.; Su, D.; Zafar, A.; Piknova, B.; Hall, S. B. Regioselectivity Control in Diels−Alder Reactions of Surfactant 1,3-Dienes with Surfactant Dienophiles. J. Am. Chem. Soc. 2000, 122, 2749−2757. (b) Mamaghani, M.; Alizadehnia, A. Enzyme Catalysed Kinetic Resolution of Racemic Methyl 3-acethylbicyclo [2.2.1] hept-5-ene-2-carboxylate using pig's liver esterase. J. Chem. Res. 2002, 386−387.
------
`
    text_area.setAttribute("placeholder",place_holder_text)
}



let submit_button = document.getElementsByName("submitButton")[0]
if (submit_button!==undefined)
    submit_button.setAttribute('style',"height: 30px; width: 120px; margin: 2px")


//-------------------------------------------------------------------------
// Add push buttons
let button_area = submit_button.parentElement
// A clean up button
// <input style="height: 27px; width: 100px" title="Click to clean up" class="mybutton buttontext" type="submit" name="cleanUpButton" id="ACS_clean_up_button"  value="Clean Up">
let ACS_clean_up_button = document.createElement("input");
ACS_clean_up_button.setAttribute('style',"height: 30; width: 120px; margin: 2px; text-align:center")
ACS_clean_up_button.setAttribute('id',"ACS_clean_up_button")
ACS_clean_up_button.setAttribute('value',"ACS Clean Up")
ACS_clean_up_button.onclick = ACS_clean_up
ACS_clean_up_button.classList.add("buttontext")
button_area.insertBefore(ACS_clean_up_button,submit_button)


let remove_returns_button = document.createElement("input");
remove_returns_button.setAttribute('style',"height: 30px; width: 120px; margin: 2px; text-align:center")
remove_returns_button.setAttribute('id',"remove_returns_button")
remove_returns_button.setAttribute('value',"Remove Returns")
remove_returns_button.onclick = remove_returns
remove_returns_button.classList.add("buttontext")
button_area.insertBefore(remove_returns_button,ACS_clean_up_button)


let returns_before_parathesis_button = document.createElement("input");
returns_before_parathesis_button.setAttribute('style',"height: 30; width: 120px; margin: 2px; text-align:center")
returns_before_parathesis_button.setAttribute('id',"returns_before_parathesis_button")
returns_before_parathesis_button.setAttribute('value',"Add \\n before (X)")
returns_before_parathesis_button.onclick = returns_before_parathesis
returns_before_parathesis_button.classList.add("buttontext")
button_area.insertBefore(returns_before_parathesis_button,ACS_clean_up_button)

function ACS_clean_up()
{
    remove_returns()
    returns_before_parathesis()
}


function remove_returns()
{
    let textarea_object = document.getElementById("freetext")
    let text = textarea_object.value
    // replace all new line characters
    text = text.replace(/(?:\r\n|\r|\n)/g, ' ');
    text = text.replace(/  /g, ' ').replace(/  /g, ' ')
    textarea_object.value = text
}

function returns_before_parathesis()
{
    let textarea_object = document.getElementById("freetext")
    let text = textarea_object.value
    // matches (1)-(299) (a)-(az) (A)-(AZ) while requiring it's followed by a non-digit character. And adds a new line before it.
    // e.g. matches:
    // "(5) (a) Northrup, A."
    // "(b) Ryu, D. H.; "
    // not match:
    // "J. Am. Chem. Soc. 2014, 136 (1), 4492–4495."
    //
    // Notes of regex pattern
    // (?!^) Does not match if it's the first character, to avoid add new lines at the start of query
    // ( capturing group
    //      (?:                                 Non capturing group
    //          \([12]{0,1}\d{1,2}\)            match (1)-(299)
    //      )
    //
    //      |                                  or
    //      (?:                                Non capturing group
    //          \([aA]{0,1}[a-zA-Z]\)          match (a)-(az) (A)-(AZ)
    //      )
    // )
    // ( ?= Non capturing group
    //      [., ]*                             Any number of meaningless characters
    //      [a-zA-Z(]                          followed by alphabets or parenthesis like (1) (a) ...
    // )
    text = text.replace(/(?!^)((?:\([12]{0,1}\d{1,2}\))|(?:\([aA]{0,1}[a-zA-Z]\)))(?=[., ]*[a-zA-Z(])/g,"\r\n\r\n$1")
    textarea_object.value = text
}