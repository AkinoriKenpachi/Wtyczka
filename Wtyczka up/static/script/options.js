chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
	update();
  }
});
async function update() {
  const totalPointsElement = document.getElementById("totalPoints");
	if (totalPointsElement) {
		const today = new Date();
		const formattedToday = today.toISOString().split('T')[0].split('-').reverse().join('-');
		const data = await chrome.storage.local.get({ page: {} });
		let dateData = data.page[formattedToday] || { ok: 0, ber: 0, points: 0 };
		
		let yeld = ((dateData.ok / (dateData.ber + dateData.ok)) * 100).toFixed(2);
			totalPointsElement.innerText = `Day Points: ${dateData.points}   Day Yeld: ${yeld}%`;
	} 
}

document.addEventListener("DOMContentLoaded", function() {
  update();
  document.getElementById('OpenYeld').addEventListener('click', function() {
	 chrome.tabs.create({url: "static/web/yeld.html"});
  });

  loadOptions();
  update();
  document.getElementById('additionalInformation').addEventListener('change', saveOptions);
  document.getElementById('finalizeTabAlways').addEventListener('change', saveOptions);
  document.getElementById('autoEditClick').addEventListener('change', saveOptions);
  document.getElementById('autoPickUp').addEventListener('change', saveOptions);
  document.getElementById('autoCloseCase').addEventListener('change', saveOptions);
  document.getElementById('blanco').addEventListener('change', saveOptions);
  document.getElementById('skin').addEventListener('change', saveOptions); 
});

function loadOptions() {
  chrome.storage.sync.get({
    function1Enabled: true,
    function2Enabled: true,
    function3Enabled: true,
    function4Enabled: true,
    function5Enabled: true,
    function6Enabled: true,
    function8Enabled: true
  }, function(options) {
    document.getElementById('additionalInformation').checked = options.function1Enabled;
    document.getElementById('finalizeTabAlways').checked = options.function2Enabled;
    document.getElementById('autoEditClick').checked = options.function3Enabled;
    document.getElementById('autoPickUp').checked = options.function4Enabled;
    document.getElementById('autoCloseCase').checked = options.function5Enabled;
    document.getElementById('blanco').checked = options.function6Enabled;
    document.getElementById('skin').checked = options.function8Enabled;
  });
}

function saveOptions() {
  const options = {
    function1Enabled: document.getElementById('additionalInformation').checked,
    function2Enabled: document.getElementById('finalizeTabAlways').checked,
    function3Enabled: document.getElementById('autoEditClick').checked,
    function4Enabled: document.getElementById('autoPickUp').checked,
    function5Enabled: document.getElementById('autoCloseCase').checked,
    function6Enabled: document.getElementById('blanco').checked,
    function8Enabled: document.getElementById('skin').checked
  };
  chrome.storage.sync.set(options);
}
