// Change this to your live production URL (e.g. "https://my-cf.vercel.app/") when you deploy your site!
const APP_URL = "https://upsolve-nine.vercel.app/";

chrome.action.onClicked.addListener((tab) => {
  // Check if we are actually on a Codeforces problem page
  if (tab.url && tab.url.includes("codeforces.com")) {
    console.log("Redirecting to CF Upsolve context...");
    const encodedUrl = encodeURIComponent(tab.url);
    const redirectUrl = `${APP_URL}?add=${encodedUrl}`;
    
    // Open the web app with the deep-link query parameter
    chrome.tabs.create({ url: redirectUrl });
  } else {
    // Provide some visual error feedback on the extension icon if they click it on a random website like Google
    chrome.action.setBadgeText({ text: "X", tabId: tab.id });
    chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
    setTimeout(() => {
      chrome.action.setBadgeText({ text: "", tabId: tab.id });
    }, 2000);
  }
});
