document.addEventListener("DOMContentLoaded", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;
    const title = tab.title;
    const accessDate = new Date();
  
    const citationBox = document.getElementById("citation");
    const styleSelect = document.getElementById("style");
    const notesBox = document.getElementById("notes");
  
    let authorName = "";
  
    function formatDateLong(date) {
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric"
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
  
      const overrides = {
        "williamsrecord.com": "The Williams Record",
        "nytimes.com": "The New York Times",
        "bbc.com": "BBC",
        // Add more overrides here
      };
  
      return overrides[hostname] || (
        hostname.split(".")[0].charAt(0).toUpperCase() + hostname.split(".")[0].slice(1)
      );
    }
  
    function toTitleCase(str) {
      return str
        .toLowerCase()
        .replace(/\w\S*/g, function (txt) {
          return txt.charAt(0).toUpperCase() + txt.slice(1);
        })
        .replace(/\b(A|An|The|And|But|Or|Nor|For|So|Of|On|In|To|With|At|By|From)\b/g, function (txt) {
          return txt.toLowerCase();
        });
    }
  
    function generateCitation(style) {
      const website = getWebsiteName(url);
      const domain = extractHostname(url);
      const formattedDate = formatDateLong(accessDate);
      const apaDate = formatDateAPA(accessDate);
      const cleanURL = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
      const formattedTitle = toTitleCase(title);
  
      const mlaAuthor = authorName ? `${authorName}. ` : "";
      const apaAuthor = authorName ? `${authorName}. ` : "";
  
      if (style === "mla") {
        return `${mlaAuthor}"${formattedTitle}." <em>${website}</em>, ${cleanURL}. Accessed ${formattedDate}.`;
      } else if (style === "apa") {
        return `${apaAuthor}${formattedTitle}. (${apaDate}). <em>${website}</em>. https://${domain}`;
      }
      return "";
    }
  
    function updateCitation() {
      citationBox.innerHTML = generateCitation(styleSelect.value);
    }
  
    // Extract <meta name="author">
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const meta = document.querySelector('meta[name="author"]');
        return meta ? meta.content : "";
      }
    }, (results) => {
      if (chrome.runtime.lastError || !results || !results[0]) {
        authorName = "";
      } else {
        authorName = results[0].result;
      }
      updateCitation();
    });
  
    // Handle style change
    styleSelect.addEventListener("change", updateCitation);
  
    // Load notes
    chrome.storage.sync.get([url], (result) => {
      notesBox.value = result[url] || "";
    });
  
    // Save notes
    document.getElementById("save").addEventListener("click", () => {
      const note = notesBox.value;
      chrome.storage.sync.set({ [url]: note }, () => {
        alert("Note saved!");
      });
    });
  
    // Tab switching
    const tabCitations = document.getElementById("tab-citations");
    const tabNotes = document.getElementById("tab-notes");
    const viewCitations = document.getElementById("citations-view");
    const viewNotes = document.getElementById("notes-view");
  
    tabCitations.addEventListener("click", () => {
      tabCitations.classList.add("active");
      tabNotes.classList.remove("active");
      viewCitations.style.display = "block";
      viewNotes.style.display = "none";
    });
  
    tabNotes.addEventListener("click", () => {
      tabNotes.classList.add("active");
      tabCitations.classList.remove("active");
      viewCitations.style.display = "none";
      viewNotes.style.display = "block";
    });
  });
  