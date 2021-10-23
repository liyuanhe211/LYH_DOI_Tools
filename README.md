# LYH DOI Tools
A Chrome extension to add Sci-HUB or Lib-Gen download icons to every DOI-link on the page, with various other small changes to make scientific paper downloading less annoying.

## Installation
Either load this folder as an unpacked extension in Chrome Developer Mode, or install the version from Chrome store (with a few days of review lag):
https://chrome.google.com/webstore/detail/LYH_DOI_Tools/khmjbohiflimlmijcimkbpmfglaijkic

## Features
 * [Add a download button to every DOI string or DOI link.](#1000)
 * [Directly download PDF from citation info from context menu or use the shortcut Ctrl+Shift+S.](#3000)
 * [Batch download PDFs for all DOI found in one page.](#4000)
 * [Jump unnecessary clicks to make smooth browsing experience:](#2000)
   * **Sci-Hub**: The `Open` button for Sci-Hub download.
   * **Lib-Gen**: The `GET` button for Lib-Gen download.
   * **Lib-Gen**: Auto refresh when `503 Service Temporarily Unavailable` is triggered due to download several files at once (very useful for download large batch of files).
   * **Wiley**: The `PDF` button in the STUPID Wiley ePDF page.
   * **x-mol.com**: The totally meaningless waiting period (a few seconds) before redirection when searching references on x-mol.com.
   * **Scifinder**: The need to click the single DOI link when opening `Other sources` on SciFinder.

## Detailed description
### Adds download icons
<a name="1000"></a>
It will add a green download button to every link or text object on the webpage (after it is loaded). The button will create a link to the corresponding page on sci-hub or lib-gen (set by the [popup window](#100)). For example: on the ACS page:
<p align="center"><kbd> <img src=https://user-images.githubusercontent.com/18537705/137039299-fcd0d68a-22de-4b58-bd52-1667628b85e4.jpg width=400 /></kbd>  <kbd> <img src=https://user-images.githubusercontent.com/18537705/137039332-146e4bf5-9037-47f0-8c0f-baf497467e4d.jpg width=400 /></kbd> </p>

On google search or blog posts:
<p align="center"><kbd> <img src=https://user-images.githubusercontent.com/18537705/137039310-ea51da1c-7797-47df-932f-f4650a9af493.jpg width=400 /></kbd>  <kbd> <img src=https://user-images.githubusercontent.com/18537705/137039425-f35adae2-6e9a-426d-9ee0-78084c1e87eb.png width=400 /></kbd>  </p>

##
### Jump unnecessary clicks
<a name="2000"></a>
It will also jump the unnecessary steps needed to download pdf on the Sci-Hub or Lib-Gen websites (saving a few clicks). Because of this, the corresponding pages will be hidden (switched to the previous tab), such that the only thing you need to do is wait 1~2 seconds, and a PDF download task will be opened (the tab-switching could be turned off in the [popup window](#100)).
<p align="center"><kbd> <img src=https://user-images.githubusercontent.com/18537705/137039324-2e04cb56-56aa-49d1-ad5c-7b7fa362e688.jpg width=400 /></kbd> <kbd><img src=https://user-images.githubusercontent.com/18537705/137039338-7d479a77-5ec2-4519-a5a0-afe4fff78c68.jpg width=400 /></kbd>  </p>

For this to work properly, you probably need to set the PDF download option of chrome (by opening chrome://settings/content/pdfDocuments) to "Download PDFs" instead of "Open PDFs in Chrome":
<p align="center"><kbd> <img src=https://user-images.githubusercontent.com/18537705/137435074-5980aee2-f9d6-44e4-a065-164a46bb8e67.png width=400 /></kbd> </p>

Similarly, it will jump a few other unnecessary steps on `Wiley`, `x-mol.com`, and `Scifinder`. (Hopefully) you won't notice what's missing.

##
### Citation search and download
<a name="3000"></a>
When you select a string containing text for one single reference (e.g. J. Am. Chem. Soc. 2013, 135(14), 5258), right-click, and select `Open and Download Selected Citation`, the corresponding page for the reference will be opened (powered by x-mol.com), with the file downloaded (powered by whichever site you selected). This function can also be called by selecting the text and press the shortcut Ctrl+Shift+S (Search). This makes it quite convenient for downloading many references with only ref info.
<p align="center"><kbd> <img src=https://user-images.githubusercontent.com/18537705/137510716-4964c0ae-d59b-49bc-91a5-52f1bf7ca905.png width=400 /></kbd> </p>

##
### The popup page and batch ref download
<a name="100"></a>
<a name="4000"></a>
In the popup window, there are a few options:
<p align="center"><kbd> <img src=https://user-images.githubusercontent.com/18537705/137781912-f4179fb6-b8cb-4b97-b964-b187d6a1067a.png width=400 /></kbd>  </p>

 * Choose whether to use Sci-Hub or Lib-Gen. This will affect the download button (refresh needed).
 * Set the Sci-Hub or Lib-Gen address, in case the domain has changed. `DOI` in the address will be replaced with the actual DOI, and  `DOI_FILENAME` will be replaced with a filename-friendly version of the DOI (but this may not work, depends on how the Lib-Gen itself works.
 * `Sci-Hub Current Page` will open the current page in Sci-Hub. (This is independent of DOI. It just adds ".sci-hub.xx" to the end of the current domain name.)
 * The last section lists all the DOIs found on the current page for batch download.
 * Be gentle with this function. Download too many papers at once could get you into the banned IP list on the Sci-Hub or Lib-Gen website.
 * Click `Open Article Pages` will open the selected DOIs with `dx.doi.org`; `Start PDF Downloads` will initiate PDF downloads from Lib-Gen.

## About Pirating Scientific Papers
Developing this tool doesn't mean I support the piracy of scientific papers, or that I'm against paid publication services (although I definitely believe it's way too overpriced, and that the reviewing duties should be appreciated financially). I personally already have legal access to (nearly) all the papers I need without Sci-Hub or Lib-Gen. However, the experience of downloading a paper is unacceptably tedious, varies from site to site, is unstable, and is poor in UI design. This is especially true for someone who lives off-campus. The purpose of writing this extension is to solely address the user experience problem, and instead of writing a script for every possible publisher (which frequently changes their site), I elect to use a unified approach (Sci-Hub and Lib-Gen). If one day, all publishers have a unified authentication process and have some kind of standard API for paper access, I'm happy to move away from pirate sites.

## Changelog
Current
 * Tidy up popup page.
 * Support drag-select in the batch download checkbox selection.
 * Removed unnecessary Sci-Hub and Lib-Gen jumps as the page-opening function has been migrated to background worker.

0.5 - 20211023
 * Bugfix: Forgot to set the shortcut to Mac version, causing a failed installation on Mac. This is corrected.

0.4 - 20211020
 * Moved the download button of text contents to directly after the doi text (i.e. can be in the middle of a paragraph, instead of the end of the text object).
 * Migrated to Manifest V3.
 * Tidy up code.
 * Deal with situations where DOI is appended with URL markers, like `10.1021/acs.orglett.5b00297#title`<a href="http://libgen.li/ads.php?doi=10.1021/acs.orglett.5b00297#title`&downloadname=10.1021_acs.orglett.5b00297#title`.pdf" target="_blank" class="LYH_download_icon"><img src="chrome-extension://jkbmdggbfmipfomnpaihcnkglffcoeak/images/Download_button.png" style="height:15px;"></a>.
 * Bugfix: Removed duplicate DOIs. For example, if `10.1021/acs.orglett.5b00297`<a href="http://libgen.li/ads.php?doi=10.1021/acs.orglett.5b00297`&downloadname=10.1021_acs.orglett.5b00297`.pdf" target="_blank" class="LYH_download_icon"><img src="chrome-extension://jkbmdggbfmipfomnpaihcnkglffcoeak/images/Download_button.png" style="height:15px;"></a> existed, remove `10.1021/acs.orglett.5b00297/suppl_file/ol5b00297_si_001.pdf` or `10.1021/acs.orglett.5b00297#title`<a href="http://libgen.li/ads.php?doi=10.1021/acs.orglett.5b00297#title`&downloadname=10.1021_acs.orglett.5b00297#title`.pdf" target="_blank" class="LYH_download_icon"><img src="chrome-extension://jkbmdggbfmipfomnpaihcnkglffcoeak/images/Download_button.png" style="height:15px;"></a> like on [this page](https://www.google.com/search?q=oxazaborolinine).

0.3 - 20211015
 * Context menu (or Ctrl+Shift+S) to directly download PDF from citation info.
 * Bugfix: Corrected the bug caused by in-line parentheses and in-line dot, for example, in the text "(Angew. Chem. Int. Ed., DOI: 10.1002/anie.202010431).", the DOI used to be recognized as "10.1002/anie.202010431)." Now only `10.1002` (Wiley) or `10.1016` DOI is allowed to have parentheses (as they will have stupid DOIs like [this](https://onlinelibrary.wiley.com/doi/10.1002/1521-3773%2820001117%2939%3A22%3C3964%3A%3AAID-ANIE3964%3E3.0.CO%3B2-C)), and the parentheses have to be paired. All non-ASCII characters are also not allowed.
 * Added the option to not "Auto hide Sci-Hub or Lib-Gen page".
 * Jump unnecessary waiting for redirection for x-mol.com.
 * The batch download buttons will be hidden if no DOI is found on the page.
 * Prevent page swapping in the first place by using the onClick function and the messaging system.
 * Recognize links on Nature pages.
 * Bugfix: Decode URI before recognization.
 * New required permission: contextMenu, storage.

0.2 - 20211014
 * If Lib-Gen returns "file not found in DB", a page from Sci-Hub with the same DOI will be opened.
 * The tab-switching will be inhibited if the current page is not Lib-Gen, Sci-Hub, or SciFinder "Other Sources" page.
 * Bugfix where the download button becomes very large in some pages caused by CSS override like [this page](https://www.science.org/content/blog-post/maoecrystal-v-you-poor-people；https://www.sciencedirect.com/science/article/pii/S095741661730441X).
 * Removed from todo list: Switch away from Lib-Gen or Sci-Hub after displaying the download message.
 * Removed from todo list: Refresh page after switching download option.

## Todo
 * Some of the [x-mol return pages](https://www.x-mol.com/q?option=Chemical%20Communications%202017,%2053%20(45)%20,%206054) doesn't directly give a DOI link, causing the automatic jump function could not be executed. * Changing the Lib-Gen page icon to reflect download status.
 * Automatic update of usable Sci-Hub domains.
 * Recognize potential ref info by a trial call to x-mol.com.
 * Add a manual input in the popup.html (probably by create a fake page?) to use the functions of this extention on texts copied from offline contents.
 * Potentially Move `tabs` permission to `activeTabs` permission.
 * Make popup.html less ugly.
 * ~~Missing download icon on the doi text on [this page](https://onlinelibrary.wiley.com/doi/10.1002/1521-3773%2820001117%2939%3A22%3C3964%3A%3AAID-ANIE3964%3E3.0.CO%3B2-C)~~
 * Experiment with load-later features, and add download button to scifinder page.

## Known issues that will likely not to be addressed
 * Only one DOI is recognized in one bottom-level DOM object. This is both for convenience of programming and for stability. It's quite rare for one string to containing many DOIs without a link. For now, I do not plan to deal with it.
 * If in some case, there is a dot in the assigned DOI, it will be wrongly omiited. This is because it's quite rare for a doi to have a dot in it's end, but it's far more likely that someone writes and article, but puts an period after an doi.
 * By standard, Parenthesis (and other special characters) are allowed in a DOI number, but most publishers don't use it. To prevent DOI recognition been mixed with other text, which DOI is allowed to have parenthesis is dealt with in a white list manner. Now only 10.1002 (Wiley) and 10.1016 (Elsevier) are allowed to have it. So if other publishers also have parenthesis in their DOI, it will not be recognized correctly. If you found one, please submit an issue.

## Explanation of required permissions:
 * "tabs" permission: The extension needs to know the content and URL of the tabs to find DOIs, and to modify the content of the webpage to add download icons according to the found DOIs.
 * "storage" permission: To store settings like preferred sci-hub domain and other options.
 * "contextMenus" permission: Add a contextMenu item to access x-mol.com search engine.
 * ~~"scripting" permission: Used for the shortcut of calling x-mol.com search using Ctrl+Shift+S.~~
 * ~~"alarms" permission: Some of the objects are created later after page load has already finished, e.g. the "Other sources" button on the [Scifinder search reasult page](https://scifinder.cas.org/scifinder/view/scifinder/scifinderExplore.jsf). To address this, some function is run periodically to check if new objects are created. (If you know a batter way do deal with this, please share.)~~
