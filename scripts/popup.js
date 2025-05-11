document.addEventListener("DOMContentLoaded", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;
    const title = tab.title;
    const accessDate = new Date();
  
    const citationBox = document.getElementById("citation");
    const styleSelect = document.getElementById("style");
    const notesBox = document.getElementById("notes");
  
    function formatDateLong(date) {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    }
  
    function formatDateAPA(date) {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    }
  
    function extractHostname(url) {
      return new URL(url).hostname.replace("www.", "");
    }
  
    function getWebsiteName(url) {
      const hostname = extractHostname(url);
      return hostname.split(".")[0].charAt(0).toUpperCase() + hostname.split(".")[0].slice(1);
    }
  
    function generateCitation(style) {
      const website = getWebsiteName(url);
  
      if (style === "mla") {
        return `"${title}." *${website}*, ${url}. Accessed ${formatDateLong(accessDate)}.`;
      } else if (style === "apa") {
        return `${title}. (${formatDateAPA(accessDate)}). *${website}*. ${url}`;
      }
      return "";
    }
  
    function updateCitation() {
      citationBox.textContent = generateCitation(styleSelect.value);
    }
  
    updateCitation();
    styleSelect.addEventListener("change", updateCitation);
  
    chrome.storage.sync.get([url], (result) => {
      notesBox.value = result[url] || "";
    });
  
    document.getElementById("save").addEventListener("click", () => {
      const note = notesBox.value;
      chrome.storage.sync.set({ [url]: note }, () => {
        alert("Note saved!");
      });
    });
  });
  