
// async wrapping for chrome.storage.sync.set
const set_storage = async function (obj)
{
    return new Promise((resolve, reject) =>
                       {
                           try
                           {
                               chrome.storage.sync.set(obj,
                                                        function ()
                                                        {
                                                            resolve();
                                                        });
                           }
                           catch (ex)
                           {
                               reject(ex);
                           }
                       });
};

// async wrapping for chrome.storage.sync.get
const get_storage = async function (key,default_value=undefined)
{
    return new Promise((resolve, reject) =>
                       {
                           try
                           {
                               chrome.storage.sync.get(key,
                                                       function (value)
                                                       {
                                                           if (value[key]!==undefined)
                                                           {
                                                               resolve(value[key]);
                                                           }
                                                           else if (key===null)
                                                           {
                                                               resolve(value)
                                                           }
                                                           else
                                                           {
                                                               resolve(default_value)
                                                           }
                                                       });
                           }
                           catch (ex)
                           {
                               reject(ex);
                           }
                       });
};

// async wrapping for chrome.storage.sync.remove
const remove_storage = async function (key_or_keys)
{
    return new Promise((resolve, reject) =>
                       {
                           try
                           {
                               chrome.storage.sync.remove(key_or_keys,
                                                           function ()
                                                           {
                                                               resolve();
                                                           });
                           }
                           catch (ex)
                           {
                               reject(ex);
                           }
                       });
};

function is_valid_text_node(node)
{
    if (node.nodeType === 3 &&
        node.parentElement.tagName.toLowerCase() !== 'script' &&
        node.textContent.trim())
    {
        return true
    }
    else
        return false
}

async function get_page_DOIs(url)
{
    console.log("Storage content:",await get_storage(null))
    console.log('Querying:',url)
    return await get_storage(url,[])
}

function remove_tailing_dot(text)
{
    while (text[text.length-1]==='.')
    {
        text = text.substr(0,text.length-1)
    }
    return text
}

function replace_text_node_with_dom_obj(text_node,search_text,dom_obj)
{
    let text_content = text_node.nodeValue
    let first_split_pos = text_content.search(search_text)
    if (first_split_pos!==-1)
    {
        let second_node = text_node.splitText(first_split_pos+search_text.length)
        text_node.parentElement.insertBefore(dom_obj,second_node)
        replace_text_node_with_dom_obj(second_node,search_text,dom_obj)
    }
}

function is_URL(text)
{
    try
    {
        new URL(text)
        return true
    }
    catch (e)
    {
        if (!e.message.trim().startsWith("Failed to construct 'URL': Invalid URL"))
        {
            console.log("Unknown error happened",e,text)
        }
        else
        {
            //pass
        }
        return false
    }
}

// find DOI from string
function match_doi(text)
{
    try
    {
        if (!text.trim().startsWith('#') &&
            !text.trim().startsWith('.'))
            text = decodeURIComponent(text)
    }
    catch (e)
    {
        //console.log("ERROR IGNORED (This is normal if the URL is weird):",e,text)
    }

    //匹配：
    // https://doi.org/10.1002/anie.202105092
    // 10.1021/acs.orglett.5b00297
    // 对wiley的特殊情况：https://doi.org/10.1002/1521-3773(20001117)39:22<3964::AID-ANIE3964>3.0.CO;2-C
    // 行文中的情况：《自然•化学》(Nature Chemistry, 2021, DOI: 10.1038/s41557-021-00778-z)。近日，2021年诺贝尔化学奖颁给了德国化学家本杰明·利斯特（Benjamin List），以及美国
    // 排除多余文字如"(blabla, DOI: 10.1021/acs.orglett.5b00297)"不要把括号吃进去
    // 排除中文字符和中文标点
    // 只有10.1002允许有括号
    // 括号必须在10.开头之后左右匹配
    //
    // 特殊情况举例：
    // https://chem.xmu.edu.cn/xwdt/kyzc.htm；
    // https://chem.xmu.edu.cn/info/1274/11287.htm；
    let doi_reg_all = RegExp(/(10(?:\.\d+)+(?:\/[^\s&\"\/]+)+)/g)

    if (text.search('10.') !== -1 && doi_reg_all.test(text))
    {
        let re_ret = text.match(doi_reg_all)
        if (re_ret)
        {
            let matched_doi = re_ret[0]
            matched_doi = matched_doi.split(/[^\x00-\x7F]/g,1)[0]
            // 如果不是wiley的，不允许出现括号
            if ((!matched_doi.startsWith('10.1002')) && (!matched_doi.startsWith('10.1016')))
            {
                matched_doi = matched_doi.split(/[()]/g,1)[0]
            }
            // 如果是10.1002开头或10.1016开头，自左向右匹配，直到第一个无左括号的右括号
            else
            {
                let cut = 0
                let matching_status = 0
                while(cut<matched_doi.length)
                {
                    if (matched_doi[cut]=='(')
                    {
                        matching_status++
                    }
                    if (matched_doi[cut]==')')
                    {
                        matching_status--
                    }
                    if (matching_status<0)
                    {
                        break
                    }
                    cut++
                }
                matched_doi = matched_doi.substr(0,cut)
            }
            // 10.1055会出现自己在doi后面加个pdf的情况
            // dx.doi.org/10.1055/s-1997-1294 中会识别到 10.1055/s-1997-1294.pdf
            if (matched_doi.startsWith('10.1055'))
            {
                if (matched_doi.endsWith('.pdf'))
                {
                    matched_doi = matched_doi.substring(0,matched_doi.length-4)
                }
            }

            return remove_tailing_dot(matched_doi)
        }
    }

    // 为nature特意写一条，因为nature文章上半页生成不了链接
    // https://www.nature.com/articles/s41586-021-03878-5.pdf ==> 10.1038/s41586-021-03878-5
    // https://wayf.springernature.com/?redirect_uri=https://www.nature.com/articles/nchem.110 ==> 10.1038/nchem.110
    if (text.search("nature.com")!==-1)
    {
        let nature_doi_reg = RegExp(/articles\/([^\s&\/]+)/g)
        let re_ret = nature_doi_reg.exec(text)
        if (re_ret)
        {
            let matched_doi = "10.1038/"+re_ret[1]
            if (matched_doi.endsWith('.pdf'))
                matched_doi = matched_doi.substr(0,matched_doi.length-4)
            console.log(matched_doi)
            return remove_tailing_dot(matched_doi)
        }
    }

    // ChemComm的特殊链接 http://xlink.rsc.org/?DOI=C6CC05568K
    if (is_URL(text))
    {
        let url_object = new URL(text)
        if (url_object.host.endsWith("rsc.org"))
        {
            let doi = url_object.searchParams.get('DOI')
            if (doi)
            {
                return "10.1039/"+doi
            }
        }
    }
}

// Test situations for the doi matching function
function test_match_doi_function()
{
    let test_cases = ['hahaha',
                      '10.1021/acs.orglett.5b00297',
                      '哈哈哈https://doi.org/10.1002/anie.202105092',
                      '哈哈哈https://doi.org/10.1002/anie.202105092)',
                      'https://doi.org/10.1002/anie.202105092',
                      '10.1002/1521-3773(20001117)39:22<3964::AID-ANIE3964>3.0.CO;2-C',
                      'https://doi.org/10.1002/1521-3773(20001117)39:22<3964::AID-ANIE3964>3.0.CO;2-C',
                      '对wiley的特殊情况：https://doi.org/10.1002/1521-3773(20001117)39:22<3964::AID-ANIE3964>3.0.CO;2-C',
                      '对wiley的特殊情况：https://doi.org/10.1002/1521-3773(20001117)39:22<3964::AID-ANIE3964>3.0.CO;2-C)',
                      '《自然•化学》(Nature Chemistry, 2021, DOI: 10.1038/s41557-021-00778-z)。近日，2021年诺贝尔化学奖颁给了德国化学家本杰明·利斯特（Benjamin List），以及美国',
                      "(blabla, DOI: 10.1021/acs.orglett.5b00297)",
                      "DOI: 10.1021/acs.orglett.5b00297）",
                      'http://xlink.rsc.org/?DOI=C6CC05568K',
                      "https://lls.reaxys.com/xflink?aulast=Xu&title=Bioorganic%20and%20Medicinal%20Chemistry%20Letters&volume=29&issue=19&spage=&date=2019&coden=BMCLE&doi=10.1016%2Fj.bmcl.2019.126630&issn=1464-3405",
                      "https://www.thieme-connect.de/products/ejournals/pdf/10.1055/s-1997-1294.pdf"]

    let answers = [undefined,
                   "10.1021/acs.orglett.5b00297",
                   "10.1002/anie.202105092",
                   "10.1002/anie.202105092",
                   "10.1002/anie.202105092",
                   "10.1002/1521-3773(20001117)39:22<3964::AID-ANIE3964>3.0.CO;2-C",
                   "10.1002/1521-3773(20001117)39:22<3964::AID-ANIE3964>3.0.CO;2-C",
                   "10.1002/1521-3773(20001117)39:22<3964::AID-ANIE3964>3.0.CO;2-C",
                   "10.1002/1521-3773(20001117)39:22<3964::AID-ANIE3964>3.0.CO;2-C",
                   "10.1038/s41557-021-00778-z",
                   "10.1021/acs.orglett.5b00297",
                   "10.1021/acs.orglett.5b00297",
                   "10.1039/C6CC05568K",
                   "10.1016/j.bmcl.2019.126630",
                   "10.1055/s-1997-1294"]

    console.log("-----------Test start-----------")
    for (let i=0;i<test_cases.length;i++)
    {
        let test_case = test_cases[i]
        let answer = answers[i]
        if (match_doi(test_case)===answer)
            console.log("PASS")
        else
            console.log('FAIL',test_case,match_doi(test_case),answer)
    }
    console.log("-----------Test end-----------")
}

// test_match_doi_function()

function get_dict_value(dict,key,def)
{
    if (dict && key in dict)
    {
        return dict[key]
    }
    else
    {
        return def
    }
}

// convert DOI to sci-hub or lib-gen download links using the user-set link template in popup.html
async function doi_to_link(doi,override_choice = false)
{
    let settings_storage = await get_storage('settings')
    let template = ""
    let site_choice = undefined

    if (!override_choice)
        site_choice = settings_storage["pdf_link_radio_choice"]
    else
        site_choice = override_choice

    if (site_choice === 'sci-hub')
        template =  settings_storage["scihub_link"]
    else
        template =  settings_storage["libgen_link"]

    let regex = new RegExp(/[<>:"\/\\|?*%]/,'g')
    let download_filename = doi.replace(regex, '_') + '.pdf'
    let ret = template.replace(/\[DOI\]/g,doi).replace(/\[DOI_FILENAME\]/g,download_filename)
    return ret
}

// test whether current page is already sci-hub or lib-gen download page (used as icons will not be created in these pages)
const already_is_download_page = async function()
{
    let settings_storage = await get_storage('settings')
    let sci_hub_url = settings_storage["scihub_link"]
    let lib_gen_url = settings_storage["libgen_link"]

    //如果是Lib-Gen或者Sci-Hub的下载页，不再创建链接按钮
    let current_page_url = window.location.href
    if (current_page_url.startsWith(lib_gen_url.split(/[\[\]\?]/g)[0]))
    {
        return true
    }
    if (current_page_url.startsWith(sci_hub_url.split(/[\[\]\?]/g)[0]))
    {
        return true
    }
}

// create the green download icon, the icon will have the link, but what's actually effective is the onclick function
// this way, the new tab will not be focused, to avoid tab switching.
const create_download_icon = async function(doi)
{
    let a = document.createElement("a");
    let download_button_img_src = chrome.runtime.getURL("images/Download_button.png")
    let download_button_hover_img_src=chrome.runtime.getURL("images/Download_button_hover.png")
    let download_button_pressed_img_src=chrome.runtime.getURL("images/Download_button_pressed.png")
    let link_from_doi = await doi_to_link(doi)
    a.setAttribute('href',link_from_doi)
    let img = document.createElement("img");
    img.setAttribute("src", download_button_img_src)
    img.onmouseover = function(){
        this.src=download_button_hover_img_src
    }
    img.onmouseout = function(){
        this.src=download_button_img_src
    }
    img.onmousedown = function()
    {
        this.src=download_button_pressed_img_src
    }
    img.onmouseup = function()
    {
        this.src=download_button_hover_img_src
    }
    a.setAttribute('target',"_blank")
    img.setAttribute('style',"height:15px;width:20.5px")
    a.appendChild(img)
    a.classList.add('LYH_download_icon')
    a.onclick = function() {
        chrome.runtime.sendMessage({"CreateTab": link_from_doi});
        return false;
    }
    return a
}


const open_libgen_from_DOI = async function(doi)
{
    location.replace(await doi_to_link(doi,'lib-gen'))
}

const open_scihub_from_DOI = async function(doi)
{
    location.replace(await doi_to_link(doi,'sci-hub'))
}

const open_scihub_from_libgen_error = async function()
{
    await open_scihub_from_DOI(match_doi(window.location.href),'lib-gen')
}

async function set_bkg_settings(key, value)
{
    let settings_storage = await get_storage("settings")
    settings_storage[key] = value
    await set_storage({settings:settings_storage})
    //console.log("Setting change required:", key, value)
}

async function get_bkg_settings(key)
{
    let settings_storage = await get_storage("settings")
    return settings_storage[key]
}

// get the active tab URL, used in popup and background js
function getCurrentTabUrl(callback)
{
    chrome.tabs.query({active: true, currentWindow: true},
                      function (tabs)
                      {
                          let tab = tabs[0];
                          let url = tab.url;
                          callback(url);
                      }
    );
}

// filter through doi containing each other
// e.g. remove 10.1021/acs.orglett.5b00297/suppl_file/ol5b00297_si_001.pdf if 10.1021/acs.orglett.5b00297 existed
// while 10.1021/acs.orglett.5b002 should be kept even if 10.1021/acs.orglett.5b00 existed
function redundant_doi(DOI1,DOI2)
{
    let char_to_test = ["/"]

    if (DOI1===DOI2)
        return false

    for (let char of char_to_test)
    {
        if (DOI2.startsWith(DOI1+char))
        {
            return DOI2
        }
        if (DOI1.startsWith(DOI2+char))
        {
            return DOI1
        }
    }
    return false
}


// filter through doi containing extra pieces
// e.g. remove the #xxx part in 10.1021/acs.orglett.5b00297#title if 10.1021/acs.orglett.5b00297 existed
// while 10.1021/acs.orglett.5b00297#title should be kept if 10.1021/acs.orglett.5b00297 doesn't exist
// return a 2-tuple, everywhere the tuple[0] is recognized as DOI, it should be replaced with tuple[1]
function need_to_replace_doi(DOI1,DOI2)
{
    let char_to_test = ['?',"&",'#']

    if (DOI1===DOI2)
        return false

    for (let char of char_to_test)
    {
        if (DOI2.startsWith(DOI1+char))
        {
            return [DOI2,DOI1]
        }
        if (DOI1.startsWith(DOI2+char))
        {
            return [DOI1,DOI2]
        }
    }
    return false
}


// listen to x-mol opening request from shortcut call, then open the x-mol page, this will save the hassle to obtain the selected text of the active tab from the background or popup page
function x_mol_request_listener(request, sender, sendResponse)
{
    // console.log(request,'heard from message')
    if ("x_mol_search" in request)
    {
        // console.log('x-mol search request received from shortcut')
        chrome.runtime.sendMessage({"CreateTab": "https://www.x-mol.com/q?option=" + window.getSelection().toString()});
    }
}

