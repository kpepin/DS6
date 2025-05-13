document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab.url;
  const rawTitle = tab.title;
  const accessDate = new Date();

  const citationBox = document.getElementById("citation");
  const styleSelect = document.getElementById("style");
  const notesBox = document.getElementById("notes");
  const saveFeedback = document.getElementById("saveFeedback");

  let authorName = "";
  let publishDate = null;

  function extractHostname(url) {
    return new URL(url).hostname.replace("www.", "");
  }

  function getWebsiteName(url) {
    const hostname = extractHostname(url);
    const overrides = {
      "williamsrecord.com": "The Williams Record",
      "nytimes.com": "The New York Times",
      "bbc.com": "BBC",
      "theringer.com": "The Ringer"
    };
    return overrides[hostname] || (
      hostname.split(".")[0].charAt(0).toUpperCase() + hostname.split(".")[0].slice(1)
    );
  }

  function formatDateLong(date) {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  }

  function formatDateAPA(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  function toTitleCase(str) {
    const minorWords = new Set([
      "a", "an", "the", "and", "but", "or", "nor", "for", "so", "of",
      "on", "in", "to", "with", "at", "by", "from"
    ]);
    return str
      .split(" ")
      .map((word, index, arr) => {
        const isAllCaps = word === word.toUpperCase();
        const isMinor = minorWords.has(word.toLowerCase());
        const isFirstOrLast = index === 0 || index === arr.length - 1;
        if (isAllCaps) return word;
        if (isMinor && !isFirstOrLast) return word.toLowerCase();
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  }

  function toSentenceCase(str) {
    if (!str) return "";
    const cleaned = str
      .trim()
      .replace(/[-–|:.,;]+$/, "")
      .replace(/\s+/g, " ");
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  function cleanTitle(title, websiteName) {
    const patterns = [
      new RegExp(`\\s[–\\-|:]\\s${websiteName}$`, 'i'),
      new RegExp(`${websiteName}$`, 'i')
    ];
    for (let pattern of patterns) {
      if (pattern.test(title)) {
        return title.replace(pattern, "").trim();
      }
    }
    return title;
  }

  function formatAuthorAPA(name) {
    if (!name.includes(" ")) return name.replace(/\.+$/, "");
    const parts = name.trim().split(" ");
    const last = parts.pop().replace(/\.+$/, "");
    const initials = parts.map(n => n.charAt(0).toUpperCase() + ".").join(" ");
    return `${last}, ${initials}`.replace(/\.\./g, ".");
  }

  function formatAuthorMLA(name) {
    if (!name.includes(" ")) return name;
    const parts = name.trim().split(" ");
    const last = parts.pop();
    const first = parts.join(" ");
    return `${last}, ${first}`;
  }

  function generateCitation(style) {
    const website = getWebsiteName(url);
    const cleanURL = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
    const rawTitleCleaned = cleanTitle(rawTitle, website);
    const formattedMLADate = formatDateLong(accessDate);
    const formattedAPADate = publishDate ? formatDateAPA(publishDate) : formatDateAPA(accessDate);

    const mlaAuthor = authorName ? `${formatAuthorMLA(authorName)}. ` : "";
    const apaAuthor = authorName ? `${formatAuthorAPA(authorName)} ` : "";

    if (style === "mla") {
      const formattedTitle = toTitleCase(rawTitleCleaned).replace(/\.+$/, "");
      return `${mlaAuthor}"${formattedTitle}." <em>${website}</em>, ${cleanURL}. Accessed ${formattedMLADate}.`;
    } else if (style === "apa") {
      const formattedTitle = toSentenceCase(rawTitleCleaned);
      return `${apaAuthor}(${formattedAPADate}). ${formattedTitle}. <em>${website}</em>. ${url}`;
    }

    return "";
  }

  function updateCitation() {
    const style = styleSelect.value;
    const citation = generateCitation(style);
    citationBox.innerHTML = citation;

    if (style === "apa" && !publishDate) {
      citationBox.innerHTML += `<div style="color: red; font-size: 11px; margin-top: 4px;">
        Warning: No publication date found. Using access date instead.
      </div>`;
    }
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const getMeta = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.content : "";
      };

      let author = getMeta('meta[name="author"]');
      let publishedTime =
        getMeta('meta[property="article:published_time"]') ||
        getMeta('meta[name="date"]');

      return { author, publishedTime };
    }
  }, (results) => {
    if (results && results[0] && results[0].result) {
      const meta = results[0].result;
      authorName = meta.author || "";

      if (meta.publishedTime) {
        const parsed = new Date(meta.publishedTime);
        if (!isNaN(parsed)) publishDate = parsed;
      }
    }
    updateCitation();
  });

  styleSelect.addEventListener("change", updateCitation);

  chrome.storage.sync.get([url], (result) => {
    notesBox.value = result[url] || "";
  });

  document.getElementById("save").addEventListener("click", () => {
    const note = notesBox.value;
    chrome.storage.sync.set({ [url]: note }, () => {
      if (saveFeedback) {
        saveFeedback.style.display = "block";
        setTimeout(() => {
          saveFeedback.style.display = "none";
        }, 1200);
      }
    });
  });

  const copyButton = document.getElementById("copyCitation");
  const feedback = document.getElementById("copyFeedback");

  if (copyButton) {
    copyButton.addEventListener("click", () => {
      const temp = document.createElement("textarea");
      temp.value = citationBox.innerText;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      document.body.removeChild(temp);

      if (feedback) {
        feedback.style.display = "block";
        setTimeout(() => {
          feedback.style.display = "none";
        }, 1200);
      }
    });
  }

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

  // Dynamically adjust font size to match host page
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const body = document.body;
      const style = window.getComputedStyle(body);
      return style.fontSize;
    }
  }, (results) => {
    if (results && results[0] && results[0].result) {
      document.body.style.fontSize = results[0].result;
    }
  });
});
