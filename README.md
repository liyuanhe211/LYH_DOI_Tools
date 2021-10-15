# LYH DOI Tools
A Chrome extension to add Sci-HUB or Lib-Gen download icons to every DOI-link on the page, with various other small changes to make scientific paper downloading less annoying.

It will add a green download button to every link or text object on the webpage (after it is loaded). The button will create a link to the corresponding page on sci-hub or lib-gen (set by the [popup window](#100)).

For example: on the ACS page:
<p align="center"><kbd> <img src=https://user-images.githubusercontent.com/18537705/137039299-fcd0d68a-22de-4b58-bd52-1667628b85e4.jpg width=400 /></kbd>  <kbd> <img src=https://user-images.githubusercontent.com/18537705/137039332-146e4bf5-9037-47f0-8c0f-baf497467e4d.jpg width=400 /></kbd> </p>

On google search or blog posts:
<p align="center"><kbd> <img src=https://user-images.githubusercontent.com/18537705/137039310-ea51da1c-7797-47df-932f-f4650a9af493.jpg width=400 /></kbd>  <kbd> <img src=https://user-images.githubusercontent.com/18537705/137039425-f35adae2-6e9a-426d-9ee0-78084c1e87eb.png width=400 /></kbd>  </p>

It will also jump the unnecessary steps needed to download pdf on the Sci-Hub or Lib-Gen websites (saving a few clicks). Because of this, the corresponding pages will be hide (switched to previous tab), such that the only thing you need to do is wait 1~2 seconds, and a PDF download task will be opened (the tab-switching could be turned off in the [popup window](#100)).
<p align="center"><kbd> <img src=https://user-images.githubusercontent.com/18537705/137039324-2e04cb56-56aa-49d1-ad5c-7b7fa362e688.jpg width=400 /></kbd> <kbd><img src=https://user-images.githubusercontent.com/18537705/137039338-7d479a77-5ec2-4519-a5a0-afe4fff78c68.jpg width=400 /></kbd>  </p>

For this to work properly, you probably need to set the PDF download option of chrome (by opening chrome://settings/content/pdfDocuments) to "Download PDFs" instead of "Open PDFs in Chrome":
<p align="center"><kbd> <img src=https://user-images.githubusercontent.com/18537705/137435074-5980aee2-f9d6-44e4-a065-164a46bb8e67.png width=400 /></kbd> </p>

<a name="100"></a>
In the popup window, there are a few options:
<p align="center"><kbd> <img src=https://user-images.githubusercontent.com/18537705/137436027-9c7cd18d-ac59-4746-9d69-727e7b50b0b7.png width=400 /></kbd>  </p>

 * Choose whether to use Sci-Hub or Lib-Gen. This will affect the download button (refresh needed) or the batch download function below
 * Set the Sci-Hub or Lib-Gen address, in case the domain has changed. `DOI` in the address will be replaced with the actuall DOI, and  `DOI_FILENAME` will be replaced with a filename-friendly version of the DOI (but this may not work, depends on how the Lib-Gen itself works.
 * `Sci-Hub current` will open the current page in Sci-Hub. (This is independent of DOI. It just adds ".sci-hub.xx" to the end of current domain name.)
 * The last section lists all the DOIs found on the current page for batch download. Be gental with this function. Download too much papers at once could get you into the banned ip list on the Sci-Hub or Lib-Gen website.

