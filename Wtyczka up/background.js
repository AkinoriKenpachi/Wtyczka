chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed.");
});


const SUCCESS = "Successfully";
const SUCCESS_MSG = "The Result has been saved!";
const ERROR = "Error";
const ERROR_MSG = "The Result has not been saved!";

chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' });

function checkTabs(callback) {
  chrome.windows.getAll({ populate: true }, windows => {
    windows.forEach(window => {
      window.tabs.forEach(tab => {
        const tabInfo = {
          tabId: tab.id,
          windowId: tab.windowId,
          active: tab.active,
          url: tab.url
        };

        if (tab.url.includes('amazon.de')) {
          console.log("Found Amazon.de", tabInfo.tabId);
          chrome.storage.session.set({ 'tabAmazon': tabInfo.tabId, 'tabAmazonUrl': tabInfo.url });
          callback(tabInfo);
        }
        if (tab.url.includes('ersa.emea.intra.acer.com') || tab.url.includes('oeufr1rsaxmw1.emea.intra.acer.com')) {
          console.log("Found emea.com", tabInfo.tabId);
          chrome.storage.session.set({ 'Emea': tabInfo, 'tabEmea': tabInfo.tabId, 'tabEmeaUrl': tabInfo.url });
          callback(tabInfo);
        }
        if (tab.url.includes('blanccoCheck')) {
          console.log("Found Blanco", tabInfo.tabId);
          chrome.storage.session.set({ 'tabBlanco': tabInfo.tabId });
          callback(tabInfo);
        }
      });
    });
  });
}

function getActiveWindowId() {
  return new Promise((resolve, reject) => {
    chrome.windows.getCurrent((window) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(window.id);
      }
    });
  });
}

async function sendContentScriptMessage(tab) {
  try {
    const activeWindowId = await getActiveWindowId();
    const isWindow = (activeWindowId === tab.windowId);
    const isActive = tab.active;

    const tabs = await new Promise((resolve, reject) => {
      chrome.tabs.query({ active: isActive, currentWindow: isWindow }, (tabs) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(tabs);
        }
      });
    });

    const response = await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tab.tabId, { action: "run", tabDetails: tab }, (response) => {
        if (chrome.runtime.lastError) {			  		
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
    if (response && response.success) {
      if (tab.url.includes("amazon.de")) {
        console.log("Amazon message successfully processed.");
        handleAmazonResponse(response);
		return true;
      } else if (tab.url.includes("emea.intra.acer.com")) {
        console.log("Ersa message successfully processed.");
        handleErsaResponse(response);
		return true;
      }
    } else {
      console.log("No response from processed.", tab.url);
      if (chrome.runtime.lastError) {
        console.log("Error: the communication port was closed before a response was received.", tab.url);
      }
    }
  } catch (error) {
    console.log("Error in sendContentScriptMessage:", error,"page:", tab.url);
  }
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  try {
	  if (message.action === "getUrl") {
		 chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
			  let links = tabs[0].url;
			  sendResponse(links);
			});
		return true; // Will respond asynchronously.
	  }
	 
    if (sender.tab) {
      console.log("Message sent from tab ID:", sender.tab.id);
      console.log("The tab URL:", sender.tab.url);
    }

    if (message.action === "contentScriptReady") {
      checkTabs(function (tabInfo) {
        sendContentScriptMessage(tabInfo);
      });
    }

  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
});

async function handleErsaResponse(response) {
  if (response && response.success) {
    try {
      const data = await chrome.storage.session.get('updateBlanco');
      const options = await chrome.storage.sync.get({ function6Enabled: true });
	if(options.function6Enabled)
	{
      if (!data.updateBlanco) {
        const href = "http://chlugmw14/blanccoCheck/";
        chrome.tabs.create({ url: href });
        await chrome.storage.session.set({ 'updateBlanco': true });
      }
	  
	}
      console.log("Ersa message successfully processed.");
    } catch (error) {
      console.error('Error processing Ersa response:', error);
    }
  } else {
    console.log("No response from Ersa processed.");
    if (chrome.runtime.lastError) {
      console.log("Ersa error: communication port closed before a response was received.");
    }
  }
}

async function handleAmazonResponse(response) {
  if (response && response.success) {
    console.log("QTResult Received");
      try {
        const data = await chrome.storage.session.get('updateExecuted');
        if (!data.updateExecuted) {
          const LPN = JSON.parse(response.jsonData).LPN;
          const apiUrl = 'https://ersa.emea.intra.acer.com/WebServiceRest/API/GTResult';
          await handleApiRequest(apiUrl, response.jsonData, LPN);
        }
      } catch (e) {
        await chrome.storage.session.set({ updateExecuted: true });
        console.error('Error accessing storage or updating tab:', e);
      }
    }
}

async function handleApiRequest(apiUrl, jsonData, LPN) {
  try {
    const fetchResponse = await fetch(`${apiUrl}?GTResult=${encodeURIComponent(jsonData)}`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "text/plain"
      },
      mode: "cors"
    });
    if (fetchResponse.ok) {
      const responseData = await fetchResponse.text();
      await chrome.storage.session.set({ updateExecuted: true });
      const tabData = await chrome.storage.session.get('tabEmea');
      if (tabData && tabData.tabEmea) {
        await checkAndUpdateTab(LPN, tabData.tabEmea, jsonData.includes("Sell"));
      } else {
        console.error('tabEmea is not found in session storage');
      }
     responseStatus(responseData);
    } else {
      throw new Error('Network response was not ok');
    }
  } catch (error) {
    console.log('Fetch operation problem:', error);
    responseStatus('"ERROR"');
  }
}

async function checkAndUpdateTab(LPN, tabId, check) {
	
	/*
  const href = `https://ersa.emea.intra.acer.com/PLRC/SAMain.aspx?QuickSearch=${LPN}`;
  const newHref = `https://oeufr1rsaxmw1.emea.intra.acer.com/PLRC/SAMain.aspx?QuickSearch=${LPN}`;

  try {
    const fetchHrefResponse = await fetch(href);
    if (fetchHrefResponse.ok) {
      await chrome.storage.local.set({ caseLink: href });
     chrome.tabs.update(tabId, { url: href }, function() {
	 	if(check){
			chrome.tabs.update(tabId, { active: true });
		}
	});
    } else {
      throw new Error('First URL not reachable');
    }
  } catch (e) {
    console.log('First URL failed, trying second URL:', e);
    try {
      const fetchNewHrefResponse = await fetch(newHref);
      if (fetchNewHrefResponse.ok) {
        await chrome.storage.local.set({ caseLink: newHref });
        chrome.tabs.update(tabId, { url: newHref }, function() {
			if(check){
				chrome.tabs.update(tabId, { active: true });
			}
	});
      } else {
        console.log("Both servers are dead");
      }
    } catch (innerError) {
      console.log("Error checking second URL:", innerError);
    }
  }
  */
  console.log("TEST WIELKI");
	chrome.storage.local.get('sn', function(data) {
		var caseSNValue = data.sn || 'brak sn';
		console.log('Value loaded: ', caseSNValue);
		queue.enqueue(LPN+","+caseSNValue);
	});
	chrome.storage.local.remove(['sn'], function() {
		console.log('sn removed');
	});
    
}

chrome.storage.local.onChanged.addListener(async (changes) => {
  for (const key in changes) {
    if (key === 'backgroundBlobErsa') {
      const emea = await chrome.storage.session.get('Emea');
	  let tabId = emea.Emea.tabId;
      if (tabId) {
        chrome.tabs.sendMessage(tabId, { action: "setBg" });
      } else {
        console.error('tabEmea or tabEmea.tabId is undefined');
      }
    }
  }
});

function responseStatus(status) {
  if (status === '"OKAY"') {
    showNotification(SUCCESS, SUCCESS_MSG);
  } else if (status === '"ERROR"') {
    showNotification(ERROR, ERROR_MSG);
  }
}

function showNotification(title, message) {
  chrome.notifications.create('', {
    iconUrl: 'static/icon/icon.png',
    title: title,
    message: message,
    type: 'basic'
  });
}







class Queue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.loadQueue();
  }

  async loadQueue() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['queue'], (result) => {
        this.queue = result.queue || [];
        resolve();
      });
    });
  }

  async saveQueue() {
    return new Promise((resolve) => {
      chrome.storage.local.set({ queue: this.queue }, () => {
        resolve();
      });
    });
  }

  async enqueue(item) {
    this.queue.push(item);
    await this.saveQueue();
    this.processQueue();
  }

  async dequeue() {
    if (this.queue.length === 0) {
      return null;
    }
    const item = this.queue.shift();
    await this.saveQueue();
    return item;
  }

  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = await this.dequeue();
      await this.processItem(item);
    }

    this.isProcessing = false;
  }

  async processItem(caseData) {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true },async (tabs) => {
        if (tabs.length > 0) {
		  let eId = await chrome.storage.session.get('Emea');
          chrome.tabs.sendMessage(eId.Emea.tabId, { type: 'processCase', caseData }, (response) => {
            if (chrome.runtime.lastError) {
              console.error("Runtime error:", chrome.runtime.lastError.message);
              reject(new Error(chrome.runtime.lastError.message));
            } else if (response && response.result) {
              console.log("Processing response:", response.result);
              resolve(response.result);
            } else {
              console.error("No response received or error in response:", response);
              reject(new Error('No response received.'));
            }
          });
        } else {
          reject(new Error('No active tab found.'));
        }
      });
    });
  }
}

const queue = new Queue();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'enqueue') {
    console.log("Background received H3:", message.h3);
    queue.enqueue(message.h3);
    sendResponse({ status: "Enqueued successfully" });
  }
  return true; // Keep the message channel open for asynchronous response
});
